import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,registry,raceTraits,buildIssues,previewBuild,compileBuild,prepareLevelUp,levelUpBuild} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {racialChoiceSpecs,pruneRacialChoices,YAGUDO_RANK_LANGUAGES,YAGUDO_LINGUISTICS_ROW,YAGUDO_RELIGION_ROW} from '../src/features/characters/rules/racial-choices.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {completeFamilyBuild} from './helpers/sheet-family-fixtures.mjs';

const race=()=>registry.races.find(r=>r.id==='ffd20:race:yagudo');
function fixture(){
 const b=newBuild();Object.assign(b,{name:'Yagudo language test',raceId:race().id,
  classId:'ffd20:class:warrior',alignment:'True Neutral',reviewed:true});
 b.hpRolls=[classHitDie(b)];b.skillRanks=fixedSkills.map(()=>0);
 return b;
}
const issues=b=>buildIssues(b,{complete:false}).map(x=>x.message);
const bonus=(b,row)=>raceTraits(b).traits.flatMap(f=>f.effects).filter(e=>e.automation==='automatic'&&
  (e.target==='skills.row.'+row+'.bonus'||e.target==='skills.skill:'+(row===25?'knowledge-religion':'linguistics')+'.bonus'))
  .reduce((sum,e)=>sum+Number(e.value?.value||0),0);

test('Valiant Linguist grants +4 Linguistics and exactly two new language slots per invested rank',()=>{
 const b=fixture();
 const spec=()=>racialChoiceSpecs(race(),raceTraits(b).traits,b.level,b).find(x=>x.id===YAGUDO_RANK_LANGUAGES);
 assert.equal(spec().maximum,0);assert.equal(spec().minimum,0);
 assert.equal(bonus(b,27),4);
 assert.doesNotMatch(renderBuild(b,7),/data-rw-language-slot="ffd20:race:yagudo:pool:valiant-linguist-rank-languages"/);
 b.skillRanks[YAGUDO_LINGUISTICS_ROW]=1;
 assert.equal(spec().maximum,2);
 const html=renderBuild(b,7);
 assert.match(html,/Valiant Linguist · languages/);
 assert.match(html,/two per rank/);
 assert.match(html,/data-rw-language-slot="ffd20:race:yagudo:pool:valiant-linguist-rank-languages"/);
 assert.doesNotMatch(renderBuild(b,1),/data-rw-language-slot="ffd20:race:yagudo:pool:valiant-linguist-rank-languages"/);
 b.racialChoices[YAGUDO_RANK_LANGUAGES]=['language:Elvaan','language:Draconic'];
 assert(!issues(b).some(x=>/Valiant Linguist/.test(x)));
 let effects=raceTraits(b).traits.flatMap(f=>f.effects).filter(e=>e.kind==='language'&&e.id.startsWith(YAGUDO_RANK_LANGUAGES));
 assert.deepEqual(effects.map(e=>e.textValue),['Elvaan','Draconic']);
 b.racialChoices[YAGUDO_RANK_LANGUAGES].push('language:Celestial');
 assert(issues(b).some(x=>/Valiant Linguist/.test(x)),'No third language with only one rank');
 for(const invalid of [['language:Elvaan','language:elvaan'],['language:Yagudo'],['language:Common']]){
  b.racialChoices[YAGUDO_RANK_LANGUAGES]=invalid;
  assert(issues(b).length>0,invalid.join(','));
 }
});

test('Zealot Devotee starts at +2 Religion and gains +1 for every five actual ranks',()=>{
 const b=fixture();
 for(const [ranks,expected] of [[0,2],[4,2],[5,3],[9,3],[10,4],[14,4],[15,5],[19,5],[20,6]]){
  b.level=Math.max(1,ranks);b.skillRanks[YAGUDO_RELIGION_ROW]=ranks;
  assert.equal(bonus(b,YAGUDO_RELIGION_ROW),expected,'Knowledge Religion ranks '+ranks);
 }
 b.level=1;b.skillRanks[YAGUDO_RELIGION_ROW]=0;
 const noScaler=raceTraits({...b,alternateIds:[b.raceId+':trait:sturdy-feathers']});
 assert(!noScaler.traits.some(f=>f.id===b.raceId+':trait:zealot-devotee'));
 assert(!noScaler.traits.flatMap(f=>f.effects).some(e=>e.id===b.raceId+':trait:zealot-devotee:rank-scaling'));
});

