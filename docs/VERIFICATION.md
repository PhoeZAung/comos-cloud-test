# Verification — original transferred template

The checks below describe the original Step 0 template. See the Comos update checks at the end for this version.

- 21 HTML pages served HTTP 200 locally.
- 175 local asset/navigation references resolve; all pages reachable from index.html.
- Every page has one main heading and a matching roadmap placeholder.
- Sheet routes omit the Home feed navigation and provide a Characters return link.
- Largest HTML page plus shared CSS: 6,316 bytes uncompressed; no external assets, scripts or catalog requests.
- Browser: landing visually inspected; Ghost mode clicked and verified to enter Home without login.
- Browser: Characters at 320 px and focused sheet at 390 px inspected in actual narrow iframe viewports; controls wrap and no horizontal page overflow was visible.
- Local Node server syntax checked. Live API, persistence, authentication, game calculations, real-device touch, full accessibility, Owlbear room behavior and QNAP deployment remain unimplemented/unverified.

Performance of this empty scaffold does not establish performance of future data-heavy features. Step 9.4 includes representative catalog measurements.

## Comos update checks — 23 October 2026
- All 21 HTML routes remain reachable from index.html.
- All 198 local references, including image links and skip-link fragments, resolve.
- Browser: public landing inspected at desktop width and in a 320 px iframe; Home inspected in a 390 px iframe. Image and CSS loaded, controls wrapped, and no horizontal overflow was visible.
- Browser: Ghost mode from the 320 px landing opened Home without login.
- Optional Node server syntax checked; PNG MIME type added for the bundled image.
- Generated image is bundled locally (about 2.45 MB). Future image optimization is pending.
- This session does not claim real Android-device testing, 200% zoom verification, completed Step 1, or implementation of any backend feature.

## Step 1.3 — shared layouts
- `npm run build` successfully generated all 21 routes using zero external dependencies.
- Compared every generated page against the previous version with an HTML parser: elements, attributes, visible text, navigation, and image references match (formatting whitespace excluded).
- Shared stylesheet matches the previous CSS apart from formatting whitespace after splitting tokens from layout styles.
- All local asset/navigation references and skip-link fragments resolve. The isolated sheet header and ghost navigation are preserved by the markup comparison.
- No new visual behavior was introduced; browser checks from the preceding version remain relevant. Narrow sheet, zoom, and fixture boundary work remain pending.

## Step 1.4 — isolated fixture preview
- Six automated tests passed via `npm test`, including all 21 HTTP routes, local references, memory isolation/reset, detached reads, denied real IDs, denied production build, and static-server API/write rejection.
- Browser: a temporary test page loaded the bundled runtime with `?mode=production`; mode remained fixture, authenticated identity remained null, independent contexts stayed isolated, and the browser blocked an attempted API POST under the page policy. The temporary page was removed before packaging.
- Browser: the normal landing page still renders its local image, stylesheet, text, and navigation under the policy.
- Step 1.1's narrow sheet, keyboard, and 200% zoom acceptance review remains pending. No real authentication, persistence, or production authorization is implemented.

## Step 1.1 review update — 23 October 2026
- Main content now has `tabindex="-1"` so the skip link can target keyboard focus without adding an extra Tab stop. The brand link has a minimum 44 px touch target.
- Browser review did not execute: automatic approval review blocked access to the internal preview because of a usage limit. No alternative browser path was used.
- Narrow-sheet rendering, keyboard interaction, and 200% browser zoom remain unverified in this session. Step 1.1 is still pending.
- Added `docs/TESTING.md` with the user's test checklist and expected outcomes.
- All six automated tests passed after these changes, covering all 21 routes.

## Step 2.1 — legacy source audit
- Successfully read the four legacy source files listed with blob SHAs in `AUTH-AUDIT-SOURCES.md`. Reviewed sign-in/signup/profile behavior and character-owner storage paths.
- Three targeted repository searches (rules_version, setPersistence, linkWithCredential) returned no matches; this is not proof of absent external configuration.
- Documented provider UID mapping, incomplete profile handling, partial character migration reconciliation, and a staged migration/rollback plan.
- No production account or database operations were performed. This is a documentation-only package update; application tests were not rerun because executable inputs did not change. Existing Step 1.1 visual limitations remain.

