import {mkdir,readFile,writeFile,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
export async function buildOwlbear(output,origin){
 const directory=output+'/owlbear';await mkdir(directory,{recursive:true});
 await cp(new URL('../public/owlbear/',import.meta.url),directory,{recursive:true});
 const url=new URL(origin);if(url.protocol!=='https:'||url.origin!==origin)throw Error('Owlbear requires an exact HTTPS origin.');
 const manifest=JSON.parse(await readFile(directory+'/manifest.json','utf8'));
 manifest.homepage_url=origin+'/';
 manifest.icon=origin+'/owlbear/icon.svg';
 manifest.action.icon=origin+'/owlbear/sheet-action.svg';
 manifest.action.popover=origin+'/owlbear/index.html';
 await writeFile(directory+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
 for(const name of ['action','connect','sheet','party-control','party-background','party-overlay'])await build({entryPoints:[fileURLToPath(new URL('../src/owlbear/'+name+'.mjs',import.meta.url))],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,outfile:directory+'/'+name+'.js'});
 const head='<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="/owlbear/icon.svg"><link rel="stylesheet" href="/owlbear/owlbear.css">';
 await writeFile(directory+'/index.html',`<!doctype html><html lang="en"><head>${head}<title>Cosmos · Owlbear</title><script type="module" src="/owlbear/action.js"></script></head><body>
 <main class="extension-panel"><h1 class="cosmos-title"><img src="/owlbear/icon.svg" alt="">Cosmos</h1>
 <div class="extension-tools"><button data-back hidden>← My characters</button><button class="primary" data-open-sheet-tab hidden>Open in new tab ↗</button></div>
 <details class="panel-options" open><summary>Account</summary><div class="options-content">
 <div class="extension-tools"><button class="primary" data-connect>Connect Cosmos account</button><button data-refresh>Refresh characters</button><a class="button" href="/" target="_blank" rel="noopener">Open Cosmos</a></div>


 </div></details>
 <p class="extension-status" role="status" data-status>Waiting for Owlbear…</p><div class="character-grid" data-characters></div><iframe title="Your Cosmos character sheet" hidden></iframe>
 </main><button class="panel-resize" data-resize aria-label="Resize panel. Drag, or use arrow keys; hold Shift for larger steps." title="Drag to resize">◢</button></body></html>`);
 await writeFile(directory+'/connect.html','<!doctype html><html lang="en"><head>'+head+'<title>Connect Cosmos to Owlbear</title><script type="module" src="/owlbear/connect.js"></script></head><body><main class="connect-card"><h1>Connect your Cosmos account</h1><p role="status">Checking sign-in…</p><div class="connect-actions"><a class="button primary" href="/signin.html" target="_blank" rel="noopener">Sign in to Cosmos</a><a class="button" href="/account.html" target="_blank" rel="noopener">Finish profile</a><button data-check-signin>Check sign-in</button></div><p class="connect-note">Sign in, then check your connection. This window closes after connecting.</p></main></body></html>');
 let sheet=await readFile(output+'/sheet.html','utf8');
 sheet=sheet.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/\b(href|src)="(?!https?:|\/|#)([^"]+)"/g,'$1="/$2"').replace('<body ','<body data-owlbear-sheet="true" ').replace('</head>','<link rel="stylesheet" href="/owlbear/sheet.css"><script type="module" src="/owlbear/sheet.js"></script></head>');
 await writeFile(directory+'/sheet.html',sheet);
 await writeFile(directory+'/sheet.css','body[data-owlbear-sheet]{min-width:0}body[data-owlbear-sheet] [data-sheet-popout],body[data-owlbear-sheet] [data-delete-character]{display:none}');
 const party=JSON.parse(await readFile(directory+'/party/manifest.json','utf8'));
 party.homepage_url=origin+'/';party.icon=origin+'/owlbear/party-icon.svg';party.action.icon=origin+'/owlbear/party-action.svg';party.action.popover=origin+'/owlbear/party/control.html';party.background_url=origin+'/owlbear/party/background.html';
 await writeFile(directory+'/party/manifest.json',JSON.stringify(party,null,2)+'\n');
 const partyHead='<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="/owlbear/party-icon.svg"><link rel="stylesheet" href="/owlbear/party.css">';
 await writeFile(directory+'/party/control.html',`<!doctype html><html lang="en"><head>${partyHead}<title>Cosmos Party Status</title><script type="module" src="/owlbear/party-control.js"></script></head><body><main class="party-control"><header class="tracker-title"><h1>Cosmos</h1><button class="connection-status" data-connect-party hidden>Connect</button><span data-status role="status"></span></header><div class="party-actions" hidden><button data-mode="party">Show Party</button><button data-mode="battle">Show Battle</button><button data-mode="off">Off</button></div></main></body></html>`);
 await writeFile(directory+'/party/background.html','<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Cosmos Party Status background</title><script type="module" src="/owlbear/party-background.js"></script></head><body></body></html>');
 await writeFile(directory+'/party/overlay.html',`<!doctype html><html lang="en"><head>${partyHead}<title>Cosmos party cards</title><script type="module" src="/owlbear/party-overlay.js"></script></head><body class="overlay-body"><main class="party-hud"><header class="hud-header" title="Drag to move this card"><span>COSMOS · PARTY</span><button data-close-overlay aria-label="Hide party cards for me" title="Hide for me">×</button></header><div class="status-cards" data-status-cards></div></main></body></html>`);
 console.log('Built Cosmos Owlbear extension at /owlbear/manifest.json.');
 console.log('Built Cosmos Party Status at /owlbear/party/manifest.json.');
}
