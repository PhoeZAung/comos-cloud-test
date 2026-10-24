# Comos — current handoff

Version 0.4.0 · 24 October 2026. Active repository: PhoeZAung/comos-cloud-test. Current checkout: comos-cloud-test/. Earlier comos-template and transfer ZIPs are historical snapshots.

## Working deployment
Railway service feisty-freedom, domain https://feisty-freedom-production-304e.up.railway.app. Firebase project mount-aetheria retains Google and email/password identity. User confirmed phone login and the 0.3.0 shell/install update. Private server credentials are configured in Railway, never in source. Persistent database/media use /data. QNAP remains the future native host; no legacy data was imported or deleted.

## Implemented
- Shared tab navigation, direct HTML fallback, Back/refresh, isolated sheet and Ghost preview.
- Galaxy background, static/reduced-motion fallback, PWA manifest/shortcuts and safe offline notice.
- Firebase session/login/onboarding foundations and bounded authentication requests.
- Steps 3.1/3.2: editable names/photos, four automatically saved two-colour themes, default-off splash and theme-colour effect preference. See ACCOUNT.md.
- 39 automated tests pass. Current production dependency audit: zero vulnerabilities.

## Verification limits / next
Authenticated phone edits, uploaded photos across sessions, splash rendering and saved theme switches need the device acceptance checklist in ACCOUNT.md. WebGL is unavailable in this QA browser. Password reset and full session revocation acceptance from LIVE-ACCEPTANCE.md remain to confirm. No test here claims a production-scale catalog, permissions model or migration.
After Account acceptance, proceed to Step 4.1 worlds/parties/memberships, reviewing the separate feature patches before merging. Keep other planned data features as placeholders.

## Run
Node >=24. npm start: isolated static preview. npm ci && npm test: checks. npm run build:cloud and npm run start:cloud: configured cloud build/server (see CLOUD-SETUP.md for environment and volume). Local API is optional and auth disabled by default. Never package credentials, runtime databases, node_modules or private backups. Deployment source is synced to the new repository; old Mount-Aetheria remains read-only.
