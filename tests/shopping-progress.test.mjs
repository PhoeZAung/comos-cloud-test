import test from 'node:test';
import assert from 'node:assert/strict';
import {computeProgress,normalizeName,recordSystem,fraction} from '../scripts/shopping-progress.mjs';

const base=()=>({schemaVersion:'cosmos.shopping-review-queue.v1',sourceAudit:{
 siteCategoriesTotal:99,ffd20Categories:26,aonCategories:73,ffd20PagesAttempted:24,ffd20PagesWithRows:19,ffd20RowsParsedOrIndexed:746
},candidates:[{id:'ffd20:unique',name:'Unique Sword',sourceSystem:'ffd20',
 sourceUrl:'https://finalfantasyd20.com/equipment/weapons/',reviewState:'pending',
 masterJsonState:'not_added',productionState:'unverified'}]});
const master={items:[{name:'Unique Sword',sourceSystem:'ffd20',sourceUrl:'https://www.finalfantasyd20.com/equipment/weapons/'}]};
const manifest={count:1,version:'legacy'};

test('report counts staged versus integrated and live separately',()=>{
 const p=computeProgress(base(),master,manifest);
 assert.equal(p.candidatePipeline.reviewJsonStaged.percent,100);
 assert.equal(p.candidatePipeline.approvedForImport.percent,0);
 assert.equal(p.candidatePipeline.masterJsonIntegrated.percent,0);
 assert.equal(p.candidatePipeline.verifiedLiveOnQnap.percent,0);
 assert.equal(p.comparisonWithCurrentRepoMaster.sameSource,1);
 assert.equal(p.sourcePages.yieldingRowsPercent,73.1);
 assert.equal(p.sourcePages.attemptedPercent,92.3);
});
test('review queue cannot falsely declare an item integrated when absent from catalog',()=>{
 const queue=base();queue.candidates[0].masterJsonState='added';
 assert.throws(()=>computeProgress(queue,{items:[{name:'Different',sourceSystem:'ffd20'}]},manifest),/Catalog marked added/);
});
test('a live claim requires a verified QNAP receipt, browser test and integrated catalog',()=>{
 const q=base();q.candidates[0].masterJsonState='added';q.candidates[0].reviewState='approved';
 q.candidates[0].productionState='verified';
 assert.throws(()=>computeProgress(q,master,manifest),/Production verified without QNAP/);
 q.candidates[0].productionEvidence={qnapCommitSha:'a'.repeat(40),browserCheckedAt:'2026-11-14T08:00:00Z'};
 assert.equal(computeProgress(q,master,manifest).candidatePipeline.verifiedLiveOnQnap.percent,100);
});
test('source normalizer retains distinct names but ignores host www',()=>{
 assert.equal(normalizeName('Sorcery Ring'),normalizeName('Sorcery-ring'));
 assert.equal(recordSystem({sourceUrl:'https://www.aonprd.com/MagicPotions.aspx'}),'pathfinder');
 assert.equal(recordSystem({sourceSystem:'ffd20'}),'ffd20');
 assert.equal(fraction(0,87),0);
});
