CREATE TABLE admin_bootstrap (
 email_fingerprint TEXT PRIMARY KEY,
 firebase_subject TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE TABLE items (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 source_id TEXT NOT NULL,
 source_version TEXT NOT NULL,
 category TEXT NOT NULL DEFAULT '',
 description TEXT NOT NULL DEFAULT '',
 archived INTEGER NOT NULL DEFAULT 0 CHECK(archived IN (0,1)),
 schema_version INTEGER NOT NULL DEFAULT 1,
 revision INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE INDEX items_archive_id ON items(archived,id);
CREATE INDEX items_source_archive_id ON items(source_id,archived,id);
