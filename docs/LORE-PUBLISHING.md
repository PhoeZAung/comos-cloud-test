# Comos Lore: popups, ordered pictures and sorting

- **Lore list** now defaults to **Latest** (created-at descending). The icon immediately to the right of the tag icon opens a sort popup offering **Latest** or **A–Z**. Sorting is done by the server, with stable cursors per sort.
- **Tag filter** opens a centered modal, rather than expanding beneath the toolbar. Its choices still come exclusively from the signed-in player's active character tags; backend checks the same authorization. Search remains a compact toggle.
- **Lore titles** remain a minimal list, with larger type. Clicking a title opens a reading dialog with a dimmed backdrop and close button; `lore-entry.html?id=...` remains a link fallback.
- **Lore composer** uses a tag icon that opens its tag picker. Content consists of ordered text paragraphs and images. Use **+ Paragraph** or **+ Image**, plus up/down/remove controls to arrange content as paragraph → paragraph → image → paragraph → image. Up to 12 still JPEG/PNG/WebP pictures (5 MB each), up to 40 content blocks and 10,000 total text characters.
- Pictures are resized safely by the server, stored on the existing persistent media volume, and displayed responsively inline in the reading dialog. Uploads are restricted to the owning user; published pictures are readable by signed-in members. The database stores image IDs, never arbitrary image URLs. New migration 014 keeps text-only Lore fully backward compatible.
- **Pause stars** moved from the footer to Account → Effects, next to Splash cursor. It persists per account via migration 015; reduced-motion support is unchanged.
- No Railway connection or manual deployment step needed: GitHub triggers existing deployment.

QA:
1. Publish two Lore entries on different dates; Latest shows newest first, A–Z sorts titles.
2. Filter by an owned tag from the dialog and try a tag not attached to your characters (server must reject).
3. In New Lore add paragraphs and images, reorder them, and choose tags in the icon popup. Publish and confirm both picture positions in the reading dialog.
4. Try viewing an unpublished image from another signed-in account (must return 404); published images should load for signed-in members.
5. On Account, toggle Pause stars and refresh: the setting should persist and the footer button should not appear.


## Edit Lore and threaded Home discussions — 2026-10-25

- **Edit Lore** is available in the Lore reading popup (and direct detail page) to the original author and verified admins. It opens `lore-compose.html?id=<entry-id>` with title, paragraphs, inline images, image descriptions and tags loaded.
- `PUT /api/v1/lore/:id` checks the Firebase session, CSRF Origin and that the editor is the original author or an administrator. It enforces `expectedUpdatedAt` to prevent stale edits from overwriting newer ones (HTTP 409).
- Existing inline image IDs can be reused and reordered on the *same* entry, while newly added images must be uploaded by the editor. Removing images detaches them from the published Lore. The Lore author, ID and original creation date are unchanged.
- Edited tag choices come from the **original author’s character tags** (even when an admin edits someone else’s entry). Existing historic tag links may be retained or removed; new tags require the author to own that active character tag. This does not permit creating tags for other people.
- Home replies now permit nested replies of any depth. The API still validates that the parent reply belongs to the same post. Replies are displayed within parent branches with muted vertical guide lines and elbows. On narrow screens, extra indentation stops after a few levels, but the “Replying to [name]” context remains. The reply editor opens directly beneath the selected comment.
- Revisit pagination if a future high-volume post has >20 replies: the current feed can show orphaned replies until their parent page is loaded. It displays parent names from the database even if the parent record isn't loaded.
