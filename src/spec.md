# Specification

## Summary
**Goal:** Persist and share a locally-stored transport key context between Dashboard and Compose using a frontend “vetKey”, so Compose can reuse an existing keypair across navigation and reloads without regenerating keys.

**Planned changes:**
- Add a frontend vetKey mechanism that persists the caller’s transport keypair locally (session-scoped) and can restore it after route changes and full page reloads within the same browser session.
- Update Dashboard to display the current vetKey and provide actions to copy it and/or navigate to Compose with the vetKey included in the URL (query or hash parameter).
- Update ComposeMessagePage to read vetKey from the URL (and/or session), initialize transport key access using that vetKey, and ensure send-eligibility logic uses the restored local keypair when available.
- Add safe handling and clear English messaging when vetKey is missing/invalid (e.g., disable Dashboard action or show an error toast; Compose does not crash and shows existing diagnostics).

**User-visible outcome:** After generating/rotating a transport key on the Dashboard, the user can open Compose (including via a vetKey link in the same browser session) and send messages without seeing a “key not available on this device/tab” error, while the transport private key remains local-only.
