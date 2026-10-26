ALTER TABLE items ADD COLUMN price_units INTEGER CHECK(price_units IS NULL OR price_units >= 0);
ALTER TABLE items ADD COLUMN cost_text TEXT NOT NULL DEFAULT '';
ALTER TABLE items ADD COLUMN catalog_json TEXT NOT NULL DEFAULT '{}';
CREATE INDEX items_category_archive_id ON items(category,archived,id);
CREATE TABLE item_catalog_imports (
 checksum TEXT PRIMARY KEY,
 imported_at TEXT NOT NULL,
 item_count INTEGER NOT NULL
);
CREATE TABLE item_purchases (
 request_id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id),
 character_id TEXT NOT NULL REFERENCES characters(id),
 fingerprint TEXT NOT NULL,
 receipt_json TEXT NOT NULL,
 created_at TEXT NOT NULL
);
