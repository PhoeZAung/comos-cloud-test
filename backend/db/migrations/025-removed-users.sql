-- Keep ownership/attribution intact while removing Cosmos access. Firebase is
-- shared with Mount Aetheria and is deliberately outside this operation.
ALTER TABLE users ADD COLUMN deleted_at TEXT;
ALTER TABLE users ADD COLUMN deleted_by TEXT;
