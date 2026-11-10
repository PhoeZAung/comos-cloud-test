import {generateFirstCoreManual} from './generate-first-core-manual.mjs';
import {buildDiceAssets} from './build-dice.mjs';
import {buildCriticalEffects} from './build-critical-effects.mjs';
import {build,transform} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {generateRaceCatalog} from './generate-races.mjs';
import {generateArcherPreview} from './generate-archer.mjs';
import {generateClassCatalog} from './generate-class-catalog.mjs';
import {generateBardCatalog} from './generate-bard.mjs';
import {cp} from 'node:fs/promises';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { renderPage, routeView } from '../src/layouts/site.mjs';

const args = process.argv.slice(2);
if (args.length && !(args.length === 1 && args[0] === '--mode=preview')) {
  throw new Error('Only --mode=preview is supported. Production identity and persistence are not implemented.');
}

await generateRaceCatalog();
await generateArcherPreview();
await generateClassCatalog();
await generateBardCatalog();
await generateFirstCoreManual();

const root = new URL('../', import.meta.url);
const files = (await readdir(new URL('src/pages/', root))).filter(name => name.endsWith('.mjs')).sort();
const pages = [];
const ids = new Set();
for (const file of files) {
  const { default: page } = await import(new URL(`src/pages/${file}`, root));
  if (!/^[a-z][a-z0-9-]*$/.test(page.id) || file !== `${page.id}.mjs` || ids.has(page.id)) throw new Error(`Invalid or duplicate page: ${file}`);
  ids.add(page.id);
  pages.push([page.id, renderPage(page, { scripts: ['preview/runtime.mjs', 'assets/shell.mjs', ...(page.auth ? ['auth/preview.mjs'] : [])] })]);
  await mkdir(new URL('dist/assets/routes/', root), {recursive:true});
  await writeFile(new URL(`dist/assets/routes/${page.id}.mjs`,root), 'export default '+JSON.stringify(routeView(page))+';\n');
}
const styles = await Promise.all(['tokens.css', 'themes.css', 'sheet-loading.css', 'dice-themes.css', 'site.css', 'character-carousel.css', 'character-wizard.css', 'rules-wizard.css', 'feed-lore.css', 'feed-additions.css', 'thread.css', 'item-categories.css', 'item-control.css','tag-groups.css','critical-effects.css'].map(file => readFile(new URL(`src/styles/${file}`, root), 'utf8')));
await mkdir(new URL('dist/assets/', root), { recursive: true });
await mkdir(new URL('dist/assets/icons/',root),{recursive:true});
await cp(new URL('src/assets/icons/level-up.png',root),new URL('dist/assets/icons/level-up.png',root));
for(const icon of ['d20.png','sword-action.png','running-action.png'])await cp(new URL('src/assets/icons/'+icon,root),new URL('dist/assets/icons/'+icon,root));
await mkdir(new URL('dist/preview/', root), { recursive: true });
for (const file of ['runtime.mjs', 'store.mjs', 'fixtures.mjs']) {
  await writeFile(new URL(`dist/preview/${file}`, root), await readFile(new URL(`src/preview/${file}`, root)));
}
await mkdir(new URL('dist/auth/', root), { recursive: true });
for (const file of ['preview.mjs', 'validation.mjs']) {
  await writeFile(new URL(`dist/auth/${file}`, root), await readFile(new URL(`src/auth/${file}`, root)));
}
for (const [id, html] of pages) await writeFile(new URL(`dist/${id}.html`, root), html);
await writeFile(new URL('dist/assets/site.css', root), styles.join('\n'));
const sheetCss=(await Promise.all(['tokens.css','themes.css','sheet-loading.css','dice-themes.css','sheet-base.css','sheet.css','item-categories.css','tag-groups.css','critical-effects.css'].map(file=>readFile(new URL('src/styles/'+file,root),'utf8')))).join('\n');
await writeFile(new URL('dist/assets/sheet.css',root),(await transform(sheetCss,{loader:'css',minify:true,target:'es2022'})).code);
await writeFile(new URL('dist/assets/laser-flow.css',root),(await transform(await readFile(new URL('src/styles/laser-flow.css',root),'utf8'),{loader:'css',minify:true,target:'es2022'})).code);
await writeFile(new URL('dist/assets/feedback.css',root),await readFile(new URL('src/styles/feedback.css',root)));
await writeFile(new URL('dist/assets/sheet-refinements.css',root),(await transform(await readFile(new URL('src/styles/sheet-refinements.css',root),'utf8'),{loader:'css',minify:true,target:'es2022'})).code);
await writeFile(new URL('dist/assets/sheet-effects.css',root),(await transform(await readFile(new URL('src/styles/sheet-effects.css',root),'utf8'),{loader:'css',minify:true,target:'es2022'})).code);
console.log(`Built ${pages.length} Cosmos pages in isolated fixture preview mode.`);

