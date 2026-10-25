# Step 4.3 — item controls

Version 0.7.0. Admins can add/edit item names, source IDs and versions, categories and plain-text descriptions. Stable UUIDs, schema versions, timestamps and revision checks support later imports. Search is bounded to 20 summaries, with source filtering and cursor pagination; descriptions load only when opening an item. Archive/restore is reversible. No permanent deletion is exposed.

Live item data starts empty. Ghost mode has synthetic sample items and keeps edits only in page memory. No old catalog or campaign data has been imported, and these records do not claim FFd20 rule compatibility, calculations, prices or working Shop integration. Bulk imports remain deferred until actual source schemas and duplicate/version mapping are audited.

## Administrator provisioning

Host configuration can contain COMOS_ADMIN_BOOTSTRAP_EMAIL. The official Firebase Admin SDK resolves that account server-side and requires a verified email and an enabled account. On first success, the server pins the resolved UID in SQLite, keyed by a project/email fingerprint. Later restarts validate the same UID; a new account created at the same email cannot inherit that pin. The email is never bundled into public source or client assets. No browser field, role flag or URL parameter can grant admin access.

The pre-existing COMOS_ADMIN_FIREBASE_UIDS host allowlist remains supported. Removing the bootstrap environment variable removes its grant on restart; the database pin alone does not grant access. A deliberate account replacement needs an explicit host UID assignment after identity review. No Firebase account record, password or custom claim is changed by this setup.

A generic startup status, `Comos admin bootstrap: ready.`, verifies successful resolution without logging the email or UID. Other statuses mean no bootstrap grant was made. The production environment is configured for the owner-designated account; runtime resolution and real-phone access must be confirmed separately from synthetic tests.

## Phone acceptance

1. Refresh Comos while signed in with the designated account. Open Characters → Admin panel. Confirm Character controls, Item controls and Groups are accessible without needing a special link.
2. In Item controls, add a test item with source ID `homebrew`, source version `1`, a category and description. Save, search its name/source, edit it, then refresh to confirm persistence. These are metadata records, not activated game rules.
3. Archive the item, search with Archived checked and restore it. A stale save from another session must be rejected rather than silently overwriting a newer revision.
4. Ghost preview at /preview/admin-items.html supports the same basic flow but resets on refresh and never saves to real records.
5. Characters → Create character shows the current stage name and Back/Next only within the wizard. Follow Sources → Name & portrait → Race → Class & level and return with Back. These stages remain Step 8 placeholders.

## Verification

49 automated tests pass, including admin identity pinning/verification, revoked or mismatched identities, item validation, durable edits, revision conflicts, idempotent creation, summary/detail separation, source filtering, cursor bounds, archive/restore, signed-out/ordinary/admin access and exact-Origin checks. Existing account, character and group tests also pass after sharing admin request parsing.

Browser Ghost QA exercised adding, archiving, finding and restoring an item, checked a 320px iframe layout, and traversed the four wizard stages with Next/Back. Authenticated phone saves, real service roles and larger catalogs still require the acceptance checks above. No production-scale performance or migration result is claimed.

Next feature slice: Step 5.1 scoped Home feed, after confirming owner admin access and Groups configuration. Feed posting/personas/replies remain later substeps.
