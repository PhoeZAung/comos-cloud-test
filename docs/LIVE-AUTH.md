# Separate live authentication build — version 0.2.3

The portable `dist/` folder is always a local-only fixture preview. Its form checks do not create accounts or save names. The real controller is built separately and is not loaded by the phone preview.

## What is implemented
- Email/password sign-in and sign-up, Google popup entry, reset form, server session restoration, and all-device sign-out UI.
- Display-name completion after authentication. An incomplete user sees Finish your profile; a complete user can continue to Home. A restored incomplete session resumes setup without recreating the account.
- The API derives the profile owner from the verified session, rejects client-supplied owner IDs, validates name/revision, and saves completion once. Lost-response retries of the same name return the existing record. Different concurrent completion attempts return 409.
- The initial profile can only be completed here, not edited after completion; editing/photo uploads remain Step 3.
- Failed session exchange after provider account creation tells the user to sign in with the same account to resume. Names are not treated as identity keys; matching email never merges users.
- Known session loss returns to the sign-in controls while keeping the in-page display-name value. Unsaved drafts are not stored across page reloads. Only completed real profiles persist.

## Build without publishing
Install dependencies with `npm ci`. Create a public configuration file outside the source tree with only this shape (replace all sample values):

```json
{
  "origin": "https://your-staging-host.example",
  "firebase": {
    "apiKey": "YOUR_PUBLIC_FIREBASE_WEB_API_KEY",
    "authDomain": "your-project.firebaseapp.com",
    "projectId": "your-project",
    "appId": "YOUR_FIREBASE_WEB_APP_ID"
  }
}
```

Run `npm run build:live -- /absolute/path/public-auth.json`.

The build validates configuration, rejects unknown/private fields, bundles the official browser SDK with esbuild, and generates `dist-live/`. It does not deploy, start a public service, change Firebase settings or copy server credentials. It leaves `dist/` as a fixture and includes an independent `dist-live/preview/` copy with its restrictive CSP. Ghost mode from live entry screens opens that copy.

The real script is loaded only by sign-in/sign-up/account. Other game routes remain placeholders. Data endpoints still deny requests until their own feature steps implement authorization. A visible static page is never evidence of data permission.

## Native HTTPS integration still required
Configure the API as described in SESSIONS.md. The configured browser origin and server COMOS_AUTH_ORIGIN must match. Serve the live static files and /api/ behind the same native HTTPS origin; keep the API bound to loopback. Apply the live CSP/no-store/referrer headers in dist-live/auth-headers.json to live routes, and the fixture policy to preview routes. Do not apply a live connection policy to the fixture copy. The existing server.mjs serves only dist and is not this live host.

The current Firebase adapter accepts the project-owned firebaseapp.com auth domain. Custom-domain/redirect integration is deliberately not inferred. Test Google popup behavior on Android before considering redirect fallback. Configure provider enablement and authorized domains in the intended staging project. Store Admin credentials only on the server, outside source/dist/ZIPs; do not paste them in chat.

## Remaining before sign-off
Real provider proof verification, sign-up/sign-in/reset emails, Android Google popup behavior, HTTPS cookies, expired/revoked sessions and end-to-end onboarding have not been exercised. Process-local throttling is implemented; verify trusted reverse-proxy per-client limits before public release (THROTTLING.md). Review legacy migration readiness before pointing at existing accounts. Step 2.3 remains open and Step 2.4 integration acceptance remains pending.

## Tested here
24 automated tests pass. Backend tests cover profile restoration after database reopen, duplicate completion, conflict handling and cross-user denial. Browser tests cover the fixture name form's invalid/valid feedback, focus, cleared errors and desktop/320 px layout without horizontal overflow. The live bundle compiled with synthetic public configuration, produced 21 live routes and 21 isolated preview routes, and left the original preview bytes unchanged. Synthetic configured output was removed before packaging. This does not validate a live Firebase account.
