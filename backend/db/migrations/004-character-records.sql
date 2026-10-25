CREATE TABLE characters (
 id TEXT PRIMARY KEY,
 owner_id TEXT NOT NULL REFERENCES users(id),
 name TEXT NOT NULL,
 sources_json TEXT NOT NULL DEFAULT '[]',
 archived INTEGER NOT NULL DEFAULT 0 CHECK(archived IN (0,1)),
 schema_version INTEGER NOT NULL DEFAULT 1,
 revision INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE INDEX characters_owner_id ON characters(owner_id,id);
CREATE INDEX characters_archive_id ON characters(archived,id);
