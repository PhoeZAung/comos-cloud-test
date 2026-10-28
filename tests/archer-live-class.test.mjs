import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,buildIssues,choiceEvents,eligibleOptions,previewBuild,compileBuild,levelUpBuild,archerAtLevel,classFor,className,classSkill,availableClasses} from '../src/features/characters/rules/build.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {sheetStats} from '../src/features/sheet/model.mjs';
import {renderBuild,wizardOrder} from '../src/ui/rules-wizard.mjs';
import {ARCHER_ID,BLACK_MAGE_ID} from '../src/features/characters/rules/class-adapters.mjs';

function archerBuild(level=1){
 const b=newBuild();Object.assign(b,{classId:ARCHER_ID,name:'Archer Live Fixture',raceId:'ffd20:race:lizardman',
  abilityMethod:'manual',level,hpRolls:[8,...Array.from({length:level-1},()=>5)],reviewed:true,initialIntMod:null,
  spellIds:[],spellSelections:{cantrips:[],leveled:[]},choices:{},favored:[]});
 const points=previewBuild(b).skillBudget;
 let remaining=points;
 b.skillRanks=fixedSkills.map(()=>{const n=Math.min(level,remaining);remaining-=n;return n;});
 assert.equal(remaining,0,'test fixtures must spend every Archer skill rank');
 const used=new Set();
 for(const event of choiceEvents(b)){
  const option=eligibleOptions(b,event).find(o=>!used.has(o.id));
  assert(option,'must have an eligible Archer option at level '+event.atClassLevel);
  b.choices[event.id]=[option.id];used.add(option.id);
 }
 return b;
}
test('class adapters register two independent live classes, retaining Black Mage by default',()=>{
 assert.deepEqual(availableClasses.map(x=>x.name),['Black Mage','Archer']);
 assert.equal(newBuild().classId,BLACK_MAGE_ID);
 assert.equal(className(archerBuild()),'Archer');
 assert.equal(classFor(archerBuild()).data.hitDie,8);
});
test('Archer creation computes d8 HP, saves, 6+INT skills, class proficiencies, and nonmagic resources',()=>{
 const b=archerBuild();assert.deepEqual(buildIssues(b),[]);
 const d=compileBuild(b),s=sheetStats(d);
 assert.equal(d.class,'Archer');assert.equal(d.classId,ARCHER_ID);
 assert.equal(d.hp_max,8);assert.equal(s.hpMax,8);
 assert.equal(d.bab,0);assert.equal(d.ref_base,2);assert.equal(d.fort_base,0);assert.equal(d.will_base,0);
 assert.equal(d.mp_class,0);assert.equal(d.mp_bonus,0);assert.equal(d.mp,0);
 assert.equal(d.rulesBuild.input.classId,ARCHER_ID);
 assert(d.feats.some(x=>x.sourceRuleId.includes('event:choice:archery-style:1')));
 assert(d.proficiencies.includes('Bows')&&d.proficiencies.includes('Crossbows'));
 assert(d.skills.find(x=>x.name==='Perception').cs);
 for(const name of ['Craft','Profession','Knw: Geography','Knw: Nature'])assert(d.skills.some(x=>x.name===name&&x.cs),'missing Archer class skill '+name);
});
test('Archer level up preserves the first style feat and adds a level 2 talent without Black Mage spells',()=>{
 const first=archerBuild(1),d1=compileBuild(first),next=archerBuild(2);
 for(const [id,picks] of Object.entries(first.choices))next.choices[id]=picks;
 assert.deepEqual(buildIssues(next),[]);
 const d2=levelUpBuild(next,d1);
 assert.equal(d2.hp_max,13);assert.equal(d2.mp_class,0);assert.equal(d2.bab,1);
 assert.equal(d2.ref_base,3);assert.equal(d2.skills.find(x=>x.name==='Perception').rulesBonus,1);
 assert.equal(d2.feats.filter(x=>x.sourceRuleId.includes('event:choice:archery-style:1')).length,1);
 assert(d2.passiveAbilities.some(x=>x.sourceRuleId.includes(':talent:acute-senses')));
 assert(d2.passiveAbilities.some(x=>x.name==='Hawkeye'));
 assert.equal(d2.spells.filter(x=>x.rulesOwned).length,0);
});
test('Archer upgrades improve one owned card, rather than adding a duplicate card',()=>{
 for(const [level,target,expected] of [[1,'Aim','Insight +1'],[5,'Aim','Insight +2'],[10,'Aim','Insight +3'],[20,'Aim','Insight +5'],[18,'Critical Aim','Threat-range increase +2'],[17,'Evasive Archer','Dodge AC +4']]){
  const d=compileBuild(archerBuild(level));
  const rows=[...d.activeAbilities,...d.passiveAbilities].filter(x=>x.sourceRuleId==='ffd20:class:archer:feature:'+target.toLowerCase().replace(/\s+/g,'-'));
  assert.equal(rows.length,1,'duplicate '+target+' at level '+level);
  assert(rows[0].desc.includes(expected),'wrong upgrade '+target+' at level '+level);
 }
});
test('Archer style feat choice pools expand without removing previous legal feats',()=>{
 const lv1=archerBuild(1),lv5=archerBuild(5),lv10=archerBuild(10);
 assert.equal(choiceEvents(lv1).length,1);
 assert.equal(choiceEvents(lv5).length,5);
 assert.equal(choiceEvents(lv10).length,9);
 const first=choiceEvents(lv1)[0],second=choiceEvents(lv5).find(x=>x.atClassLevel===5),third=choiceEvents(lv10).find(x=>x.atClassLevel===10&&!x.poolId.includes('archery-talents'));
 assert(eligibleOptions(lv5,second).some(x=>x.id===lv1.choices[first.id][0]));
 assert(eligibleOptions(lv10,third).some(x=>x.id===lv1.choices[first.id][0]));
});
test('Archer rejects fabricated higher-level choices, invalid class IDs, and changing class on edit',()=>{
 const b=archerBuild(),copy=structuredClone(b);
 copy.choices[choiceEvents(b)[0].id]=['ffd20:class:archer:talent:greater-intercept'];
 assert(buildIssues(copy).some(i=>i.step===4));
 const bad=structuredClone(b);bad.classId='ffd20:class:not-extracted';
 assert.throws(()=>compileBuild(bad),/Class not enabled/);
 const d=compileBuild(b),changed=structuredClone(b);changed.classId=BLACK_MAGE_ID;
 assert.throws(()=>compileBuild(changed,d),/cannot change classes/i);
});
test('Archer creation wizard includes class selector, class choices and no Black Mage spell step',()=>{
 const b=archerBuild(),html=renderBuild(b,3,{archerPreviewLevel:5});
 assert.match(html,/data-rw-field="classId"/);
 assert.match(html,/Archer — Class Levels & Upgrades/);
 assert.match(html,/value="ffd20:class:archer"/);
 assert(wizardOrder(b,'create').includes(4));assert(!wizardOrder(b,'create').includes(5));
 assert.match(renderBuild(b,4),/Archery Style/);
});
