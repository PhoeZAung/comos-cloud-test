-- Step 5.3: site-wide announcements authored by verified admins.
-- Existing scoped posts and their replies are copied transactionally by migrate().
-- feed_posts.world_id is nullable ONLY for site-wide announcements. The API
-- enforces that ordinary members cannot publish this scope.
CREATE TABLE feed_posts_rebuilt (
  id TEXT PRIMARY KEY NOT NULL,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  client_request_id TEXT NOT NULL,
  world_id TEXT REFERENCES worlds(id) ON DELETE RESTRICT,
  party_id TEXT REFERENCES parties(id) ON DELETE RESTRICT,
  body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 2000),
  created_at TEXT NOT NULL,
  UNIQUE(author_id, client_request_id),
  CHECK(world_id IS NOT NULL OR party_id IS NULL)
) STRICT;
INSERT INTO feed_posts_rebuilt (id,author_id,client_request_id,world_id,party_id,body,created_at)
SELECT id,author_id,client_request_id,world_id,party_id,body,created_at FROM feed_posts;
-- Remove dependent table before dropping its parent, preserving every reply.
CREATE TABLE feed_replies_saved AS SELECT * FROM feed_replies;
DROP TABLE feed_replies;
DROP TABLE feed_posts;
ALTER TABLE feed_posts_rebuilt RENAME TO feed_posts;
CREATE INDEX feed_posts_timeline ON feed_posts(created_at DESC,id DESC);
CREATE INDEX feed_posts_world ON feed_posts(world_id,created_at DESC,id DESC);
CREATE INDEX feed_posts_party ON feed_posts(party_id,created_at DESC,id DESC);
CREATE TABLE feed_replies (
  id TEXT PRIMARY KEY NOT NULL,
  post_id TEXT NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  client_request_id TEXT NOT NULL,
  body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 2000),
  created_at TEXT NOT NULL,
  UNIQUE(author_id,client_request_id)
) STRICT;
INSERT INTO feed_replies (id,post_id,author_id,client_request_id,body,created_at)
SELECT id,post_id,author_id,client_request_id,body,created_at FROM feed_replies_saved;
DROP TABLE feed_replies_saved;
CREATE INDEX feed_replies_by_post ON feed_replies(post_id,created_at DESC,id DESC);