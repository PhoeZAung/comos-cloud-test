# Comos Step 5.3 — Admin may post without world membership

2026-10-24. Repository: `PhoeZAung/comos-cloud-test`. This focused release updates the existing feed and composer, not Firebase authentication or Admin Groups.

## Behavior

- A server-verified administrator may choose **Everyone on Comos (site-wide)** in New post and publish without a world, party, or membership. This works even before any worlds are created. The post is stored as a normal people-authored post under the authenticated administrator's account, not a system/sample account.
- All *signed-in* Comos users can see and reply to this site-wide post. Signed-out API callers still receive HTTP 401. This does **not** make the post public on the internet.
- An admin can optionally choose any existing world and party without being assigned to it. These posts retain their world/party audience rules for ordinary viewers.
- Non-admin users still need membership in a world to post there; party-specific posts require party membership. A forged `admin` field, role header or client-side selector cannot grant privileges. Admin status is derived from the verified Firebase session and the existing server allowlist/pinned owner UID.
- If the owner does *not* already have a working Admin Panel, this update does not automatically grant administration. The existing owner bootstrap must be healthy. Do not weaken server auth or place owner email/UID secrets into frontend source.
- Existing Home stays **posts only**, with no dashboard, welcome hero, sample content, or promotional panels.

## Exact source changes

- **New** `backend/db/migrations/008-admin-global-posts.sql`: transactional rebuild of `feed_posts` to allow null `world_id` only with null `party_id`, preserving existing posts, their associated replies, foreign keys, and indexes. Old migrations stay unchanged. SQLite migration runs automatically in the existing DB startup migration flow; back up production data before any database schema deployment.
- **Modified** `backend/posts/service.mjs`: nullable world scope for verified admins, global visibility to signed-in users, LEFT JOINs to retain global posts in feed and detail, unchanged world/party visibility for scoped posts, server-supplied `admin` flag in scope selection.
- **Modified** `src/ui/compose.mjs`: the first world option for verified admins is **Everyone on Comos (site-wide)**; world is optional for them. Regular users still must select or have an eligible world. Global posting submits `worldId:null,partyId:null`.
- **Modified** `tests/backend.test.mjs`: change expected schema version and migration count from 7 to 8.
- **New** `tests/admin-global-posts.test.mjs`: 5 integration tests for admin role checks, HTTP forgery rejection, global visibility, existing replies/migration preservation and standard member restrictions.
- **Modified** `docs/STATUS.md`: current phase note.

## What to test

1. **5.3.1 — Admin without world membership:** Sign in as the owner admin, tap Home **+**, choose **Everyone on Comos (site-wide)**, write a short post, and tap **Post**. This must work without joining a world; check that the new post appears on Home under your real display name.
2. **5.3.2 — No worlds yet:** If the Admin Groups page has no configured worlds, the same site-wide admin posting option should still work. Do not create a fake or fifth world.
3. **5.3.3 — Other signed-in person:** Have a different signed-in account with *no world membership* open Home. They should see the site-wide post and be able to reply. Signed-out users should be asked to sign in rather than seeing the feed.
4. **5.3.4 — Ordinary member restrictions:** Sign in as a non-admin. The **Everyone** option must not appear. Members can select only permitted worlds/parties; users with no world access cannot post even if they manipulate the request.
5. **5.3.5 — Existing scoped privacy:** As admin, choose an existing world or party and submit a scoped post without joining. Members outside the specified audience must not see it.
6. **5.3.6 — Regression:** Confirm existing older posts and replies survive after deployment and still open correctly; delete a newly created admin post and verify linked replies are removed. Verify Admin Groups, sign-in and profiles remain functional.
7. **1.1 — Phone/zoom:** Check the composer dropdown, Post button and Home card layout at 320px and 390px screen width and with browser zoom set to 200%.

## Verification notes

18 targeted Node/SQLite checks passed locally (5 new, 13 existing tests). Migration was exercised inside a SQLite transaction with foreign keys on, an existing post, a real reply and subsequent deletion. The full current repository suite, deployed Firebase Admin UID setup, production data backup, and actual signed-in browser/phone checks require separate verification. A green deployment status is not proof that these manual acceptance tests passed.

## Backwards compatibility

Previous migration SQL files 001–007 are immutable. Migration 008 is additive in versioning but rebuilds the `feed_posts` and `feed_replies` tables *inside the migration transaction* to change world scope nullability safely. Foreign key and reply preservation should be verified with production backups. Existing post IDs, reply IDs, request IDs and authors remain unchanged. A user granted Admin Panel by actual server-side Firebase UID verification gets the ability automatically; no new environment variables or Railway connector are needed.