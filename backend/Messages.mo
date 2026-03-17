import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Hash "mo:base/Hash";
import Bool "mo:base/Bool";

actor Messages {

  // =====================
  // TYPES
  // =====================

  type UserProfile = {
    principal : Principal;
    publicKey : Text;
    registeredAt : Int;
  };

  type ContactInfo = {
    principal : Principal;
    isMutual : Bool;
  };

  type RelationshipStatus = {
    callerAdded : Bool;
    otherAdded : Bool;
    isMutual : Bool;
  };

  type Message = {
    id : Nat;
    sender : Principal;
    recipient : Principal;
    encryptedPayload : Text;
    encryptedSymmetricKey : Text;
    timestamp : Int;
  };

  type InviteCode = {
    code : Text;
    used : Bool;
    usedBy : ?Principal;
  };

  // ICRC-1 Ledger interface
  type Account = { owner : Principal; subaccount : ?Blob };
  type TransferArg = {
    from_subaccount : ?Blob;
    to : Account;
    amount : Nat;
    fee : ?Nat;
    memo : ?Blob;
    created_at_time : ?Nat64;
  };
  type TransferResult = { #Ok : Nat; #Err : TransferError };
  type TransferError = {
    #BadFee : { expected_fee : Nat };
    #BadBurn : { min_burn_amount : Nat };
    #InsufficientFunds : { balance : Nat };
    #TooOld;
    #CreatedInFuture : { ledger_time : Nat64 };
    #Duplicate : { duplicate_of : Nat };
    #TemporarilyUnavailable;
    #GenericError : { error_code : Nat; message : Text };
  };
  type BalanceArg = { owner : Principal; subaccount : ?Blob };

  // =====================
  // CONSTANTS
  // =====================

  let ADMIN_PRINCIPAL : Text = "lmmsf-dqn72-o5wi6-ab664-m7cwl-lejc3-nj6ys-ye6fs-jf3t4-prsqg-kae";

  func isAdmin(p : Principal) : Bool {
    Principal.toText(p) == ADMIN_PRINCIPAL
  };

  // =====================
  // STATE
  // =====================

  var profiles = HashMap.HashMap<Principal, UserProfile>(16, Principal.equal, Principal.hash);
  var contacts = HashMap.HashMap<Principal, [Principal]>(16, Principal.equal, Principal.hash);
  var messages = Buffer.Buffer<Message>(64);
  var messageCounter : Nat = 0;
  var inviteCodes = HashMap.HashMap<Text, InviteCode>(16, Text.equal, Text.hash);

  // =====================
  // USER REGISTRATION
  // =====================

  public shared(msg) func registerUser(publicKey : Text) : async Text {
    let caller = msg.caller;
    if (Principal.isAnonymous(caller)) return "error:not_authenticated";
    // Admin bypasses invite check
    if (not isAdmin(caller)) {
      // Non-admin must use registerWithInvite
      return "error:invite_required";
    };
    let profile : UserProfile = {
      principal = caller;
      publicKey = publicKey;
      registeredAt = Time.now();
    };
    profiles.put(caller, profile);
    "ok"
  };

  public shared(msg) func registerWithInvite(publicKey : Text, inviteCode : Text) : async Text {
    let caller = msg.caller;
    if (Principal.isAnonymous(caller)) return "error:not_authenticated";
    // Admin can also use this path
    if (not isAdmin(caller)) {
      switch (inviteCodes.get(inviteCode)) {
        case null return "error:invalid_invite_code";
        case (?code) {
          if (code.used) return "error:invite_code_already_used";
          let updated : InviteCode = { code = inviteCode; used = true; usedBy = ?caller };
          inviteCodes.put(inviteCode, updated);
        };
      };
    };
    let profile : UserProfile = {
      principal = caller;
      publicKey = publicKey;
      registeredAt = Time.now();
    };
    profiles.put(caller, profile);
    "ok"
  };

  public shared query(msg) func getMyProfile() : async ?UserProfile {
    profiles.get(msg.caller)
  };

  public shared(msg) func updatePublicKey(publicKey : Text) : async Text {
    let caller = msg.caller;
    switch (profiles.get(caller)) {
      case null "error:not_registered";
      case (?p) {
        let updated : UserProfile = { principal = p.principal; publicKey = publicKey; registeredAt = p.registeredAt };
        profiles.put(caller, updated);
        "ok"
      };
    }
  };

  // =====================
  // CONTACTS
  // =====================

  public shared(msg) func addContact(contact : Principal) : async Text {
    let caller = msg.caller;
    if (Principal.equal(caller, contact)) return "error:cannot_add_self";
    switch (profiles.get(caller)) {
      case null return "error:not_registered";
      case _ {};
    };
    let existing = switch (contacts.get(caller)) {
      case null [];
      case (?list) list;
    };
    // Check if already added
    for (c in existing.vals()) {
      if (Principal.equal(c, contact)) return "ok";
    };
    let newList = Array.append(existing, [contact]);
    contacts.put(caller, newList);
    "ok"
  };

  public shared(msg) func removeContact(contact : Principal) : async Text {
    let caller = msg.caller;
    let existing = switch (contacts.get(caller)) {
      case null return "ok";
      case (?list) list;
    };
    let filtered = Array.filter(existing, func(c : Principal) : Bool { not Principal.equal(c, contact) });
    contacts.put(caller, filtered);
    "ok"
  };

  func hasContact(user : Principal, contact : Principal) : Bool {
    switch (contacts.get(user)) {
      case null false;
      case (?list) {
        for (c in list.vals()) {
          if (Principal.equal(c, contact)) return true;
        };
        false
      };
    }
  };

  public shared query(msg) func getContacts() : async [ContactInfo] {
    let caller = msg.caller;
    let myContacts = switch (contacts.get(caller)) {
      case null return [];
      case (?list) list;
    };
    Array.map(myContacts, func(c : Principal) : ContactInfo {
      { principal = c; isMutual = hasContact(c, caller) }
    })
  };

  public shared query(msg) func getRelationshipStatus(other : Principal) : async RelationshipStatus {
    let caller = msg.caller;
    let callerAdded = hasContact(caller, other);
    let otherAdded = hasContact(other, caller);
    { callerAdded = callerAdded; otherAdded = otherAdded; isMutual = callerAdded and otherAdded }
  };

  public shared query(msg) func getContactPublicKey(contact : Principal) : async ?Text {
    let caller = msg.caller;
    if (not hasContact(caller, contact)) return null;
    if (not hasContact(contact, caller)) return null;
    switch (profiles.get(contact)) {
      case null null;
      case (?p) ?p.publicKey;
    }
  };

  // =====================
  // MESSAGING
  // =====================

  public shared(msg) func sendMessage(recipient : Principal, encryptedPayload : Text, encryptedSymmetricKey : Text) : async Text {
    let caller = msg.caller;
    switch (profiles.get(caller)) {
      case null return "error:not_registered";
      case _ {};
    };
    if (not hasContact(caller, recipient) or not hasContact(recipient, caller)) {
      return "error:not_mutual_contacts";
    };
    let id = messageCounter;
    messageCounter += 1;
    let message : Message = {
      id = id;
      sender = caller;
      recipient = recipient;
      encryptedPayload = encryptedPayload;
      encryptedSymmetricKey = encryptedSymmetricKey;
      timestamp = Time.now();
    };
    messages.add(message);
    "ok"
  };

  public shared query(msg) func getInbox() : async [Message] {
    let caller = msg.caller;
    let all = Buffer.toArray(messages);
    Array.filter(all, func(m : Message) : Bool { Principal.equal(m.recipient, caller) })
  };

  public shared query(msg) func getSentMessages() : async [Message] {
    let caller = msg.caller;
    let all = Buffer.toArray(messages);
    Array.filter(all, func(m : Message) : Bool { Principal.equal(m.sender, caller) })
  };

  // =====================
  // TOKEN TRANSFERS
  // =====================

  public shared(msg) func sendToken(ledgerCanisterId : Text, recipientPrincipal : Text, amount : Nat) : async Text {
    let caller = msg.caller;
    let ledger = actor(ledgerCanisterId) : actor {
      icrc1_transfer : (TransferArg) -> async TransferResult;
    };
    let recipient = Principal.fromText(recipientPrincipal);
    let arg : TransferArg = {
      from_subaccount = null;
      to = { owner = recipient; subaccount = null };
      amount = amount;
      fee = null;
      memo = null;
      created_at_time = null;
    };
    let result = await ledger.icrc1_transfer(arg);
    switch (result) {
      case (#Ok(blockIndex)) Nat.toText(blockIndex);
      case (#Err(e)) {
        switch (e) {
          case (#InsufficientFunds(_)) "error:insufficient_funds";
          case (#BadFee(_)) "error:bad_fee";
          case (#GenericError(e)) "error:" # e.message;
          case (_) "error:transfer_failed";
        }
      };
    }
  };

  public shared(msg) func getTokenBalance(ledgerCanisterId : Text) : async Nat {
    let caller = msg.caller;
    let ledger = actor(ledgerCanisterId) : actor {
      icrc1_balance_of : (BalanceArg) -> async Nat;
    };
    await ledger.icrc1_balance_of({ owner = caller; subaccount = null })
  };

  // =====================
  // INVITE CODES
  // =====================

  public shared(msg) func generateInviteCode() : async Text {
    let caller = msg.caller;
    if (not isAdmin(caller)) return "error:admin_only";
    let code = "INV-" # Int.toText(Time.now()) # "-" # Principal.toText(caller);
    let invite : InviteCode = { code = code; used = false; usedBy = null };
    inviteCodes.put(code, invite);
    code
  };

  public shared query(msg) func listInviteCodes() : async [InviteCode] {
    let caller = msg.caller;
    if (not isAdmin(caller)) return [];
    Iter.toArray(inviteCodes.vals())
  };

  public shared query func validateInviteCode(code : Text) : async Bool {
    switch (inviteCodes.get(code)) {
      case null false;
      case (?c) not c.used;
    }
  };

  // =====================
  // DIAGNOSTICS
  // =====================

  public shared query(msg) func getDiagnostics() : async {
    hasProfile: Bool;
    publicKeyRegistered: Bool;
    contactCount: Nat;
    mutualContactCount: Nat;
    isAdmin: Bool;
  } {
    let caller = msg.caller;
    let profile = profiles.get(caller);
    let myContacts = switch (contacts.get(caller)) {
      case null [];
      case (?list) list;
    };
    let mutualCount = Array.filter(myContacts, func(c : Principal) : Bool { hasContact(c, caller) }).size();
    {
      hasProfile = profile != null;
      publicKeyRegistered = switch (profile) { case null false; case (?p) p.publicKey != "" };
      contactCount = myContacts.size();
      mutualContactCount = mutualCount;
      isAdmin = isAdmin(caller);
    }
  };

};
