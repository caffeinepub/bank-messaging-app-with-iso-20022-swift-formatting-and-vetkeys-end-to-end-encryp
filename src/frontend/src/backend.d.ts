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
export interface InviteCodeRecord {
    code: string;
    used: boolean;
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
    _initializeAccessControlWithSecret(secret: string): Promise<void>;
    addTrustedContact(user: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    generateInviteCode(): Promise<string>;
    getAllMessagesForCaller(): Promise<Array<EncryptedMessage>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getContactPublicKey(contact: Principal): Promise<Uint8Array | null>;
    getInviteCodes(): Promise<Array<InviteCodeRecord>>;
    getMessageById(messageId: bigint): Promise<EncryptedMessage>;
    getRelationshipStatus(other: Principal): Promise<SyncStatus>;
    getTrustedContacts(): Promise<Array<Principal>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    isTrustedContact(user: Principal): Promise<boolean>;
    removeTrustedContact(user: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(to: Principal, messageType: MessageType, encryptedPayload: Uint8Array, encryptedSymmetricKey: EncryptedKeyBytes): Promise<bigint>;
    submitInviteCode(code: string): Promise<boolean>;
}
