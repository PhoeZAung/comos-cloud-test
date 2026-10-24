import { createAuthThrottle } from './throttle.mjs';
const cookieName = '__Host-comos_session';
const clearCookie = `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
function cookie(req) {
  const found = (req.headers.cookie || '').split(';').map(s => s.trim()).filter(s => s.startsWith(cookieName + '='));
  if (found.length !== 1) throw new Error('Session required.');
  return found[0].slice(cookieName.length + 1);
}
async function body(req) {
  if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') throw new Error('JSON required.');
  const chunks = []; let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 18000) throw new Error('Body too large.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function createSessionRoutes({ sessions, origin, throttle = createAuthThrottle() }) {
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.origin !== origin) throw new Error('An exact HTTPS origin is required.');
  return async (req, res, pathname, send) => {
    if (!['/api/v1/auth/session', '/api/v1/auth/logout', '/api/v1/auth/profile'].includes(pathname)) return false;
    const read = pathname.endsWith('/session') && req.method === 'GET';
    if (!read && req.method !== 'POST') { res.setHeader('Allow', pathname.endsWith('/session') ? 'GET, POST' : 'POST'); send(405, { error: 'method_not_allowed' }); return true; }
    // Exact configured Origin prevents login/logout CSRF; never trust Host or forwarded headers.
    if (!read && (req.headers.origin !== origin || req.headers['sec-fetch-site'] === 'cross-site')) { send(403, { error: 'origin_not_allowed' }); return true; }
    const lane = read ? 'restore' : pathname.endsWith('/logout') ? 'logout' : pathname.endsWith('/profile') ? 'profile' : 'login';
    const admission = throttle.enter(req.socket?.remoteAddress || 'unknown', lane);
    if (!admission.allowed) {
      res.setHeader('Retry-After', String(admission.retryAfter));
      res.setHeader('Connection', 'close');
      send(429, { error: 'too_many_requests', retryAfter: admission.retryAfter }); return true;
    }
    try {
      if (read) {
        const { user } = await sessions.restore(cookie(req));
        send(200, { user });
      } else if (pathname.endsWith('/logout')) {
        await sessions.logout(cookie(req));
        res.setHeader('Set-Cookie', clearCookie);
        send(200, { signedOut: true, scope: 'all_devices' });
      } else {
        let data;
        try { data = await body(req); } catch { send(400, { error: 'invalid_request' }); return true; }
        if (pathname.endsWith('/profile')) {
          if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).some(key => !['displayName', 'revision'].includes(key))) { send(400, { error: 'invalid_request' }); return true; }
          const result = await sessions.completeProfile(cookie(req), data);
          send(200, result); return true;
        }
        const result = await sessions.login(data?.idToken);
        res.setHeader('Set-Cookie', `${cookieName}=${result.cookie}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${result.expiresIn / 1000}`);
        send(200, { user: result.user });
      }
    } catch (error) {
      if (error?.code === 'REVISION_CONFLICT') { send(409, { error: 'profile_conflict' }); return true; }
      if (error?.code === 'INVALID_PROFILE' || error instanceof TypeError) { send(400, { error: 'invalid_profile' }); return true; }
      if (['auth/internal-error', 'auth/network-request-failed', 'app/network-error', 'app/network-timeout', 'app/invalid-credential', 'auth/insufficient-permission'].includes(error?.code)) {
        send(503, { error: 'service_unavailable' }); return true;
      }
      if (read) res.setHeader('Set-Cookie', clearCookie);
      send(401, { error: 'sign_in_required' });
    } finally { admission.release(); }
    return true;
  };
}
