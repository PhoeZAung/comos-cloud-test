# Step 4.1 — Worlds, parties and memberships (0.5.0)

Admin Groups supports creating/renaming up to four worlds, adding/renaming parties within a world, searching signed-in Comos players and saving their world/party membership sets. Existing Comos user IDs are the stable player identities. Live worlds start empty; no legacy category names were guessed. Ghost preview starts with four numbered sample worlds and two synthetic players; changes stay in memory until refresh.

Live administration requires COMOS_ADMIN_FIREBASE_UIDS in Railway service variables: a comma-separated allowlist of Firebase Authentication UIDs. Obtain your own UID from Firebase Console > Authentication > Users and add it there, then apply/redeploy. Do not use email addresses, public API keys or service-account IDs. No administrator is granted automatically, no client button/query/header grants access, and membership editors cannot promote administrators. Removing a UID from this setting removes its admin authority after the service restarts. Keep ownership settings restricted to the host owner.

The Groups API verifies the real session on every request, checks the server allowlist before reading any player/group names, and verifies the exact Origin on writes. A global revision rejects stale edits. Membership replacement is transactional; party access requires membership in that party's world. Existing parties cannot silently move to another world. Maximum 4 worlds/200 parties. Player search returns at most 50 records and asks for a narrower search when needed. Only the selected player's memberships load; full character sheets, feed and shop data never load here.

Migration 003 creates the group tables and preserves existing account/profile records. The reusable server canView predicate requires all specified world/party/player scopes to match. Tests cover another world, party, personal scope, removed membership and admin-only data access. Future Feed/Lore APIs must apply this predicate to their own scoped queries; those APIs are not built in this step.

What to test — 4.1:
1. Open Characters > Admin panel > Groups. In live mode, expect Administrator access required until your Firebase UID is configured in Railway. Ordinary users must remain denied.
2. Use Ghost preview to rename a numbered world and create a party in it. Check the labels update without a document reload.
3. Select a player, choose world/party access and Save memberships. Switch players and back; the selected sets remain. Removing world access while its party stays selected must show an error.
4. After admin configuration, repeat in live mode using your actual world names. Refresh and confirm persistence. Only users who have signed into Comos appear; the old Firebase/Firestore exports are not imported.
5. Open two admin tabs. Save a change in one, then attempt an older edit in the other: it must reject the stale revision; use Reload groups before editing again.

Verification: 41 automated tests pass, including scope conjunction/revocation, world cap, stale writes, role/header/query forgery, signed-out denial and cross-origin denial. Browser fixture checks covered world rename and party creation. Real admin configuration and phone membership acceptance remain user checks. Groups is the only implemented Admin tab; character/item controls remain placeholders.
