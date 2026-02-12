import { useQuery } from '@tanstack/react-query';
import { checkTokenLedgerConfiguration, type TokenLedgerCheck } from '@/config/tokens';
import { fetchIcrcLedgerMetadata, type IcrcLedgerMetadata } from '@/lib/icrc/icrcLedgerClient';

export interface TokenDiagnosticResult extends TokenLedgerCheck {
  metadataCheck?: {
    success: boolean;
    metadata?: IcrcLedgerMetadata;
    error?: string;
  };
}

/**
 * React Query hook that performs token ledger diagnostics:
 * 1. Checks configured vs expected ledger canister IDs
 * 2. Performs read-only metadata calls to verify connectivity
 * 
 * Does NOT perform any transfer operations.
 */
export function useTokenLedgerDiagnostics() {
  return useQuery<TokenDiagnosticResult[]>({
    queryKey: ['tokenLedgerDiagnostics'],
    queryFn: async () => {
      // Step 1: Check configuration
      const configChecks = checkTokenLedgerConfiguration();

      // Step 2: For each configured token, perform metadata check
      const diagnosticsPromises = configChecks.map(async (check) => {
        if (!check.configuredLedgerCanisterId) {
          // Token not configured, skip metadata check
          return {
            ...check,
            metadataCheck: undefined,
          };
        }

        // Perform read-only metadata call
        const metadataResult = await fetchIcrcLedgerMetadata(check.configuredLedgerCanisterId);

        return {
          ...check,
          metadataCheck: metadataResult,
        };
      });

      return Promise.all(diagnosticsPromises);
    },
    // Refetch every 5 minutes to keep diagnostics fresh
    staleTime: 5 * 60 * 1000,
    // Don't retry on failure to avoid spamming the network
    retry: false,
  });
}
