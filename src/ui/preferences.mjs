import {validDiceTheme} from '../features/dice-themes.mjs';
import {normalizeDiceOptions,diceOptionDefaults} from '../features/dice-options.mjs';
import {themes} from '../features/site-themes.mjs';
export {themes};
export const defaults=Object.freeze({theme:'cosmic',splashCursor:false,effectColors:true,pauseStars:false,notesElectricBorder:true,laserFlow:false,discordRollStats:true,dicePopup:true,diceTheme:'classic',diceOptions:diceOptionDefaults});
export function normalizedPreferences(value={}) {
 return {theme:Object.hasOwn(themes,value.theme)?value.theme:'cosmic',splashCursor:value.splashCursor===true,effectColors:value.effectColors!==false,pauseStars:value.pauseStars===true,notesElectricBorder:value.notesElectricBorder!==false,laserFlow:value.laserFlow===true,discordRollStats:value.discordRollStats!==false,dicePopup:value.dicePopup!==false,diceTheme:validDiceTheme(value.diceTheme)?value.diceTheme:'classic',diceOptions:normalizeDiceOptions(value.diceOptions)};
}
export let preferences={...defaults};
export function applyPreferences(value) {
 preferences=normalizedPreferences(value);
 document.documentElement.dataset.theme=preferences.theme;
  document.documentElement.dataset.notesElectric=String(preferences.notesElectricBorder);
 document.dispatchEvent(new CustomEvent('comos:preferences',{detail:{...preferences}}));
 return preferences;
}
