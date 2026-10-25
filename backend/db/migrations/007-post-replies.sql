-- Step 5.2: text replies to saved member posts. Removing a post deletes its replies.
CREATE TABLE feed_replies (
  id TEXT PRIMARY KEY NOT NULL,
  post_id TEXT NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  client_request_id TEXT NOT NULL,
  body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 2000),
  created_at TEXT NOT NULL,
  UNIQUE(author_id, client_request_id)
) STRICT;
CREATE INDEX feed_replies_by_post ON feed_replies(post_id, created_at DESC, id DESC);