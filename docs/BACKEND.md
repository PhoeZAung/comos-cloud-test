# Step 2.2 — native API and persistence foundation

## Run

Use Node.js 24 or newer; this implementation was tested with Node 24.19.0. It uses the built-in `node:sqlite` module, without Docker. Run npm ci for the optional Firebase integration and full test suite; the default disabled-auth foundation still needs no external packages. Future QNAP runtime compatibility remains a Step 11 check, not an assumption.

- `npm start`: generate and serve the unchanged fixture website on 127.0.0.1:4173.
- `npm run api`: start the separate native API on 127.0.0.1:4174. On Windows you can also use `START-API.cmd`.
- `npm run db:migrate`: initialize/check the database schema without running the API.
- `npm test`: build and run the preview and backend tests. Tests use temporary databases and synthetic data and clean them up.

Open `http://127.0.0.1:4174/api/v1/health` on the machine running the API. Expected JSON includes `status: "ok"`, `database: "ready"`, `schemaVersion: 1`, and `authentication: "not_configured"`.

The Android static-server app serves `dist/` only; it does not execute this Node API. The site UI remains an isolated ghost preview. No API hosting/deployment or phone-accessible cloud URL has been created. A future native Node host runs the backend; cloud workspace testing does not alter the planned QNAP destination.

## Configuration

| Setting | Default | Purpose |
| --- | --- | --- |
| COMOS_API_PORT | 4174 | API port; 0 requests a free port for tests |
| COMOS_DATA_DIR | .comos-data | Private local data directory, resolved from the project root |
| COMOS_MEDIA_ROOT | <data directory>/media | Private directory for file bytes |
| Host | 127.0.0.1 | Local development only |

The database is `<data directory>/comos.sqlite`. Keep it on the server's local disk. Runtime directories cannot resolve inside `dist/`, including through symlinks. Real data directories, databases, credentials, and test data are excluded from deliverable ZIPs. Keep custom data/media directories outside the source tree when possible.

## Boundaries

`backend/http/` handles versioned HTTP responses. `backend/repositories/` defines the application-facing persistence operations. `backend/db/` handles SQLite and schema changes. `backend/media/` owns file bytes. The browser never opens the database or storage directory.

With authentication disabled (the default), only health is public and all other /api/ requests return HTTP 401. Explicit server-side Firebase configuration adds the session endpoints described in SESSIONS.md. All unrelated data endpoints remain denied. Fabricated tokens, user headers, and ghost/admin query parameters cannot change this. Other paths return 404, including direct file requests. Health accepts GET/HEAD only. No broad CORS permission is set.

Repository calls are internal server code, not HTTP endpoints. `createUserRepository` provides create/get/updateProfile with revision checks; `createIdentityRepository` provides identity lookup/linking with unique provider/issuer/subject ownership. Callers may only link identities after real provider verification is implemented. There are no passwords, credentials, legacy exports, or seeded user accounts.

## Database and migration behavior

Migration 001 establishes users, external identity mappings, private media metadata, and legacy record mappings. Domain tables for feed/lore/characters remain for their feature steps. Mutable rows carry schema version, revision, and timestamps. Internal user IDs are UUIDs. Profile completion remains explicit and initially incomplete.

Schema history records version, name, SHA-256 checksum, and applied timestamp. Startup verifies existing history, rejects altered/missing migrations, and applies pending SQL in a transaction. A failed batch rolls back its schema changes. Add a new numbered SQL file for future changes; do not edit applied migration files. Foreign keys are enabled, WAL is used for file databases, and a five-second lock timeout is configured.

Profile updates require the expected revision so a stale editor cannot silently replace a newer update. Identity tuples cannot be reassigned to another owner. SQL parameters are bound rather than interpolated.

No production-sized concurrency or latency claims are made: the database adapter is synchronous and intended for the initial small native service. Revisit measured limits as features and data grow.

## File storage

The file adapter assigns random flat UUID `.blob` keys, accepts bounded buffers (default maximum 10 MiB), stores files exclusively with private file permissions where supported, and records a hash and size. It rejects caller-supplied paths, oversized inputs, and symlink reads. Records store relative keys; they do not store Windows drive paths or browser SMB links.

The media service stores bytes then metadata, removes the new file if the metadata write fails, and filters metadata by owner before reading bytes. Cross-user reads return null. All media is private in this initial schema. No upload/download route is enabled yet. MIME/content validation, image dimensions/thumbnails, HTTP URLs, scoped group visibility, and safe rendering must be implemented before accepting user uploads. A process crash between file and metadata operations can leave an orphan file; reconciliation and backup/restore work remain planned.

## Before real use

Step 2.3 adds real provider verification, sessions, and sign-in/sign-up flows. Step 2.4 adds the separate real-mode frontend/API adapter while retaining the fixture bundle. Deployed rules, account inventories, migration reconciliation, HTTPS, and real QNAP operations are still pending. The current API is a development foundation, not a production release.

API reference consulted: https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html . Verified the needed DatabaseSync/prepare/exec behavior against the installed runtime as well.
