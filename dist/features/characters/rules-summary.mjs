// Checked against the Black Mage class table and MP System, 2026-10-26.
// Deliberately small: the focused sheet never imports the wizard catalogs.
export const blackMageMp=[3,4,5,6,8,11,15,20,26,32,39,47,56,65,75,86,98,110,122,135];
const bonusRows=[
 [0,0,0,0,0,0,0,0,0],[1,1,1,1,1,1,1,1,1],[1,3,3,3,3,3,3,3,3],
 [1,3,6,6,6,6,6,6,6],[1,3,6,10,10,10,10,10,10],[2,4,7,11,16,16,16,16,16],
 [2,6,9,13,18,24,24,24,24],[2,6,12,16,21,27,34,34,34],[2,6,12,20,25,31,38,46,46],
 [3,7,13,21,31,37,44,52,61],[3,9,15,23,33,45,52,60,69],[3,9,18,26,36,48,62,70,79],
 [3,9,18,30,40,52,66,82,91],[4,10,19,31,46,58,72,88,106],[4,12,21,33,48,66,80,96,114],
 [4,12,24,36,51,69,90,106,124],[4,12,24,40,55,73,94,118,136],[5,13,25,41,61,79,100,124,151]
];
export function bonusMp(score,spellLevel){
 if(!Number.isInteger(score)||score<10)return 0;
 if(score>45)throw Error('Bonus MP above ability score 45 needs a verified table extension.');
 if(!Number.isInteger(spellLevel)||spellLevel<1||spellLevel>9)throw Error('Invalid spell level.');
 return bonusRows[Math.floor((score-10)/2)][spellLevel-1];
}
export function blackMageSummary(level,intScore){
 if(!Number.isInteger(level)||level<1||level>20)throw Error('Black Mage level must be 1–20.');
 const spellLevel=Math.min(9,Math.ceil(level/2));
 const baseMp=blackMageMp[level-1],extraMp=bonusMp(intScore,spellLevel);
 return {bab:Math.floor(level/2),fort:Math.floor(level/3),ref:Math.floor(level/3),will:2+Math.floor(level/2),baseMp,bonusMp:extraMp,mp:baseMp+extraMp,spellLevel,skillPerLevel:Math.max(1,4+Math.floor((intScore-10)/2))};
}
