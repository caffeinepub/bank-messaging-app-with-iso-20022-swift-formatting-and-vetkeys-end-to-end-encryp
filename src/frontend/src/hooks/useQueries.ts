import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageType } from "../backend.d";
import { useActor } from "./useActor";

export { MessageType };

// ---- Queries ----

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTrustedContacts() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["trustedContacts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTrustedContacts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRelationshipStatus(other: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["relationshipStatus", other?.toString()],
    queryFn: async () => {
      if (!actor || !other) return null;
      return actor.getRelationshipStatus(other);
    },
    enabled: !!actor && !isFetching && !!other,
  });
}

export function useAllMessages() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allMessages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMessagesForCaller();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMessageById(messageId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["message", messageId?.toString()],
    queryFn: async () => {
      if (!actor || messageId === null) return null;
      return actor.getMessageById(messageId);
    },
    enabled: !!actor && !isFetching && messageId !== null,
  });
}

export function useContactProfile(contact: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["contactProfile", contact?.toString()],
    queryFn: async () => {
      if (!actor || !contact) return null;
      return actor.getUserProfile(contact);
    },
    enabled: !!actor && !isFetching && !!contact,
  });
}

// ---- Invite Links ----

const INVITE_CODES_KEY = "opdup_invite_codes";
const USED_CODES_KEY = "opdup_used_invite_codes";

interface InviteCode {
  code: string;
  used: boolean;
  createdAt: string;
}

function getStoredInviteCodes(): InviteCode[] {
  try {
    const raw = localStorage.getItem(INVITE_CODES_KEY);
    return raw ? (JSON.parse(raw) as InviteCode[]) : [];
  } catch {
    return [];
  }
}

function getUsedCodes(): Set<string> {
  try {
    const raw = localStorage.getItem(USED_CODES_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function markCodeUsed(code: string) {
  const used = getUsedCodes();
  used.add(code);
  localStorage.setItem(USED_CODES_KEY, JSON.stringify([...used]));

  // Also mark in admin codes if present
  const codes = getStoredInviteCodes();
  const updated = codes.map((c) =>
    c.code === code ? { ...c, used: true } : c,
  );
  localStorage.setItem(INVITE_CODES_KEY, JSON.stringify(updated));
}

function generateRandomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function useIsCurrentUserAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetInviteCodes() {
  return useQuery({
    queryKey: ["inviteCodes"],
    queryFn: async () => {
      return getStoredInviteCodes();
    },
    staleTime: 0,
  });
}

export function useGenerateInviteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const code = generateRandomCode();
      const codes = getStoredInviteCodes();
      const newEntry: InviteCode = {
        code,
        used: false,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(
        INVITE_CODES_KEY,
        JSON.stringify([...codes, newEntry]),
      );
      return code;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["inviteCodes"] });
    },
  });
}

export function useSubmitRSVP() {
  return useMutation({
    mutationFn: async (params: {
      name: string;
      attending: boolean;
      inviteCode: string;
    }) => {
      const code = params.inviteCode.trim().toUpperCase();
      if (!code) throw new Error("Invalid or already used invite code");

      const usedCodes = getUsedCodes();
      if (usedCodes.has(code)) {
        throw new Error("Invalid or already used invite code");
      }

      // Check admin-generated codes if they exist in localStorage
      const adminCodes = getStoredInviteCodes();
      if (adminCodes.length > 0) {
        const match = adminCodes.find(
          (c) => c.code.toUpperCase() === code && !c.used,
        );
        if (!match) throw new Error("Invalid or already used invite code");
      }
      // If no admin codes are stored (cross-device scenario), accept any non-empty non-used code
      markCodeUsed(code);
      return { success: true };
    },
  });
}

// ---- Mutations ----

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: { name: string; publicKey?: Uint8Array }) => {
      if (!actor) throw new Error("Not connected");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useAddTrustedContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error("Not connected");
      await actor.addTrustedContact(principal);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["trustedContacts"] });
    },
  });
}

export function useRemoveTrustedContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error("Not connected");
      await actor.removeTrustedContact(principal);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["trustedContacts"] });
    },
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      to: Principal;
      messageType: MessageType;
      encryptedPayload: Uint8Array;
      encryptedSymmetricKey: Uint8Array;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.sendMessage(
        params.to,
        params.messageType,
        params.encryptedPayload,
        params.encryptedSymmetricKey,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["allMessages"] });
    },
  });
}
