# Comos — build one tab at a time

Planning baseline: 23 October 2026. Source: the **New layout** section of your Obsidian Mind Map.md and read-only inspection of PhoeZAung/Mount-Aetheria. The original note and repository have not been edited.

**Current progress: template and backend foundation implemented; Step 2.3/2.4 live authentication acceptance pending.** See [STATUS.md](STATUS.md) for the current state and [MIND-MAP.md](MIND-MAP.md) for what to draft in regular ChatGPT versus integrate here. Step 1.1 still needs full keyboard/zoom/sheet review. Later game features remain pending. Coherent batches are authorized; do not mark real-service acceptance complete from simulated tests.

## Step 0 — template and boundaries
- [x] Separate public landing, sign-in/sign-up, Home, Lore, Characters, Account, Admin, wizard and sheet routes.
- [x] Unrestricted preview navigation and direct HTML access; no live account or backend needed.
- [x] Minimal responsive shell shared by every page; sheet removes Home/Lore navigation.
- [x] Explicit tasks for deferred features and a separate shop route.
- [x] Local, dependency-free preview and portable source package.

## Step 1 — public Home and shell (IN PROGRESS)
Depends on: 0. Routes: index.html and shared navigation.
- [ ] 1.1 Review the template at phone width, desktop width, and a narrow sheet panel. Settle navigation and page names only.
- [x] 1.2 Add a cosmic home image and sample introduction, as authorized on 23 October 2026; retain Sign in and Sign up links. The sample copy can be replaced with your final introduction.
- [x] 1.3 Establish shared layouts/components and route-level modules before functionality grows. Keep CSS tokens separate from behavior. Completed with static generation from shared layouts and independent page modules.
- [x] 1.4 Add a developer-only fixture preview boundary for the future application. All pages use the preview-only bundle; synthetic edits stay in page-local memory, network data requests and forms are blocked, and production builds are rejected.
Done when: every route refreshes directly, keyboard navigation works, 320 px has no page overflow, 200% zoom is usable, and preview mode cannot reach production writes. The static delivery already provides the unrestricted portion.

## Step 2 — sign in / sign up and the backend foundation (SOURCE AUDIT COMPLETE)
Depends on: 1. Routes: signin.html, signup.html.
- [x] 2.1 Audit existing sign-in/sign-up flows and user identifiers; preserve familiar behavior and plan account migration before changing identity providers. Source audit and migration plan recorded in docs/AUTH-AUDIT.md; live account inventory and deployed provider/rules review remain prerequisites to real rollout.
- [x] 2.2 Create a modular API server, versioned persistence migrations, and repository interfaces. SQLite and private filesystem media foundation completed; health is available and all data APIs remain denied until real authentication. See docs/BACKEND.md.
- [ ] 2.3 Add sign-in/sign-up, session restoration, sign-out, validation, and clear errors. Production authorization is server-side. Do not trust hidden buttons or a query parameter.
- [ ] 2.4 Keep fixture preview as a separate environment/adapter. In real mode enforce authentication on data APIs even when the static page shell is reachable.
Done when: existing-user migration is documented; signed-out data requests fail; two users cannot read or edit each other's private records; ghost previews still open every screen with fixture data only.

## Step 3 — Account
Depends on: 2. Route: account.html.
- [ ] 3.1 Display-name and profile-image edit, preview, size/type validation, upload and persistence.
- [ ] 3.2 Theme preference belongs here; apply through shared CSS tokens, including compact sheet rendering.
- [ ] 3.3 Add password reset and other settings later once the identity provider is settled.
Done when: name/icon persist across sessions, theme applies across routes, and Admin is accessed from Characters rather than Account.

## Step 4 — Admin and groups
Depends on: 2; profile presentation can use 3. Routes: admin.html, admin-items.html, admin-groups.html.
- [ ] 4.1 Groups: configure the four worlds, parties belonging to a world, and membership assignments. Give each user a stable player identity automatically. Admin assigns world/party access. Do not infer the four world names from the old page's six categories.
- [ ] 4.2 Character controls: list/manage authorized characters, ownership and source metadata. Show Admin panel on Characters for real admins; show it freely in fixture preview.
- [ ] 4.3 Item controls: establish item IDs, source association, schema version, validation and later editing/import.
- [ ] 4.4 Third admin tab is Groups for now; defer unknown tools until identified.
Done when: authorization tests cover another world's data, another party, a personal entry, removed memberships and admin-only writes.

