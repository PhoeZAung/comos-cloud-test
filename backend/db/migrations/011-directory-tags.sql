ALTER TABLE users ADD COLUMN display_name_key TEXT;
CREATE UNIQUE INDEX unique_display_name ON users(display_name_key) WHERE display_name_key IS NOT NULL;
CREATE TABLE character_details(character_id TEXT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,data_json TEXT NOT NULL DEFAULT '{}',legacy_key TEXT UNIQUE);
CREATE TABLE character_tags(id TEXT PRIMARY KEY,name TEXT NOT NULL UNIQUE COLLATE NOCASE);
CREATE TABLE character_tag_links(character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,tag_id TEXT NOT NULL REFERENCES character_tags(id) ON DELETE CASCADE,PRIMARY KEY(character_id,tag_id));
