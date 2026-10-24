# Comos cloud test — Phase 2.3 / 2.4

This is a separate deployment copy of Comos 0.2.4, updated to 0.2.5. It does not include the separate Home or Phase 4.1 patches made in another chat. Do not replace those files without a merge review.

## What is ready
- Node 24 cloud entry serves live pages and /api on one origin, PORT defaults to 8080, binds 0.0.0.0 behind the host HTTPS proxy.
- Firebase Google and email/password client are compiled using the supplied public config.
- Server credentials come from a private environment variable, never the browser bundle.
- SQLite and media use a persistent volume outside public files.
- Ghost preview retains its restrictive policy and cannot call data APIs.
- 31 automated tests pass. Live cloud deployment and actual provider login remain unverified.

## Browser-only deployment
1. Extract this ZIP. Create a NEW private GitHub repository named comos-cloud-test. Do not use or overwrite PhoeZAung/Mount-Aetheria.
2. Upload the CONTENTS of the extracted comos-cloud-test folder to the repository root. package.json, package-lock.json and railway.toml must be at root. Include backend/, scripts/, src/, dist/, tests/ and docs/. Do not upload the ZIP itself, backups, credentials, node_modules or runtime data. If the GitHub browser upload limit is reached, upload folders in multiple commits before connecting Railway.
3. In the existing Railway service feisty-freedom, attach a persistent volume mounted at /data. Keep one replica. Set the variables below BEFORE connecting the source. There is no need for a separate PostgreSQL service for this test.
4. Firebase Console > Project settings > Service accounts > Firebase Admin SDK > Generate new private key. Put the downloaded JSON contents ONLY into Railway's private variable COMOS_FIREBASE_SERVICE_ACCOUNT_JSON. Prefer a sealed variable if offered. Do not upload this key to GitHub, chat or the website. An administrator should review service-account privileges before wider release.
5. Railway service > Settings > Connect Repo: choose the NEW comos-cloud-test repository. The included railway.toml builds and starts it. Keep domain target port 8080. If a deployment runs before credentials/volume are set, startup intentionally fails; configure them then redeploy.
6. Ensure Firebase Authentication has Google and Email/Password enabled. Authorized domains must contain feisty-freedom-production-304e.up.railway.app (already added by user).

## Railway variables
PORT=8080
COMOS_AUTH_MODE=firebase
COMOS_AUTH_ORIGIN=https://feisty-freedom-production-304e.up.railway.app
COMOS_FIREBASE_PROJECT_ID=mount-aetheria
COMOS_DATA_DIR=/data
COMOS_MEDIA_ROOT=/data/media
COMOS_FIREBASE_SERVICE_ACCOUNT_JSON=<entire private service-account JSON, entered only in Railway>

Do not set credentials as build arguments or place them in public-auth.json. Do not set FIREBASE_AUTH_EMULATOR_HOST. The server refuses missing/mismatched live configuration and inaccessible credentials.

## What to test on your phone
1. /api/v1/health returns status ok and authentication configured. This confirms startup, not successful end-to-end login.
2. Landing and Ghost mode load; Ghost routes remain accessible without signing in.
3. Sign in using an existing Google account. Complete the initial Comos profile if asked. No old Firestore profiles are imported.
4. Test email/password login with a dedicated existing test user, then create a dedicated test account if desired. Signup creates a REAL Firebase user.
5. Refresh Account: the session/profile should restore. Test password reset with your own test email.
6. Sign out on all devices. This revokes that user's sessions, including other apps using the same Firebase project; use a test user to avoid disrupting your normal account.
7. Restart the Railway service: a completed profile should persist on /data.
8. Check Google popup behavior in Android Chrome. If it fails, record the visible message; do not weaken authorization or browser policies.

## Scope and limitations
No old Firebase resources have been deleted. No legacy database, users or Firestore export has been imported. No code has been pushed or deployed by this chat. Future QNAP hosting remains native Node without Docker. Cloud runtime here is a temporary test host; Railway manages its own build infrastructure.
The limiter is process-local and groups requests by socket peer; a reverse proxy can place users in the same bucket. No production-scale or per-client proxy protection is claimed. Do not open this test to a broad audience before proxy-aware rate limiting, live auth verification and operations review.

## Changed files for integration
New: backend/cloud.mjs, backend/http/static.mjs, tests/cloud.test.mjs, public-auth.json, railway.toml, CLOUD-SETUP.md.
Changed: backend/http/app.mjs adds optional static handler after API routes; backend/auth/firebase.mjs supports private JSON credentials with project matching; package.json/package-lock.json bump to 0.2.5 and add build:cloud/start:cloud; .gitignore excludes private/runtime files.
Existing local npm start remains a fixture-only preview. Use npm run build:cloud and npm run start:cloud for hosting.
