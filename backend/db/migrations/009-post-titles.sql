-- Step 5.3: Add optional titles without rewriting existing posts or their replies.
ALTER TABLE feed_posts ADD COLUMN title TEXT NOT NULL DEFAULT '' CHECK(length(title) <= 140);