# Specification

## Summary
**Goal:** Configure correct Internet Computer mainnet ledger canister IDs for ckBTC, ckETH, and ckUSDC so their Send UI is enabled.

**Planned changes:**
- Update `frontend/src/config/tokens.ts` to set `TOKENS.ckETH.ledgerCanisterId` to `ss2fx-dyaaa-aaaar-qacoq-cai`.
- Update `frontend/src/config/tokens.ts` to set `TOKENS.ckBTC.ledgerCanisterId` to the official mainnet ckBTC ledger canister ID (not undefined).
- Update `frontend/src/config/tokens.ts` to set `TOKENS.ckUSDC.ledgerCanisterId` to the official mainnet ckUSDC ledger canister ID (not undefined).
- Verify the Dashboard Tokens section no longer shows “Not configured” for ckBTC/ckETH/ckUSDC and the send form renders for each.

**User-visible outcome:** On the Dashboard Tokens section, ckBTC, ckETH, and ckUSDC no longer show “Not configured,” and each token’s send panel displays the send form.
