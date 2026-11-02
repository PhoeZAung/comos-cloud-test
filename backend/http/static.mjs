import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { previewPolicy } from '../../src/preview/policy.mjs';

export async function createStaticHandler(directory) {
  const root = await realpath(directory);
  const liveHeaders = JSON.parse(await readFile(path.join(root, 'auth-headers.json'), 'utf8'));
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest':'application/manifest+json', '.ico':'image/x-icon' };
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
    try {
      let name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if(name==='/preview'||name.startsWith('/preview/'))throw Error('Preview retired');
      if (name.endsWith('/')) name += 'index.html';
      if (name.includes('\\') || name.split('/').some(part => part.startsWith('.'))) throw new Error('Invalid path');
      const target = await realpath(path.resolve(root, '.' + name));
      const relative = path.relative(root, target);
      const ext=path.extname(target);
      const type = types[ext] || (relative==='owlbear'+path.sep+'manifest.json'?'application/json':null) || (relative.startsWith('assets'+path.sep+'dice-box'+path.sep)?({'.json':'application/json','.wasm':'application/wasm','.jpg':'image/jpeg','.jpeg':'image/jpeg'}[ext]):null);
      if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || !type || !(await stat(target)).isFile()) throw new Error('Not public');
      res.setHeader('Content-Security-Policy', relative.startsWith('preview' + path.sep) ? previewPolicy : liveHeaders['Content-Security-Policy']);
      if(relative.startsWith('owlbear'+path.sep)){res.setHeader('Content-Security-Policy',liveHeaders['Content-Security-Policy']+"; frame-ancestors 'self' https://owlbear.rodeo https://*.owlbear.rodeo");}
      if(relative==='owlbear'+path.sep+'manifest.json')res.setHeader('Access-Control-Allow-Origin','*');
      if(relative==='owlbear'+path.sep+'connect.html')res.setHeader('Cross-Origin-Opener-Policy','unsafe-none');
      const body = await readFile(target);
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': body.length });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }).end(req.method === 'HEAD' ? undefined : 'Not found'); }
  };
}
