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
 manifest.action.icon=origin+'/owlbear/icon.svg';
 manifest.action.popover=origin+'/owlbear/index.html';
 await writeFile(directory+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
 for(const name of ['action','connect','sheet'])await build({entryPoints:[fileURLToPath(new URL('../src/owlbear/'+name+'.mjs',import.meta.url))],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,outfile:directory+'/'+name+'.js'});
 const head='<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="/owlbear/icon.svg"><link rel="stylesheet" href="/owlbear/owlbear.css">';
 await writeFile(directory+'/index.html',`<!doctype html><html lang="en"><head>${head}<title>Cosmos · Owlbear</title><script type="module" src="/owlbear/action.js"></script></head><body>
 <main class="extension-panel"><h1>Cosmos Character Sheets</h1>
 <div class="extension-tools"><button data-back hidden>← My characters</button><button class="primary" data-open-sheet-tab hidden>Open in new tab ↗</button></div>
 <details class="panel-options" open><summary>Account &amp; panel size</summary><div class="options-content">
 <div class="extension-tools"><button class="primary" data-connect>Connect Cosmos account</button><button data-refresh>Refresh characters</button><button data-dice-check>Check Dice+</button><a class="button" href="/" target="_blank" rel="noopener">Open Cosmos</a></div>
 <label class="audience">Roll visibility <select data-audience><option value="everyone">Everyone</option><option value="self">Only me</option><option value="dm">Me and GM</option></select></label>
 <form class="panel-size" data-panel-size><div class="extension-tools"><button type="button" data-phone-size>Phone</button><button type="button" data-medium-size>Wider</button></div><div class="extension-tools"><label>Width <input name="width" type="number" value="390" step="1" required></label><label>Height <input name="height" type="number" value="640" step="1" required></label><button type="submit">Apply</button></div></form>
 </div></details>
 <p class="extension-status" role="status" data-status>Waiting for Owlbear…</p><div class="character-grid" data-characters></div><iframe title="Your Cosmos character sheet" hidden></iframe>
 </main><button class="panel-resize" data-resize aria-label="Resize panel. Drag, or use arrow keys; hold Shift for larger steps." title="Drag to resize">◢</button></body></html>`);
 await writeFile(directory+'/connect.html','<!doctype html><html lang="en"><head>'+head+'<title>Connect Cosmos to Owlbear</title><script type="module" src="/owlbear/connect.js"></script></head><body><main class="connect-card"><h1>Connect your Cosmos account</h1><p role="status">Checking sign-in…</p><div class="connect-actions"><a class="button primary" href="/signin.html" target="_blank" rel="noopener">Sign in to Cosmos</a><a class="button" href="/account.html" target="_blank" rel="noopener">Finish profile</a><button data-check-signin>Check sign-in</button></div><p class="connect-note">Sign in on the normal Cosmos website, then return here. Keep this window open while your sheet is open in Owlbear. Closing it disconnects the sheet. No passwords or session cookies are shared with Owlbear or Dice+.</p></main></body></html>');
 let sheet=await readFile(output+'/sheet.html','utf8');
 sheet=sheet.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/\b(href|src)="(?!https?:|\/|#)([^"]+)"/g,'$1="/$2"').replace('<body ','<body data-owlbear-sheet="true" ').replace('</head>','<link rel="stylesheet" href="/owlbear/sheet.css"><script type="module" src="/owlbear/sheet.js"></script></head>');
 await writeFile(directory+'/sheet.html',sheet);
 await writeFile(directory+'/sheet.css','body[data-owlbear-sheet]{min-width:0}body[data-owlbear-sheet] [data-sheet-popout],body[data-owlbear-sheet] [data-delete-character]{display:none}');
 console.log('Built Cosmos Owlbear extension at /owlbear/manifest.json.');
}
