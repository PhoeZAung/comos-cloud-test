-- Step 5: signed-in, world/party-scoped text posts. Older migrations are immutable.
CREATE TABLE feed_posts (
  id TEXT PRIMARY KEY NOT NULL,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  client_request_id TEXT NOT NULL,
  world_id TEXT NOT NULL REFERENCES worlds(id) ON DELETE RESTRICT,
  party_id TEXT REFERENCES parties(id) ON DELETE RESTRICT,
  body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 2000),
  created_at TEXT NOT NULL,
  UNIQUE(author_id,client_request_id)
) STRICT;
CREATE INDEX feed_posts_timeline ON feed_posts(created_at DESC,id DESC);
CREATE INDEX feed_posts_world ON feed_posts(world_id,created_at DESC,id DESC);
CREATE INDEX feed_posts_party ON feed_posts(party_id,created_at DESC,id DESC);