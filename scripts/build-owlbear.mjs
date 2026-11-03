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
 manifest.background_url=origin+'/owlbear/background.html';
 await writeFile(directory+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
 for(const name of ['action','connect','sheet','background','party-overlay','initiative','battle-add'])await build({entryPoints:[fileURLToPath(new URL('../src/owlbear/'+name+'.mjs',import.meta.url))],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,outfile:directory+'/'+name+'.js'});
 const head='<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="/owlbear/icon.svg"><link rel="stylesheet" href="/owlbear/owlbear.css">';
 await writeFile(directory+'/index.html',`<!doctype html><html lang="en"><head>${head}<title>Cosmos · Owlbear</title><script type="module" src="/owlbear/action.js"></script></head><body>
 <main class="extension-panel"><h1 class="cosmos-title"><img src="/owlbear/icon.svg" alt="">Cosmos</h1>
 <div class="extension-tools"><button data-back hidden>← My characters</button><button class="sheet-window-button" data-open-sheet-tab hidden aria-label="Open sheet in a separate window" title="Open sheet window"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M14 3h7v7M21 3 10 14M10 3H3v18h18v-7"/></svg></button></div>
 <details class="panel-options" open><summary>Account</summary><div class="options-content">
 <div class="extension-tools"><button class="primary" data-connect>Connect Cosmos account</button><button data-refresh>Refresh characters</button><a class="button" href="/" target="_blank" rel="noopener">Open Cosmos</a></div>
 <label class="audience">Roll visibility <select data-roll-audience><option value="everyone">Everyone</option><option value="self">Only me</option><option value="dm">Me and GM</option></select></label>

 </div></details>
 <section class="cosmos-admin" data-admin-controls hidden><header><strong>Display</strong><span data-tracker-status>Connecting…</span></header><div class="cosmos-display-row"><label><input type="checkbox" data-layout="party"> Show Party</label><select data-layout="partyDock" aria-label="Party position"><option value="top">Top</option><option value="bottom">Bottom</option><option value="left">Left</option><option value="right">Right</option></select></div><div class="cosmos-display-row"><label><input type="checkbox" data-layout="initiative"> Show Initiative</label><select data-layout="initiativeDock" aria-label="Initiative position"><option value="left">Left</option><option value="right">Right</option></select></div></section>
 <p class="extension-status" role="status" data-status>Waiting for Owlbear…</p><div class="character-grid" data-characters></div><iframe title="Your Cosmos character sheet" hidden></iframe>
 </main><button class="panel-resize" data-resize aria-label="Resize panel. Drag, or use arrow keys; hold Shift for larger steps." title="Drag to resize">◢</button></body></html>`);
 await writeFile(directory+'/connect.html','<!doctype html><html lang="en"><head>'+head+'<title>Connect Cosmos to Owlbear</title><script type="module" src="/owlbear/connect.js"></script></head><body><main class="connect-card"><h1>Connect your Cosmos account</h1><p role="status">Checking sign-in…</p><div class="connect-actions"><a class="button primary" href="/signin.html" target="_blank" rel="noopener">Sign in to Cosmos</a><a class="button" href="/account.html" target="_blank" rel="noopener">Finish profile</a><button data-check-signin>Check sign-in</button></div><p class="connect-note">Sign in, then check your connection. This window closes after connecting.</p></main></body></html>');
 let sheet=await readFile(output+'/sheet.html','utf8');
 sheet=sheet.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/\b(href|src)="(?!https?:|\/|#)([^"]+)"/g,'$1="/$2"').replace('<body ','<body data-owlbear-sheet="true" ').replace('</head>','<link rel="stylesheet" href="/owlbear/sheet.css"><script type="module" src="/owlbear/sheet.js"></script></head>');
 await writeFile(directory+'/sheet.html',sheet);
 await writeFile(directory+'/sheet.css','body[data-owlbear-sheet]{min-width:0}body[data-owlbear-sheet] [data-sheet-popout],body[data-owlbear-sheet] [data-delete-character]{display:none}');
 await mkdir(directory+'/party',{recursive:true});
 const partyHead='<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="/owlbear/party-icon.svg"><link rel="stylesheet" href="/owlbear/party.css">';
 await writeFile(directory+'/background.html','<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Cosmos background</title><script type="module" src="/owlbear/background.js"></script></head><body></body></html>');
 await writeFile(directory+'/party/overlay.html',`<!doctype html><html lang="en" class="portrait-strip"><head>${partyHead}<title>Cosmos party</title><script type="module" src="/owlbear/party-overlay.js"></script></head><body class="overlay-body"><main class="status-cards" data-status-cards></main></body></html>`);
 await writeFile(directory+'/initiative.html',`<!doctype html><html lang="en"><head>${partyHead}<title>Cosmos initiative</title><script type="module" src="/owlbear/initiative.js"></script></head><body class="initiative-body"><main class="initiative-panel"><header class="battle-heading">Initiative</header><div class="battle-scroll"><table><thead><tr><th aria-label="Initiative">Init</th><th>Name</th><th>HP</th><th>MP</th><th>AC</th></tr></thead><tbody></tbody></table><p data-empty>No combatants</p></div><footer><button data-turn="-1" aria-label="Previous turn" hidden>‹</button><strong data-round>Round 1</strong><button data-turn="1" aria-label="Next turn" hidden>›</button></footer></main></body></html>`);
 await writeFile(directory+'/battle-add.html',`<!doctype html><html lang="en"><head>${partyHead}<title>Add to battle</title><script type="module" src="/owlbear/battle-add.js"></script></head><body><form class="battle-setup"><h1 data-name></h1><label>HP <input name="hp" type="number" min="0" max="9999999" placeholder="Untracked"></label><label>MP <input name="mp" type="number" value="0" min="0" max="9999999" required></label><label>AC <input name="ac" type="number" value="10" min="-9999999" max="9999999" required></label><label>Initiative <input name="initiative" type="number" value="0" min="-9999" max="9999" required></label><p role="status"></p><button type="submit" disabled>Add to battle</button></form></body></html>`);
 console.log('Built Cosmos Owlbear extension at /owlbear/manifest.json.');
 console.log('Built unified Cosmos party and initiative displays.');
}
