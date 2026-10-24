import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { previewPolicy } from '../../src/preview/policy.mjs';

export async function createStaticHandler(directory) {
  const root = await realpath(directory);
  const liveHeaders = JSON.parse(await readFile(path.join(root, 'auth-headers.json'), 'utf8'));
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
    try {
      let name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (name.endsWith('/')) name += 'index.html';
      if (name.includes('\\') || name.split('/').some(part => part.startsWith('.'))) throw new Error('Invalid path');
      const target = await realpath(path.resolve(root, '.' + name));
      const relative = path.relative(root, target);
      const type = types[path.extname(target)];
      if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || !type || !(await stat(target)).isFile()) throw new Error('Not public');
      res.setHeader('Content-Security-Policy', relative.startsWith('preview' + path.sep) ? previewPolicy : liveHeaders['Content-Security-Policy']);
      const body = await readFile(target);
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': body.length });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }).end(req.method === 'HEAD' ? undefined : 'Not found'); }
  };
}
