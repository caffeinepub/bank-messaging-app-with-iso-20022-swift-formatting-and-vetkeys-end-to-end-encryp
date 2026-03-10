# OP_DUP Secure Messages

## Current State
The project has an existing backend and frontend from previous incremental patches. The frontend/backend have suffered repeated IDL mismatches, timing bugs, and config error regressions. A full clean rebuild is required.

## Requested Changes (Diff)

### Add
- Clean, stable backend with all required functions properly exposed
- Reliable frontend that reads vetKey synchronously on load (not inside useEffect)
- Config error screen that only shows after a genuine backend call failure
- Dashboard: transport key diagnostics, token balances (ckBTC, ckETH, ckUSDC) with Refresh button
- Compose: encrypts message using vetKey+keyPair loaded synchronously; fetches recipient public key via `getContactPublicKey` at send time
- Inbox: shows sent and received messages
- Contacts: add/remove trusted contacts with relationship status
- Landing page: app name "OP_DUP Secure Messages", accurate info about ckBTC/ckETH/ckUSDC, decentralization disclaimer, no deployment guide references
- Token send: real on-chain ICRC-1 transfer, shows block index on success

### Modify
- Backend: clean single source of truth with `getContactPublicKey` for mutually trusted contacts only
- Frontend declarations (backend.did.d.ts, backend.did.js, backend.ts): fully in sync with backend
- AuthGate: config error only after isError=true AND not initializing

### Remove
- All references to deployment guide or system administrator in error screens
- ISO 20022 / SWIFT message type terminology from the UI (keep as internal enum but show as "Encrypted Message" to users)

## Implementation Plan

### Backend functions
- `getCallerUserProfile()` -> own profile
- `saveCallerUserProfile(profile)` -> save own profile with publicKey
- `getContactPublicKey(contact)` -> public key of mutually trusted contact only
- `getRelationshipStatus(other)` -> SyncStatus with callerHasPublicKey, otherHasPublicKey, isMutuallyTrusted, callerTrustsOther, otherTrustsCaller
- `addTrustedContact(user)` -> add contact
- `removeTrustedContact(user)` -> remove contact
- `getTrustedContacts()` -> list
- `isTrustedContact(user)` -> bool
- `sendMessage(to, messageType, encryptedPayload, encryptedSymmetricKey)` -> message id; requires mutual trust
- `getAllMessagesForCaller()` -> sent + received
- `getMessageById(id)` -> single message
- `getUserProfile(user)` -> admin only (kept for admin use, not called from main send flow)

### Frontend key points
- vetKey loaded on component mount; stored in ref for synchronous access at send time
- `getContactPublicKey` called at send time to fetch recipient public key fresh
- Token balances fetched via ICRC-1 `icrc1_balance_of` on mainnet ledger canisters
- Token send via ICRC-1 `icrc1_transfer`; show block index result
- No "deployment guide" text anywhere
- Landing page: OP_DUP Secure Messages branding, ckBTC/ckETH/ckUSDC info, decentralization disclaimer
