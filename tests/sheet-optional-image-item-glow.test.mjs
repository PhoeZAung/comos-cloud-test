import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {inventoryItemValue,usableItemImageUrl} from '../src/features/sheet/inventory-fields.mjs';
import {renderSheetFrame} from '../src/features/sheet/view.mjs';

test('oversized or unsupported image metadata is ignored instead of blocking item edits',()=>{
 const huge='data:image/png;base64,'+'a'.repeat(8000);
 const savedItem={name:'From catalog',sourceCategory:'Weapon',img:huge,sourceCatalog:{raw:{image:huge}},desc:'Original'};
 const original={items:[savedItem]};
 const save=fields=>mergeSheetData(original,{action:'entry',collection:'items',mode:'update',index:0,fields});
 const result=save({name:'From catalog, updated',desc:'Updated',img:huge});
 assert.equal(result.items[0].name,'From catalog, updated');
 assert.equal(result.items[0].desc,'Updated');
 assert.equal(result.items[0].img,'');
 assert.equal(result.items[0].sourceCatalog.raw.image,huge);
 assert.equal(original.items[0].img,huge);
 assert.equal(save({img:'not a link',type:'Heavy'}).items[0].type,'Heavy');
 assert.equal(save({img:'javascript:alert(1)'}).items[0].img,'');
 assert.equal(save({img:'https://example.com/u:'+ 'a'.repeat(2500)}).items[0].img,'');
 assert.equal(save({img:null}).items[0].img,'');
 assert.equal(save({img:''}).items[0].img,'');
});

test('valid web images remain usable; executable or non-web schemes cannot become usable image URLs',()=>{
 assert.equal(usableItemImageUrl(' https://example.com/sword.png '),'https://example.com/sword.png');
 assert.equal(usableItemImageUrl('http://example.com/image.svg'),'http://example.com/image.svg');
 for(const source of ['','relative/image.png','ftp://example.com/pic','javascript:alert(1)','data:image/png;base64,aGVsbG8=','https://admin:secret@example.com/a.png','https://example.com/'+'x'.repeat(2100),'https://example.com/evil\nheader'])
  assert.equal(usableItemImageUrl(source),'',source.slice(0,70));
 const result=mergeSheetData({items:[{name:'Hat',sourceCategory:'Gear'}]}, {action:'entry',collection:'items',mode:'update',index:0,fields:{img:'https://example.com/hat.png'}});
 assert.equal(result.items[0].img,'https://example.com/hat.png');
});

test('imported raw image metadata never requires a matching valid inventory image field',()=>{
 const sourceCatalog={raw:{'Image URL':'data:image/webp;base64,'+'A'.repeat(11000)}};
 const item={name:'Imported',sourceCategory:'Magic Items',sourceCatalog};
 const fromCatalog=inventoryItemValue(item,'img');
 assert.ok(fromCatalog.length>2048);
 assert.equal(usableItemImageUrl(fromCatalog),'');
 const result=mergeSheetData({items:[item]},{action:'entry',collection:'items',mode:'update',index:0,fields:{name:'Imported +1',img:fromCatalog}});
 assert.equal(result.items[0].img,'');
 assert.deepEqual(result.items[0].sourceCatalog,sourceCatalog);
});

test('item preview has the same moving glow and single scroll container as ability preview',async()=>{
 const html=renderSheetFrame({id:'hero',name:'Hero',data:{items:[]}},'items');
 assert.match(html,/<dialog class="cs-dialog cs-item-description-dialog cs-star-border"[^>]*><div class="cs-item-description-scroll">/);
 assert.match(html,/<div class="cs-inventory-item-special" data-item-special hidden><\/div><\/div><\/dialog>/);
 const css=await readFile(new URL('../src/styles/sheet-refinements.css',import.meta.url),'utf8');
 assert.match(css,/\.cs-dialog\.cs-item-description-dialog\.cs-star-border\{padding:0;overflow:visible/);
 assert.match(css,/\.cs-item-description-dialog>\.cs-item-description-scroll\{[^}]*overflow-y:auto/);
 assert.match(css,/\.cs-item-description-dialog \[data-item-description-text\],[\s\S]*?max-height:none;overflow:visible/);
 const ui=await readFile(new URL('../src/ui/sheet.mjs',import.meta.url),'utf8');
 assert.match(ui,/if\(key==='img'&&item\)return/);
 assert.match(ui,/usableItemImageUrl\(value\)/);
});
