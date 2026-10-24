# Comos — current handoff

Version 0.2.4 · 24 October 2026. Read this first, then current files for the selected slice. ROADMAP.md defines requirements; historical verification entries are not current feature status.

## Implemented and checked
- 21 portable routes, cosmic Home, shared layout/style generation and isolated Ghost preview.
- Local Node 24 SQLite/media/API foundation; default authentication disabled.
- Official Firebase adapters and separate configured live build; no credentials or live output included.
- Sign-in/sign-up/reset/profile form previews; resumable backend profile completion and safe retries.
- Authentication throttling, bounded concurrency and 429 client feedback.
- 29 automated tests passing; prior desktop/320 px profile preview browser checks passed. Full zoom/sheet accessibility review still pending.

## Not verified or enabled
Real Firebase credentials/project/provider/domain setup, HTTPS hosting, actual sign-in/reset/revocation and Android login. No real users or legacy data imported. No site published. Step 2.3/2.4 remain open until live integration acceptance passes. Authentication code and mocked tests do not establish production authorization.

## Next useful batch
Finish the remaining shell keyboard/zoom/sheet checks and use the prepared LIVE-ACCEPTANCE.md staging checklist. Real service verification needs server credentials and an authorized HTTPS environment. Do not pretend another code-only pass verifies it. Requirements and pure-module drafts for later tabs may be prepared in parallel as described in MIND-MAP.md, without prematurely enabling dependent features.

## Run and package
`npm start`: fixture site. `npm ci` then `npm test`: full tests. `npm run api`: loopback API, auth disabled unless explicitly configured. `npm run build:live -- /absolute/path/public-auth.json`: optional separate live build (see LIVE-AUTH.md). Node >=24, no Docker.

Source of truth: comos-template/. Deliverable: comos-template.zip. Exclude node_modules, credentials, runtime data, databases, generated configured dist-live, temporary QA pages and hosting metadata from the ZIP. Preserve the original Mount Aetheria transfer and legacy repository.

## Working policy
Batch related work through implementation, tests, docs and one package update. Include What to test in every continuation. Do not guess schemas, real rules, security settings or device compatibility. Drafts from regular chat require current-file review and integration tests. See MIND-MAP.md and INTEGRATION-PACKET.md.


## Separate cloud-test copy 0.2.5
See ../CLOUD-SETUP.md. Cloud build and 31 tests passed; no deployment or real Firebase login verified. This copy excludes other-chat Home/Phase 4.1 patches.


## Phase 1.3 — 0.3.0
See SHARED-SHELL.md for behavior, verification limits and phone tests. Shared navigation, session-aware landing header, supplied Galaxy background and install support added. User confirmed phone login on preceding deployment.
