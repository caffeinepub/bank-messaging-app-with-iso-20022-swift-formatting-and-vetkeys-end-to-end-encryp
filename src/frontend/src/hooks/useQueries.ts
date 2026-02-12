import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Message, MessageType, UserProfile } from '@/backend';
import { Principal } from '@dfinity/principal';

export function useGetMessages() {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMessages();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      to,
      messageType,
      encryptedPayload,
      keyId,
    }: {
      to: Principal;
      messageType: MessageType;
      encryptedPayload: Uint8Array;
      keyId: Uint8Array;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendMessage(to, messageType, encryptedPayload, keyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}
