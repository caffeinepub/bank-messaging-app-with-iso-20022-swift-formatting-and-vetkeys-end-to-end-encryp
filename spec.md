# OP_DUP Secure Messages

## Current State
Workspace is empty (draft expired). Full rebuild required.

## Requested Changes (Diff)

### Add
- Full app rebuild with admin principal `lmmsf-dqn72-o5wi6-ab664-m7cwl-lejc3-nj6ys-ye6fs-jf3t4-prsqg-kae` hardcoded -- admin bypasses invite-only check and can always register/access the app
- Invite-only access: non-admin users require a valid invite code to register
- Admin can generate invite links from the Dashboard
- E2E encryption: persistent ECDH key pairs stored in localStorage, AES-GCM for message encryption
- Ciphertext-only storage: only encrypted blobs stored on-chain, backend never sees plaintext
- Mutual trust model: both users must add each other as contacts before messaging
- Dedicated `getContactPublicKey` backend function for mutually trusted contacts (bypasses getUserProfile auth restriction)
- Token transfers: ckBTC, ckETH, ckUSDC using real mainnet ledger canister IDs
- Token balance display with Refresh button on Dashboard
- Diagnostics JSON on Dashboard showing key status, trust status, canSend readiness
- No footer branding, no deployment guide references, no SWIFT/ISO 20022 mentions

### Modify
N/A (full rebuild)

### Remove
N/A (full rebuild)

## Implementation Plan
1. Write spec.md (this file)
2. Select authorization and invite-links components
3. Generate Motoko backend with all functional requirements
4. Build React frontend with all views: Landing, Dashboard, Compose, Inbox, Send Tokens
5. Deploy
