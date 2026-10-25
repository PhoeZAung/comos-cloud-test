import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { configuration } from './config.mjs';
import { openDatabase } from './db/database.mjs';
import { initializeAuthentication } from './auth/firebase.mjs';
import { createApiServer } from './http/app.mjs';
import { createStaticHandler } from './http/static.mjs';
import { createFileStore } from './media/filesystem.mjs';

const publicConfig = JSON.parse(await readFile(new URL('../public-auth.json', import.meta.url), 'utf8'));
if (process.env.COMOS_AUTH_MODE !== 'firebase' || process.env.COMOS_AUTH_ORIGIN !== publicConfig.origin || process.env.COMOS_FIREBASE_PROJECT_ID !== publicConfig.firebase.projectId) throw new Error('Cloud auth settings must match public-auth.json.');
if (!process.env.COMOS_DATA_DIR || !path.isAbsolute(process.env.COMOS_DATA_DIR)) throw new Error('Set COMOS_DATA_DIR to an absolute persistent volume path.');
const port = Number(process.env.PORT || 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT.');
const config = await configuration();
const publicRoot = await realpath(new URL('../dist-live/', import.meta.url));
for (const directory of [config.dataDirectory, config.mediaRoot]) {
  const relative = path.relative(publicRoot, directory);
  if (!relative || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))) throw new Error('Cloud data must be outside public files.');
}
await createFileStore(config.mediaRoot);
const db = await openDatabase(config.databasePath);
let auth;
try { auth = await initializeAuthentication({ db,mediaRoot:config.mediaRoot }); } catch { db.close(); throw new Error('Firebase server authentication failed. Check private credentials and project settings.'); }
const server = createApiServer({ db, directoryRoutes:auth.directoryRoutes, homeMediaRoutes:auth.homeMediaRoutes, backupRoutes:auth.backupRoutes, replyRoutes:auth.replyRoutes, postsRoutes:auth.postsRoutes, itemsRoutes:auth.itemsRoutes, charactersRoutes:auth.charactersRoutes, sessionRoutes: auth.sessionRoutes, groupsRoutes:auth.groupsRoutes,accountRoutes:auth.accountRoutes, staticHandler: await createStaticHandler(publicRoot) });
server.listen(port, '0.0.0.0', () => console.log('Comos cloud server ready.'));
let closing = false;
function close() { if (closing) return; closing = true; server.close(() => { db.close(); void auth.close(); }); server.closeIdleConnections(); }
process.on('SIGTERM', close);
process.on('SIGINT', close);
