# Lore tag visibility (2026-10-25)

## Visibility and the reserved Admin tag

- Lore is private by **character tags**, enforced in the server's database queries. A signed-in player sees a story when **any active character they own has any tag linked to that story**. The original author can also see their own entry, including an entry without tags.
- **Untagged Lore is author-only**, plus Admin viewers. This keeps older entries from accidentally becoming public.
- A character with the reserved **Admin** tag gives its owning player visibility into **all Lore entries**, including untagged ones. This is strictly a **Lore visibility privilege**: it does **not** grant website admin actions like Delete Lore or Edit Someone Else's Lore.
- Verified Firebase administrators, including the Google owner configured in `backend/auth/firebase.mjs`, see all Lore regardless of characters. The server automatically attaches Admin to their oldest active character when visiting Lore or retrieving character tags; when they create/import their first character, that character gets Admin. The grant is idempotent.
- Reserved Admin ID: `00000000-0000-4000-8000-0000000000ad`. Migration 017 creates it. Prior user-defined tags named “Admin” are renamed to “Admin (legacy XXXXXXXX)” before insertion to avoid inadvertently granting access.
- Only verified administrators can assign Admin via **Admin → Character Control → Tags**. The reserved tag cannot be renamed. Character-file imports and legacy backup imports cannot attach Admin or spoof its display label.
- Admin-tag holders and verified administrators receive all tag options in the Lore filter and creator. Ordinary players get only their active characters' tags.

## Server enforcement

- `GET /api/v1/lore`: authorization filter is applied **before** sorting, searching and cursor pagination. A forged filter cannot expose another player's Lore.
- `GET /api/v1/lore/:id`: unauthorized stories return **404**, even with a direct link.
- `GET /api/v1/lore-images/:id`: unpublished images stay private to their uploader. Published images can only be opened by a member allowed to read the story, or by the image owner.
- `POST /api/v1/lore`: regular players can attach only tags their active characters possess; Admin tag holders and verified admins can use any existing tag.
- Lore author/edit permission is unchanged. A character Admin tag grants reading, **not** administrative mutation rights. Removing the Admin tag (or archiving the only character holding it) revokes Lore-wide access for a non-verified-admin user on their next request.

## Suggested checks

- Ordinary player with one character tag sees only own + matching-tag Lore.
- Player without any matching tag cannot read another author's story from search, a direct link, or its image URL.
- Adding Admin to one of a player's characters via admin character controls immediately grants full Lore reading; removing it revokes access.
- Verified Google admin sees all stories without needing to create a character; an existing character automatically gets the Admin tag.
- Imported character JSON containing `group_tags: ["Admin"]` does not grant the special tag.
