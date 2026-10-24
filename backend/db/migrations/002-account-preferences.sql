ALTER TABLE users ADD COLUMN avatar_media_id TEXT REFERENCES media(id) ON DELETE RESTRICT;
CREATE TABLE user_preferences (
 user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 theme_choice TEXT NOT NULL DEFAULT 'cosmic' CHECK(theme_choice IN ('cosmic','ocean','ember','forest')),
 splash_cursor INTEGER NOT NULL DEFAULT 0 CHECK(splash_cursor IN (0,1)),
 effect_colors INTEGER NOT NULL DEFAULT 1 CHECK(effect_colors IN (0,1))
) STRICT;
