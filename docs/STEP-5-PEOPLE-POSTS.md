# Comos integration — Step 5 Home: real member posts only

Baseline: `PhoeZAung/comos-cloud-test` commit `517e9ab7e43c7afb9dd5c2f1531890c7ecc51c5b` (24 Oct 2026). This change supersedes the previous fictional Ghost timeline and the unused dashboard descriptions. Comos Home has **only people-authored posts**, arranged newest first, with a + button to compose. No promo banner, universe dashboard, world cards, fake posts, activity panel, or extra Home filters. Phase numbers are recorded here, not displayed as site decoration.

## Features and what to test

- **5.1.1 — Real posts:** Open `/home.html` while signed in. Home should display only actual saved posts authored by real Comos users in authorized worlds/parties. With no posts, it says **No posts to show yet.** There are no automatic/sample posts.
- **5.1.2 — Chronological pagination:** Publish 21+ real posts in a permitted world. They should be newest-first with a **Show more posts** button, without repeated IDs. Refresh and verify persistence. Group revocation should remove inaccessible posts immediately.
- **5.1.3 — Private visibility:** Another user outside a world/party must not see its posts, even by manually requesting `/api/v1/feed`. Signed-out feed API requests return 401, not an empty public data dump. An admin can see posts across worlds after server admin verification.
- **5.1.4 — Delete own posts:** Owner sees Delete and must confirm. Other accounts cannot delete the post even by issuing a direct DELETE request. No viewer impersonation via supplied author IDs.
- **5.3.1 — Compose:** Click Home `+`, write up to 2,000 characters, select an authorized world (and optional party), and tap Post. The newly created post appears on Home under the actual account display name. The composer has no fictional personas. Posts are text-only in this slice; images, GIFs, emoji-picker, and replies are deferred.
- **5.3.2 — No world access:** A signed-in user without world membership cannot submit a post; the composer says to request access from a Comos admin. Only membership/world names authorized for that user are returned to the selector. A configured server admin can post to any existing world.
- **5.3.3 — Retry and CSRF:** An interrupted submission with the same client request ID must not duplicate the post. Wrong Origin, unsigned sessions, and foreign-user writes are rejected.
- **5.1.5 — Ghost:** Open `/preview/home.html`. It must start with zero posts, not fictional people. Go to Ghost composer, write a post, return via the app navigation, and verify it appears under **Preview explorer**. Refreshing the preview resets it. Ghost cannot call the backend or persist data.
- **1.1 — Phone checks:** Test Home and composer at 320px/390px widths and 200% zoom. Check + placement, post wrapping, submit controls, and no sideways scroll. Real phone acceptance remains manual.
- **2 / 4 — Regression:** Sign-in/out, Admin Groups, Character Controls, and Item Controls must continue to work. No Firebase code, private variables, or existing admin permissions were rewritten beyond registering posts as a separate authenticated backend route.

## New files

`backend/db/migrations/006-posts.sql` — additive schema; previous migrations untouched.
`backend/posts/service.mjs` — SQL-backed scoped pagination, strict input validation, idempotent create, author-only delete.
`backend/posts/routes.mjs` — session-authenticated JSON API: `GET /api/v1/feed`, `GET /api/v1/feed/scopes`, `POST /api/v1/posts`, `DELETE /api/v1/posts/{id}`. Anti-CSRF exact Origin on writes.
`src/ui/feed.mjs` — live Home fetch/mount; shows real posts only.
`src/ui/compose.mjs` — live and Ghost composer; world/party choices derived from server membership.
`tests/feed-posts.test.mjs` — six Node/SQLite security and functionality tests.

## Modified files

`backend/auth/firebase.mjs`, `backend/http/app.mjs`, `backend/cloud.mjs`, `backend/main.mjs` — register posts route with the existing verified session and `adminUids` and HTTP server; no auth provider change.
`src/features/home/feed.mjs` — minimal posts renderer without fictional content or reply placeholders.
`src/preview/home-ui.mjs` — no preloaded people/posts. It reads the isolated in-memory Ghost fixture store only.
`src/pages/compose.mjs` — real composer form, currently text-only.
`src/ui/shell.mjs` — mount live feed and composer on their routes.
`scripts/build.mjs` — copy the new UI modules into the preview/live bundles and concatenate the small additional CSS.
`src/styles/feed-additions.css` — post deletion and composer styles.
`docs/STATUS.md` and this handoff — explain status accurately.

## Release and safety notes

This is a first text-only backend slice, **not** the final social platform. The API does not yet implement images/GIFs, reply threads, personas, media scans, moderation tooling, or a public/explore feed. It never returns user posts to a signed-out session. Existing memberships must be configured in Admin Groups before regular users can post or see those scoped posts. All new user-post rows live in the existing persistent SQLite database; no existing data tables are dropped. UI-generated Ghost posts are not production records. The original `Mount-Aetheria` repository remains untouched.

Tests: six focused Node/SQLite tests passed in a local isolated harness (service/API mocked session); the full repository suite and live signed-in browser checks are separate, not implied by this claim. An attempted local Chromium smoke test was blocked by the environment before page load.