import type { SyncStatus } from "@/backend";
import type { Principal } from "@dfinity/principal";
import { useQuery } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useGetRelationshipStatus(other: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<SyncStatus | null>({
    queryKey: ["relationshipStatus", other?.toString()],
    queryFn: async () => {
      if (!actor || !other) return null;
      return actor.getRelationshipStatus(other);
    },
    enabled: !!actor && !isFetching && !!other,
    retry: false,
  });
}