for (const file of ['npc-directory.mjs','ability-library.mjs','admin-sheets.mjs','mobile-viewport.mjs','react-bits-loader.mjs','sheet-delete.mjs','sheet-notes-electric.mjs','critical-effects-player.mjs','critical-frames.mjs','dice-3d.mjs','sheet-settings.mjs','critical-fx.mjs','dice-theme-picker.mjs','sheet-loading.mjs','feedback.mjs','shell.mjs','router.mjs','install.mjs','session.mjs','preferences.mjs','groups.mjs','items.mjs','record-id.mjs','lore.mjs','lore-draft.mjs','lore-draft-controller.mjs','lore-compose.mjs','lore-entry.mjs','feed.mjs','compose.mjs','post-thread.mjs','directory.mjs','character-view.mjs','rules-wizard.mjs','sheet.mjs','sheet-entry.mjs','character-library.mjs','admin-icons.mjs']) await writeFile(new URL('dist/assets/'+file,root),await readFile(new URL('src/ui/'+file,root)));
await writeFile(new URL('dist/assets/galaxy.mjs',root),await readFile(new URL('src/effects/galaxy.mjs',root)));

await cp(new URL('src/account/',root),new URL('dist/account/',root),{recursive:true});
await writeFile(new URL('dist/assets/splash.mjs',root),await readFile(new URL('src/effects/splash.mjs',root)));

// Rebase fixture editor imports onto the same shared UI modules as the shell.
for(const file of ['editor.mjs','view.mjs']) {const p=new URL('dist/account/'+file,root);await writeFile(p,(await readFile(p,'utf8')).replaceAll('../ui/preferences.mjs','../assets/preferences.mjs').replaceAll('../ui/dice-theme-picker.mjs','../assets/dice-theme-picker.mjs'));}
await writeFile(new URL('dist/assets/effects.mjs',root),await readFile(new URL('src/ui/effects.mjs',root)));


await cp(new URL('src/features/',root),new URL('dist/features/',root),{recursive:true});
for(const file of ['home-ui.mjs','characters-ui.mjs','lore-ui.mjs'])await writeFile(new URL('dist/preview/'+file,root),await readFile(new URL('src/preview/'+file,root)));

await buildDiceAssets();
await buildCriticalEffects();
await build({entryPoints:[fileURLToPath(new URL('src/ui/party-notes.mjs',root))],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,outfile:fileURLToPath(new URL('dist/assets/party-notes.mjs',root))});
await writeFile(new URL('dist/assets/party-notes.LICENSE.txt',root),(await Promise.all(['yjs','lib0','isomorphic.js'].map(async name=>name+'\n'+await readFile(new URL('node_modules/'+name+'/LICENSE',root),'utf8')))).join('\n\n'));

// React Bits effects are local, lazy-loaded islands; React stays out of normal sheet startup.
await build({entryPoints:["electric","paper"].map(name=>fileURLToPath(new URL("src/effects/react-bits/"+name+".jsx",root))),bundle:true,splitting:true,format:"esm",platform:"browser",target:"es2022",jsx:"automatic",minify:true,define:{"process.env.NODE_ENV":"\"production\""},outdir:fileURLToPath(new URL("dist/assets/react-bits/",root))});

await writeFile(new URL("dist/assets/react-bits/LICENSE.txt",root),await readFile(new URL("docs/licenses/React-Bits-LICENSE.md",root),"utf8")+"\n"+(await Promise.all(["react","react-dom","three","html-to-image"].map(async name=>name+"\n"+await readFile(new URL("node_modules/"+name+"/LICENSE",root),"utf8")))).join("\n\n"));