test('Saved Yagudo language picks persist and cannot be rewritten, but remaining rank slots can be filled',()=>{
 const b=fixture();b.skillRanks[27]=1;
 b.racialChoices[YAGUDO_RANK_LANGUAGES]=['language:Elvaan','language:Draconic'];
 let d=compileBuild(completeFamilyBuild(b));
 assert.equal(d.skills[27].rulesBonus,4);
 assert(d.languages.some(s=>/Elvaan/i.test(String(s))));
 assert.deepEqual(compileBuild(d.rulesBuild.input,d).rulesBuild.input.racialChoices,b.racialChoices);
 let changed=structuredClone(d.rulesBuild.input);
 changed.racialChoices[YAGUDO_RANK_LANGUAGES]=['language:Celestial','language:Draconic'];
 assert.throws(()=>compileBuild(changed,d),/Previously chosen Yagudo/);
 changed=structuredClone(d.rulesBuild.input);
 changed.racialChoices[YAGUDO_RANK_LANGUAGES]=['language:Elvaan'];
 assert.throws(()=>compileBuild(changed,d),/Previously chosen Yagudo/);
 const {build}=prepareLevelUp(d);
 build.skillRanks[27]=2;
 build.racialChoices[YAGUDO_RANK_LANGUAGES].push('language:Celestial','language:Goblin');
 completeFamilyBuild(build);
 assert.equal(racialChoiceSpecs(race(),raceTraits(build).traits,build.level,build).find(x=>x.id===YAGUDO_RANK_LANGUAGES).maximum,4);
 assert.match(renderBuild(build,7,{mode:'levelup',baseline:d.rulesBuild.input}),/Valiant Linguist · languages/);
 const before=d;d=levelUpBuild(build,d);
 assert.equal(d.level,2);assert.equal(d.skills[27].lvl,2);
 assert.deepEqual(d.rulesBuild.input.racialChoices[YAGUDO_RANK_LANGUAGES],['language:Elvaan','language:Draconic','language:Celestial','language:Goblin']);
 const forged=structuredClone(d.rulesBuild.input);forged.racialChoices[YAGUDO_RANK_LANGUAGES][0]='language:Orc';
 assert.throws(()=>compileBuild(forged,d),/Previously chosen Yagudo/);
 const over=structuredClone(d.rulesBuild.input);over.racialChoices[YAGUDO_RANK_LANGUAGES].push('language:Giant');
 assert(issues(over).some(x=>/Valiant Linguist/.test(x)));
});

test('Yagudo replacing Valiant Linguist or Zealot Devotee removes only the targeted effects and picker',()=>{
 for(const alternate of ['magical-linguist','stability','sturdy-feathers']){
  const b=fixture();b.skillRanks[27]=1;b.skillRanks[25]=1;
  b.racialChoices[YAGUDO_RANK_LANGUAGES]=['language:Elvaan'];
  b.alternateIds=[b.raceId+':trait:'+alternate];
  const traits=raceTraits(b).traits;assert.deepEqual(raceTraits(b).errors,[]);
  assert(!traits.some(f=>f.id===b.raceId+':trait:valiant-linguist'));
  assert(!racialChoiceSpecs(race(),traits,b.level,b).some(s=>s.id===YAGUDO_RANK_LANGUAGES));
  assert(issues(b).some(x=>/Unknown or inactive racial choice/.test(x.message||x)));
  pruneRacialChoices(b,race(),traits);
  assert.equal(b.racialChoices[YAGUDO_RANK_LANGUAGES],undefined);
  assert.equal(bonus(b,27),0);
  assert.equal(bonus(b,25),alternate==='sturdy-feathers'?0:2);
 }
 const invalid=fixture();
 invalid.alternateIds=[invalid.raceId+':trait:magical-linguist',invalid.raceId+':trait:sturdy-feathers'];
 assert(raceTraits(invalid).errors.some(x=>/Two selections replace/.test(x)));
});