Access decision: each record specifies worldId, optional partyId and optional playerId. Every specified scope must match the viewer, unless the server grants admin access. A world-only record is visible to that world's members; adding party/player narrows access. Tags are access scopes, not cosmetic client filters. Model memberships as sets so future multiple parties do not require rewriting users.

## Step 5 — Home feed
Depends on: 3 and 4. Routes: home.html, post.html, compose.html.
- [ ] 5.1 Chronological, group-scoped feed. Define newest-first cursor pagination, stable tie-breaking IDs, empty/error/loading states. No personal profile page or personal feed.
- [ ] 5.2 Open a post to load its replies on demand. Replies support text, images, GIFs and emoji; do not preload reply threads into the feed.
- [ ] 5.3 Bottom-right + opens composer. Top-right persona selector switches between the account and owned characters; remember last selection per user. Support text, images, GIFs and emoji.
- [ ] 5.4 Persist authorUserId separately from display persona. Let owners delete their own posts; define reply cleanup. Prevent posting as someone else's character.
Done when: posts sort correctly, pagination has no duplicates, persona restores, unauthorized group posts are absent from API results, and reply/media loading does not block navigation.

Interpretation: your request for no comments on the site means no developer commentary in the interface. User-written feed replies remain planned because your mind map explicitly asks for them.

## Step 6 — Lore
Depends on: 4. Routes: lore.html, lore-entry.html.
- [ ] 6.1 Preserve the old story page's useful structure: desktop filters, compact mobile controls, cards, sorting, and admin editing. Rename Primary to World, Secondary to Party, add Player scope.
- [ ] 6.2 Load entry text and images only when opened. Preserve expanded entry/image viewing and back navigation.
- [ ] 6.3 Admin create/edit/delete, scoped image attachment, safe text rendering, and migration mapping from existing categories/tags.
- [ ] 6.4 Replace full-collection subscription/client filtering with scoped paginated queries. Scope options must also avoid leaking private names.
Done when: player sees only permitted records, admin can manage scopes, all four sorts work with pagination, and old stories are migrated with explicit scope review. The current delivery is a shell; the old Lore editor is not yet ported.

## Step 7 — Characters list
Depends on: 2 and 4. Route: characters.html.
- [ ] 7.1 Create-character entry point and paginated character summaries (ID, name, portrait, level, race, class).
- [ ] 7.2 Cards follow your reference: clickable portrait opens sheet; name and level/race/class summary; Edit, Copy and Delete. No separate View button. Lazy-load thumbnails and reserve image dimensions.
- [ ] 7.3 Copy gets a new ID; deletion confirms and handles cleanup; pagination supports many characters without downloading full sheets.
Done when: cards remain usable on mobile, portrait opens the right sheet, ownership is checked by API, and list loading does not fetch rules catalogs or shop data.

## Step 8 — character wizard (four separate work sessions)
Depends on: 7; source contracts agreed before race/class integration.
- [ ] 8.1 Sources (create-source.html): add/remove multiple TTRPG sources; FFd20 initially. Source registry defines wizard capabilities and stable IDs. Explicitly reject incompatible rule combinations rather than silently merging them.
- [ ] 8.2 Identity (create-identity.html): character name and portrait upload. Preserve a draft when moving Back/Next and refreshing; validate before continuing in real mode.
- [ ] 8.3 Race (create-race.html): audit the repository's actual race JSON paths/schema, write an adapter, then select race. Render every trait in expandable name/detail sections. Do not invent race data.
- [ ] 8.4 Class & level (create-class.html): audit actual class JSON; version the adapter because you plan to change its shape. Filter abilities by selected level. Persist a valid character and open the sheet only after successful creation.
Done when: Back preserves inputs, source changes invalidate incompatible picks visibly, race details are complete, class abilities match level, retry cannot duplicate a character, and errors preserve the draft.

