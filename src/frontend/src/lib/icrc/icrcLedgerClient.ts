import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

// ICRC-1 Ledger interface for read-only metadata calls
interface IcrcLedgerService {
  icrc1_name: () => Promise<string>;
  icrc1_symbol: () => Promise<string>;
  icrc1_decimals: () => Promise<number>;
  icrc1_fee: () => Promise<bigint>;
  icrc1_metadata: () => Promise<Array<[string, { Nat?: bigint; Int?: bigint; Text?: string; Blob?: Uint8Array }]>>;
}

export interface IcrcLedgerMetadata {
  name: string;
  symbol: string;
  decimals: number;
  fee: bigint;
}

/**
 * Creates an ICRC-1 ledger actor for read-only metadata queries.
 * Does NOT support transfer operations.
 */
async function createIcrcLedgerActor(ledgerCanisterId: string): Promise<IcrcLedgerService> {
  // Determine host based on environment
  const host = import.meta.env.VITE_HOST || 
               (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
                 ? 'http://localhost:4943'
                 : 'https://ic0.app');

  const agent = new HttpAgent({ host });

  // Only fetch root key in local development
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    await agent.fetchRootKey();
  }

  const idlFactory = ({ IDL }: any) => {
    const Value = IDL.Variant({
      Nat: IDL.Nat,
      Int: IDL.Int,
      Text: IDL.Text,
      Blob: IDL.Vec(IDL.Nat8),
    });

    return IDL.Service({
      icrc1_name: IDL.Func([], [IDL.Text], ['query']),
      icrc1_symbol: IDL.Func([], [IDL.Text], ['query']),
      icrc1_decimals: IDL.Func([], [IDL.Nat8], ['query']),
      icrc1_fee: IDL.Func([], [IDL.Nat], ['query']),
      icrc1_metadata: IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Text, Value))], ['query']),
    });
  };

  return Actor.createActor<IcrcLedgerService>(idlFactory, {
    agent,
    canisterId: Principal.fromText(ledgerCanisterId),
  });
}

/**
 * Fetches read-only metadata from an ICRC-1 ledger canister.
 * Returns null if the call fails (network, canister, or agent issues).
 */
export async function fetchIcrcLedgerMetadata(
  ledgerCanisterId: string
): Promise<{ success: true; metadata: IcrcLedgerMetadata } | { success: false; error: string }> {
  try {
    const actor = await createIcrcLedgerActor(ledgerCanisterId);

    // Perform read-only query calls
    const [name, symbol, decimals, fee] = await Promise.all([
      actor.icrc1_name(),
      actor.icrc1_symbol(),
      actor.icrc1_decimals(),
      actor.icrc1_fee(),
    ]);

    return {
      success: true,
      metadata: {
        name,
        symbol,
        decimals,
        fee,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || String(error),
    };
  }
}
