import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('catalog quantity and search inputs do not mark character editor dirty',async()=>{
 const source=await readFile('src/ui/sheet.mjs','utf8');
 const input=source.slice(source.indexOf("root.addEventListener('input',event=>{"));
 assert.match(input,/if\(event\.target\.closest\('\.cs-picker,\.cs-catalog-preview'\)\)return;/);
 const guard=input.indexOf("if(event.target.closest('.cs-picker,.cs-catalog-preview'))return;");
 const mark=input.indexOf("dirty=true;status('Unsaved changes')");
 assert.ok(guard>=0&&mark>guard,'Shop controls must be excluded before general editor form dirty tracking');
 assert.match(source,/if\(busy\|\|closed\|\|conflict\|\|dirty\)throw Error\('Finish saving this character before buying\.'\)/);
});
