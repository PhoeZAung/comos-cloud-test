import { validateAuth } from './validation.mjs';
// Inject only in a separate, explicitly configured real build. No query-mode switches.
export function createAuthService({ provider, request = fetch, origin = location.origin }) {
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.origin !== origin) throw new Error('HTTPS origin required.');
  let busy = false;
  async function api(path, method = 'GET', data) {
    let response;
    try { response = await request(origin + '/api/v1/auth/' + path, { method, credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) }); }
    catch { throw Object.assign(new Error('Service unavailable'), { code: 'session/unavailable' }); }
    if (!response.ok) throw Object.assign(new Error('Session request failed'), { code: response.status === 429 ? 'session/rate-limited' : response.status === 401 ? 'session/required' : response.status === 409 ? 'profile/conflict' : response.status === 400 ? 'form/invalid' : 'session/unavailable' });
    return response.json();
  }
  async function exclusive(action) {
    if (busy) throw Object.assign(new Error('Request in progress'), { code: 'session/busy' });
    busy = true;try { return await action(); } finally { busy = false; }
  }
  return Object.freeze({
    async signIn(kind, values = {}) {
      return exclusive(async () => {
        if (!['signin','signup','google'].includes(kind)) throw new Error('Invalid sign-in method.');
        if (kind !== 'google' && Object.keys(validateAuth(kind, values)).length) throw Object.assign(new Error('Invalid form'), { code: 'form/invalid' });
        let accountCreated = false, failure;
        try {
          const credential = kind === 'google' ? await provider.google() : await provider.email(values.email.trim(), values.password, kind === 'signup');
          accountCreated = kind === 'signup';
          const idToken = await credential.user.getIdToken(true);
          return await api('session', 'POST', { idToken });
        } catch (error) {
          failure = error;
          if (accountCreated) error.accountCreated = true;
          throw error;
        } finally {
          try { await provider.signOut(); } catch (error) { if (!failure) throw error; }
        }
      });
    },
    restore: () => api('session'),
    completeProfile: (displayName, revision) => exclusive(() => api('profile', 'POST', { displayName, revision })),
    reset: email => exclusive(async () => {
      if (Object.keys(validateAuth('reset', { email })).length) throw Object.assign(new Error('Invalid email'), { code: 'form/invalid' });
      try { await provider.reset(email.trim()); } catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
      return { message: 'If an account can receive a reset email, instructions are on the way.' };
    }),
    signOut: () => exclusive(async () => { try { return await api('logout', 'POST', {}); } finally { await provider.signOut(); } }),
  });
}
