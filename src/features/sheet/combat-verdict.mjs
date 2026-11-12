// Human-readable combat outcome, only after the recorded dice roll is resolved.
// This does not estimate target HP, AC, or override the server's final verdict.
const reasonOf=(value)=>String(value||'').trim().toLowerCase();
export function combatVerdict(roll){
 const combat=roll?.combat;
 if(!combat?.target)return null;
 const reason=reasonOf(combat.reason||combat.outcome);
 if(reason.includes('miss'))return {label:'MISS',tone:'miss',detail:'No HP lost on a missed attack'};
 if(reason.includes('spell failed'))return {label:'SPELL FAILED',tone:'miss',detail:'Spell did not take effect'};
 if(reason.includes('resist'))return {label:'RESISTED',tone:'resisted',detail:'Spell resistance prevented the effect'};
 if(reason.includes('negat'))return {label:'SAVED',tone:'resisted',detail:'Successful save negated the effect'};
 if(combat.pending)return {label:reason.includes('hit')?'HIT · GM REVIEW':'AWAITING GM',tone:'pending',detail:'HP has not been changed yet'};
 if(combat.note&&combat.applied!==true)return {label:reason.includes('hit')?'HIT · REVIEW':'NOT APPLIED',tone:'pending',detail:'Automatic HP update was not completed'};
 if(roll.kind==='weapon'||roll.attack){
  if(combat.hit===true||reason.includes('hit'))return {label:'HIT',tone:'hit',detail:'Attack connected'+(combat.applied&&Number(combat.amount)===0?' · no effective HP change':'')};
  if(combat.hit===false)return {label:'MISS',tone:'miss',detail:'No HP lost on a missed attack'};
 }
 if(combat.applied===true)return {label:combat.kind==='heal'?'HEALED':combat.kind==='temp_hp'?'TEMP HP':'APPLIED',tone:'hit',detail:'Combat effect resolved'};
 return {label:'ROLLED',tone:'pending',detail:'Target result not yet verified'};
}
export function combatEventVerdict(event){
 if(!event||event.kind==='end')return null;
 const reason=reasonOf(event.reason);
 if(reason.includes('miss')||event.hit===false&&!reason.includes('resist')&&!reason.includes('negat'))return 'MISS';
 if(reason.includes('resist'))return 'RESISTED';
 if(reason.includes('negat'))return 'SAVED';
 if(event.source==='weapon'||event.source==='spell'||event.source==='ability'){
  if(event.kind==='damage'&&event.hit===true)return 'HIT';
  if(event.kind==='heal')return 'HEALED';
  if(event.kind==='temp_hp')return 'TEMP HP';
 }
 return 'APPLIED';
}
