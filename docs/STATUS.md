# Comos — current handoff

Version 0.6.0 · 24 October 2026. Active repository: PhoeZAung/comos-cloud-test. Current checkout: comos-cloud-test/. Earlier comos-template and transfer ZIPs are historical snapshots.

## Working deployment
Railway service feisty-freedom, domain https://feisty-freedom-production-304e.up.railway.app. Firebase project mount-aetheria retains Google and email/password identity. User confirmed phone login and the 0.3.0 shell/install update. Private server credentials are configured in Railway, never in source. Persistent database/media use /data. QNAP remains the future native host; no legacy data was imported or deleted.

## Implemented
- Shared tab navigation, direct HTML fallback, Back/refresh, isolated sheet and Ghost preview.
- Galaxy background, static/reduced-motion fallback, PWA manifest/shortcuts and safe offline notice.
- Firebase session/login/onboarding foundations and bounded authentication requests.
- Steps 3.1/3.2: editable names/photos, four automatically saved two-colour themes, default-off splash and theme-colour effect preference. See ACCOUNT.md.
- 44 automated tests pass. Current production dependency audit: zero vulnerabilities.

## Verification limits / next
Authenticated phone edits, uploaded photos across sessions, splash rendering and saved theme switches need the device acceptance checklist in ACCOUNT.md. WebGL is unavailable in this QA browser. Password reset and full session revocation acceptance from LIVE-ACCEPTANCE.md remain to confirm. No test here claims a production-scale catalog, permissions model or migration.
Steps 4.1/4.2 are implemented. Live admin access still requires the explicit UID allowlist; see GROUPS.md and CHARACTER-CONTROLS.md. Next implementation slice: Step 4.3 item controls, after the admin phone acceptance checks. Keep other features as placeholders.

## Run
Node >=24. npm start: isolated static preview. npm ci && npm test: checks. npm run build:cloud and npm run start:cloud: configured cloud build/server (see CLOUD-SETUP.md for environment and volume). Local API is optional and auth disabled by default. Never package credentials, runtime databases, node_modules or private backups. Deployment source is synced to the new repository; old Mount-Aetheria remains read-only.


## Step 4.1 — 0.5.0
World/party/member controls and server-enforced admin access implemented. See GROUPS.md. 41 tests pass. Live admin access requires explicit COMOS_ADMIN_FIREBASE_UIDS configuration; no roles were auto-granted. Account edits are retained.

## Step 4.2 — 0.6.0
Character metadata records, owner transfer, source versions, bounded search/pagination and reversible archive/restore. Live Admin entry is derived from verified server access. No legacy character data imported; wizard and sheets remain pending. See CHARACTER-CONTROLS.md. 44 tests pass.
