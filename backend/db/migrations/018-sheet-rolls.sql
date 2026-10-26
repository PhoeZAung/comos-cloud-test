CREATE TABLE sheet_rolls (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id),
 character_id TEXT NOT NULL REFERENCES characters(id),
 expression TEXT NOT NULL,
 label TEXT NOT NULL,
 result_json TEXT NOT NULL,
 delivery TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 discord_requested INTEGER NOT NULL
) STRICT;
CREATE INDEX sheet_rolls_user_time ON sheet_rolls(user_id,created_at);
