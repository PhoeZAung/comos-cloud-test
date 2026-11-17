import test from 'node:test';
import assert from 'node:assert/strict';
import {createSheetTabs,createSheetSnapshotCache} from '../src/ui/sheet-tabs.mjs';
import {renderSheetFrame} from '../src/features/sheet/view.mjs';

test('standalone sheet tabs only appear with two or more open characters',()=>{
 const tabs=createSheetTabs();
 tabs.add({id:'a',name:'Astra'});
 assert.equal(tabs.render('a'),'');
 tabs.add({id:'b',name:'Nyx'});
 const html=tabs.render('b');
 assert.match(html,/data-switch-sheet="a"/);
 assert.match(html,/data-switch-sheet="b"/);
 assert.match(html,/Close Astra/);
 assert.doesNotMatch(html,/data-add-sheet/);
 assert.equal(tabs.close('b','b'),'a');
 assert.equal(tabs.render('a'),'');
});

test('Site and Owlbear both put Add Sheet and Pop Out beside Favorite and Rest',()=>{
 const character={id:'a',name:'Astra',kind:'player',owned:true,data:{}};
 const html=renderSheetFrame(character);
 const quick=html.match(/<div class="cs-quick-tools[^"]*">([\s\S]*?)<\/div>/)?.[1]||'';
 assert.ok(quick.includes('data-add-sheet'),'Add Sheet must live in the quick tools');
 assert.ok(quick.includes('data-sheet-popout'),'Pop Out must remain in the quick tools');
 assert.ok(quick.indexOf('data-add-sheet')<quick.indexOf('data-sheet-popout'),'Add Sheet appears beside Pop Out');
 const embedded=renderSheetFrame(character,'overview',{owlbear:true});
 const embeddedTools=embedded.match(/<div class="cs-quick-tools[^"]*">([\s\S]*?)<\/div>/)?.[1]||'';
 assert.match(embeddedTools,/data-toggle-stars/);
 assert.match(embeddedTools,/data-open-rest/);
 assert.match(embeddedTools,/data-add-sheet/);
 assert.match(embeddedTools,/data-sheet-popout/);
 assert.ok(embeddedTools.indexOf('data-open-rest')<embeddedTools.indexOf('data-add-sheet'));
 assert.ok(embeddedTools.indexOf('data-add-sheet')<embeddedTools.indexOf('data-sheet-popout'));
 assert.doesNotMatch(renderSheetFrame(character,'overview',{compact:true}),/data-add-sheet/);
 assert.doesNotMatch(renderSheetFrame({...character,owned:false}),/data-add-sheet/);
});


test('returning to an open sheet reuses its latest in-memory character revision',()=>{
 let time=0;
 const cache=createSheetSnapshotCache({limit:2,maxAgeMs:10000,now:()=>time});
 const first={character:{id:'first',name:'Astra',revision:1,data:{hp_curr:10}},admin:false};
 const second={character:{id:'second',name:'Nyx',revision:2,data:{hp_curr:8}},admin:true};
 cache.set('first',first);
 cache.set('second',second);
 assert.equal(cache.get('first'),first,'quick return has no round-trip dependency');
 cache.set('first',{...first,character:{...first.character,revision:3,data:{hp_curr:9}}});
 assert.equal(cache.get('first').character.revision,3,'saves keep snapshots current');
 cache.set('third',{character:{id:'third',name:'Gromog',revision:1},admin:false});
 assert.equal(cache.get('second'),null,'least recent sheets are evicted from memory');
 assert.equal(cache.get('first').character.data.hp_curr,9);
 time=10001;
 assert.equal(cache.get('first'),null,'old snapshots must be fetched again');
 cache.set('wrong',{character:{id:'another',revision:1},admin:false});
 assert.equal(cache.get('wrong'),null,'a snapshot cannot be reused for another character');
 cache.clear();
 assert.equal(cache.get('third'),null);
});

test('Owlbear sheet activation triggers visible frame revision checks but no hidden polling',async()=>{
 const {readFile}=await import('node:fs/promises');
 const action=await readFile('src/owlbear/action.mjs','utf8');
 const sheet=await readFile('src/ui/sheet.mjs','utf8');
 assert.match(action,/type:'cosmos:sheet-active',nonce:chosen\.nonce/);
 assert.match(sheet,/inactiveOwlbearSheet\(\)/);
 assert.match(sheet,/if\(!force&&inactiveOwlbearSheet\(\)\)return/);
 assert.match(sheet,/event\.data\?\.type!=='cosmos:sheet-active'/);
 assert.match(sheet,/status\('Checking for updates…'\);void refresh\(\)/);
});
