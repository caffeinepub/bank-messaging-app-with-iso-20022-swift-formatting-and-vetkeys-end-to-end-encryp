import type { Principal } from "@dfinity/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useGetTrustedContacts() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ["trustedContacts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTrustedContacts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddTrustedContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addTrustedContact(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trustedContacts"] });
    },
  });
}

export function useRemoveTrustedContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.removeTrustedContact(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trustedContacts"] });
    },
  });
}

export function useIsTrustedContact(user: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isTrustedContact", user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return false;
      return actor.isTrustedContact(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}
