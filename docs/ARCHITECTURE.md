# Architecture decisions

## Current delivery
Generated static HTML and shared CSS; 21 independently addressable pages. No framework, remote fonts, remote image downloads, auth SDK or rules catalog. A small preview-only module initializes an isolated in-memory fixture context. This keeps the first review fast and makes the files portable. The optional Node server is strictly a local preview utility.

Step 1.3 is complete: a zero-dependency Node generator renders independent `src/pages/*.mjs` modules through `src/layouts/site.mjs`. Headers, primary navigation, section tabs, and public/app/sheet layouts are shared. Design tokens live in `src/styles/tokens.css`. The generated `dist/` stays portable; navigation works without JavaScript, and the fixture runtime uses native ES modules when served over HTTP. This is a template, not the final application architecture. Choose a framework only when actual state/interaction complexity warrants it; do not couple the domain model to a UI library.

## Intended application boundaries
Browser UI -> feature services -> versioned HTTP API -> repositories -> database/media storage.

Feature modules: identity/account, memberships, feed, lore, character list, character wizard, sheet, shop, administration. A single modular API service is the default. Avoid microservices until measured constraints justify their operational cost. Each feature owns its queries; entering Characters must not initialize Shop or subscribe to the whole feed.

Adapters: fixture preview, API persistence, FFd20 source format, media storage and Owlbear host. Preview uses synthetic records only and cannot perform real writes. Production roles and scope checks live on the API. CSS classes and route visibility are not security boundaries.

## Data contracts to define in Step 2
All mutable records have stable IDs, schema versions, timestamps and revision numbers.

| Entity | Minimum contract |
| --- | --- |
| User | id, displayName, avatarMediaId, theme |
| Membership | userId, worldId, partyId; admin assigns; player scope derives from user identity |
| Visibility | worldId, optional partyId, optional playerId; all specified scopes match |
| Post / Reply | id, authorUserId, persona snapshot, visibility, text, media IDs, createdAt, parentPostId for replies |
| Lore | id, title, visibility, body, media IDs, version |
| Character summary | id, ownerId, portraitMediaId, name, race/class summaries, level |
| Character detail | source IDs/versions, selections, sheet state, revision |
| Rule source | id, schemaVersion, supported steps, race/class/item adapters |
| Media | id, relative key, MIME type, size, dimensions, owner, visibility |

Suggested read APIs: GET /api/v1/feed?cursor=..., /lore?worldId=...&cursor=..., /characters?cursor=..., /characters/:id, /sources/:id/races, /sources/:id/classes, /items?q=...&cursor=.... Authorization must precede pagination; never fetch everything and filter private records in the browser. Index scoped feed/lore queries by visibility and timestamp/ID. Separate character summary queries from full sheets. Validate new rule JSON before changing the live source version.

## Storage and scalability
Start with one native Node API process, SQLite and disk media, subject to QNAP runtime validation. Keep database access behind repositories and use explicit migrations. Move to PostgreSQL only when actual concurrent writes or operational needs require it. Do not place a SQLite database on an SMB share. When the service moves to QNAP, its database belongs on its own local volume.

Keep MEDIA_ROOT and data directory in server configuration. Store relative media keys in records; clients receive authorized HTTP URLs. Use thumbnails, lazy decoding, bounded file sizes and explicit dimensions. Avoid base64 images inside character records. Cache immutable rule versions; invalidate on source version changes. Cancel stale searches, page catalogs and load shop code only on entry.

## Decisions deferred for evidence
- QNAP installation method and runtime: need model/firmware/native package availability at Step 11.
- Identity provider migration: retain current behavior until existing account records are audited in Step 2.
- Race/class JSON formats: actual files and schema must be audited in Step 8; do not guess legacy field mappings.
- Final artwork/style: Step 12. Current Comos navy/violet colors are replaceable tokens.
- Which four legacy categories are worlds: configure in Step 4; six labels exist in old Story.

## Existing-project findings (read-only, 2026-10-23)
Repository: https://github.com/PhoeZAung/Mount-Aetheria (private; owner has admin access). A second similarly named public repository was not used.

- story.html: desktop primary/secondary filters, mobile equivalents, sort, expanded entry and admin editing. Firebase/Firestore with a whole-story query and client-side filtering. These behaviors inform Lore; group visibility needs a server-enforced replacement.
- account.html: Firebase profile name/image updates and persona behavior; Admin entry is currently on this page. New design moves Admin to Characters and persona selection into composer.
- signin.html: separate sign-up and home links; preserve the existing flow after a fuller auth audit.
- characters.html: includes a tools.html?embed=shop iframe and 18 linked script files including successive override layers. This is evidence for isolating features, not a measured diagnosis of all loading delays.
- characters-parts/scripts/characters-js-002-firebase-characters-module.mjs: saved sheet state includes items, weapons, spells, active/passive/racial abilities, feats and skills; retain legacy data through an explicit migration.
- README.md and package.json were not available at the repository root. No repository-wide schema/performance audit was completed. No code or private campaign data was copied into this scaffold.

Owlbear design follows official architecture documentation: https://docs.owlbear.rodeo/extensions/getting-started/ and SDK availability/readiness: https://docs.owlbear.rodeo/extensions/apis/ . Integration is deferred and must be verified in an actual room.

## Step 1.4 implementation
`src/preview/` owns synthetic fixtures, a per-context memory store, the fixed preview runtime, and the shared browser policy. Generation copies only the runtime/store/fixtures into `dist/preview/`. There is no production adapter, API URL, credential, or auth session in this bundle. Future production builds must use a separate entry point and must not include this fixture adapter.

Content-Security-Policy in generated HTML and the optional local server blocks network data connections and forms. The preview server serves static files, has no API routes, and rejects write methods. These are development boundaries, not production authorization. Production role and scope checks remain a Step 2 API responsibility.

## Step 2.1 identity findings
Read `AUTH-AUDIT.md` and its source snapshot manifest before implementing real authentication or importing users. Legacy identity is Firebase UID-based, with both email/password and Google login. The working migration direction retains provider identity initially and introduces internal user IDs plus a unique provider/issuer/subject mapping. Actual account inventories, deployed rules, role assignments, and runtime compatibility remain unverified.

## Step 2.2 implementation
The native backend is separate from the static fixture server. It uses Node 24+ built-in SQLite, transactional checksummed migrations, internal repository interfaces, and a private filesystem media adapter. Versioned health checks are available; data endpoints deny access pending Step 2.3. Runtime data stays outside dist and is excluded from source packages. See `BACKEND.md` for boundaries and testable contracts. QNAP native-runtime validation remains deferred.

## Authentication source boundary (0.2.2)
The source package now depends on Firebase App/Auth and Admin SDKs for the optional real adapter. The default dist preview still contains no Firebase SDK and no API access. Only local form validation is added to public sign-in pages. The API defaults to disabled auth; explicit server configuration enables the session routes. See SESSIONS.md.
