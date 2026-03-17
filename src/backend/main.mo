import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // ── Types ──────────────────────────────────────────────────────────────────

  type EncryptedMessage = {
    id : Nat;
    from : Principal;
    to : Principal;
    messageType : MessageType;
    encryptedPayload : Blob;
    encryptedSymmetricKey : EncryptedKeyBytes;
    timestamp : Time.Time;
  };

  type MessageType = { #iso20022; #swift };
  type EncryptedKeyBytes = Blob;

  type UserProfile = {
    name : Text;
    publicKey : ?Blob;
  };

  type SyncStatus = {
    callerHasPublicKey : Bool;
    otherHasPublicKey : Bool;
    callerTrustsOther : Bool;
    otherTrustsCaller : Bool;
    isMutuallyTrusted : Bool;
  };

  type InviteCodeRecord = {
    code : Text;
    used : Bool;
  };

  // ── Hardcoded admin ────────────────────────────────────────────────────────

  let HARDCODED_ADMIN : Principal =
    Principal.fromText("lmmsf-dqn72-o5wi6-ab664-m7cwl-lejc3-nj6ys-ye6fs-jf3t4-prsqg-kae");

  // ── State ──────────────────────────────────────────────────────────────────

  let messages = Map.empty<Nat, EncryptedMessage>();
  var nextMessageId : Nat = 0;

  let trustedContacts = Map.empty<Principal, Set.Set<Principal>>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Invite system state (on-chain)
  let inviteCodes = Map.empty<Text, Bool>(); // code -> isUsed
  let approvedPrincipals = Map.empty<Principal, Bool>(); // principal -> true
  var codeCounter : Nat = 0;

  // ── Helpers ────────────────────────────────────────────────────────────────

  func isHardcodedAdmin(p : Principal) : Bool {
    p == HARDCODED_ADMIN
  };

  func isApproved(p : Principal) : Bool {
    if (isHardcodedAdmin(p)) return true;
    switch (approvedPrincipals.get(p)) {
      case (?_) true;
      case null false;
    };
  };

  func requireApproved(caller : Principal) {
    if (not isApproved(caller)) {
      Runtime.trap("Access denied: invite required");
    };
  };

  func requireAdmin(caller : Principal) {
    if (not isHardcodedAdmin(caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
  };

  let CHARS : [Char] = [
    'A','B','C','D','E','F','G','H','J','K','L','M',
    'N','P','Q','R','S','T','U','V','W','X','Y','Z',
    '2','3','4','5','6','7','8','9'
  ];

  func makeInviteCode() : Text {
    let t : Int = Time.now();
    let tNat : Nat = if (t > 0) { Int.abs(t) } else { codeCounter + 1 };
    var s : Nat = (codeCounter * 999983 + tNat % 999979) % 4294967296;
    codeCounter += 1;

    let pick = func() : Char {
      s := (s * 1664525 + 1013904223) % 4294967296;
      CHARS[s % 32]
    };

    let parts : [Char] = [
      pick(), pick(), pick(), pick(), '-',
      pick(), pick(), pick(), pick(), '-',
      pick(), pick(), pick(), pick()
    ];
    Text.fromIter(parts.vals())
  };

  func areMutuallyTrusted(a : Principal, b : Principal) : Bool {
    let aTrustsB = switch (trustedContacts.get(a)) {
      case null false;
      case (?s) s.contains(b);
    };
    let bTrustsA = switch (trustedContacts.get(b)) {
      case null false;
      case (?s) s.contains(a);
    };
    aTrustsB and bTrustsA
  };

  // ── Invite System ──────────────────────────────────────────────────────────

  /// Returns true if the caller is the hardcoded admin or has used a valid invite code.
  public query ({ caller }) func isCallerApproved() : async Bool {
    isApproved(caller)
  };

  /// Admin only: generate a new invite code and store it on-chain.
  public shared ({ caller }) func generateInviteCode() : async Text {
    requireAdmin(caller);
    let code = makeInviteCode();
    inviteCodes.add(code, false);
    code
  };

  /// Anyone: submit an invite code. If valid and unused, marks caller as approved.
  public shared ({ caller }) func submitInviteCode(code : Text) : async Bool {
    let trimmed = code;
    switch (inviteCodes.get(trimmed)) {
      case null {
        Runtime.trap("Invalid invite code");
      };
      case (?used) {
        if (used) {
          Runtime.trap("Invite code already used");
        };
        inviteCodes.add(trimmed, true);
        approvedPrincipals.add(caller, true);
        true
      };
    };
  };

  /// Admin only: list all invite codes with their used status.
  public query ({ caller }) func getInviteCodes() : async [InviteCodeRecord] {
    requireAdmin(caller);
    inviteCodes.entries().toArray().map(
      func((code, used)) : InviteCodeRecord { { code; used } }
    )
  };

  // ── User Profiles ──────────────────────────────────────────────────────────

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller)
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    requireAdmin(caller);
    userProfiles.get(user)
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    requireApproved(caller);
    userProfiles.add(caller, profile);
  };

  /// Returns the public key of a mutually trusted contact.
  public query ({ caller }) func getContactPublicKey(contact : Principal) : async ?Blob {
    requireApproved(caller);
    if (not areMutuallyTrusted(caller, contact)) {
      Runtime.trap("Can only fetch public key of mutually trusted contacts");
    };
    switch (userProfiles.get(contact)) {
      case null null;
      case (?profile) profile.publicKey;
    };
  };

  // ── Trust Contacts ─────────────────────────────────────────────────────────

  public shared ({ caller }) func addTrustedContact(user : Principal) : async () {
    requireApproved(caller);
    if (caller == user) Runtime.trap("Cannot add yourself as a trusted contact");
    switch (trustedContacts.get(caller)) {
      case null {
        trustedContacts.add(caller, Set.singleton(user));
      };
      case (?s) {
        s.add(user);
      };
    };
  };

  public shared ({ caller }) func removeTrustedContact(user : Principal) : async () {
    requireApproved(caller);
    switch (trustedContacts.get(caller)) {
      case null {};
      case (?s) { s.remove(user) };
    };
  };

  public query ({ caller }) func getTrustedContacts() : async [Principal] {
    switch (trustedContacts.get(caller)) {
      case null [];
      case (?s) s.toArray();
    };
  };

  public query ({ caller }) func isTrustedContact(user : Principal) : async Bool {
    switch (trustedContacts.get(caller)) {
      case null false;
      case (?s) s.contains(user);
    };
  };

  public query ({ caller }) func getRelationshipStatus(other : Principal) : async SyncStatus {
    let callerProfile = userProfiles.get(caller);
    let otherProfile = userProfiles.get(other);

    let callerHasPublicKey = switch (callerProfile) {
      case (?p) p.publicKey != null;
      case null false;
    };
    let otherHasPublicKey = switch (otherProfile) {
      case (?p) p.publicKey != null;
      case null false;
    };
    let callerTrustsOther = switch (trustedContacts.get(caller)) {
      case null false;
      case (?s) s.contains(other);
    };
    let otherTrustsCaller = switch (trustedContacts.get(other)) {
      case null false;
      case (?s) s.contains(caller);
    };
    {
      callerHasPublicKey;
      otherHasPublicKey;
      callerTrustsOther;
      otherTrustsCaller;
      isMutuallyTrusted = callerTrustsOther and otherTrustsCaller;
    }
  };

  // ── Messaging ──────────────────────────────────────────────────────────────

  public shared ({ caller }) func sendMessage(
    to : Principal,
    messageType : MessageType,
    encryptedPayload : Blob,
    encryptedSymmetricKey : EncryptedKeyBytes,
  ) : async Nat {
    requireApproved(caller);
    if (caller == to) Runtime.trap("Cannot send message to yourself");
    if (not areMutuallyTrusted(caller, to)) {
      Runtime.trap("Both users must have each other as trusted contacts");
    };
    let msg : EncryptedMessage = {
      id = nextMessageId;
      from = caller;
      to;
      messageType;
      encryptedPayload;
      encryptedSymmetricKey;
      timestamp = Time.now();
    };
    messages.add(nextMessageId, msg);
    nextMessageId += 1;
    msg.id
  };

  public query ({ caller }) func getAllMessagesForCaller() : async [EncryptedMessage] {
    messages.values().toArray().filter(
      func(m) { m.from == caller or m.to == caller }
    )
  };

  public query ({ caller }) func getMessageById(messageId : Nat) : async EncryptedMessage {
    let msg = switch (messages.get(messageId)) {
      case null Runtime.trap("Message not found");
      case (?m) m;
    };
    if (caller != msg.from and caller != msg.to) {
      Runtime.trap("Not authorized to fetch this message");
    };
    msg
  };
};
