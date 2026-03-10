import { Actor, type HttpAgent } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";

// ICRC-1 IDL factory
const icrc1IdlFactory = ({ IDL }: { IDL: any }) => {
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const TransferArgs = IDL.Record({
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    to: Account,
    amount: IDL.Nat,
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64),
  });
  const TransferResult = IDL.Variant({
    Ok: IDL.Nat,
    Err: IDL.Text,
  });
  return IDL.Service({
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ["query"]),
    icrc1_transfer: IDL.Func([TransferArgs], [TransferResult], []),
  });
};

function createIcrcActor(canisterId: string, agent: HttpAgent) {
  return Actor.createActor(icrc1IdlFactory, {
    agent,
    canisterId,
  }) as {
    icrc1_balance_of: (account: {
      owner: Principal;
      subaccount: [] | [Uint8Array];
    }) => Promise<bigint>;
    icrc1_transfer: (args: {
      from_subaccount: [] | [Uint8Array];
      to: { owner: Principal; subaccount: [] | [Uint8Array] };
      amount: bigint;
      fee: [] | [bigint];
      memo: [] | [Uint8Array];
      created_at_time: [] | [bigint];
    }) => Promise<{ Ok: bigint } | { Err: string }>;
  };
}

export async function getBalance(
  canisterId: string,
  principal: Principal,
  agent: HttpAgent,
): Promise<bigint> {
  const actor = createIcrcActor(canisterId, agent);
  return actor.icrc1_balance_of({
    owner: principal,
    subaccount: [],
  });
}

export async function transfer(
  canisterId: string,
  to: Principal,
  amount: bigint,
  agent: HttpAgent,
): Promise<bigint> {
  const actor = createIcrcActor(canisterId, agent);
  const result = await actor.icrc1_transfer({
    from_subaccount: [],
    to: { owner: to, subaccount: [] },
    amount,
    fee: [],
    memo: [],
    created_at_time: [],
  });

  if ("Ok" in result) {
    return result.Ok;
  }
  throw new Error(`Transfer failed: ${result.Err}`);
}

// Token config
export const TOKENS = [
  {
    symbol: "ckBTC",
    name: "Chain-Key Bitcoin",
    canisterId: "mxzaz-hqaaa-aaaar-qaada-cai",
    decimals: 8,
    color: "oklch(0.72 0.18 60)",
  },
  {
    symbol: "ckETH",
    name: "Chain-Key Ether",
    canisterId: "ss2fx-dyaaa-aaaar-qacoq-cai",
    decimals: 18,
    color: "oklch(0.68 0.19 195)",
  },
  {
    symbol: "ckUSDC",
    name: "Chain-Key USDC",
    canisterId: "xevnm-gaaaa-aaaar-qafnq-cai",
    decimals: 6,
    color: "oklch(0.74 0.22 142)",
  },
] as const;

export type TokenSymbol = (typeof TOKENS)[number]["symbol"];

export function formatTokenAmount(amount: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionStr = fraction.toString().padStart(decimals, "0");
  // Show up to 6 significant decimal places
  const trimmed = fractionStr.replace(/0+$/, "").slice(0, 6);
  return trimmed ? `${whole}.${trimmed}` : `${whole}`;
}

export function parseTokenAmount(value: string, decimals: number): bigint {
  const [whole, frac = ""] = value.split(".");
  const fracPadded = frac.padEnd(decimals, "0").slice(0, decimals);
  return (
    BigInt(whole || "0") * BigInt(10 ** decimals) + BigInt(fracPadded || "0")
  );
}
