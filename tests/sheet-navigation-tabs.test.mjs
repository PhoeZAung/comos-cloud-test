import test from 'node:test';
import assert from 'node:assert/strict';
import {createSheetTabs} from '../src/ui/sheet-tabs.mjs';
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
