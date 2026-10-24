# Fixture preview contract

All 21 routes use the developer preview build. `npm run build` (optionally with `-- --mode=preview`) generates it. Other build modes fail before output files are changed. Browser URL parameters, storage values, cookies, and embedded-host identities do not select a different adapter.

## Feature integration
Future page feature modules can import `preview` from `dist/preview/runtime.mjs` in the generated site. Source tests import from `src/preview/runtime.mjs`. `preview.mode` is fixed to `fixture`, `preview.authenticatedUser` is null, and `preview.data` owns a private memory store.

Supported collections: profiles, characters, posts, replies, lore. A synthetic profile is provided; the other collections start empty. There are no copied accounts or campaign records and nothing is rendered into the current placeholders.

The adapter exposes list, get, create, update, remove, and reset. Every read returns a detached copy. The store assigns IDs beginning with `fixture:` and rejects other IDs. Each new context starts fresh. Reload and cross-page navigation discard edits. There is no persistent or cross-page draft support at this stage; Step 8 owns wizard draft behavior.

## Isolation
- No fetch client, API base URL, browser persistence, sign-in SDK, or real identity.
- All runtime modules are bundled locally; no network data requests are required.
- Browser policy blocks fetch/XHR/WebSocket connections, form submissions, workers, and frames inside the preview document; local scripts/styles/images remain allowed.
- A synthetic display profile is not an authenticated user, admin grant, or bearer credential.
- The local static server rejects write methods and exposes no live API.
- `--mode=production` fails; there is no fallback to a real environment.

When real services arrive, use separate production configuration and entry points, exclude fixtures from production, and enforce authentication/authorization on every API operation. A user can modify client files; client-side restrictions never replace server authorization.

## Checks
`npm test` builds the site and runs the dependency-free Node tests. They cover isolation/reset, detached data, no network calls from the adapter, rejected IDs, rejected production builds, all 21 routes and local references, preview policy, query-parameter non-escalation, module MIME types, absent APIs, and rejected write requests.

The preview runtime requires HTTP module loading. Direct `file://` and Android `content://` viewing can restrict modules and neighboring assets; use a local HTTP server for interactive previews.
