import { configuration } from '../backend/config.mjs';
import { openDatabase } from '../backend/db/database.mjs';
const config = await configuration();
const db = await openDatabase(config.databasePath);
try {
  const versions = db.prepare('SELECT version, name, applied_at FROM schema_migrations ORDER BY version').all();
  console.log(JSON.stringify({ status: 'ready', migrations: versions }, null, 2));
} finally { db.close(); }
