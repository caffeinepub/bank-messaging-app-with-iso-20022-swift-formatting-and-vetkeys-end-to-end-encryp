// Token configuration for ckBTC, ckETH, and ckUSDC
// Official mainnet ledger canister IDs configured

export interface TokenConfig {
  symbol: string;
  name: string;
  ledgerCanisterId?: string;
  decimals: number;
}

export const TOKENS: Record<string, TokenConfig> = {
  ckBTC: {
    symbol: 'ckBTC',
    name: 'Chain Key Bitcoin',
    ledgerCanisterId: 'mxzaz-hqaaa-aaaar-qaada-cai',
    decimals: 8,
  },
  ckETH: {
    symbol: 'ckETH',
    name: 'Chain Key Ethereum',
    ledgerCanisterId: 'ss2fx-dyaaa-aaaar-qacoq-cai',
    decimals: 18,
  },
  ckUSDC: {
    symbol: 'ckUSDC',
    name: 'Chain Key USDC',
    ledgerCanisterId: 'xevnm-gaaaa-aaaar-qafnq-cai',
    decimals: 6,
  },
};

export function isTokenConfigured(tokenSymbol: string): boolean {
  const token = TOKENS[tokenSymbol];
  return !!token?.ledgerCanisterId;
}

export function getTokenConfig(tokenSymbol: string): TokenConfig | undefined {
  return TOKENS[tokenSymbol];
}
