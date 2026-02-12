import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Blob "mo:core/Blob";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type MessageType = {
    #iso20022;
    #swift;
  };

  type EncryptedKeyBytes = Blob;
  type VetKeyBytes = Blob;

  type Message = {
    id : Nat;
    from : Principal;
    to : Principal;
    messageType : MessageType;
    encryptedPayload : Blob;
    keyId : VetKeyBytes;
    timestamp : Time.Time;
  };

  module Message {
    public func compare(message1 : Message, message2 : Message) : Order.Order {
      Nat.compare(message1.id, message2.id);
    };
  };

  type MessageState = {
    messages : Map.Map<Nat, Message>;
    trustedContacts : Map.Map<Principal, Set.Set<Principal>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    nextMessageId : Nat;
  };

  let messages = Map.empty<Nat, Message>();
  var nextMessageId = 0;

  let trustedContacts = Map.empty<Principal, Set.Set<Principal>>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
    publicKey : ?Blob;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public type ContactRequest = {
    fromUser : Principal;
    toUser : Principal;
  };

  public type SyncStatus = {
    callerHasPublicKey : Bool;
    otherHasPublicKey : Bool;
    callerTrustsOther : Bool;
    otherTrustsCaller : Bool;
    isMutuallyTrusted : Bool;
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Create a trusted contact
  public shared ({ caller }) func addTrustedContact(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add trusted contacts");
    };
    
    if (caller == user) {
      Runtime.trap("Cannot add yourself as a trusted contact");
    };

    let callerContacts = switch (trustedContacts.get(caller)) {
      case (null) {
        let newSet = Set.singleton(user);
        trustedContacts.add(caller, newSet);
        return;
      };
      case (?contacts) {
        contacts.add(user);
      };
    };
  };

  // Check if user is a trusted contact
  public query ({ caller }) func isTrustedContact(user : Principal) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check trusted contacts");
    };
    
    switch (trustedContacts.get(caller)) {
      case (null) { false };
      case (?contacts) { contacts.contains(user) };
    };
  };

  /// Get the relationship status between the caller and ANY other user.
  /// This includes public key and trust relationship info.
  public query ({ caller }) func getRelationshipStatus(other : Principal) : async SyncStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query relationship status");
    };

    // Check public key presence
    let callerProfile = userProfiles.get(caller);
    let otherProfile = userProfiles.get(other);

    let callerHasPublicKey = switch (callerProfile) {
      case (?profile) { profile.publicKey != null };
      case (null) { false };
    };

    let otherHasPublicKey = switch (otherProfile) {
      case (?profile) { profile.publicKey != null };
      case (null) { false };
    };

    // Check trust relationships
    let callerTrustsOther = switch (trustedContacts.get(caller)) {
      case (null) { false };
      case (?contacts) { contacts.contains(other) };
    };

    let otherTrustsCaller = switch (trustedContacts.get(other)) {
      case (null) { false };
      case (?contacts) { contacts.contains(caller) };
    };

    let isMutuallyTrusted = callerTrustsOther and otherTrustsCaller;

    {
      callerHasPublicKey;
      otherHasPublicKey;
      callerTrustsOther;
      otherTrustsCaller;
      isMutuallyTrusted;
    };
  };

  // Helper function to check mutual trust
  private func areMutuallyTrusted(user1 : Principal, user2 : Principal) : Bool {
    let user1TrustsUser2 = switch (trustedContacts.get(user1)) {
      case (null) { false };
      case (?contacts) { contacts.contains(user2) };
    };

    let user2TrustsUser1 = switch (trustedContacts.get(user2)) {
      case (null) { false };
      case (?contacts) { contacts.contains(user1) };
    };

    user1TrustsUser2 and user2TrustsUser1;
  };

  // Send encrypted message
  public shared ({ caller }) func sendMessage(
    to : Principal,
    messageType : MessageType,
    encryptedPayload : Blob,
    keyId : VetKeyBytes,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    if (caller == to) {
      Runtime.trap("Cannot send message to yourself");
    };

    // Check mutual trust: both sender and recipient must trust each other
    if (not areMutuallyTrusted(caller, to)) {
      Runtime.trap("Unauthorized: Both users must have each other as trusted contacts");
    };

    let message : Message = {
      id = nextMessageId;
      from = caller;
      to;
      messageType;
      encryptedPayload;
      keyId;
      timestamp = Time.now();
    };

    messages.add(nextMessageId, message);
    nextMessageId += 1;
    message.id;
  };

  // Retrieve messages for user
  public query ({ caller }) func getMessages() : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can retrieve messages");
    };
    
    messages.values().toArray().filter(
      func(m) {
        m.to == caller;
      }
    );
  };

  // Get user messages by principal (admin only)
  public query ({ caller }) func getUserMessages(user : Principal) : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can fetch other users' messages");
    };
    
    messages.values().toArray().filter(
      func(m) {
        m.from == user or m.to == user;
      }
    );
  };

  // Get all trusted contacts for caller
  public query ({ caller }) func getTrustedContacts() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trusted contacts");
    };
    
    switch (trustedContacts.get(caller)) {
      case (null) { [] };
      case (?contacts) { contacts.toArray() };
    };
  };

  // Remove a trusted contact
  public shared ({ caller }) func removeTrustedContact(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove trusted contacts");
    };
    
    switch (trustedContacts.get(caller)) {
      case (null) { /* No contacts to remove */ };
      case (?contacts) {
        contacts.remove(user);
      };
    };
  };
};
