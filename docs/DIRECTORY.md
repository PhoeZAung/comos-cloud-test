# User directory, character tags and saved sheets

The owner requested removal of public Ghost mode. The live build no longer packages the fixture site, and the native static handler rejects /preview and /preview/*. Sign-in and landing pages no longer offer Ghost links. Local developer test fixtures remain separate; they are not deployed or an authentication bypass.

The admin panel has two icon tabs (characters and items). Groups is removed from the tab bar; existing unrelated scope data is retained. The exact uploaded party PNG was unavailable, so the characters tab uses a temporary native SVG party icon pending re-upload.

The character directory contains a Find character / user search, a tag-management button, and expandable display names. Opening a user fetches only their paginated character summaries. Each character has a tag modal, a new-window saved-sheet link and a wizard edit link. Tag management is a separate page with a return link. Old add/reload/download controls and the visible Character controls heading are removed.

Display names are reserved through a unique normalized NFKC/lowercase key on the server. Existing/imported duplicates receive numeric suffixes. Account and onboarding edits reject a taken name. Names and all saved character content are escaped when rendered.

## Private restoration

The supplied auth and Firestore backups remain available locally. A sanitized, compressed payload contains only legacy UID/display-name mappings and the 20 character records; password hashes, salts, credentials, unrelated campaigns and catalogs are excluded. The payload is supplied through private Railway variables, never public source or assets. At startup the official Firebase account directory is authoritative. Existing Firebase identities are linked to Comos IDs; no Firebase passwords or account records are overwritten. Character owners match exact provider/project/UID mappings. Missing current Firebase owners are not reassigned to someone else.

Imports are transactional and idempotent by legacy owner/document key. The complete original saved character JSON is retained, including inventory, abilities, resources and other fields. Existing Comos account names and preferences are preserved. Live deployment logs provide aggregate import counts only, never private names or sheet content.

## Live sheet and editing limits

The external control opens a current, authenticated saved-sheet view with overview, inventory and abilities. It is a read-only saved-data view, not the fully ported legacy interactive sheet or Owlbear integration. The editing wizard currently saves name, race, class and level with revision checks. Other legacy fields are preserved; class/level edits do not recalculate stats or rebuild ability selections. Full rules adapters and calculations remain future work. Source selections remain preserved rather than guessed.

Character reads/edits require the owner or a server-authorized admin. Directory and tag management are admin-only. Tag assignments require admin authorization and revision checks. Legacy group_tags labels are mapped to independent character tags; changing these tags does not grant unrelated world/party permissions.

## Verification and phone tests

70 automated tests cover current behavior, including unique names, repeat imports, sheet-data preservation, owner/admin isolation, tag assignment, conflicts, and retired preview routes. A separate local UI mock with synthetic data checked expand/collapse, the tag dialog and 320px layout. It is not deployed. Authenticated phone behavior must still be checked by the user.

Refresh → Characters → Admin panel. Search a display name or character; expand a user; open the tag popup, assign a tag and reopen it. Use the top tag button to add/rename tags and return. Open a saved sheet in a new tab. Use Edit to change a character name and verify the sheet updates. Try a duplicate display name in Account and confirm rejection. Verify /preview/home.html is no longer available.
