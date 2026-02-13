# Specification

## Summary
**Goal:** Add end-to-end encrypted messaging so message plaintext is generated and encrypted on the client, stored/transmitted only as ciphertext, and decrypted only on recipient devices.

**Planned changes:**
- Frontend: On ComposeMessagePage, generate ISO 20022 / SWIFT plaintext locally, encrypt it with a fresh per-message AES-GCM key/IV, encrypt that AES key using the recipient’s registered RSA public key (RSA-OAEP), and call sendMessage with only encryptedPayload plus the RSA-encrypted symmetric key (no plaintext).
- Frontend: Block sending and show a clear English error when the recipient has no registered publicKey.
- Backend: Update getMessages to return both received and sent messages for the authenticated user (m.to == caller OR m.from == caller) while keeping message content as encrypted bytes only.
- Frontend: Update InboxPage to display both incoming and outgoing messages (e.g., “Received” / “Sent” badges) based on the updated retrieval behavior.
- Frontend: On MessageDetailPage, decrypt messages client-side using the user’s locally stored private key; show clear English error states when the local private key is missing or decryption fails.
- Frontend + Backend: Rename/clarify the encrypted symmetric key field end-to-end so it is not labeled as a “vetKey”, while keeping send/store/list/decrypt interoperability intact.

**User-visible outcome:** Users can send and read messages where content is encrypted before it leaves their device, the inbox shows both sent and received messages, and the UI clearly blocks/alerts when encryption keys are missing or decryption cannot be performed.
