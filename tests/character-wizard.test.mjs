import test from 'node:test';
import assert from 'node:assert/strict';
import {SOURCE_NAME,ALIGNMENTS,CLASS_NAMES,ARCHETYPES,defaultTraits,characterClasses,totalClassLevel} from '../src/features/characters/ffd20.mjs';
import {validateBio,validatePortrait,validateWizardFields,mergeWizardData} from '../backend/characters/editor-fields.mjs';
import {characterLevelSummary} from '../src/ui/character-view.mjs';
const portrait='data:image/jpeg;base64,'+Buffer.from('test img').toString('base64');

test('fixed source, alignment choices and bounded portrait',()=>{
 assert.equal(SOURCE_NAME,'FFD20');assert.equal(ALIGNMENTS.length,10);
 const identity=validateWizardFields('identity',{charName:'Vivi',alignment:'Chaotic Good',portrait});
 assert.equal(identity.charName,'Vivi');assert.equal(identity.source,'FFD20');assert.equal(identity.portrait,portrait);
 assert.throws(()=>validatePortrait('data:image/svg+xml;base64,PHN2Zz4='),/JPEG, PNG, or WebP/);
 assert.throws(()=>validateWizardFields('identity',{charName:'A',alignment:'Oops',portrait:''}),/alignment/);
 assert.throws(()=>validateWizardFields('identity',{charName:'A',alignment:'Lawful Good',portrait:'A'.repeat(160001)}),/portrait/);
});

test('FFD20 race standard trait presets start on; alternate switches persist',()=>{
 assert.ok(defaultTraits('Hume').length>=9);
 assert.ok(defaultTraits('Hume').every(trait=>trait.enabled));
 const fields=validateWizardFields('race',{race:'Hume',standardRacialTraits:[{name:'Skilled',enabled:false}],alternateRacialTraits:[{name:'Awareness',enabled:false}]});
 assert.equal(fields.alternateRacialTraits[0].enabled,false);
 assert.equal(fields.standardRacialTraits[0].enabled,false);
 assert.throws(()=>validateWizardFields('race',{race:'Hume',standardRacialTraits:[{name:'Skilled',enabled:true},{name:'skilled',enabled:true}],alternateRacialTraits:[]}),/Duplicate/);
 assert.deepEqual(defaultTraits('Aegyl'),[]); // Unverified race traits are not invented.
});

test('multiclass preserves per-class archetypes and total level, rejects impossible combinations',()=>{
 assert.ok(CLASS_NAMES.includes('Black Mage'));assert.ok(ARCHETYPES['Black Mage'].includes('Cryomancer'));
 const old={hp_curr:17,inventory:[{name:'Potion'}],group_tags:['Party'],class:'Black Mage',level:3,classes:[{name:'Black Mage',level:3,archetype:'',classFeatures:['Fire']}]};
 const values={classes:[{name:'Black Mage',level:3,archetype:'Cryomancer'},{name:'Warrior',level:2,archetype:''}]};
 const next=mergeWizardData(old,'class',values);
 assert.equal(next.level,5);assert.equal(next.total_level,5);assert.equal(next.class_level,3);
 assert.equal(next.classes[1].name,'Warrior');assert.equal(next.hp_curr,17);
 assert.deepEqual(next.classes[0].classFeatures,['Fire']);
 assert.deepEqual(next.inventory,old.inventory);
 const summary=characterLevelSummary(next);
 assert.deepEqual(summary.classes.map(x=>x.name+' '+x.level),['Black Mage 3','Warrior 2']);assert.equal(summary.totalLevel,5);
 assert.equal(totalClassLevel(characterClasses(old)),3);
 assert.throws(()=>validateWizardFields('class',{classes:[{name:'Mage',level:20,archetype:''},{name:'Warrior',level:1,archetype:''}]}),/Total level/);
 assert.throws(()=>validateWizardFields('class',{classes:[{name:'Mage',level:1},{name:'mage',level:2}]}),/different classes/);
});

test('merge is non-destructive and validates all editor input',()=>{
 const original={charName:'Old',spellbook:[{spell:'Fire'}],hp_curr:7};
 const name=mergeWizardData(original,'identity',{charName:'New',alignment:'Lawful Neutral',portrait:''});
 assert.equal(name.spellbook[0].spell,'Fire');assert.equal(name.charName,'New');assert.equal(original.charName,'Old');
 assert.throws(()=>validateWizardFields('race',{race:'Hume',standardRacialTraits:[],alternateRacialTraits:[],admin:true}),/Invalid wizard fields/);
 assert.throws(()=>validateWizardFields('identity',{charName:'A\u0000',alignment:'Lawful Good',portrait:''}),/Invalid character name/);
});

