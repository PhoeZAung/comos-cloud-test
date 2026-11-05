-- Hide numeric result details from Discord text without changing local 2D/3D dice displays.
ALTER TABLE user_preferences ADD COLUMN discord_roll_stats INTEGER NOT NULL DEFAULT 1 CHECK(discord_roll_stats IN (0,1));
