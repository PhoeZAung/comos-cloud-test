ALTER TABLE character_tags ADD COLUMN kind TEXT NOT NULL DEFAULT 'party'
  CHECK(kind IN ('world','party','system'));
UPDATE character_tags SET kind='system'
WHERE id='00000000-0000-4000-8000-0000000000ad';
CREATE INDEX character_tags_kind ON character_tags(kind,name);
CREATE TABLE party_notes(
  tag_id TEXT PRIMARY KEY REFERENCES character_tags(id) ON DELETE CASCADE,
  state BLOB NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
) STRICT;
