import { randomUUID } from 'node:crypto';
export function createMediaRepository(db) {
  return Object.freeze({
    create({ ownerId, key, mimeType, sizeBytes, sha256 }) {
      const id = randomUUID(), now = new Date().toISOString();
      db.prepare('INSERT INTO media(id, owner_id, storage_key, mime_type, size_bytes, sha256, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, ownerId, key, mimeType, sizeBytes, sha256, now, now);
      return id;
    },
    getOwned(id, ownerId) {
      const row = db.prepare('SELECT * FROM media WHERE id = ? AND owner_id = ?').get(id, ownerId);
      return row ? { id: row.id, ownerId: row.owner_id, key: row.storage_key, mimeType: row.mime_type, sizeBytes: row.size_bytes, sha256: row.sha256, visibility: row.visibility } : null;
    },
  });
}

// Internal service, not an upload endpoint. Caller must supply a verified owner later.
export function createMediaService(repository, files) {
  return Object.freeze({
    async store(ownerId, bytes, mimeType = 'application/octet-stream') {
      const saved = await files.put(bytes);
      try { return repository.create({ ownerId, ...saved, mimeType }); }
      catch (error) { await files.remove(saved.key); throw error; }
    },
    async readOwned(id, ownerId) {
      const item = repository.getOwned(id, ownerId);
      return item ? { metadata: item, bytes: await files.read(item.key) } : null;
    },
  });
}
