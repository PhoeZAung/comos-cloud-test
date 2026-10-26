-- Persist signed-in member Lore entries independently of Home posts.
-- Lore titles sort A-Z; authors can attach only tags on their active characters.
CREATE TABLE lore_entries(
 id TEXT PRIMARY KEY NOT NULL,
 author_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 client_request_id TEXT NOT NULL,
 title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 140),
 body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 10000),
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 UNIQUE(author_id,client_request_id)
) STRICT;
CREATE INDEX lore_entries_title_order ON lore_entries(title COLLATE NOCASE,id);
CREATE TABLE lore_entry_tags(
 entry_id TEXT NOT NULL REFERENCES lore_entries(id) ON DELETE CASCADE,
 tag_id TEXT NOT NULL REFERENCES character_tags(id) ON DELETE CASCADE,
 PRIMARY KEY(entry_id,tag_id)
) STRICT;
CREATE INDEX lore_entry_tag_lookup ON lore_entry_tags(tag_id,entry_id);
