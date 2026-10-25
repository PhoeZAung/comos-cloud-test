import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile, mkdir, readdir, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { openDatabase, migrate } from '../backend/db/database.mjs';
import { createUserRepository, createIdentityRepository } from '../backend/repositories/users.mjs';
import { createMediaRepository, createMediaService } from '../backend/repositories/media.mjs';
import { createFileStore } from '../backend/media/filesystem.mjs';
import { createApiServer } from '../backend/http/app.mjs';
import { configuration } from '../backend/config.mjs';

async function temporary(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'comos-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

test('SQLite records survive reopen; migrations run once and stale profile updates fail', async t => {
  const dir = await temporary(t), filename = path.join(dir, 'db.sqlite');
  let db = await openDatabase(filename);
  t.after(() => { try { db.close(); } catch {} });
  const users = createUserRepository(db);
  const user = users.create({ displayName: "O'Brien; DROP TABLE users;" });
  const updated = users.updateProfile(user.id, { displayName: 'Changed', theme: 'dark' }, user.revision);
  assert.equal(updated.revision, 2);
  assert.throws(() => users.updateProfile(user.id, { displayName: 'Stale', theme: 'light' }, 1), { code: 'REVISION_CONFLICT' });
  db.close(); db = await openDatabase(filename);
  assert.equal(createUserRepository(db).get(user.id).displayName, 'Changed');
  assert.equal(db.prepare('SELECT count(*) AS n FROM schema_migrations').get().n, 9);
  assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
  assert.equal(db.prepare('PRAGMA journal_mode').get().journal_mode, 'wal');
});

test('identity mappings cannot be reassigned or linked to nonexistent owners', async t => {
  const db = await openDatabase(':memory:');t.after(() => db.close());
  const users = createUserRepository(db), identities = createIdentityRepository(db);
  const a = users.create(), b = users.create();
  const key = { provider: 'synthetic-provider', issuer: 'synthetic-project', subject: 'synthetic-uid' };
  assert.equal(identities.link(key, a.id), a.id);
  assert.equal(identities.link(key, a.id), a.id);
  assert.throws(() => identities.link(key, b.id), /another user/);
  assert.equal(identities.find(key), a.id);
  assert.throws(() => identities.link({ ...key, subject: 'orphan' }, 'no-user'), /FOREIGN KEY/);
});

test('migration failure rolls back changes; altered and missing history is rejected', async t => {
  const dir = await temporary(t), migrations = path.join(dir, 'migrations');await mkdir(migrations);
  const original = await readFile(new URL('../backend/db/migrations/001-identity-media.sql', import.meta.url));
  await writeFile(path.join(migrations, '001-identity-media.sql'), original);
  const db = await openDatabase(path.join(dir, 'test.sqlite'), { migrationsDirectory: migrations });t.after(() => db.close());
  await writeFile(path.join(migrations, '002-broken.sql'), 'CREATE TABLE should_rollback(id TEXT); THIS IS NOT SQL;');
  await assert.rejects(migrate(db, migrations));
  assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name='should_rollback'").get().n, 0);
  assert.equal(db.prepare('SELECT count(*) AS n FROM schema_migrations').get().n, 1);
  await rm(path.join(migrations, '002-broken.sql'));
  await writeFile(path.join(migrations, '001-identity-media.sql'), Buffer.concat([original, Buffer.from('\n-- changed')]));
  await assert.rejects(migrate(db, migrations), /history mismatch/);
  await rm(path.join(migrations, '001-identity-media.sql'));
  await assert.rejects(migrate(db, migrations), /history mismatch/);
});

test('media bytes survive reopening; owner checks hide other-user records; failed metadata is cleaned up', async t => {
  const dir = await temporary(t), filename = path.join(dir, 'db.sqlite'), mediaDir = path.join(dir, 'media');
  let db = await openDatabase(filename);t.after(() => { try { db.close(); } catch {} });
  const users = createUserRepository(db), a = users.create(), b = users.create();
  const files = await createFileStore(mediaDir);
  let service = createMediaService(createMediaRepository(db), files);
  const id = await service.store(a.id, Buffer.from('synthetic test bytes'));
  assert.equal(await service.readOwned(id, b.id), null);
  await assert.rejects(service.store('missing-user', Buffer.from('orphan')), /FOREIGN KEY/);
  assert.equal((await readdir(mediaDir)).length, 1);
  db.close();db = await openDatabase(filename);
  service = createMediaService(createMediaRepository(db), await createFileStore(mediaDir));
  const loaded = await service.readOwned(id, a.id);
  assert.equal(loaded.bytes.toString(), 'synthetic test bytes');
  assert.equal(loaded.metadata.visibility, 'private');
  assert.ok(!loaded.metadata.key.includes('/'));
});

test('file adapter rejects traversal, oversized inputs, and symlinks', async t => {
  const dir = await temporary(t), files = await createFileStore(path.join(dir, 'media'), 8);
  await assert.rejects(files.put(Buffer.alloc(9)), /bounded Buffer/);
  for (const key of ['../secret', '/etc/passwd', '..\\secret', '%2e%2e%2fsecret']) await assert.rejects(files.read(key), /Invalid media key/);
  const saved = await files.put(Buffer.from('short'));
  await rm(path.join(dir, 'media', saved.key));
  await writeFile(path.join(dir, 'secret'), 'secret');
  await symlink(path.join(dir, 'secret'), path.join(dir, 'media', saved.key));
  await assert.rejects(files.read(saved.key), /Invalid media file/);
});

test('API health works; forged authentication, ghost flags, writes, and private files are denied', async t => {
  const db = await openDatabase(':memory:');
  const server = createApiServer({ db });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); db.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${base}/api/v1/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', apiVersion: 1, database: 'ready', schemaVersion: 9, authentication: 'not_configured' });
  for (const method of ['GET','POST','PUT','PATCH','DELETE']) {
    const r = await fetch(`${base}/api/v1/users?admin=true&mode=fixture`, { method, headers: { Authorization: 'Bearer forged', 'X-User-Id': 'someone', 'X-Role': 'admin', Origin: 'https://example.invalid' } });
    assert.equal(r.status, 401);
    assert.equal(r.headers.get('access-control-allow-origin'), null);
    assert.equal(r.headers.get('set-cookie'), null);
  }
  for (const url of ['/comos.sqlite','/media/secret','/.comos-data/comos.sqlite']) assert.equal((await fetch(base+url)).status, 404);
  assert.equal(db.prepare('SELECT count(*) AS n FROM users').get().n, 0);
  assert.equal((await fetch(`${base}/api/v1/health`, { method:'POST' })).status, 405);
});

test('configuration keeps runtime data outside the public website', async t => {
  const dir = await temporary(t);
  const config = await configuration({ COMOS_DATA_DIR: path.join(dir,'data'), COMOS_MEDIA_ROOT:path.join(dir,'media'), COMOS_API_PORT:'0' });
  assert.equal(config.host, '127.0.0.1');assert.equal(config.port, 0);
  await assert.rejects(configuration({ COMOS_DATA_DIR:'dist/private' }), /outside dist/);
  await assert.rejects(configuration({ COMOS_API_PORT:'invalid' }), /Invalid/);
  const dist = new URL('../dist/', import.meta.url);
  await symlink(dist, path.join(dir,'public-link'));
  await assert.rejects(configuration({ COMOS_DATA_DIR:path.join(dir,'public-link') }), /symlink/);
});
