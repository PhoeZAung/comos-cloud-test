// Header state is presentation only; the API remains the authorization boundary.
export let sessionUser = null;
let pending;
export function setSessionUser(user) {
  sessionUser = user || null;
  for (const entry of document.querySelectorAll('[data-public-entry]')) entry.hidden = Boolean(user);
  for (const account of document.querySelectorAll('[data-public-account]')) account.hidden = !user;
  for (const action of document.querySelectorAll('[data-signed-out-only]')) action.hidden = Boolean(user);
}
export async function refreshSession() {
  if (document.body.dataset.mode !== 'live') return null;
  if (pending) return pending;
  pending = (async () => {
    try {
      const response = await fetch('/api/v1/auth/session', { credentials:'same-origin', cache:'no-store', headers:{Accept:'application/json'} });
      if (response.status === 401) { setSessionUser(null); return null; }
      if (!response.ok) return sessionUser;
      const result = await response.json(); setSessionUser(result.user); return sessionUser;
    } catch { return sessionUser; }
    finally { pending = null; }
  })();
  return pending;
}