## Step 9 — focused character sheet
Depends on: 8. Routes: sheet*.html. Use small substeps; the existing sheet is complex.
- [ ] 9.1 Overview: audit existing saved sheet structure; map basic identity, stats/resources and calculations into a reusable sheet component. Back goes to Characters; no Home feed/nav in the sheet. Keep data and calculations separate from rendering.
- [ ] 9.2 Inventory: stable item IDs, edits, quantities/equipment, persistence and save status. Character-specific data only.
- [ ] 9.3 Abilities: load selected character's abilities first; lazy-load rules references when needed. Define calculation tests against known existing characters before migration.
- [ ] 9.4 Shop: load code/catalog only on opening Shop. Add server search/filter, cursor pagination, cancellation of stale queries, bounded cache and thumbnail loading. Never mount the entire tools.html as a shop iframe. Measure a representative large catalog rather than claiming speed from empty placeholders.
- [ ] 9.5 Save coordination: debounce small edits, revision checks for conflicting sessions, error recovery and a tested legacy-sheet migration.
Done when: opening sheet makes zero shop requests; changing tabs responds immediately; old representative sheets retain data; failed saves do not silently erase edits; browser traces show bounded work for large catalogs.

## Step 10 — Owlbear integration (sheet only)
Depends on: 9.1; inventory/abilities can be integrated incrementally.
- [ ] 10.1 Reuse the focused sheet in a compact entry point. Create an extension manifest and isolated Owlbear adapter; do not load the main feed/admin UI inside the panel.
- [ ] 10.2 Detect SDK availability and wait for readiness; ordinary browser use must work without an Owlbear host.
- [ ] 10.3 Implement narrowly agreed interactions: character selection first, then dice/token/resource synchronization one at a time. Define authority and conflict rules before bidirectional sync.
- [ ] 10.4 Test embedded authentication/storage behavior, origin policies, narrow widths, scene absent/present and reconnect. An Owlbear player ID does not itself authorize access to a site account.
Done when: actual Owlbear room tests pass and standalone behavior remains intact. This template does not claim a working extension.
Official references: https://docs.owlbear.rodeo/extensions/getting-started/ and https://docs.owlbear.rodeo/extensions/apis/ . The extension embeds a hosted page through a manifest; SDK availability/readiness is an explicit boundary. Recheck current SDK/hosting requirements when implementing.

## Step 11 — QNAP migration, files and operations
Depends on: stable API and data model; before storing real campaign data on the NAS.
- [ ] 11.1 Inventory QNAP model, CPU architecture, QTS/QuTS version, supported native runtimes, RAM, and HTTPS/reverse-proxy capabilities. Choose a native service method only after compatibility is verified. No Docker.
- [ ] 11.2 Configure data directory and media base URL outside app code. Store records/text in the database and images/GIFs as files; database stores media IDs/relative keys, never Windows D: paths or browser SMB URLs.
- [ ] 11.3 Migrate database and media together; checksums, record counts, permissions, rollback copy, backup schedule and a restore rehearsal. With SQLite, keep the database on the server's local volume, not a Windows-mounted NAS share.
- [ ] 11.4 Native service startup, logs, HTTPS, private-media authorization and least-privilege filesystem access. Use pagination/indexes from earlier steps. Consider PostgreSQL only if measured write concurrency outgrows SQLite.
Done when: the same frontend uses the configured NAS API, image/text backups restore successfully, reboot recovery works, and private content remains scoped. If this QNAP cannot run the API natively, ask you to choose between PC-hosted compute with NAS storage and another native host; do not introduce Docker silently.

## Step 12 — final visual design and release checks
Depends on: completed feature slices.
- [ ] Add final typography, portraits, colors, themes and animations using shared tokens/components.
- [ ] Accessibility, mobile/desktop/embedded testing, keyboard and screen-reader checks, reduced motion and 200% zoom.
- [ ] Measure production-sized feed, lore, character and item data. Proposed budgets: no shop request before Shop; initial shell under 100 KB uncompressed excluding content; cached tab response under 100 ms; cold catalog first page under 1 second on agreed local hardware. These are acceptance targets, not measurements of future features.
- [ ] Stage rollout, migration rehearsal, backup/restore, permissions and performance regression checks.

