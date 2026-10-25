> **Updated player UI (2026-10-25):** The Characters page no longer displays the JSON Import button, “Character collection,” or saved-character counts. A single icon toggles the rotating cards and a flat, dark-gray character list, with no user grouping. The existing private import backend remains unchanged for compatibility.

# Comos — Home profile photos, threaded replies and character carousel

## What changed
- Home author avatars and post-thread avatars use the profile image currently saved on the member account. When no avatar exists, render a neutral silhouette instead of the initials. Images are served only to signed-in members by `GET /api/v1/member-avatars/:userId`.
- Replies can target other replies. `POST /api/v1/posts/:id/replies` accepts optional `parentReplyId`. The server verifies that the parent belongs to the same post, retains idempotent `clientRequestId` semantics, and rejects cross-post nesting. Deleted parents promote remaining child replies to top-level; deleting the post still cascades to all replies. Migration 012 adds `parent_reply_id`.
- Step 7 Characters no longer shows the “Player character cards are coming” panel. The live carousel reads only the signed-in user's saved characters from `GET /api/v1/my/characters` (40 per page, cursor supported) and reads attached tags and existing sheet metadata. The component is a compact transparent 3D coverflow inspired by `PhoeZAung/Dark-Grasp`'s `dg-oasis-carousel`. Swipe, arrow controls and keyboard arrows rotate; reduced-motion preferences are respected.
- A JSON Import button creates a **new character owned by the currently authenticated user** using `POST /api/v1/my/characters/import`. Import retains JSON sheet data, known sources, and links tag names already created in Comos, without granting authorization through tags. Imported IDs and ownership fields from files are ignored. Existing legacy-imported characters automatically appear in the same owner list.
- Image support: currently uses safe inline PNG/JPEG/WebP data images in a character's saved data; otherwise uses a silhouette placeholder. Separate character image uploads and editable bios are future work, not claimed to exist. An existing saved text `bio` is displayed if present.

## QA
1. Sign in with a profile photo, open Home and an existing post. Avatar should match Account PFP and should also show on that user's replies.
2. Reply to a reply; the new comment should appear indented beneath that reply and have its own Reply action. Delete the parent and confirm the child remains.
3. Sign in as a different member; verify this member's Characters page shows only their records and none of the other member's.
4. Import a one-character JSON file containing `charName`, `level`, `race`, `group_tags`, and existing sheet fields. The imported character should appear in the rotating cards and be viewable in the sheet.
5. Try a malformed JSON or an external redirect as a portrait URL; file import should reject malformed data, and unsafe image URLs should never be embedded.
6. Test narrow mobile widths, swipe gestures, arrow keys, and reduced motion. Preview mode uses fake characters, and cannot write to production.

## Validation boundaries
- API routes restore the server-side session; `ownerId` is never accepted from the browser for importing or viewing the user's library.
- Character import requires a completed profile; JSON is bounded to 250 KB, validates object keys and structural depth, and runs in a transaction.
- Comos admin directory and tag manager remain unchanged.
- Login and Firebase identity logic remain unchanged.
