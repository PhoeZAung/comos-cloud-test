import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../backend/db/database.mjs';
import { createSessionService } from '../backend/auth/sessions.mjs';

test('local logout persists, rejects copied cookies, and never revokes shared Firebase sessions', async () => {
  const db = await openDatabase(':memory:');
  const now = 1900000000000;
  let revocations = 0;
  const claims = session => ({sub:'alice',aud:'comos-test',iss:`https://${session ? 'session.firebase' : 'securetoken'}.google.com/comos-test`,exp:now/1000+600,auth_time:now/1000});
  const auth = {
    async verifyIdToken() { return claims(false); },
    async createSessionCookie(token) { return token; },
    async verifySessionCookie(cookie, check) { assert.equal(check,true); if (!['cookie-a','cookie-b'].includes(cookie)) throw Error('forged'); return claims(true); },
    async revokeRefreshTokens() { revocations++; },
  };
  const options = {db,auth,projectId:'comos-test',now:()=>now,logoutScope:'local_session'};
  try {
    const sessions = createSessionService(options);
    await sessions.login('cookie-a'); await sessions.login('cookie-b');
    await sessions.logout('cookie-a');
    assert.equal(revocations,0);
    await assert.rejects(sessions.restore('cookie-a'));
    await assert.rejects(createSessionService(options).restore('cookie-a'));
    await assert.rejects(sessions.restore('forged'));
    assert.ok((await sessions.restore('cookie-b')).user);
    const global = createSessionService({...options,logoutScope:'all_devices'});
    await global.logout('cookie-b'); assert.equal(revocations,1);
  } finally { db.close(); }
});