## Working agreement for each session
Choose a coherent slice within the active roadmap area. Batch its related UI, API, tests and documentation, rather than stopping after each small edit. Read the relevant current code/data, implement and verify as much as the available evidence permits, then update this checklist. Do not combine unrelated features or infer completion of blocked real-service tests. Include a short “What to test” checklist with expected results in every continuation update. Keep other pages as Coming soon. Ask for decisions only where a consequential tradeoff cannot reasonably be resolved from the project requirements.

Next session prompt: “Read docs/STATUS.md and docs/MIND-MAP.md. Complete the next coherent, unblocked batch, preserve Ghost isolation, and include what to test. Identify any real-service blocker honestly.”

## Earlier session checkpoint (superseded by STATUS.md)
Earlier implementation slice: Step 2.3, verified identity/session integration and sign-in/sign-up flows. Backend configuration and provider settings must be established before live authentication. Step 1.1 visual acceptance remains open; the independent Step 2.1 read-only source audit was completed while that review was blocked. Do not treat this as completion of Step 1 or authorization for a production rollout.

## Step 1.1 review status — 23 October 2026
Added a focusable main-content target for keyboard skip links and a minimum 44 px brand-link touch target. Code review is complete for these changes. Cloud-browser execution was blocked by automatic approval review because of a usage limit; new narrow-screen, keyboard, and 200% zoom results are not available. Keep Step 1.1 unchecked until the browser review or user checks in `docs/TESTING.md` pass.

### Step 2.3 progress (24 October 2026)
Server session service and HTTP handlers implemented and tested with a synthetic verifier. Step 2.3 remains unchecked: official SDK/bootstrap, browser forms, onboarding, provider configuration and real Android checks remain. Next pass continues 2.3; do not advance to Account yet. See SESSIONS.md.

### Step 2.3 progress — version 0.2.2
Added phone-testable sign-in/sign-up/reset form previews, validation and Show/Hide; Google remains disabled. Installed pinned official Firebase SDKs, client service, and opt-in credentialed server bootstrap. No live configuration or accounts used. Continue 2.3 with resumable profile completion and real-mode UI wiring; Step 2.3 remains unchecked. See SESSIONS.md.

### Step 2.3 progress — version 0.2.3 (24 October 2026)
Implemented resumable display-name completion, idempotent/conflict-aware backend updates, ownership enforcement, and the separate live auth controller/build. Added profile form preview without increasing the original 21 route count. Live build keeps an isolated preview copy. Actual Firebase/HTTPS/Android integration and request throttling remain; 2.3 and 2.4 are not marked complete. See LIVE-AUTH.md.

### Version 0.2.4 — 24 October 2026
Added auth throttling and client feedback; 29 tests pass. Added MIND-MAP.md, INTEGRATION-PACKET.md and STATUS.md to reduce repeated setup and support chat-drafted modules. User authorized efficient coherent batches. Real Firebase/HTTPS acceptance remains blocked on configuration, not more generated code. Original PC Obsidian note unchanged.


### Phase 1.3 follow-up — shared navigation and installation
Implemented the shared browser shell, lazy route views, session-aware public header, supplied Galaxy effect and Android install support. See SHARED-SHELL.md for acceptance evidence; phone installation and Galaxy rendering remain to test. This does not complete pending data features or merge other-chat patches.


### Steps 3.1 / 3.2 implementation — 0.4.0
Account name/photo editing and automatically saved themes/effect preferences are implemented. Four presets, default-off splash and theme colour matching are included. See ACCOUNT.md. Phone acceptance remains required before marking the Account done criteria complete.


## Step 4.1 — 0.5.0
World/party/member controls and server-enforced admin access implemented. See GROUPS.md. 41 tests pass. Live admin access requires explicit COMOS_ADMIN_FIREBASE_UIDS configuration; no roles were auto-granted. Account edits are retained.
