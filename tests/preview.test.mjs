import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { createPreviewContext } from '../src/preview/runtime.mjs';
import { previewPolicy } from '../src/preview/policy.mjs';

const root = new URL('../', import.meta.url);

test('preview edits are isolated between contexts, detached from returned objects, and resettable', () => {
  const first = createPreviewContext();
  const second = createPreviewContext();
  const input = { name: 'Synthetic character', details: { level: 1 } };
  const row = first.data.create('characters', input);
  input.details.level = 99;
  row.details.level = 50;
  assert.equal(first.data.get('characters', row.id).details.level, 1);
  first.data.update('characters', row.id, { name: 'Changed locally' });
  assert.equal(first.data.get('characters', row.id).name, 'Changed locally');
  assert.deepEqual(second.data.list('characters'), []);
  const list = first.data.list('characters');
  list[0].name = 'Changed returned copy';
  assert.equal(first.data.get('characters', row.id).name, 'Changed locally');
  assert.equal(first.data.remove('characters', row.id), true);
  first.data.create('posts', { text: 'Synthetic post' });
  first.data.reset();
  assert.deepEqual(first.data.list('posts'), []);
  assert.equal(first.data.list('profiles')[0].displayName, 'Preview explorer');
});

test('preview never accesses the network or browser persistence and does not authenticate', t => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected network call'); });
  const context = createPreviewContext();
  assert.equal(context.mode, 'fixture');
  assert.equal(context.authenticatedUser, null);
  assert.throws(() => { context.mode = 'production'; });
  const row = context.data.create('lore', { title: 'Synthetic entry' });
  context.data.update('lore', row.id, { title: 'Temporary edit' });
  context.data.list('lore');
  context.data.get('lore', row.id);
  context.data.remove('lore', row.id);
  context.data.reset();
  assert.equal(globalThis.fetch.mock.callCount(), 0);
});

test('real IDs, caller-selected IDs, and unknown collections are rejected', () => {
  const { data } = createPreviewContext();
  for (const method of ['get', 'update', 'remove']) {
    assert.throws(() => data[method]('characters', 'real-character-123', {}), /fixture IDs/);
  }
  assert.throws(() => data.create('characters', { id: 'fixture:forged' }), /assigned/);
  const row = data.create('characters', {});
  assert.throws(() => data.update('characters', row.id, { id: 'real-user' }), /assigned/);
  assert.throws(() => data.list('__proto__'), /Unknown/);
  assert.throws(() => data.create('accounts', {}), /Unknown/);
});

test('unsupported production build fails before touching the generated site', async () => {
  const before = await readFile(new URL('dist/index.html', root));
  const result = spawnSync(process.execPath, ['scripts/build.mjs', '--mode=production'], { cwd: root, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Only --mode=preview/);
  assert.deepEqual(await readFile(new URL('dist/index.html', root)), before);
});

test('every route and local asset resolves; all pages carry the preview policy', async () => {
  const routes = (await readdir(new URL('dist/', root))).filter(file => file.endsWith('.html'));
  assert.equal(routes.length, 22);
  for (const route of routes) {
    const html = await readFile(new URL(`dist/${route}`, root), 'utf8');
    assert.match(html, /http-equiv="Content-Security-Policy"/);
    assert.match(html, /connect-src &#39;none&#39;/);
    assert.match(html, /src="preview\/runtime.mjs"/);
    for (const [, ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (ref.startsWith('#')) {
        assert.ok(html.includes(`id="${ref.slice(1)}"`));
      } else {
        assert.ok(!ref.includes('://'), 'No remote assets or navigation');
        await readFile(new URL(`dist/${ref}`, root));
      }
    }
  }
});

test('local server permits direct ghost routes and denies API and write requests', async t => {
  const child = spawn(process.execPath, ['server.mjs'], { cwd: root, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => child.kill());
  const address = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Preview startup timed out')), 5000);
    let output = '';
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    });
  });
  const routes = (await readdir(new URL('dist/', root))).filter(file => file.endsWith('.html'));
  for (const route of routes) {
    const response = await fetch(`${address}/${route}?mode=production&admin=true`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-security-policy'), previewPolicy);
    assert.equal(response.headers.get('set-cookie'), null);
    assert.match(await response.text(), /src="preview\/runtime.mjs"/);
  }
  assert.equal((await fetch(`${address}/api/v1/characters`)).status, 404);
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    assert.equal((await fetch(`${address}/api/v1/characters`, { method, body: '{}' })).status, 405);
  }
  const module = await fetch(`${address}/preview/runtime.mjs`);
  assert.match(module.headers.get('content-type'), /text\/javascript/);
  assert.equal(module.status, 200);
});
