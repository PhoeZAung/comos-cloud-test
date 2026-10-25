# Comos — Phase 5.2: Open posts and reply (text slice)

Baseline: `PhoeZAung/comos-cloud-test` commit `1e1fac25b3eb205a28459ef69e1177eaf61b92c3` (2026-10-24).

## Product rule
Home contains **only actual user-created posts**. No dashboard, mock people, pinned news, cards for worlds, recommendations, or stand-alone reply tiles in Home. Each post gets a small **Reply** link that opens its own post detail page. Replies are **loaded only after opening a post**, never in the Home feed request.

## Roadmap/testing

- **5.2.1 — Open a post:** Sign into Comos and open `/home.html`. After publishing a post, tap **Reply** on that post. `post.html?id=<post-id>` must display the correct author and text, with Back → Home.
- **5.2.2 — Write a reply:** Use the textarea in the post detail (up to 2000 Unicode characters; emoji works as typed text). The reply is attributed to the actual signed-in Comos user. A second member of the same world/party can reply. The post's owner is not automatically the reply owner.
- **5.2.3 — Load more:** After more than 20 replies, **Show more replies** fetches the next page. Newest first with stable cursor tie-breaking; no duplicate entries. Opening Home should never fetch reply threads.
- **5.2.4 — Security:** Signed-out readers get 401. Members outside the world/party get 404 for both post detail and replies; revoking membership hides them immediately. Malformed content, supplied authorId, wrong Origin and direct cross-account deletion must be rejected. Re-submitting the same request ID does not double-post. A person can delete only their own reply.
- **5.2.5 — Deletion:** Deleting the parent post deletes its reply records via SQLite foreign-key cascade. Existing post delete permissions remain author-only.
- **5.2.6 — Ghost preview:** `/preview/home.html` starts with no fake posts. Create one with the Ghost composer, open it, and reply; Ghost replies exist only in memory and vanish after refresh. They cannot hit the actual backend.
- **1.1 — Phone:** At 320/390px and 200% zoom, check that reply text wraps, the Reply link is reachable, and the textarea/submit button stay on screen.
- **2/4 regression:** Verify Firebase login, Admin Groups, Character Controls, Item Controls, and existing post creation/deletion still function.

## Changes

New:
- `backend/db/migrations/007-post-replies.sql`: additive reply storage with post deletion cascade and a (post, created, id) index.
- `backend/posts/replies.mjs`: post-scoped reply service, source-controlled pagination, input validation, author-only removal and idempotent creates.
- `backend/posts/reply-routes.mjs`: authenticated GET detail, GET/POST replies, DELETE own reply, with exact Origin checks.
- `src/features/home/thread.mjs`: escaped presentation only; no data-fetching side effects.
- `src/ui/post-thread.mjs`: lazy post/reply loader and Ghost adapter.
- `src/styles/thread.css`: compact post detail styling.
- `tests/post-replies.test.mjs`: seven new Node/SQLite tests.

Modified:
- `backend/posts/service.mjs`: a single `get(userId,id,{admin})` method that enforces the same world/party access rule as Home and returns reply count for that specific post.
- `backend/http/app.mjs`: dispatch reply routes before post deletion routes.
- `backend/auth/firebase.mjs`, `backend/cloud.mjs`, `backend/main.mjs`: register new routes using the **existing** trusted session and admin UID set; no login or identity settings changed.
- `src/pages/post.mjs`: post detail placeholder replaced by a loading mount point.
- `src/features/home/feed.mjs`: only adds a small per-post Reply link; Home remains just posts.
- `src/ui/shell.mjs`, `scripts/build.mjs`: lazy mount and bundle the new modules.
- `docs/STATUS.md`: phase progress with verification limits.

## API contracts

- `GET /api/v1/posts/{uuid}` -> `{post,viewerId}` only for authorized readers. Hidden and absent records both return 404.
- `GET /api/v1/posts/{uuid}/replies?cursor=...` -> `{replies,nextCursor,viewerId}`, at most 20 replies per page. Access to parent checked first.
- `POST /api/v1/posts/{uuid}/replies` -> `{reply}`; body `{text,clientRequestId}`. Author ID is always derived from session.
- `DELETE /api/v1/replies/{uuid}` -> `{deleted:true}`, only for reply author.

The public API does not support images, GIFs, uploads, rich emoji pickers, moderation tools, character personas, or nested replies yet. Those are later substeps; **the text-only slice is not a claim that all of Phase 5.2 is complete**.

## Verification and safe integration

7 new backend/UI focused tests + 6 previous feed tests passed using Node 22 SQLite. Full monorepo test/build, Chrome/Android UX, and signed-in live smoke tests must be checked separately; no fabricated production accounts or posts were used. The migration is additive: do not edit migrations 001–006, copy `dist/` from older ZIPs, overwrite the active auth branch, or touch QNAP files. All changes must be reviewed against the current GitHub head before commit.