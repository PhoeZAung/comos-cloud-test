import { initializeAuthentication } from './auth/firebase.mjs';
import { configuration } from './config.mjs';
import { openDatabase } from './db/database.mjs';
import { createFileStore } from './media/filesystem.mjs';
import { createApiServer } from './http/app.mjs';

const config = await configuration();
const db = await openDatabase(config.databasePath);
try { await createFileStore(config.mediaRoot); } catch (error) { db.close(); throw error; }
let authentication;
try { authentication = await initializeAuthentication({ db,mediaRoot:config.mediaRoot }); } catch (error) { db.close(); throw error; }
const server = createApiServer({ db, charactersRoutes:authentication.charactersRoutes, sessionRoutes: authentication.sessionRoutes,groupsRoutes:authentication.groupsRoutes,accountRoutes:authentication.accountRoutes });
server.on('error', error => { void authentication.close(); db.close(); console.error(`API startup failed: ${error.code || 'unknown'}`); process.exitCode = 1; });
server.listen(config.port, config.host, () => console.log(`Comos API: http://${config.host}:${server.address().port}/api/v1/health`));
let closing = false;
function stop() {
  if (closing) return;
  closing = true;
  server.close(() => { db.close(); void authentication.close(); });
  server.closeIdleConnections();
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
