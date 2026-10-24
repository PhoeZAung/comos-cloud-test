import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, realpath } from 'node:fs/promises';
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
function under(parent, child) {
  const relative = path.relative(parent, child);
  return !relative || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}
export async function configuration(env = process.env) {
  const port = Number(env.COMOS_API_PORT ?? 4174);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid COMOS_API_PORT.');
  const publicRoot = await realpath(path.join(projectRoot, 'dist'));
  async function privateDirectory(value) {
    const target = path.resolve(projectRoot, value);
    if (under(publicRoot, target)) throw new Error('Data and media must be outside dist.');
    await mkdir(target, { recursive: true });
    const resolved = await realpath(target);
    if (under(publicRoot, resolved)) throw new Error('Data/media symlink points into dist.');
    return resolved;
  }
  const dataDirectory = await privateDirectory(env.COMOS_DATA_DIR || '.comos-data');
  const mediaRoot = await privateDirectory(env.COMOS_MEDIA_ROOT || path.join(dataDirectory, 'media'));
  return Object.freeze({ host: '127.0.0.1', port, dataDirectory, mediaRoot, databasePath: path.join(dataDirectory, 'comos.sqlite') });
}
