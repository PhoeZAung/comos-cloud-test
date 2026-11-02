import https from 'node:https';
import { configuration } from './config.mjs';
import { openDatabase } from './db/database.mjs';
import { initializeAuthentication } from './auth/firebase.mjs';
import { createApiServer } from './http/app.mjs';
import { createStaticHandler } from './http/static.mjs';
import { createFileStore } from './media/filesystem.mjs';

export async function startLocalServer(tls) {
  if(process.env.COMOS_AUTH_ORIGIN!=='https://localhost:4175'||process.env.COMOS_LOCAL_DEVELOPMENT!=='1')throw Error('Run the local launcher.');
  const config=await configuration();
  await createFileStore(config.mediaRoot);
  const db=await openDatabase(config.databasePath);
  let auth;
  try {
    auth=await initializeAuthentication({db,mediaRoot:config.mediaRoot,logoutScope:'local_session'});
    const application=createApiServer({db,...auth,staticHandler:await createStaticHandler(new URL('../dist-live/',import.meta.url))});
    const handler=application.listeners('request')[0];
    const server=https.createServer(tls,(req,res)=>{
      if(req.headers.host!=='localhost:4175'){res.writeHead(403).end('Use https://localhost:4175');return;}
      return handler(req,res);
    });
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(4175,'127.0.0.1',resolve);});
    console.log('Cosmos local login: https://localhost:4175/signin.html');
    console.log('Fresh local data: '+config.dataDirectory);
    let closing=false;
    const stop=()=>{if(closing)return;closing=true;server.close(()=>{db.close();void auth.close();});server.closeIdleConnections();};
    process.on('SIGINT',stop);process.on('SIGTERM',stop);
    return server;
  } catch(error) { db.close();await auth?.close();throw error; }
}