import {renderRace,renderClass,renderIdentity,renderSheet} from '../src/ui/character-view.mjs';
test('identity, race, multiclass and sheet produce requested minimal control layout',()=>{
 const identity=renderIdentity({}, {name:'Vivi',portrait:'',alignment:'Lawful Good'});
 assert.match(identity,/>FFD20</);assert.match(identity,/Character picture/);
 assert.match(identity,/option value="Lawful Good" selected/);
 const race=renderRace({}, {id:'x',race:'Hume',standard:defaultTraits('Hume'),alternate:[{name:'Awareness',enabled:false}]});
 assert.match(race,/Standard racial traits/);assert.match(race,/Alternate racial traits/);
 assert.match(race,/data-trait-kind="alternate" data-trait-index="0" ><span>Awareness/);
 assert.match(race,/data-trait-kind="standard" data-trait-index="0" checked/);
 const classes=[{name:'Black Mage',level:3,archetype:'Cryomancer'},{name:'Warrior',level:2,archetype:''}];
 const html=renderClass({}, {id:'x',classes});
 assert.match(html,/Class 1/);assert.match(html,/Class 2/);
 assert.match(html,/data-remove-class="1"/);assert.match(html,/\+ Multiclass/);
 assert.match(html,/data-total-level>5/);assert.match(html,/Cryomancer/);
 const sheet=renderSheet({id:'123e4567-e89b-42d3-a456-426614174000',name:'Vivi',data:{classes,race:'Hume'}},'sheet');
 assert.match(sheet,/Total level/);assert.match(sheet,/Class 1 Lv/);
 assert.match(sheet,/Black Mage 3/);assert.match(sheet,/Warrior 2/);
});
test('Identity bio saves paragraphs and stays optional for older characters',()=>{
 const bio='A quiet mage from the coast.\nShe collects forgotten spells.';
 const next=mergeWizardData({bio:'Older story',hp_curr:17,items:[{name:'Staff'}]},'identity',{charName:'Vivi',alignment:'Neutral Good',portrait:'',bio});
 assert.equal(next.bio,bio);
 assert.equal(next.hp_curr,17);
 assert.deepEqual(next.items,[{name:'Staff'}]);
 assert.equal(validateWizardFields('identity',{charName:'Vivi',alignment:'',portrait:''}).bio,undefined);
 assert.equal(mergeWizardData({bio:'Keep me'},'identity',{charName:'Vivi',alignment:'',portrait:''}).bio,'Keep me');
 assert.equal(validateBio(' First line\r\nSecond line '),'First line\nSecond line');
 assert.throws(()=>validateBio('x'.repeat(2001)),/Bio must/);
 assert.throws(()=>validateBio('unsafe'+String.fromCharCode(0)),/Bio must/);
});
test('Bio is below Alignment in Identity and safely escaped',()=>{
 const html=renderIdentity({}, {name:'Vivi',portrait:'',alignment:'Lawful Good',bio:'A <mage> & scholar'});
 assert.ok(html.indexOf('<span>Alignment</span>')<html.indexOf('<span>Bio <small>optional</small></span>'));
 assert.match(html,/name="bio" rows="5" maxlength="2000"/);
 assert.match(html,/A &lt;mage&gt; &amp; scholar/);
 assert.doesNotMatch(html,/A <mage>/);
});

test('wizard headings show progress beside Identity, Race and Class',()=>{
 const id=renderIdentity({}, {name:'Vivi',portrait:'',alignment:'',bio:''});
 const race=renderRace({}, {race:'Hume',standard:defaultTraits('Hume'),alternate:[]});
 const cls=renderClass({}, {classes:[{name:'Black Mage',level:1,archetype:''}]});
 assert.match(id,/<h1>Identity <span class="cw-step-count">\(1\/3\)<\/span><\/h1>/);
 assert.match(race,/<h1>Race <span class="cw-step-count">\(2\/3\)<\/span><\/h1>/);
 assert.match(cls,/<h1>Class <span class="cw-step-count">\(3\/3\)<\/span><\/h1>/);
});
