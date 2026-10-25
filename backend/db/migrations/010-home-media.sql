-- Preserve historical private records without exposing them in the shared Home.
CREATE VIEW home_posts AS SELECT id,author_id,client_request_id,body,created_at,title FROM feed_posts WHERE world_id IS NULL;
CREATE TABLE home_media(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL REFERENCES users(id),file_key TEXT NOT NULL,mime TEXT NOT NULL);
CREATE TABLE home_post_media(post_id TEXT NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,media_id TEXT NOT NULL UNIQUE REFERENCES home_media(id),position INTEGER NOT NULL,PRIMARY KEY(post_id,media_id));