## Step 2.2 — API and storage foundation
- Tested on Node 24.19.0 with built-in SQLite 3.53.3. All 13 automated tests passed.
- Verified database records and media survive reopening; identity reassignment and orphan-owner references fail; stale profile revisions fail; file reads are owner-filtered.
- Verified migration failure rolls back DDL, applied history cannot be modified silently, traversal/symlink/oversized media operations are rejected, and private files are not HTTP-accessible.
- Verified all API data requests reject unauthenticated/forged users, including write methods and ghost/admin query parameters.
- Standalone migration command, API process startup, health response, and clean signal shutdown passed using a temporary data directory.
- No browser check was needed for this backend-only slice. Existing Step 1.1 visual limitations remain. No production authentication or data import occurred.

## Step 2.3 partial — 24 October 2026
All 14 automated tests pass. Added synthetic-verifier coverage of identity mapping, restore/revoke, recent sign-in, forged/wrong-project proof, Origin enforcement, cookie attributes and bounded requests. Real Firebase verification and browser auth remain untested; default bootstrap stays unconfigured.

## Version 0.2.2 — 23 October 2026 (Denver)
- All 20 automated tests passed after SDK installation and the gRPC override. All 21 HTML routes and local asset references resolve.
- Form validation checks missing/malformed emails, password length and confirmation. Source checks verify labels, disabled no-script submission and preview-only module output. Actual DOM interaction, rendering, keyboard and Android behavior remain unverified.
- Official Firebase SDK imports and required Admin interfaces loaded successfully. No live Firebase network operation or user credential was used. Simulated providers test proof exchange, restoration, cleanup after failure, duplicate request rejection and non-enumerating reset messaging.
- Explicit server configuration is required; invalid mode/origin/project/emulator settings fail before credential access. Default bootstrap remains unauthenticated. Known provider outages return 503 without deleting a session cookie.
- npm audit --omit=dev reports zero vulnerabilities for the locked dependencies after pinning @grpc/grpc-js 1.13.6. This is a dependency advisory result, not a production security certification.
- Browser visual review was not rerun; the previously recorded browser-access usage-limit block remains unresolved. Use TESTING.md for the phone checklist.

## Version 0.2.3 — 24 October 2026 (Denver)
- 24 automated tests passed, including profile completion/restart/idempotency/conflict cases and session-derived ownership. Extra client owner fields and foreign origins are rejected.
- Interrupted signup tests confirm that the UI can distinguish an already-created provider account from an unsuccessful account creation; cleanup failure does not obscure the original failure.
- Browser access worked this session. Verified empty-name error, focus on the invalid field, valid-name success, cleared errors and focus on feedback. Inspected desktop and a 320 px iframe (305 px document content after scrollbar); scrollWidth equalled clientWidth. Temporary QA harness removed.
- Live build smoke passed with synthetic public configuration: 21 live pages and 21 fixture pages, expected auth entry scripts, and byte-for-byte preservation of the portable preview. Configured test output removed; no live provider traffic or credentials used.
- Actual Android touch/keyboard, complete 200% zoom/sheet review, live Firebase verification and HTTPS end-to-end authentication remain unverified.
- Full npm audit reported zero advisories after adding the pinned esbuild development dependency.

## Version 0.2.4 — 24 October 2026
29 tests passed. New tests verify token refill, separate peer/operation budgets, concurrent capacity, global limits, map capacity, Retry-After, forged forwarded headers, failed-request cleanup and client 429 feedback. Existing 21 routes and local references pass. No UI layout changes or live provider operations. Live Firebase/HTTPS verification remains pending.
- Live bundle compiled after 429 client feedback changes using synthetic public configuration; preview unchanged and configured output removed. LIVE-ACCEPTANCE.md records the unrun real-service gates.


## Phase 1.3 — 0.3.0
See SHARED-SHELL.md for behavior, verification limits and phone tests. Shared navigation, session-aware landing header, supplied Galaxy background and install support added. User confirmed phone login on preceding deployment.


## Steps 3.1/3.2 — 0.4.0
39 tests passed, including private account APIs, image normalization, conflicts, cleanup and restart persistence. Browser fixture Account validated controls, error feedback, cross-tab preferences, PNG preview and 320px layout. Production dependency audit: zero vulnerabilities. WebGL and authenticated phone edits remain device checks; see ACCOUNT.md.


## Step 4.1 — 0.5.0
World/party/member controls and server-enforced admin access implemented. See GROUPS.md. 41 tests pass. Live admin access requires explicit COMOS_ADMIN_FIREBASE_UIDS configuration; no roles were auto-granted. Account edits are retained.
