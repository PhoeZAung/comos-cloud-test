import { createSessionService } from './sessions.mjs';
import { createSessionRoutes } from './routes.mjs';

export function authConfiguration(env = process.env) {
  const mode = env.COMOS_AUTH_MODE || 'disabled';
  if (mode === 'disabled') return null;
  if (mode !== 'firebase') throw new Error('Unknown COMOS_AUTH_MODE.');
  if (env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Auth emulator is not allowed in the real adapter.');
  const projectId = env.COMOS_FIREBASE_PROJECT_ID;
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId || '')) throw new Error('Set an explicit Firebase project ID.');
  const origin = env.COMOS_AUTH_ORIGIN;
  let url;try { url = new URL(origin); } catch { throw new Error('Set an exact HTTPS auth origin.'); }
  if (url.protocol !== 'https:' || url.origin !== origin) throw new Error('Set an exact HTTPS auth origin.');
  return { projectId, origin };
}

export async function initializeAuthentication({ db, env = process.env }) {
  const config = authConfiguration(env);
  if (!config) return { sessionRoutes: null, close: async () => {} };
  const [{ initializeApp, applicationDefault, cert, deleteApp }, { getAuth }] = await Promise.all([
    import('firebase-admin/app'), import('firebase-admin/auth'),
  ]);
  let credential;
  if (env.COMOS_FIREBASE_SERVICE_ACCOUNT_JSON) {
    let account;
    try { account = JSON.parse(env.COMOS_FIREBASE_SERVICE_ACCOUNT_JSON); } catch { throw new Error('Invalid server credential JSON.'); }
    if (account.project_id !== config.projectId || account.type !== 'service_account') throw new Error('Server credential project mismatch.');
    credential = cert(account);
  } else credential = applicationDefault();
  // Fail startup if server credentials cannot be resolved. Never downgrade to fixture identity.
  await credential.getAccessToken();
  const app = initializeApp({ credential, projectId: config.projectId }, 'comos-auth');
  try {
    const sessions = createSessionService({ db, auth: getAuth(app), projectId: config.projectId });
    return { sessionRoutes: createSessionRoutes({ sessions, origin: config.origin }), close: () => deleteApp(app) };
  } catch (error) { await deleteApp(app);throw error; }
}
