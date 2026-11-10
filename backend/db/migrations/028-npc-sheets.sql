ALTER TABLE characters ADD COLUMN kind TEXT NOT NULL DEFAULT 'player' CHECK(kind IN ('player','npc'));
CREATE INDEX characters_npcs ON characters(id) WHERE kind='npc' AND archived=0;
