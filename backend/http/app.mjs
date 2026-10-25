import http from 'node:http';
export function createApiServer({ db, sessionRoutes = null, staticHandler = null, accountRoutes = null, groupsRoutes = null, charactersRoutes = null, itemsRoutes = null, postsRoutes = null, replyRoutes = null, backupRoutes = null }) {
  return http.createServer(async (req, res) => {
    const send = (status, payload) => {
      const body = JSON.stringify(payload);
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Length': Buffer.byteLength(body) });
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/api/v1/health') {
        if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); return send(405, { error: 'method_not_allowed' }); }
        db.prepare('SELECT 1').get();
        const version = db.prepare('SELECT MAX(version) AS version FROM schema_migrations').get().version;
        return send(200, { status: 'ok', apiVersion: 1, database: 'ready', schemaVersion: version, authentication: sessionRoutes ? 'configured' : 'not_configured' });
      }
      if (backupRoutes && await backupRoutes(req,res,url.pathname,send)) return;
      if (replyRoutes && await replyRoutes(req,res,url.pathname,send)) return;
      if (postsRoutes && await postsRoutes(req,res,url.pathname,send)) return;
      if (itemsRoutes && await itemsRoutes(req,res,url.pathname,send)) return;
      if (charactersRoutes && await charactersRoutes(req,res,url.pathname,send)) return;
      if (groupsRoutes && await groupsRoutes(req,res,url.pathname,send)) return;
      if (accountRoutes && await accountRoutes(req,res,url.pathname,send)) return;
      if (sessionRoutes && await sessionRoutes(req, res, url.pathname, send)) return;
      if (url.pathname.startsWith('/api/')) {
        // Deny by default until Step 2.3 installs real token/session verification.
        // Never authenticate from headers, query parameters, or a preview identity.
        return send(401, { error: 'authentication_required' });
      }
      if (staticHandler) return await staticHandler(req, res);
      return send(404, { error: 'not_found' });
    } catch { return send(503, { error: 'service_unavailable' }); }
  });
}
