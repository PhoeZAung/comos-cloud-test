-- Per-account visual effects, both safe for existing preferences.
ALTER TABLE user_preferences ADD COLUMN notes_electric_border INTEGER NOT NULL DEFAULT 1 CHECK(notes_electric_border IN (0,1));
ALTER TABLE user_preferences ADD COLUMN laser_flow INTEGER NOT NULL DEFAULT 0 CHECK(laser_flow IN (0,1));
