# Comos integration packet — feed-first Home and Lore 6.1

Date: 2026-10-24 (America/Denver). Repository: `PhoeZAung/comos-cloud-test` (`main`). This change supersedes the earlier Home Dashboard prototype. **Home is now exclusively a chronological, Twitter-style timeline**, with no nebula hero, world gallery, quick-links sidebar, or latest-activity dashboard boxes.

## Changes and feature ownership

- **Step 5.1 — Home timeline UI:** `src/features/home/feed.mjs` renders author/avatar initials, persona labels, dates, scope chips, post text, reply counts, simple pagination, and the existing + compose link. `src/pages/home.mjs` renders the timeline. `src/preview/home-ui.mjs` supplies 7 fictional posts in isolated Ghost preview; synthetic posts never appear in live mode. `src/features/home/dashboard.mjs` and its old test are retired.
- **Step 6.1 — Lore browsing UI:** `src/features/lore/library.mjs` renders world/party/player filters, search, four sorts (newest, oldest, A–Z, Z–A), cards and pagination over *already authorized* entries. `src/pages/lore.mjs` contains the live empty/loading-ready scaffold. `src/preview/lore-ui.mjs` supplies fictional entries for Ghost-only interactions. No legacy stories were imported.
- `src/ui/shell.mjs` mounts preview adapters only when `document.body.dataset.mode==='fixture'`.
- `scripts/build.mjs` copies new preview adapter and the feature modules and adds `src/styles/feed-lore.css` to the bundle.
- `src/styles/site.css` removes the obsolete Home-dashboard CSS but retains Character Cards styling; `src/styles/feed-lore.css` adds responsive timeline and Lore styles.
- `tests/home-feed.test.mjs` and `tests/lore-library.test.mjs` cover the new deterministic render/filter/pagination code.
- `docs/STATUS.md` records the limited implementation status; historical Home documentation is superseded by this packet.

**Protected, not changed:** `backend/**`, `src/auth/**`, `src/account/**`, current Groups/Admin implementations (Steps 4.1–4.3), SQL migrations, `public-auth.json`, and legacy `PhoeZAung/Mount-Aetheria`.

## Numbered manual acceptance checklist

1. **5.1.1 — Feed-only layout:** Open `/home.html`. See a narrow, single-column **Home** timeline, with no world cards, nebula hero, featured content or sidebar. For now, it correctly shows an empty state because real feed persistence is not connected.
2. **5.1.2 — Synthetic timeline:** Open `/preview/home.html`. Check post names, initials, text, fictional World/Party labels, time, reply counts and chronological order. Confirm the Ghost preview label. Nothing here is live user content.
3. **5.1.3 — Pagination:** In Ghost Home click **Older**, then **Newer**. No duplicates or missing records. Refresh resets the fixture view.
4. **5.1.4 — States:** Use the Ghost **Test state** dropdown to check Loading, Empty, Error and Sample posts. The + button opens `/preview/compose.html` and the existing compose placeholder; no real post is saved yet.
5. **6.1.1 — Lore filters:** Open `/preview/lore.html`. Switch World 01 → World 02 and choose Party B. Only entries in the matching synthetic world/party should appear. Reset to all worlds and filter **Player → Personal only**.
6. **6.1.2 — Search and sorting:** Search `observatory` and submit. Clear the query. Try Newest, Oldest, A–Z, Z–A. Sort order and filtered count should update correctly.
7. **6.1.3 — Pagination and states:** With all filters reset, change pages, then choose Loading/Empty/Error via the preview state selector. Open an **Entry preview** link; Phase 6.2 remains a placeholder.
8. **6.1.4 — Live boundary:** Open `/lore.html` in live mode. No synthetic lore should appear. Real lore records and scope options require authorized API endpoints that do not exist yet.
9. **1.1 — Phone / zoom:** At widths 320 px and 390 px and 200% browser zoom, check both Home and Lore for no sideways overflow, clipped buttons, unreadable text, or hidden search controls; use keyboard navigation and Back/refresh.
10. **4.1–4.3 / 2 — Regression:** In Characters → Admin panel, verify admin-only Groups, Character Controls and Item Controls still function and ordinary accounts cannot read or write admin APIs. Check sign in/out and themes. No access decisions come from the frontend.

## Verification and limitations

8 new focused Node tests passed under Node 22 in the isolated source folder, covering output escaping, four Lore sorts, intersecting filters, pagination and state behavior. The current project's full test/build suite requires the complete checkout and Node >=24; it was not run in this isolated environment. Browser automation was blocked by policy, so responsive appearance and live clicking still require manual verification. GitHub deployment status is checked via GitHub, not by requesting Railway account access.

**Not yet implemented:** Step 5.1 server-scoped feed API, post/reply persistence, attachments, authorization and deletion; Step 5.2 replies; 5.3 composer/persona persistence; 5.4 ownership rules; Step 6.2 full entry reader; Step 6.3 admin Lore editor; Step 6.4 scoped paginated Lore API and migration. Client-side filters are NEVER security controls: backend queries must enforce world/party/player scopes before any private names or records are returned.

Next coherent batch: Step 5.1 authenticated, membership-scoped feed storage and cursor API, followed by post viewing and composer in Steps 5.2–5.4. Lore data integration can proceed once those server scope contracts are established.