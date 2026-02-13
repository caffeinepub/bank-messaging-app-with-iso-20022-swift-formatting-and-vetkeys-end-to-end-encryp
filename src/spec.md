# Specification

## Summary
**Goal:** Store encrypted messages on-chain as ciphertext-only records tied to sender/receiver Principals, and restrict message retrieval so only those participants can access a message by id.

**Planned changes:**
- Persist each message on-chain with two Principal fields (Sender and Receiver) alongside ciphertext payload and encrypted symmetric key; ensure no plaintext content is stored.
- Add a backend API to fetch a single message by id with authorization checks (caller must be Sender or Receiver) and clear unauthorized/not-found errors.
- Update the message detail view to fetch by id via the new API and show clear English UI states for unauthorized and not-found responses.
- Update participant labels in message details to display as “Sender” and “Receiver” (Principals).

**User-visible outcome:** Opening a message detail page loads that message directly from the backend; only the sender/receiver can view the encrypted record, and others see an authorization error, while missing messages show a “Message not found” state with a way back to the inbox.
