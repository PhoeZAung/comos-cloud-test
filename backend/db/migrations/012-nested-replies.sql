-- Replies may target another reply in the same post. Removing the parent promotes children.
ALTER TABLE feed_replies ADD COLUMN parent_reply_id TEXT REFERENCES feed_replies(id) ON DELETE SET NULL;
CREATE INDEX feed_replies_parent ON feed_replies(parent_reply_id);
