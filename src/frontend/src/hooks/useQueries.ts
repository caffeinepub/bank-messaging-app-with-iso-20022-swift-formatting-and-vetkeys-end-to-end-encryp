import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { EncryptedMessage, MessageType } from '@/backend';
import { Principal } from '@dfinity/principal';

export function useGetMessages() {
  const { actor, isFetching } = useActor();

  return useQuery<EncryptedMessage[]>({
    queryKey: ['messages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMessagesForCaller();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMessageById(messageId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<EncryptedMessage>({
    queryKey: ['message', messageId?.toString()],
    queryFn: async () => {
      if (!actor || messageId === null) throw new Error('Actor or message ID not available');
      return actor.getMessageById(messageId);
    },
    enabled: !!actor && !isFetching && messageId !== null,
    retry: false,
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
      encryptedSymmetricKey,
    }: {
      to: Principal;
      messageType: MessageType;
      encryptedPayload: Uint8Array;
      encryptedSymmetricKey: Uint8Array;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendMessage(to, messageType, encryptedPayload, encryptedSymmetricKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}
