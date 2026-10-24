import { createUserRepository, createIdentityRepository } from '../repositories/users.mjs';

// Receives the official Firebase Admin Auth instance from a trusted server bootstrap.
// Never pass a browser-provided verifier or enable this adapter in fixture mode.
export function createSessionService({ db, auth, projectId, now = () => Date.now() }) {
  if (!auth || !/^[a-z0-9-]+$/.test(projectId || '')) throw new Error('Trusted Firebase configuration required.');
  const issuer = `https://securetoken.google.com/${projectId}`;
  const users = createUserRepository(db), identities = createIdentityRepository(db);
  const expiresIn = 5 * 24 * 60 * 60 * 1000;
  function identity(claims, session = false) {
    if (claims.aud !== projectId || claims.iss !== (session ? `https://session.firebase.google.com/${projectId}` : issuer)
      || typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 128
      || claims.firebase?.tenant || !Number.isFinite(claims.exp) || claims.exp * 1000 <= now()) throw new Error('Invalid identity.');
    return { provider: 'firebase', issuer, subject: claims.sub };
  }
  return Object.freeze({
    async login(token) {
      if (typeof token !== 'string' || token.length > 16000 || !token) throw new Error('Invalid token.');
      const claims = await auth.verifyIdToken(token, true);
      const key = identity(claims);
      const age = now() / 1000 - claims.auth_time;
      if (!Number.isFinite(age) || age < 0 || age > 300) throw new Error('Recent sign-in required.');
      const cookie = await auth.createSessionCookie(token, { expiresIn });
      db.exec('BEGIN IMMEDIATE');
      let user;
      try {
        const existing = identities.find(key);
        user = existing ? users.get(existing) : users.create();
        identities.link(key, user.id);
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
      return { cookie, expiresIn, user };
    },
    async restore(cookie) {
      if (typeof cookie !== 'string' || !cookie || cookie.length > 16000) throw new Error('Session required.');
      const claims = await auth.verifySessionCookie(cookie, true);
      const key = identity(claims, true), id = identities.find(key);
      const user = id && users.get(id);
      if (!user) throw new Error('Session owner missing.');
      return { user, subject: key.subject };
    },
    async completeProfile(cookie, { displayName, revision } = {}) {
      const session = await this.restore(cookie);
      return { user: users.completeProfile(session.user.id, displayName, revision) };
    },
    async logout(cookie) {
      // Global provider revocation also invalidates copied cookies and other devices.
      const session = await this.restore(cookie);
      await auth.revokeRefreshTokens(session.subject);
    },
  });
}
