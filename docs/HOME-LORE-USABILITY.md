# Home pins, collapsible replies and Lore autosave

## Home
- Verified Firebase admins can pin and unpin site-wide posts with the small action beside Delete. Maximum **three pinned posts**; all signed-in members see these first.
- `PATCH /api/v1/posts/:id/pin` accepts only `{ "pinned": true | false }`, requires server-verified admin session and the configured same-origin header. Ordinary members cannot pin through hidden UI or forged requests.
- New additive migration `016-pinned-home-posts.sql` adds `pinned_at` to `feed_posts` and updates the `home_posts` view without destroying existing posts or replies.
- Pinned announcements are returned separately in `pinnedPosts`, ahead of the unpinned timeline. Ordinary cursor pagination excludes pinned rows, keeping paging stable and avoiding duplicates.
- Pinned Home posts have an understated accent background and a **Pinned** label.

## Replies
- Every branch with descendants gets a **Hide/Show N replies** toggle. It uses accessible `aria-expanded` and a branch target with `hidden`.
- Collapsing only hides that comment's descendants; the parent comment stays visible. The chosen collapsed IDs persist while navigating within the loaded thread. Publishing a new reply re-expands to reveal the conversation.
- Existing unlimited-depth Reddit-style parent guides and mobile indentation caps remain.

## Lore drafts
- Drafts are saved approximately half a second after a text edit, tag change, image add/remove, or block reorder, and when the tab becomes hidden.
- IndexedDB (not localStorage) stores the **ordered text/image blocks and File blobs**, title, selected tags, revision and request ID.
- The storage key is scoped to **signed-in account + new Lore or existing Lore ID**. Drafts stay on the same browser/device and aren't uploaded before publishing.
- Reopening recovers the draft automatically, with a visible status and **Clear draft** button. Publishing clears the local draft after server confirmation.
- Browsers without IndexedDB or with exceeded quota report that autosave is unavailable; an unchanged editor remains usable. Avoid assuming drafts sync across devices.
- Restored edits still obey the existing server revision conflict check, so old drafts cannot overwrite newer saved Lore without warning.

QA: Try pinning three Home announcements and then a fourth; verify ordinary members can't pin. Collapse a branch with replies several levels deep and expand it again. In Lore, type paragraphs, attach pictures, reorder, close/reopen the page, and confirm they return. Publishing should clear the draft.
