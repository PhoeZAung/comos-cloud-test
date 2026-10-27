# Live Comos source

The active site at https://feisty-freedom-production-304e.up.railway.app deploys from **PhoeZAung/comos-cloud-test**, branch **main**. **PhoeZAung/Mount-Aetheria** is the separate legacy reference repository; changes merged there do not appear on Comos automatically. See [docs/SHEET-PORT.md](docs/SHEET-PORT.md) for the transferred sheet features.

Race definitions now live individually in [rules/races](rules/races), and the normal site build generates their runtime adapter. The first current-source mechanical pass is Dwarf; Elvaan is next. See [extraction progress](docs/EXTRACTION_PROGRESS.json) and [Dwarf coverage and remaining manual rules](docs/extraction/dwarf-coverage.md). Existing paraphrases remain flagged for independent/full-text review.

# Comos 0.4.0 — Account and preferences

Steps 3.1/3.2 add automatic profile saving, photos, four two-colour theme circles and an optional splash cursor (off by default). See [docs/ACCOUNT.md](docs/ACCOUNT.md) for behavior, phone tests and integration details.

# Comos 0.3.0 — shared navigation and installation

Home/Lore/Characters now switch within a shared shell. Live landing pages show Account after session restoration. Galaxy background and an Android Install Comos control are included. Read [docs/SHARED-SHELL.md](docs/SHARED-SHELL.md) for tests and integration notes.

# Comos — incremental universe template

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
