# World tags, party tags, and shared notes

Local changes only. No GitHub push or NAS deployment.

- Admin → Tags has Add world tag above Add party tag. Existing editable tags
  become Party tags; the reserved Admin tag remains a separate system tag.
  Tag names retain the existing case-insensitive uniqueness rule. Editors can
  rename tags or change their group. Linked character revisions advance so open
  sheets pick up renamed/reclassified tags.
- Lore filters, Lore publishing/editing, and character tag pickers group tags
  into World and Party. Existing Lore visibility and privileged Admin behavior
  remain based on persisted links, not editable character JSON.
- Admin navigation has Players (single-person icon), Parties (original group
  icon), and Items. Parties expands party tags directly into characters, with
  the same sheet, Owlbear status, tags, shop, edit, and level-up controls.
- Sheet → Notes has Personal and a wrapping tab for every assigned party,
  named “Party name notes”. Personal notes retain their explicit Save button.
  Party notes autosave and share one document across all characters in that
  party. World tags do not create shared notes.

Party documents use Yjs 13.6.33, bundled locally only for the notes editor.
Character-authorized POST updates are merged into a durable SQLite snapshot;
simultaneous typing/deletion is merged instead of replacing the whole text.
Same-origin SSE pushes updates immediately. Owlbear's authenticated bridge uses
one-second revision polling because its session grant cannot open native SSE.
Updates are idempotent, and reconnecting loads a complete snapshot. Cursors use
relative positions; undo/redo affects local edits. IME compositions defer remote
updates until composition completes.

Editors require ownership of an active character linked to the requested party,
or site-admin access to that linked character. World/system tags are rejected.
Every write rechecks membership after reading the request; streams check on
each update and heartbeat, with bounded lifetime and per-user connection count.
The Owlbear bridge also checks character ownership. Party note edits do not
bump the character revision or overwrite personal notes.

Text is plain, limited to 24,000 characters and 512 KiB encoded state. A pending
update is kept in tab-scoped session storage only after authorization, retried
after a connection failure, and cleared after acknowledgment. Leaving an editor
attempts a final flush; a pending draft can resume when that sheet/party reopens
in the same browser tab. This is live plain-text collaboration, without rich
text formatting, presence avatars, or a revision-history interface.

Migration 024 adds the tag kind and party_notes table. A consistent private
SQLite backup is made before updating the local database. Admin exports include
party_notes snapshots with stateBase64; SQLite backups include the entire table automatically.
No production migration or deployment has occurred. Build, syntax, and local
startup checks only; no automated tests or interactive multi-user editing were
run, following the user's request to skip testing.

References: [Yjs updates](https://docs.yjs.dev/api/document-updates),
[relative positions](https://docs.yjs.dev/api/relative-positions).
