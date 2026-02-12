import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface Message {
    id: bigint;
    to: Principal;
    from: Principal;
    messageType: MessageType;
    timestamp: Time;
    encryptedPayload: Uint8Array;
    keyId: VetKeyBytes;
}
export interface SyncStatus {
    otherHasPublicKey: boolean;
    callerHasPublicKey: boolean;
    isMutuallyTrusted: boolean;
    callerTrustsOther: boolean;
    otherTrustsCaller: boolean;
}
export type VetKeyBytes = Uint8Array;
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
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMessages(): Promise<Array<Message>>;
    /**
     * / Get the relationship status between the caller and ANY other user.
     * / This includes public key and trust relationship info.
     */
    getRelationshipStatus(other: Principal): Promise<SyncStatus>;
    getTrustedContacts(): Promise<Array<Principal>>;
    getUserMessages(user: Principal): Promise<Array<Message>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isTrustedContact(user: Principal): Promise<boolean>;
    removeTrustedContact(user: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(to: Principal, messageType: MessageType, encryptedPayload: Uint8Array, keyId: VetKeyBytes): Promise<bigint>;
}
