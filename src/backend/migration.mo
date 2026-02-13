import Map "mo:core/Map";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Blob "mo:core/Blob";

module {
  type OldActor = {
    messages : Map.Map<Nat, EncryptedMessage>;
    trustedContacts : Map.Map<Principal, Set.Set<Principal>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    nextMessageId : Nat;
  };

  type EncryptedMessage = {
    id : Nat;
    from : Principal;
    to : Principal;
    messageType : MessageType;
    encryptedPayload : Blob;
    encryptedSymmetricKey : EncryptedKeyBytes;
    timestamp : Time.Time;
  };

  type UserProfile = {
    name : Text;
    publicKey : ?Blob;
  };

  type MessageType = {
    #iso20022;
    #swift;
  };

  type EncryptedKeyBytes = Blob;

  public func run(old : OldActor) : OldActor {
    old;
  };
};
