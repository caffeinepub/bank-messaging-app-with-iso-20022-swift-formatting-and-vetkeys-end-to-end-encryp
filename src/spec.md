# Specification

## Summary
**Goal:** Add read-only token ledger diagnostics to confirm ckBTC/ckETH/ckUSDC mainnet ledger canister IDs are wired correctly, without performing any transfers.

**Planned changes:**
- Add a token configuration self-check that compares configured ledger canister IDs in `frontend/src/config/tokens.ts` against expected mainnet ledger IDs and reports match/mismatch (including a safe “Not configured” state).
- Add a “Token Ledger Diagnostics” panel on the Dashboard showing, per token, the configured ledger canister ID, expected mainnet ID match status, and a “Copy JSON” diagnostics report (with timestamp and per-token fields).
- Add a non-transfer connectivity/metadata verification per configured ledger canister using read-only ICRC calls (e.g., decimals and other available metadata) and surface success/failure and errors in the diagnostics UI.

**User-visible outcome:** On the Dashboard, users can verify ckBTC/ckETH/ckUSDC ledger wiring via a dedicated diagnostics panel that shows configuration status, expected-ID matching, read-only ledger metadata check results, and a copyable JSON report—without sending any tokens.
