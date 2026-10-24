import { DatabaseSync } from 'node:sqlite';
import { readdir, readFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

export async function migrate(db, directory = new URL('./migrations/', import.meta.url)) {
  const files = (await readdir(directory)).filter(file => file.endsWith('.sql')).sort();
  const migrations = [];
  for (const file of files) {
    if (!/^\d{3}-[a-z0-9-]+\.sql$/.test(file)) throw new Error(`Invalid migration name: ${file}`);
    const sql = await readFile(directory instanceof URL ? new URL(file, directory) : path.join(directory, file), 'utf8');
    migrations.push({ version: Number(file.slice(0, 3)), file, sql, checksum: createHash('sha256').update(sql).digest('hex') });
  }
  if (new Set(migrations.map(item => item.version)).size !== migrations.length) throw new Error('Duplicate migration version.');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, checksum TEXT NOT NULL, applied_at TEXT NOT NULL) STRICT');
    const applied = db.prepare('SELECT * FROM schema_migrations ORDER BY version').all();
    for (const entry of applied) {
      const source = migrations.find(item => item.version === entry.version);
      if (!source || source.file !== entry.name || source.checksum !== entry.checksum) throw new Error(`Migration history mismatch at ${entry.version}.`);
    }
    const maxApplied = applied.at(-1)?.version ?? 0;
    for (const item of migrations) {
      if (applied.some(entry => entry.version === item.version)) continue;
      if (item.version <= maxApplied) throw new Error('Cannot insert a migration before applied history.');
      db.exec(item.sql);
      db.prepare('INSERT INTO schema_migrations VALUES (?, ?, ?, ?)').run(item.version, item.file, item.checksum, new Date().toISOString());
    }
    db.exec('COMMIT');
    return migrations.at(-1)?.version ?? 0;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export async function openDatabase(filename, options = {}) {
  if (filename !== ':memory:') await mkdir(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename, { timeout: 5000 });
  try {
    db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
    await migrate(db, options.migrationsDirectory);
    return db;
  } catch (error) { db.close(); throw error; }
}
