# Lore publishing — 2026-10-25
- A signed-in user with a completed profile can create a Lore entry using **+** on Lore. This is separate from Home's administrator-only publishing.
- Form: required title (1–140), required description (1–10000), optional tags. Add/remove controls only show tags on the currently signed-in user's active characters. Back-end verifies tag ownership again before publishing.
- SQL migration `013-lore-entries.sql` persists Lore and its tag links. Posts are idempotent by Firebase-session user and client request ID. The API is authenticated and rejects forged author IDs.
- Browse `GET /api/v1/lore` is title-sorted A–Z with search, authorized tag filtering and keyset pagination; `GET /api/v1/lore/:id` returns full text. All signed-in members can read Lore; the tags control which filters a player can select, not who can open an entry.
- `lore.html` lists **only linked titles**, rather than cards. Tapping a title opens `lore-entry.html?id=...` for the full description.
- `src/ui/lore-compose.mjs` has no image/GIF attachment publishing yet; Home media features remain unchanged.
- Tests: `tests/lore-publishing.test.mjs`, `tests/lore-library.test.mjs`, and schema version assertion in `tests/backend.test.mjs`. No Railway connection is required; the existing GitHub deployment pipeline builds `dist-live`.
