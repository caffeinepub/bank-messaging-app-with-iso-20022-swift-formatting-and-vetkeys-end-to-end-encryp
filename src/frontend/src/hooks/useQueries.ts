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

// ---- Invite Links (backend-enforced) ----

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

export function useIsCallerApproved() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isCallerApproved"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetInviteCodes() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<{ code: string; used: boolean }>>({
    queryKey: ["inviteCodes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInviteCodes();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function useGenerateInviteCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.generateInviteCode();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["inviteCodes"] });
    },
  });
}

export function useSubmitRSVP() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (params: {
      name: string;
      attending: boolean;
      inviteCode: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const code = params.inviteCode.trim();
      if (!code) throw new Error("Invalid or already used invite code");
      const success = await actor.submitInviteCode(code);
      if (!success) throw new Error("Invalid or already used invite code");
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
