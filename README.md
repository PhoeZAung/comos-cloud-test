# Live Cosmos source

**Production Cosmos is hosted on QNAP**, with GitHub **PhoeZAung/comos-cloud-test**, branch **main**, as its source. **Publishing is manual through Termius + Tailscale**, using the commit-pinned QNAP deployment script; GitHub Actions only verifies tests. See [QNAP manual publishing](docs/QNAP_PHONE_DEPLOY.md) before claiming a release is live. The Railway URL and related setup file document an earlier test environment, not the QNAP production release process. **PhoeZAung/Mount-Aetheria** is a separate legacy reference repository; merges there do not appear automatically on Cosmos. See [docs/SHEET-PORT.md](docs/SHEET-PORT.md) for transferred sheet features.

Race definitions now live individually in [rules/races](rules/races), and the normal site build generates their runtime adapter. The first current-source mechanical pass is Dwarf; Elvaan is next. See [extraction progress](docs/EXTRACTION_PROGRESS.json) and [Dwarf coverage and remaining manual rules](docs/extraction/dwarf-coverage.md). Existing paraphrases remain flagged for independent/full-text review.

# Cosmos 1.1 Update — November 10–12, 2026

**Release notes for the changes merged to `main` during the two-day update window (November 10, 2026, 22:24 UTC through November 12, 2026, 21:48 UTC).** This is the **Cosmos 1.1** release label for these changes, not a claim that the separate QNAP-hosted production installation has already been updated. The latest included source commit is [`f6198e4`](https://github.com/PhoeZAung/comos-cloud-test/commit/f6198e4b19ea8c76bea411a1c32ff68482afef00); Owlbear extension manifest reaches **1.7.2**. Manual QNAP publication and an in-room check remain necessary.

## Player highlights

- **More than one character sheet open in tabs.** Use **Add Sheet** to open a second (or additional) owned sheet and switch between named tabs without reloading each sheet. Standalone Cosmos reveals its in-sheet tab strip when two or more sheets are open; embedded Owlbear has named, closeable character tabs. Sheet section/filter and scroll position are retained when switching. In Owlbear, Add Sheet and Pop Out sit beside Favorite and Rest in the sheet toolbar, and the Add Sheet picker has search.
- **Buy a chosen quantity of premade items directly from Inventory.** In **Inventory → Add Item**, search the existing item catalog and select an item to preview its description and imported fields. Enter **Qty** (including multiple copies), see the unit price, total **Amount** and available **Gil**, then explicitly **Buy**. Fixed-price purchases add the chosen quantity and deduct the correct Gil atomically; merely selecting a result never charges the player. Fixed-price zero-Gil items are free, and entries without a trustworthy price use **Add without a price** with no Gil charge. Custom inventory entries remain supported. Purchased/added catalog items are **not auto-equipped**.
- **Cleaner inventory.** Compact item rows show a category icon, name, equipped marker and quantity badge. Open a row for Qty, saved cost/Amount, full details, and Favorite/Edit/Remove actions.
- **Improved character and weapon calculations.** New weapons use attack-type defaults (melee STR attack and STR damage; ranged DEX attack and no default damage ability), with explicit **None** overrides and default 20/×2 critical profile. A separate Damage Ability supports thrown, two-handed, off-hand and bow styles; inline **AR Mod** / **DMG Mod** values update as choices change. Existing manually saved formulas are preserved unless changed.
- **Fast ability editing.** The **+** button immediately opens a manual ability editor; **Add Premade** switches to the premade library, while advanced mechanical settings are collapsed beneath the ability name. Ability description, effect and higher-level text get separate rich-text sections.
- **Limit Break and visual polish.** A ready-to-use Limit Break gains an ElectricBorder effect; the LaserFlow effect now uses the actual React Bits JS/CSS component, respects the effect preference and reduced-motion settings, and cleans up when disabled.

## Rules, attacks and sheet calculations

- Improve **CMD** with BAB and applicable AC adjustments, handle shield Dexterity limits and Uncanny Dodge, and include size modifiers for Fly/Stealth while keeping saved wizard bonuses.
- Correct weapon and Owlbear Dice+ damage rolls: extra damage is rolled once, criticals use a fresh base-damage roll, and two-handed/off-hand Strength calculations are explicit. Check equipped armor's arcane spell failure with per-spell exceptions, and count feat-based extra Limit Break uses.
- Weapons and targeted effects show **hit or miss** against saved AC, touch AC or CMD. A miss does not apply damage. Targeted actions in active Owlbear combat require the acting linked character's initiative turn and a selected eligible target; a successfully recorded action clears only the used target selection. Non-targeted and out-of-combat rolls remain available.
- Spells and abilities can specify an HP **Effect type** (None, Damage, Healing or Temporary HP), using their existing dice formula.
- **Automatic combat HP resolution:** recorded, verified targeted rolls can apply damage, healing and temporary HP to linked player sheets (including sheets owned by others) and linked NPC Owlbear tokens. Handle hit/miss, confirmed criticals, temp-HP absorption, capped healing and conservative nonstacking temporary HP. Repeat receipts cannot apply the same effect twice.
- The GM can independently toggle **Validate weapon damage** and **Validate ability & spell effects** under **Settings → Admin**. Both default to off (automatic application); when enabled, rolls wait for GM **Approve** or **Reject** in Initiative.
- **Combat history** persists per Owlbear room across battles with actor, target, round, action, hit/miss/critical, applied amounts, GM decisions and defenses. **End Battle** clears initiative and battle associations without erasing HP or history.
- **PF1/FFD20 defenses:** NPC records now expose/import damage reduction (**DR**), spell resistance (**SR**), caster level (**CL**), bypass rules, energy resistances, immunities and vulnerability information. Weapon editors accept DR-bypass properties; spell/ability editors accept damage types, SR settings, caster-penetration values and spell-like (**Sp**), supernatural (**Su**) or extraordinary (**Ex**) categories. Verified server-side SR checks, relevant DR and energy reductions are shown in receipts/history.
- **Fortitude, Reflex and Will saving throws:** spell/ability editors now support a structured save type, outcome on success (**GM/manual**, **Negates**, **Half**, or **Alternate damage**), and optional alternate damage dice. Use the configured DC and saved target bonus with server-rolled d20 and PF1 natural-1/20 rules. Resolve SR first, then save, then applicable damage mitigation; support alternate partial damage such as *Slay Living*. The verified result and DC appear in roll feedback/history, and retries reuse the original result.
- Unspecified saves/DCs, unusual resistances, vulnerabilities, special non-HP effects, multi-target/multi-save spells, status conditions, and other unsupported homebrew interactions remain **GM-reviewed**, not guessed by the automation.

## NPC library and Owlbear integration

- Add **admin-managed NPC sheets** from Markdown stat-block text/files; improve NPC name search and import. NPCs are kept separate from player directories and private NPC fields remain GM-restricted.
- **Add to Battle** recognizes a uniquely matching saved NPC, imports its battle statistics and rolls printed HP dice once when the stat block provides a dice expression. Saved NPC initiative now rolls d20 plus its imported initiative modifier.
- Reorganize Owlbear into **Character / Initiative / Settings**, with GM-only **Admin** controls nested in Settings and public/private roll history accessible there. The character roster and NPC picker are searchable, and multiple named sheet iframes stay mounted to preserve state.
- Initiative **Next/Previous** can focus the active token on the local map; hovering/focusing a combatant creates a temporary local token outline. Players can click visible initiative combatant names to center their own camera without selecting a token. GM-hidden combatants and turns are never leaked into player-facing initiative state.
- A GM-only **Recommend target** option can suggest a party target on an NPC turn based on available Intelligence, distance and basic combat stats. The red outline is visible only to the GM, remains advisory, and neither selects nor attacks.
- Reconnect the Owlbear extension automatically from an existing signed-in Cosmos session after refresh, without storing a persistent grant. GM controls choose whether nonparty NPC HP is shared (hidden by default), and invisible NPCs show a GM-only closed-eye marker.
- Show owner-editable Party HP/MP clearly without granting edit access to other players. Improve narrow-screen tab layouts and sheet toolbar navigation. Remove obsolete admin Item Controls/Buy navigation icons **without removing players' Inventory shopping**.

## Publishing, validation and boundaries

- GitHub Actions now runs **verification/build checks only**. Actual Cosmos production publication is **manual through Termius + Tailscale to QNAP**, using the documented commit-pinned deployment process. See [QNAP manual publishing](docs/QNAP_PHONE_DEPLOY.md). A merge to `main` does **not** publish the running site or the Owlbear extension by itself.
- The update adds automated Node/integration, security/ownership, receipt-retry, browser/Chromium, Owlbear initiative, sheet editor, inventory purchase and combat tests. Production authentication, real-room positioning and QNAP publication still require live verification.
- Source reference PRs: [#85](https://github.com/PhoeZAung/comos-cloud-test/pull/85), [#86](https://github.com/PhoeZAung/comos-cloud-test/pull/86), [#87](https://github.com/PhoeZAung/comos-cloud-test/pull/87), [#88](https://github.com/PhoeZAung/comos-cloud-test/pull/88), [#89](https://github.com/PhoeZAung/comos-cloud-test/pull/89), [#90](https://github.com/PhoeZAung/comos-cloud-test/pull/90), [#91](https://github.com/PhoeZAung/comos-cloud-test/pull/91), [#92](https://github.com/PhoeZAung/comos-cloud-test/pull/92), [#93](https://github.com/PhoeZAung/comos-cloud-test/pull/93), [#94](https://github.com/PhoeZAung/comos-cloud-test/pull/94), [#95](https://github.com/PhoeZAung/comos-cloud-test/pull/95), [#96](https://github.com/PhoeZAung/comos-cloud-test/pull/96), [#97](https://github.com/PhoeZAung/comos-cloud-test/pull/97), [#99](https://github.com/PhoeZAung/comos-cloud-test/pull/99), [#100](https://github.com/PhoeZAung/comos-cloud-test/pull/100), [#101](https://github.com/PhoeZAung/comos-cloud-test/pull/101), [#102](https://github.com/PhoeZAung/comos-cloud-test/pull/102), [#103](https://github.com/PhoeZAung/comos-cloud-test/pull/103), [#104](https://github.com/PhoeZAung/comos-cloud-test/pull/104).
- **Not included:** [LaserFlow tab-impact/side-barrier PR #98](https://github.com/PhoeZAung/comos-cloud-test/pull/98) is still open and has **not** been merged to `main` as of this release note.
- **Historical note:** older `0.x` sections below describe prior development milestones, not the present live-feature scope.

---

# Cosmos 0.4.0 — Account and preferences

Steps 3.1/3.2 add automatic profile saving, photos, four two-colour theme circles and an optional splash cursor (off by default). See [docs/ACCOUNT.md](docs/ACCOUNT.md) for behavior, phone tests and integration details.

# Cosmos 0.3.0 — shared navigation and installation

Home/Lore/Characters now switch within a shared shell. Live landing pages show Account after session restoration. Galaxy background and an Android Install Cosmos control are included. Read [docs/SHARED-SHELL.md](docs/SHARED-SHELL.md) for tests and integration notes.

# Cosmos — incremental universe template

Start with **docs/STATUS.md**, then **docs/ROADMAP.md**. For the chat-versus-integration work split, see **docs/MIND-MAP.md**. We build one substep at a time. This package includes 21 navigable pages, a universe-themed public Home, isolated Ghost preview, and a native backend foundation. It is not a completed game platform.

## Preview on Android
Extract the ZIP and choose **comos-template/dist** as the document root in your local HTTP server app. Open its http:// address in your browser. Do not open a single HTML file through content://: relative styling and JavaScript modules may not load. No PC, account, Docker or npm installation is needed to preview the supplied dist folder.

Sign in and Sign up now contain **form previews**. Use sample details. The Check form buttons only validate in the current page; nothing is submitted, stored or authenticated. Google stays disabled until live setup. Ghost mode keeps every route accessible without login. A preview is never a production permission bypass.

If Check form stays disabled, ensure JavaScript is enabled and your server serves .mjs files as JavaScript. Navigation still works without scripts. See **docs/TESTING.md** for the current phone checklist.

## Run from source
Use Node.js 24 or newer.
- `npm start` (or START.cmd): generate and serve the static preview at http://127.0.0.1:4173. This uses no installed dependencies.
- `npm ci`: install the pinned Firebase SDK dependencies before backend authentication development or the full tests.
- `npm test`: generate the preview and run all automated tests.
- `npm run api`: run the separate native backend on http://127.0.0.1:4174; authentication is disabled by default. The SQLite/media/health foundation can run without installed Firebase packages in this default mode.
- `npm run db:migrate`: initialize/check the database schema.

The Android static server does not run Node or the API. Neither server is published; both bind only to loopback. Native QNAP hosting remains the later plan, subject to runtime validation. No Docker.

## Current progress — 0.2.4
Step 2.3 remains in progress. Sign-in, sign-up and reset form validation are previewable. Official Firebase client/server adapters are installed and locked; the API has opt-in credentialed configuration. Resumable display-name setup and the separate live form controller/build are implemented. Real provider verification, HTTPS integration and actual Android login tests remain pending. See **docs/SESSIONS.md**.

Steps 3–12 remain placeholders. Existing legacy accounts, campaign data and repository were not changed. No live sign-in, signup or reset email was performed. Browser access is available again: the profile preview was checked at desktop and 320 px widths. Full Step 1.1 keyboard/zoom/sheet acceptance remains pending.

## Structure
- `src/pages/` and `src/layouts/`: shared page generation; `src/styles/`: separate design tokens and styles.
- `src/auth/`: form rendering, validation, preview behavior and separate real-mode adapters. Only preview.mjs and validation.mjs are shipped to dist/auth.
- `src/preview/`: isolated in-memory synthetic data; no real writes or credentials.
- `dist/`: generated portable preview, with local image and stylesheet.
- `backend/`: native HTTP API, SQLite migrations, repositories, private file storage and optional auth bootstrap.
- `docs/`: roadmap, architecture, legacy identity audit, session boundaries and testing.

Keep runtime databases, media and server credentials outside the portable site. They are excluded from the source ZIP. No publication or legacy repository push is part of this delivery.

## Profile setup and live build
On Sign up or Sign in, expand **Preview profile setup** to test the display-name field. Preview names are not saved. The real backend persists completion and resumes incomplete users after sign-in. Profile image uploads and editing stay in Step 3.

`npm run build:live -- /absolute/path/public-auth.json` builds a separate `dist-live/` using explicit public Firebase configuration. This is source/build support only, not hosting or completed live verification. It includes an isolated `preview/` copy. See **docs/LIVE-AUTH.md** before using it. No configured live output or credentials are included in this ZIP.

Authentication endpoints now have process-local throttling and bounded concurrency; see docs/THROTTLING.md for proxy and deployment limits. No live authentication has been verified. docs/INTEGRATION-PACKET.md provides a reusable prompt for preparing modules in a regular chat.
