# Step 4.2 — character controls

Version 0.6.0. Admins can add character metadata records, rename them, transfer ownership to an existing Comos player, edit up to ten source ID/version pairs, search, and archive/restore. The character wizard, player-facing cards, portraits and sheet state remain later steps. This screen does not import, validate or combine game rules. Source metadata describes versions; actual source adapters and compatibility checks belong to Step 8.

Live records start empty. No legacy characters or private backups have been imported. An archived record stays in the database and can be restored; there is no permanent delete operation here. The schema reserves stable UUIDs, schema versions, timestamps and per-record revisions for later feature modules. A lost-response create retry uses the same UUID, preventing duplicate characters.

## Access

The server grants admin access only to Firebase UIDs explicitly listed in COMOS_ADMIN_FIREBASE_UIDS (comma-separated). No roles are granted automatically. To enable your account, copy your own UID from Firebase Console → Authentication → Users and set that variable on Railway service feisty-freedom, then apply/redeploy. Use the same allowlist for Groups and Character controls. Do not enter a service-account private key in the browser or repository.

Characters shows the Admin panel entry only after the server confirms admin access. Every admin API independently verifies the session and allowlist. A hidden button, client header, role field, Ghost link or URL parameter cannot grant access. /api/v1/access returns only the current session's admin boolean. Player lookup is admin-only, bounded to 50 matches and contains Comos IDs/display names, not emails or Firebase identifiers.

Writes require the configured exact Origin, bounded JSON, validated fields and a matching record revision. List queries return 20 metadata records with stable ID cursors. Ownership transfer cannot target nonexistent players. The public character list remains a placeholder until Step 7; no player character-read API is exposed in this slice. When later reads arrive, ownership/scoped authorization must use the current owner ID and precede pagination.

## Phone acceptance

1. Open /preview/admin.html. Edit the sample character, rename it, choose Second player and add a sample source ID/version. Save and confirm the new summary. Preview rules are synthetic metadata only.
2. Add another record. Archive it, search with Archived checked, then restore it. Change the name search and navigate between tabs. Ghost changes last through soft navigation, reset on refresh, and never write to real accounts.
3. After configuring your real admin UID, open /admin.html, register a metadata record for a signed-in Comos player and refresh. Confirm persistence, owner/source edits, archive/restore and search. Existing users must have logged into Comos once before they appear in player lookup.
4. With an ordinary account, the Characters admin entry is hidden and direct admin data access is denied. With two admin sessions editing one record, the stale save is rejected rather than overwriting the newer edit.

## Verification

44 automated tests pass: durable character metadata, ownership transfer, source validation, cursor bounds, idempotent create retries, revision conflicts, archive/restore, admin/ordinary/signed-out isolation, exact-Origin enforcement, and existing account/auth/group regressions. Browser Ghost QA exercised edit/ownership/source, add and archive/restore. Narrow viewport QA covers 320 CSS pixels (305 content pixels with the browser's scrollbar). Authenticated live phone edits still need the checklist above; tests use synthetic sessions, never bypass the live Firebase verifier.

## Later integration

Step 7 can query summaries through an owner-scoped API; Step 8 can attach valid wizard selections to these records; Step 9 can add separately versioned sheet state. Avoid coupling metadata queries to rules catalogs, portraits or full sheets. Legacy imports need explicit ID/source mapping and user review before any real records are imported.
