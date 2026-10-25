# Comos — current handoff

Version 0.7.0 · 24 October 2026. Active repository: PhoeZAung/comos-cloud-test. Current checkout: comos-cloud-test/. Earlier comos-template and transfer ZIPs are historical snapshots.

## Working deployment
Railway service feisty-freedom, domain https://feisty-freedom-production-304e.up.railway.app. Firebase project mount-aetheria retains Google and email/password identity. User confirmed phone login and the 0.3.0 shell/install update. Private server credentials are configured in Railway, never in source. Persistent database/media use /data. QNAP remains the future native host; no legacy data was imported or deleted.

## Implemented
- Shared tab navigation, direct HTML fallback, Back/refresh, isolated sheet and Ghost preview.
- Galaxy background, static/reduced-motion fallback, PWA manifest/shortcuts and safe offline notice.
- Firebase session/login/onboarding foundations and bounded authentication requests.
- Steps 3.1/3.2: editable names/photos, four automatically saved two-colour themes, default-off splash and theme-colour effect preference. See ACCOUNT.md.
- 49 automated tests pass. Current production dependency audit: zero vulnerabilities.

## Verification limits / next
Authenticated phone edits, uploaded photos across sessions, splash rendering and saved theme switches need the device acceptance checklist in ACCOUNT.md. WebGL is unavailable in this QA browser. Password reset and full session revocation acceptance from LIVE-ACCEPTANCE.md remain to confirm. No test here claims a production-scale catalog, permissions model or migration.
Steps 4.1/4.2/4.3 are implemented. Owner admin provisioning is configured through a private host email setting and a server-resolved, pinned Firebase UID; verify the runtime bootstrap status and phone access. See ITEM-CONTROLS.md. Next: Step 5.1 scoped Home feed, after owner admin and Groups acceptance. Keep other features as placeholders.

## Run
Node >=24. npm start: isolated static preview. npm ci && npm test: checks. npm run build:cloud and npm run start:cloud: configured cloud build/server (see CLOUD-SETUP.md for environment and volume). Local API is optional and auth disabled by default. Never package credentials, runtime databases, node_modules or private backups. Deployment source is synced to the new repository; old Mount-Aetheria remains read-only.


## Step 4.1 — 0.5.0
World/party/member controls and server-enforced admin access implemented. See GROUPS.md. 41 tests pass. Live admin access requires explicit COMOS_ADMIN_FIREBASE_UIDS configuration; no roles were auto-granted. Account edits are retained.

## Step 4.2 — 0.6.0
Character metadata records, owner transfer, source versions, bounded search/pagination and reversible archive/restore. Live Admin entry is derived from verified server access. No legacy character data imported; wizard and sheets remain pending. See CHARACTER-CONTROLS.md. 44 tests pass.

## Step 4.3 and owner access — 0.7.0
Item metadata add/edit/search/source filters, summary/detail separation and archive/restore implemented. Shared server admin request helpers enforce real sessions and host-selected UIDs. Host bootstrap resolves the designated owner email using Firebase, requires verification and pins the UID; no private identity is added to public source. The wizard now shows only the current stage and Back/Next, with stage forms still pending Step 8. 49 tests pass; phone-width Ghost QA passed.

## Feed-only Home (Step 5.1 UI) and Lore discovery (Step 6.1 UI)
The former Home dashboard was removed following design feedback: Home is a centered chronological social timeline only, without hero, world cards, or sidebars. The Ghost preview provides fictional paginated posts. Lore Ghost preview now has search, world/party/player filters, four sorts, and paginated cards. Live Home and Lore remain empty until authorized, scoped API data contracts are implemented. No group, admin, Firebase, or account service was modified. Eight focused UI tests passed in an isolated Node environment; full repository build/test and phone UI verification remain pending. See INTEGRATION-PHASES-5-6.md.

## Step 5 — signed-in people posts only (2026-10-24)
Home is now solely a post timeline with no welcome dashboard or preloaded fictional people. API-backed text posts are attributed server-side to real accounts, scoped to allowed worlds/parties, sorted newest-first, and paginated. The composer is activated with the + button. Member-only reads, author-only deletions, Origin verification, and idempotent creates are implemented. No Firebase provider/configuration changes were made; see STEP-5-PEOPLE-POSTS.md. Ghost mode starts with zero posts and contains only posts explicitly written during the preview session. Six focused tests passed in an isolated Node/SQLite harness; full repository suite, real credentials, and phone/live acceptance require separate verification.

## Step 5.2 — individual post details and text replies (2026-10-24)
A Reply link on each Home post opens `/post.html?id=...`. Post and replies are loaded lazily, not from the Home timeline. Members can write text replies attributed to their real account, load more replies, and delete their own replies. Server enforces post world/party access for reads and writes, preserves idempotent retries, and deletes replies when their parent post is deleted. Ghost continues to start empty. Existing Admin and Firebase authentication are preserved; no fake people are injected. Focused Node/SQLite tests: 13 passed (7 new + 6 existing). Image/GIF replies, emoji picker, and signed-in phone/browser acceptance are pending. See STEP-5.2-POST-REPLIES.md.

## Step 5.3 — Admin posting without membership (24 Oct 2026)
Verified administrators may publish a global people-authored post without a world or membership, including before any worlds are configured. Global posts are visible only to signed-in users. Admins may also post to any existing world/party without joining; ordinary users remain restricted to their memberships. Existing posts and replies are preserved via migration 008. See STEP-5.3-ADMIN-GLOBAL-POSTS.md; phone/live acceptance remains pending.

## Step 5.3 follow-up — admin-only titled global posts (2026-10-25)
The Comos Home screen contains only actual people-authored posts; no dashboard content. **Only the verified administrator may publish new top-level posts.** The world/party selector is removed from the composer; new posts are site-wide and readable/replyable by any authenticated user, with no membership required. Titles (optional, 140 characters) persist through additive migration 009. The feed shows clickable cards with three-line description excerpts and timestamps in minutes/hours/days/weeks/months/years. The full post detail shows title, untruncated text, and replies. Composer permission checks now show explicit ready/denied/network/publish states instead of silently waiting for group memberships. Historical world/party posts retain their existing privacy rules. See STEP-5.3-ADMIN-ONLY-TITLED-POSTS.md; signed-in phone testing remains pending.
