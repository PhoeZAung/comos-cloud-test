import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('NPC catalog omits completed import progress display for all tabs',()=>{
 const directory=readFileSync(new URL('../src/ui/npc-directory.mjs',import.meta.url),'utf8');
 const styles=readFileSync(new URL('../src/styles/site.css',import.meta.url),'utf8');
 assert.doesNotMatch(directory,/data-npc-progress|npc-progress-card|showProgress|result\.progress|Checking source progress/);
 assert.doesNotMatch(styles,/\.npc-progress-(?:grid|card)/);
 for(const category of ['npc','bestiary','companions']){
  assert.match(directory,new RegExp('data-npc-chapter="'+category+'"'));
 }
 assert.match(directory,/data-npc-list/);
 assert.match(directory,/data-find-npc/);
 assert.match(directory,/data-more-npcs/);
});
