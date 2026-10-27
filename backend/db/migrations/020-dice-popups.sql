ALTER TABLE user_preferences ADD COLUMN dice_popups INTEGER NOT NULL DEFAULT 1 CHECK(dice_popups IN (0,1));
