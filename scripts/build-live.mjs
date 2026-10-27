import {accountEditor} from '../src/account/view.mjs';
import { readFile, writeFile, mkdir, readdir, cp, mkdtemp, rename, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { renderPage, routeView } from '../src/layouts/site.mjs';
import { authContent, profileContent, sessionContent } from '../src/auth/forms.mjs';
import { publicAuthConfig, liveAuthPolicy } from './auth-build-config.mjs';
const root=new URL('../',import.meta.url);
if(process.argv.length!==3)throw new Error('Usage: npm run build:live -- /absolute/path/public-auth.json');
const config=publicAuthConfig(JSON.parse(await readFile(process.argv[2],'utf8')));
// Stage all output before replacing dist-live; never overwrite the portable dist preview.
const output=await mkdtemp(new URL('.auth-build-',root));
try {
 await mkdir(output+'/assets');

 await cp(new URL('dist/assets/',root),output+'/assets',{recursive:true});
 await cp(new URL('dist/features/',root),output+'/features',{recursive:true});
 await build({entryPoints:[fileURLToPath(new URL('src/auth/live.mjs',root))],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,outfile:output+'/assets/auth.js',define:{COMOS_PUBLIC_AUTH:JSON.stringify(config)}});
 const policy=liveAuthPolicy(config);
 // assets/routes exists in the copied portable build.
 await cp(new URL('public/',root),output,{recursive:true});
 for(const file of (await readdir(new URL('src/pages/',root))).filter(f=>f.endsWith('.mjs'))){
  const {default:source}=await import(new URL('src/pages/'+file,root));
  const page={...source};
  if(['signin','signup'].includes(page.id))page.content=authContent(page.id,{live:true});
  if(page.id==='account')page.content='<section class="page-heading"><h1>Account</h1></section><section class="auth-card"><div data-entry><a class="button primary" href="signin.html">Sign in</a></div>'+profileContent({live:true})+'<p class="auth-status" data-page-status role="status" tabindex="-1"></p><button class="button" data-retry hidden>Retry connection</button></section>'+accountEditor().replace('</section><section class="account-section"><h2>Theme</h2>',sessionContent({account:true})+'</section><section class="account-section"><h2>Theme</h2>');
  page.content=page.content.replaceAll('data-admin-entry','data-admin-entry hidden');

  await writeFile(output+'/assets/routes/'+page.id+'.mjs', 'export default '+JSON.stringify(routeView(page))+';\n');
  await writeFile(output+'/'+page.id+'.html',renderPage(page,{policy,live:true,scripts:['assets/shell.mjs']}));
 }
 // Headers for the later native HTTPS host; no deployment or host config is performed here.
 await writeFile(output+'/auth-headers.json',JSON.stringify({'Content-Security-Policy':policy,'Cache-Control':'no-store','Referrer-Policy':'same-origin'},null,2)+'\n');
 await rm(new URL('dist-live/',root),{recursive:true,force:true});
 await rename(output,new URL('dist-live/',root));
 console.log('Built dist-live with isolated preview/ copy. Nothing was hosted or published.');
}catch(error){await rm(output,{recursive:true,force:true});throw error;}
