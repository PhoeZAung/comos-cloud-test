CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL DEFAULT '' CHECK(length(display_name) <= 80),
  theme TEXT NOT NULL DEFAULT 'system' CHECK(theme IN ('system','dark','light')),
  profile_state TEXT NOT NULL DEFAULT 'incomplete' CHECK(profile_state IN ('incomplete','complete')),
  schema_version INTEGER NOT NULL DEFAULT 1 CHECK(schema_version = 1),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE TABLE external_identities (
  provider TEXT NOT NULL,
  issuer TEXT NOT NULL,
  subject TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  schema_version INTEGER NOT NULL DEFAULT 1 CHECK(schema_version = 1),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(provider, issuer, subject)
) STRICT;
CREATE INDEX external_identities_user ON external_identities(user_id);
CREATE TABLE media (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  storage_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK(size_bytes >= 0),
  sha256 TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility = 'private'),
  schema_version INTEGER NOT NULL DEFAULT 1 CHECK(schema_version = 1),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE INDEX media_owner ON media(owner_id, id);
CREATE TABLE legacy_record_map (
  source_system TEXT NOT NULL,
  source_path TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  import_version INTEGER NOT NULL CHECK(import_version > 0),
  schema_version INTEGER NOT NULL DEFAULT 1 CHECK(schema_version = 1),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(source_system, source_path)
) STRICT;
