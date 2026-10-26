-- Home pin support; keep existing posts, media and replies untouched.
ALTER TABLE feed_posts ADD COLUMN pinned_at TEXT DEFAULT NULL;
DROP VIEW home_posts;
CREATE VIEW home_posts AS
  SELECT id,author_id,client_request_id,body,created_at,title,pinned_at
  FROM feed_posts WHERE world_id IS NULL;
CREATE INDEX feed_posts_pinned ON feed_posts(pinned_at DESC,id DESC) WHERE pinned_at IS NOT NULL;
