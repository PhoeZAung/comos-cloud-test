export const abilityCollections=['activeAbilities','passiveAbilities','racialAbilities','feats'];
export function abilityGroup(data,row,collection){
 return abilityCollections.includes(collection)&&row?.abilityGroupId?(data.abilityGroups||[]).find(g=>g.id===row.abilityGroupId&&g.collection===collection)||null:null;
}
