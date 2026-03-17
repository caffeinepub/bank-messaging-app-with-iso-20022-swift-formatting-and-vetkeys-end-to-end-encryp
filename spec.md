# OP_DUP Secure Messages

## Current State
The app is a fully functional decentralized encrypted messaging and token transfer dapp on ICP. Users authenticate via Internet Identity and can freely register, set up profiles, add trusted contacts, and exchange encrypted messages. There is no access gate -- anyone with the URL can sign up.

## Requested Changes (Diff)

### Add
- Invite-links component integration: only users with a valid invite link can register and access the app
- Admin invite link management UI on the Dashboard (generate and copy invite links)
- Invite gate check in AuthGate: after authentication, if the user is not yet approved/registered via invite, show an "access restricted" screen with instructions to obtain an invite link

### Modify
- AuthGate to check invite/access status after authentication before showing the app
- DashboardPage to include an invite link management section for admins

### Remove
- Nothing removed

## Implementation Plan
1. Select and integrate the `invite-links` Caffeine component
2. Wire invite-links access check into AuthGate so unapproved users see a clear "You need an invite link to access this app" screen
3. Add invite link generation UI to DashboardPage for the admin user
4. Validate and build
