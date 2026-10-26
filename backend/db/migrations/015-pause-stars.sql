-- Pause-star preference lives beside Splash cursor in Account > Effects.
ALTER TABLE user_preferences ADD COLUMN pause_stars INTEGER NOT NULL DEFAULT 0 CHECK(pause_stars IN (0,1));
