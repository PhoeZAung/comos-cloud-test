# Step 2.3 — authentication progress, version 0.2.3

## Status
The portable site has interactive form previews, and the real Firebase adapters and opt-in API bootstrap are implemented. Step 2.3 is NOT complete. No credentials are included or configured; no real provider request, account creation, reset email or account migration has been executed.

## Preview behavior
Sign in and Sign up use shared labels, responsive styles, Show/Hide, field errors and status announcements. Sign in includes a collapsible reset-email form. Buttons say Check form; they only validate sample details. Google is disabled. Submission buttons are disabled until the local module loads; CSP blocks connections and form submission. Preview never imports the real adapters. Query flags cannot enable real authentication.

## Real source adapters
`src/auth/firebase.mjs` uses the official browser SDK with in-memory provider persistence. It implements email sign-in/sign-up, Google popup and reset. `src/auth/service.mjs` exchanges only the verified provider token with the same-origin API, restores the server cookie session, rejects duplicate concurrent operations, and clears provider state after exchanges. Reset messaging avoids account-enumeration responses. These modules are not in dist. The separate live controller/build is now implemented; see LIVE-AUTH.md.

`backend/auth/firebase.mjs` uses the official Admin SDK and Application Default Credentials. It stays disabled unless COMOS_AUTH_MODE=firebase. Invalid/incomplete configuration or credential resolution failure stops startup; it never falls back to fake authentication. Emulator mode is rejected. Credentialed mode is for a controlled HTTPS staging setup; do not expose the current preview/API as a finished application.

## Native server configuration for later staging
Run npm ci to install the lockfile, then configure these on the server, outside the source ZIP:
- COMOS_AUTH_MODE=firebase
- COMOS_FIREBASE_PROJECT_ID: explicit existing/staging project ID
- COMOS_AUTH_ORIGIN: exact HTTPS browser origin, without a trailing slash
- Application Default Credentials, typically GOOGLE_APPLICATION_CREDENTIALS pointing to a securely managed server-only credential file outside dist and the source package. Do not paste keys into chat or put them in browser code.

npm run api continues to bind to 127.0.0.1. A future native HTTPS reverse proxy must serve the configured real frontend and /api/ on the same origin. Configuring these variables does not publish anything, modify Firebase provider settings, or activate the fixture forms. Confirm provider enablement, authorized domains and migration readiness before live use.

## Session boundary
ID tokens and cookies use official verification with revocation checking. Project, issuer, subject, expiry and unsupported tenant checks are explicit. Recent sign-in within five minutes is required for a five-day cookie. Atomic identity mapping retains the same internal user across repeat login, and never merges by email. New profiles remain incomplete until onboarding is implemented.

GET /api/v1/auth/session restores identity. POST exchanges a provider ID token for a Secure, HttpOnly, SameSite=Strict, host-only cookie. POST /api/v1/auth/logout revokes provider sessions on all devices and clears the current cookie. The eventual UI must label this all-device sign-out. Exact configured HTTPS Origin is required for mutations, request bodies are bounded, duplicate cookies rejected, no CORS allowance, no browser-supplied user ID. Known provider availability/permission errors return 503 without clearing an existing cookie. All other data endpoints remain denied even for an authenticated session.

## Dependencies
Firebase browser SDK 13.1.0 and Admin SDK 14.5.0 are exact dependencies with package-lock.json. A transitive @grpc/grpc-js override pins 1.13.6 to address the older Firestore dependency's audit advisory. Comos imports only Firebase App/Auth, not Firestore or Storage. Recheck/remove this override when upstream resolves the dependency. These SDKs are not included in the static phone bundle.

## Remaining before Step 2.3 is complete
- Verify implemented display-name/profile completion and interrupted signup recovery with real provider sessions.
- Integrate and test the separate live build at the configured HTTPS origin; preserve the fixture build (Step 2.4 boundary).
- Configure a trusted Firebase project, providers, server credentials and authorized HTTPS origin.
- Test real email/password, Google popup/redirect on Android, password reset, expiry/revocation, sign-out and returning sessions.
- Validate the implemented process-local throttling with the actual trusted proxy and finish live error recovery checks before release (THROTTLING.md).
- Retain the migration review from AUTH-AUDIT.md; no existing data is automatically imported.

Official references checked:
https://firebase.google.com/docs/admin/setup
https://firebase.google.com/docs/auth/web/password-auth
https://firebase.google.com/docs/auth/web/auth-state-persistence
https://firebase.google.com/docs/auth/admin/verify-id-tokens
https://firebase.google.com/docs/auth/admin/manage-cookies

## Profile completion endpoint
POST /api/v1/auth/profile accepts only displayName and revision. It derives the owner from the session, requires the configured Origin, validates a trimmed 1–80-character name, and completes only an incomplete profile. Repeating the same completion is idempotent; conflicting values return 409. GET session returns current completion state so refresh or later sign-in can resume. No profile image/role/membership updates are accepted here.
