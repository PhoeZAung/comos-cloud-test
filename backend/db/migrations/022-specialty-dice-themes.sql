CREATE TABLE user_preferences_expanded (
 user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 theme_choice TEXT NOT NULL DEFAULT 'cosmic' CHECK(theme_choice IN ('cosmic','ocean','ember','forest')),
 splash_cursor INTEGER NOT NULL DEFAULT 0 CHECK(splash_cursor IN (0,1)),
 effect_colors INTEGER NOT NULL DEFAULT 1 CHECK(effect_colors IN (0,1)),
 pause_stars INTEGER NOT NULL DEFAULT 0 CHECK(pause_stars IN (0,1)),
 dice_popups INTEGER NOT NULL DEFAULT 1 CHECK(dice_popups IN (0,1)),
 dice_theme TEXT NOT NULL DEFAULT 'classic' CHECK(dice_theme IN ('classic','default','blueGreenMetal','diceOfRolling','gemstone','gemstoneMarble','rock','rust','smooth','wooden','default-extras','diceOfRolling-fate','smooth-pip','genesys'))
) STRICT;
INSERT INTO user_preferences_expanded SELECT user_id,theme_choice,splash_cursor,effect_colors,pause_stars,dice_popups,dice_theme FROM user_preferences;
DROP TABLE user_preferences;
ALTER TABLE user_preferences_expanded RENAME TO user_preferences;
