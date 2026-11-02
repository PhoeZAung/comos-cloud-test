export const diceThemes=[
 {id:'classic',name:'Cosmos Classic',description:'Original dice result popup',color:'#c9b7ff'},
 {id:'default',texture:'/assets/dice-box/themes/default/diffuse-light.png',name:'Classic 3D',description:'Numbered polyhedral dice',color:'#ad94ef'},
 {id:'blueGreenMetal',texture:'/assets/dice-box/themes/blueGreenMetal/diffuse.jpg',name:'Blue Green Metal',description:'Iridescent metallic finish',color:'#4dcfc0'},
 {id:'diceOfRolling',texture:'/assets/dice-box/themes/diceOfRolling/diffuse.jpg',name:'Dice of Rolling',description:'Bold, colour-coded dice',color:'#e26a51'},
 {id:'gemstone',texture:'/assets/dice-box/themes/gemstone/gemstone-light.png',name:'Gemstone',description:'Polished crystal facets',color:'#9c78e5'},
 {id:'gemstoneMarble',texture:'/assets/dice-box/themes/gemstoneMarble/diffuse.jpg',name:'Rainbow Marble',description:'Swirled gemstone colours',color:'#e095ce'},
 {id:'rock',texture:'/assets/dice-box/themes/rock/diffuse-light.png',name:'Rock',description:'Rough stone texture',color:'#8f9b9b'},
 {id:'rust',texture:'/assets/dice-box/themes/rust/diffuse-light.png',name:'Rust',description:'Weathered metal texture',color:'#c38658'},
 {id:'smooth',texture:'/assets/dice-box/themes/smooth/diffuse-light.png',name:'Smooth',description:'Clean rounded edges',color:'#7ea6e9'},
 {id:'wooden',texture:'/assets/dice-box/themes/wooden/diffuse.jpg',name:'Wooden',description:'Warm natural wood grain',color:'#bb894d'},
 {id:'default-extras',texture:'/assets/dice-box/themes/default-extras/light.png',name:'Classic Extras',description:'Classic dice with specialty shapes',color:'#ad94ef'},
 {id:'diceOfRolling-fate',texture:'/assets/dice-box/themes/diceOfRolling-fate/diffuse.jpg',name:'Dice of Rolling · Fate',description:'Numbered set with Fate dice',color:'#df824f'},
 {id:'smooth-pip',texture:'/assets/dice-box/themes/smooth-pip/pips-light.png',name:'Smooth Pips',description:'Six-sided dice with real pips',color:'#7ea6e9'},
 {id:'genesys',texture:'/assets/dice-box/themes/genesys/diffuse.png',name:'Genesys',description:'Symbol-dice preview · numbered rolls use Classic 3D',color:'#e3c66e',engineTheme:'default'}
];
export const validDiceTheme=id=>diceThemes.some(theme=>theme.id===id);
export function resultDice(result){
 const attack=result.kind==='weapon'?result:result.attack;
 const parts=attack?[attack,result.damage,result.critical?.confirmation]:result.damage?[result.damage]:[result];
 return parts.filter(Boolean).flatMap(part=>(part.breakdown||[]).flatMap(term=>{
  const sides=Number(/d(\d+)$/.exec(term.dice||'')?.[1]);
  return [4,6,8,10,12,20,100].includes(sides)?(term.rolls||[]).map(value=>({qty:1,sides,data:{targetValue:value}})):[];
 })).slice(0,40);
}
