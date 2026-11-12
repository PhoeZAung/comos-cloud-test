// Explicit HP effect intent for abilities and spells.
// Legacy entries without a choice continue to work as plain dice rolls.
export const effectTypes=Object.freeze({
 none:'None (roll/use only)',
 damage:'Damage',
 heal:'Healing',
 temp_hp:'Temporary HP'
});
export const effectType=row=>Object.hasOwn(effectTypes,row?.effect_type)?row.effect_type:'none';
