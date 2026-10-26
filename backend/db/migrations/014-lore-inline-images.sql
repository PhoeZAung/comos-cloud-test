-- Ordered Lore paragraphs and inline images; old entries remain valid text-only Lore.
ALTER TABLE lore_entries ADD COLUMN blocks_json TEXT NOT NULL DEFAULT '[]';
CREATE TABLE lore_images(
 id TEXT PRIMARY KEY,
 owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 file_key TEXT NOT NULL UNIQUE,
 mime TEXT NOT NULL CHECK(mime IN ('image/webp')),
 created_at TEXT NOT NULL
) STRICT;
CREATE INDEX lore_images_owner ON lore_images(owner_id);
CREATE TABLE lore_entry_images(
 entry_id TEXT NOT NULL REFERENCES lore_entries(id) ON DELETE CASCADE,
 image_id TEXT NOT NULL UNIQUE REFERENCES lore_images(id) ON DELETE RESTRICT,
 position INTEGER NOT NULL,
 PRIMARY KEY(entry_id,image_id),
 UNIQUE(entry_id,position)
) STRICT;
