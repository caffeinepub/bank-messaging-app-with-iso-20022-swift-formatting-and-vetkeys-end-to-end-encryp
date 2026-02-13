import Map "mo:core/Map";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  type OldMessageType = {
    #iso20022;
    #swift;
  };

  type OldMessage = {
    id : Nat;
    from : Principal.Principal;
    to : Principal.Principal;
    messageType : OldMessageType;
    encryptedPayload : Blob;
    keyId : Blob;
    timestamp : Time.Time;
  };

  type OldActor = {
    messages : Map.Map<Nat, OldMessage>;
    trustedContacts : Map.Map<Principal.Principal, Set.Set<Principal.Principal>>;
    userProfiles : Map.Map<Principal.Principal, { name : Text; publicKey : ?Blob }>;
    nextMessageId : Nat;
  };

  type NewMessageType = {
    #iso20022;
    #swift;
  };

  type NewMessage = {
    id : Nat;
    from : Principal.Principal;
    to : Principal.Principal;
    messageType : NewMessageType;
    encryptedPayload : Blob;
    encryptedSymmetricKey : Blob;
    timestamp : Time.Time;
  };

  type NewActor = {
    messages : Map.Map<Nat, NewMessage>;
    trustedContacts : Map.Map<Principal.Principal, Set.Set<Principal.Principal>>;
    userProfiles : Map.Map<Principal.Principal, { name : Text; publicKey : ?Blob }>;
    nextMessageId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newMessages = old.messages.map<Nat, OldMessage, NewMessage>(
      func(_id, oldMessage) {
        {
          oldMessage with
          encryptedSymmetricKey = oldMessage.keyId
        };
      }
    );
    { old with messages = newMessages };
  };
};
