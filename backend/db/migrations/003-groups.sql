CREATE TABLE group_state (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL) STRICT;
INSERT INTO group_state VALUES(1,1,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
CREATE TABLE worlds (id TEXT PRIMARY KEY,name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 80),created_at TEXT NOT NULL) STRICT;
CREATE TABLE parties (id TEXT PRIMARY KEY,world_id TEXT NOT NULL REFERENCES worlds(id),name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 80),created_at TEXT NOT NULL) STRICT;
CREATE INDEX parties_world ON parties(world_id,id);
CREATE TABLE world_memberships (user_id TEXT NOT NULL REFERENCES users(id),world_id TEXT NOT NULL REFERENCES worlds(id),PRIMARY KEY(user_id,world_id)) STRICT;
CREATE TABLE party_memberships (user_id TEXT NOT NULL REFERENCES users(id),party_id TEXT NOT NULL REFERENCES parties(id),PRIMARY KEY(user_id,party_id)) STRICT;
