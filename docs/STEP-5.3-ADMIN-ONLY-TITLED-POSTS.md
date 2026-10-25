# Comos · Step 5.3 — Admin-only titled posts with replies

Date: 25 October 2026. Source repository: `PhoeZAung/comos-cloud-test`. This replaces the prior world/party-dependent composer and does **not** change Firebase sign-in, administrator provisioning, admin panels, or existing world/party data.

## Product behavior

- **5.3.1 Admin-only publishing.** The server checks the verified Firebase-session administrator UID before creating any post. Ordinary authenticated users cannot post by tampering with the button, JSON, query, cookie role, or request headers. The new composer has no world/party selectors; all newly published posts are site-wide and readable to **signed-in Comos users**. Existing historical world/party posts are preserved with their original access controls.
- **5.3.2 Title + description.** Optional title, max 140 Unicode code points, and required description, max 2000 Unicode code points. The title is stored in additive SQLite migration `009-post-titles.sql` with `NOT NULL DEFAULT ''` so existing posts and replies survive. Replayed client request IDs are idempotent, including the title.
- **5.3.3 Clickable feed cards.** Home contains only people-authored posts; the author name and relative timestamp appear at the top, then an optional title and a **three-line visual excerpt** of the description. Tap the card to open `/post.html?id=...` to see the full description and replies. The Delete action remains a separate owner-only button.
- **5.3.4 Replies.** Authenticated users may read and reply to new global posts without membership. Existing replies API, author-only reply deletion, and lazy reply loading remain as implemented in Step 5.2. Ordinary users cannot publish a new top-level post.
- **5.3.5 Relative timestamps.** `Just now`, minutes, 1–23 hours, 1–6 days, 1–3 weeks, 1–11 months, 1+ years. Calendar spans are approximated consistently as 30-day months and 365-day years. Home refreshes visible relative labels once a minute; opening post details shows the same format.
- **5.3.6 Failure visibility.** The composer displays `Checking posting permission…`, admin confirmation or a clear denial. It shows `Publishing post…`, a success transition, and readable HTTP/auth/network error messages. It does not silently depend on loading groups or a selected world anymore.

## Manual live tests (numbered like the roadmap)

1. **5.3.1** Sign in as the existing administrator, open `/compose.html`. Check that **no world or party fields** appear and permission status says ready. An ordinary account should see `Only the Comos administrator can create posts` and a disabled Publish button.
2. **5.3.2** Enter a title and description, tap **Publish post**. The button changes state and then Home opens; title and description show on the new post. With an empty title and a description, publishing also works. If status reports an access or network error, capture the exact text.
3. **5.3.3** Open `/home.html`. Check only actual people-authored posts appear, newest first. Long descriptions show about three lines with the remainder visible after tapping the post. Tap anywhere on the main post content to reach detail; the title should become the header.
4. **5.3.4** As a different signed-in user with **no membership**, Home should display the new global post. Tap it and reply; refresh and confirm the reply persists. The same user must not see a compose `+` button and must receive HTTP 403 if attempting the posts API.
5. **5.3.5** Confirm the timestamp near the author shows something like `1 minute ago`, `1 hour ago`, `1 day ago`, `1 week ago`, `1 month ago`, and `1 year ago` as posts age. Check screen reader `<time datetime>` has a real absolute timestamp.
6. **1.1** Check Home, Compose and the Post detail screen on phone width ~320px/390px; no horizontal scroll, no clipping, and clear error text.
7. **4.1–4.3** Verify existing admin Groups, Character Controls and Item Controls and Firebase login still work. They were not replaced by demo files.

## Deployment and boundaries

A change pushed to GitHub is expected to auto-deploy through the existing Railway connection; no ChatGPT-to-Railway connection is needed. Wait for the **GitHub deployment status** to show success before testing live. Cloud browser access to the live site may be blocked; manual account-posting tests must not be reported as passed unless actually performed.

No credentials or account emails are embedded in the source. The designated owner retains admin rights only if the server's existing `COMOS_ADMIN_BOOTSTRAP_EMAIL` or `COMOS_ADMIN_FIREBASE_UIDS` verification resolves to the signed-in Firebase UID. If the new composer displays an administrator-access denial, do not bypass the server role—verify the existing server provisioning instead.

The storage is the existing persistent SQLite database. The additive `009` migration does not drop `feed_posts` or `feed_replies`; previous migrations are immutable. The new title field appears in both the feed and post detail API. This slice remains text-only (including typed emoji); image/GIF uploads and character personas remain deferred.

## File changes

New: `backend/db/migrations/009-post-titles.sql`, `src/features/home/time.mjs`, `tests/admin-only-posts.test.mjs`, `tests/admin-posts-http.test.mjs`, this README.

Updated: `backend/posts/service.mjs`, `backend/posts/routes.mjs`, `src/pages/compose.mjs`, `src/ui/compose.mjs`, `src/ui/feed.mjs`, `src/features/home/feed.mjs`, `src/features/home/thread.mjs`, `src/preview/home-ui.mjs`, `src/styles/feed-additions.css`, and existing test expectations/fixtures for the new admin-only permission rule. The existing admin/authentication files and QNAP migration plan remain untouched.