// Token configuration for ckBTC, ckETH, and ckUSDC
// Official mainnet ledger canister IDs configured

export interface TokenConfig {
  symbol: string;
  name: string;
  glyph: string;
  ledgerCanisterId?: string;
  decimals: number;
}

export const TOKENS: Record<string, TokenConfig> = {
  ckBTC: {
    symbol: "ckBTC",
    name: "Chain Key Bitcoin",
    glyph: "₿",
    ledgerCanisterId: "mxzaz-hqaaa-aaaar-qaada-cai",
    decimals: 8,
  },
  ckETH: {
    symbol: "ckETH",
    name: "Chain Key Ethereum",
    glyph: "Ξ",
    ledgerCanisterId: "ss2fx-dyaaa-aaaar-qacoq-cai",
    decimals: 18,
  },
  ckUSDC: {
    symbol: "ckUSDC",
    name: "Chain Key USDC",
    glyph: "$",
    ledgerCanisterId: "xevnm-gaaaa-aaaar-qafnq-cai",
    decimals: 6,
  },
};

// Expected mainnet ledger canister IDs for verification
export const EXPECTED_MAINNET_LEDGER_IDS: Record<string, string> = {
  ckBTC: "mxzaz-hqaaa-aaaar-qaada-cai",
  ckETH: "ss2fx-dyaaa-aaaar-qacoq-cai",
  ckUSDC: "xevnm-gaaaa-aaaar-qafnq-cai",
};

export interface TokenLedgerCheck {
  symbol: string;
  configuredLedgerCanisterId?: string;
  expectedLedgerCanisterId: string;
  matchesExpected: boolean;
}

/**
 * Self-check function that compares configured ledger canister IDs
 * against expected mainnet IDs without throwing errors.
 */
export function checkTokenLedgerConfiguration(): TokenLedgerCheck[] {
  return Object.keys(TOKENS).map((tokenKey) => {
    const token = TOKENS[tokenKey];
    const expected = EXPECTED_MAINNET_LEDGER_IDS[tokenKey];
    const configured = token.ledgerCanisterId;

    return {
      symbol: token.symbol,
      configuredLedgerCanisterId: configured,
      expectedLedgerCanisterId: expected,
      matchesExpected: !!configured && configured === expected,
    };
  });
}

export function isTokenConfigured(tokenSymbol: string): boolean {
  const token = TOKENS[tokenSymbol];
  return !!token?.ledgerCanisterId;
}

export function getTokenConfig(tokenSymbol: string): TokenConfig | undefined {
  return TOKENS[tokenSymbol];
}

/**
 * Get the display glyph for a token symbol.
 * Returns the configured glyph or an empty string if not found.
 */
export function getTokenGlyph(tokenSymbol: string): string {
  return TOKENS[tokenSymbol]?.glyph || "";
}
