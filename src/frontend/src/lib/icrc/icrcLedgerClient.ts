import { getNetworkConfig } from "@/config/canisters";
import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import type { Identity } from "@icp-sdk/core/agent";

// ICRC-1 Ledger interface
interface IcrcLedgerService {
  icrc1_name: () => Promise<string>;
  icrc1_symbol: () => Promise<string>;
  icrc1_decimals: () => Promise<number>;
  icrc1_fee: () => Promise<bigint>;
  icrc1_metadata: () => Promise<
    Array<
      [string, { Nat?: bigint; Int?: bigint; Text?: string; Blob?: Uint8Array }]
    >
  >;
  icrc1_balance_of: (account: {
    owner: Principal;
    subaccount: [] | [Uint8Array];
  }) => Promise<bigint>;
  icrc1_transfer: (args: TransferArg) => Promise<TransferResult>;
}

export interface IcrcLedgerMetadata {
  name: string;
  symbol: string;
  decimals: number;
  fee: bigint;
}

type Account = {
  owner: Principal;
  subaccount: [] | [Uint8Array];
};

type TransferArg = {
  from_subaccount: [] | [Uint8Array];
  to: Account;
  fee: [] | [bigint];
  created_at_time: [] | [bigint];
  memo: [] | [Uint8Array];
  amount: bigint;
};

type TransferError =
  | { BadFee: { expected_fee: bigint } }
  | { BadBurn: { min_burn_amount: bigint } }
  | { InsufficientFunds: { balance: bigint } }
  | { TooOld: null }
  | { CreatedInFuture: { ledger_time: bigint } }
  | { Duplicate: { duplicate_of: bigint } }
  | { TemporarilyUnavailable: null }
  | { GenericError: { error_code: bigint; message: string } };

type TransferResult = { Ok: bigint } | { Err: TransferError };

const idlFactory = ({ IDL }: any) => {
  const Value = IDL.Variant({
    Nat: IDL.Nat,
    Int: IDL.Int,
    Text: IDL.Text,
    Blob: IDL.Vec(IDL.Nat8),
  });

  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });

  const TransferArg = IDL.Record({
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    to: Account,
    fee: IDL.Opt(IDL.Nat),
    created_at_time: IDL.Opt(IDL.Nat64),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    amount: IDL.Nat,
  });

  const TransferError = IDL.Variant({
    BadFee: IDL.Record({ expected_fee: IDL.Nat }),
    BadBurn: IDL.Record({ min_burn_amount: IDL.Nat }),
    InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
    TooOld: IDL.Null,
    CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
    Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
    TemporarilyUnavailable: IDL.Null,
    GenericError: IDL.Record({ error_code: IDL.Nat, message: IDL.Text }),
  });

  const TransferResult = IDL.Variant({
    Ok: IDL.Nat,
    Err: TransferError,
  });

  return IDL.Service({
    icrc1_name: IDL.Func([], [IDL.Text], ["query"]),
    icrc1_symbol: IDL.Func([], [IDL.Text], ["query"]),
    icrc1_decimals: IDL.Func([], [IDL.Nat8], ["query"]),
    icrc1_fee: IDL.Func([], [IDL.Nat], ["query"]),
    icrc1_metadata: IDL.Func(
      [],
      [IDL.Vec(IDL.Tuple(IDL.Text, Value))],
      ["query"],
    ),
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ["query"]),
    icrc1_transfer: IDL.Func([TransferArg], [TransferResult], []),
  });
};

/**
 * Creates an ICRC-1 ledger actor.
 */
async function createIcrcLedgerActor(
  ledgerCanisterId: string,
  identity?: Identity,
): Promise<IcrcLedgerService> {
  const networkConfig = getNetworkConfig();
  const host = networkConfig.host;

  const agentOptions: any = { host };
  if (identity) {
    agentOptions.identity = identity;
  }

  const agent = new HttpAgent(agentOptions);

  if (networkConfig.isLocal) {
    await agent.fetchRootKey();
  }

  return Actor.createActor<IcrcLedgerService>(idlFactory, {
    agent,
    canisterId: Principal.fromText(ledgerCanisterId),
  });
}

/**
 * Fetches the ICRC-1 balance for a given principal.
 */
export async function fetchIcrcBalance(
  ledgerCanisterId: string,
  principalText: string,
): Promise<
  { success: true; balance: bigint } | { success: false; error: string }
> {
  try {
    const actor = await createIcrcLedgerActor(ledgerCanisterId);
    const owner = Principal.fromText(principalText);
    const balance = await actor.icrc1_balance_of({ owner, subaccount: [] });
    return { success: true, balance };
  } catch (error: any) {
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Fetches read-only metadata from an ICRC-1 ledger canister.
 */
export async function fetchIcrcLedgerMetadata(
  ledgerCanisterId: string,
): Promise<
  | { success: true; metadata: IcrcLedgerMetadata }
  | { success: false; error: string }
> {
  try {
    const actor = await createIcrcLedgerActor(ledgerCanisterId);

    const [name, symbol, decimals, fee] = await Promise.all([
      actor.icrc1_name(),
      actor.icrc1_symbol(),
      actor.icrc1_decimals(),
      actor.icrc1_fee(),
    ]);

    return {
      success: true,
      metadata: { name, symbol, decimals, fee },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || String(error),
    };
  }
}

function formatTransferError(err: TransferError): string {
  if ("BadFee" in err)
    return `Bad fee. Expected fee: ${err.BadFee.expected_fee}`;
  if ("BadBurn" in err)
    return `Bad burn. Min burn amount: ${err.BadBurn.min_burn_amount}`;
  if ("InsufficientFunds" in err)
    return `Insufficient funds. Balance: ${err.InsufficientFunds.balance}`;
  if ("TooOld" in err) return "Transaction too old";
  if ("CreatedInFuture" in err) return "Transaction created in the future";
  if ("Duplicate" in err)
    return `Duplicate transaction (block ${err.Duplicate.duplicate_of})`;
  if ("TemporarilyUnavailable" in err) return "Ledger temporarily unavailable";
  if ("GenericError" in err)
    return `Error: ${err.GenericError.message} (code ${err.GenericError.error_code})`;
  return "Unknown transfer error";
}

export interface Icrc1TransferParams {
  ledgerCanisterId: string;
  identity: Identity;
  to: string;
  amount: number;
  decimals: number;
}

export async function icrc1Transfer(
  params: Icrc1TransferParams,
): Promise<
  { success: true; blockIndex: bigint } | { success: false; error: string }
> {
  const { ledgerCanisterId, identity, to, amount, decimals } = params;
  try {
    const recipientPrincipal = Principal.fromText(to);
    const scaledAmount = BigInt(Math.round(amount * 10 ** decimals));

    const actor = await createIcrcLedgerActor(ledgerCanisterId, identity);

    const result = await actor.icrc1_transfer({
      from_subaccount: [],
      to: { owner: recipientPrincipal, subaccount: [] },
      fee: [],
      created_at_time: [],
      memo: [],
      amount: scaledAmount,
    });

    if ("Ok" in result) {
      return { success: true, blockIndex: result.Ok };
    }
    return { success: false, error: formatTransferError(result.Err) };
  } catch (error: any) {
    return { success: false, error: error?.message || String(error) };
  }
}
