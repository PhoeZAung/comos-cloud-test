// FFd20 official race index: https://finalfantasyd20.com/races/
// Keep classification separate from rule definitions; it only filters the wizard UI.
export const raceCategories=[
 {id:'core',name:'Core'},
 {id:'base',name:'Base'},
 {id:'beastman',name:'Beastman'},
 {id:'monstrous',name:'Monstrous'}
];
const CORE=new Set('dwarf elvaan galka half-breed hume mithra moogle tarutaru'.split(' '));
const BEASTMAN=new Set('amaljaa antica forgiven gnath goblin ixal kindred kobold kojin lamia loporrit matanga namazu orc qiqirn quadav sahagin sylph trollkin vanu-vanu velkk yagudo'.split(' '));
const MONSTROUS=new Set('half-gigas lizardman syricta'.split(' '));
export function raceCategoryFor(raceId){
 const slug=String(raceId||'').replace(/^ffd20:race:/,'');
 if(!slug)return '';
 if(CORE.has(slug))return 'core';
 if(BEASTMAN.has(slug))return 'beastman';
 if(MONSTROUS.has(slug))return 'monstrous';
 return 'base';
}
export function racesInCategory(races,category){
 return races.filter(r=>category&&raceCategoryFor(r.id)===category);
}
