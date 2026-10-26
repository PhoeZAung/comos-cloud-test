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

## Current user-directed update — directory and restored characters
Public Ghost mode is retired. The admin directory now lists unique display names with expandable character summaries, tag modals, live saved-sheet links and basic wizard editing. Groups is removed from navigation. See DIRECTORY.md for private import behavior, sheet/rules limits and phone tests. The exact party PNG needs re-upload; a temporary SVG is used. No private backup payload is committed to this repository.

## 26 October 2026 — focused shared sheet

User-directed work replaces the old read-only sheet with responsive Character/Combat/Skills/Inventory/Abilities/Spells and minimal Notes, owner/admin shared writes, revision sync, resources, editable entries, local dice and a standalone compact view. See SHEET.md for behavior, data preservation, verification and remaining rules/Owlbear boundaries. No Firestore persistence or public Ghost mode was added. Existing Home/Lore privacy and character wizard changes on main were preserved.

Combat follow-up: action-first layout, Damage/Heal with temp HP handling, formula dialogs, Recovery menu, live selected-character revision events, conflict-only Load latest control, ↗ compact icon, and authenticated server-generated rolls connected to the legacy Discord relay. 118 tests pass. Actual Discord channel receipt requires the owner's first live roll; synthetic delivery tests do not claim it.

Sheet navigation follow-up: sword parent with Combat/Abilities/Spells; four ability categories; redundant Damage/Heal controls removed; Temp HP directly editable below HP. Resource typing autosaves after a short pause. 119 tests and local phone navigation/resource checks pass.

Sheet refinement: accessible icon-only main navigation with Favorites first; Character glance block removed; Discord and Recovery icon toolbar; Base below resources; combined Offense/Defense pane with AC shield; saves/resistances below. Favorite flags persist on original weapon/ability records and retain their actions. 120 tests and synthetic mobile checks pass.

Spell/ability follow-up: explicit DC/use formulas, selected attack calculations, caster/concentration checks, standard range and MP costs, server-side Cast/Use spending, bounded typed damage dice, fixed standard skills, and one compact ability-category selector. See SHEET-CALCULATIONS.md for exact supported arithmetic and remaining rules-adapter boundaries. 125 tests pass; all 20 restored characters and 654 spell/ability/feat records checked locally.

## Sheet resources, layout and combined weapon rolls — 2026-10-26

Added persistent HP/MP favorites; heart combat navigation with sword/shield panes; initiative in Offense; BAB in Recovery settings; speed/proficiencies under Character; centered armor class; four-quadrant ability selector with local SVG icons. Weapons select a sheet attack type, allow an explicit Ability Mod override, and create one server-derived attack/damage receipt with conditional critical confirmation/damage and non-multiplied extra dice. 130 tests pass. See SHEET-WEAPON-ROLLS.md for calculations, limitations and phone checks. Actual Discord delivery remains unverified; test sends are mocked.

## Legacy changelog features adapted to Comos — 2026-10-26

The attached changelog referred to merged changes in Mount-Aetheria, while Railway builds comos-cloud-test main. Preserved the Comos equipment/initiative work from 53d7b30 and brought over missing original item categories/icons/filters, a visible tag editor above Name, derived unused skill points, spell-level tabs and MP badges/overrides. Cast now sends/rolls without changing base/temp MP, including at zero MP. See SHEET-PORT.md for source provenance, intentional adapter boundaries and phone checks. No old-site write or Firebase migration was performed.

## Square selectors, equipment regions, and ability quick actions — 2026-10-26

Replaced the round ability selector with a square and added the three inventory groups around a central All square. Rebuilt the equipment figure with shared connector geometry, visual equipped regions, Hand 2/Ranged/Legs and grouped accessory controls; preserved all old slot IDs. Added cross-collection weapon picking, two-handed reservations, and quantity-preserving stack equipping. Spells now have All Spells/favorites/dice actions. Ability uses are directly editable and use a distinct play icon; one atomic Use receipt includes configured attack/damage and deducts once, while dice-only rolls do not spend. Improved the unused skill-point card. 149 tests pass; see SHEET-ACTIONS-EQUIPMENT.md for phone checks and boundaries.

## Equipment and Item Control catalog — 26 October 2026
Broader articulated equipment silhouette; Head and all 16 saved slots remain available, accessories initially expanded. Shared square category tiles put a larger two-by-two All tile on the right. Restored all 5,604 source items as a server-only catalog, paginated Item Control with full item details and character selection, and transactional gil purchases with safe retries. Migration 019 preserves prior records. See ITEM-CONTROL-CATALOG.md. 156 automated tests; 320/390 px and desktop component QA. No real character was charged during testing.
