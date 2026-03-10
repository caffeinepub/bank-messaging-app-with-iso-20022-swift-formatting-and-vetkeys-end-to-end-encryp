import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type EncryptedKeyBytes = Uint8Array;
export type Time = bigint;
export interface EncryptedMessage {
    id: bigint;
    to: Principal;
    from: Principal;
    messageType: MessageType;
    timestamp: Time;
    encryptedPayload: Uint8Array;
    encryptedSymmetricKey: EncryptedKeyBytes;
}
export interface SyncStatus {
    otherHasPublicKey: boolean;
    callerHasPublicKey: boolean;
    isMutuallyTrusted: boolean;
    callerTrustsOther: boolean;
    otherTrustsCaller: boolean;
}
export interface UserProfile {
    publicKey?: Uint8Array;
    name: string;
}
export enum MessageType {
    iso20022 = "iso20022",
    swift = "swift"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addTrustedContact(user: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllMessagesForCaller(): Promise<Array<EncryptedMessage>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Get the public key of a mutually trusted contact.
     * / Only works if both caller and the contact have added each other as trusted contacts.
     * / This allows encrypting messages to trusted contacts without exposing full profile data.
     */
    getContactPublicKey(contact: Principal): Promise<Uint8Array | null>;
    getMessageById(messageId: bigint): Promise<EncryptedMessage>;
    /**
     * / Get the relationship status between the caller and another user.
     * / This includes public key and trust relationship info.
     * / Only reveals information about the relationship between caller and the specified user.
     */
    getRelationshipStatus(other: Principal): Promise<SyncStatus>;
    getTrustedContacts(): Promise<Array<Principal>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isTrustedContact(user: Principal): Promise<boolean>;
    removeTrustedContact(user: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(to: Principal, messageType: MessageType, encryptedPayload: Uint8Array, encryptedSymmetricKey: EncryptedKeyBytes): Promise<bigint>;
}
