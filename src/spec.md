# Specification

## Summary
**Goal:** Add distinct, human-friendly glyph symbols for ckBTC, ckETH, and ckUSDC and show them consistently across the dashboard and send/receive UI.

**Planned changes:**
- Extend `frontend/src/config/tokens.ts` to include a per-token glyph for ckBTC, ckETH, and ckUSDC, plus a simple helper/accessor to retrieve it by token key.
- Update `frontend/src/components/dashboard/TokensSection.tsx` to display the configured glyph alongside the token ticker for each token.
- Update `frontend/src/components/dashboard/TokenReceivePanel.tsx` and `frontend/src/components/dashboard/TokenSendPanel.tsx` to include the configured glyph anywhere the token symbol is presented (headings, primary action button text, and success messages), without changing existing validation/disabled behavior.

**User-visible outcome:** Users see recognizable glyphs (e.g., ₿/Ξ/$ or similar) next to ckBTC/ckETH/ckUSDC in the dashboard tokens list and throughout the send/receive panels for clearer at-a-glance token identification.
