export const themes={
 cosmic:{name:'Cosmic',colors:['#c9b7ff','#e7c88c']},
 ocean:{name:'Ocean',colors:['#69d7e8','#99b6ff']},
 ember:{name:'Ember',colors:['#ffbb87','#ef9cb6']},
 forest:{name:'Forest',colors:['#91d6ae','#e2d39c']}
};
export const defaults=Object.freeze({theme:'cosmic',splashCursor:false,effectColors:true,pauseStars:false});
export function normalizedPreferences(value={}) {
 return {theme:Object.hasOwn(themes,value.theme)?value.theme:'cosmic',splashCursor:value.splashCursor===true,effectColors:value.effectColors!==false,pauseStars:value.pauseStars===true};
}
export let preferences={...defaults};
export function applyPreferences(value) {
 preferences=normalizedPreferences(value);
 document.documentElement.dataset.theme=preferences.theme;
 document.dispatchEvent(new CustomEvent('comos:preferences',{detail:{...preferences}}));
 return preferences;
}
