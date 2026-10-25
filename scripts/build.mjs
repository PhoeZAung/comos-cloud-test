import {cp} from 'node:fs/promises';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { renderPage, routeView } from '../src/layouts/site.mjs';

const root = new URL('../', import.meta.url);
const args = process.argv.slice(2);
if (args.length && !(args.length === 1 && args[0] === '--mode=preview')) {
  throw new Error('Only --mode=preview is supported. Production identity and persistence are not implemented.');
}
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
const styles = await Promise.all(['tokens.css', 'site.css', 'character-carousel.css', 'character-wizard.css', 'feed-lore.css', 'feed-additions.css', 'thread.css'].map(file => readFile(new URL(`src/styles/${file}`, root), 'utf8')));
await mkdir(new URL('dist/assets/', root), { recursive: true });
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
console.log(`Built ${pages.length} Comos pages in isolated fixture preview mode.`);

for (const file of ['shell.mjs','router.mjs','install.mjs','session.mjs','preferences.mjs','groups.mjs','items.mjs','record-id.mjs','feed.mjs','compose.mjs','post-thread.mjs','directory.mjs','character-view.mjs','character-library.mjs','admin-icons.mjs']) await writeFile(new URL('dist/assets/'+file,root),await readFile(new URL('src/ui/'+file,root)));
await writeFile(new URL('dist/assets/galaxy.mjs',root),await readFile(new URL('src/effects/galaxy.mjs',root)));

await cp(new URL('src/account/',root),new URL('dist/account/',root),{recursive:true});
await writeFile(new URL('dist/assets/splash.mjs',root),await readFile(new URL('src/effects/splash.mjs',root)));

// Rebase fixture editor imports onto the same shared UI modules as the shell.
for(const file of ['editor.mjs','view.mjs']) {const p=new URL('dist/account/'+file,root);await writeFile(p,(await readFile(p,'utf8')).replaceAll('../ui/preferences.mjs','../assets/preferences.mjs'));}
await writeFile(new URL('dist/assets/effects.mjs',root),await readFile(new URL('src/ui/effects.mjs',root)));


await cp(new URL('src/features/',root),new URL('dist/features/',root),{recursive:true});
for(const file of ['home-ui.mjs','characters-ui.mjs','lore-ui.mjs'])await writeFile(new URL('dist/preview/'+file,root),await readFile(new URL('src/preview/'+file,root)));
