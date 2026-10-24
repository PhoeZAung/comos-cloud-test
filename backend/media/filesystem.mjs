import { randomUUID, createHash } from 'node:crypto';
import { mkdir, realpath, open, lstat, unlink } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
const validKey = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.blob$/;

export async function createFileStore(directory, maxBytes = 10 * 1024 * 1024) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error('Invalid media size limit.');
  await mkdir(directory, { recursive: true });
  const root = await realpath(directory);
  function location(key) {
    if (!validKey.test(key)) throw new Error('Invalid media key.');
    return path.join(root, key);
  }
  return Object.freeze({
    async put(bytes) {
      if (!Buffer.isBuffer(bytes) || bytes.length > maxBytes) throw new Error('Media must be a bounded Buffer.');
      const key = `${randomUUID()}.blob`, filename = location(key);
      const file = await open(filename, 'wx', 0o600);
      try { await file.writeFile(bytes); await file.sync(); }
      catch (error) { await file.close(); await unlink(filename).catch(() => {}); throw error; }
      await file.close();
      return { key, sizeBytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
    },
    async read(key) {
      const filename = location(key);
      const info = await lstat(filename);
      if (!info.isFile() || info.isSymbolicLink() || info.size > maxBytes) throw new Error('Invalid media file.');
      const file = await open(filename, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
      try {
        const size = (await file.stat()).size;
        if (size > maxBytes) throw new Error('Media exceeds size limit.');
        return await file.readFile();
      } finally { await file.close(); }
    },
    async remove(key) { await unlink(location(key)); },
  });
}
