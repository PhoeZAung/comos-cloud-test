import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {renderSheetFrame,renderSection,renderSkillRows} from '../src/features/sheet/view.mjs';

const tinyPortrait='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/nN0AAAAASUVORK5CYII=';

test('portrait-only sheet update works for rules-built characters without rewriting identity or stats',()=>{
 const original={charName:'Knight',alignment:'LG',bio:'Saved biography',str:14,rulesBuild:{level:4},portrait:'',currency_gil:60};
 const saved=mergeSheetData(original,{op:'sheet',revision:1,action:'portrait',portrait:tinyPortrait});
 assert.equal(saved.portrait,tinyPortrait);
 assert.equal(saved.charName,'Knight');
 assert.equal(saved.alignment,'LG');
 assert.equal(saved.bio,'Saved biography');
 assert.equal(saved.str,14);
 assert.deepEqual(saved.rulesBuild,{level:4});
 assert.equal(saved.currency_gil,60);
 assert.equal(original.portrait,'');
 assert.equal(mergeSheetData(saved,{action:'portrait',portrait:''}).portrait,'');
 assert.throws(()=>mergeSheetData(original,{action:'portrait',portrait:'https://example.com/picture.png'}),/small JPEG, PNG, or WebP portrait/);
 assert.throws(()=>mergeSheetData(original,{action:'portrait'}),/Invalid portrait update/);
 assert.throws(()=>mergeSheetData(original,{action:'portrait',portrait:tinyPortrait,str:999}),/Invalid portrait update/);
});

test('sheet portrait upload is direct and locked skills omit redundant visible training description',async()=>{
 const hero={id:'character-1',name:'Knight',kind:'player',data:{portrait:tinyPortrait,str:14,skills:[]}};
 const html=renderSheetFrame(hero,'skills');
 assert.match(html,/data-sheet-portrait/);
 assert.match(html,/Change image here/);
 assert.match(html,/class="cs-portrait"/);
 assert.match(html,/cs-skill-untrained/);
 assert.doesNotMatch(html,/Trained only ·/);
 assert.doesNotMatch(html,/cs-skill-training-note/);
 const disabled=renderSkillRows(hero.data,'Disable Device');
 assert.match(disabled,/data-training-locked="true"/);
 assert.match(disabled,/disabled aria-disabled="true"/);
 assert.match(disabled,/aria-label="Roll Disable Device unavailable until one skill rank is assigned"/);
 const source=await readFile(new URL('../src/ui/sheet.mjs',import.meta.url),'utf8');
 assert.match(source,/save\(\{action:'portrait',portrait\}\)/);
 assert.doesNotMatch(source,/save\(\{op:'wizard',step:'identity'/);
});

test('capacity retains load information but currency tiles use the same compact card layout',async()=>{
 const hero={id:'character-1',name:'Knight',data:{str:12,items:[{name:'Gear',amount:1,weight:18}]}};
 const inventory=renderSection(hero,'items');
 assert.match(inventory,/cs-currency-metric cs-capacity-metric/);
 assert.match(inventory,/cs-capacity-meter/);
 assert.match(inventory,/Light: up to/);
 assert.match(inventory,/Medium: above/);
 assert.match(inventory,/Heavy: above/);
 assert.match(inventory,/cs-capacity-state sr-only/);
 assert.doesNotMatch(inventory,/cs-load-key/);
 const css=await readFile(new URL('../src/styles/sheet-refinements.css',import.meta.url),'utf8');
 assert.match(css,/\.cs-currency-metric\{box-sizing:border-box;height:100%\}/);
 assert.match(css,/\.cs-capacity-meter\{[^}]*height:7px/);
});
