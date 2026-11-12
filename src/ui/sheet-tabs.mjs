import {escape} from '../features/sheet/view.mjs';

const viewKeys=['section','ability','combatView','itemView','itemTag','spellLevel','notesTab','lastFightSection'];
export function sheetTabURL(current,id,view={}){
 const url=new URL(current);
 url.searchParams.set('characterId',id);
 for(const key of viewKeys)url.searchParams.delete(key);
 for(const key of viewKeys)if(view[key]!==undefined)url.searchParams.set(key,view[key]);
 if(!view.section)url.searchParams.set('section','overview');
 return url;
}

export function createSheetTabs(){
 const sheets=new Map(),views=new Map();
 return {
  add(character){sheets.set(character.id,character.name);},
  has:id=>sheets.has(id),
  remember(id,view){views.set(id,{...view});},
  view:id=>views.get(id),
  close(id,active){
   if(sheets.size<=1||!sheets.has(id))return active;
   const keys=[...sheets.keys()],index=keys.indexOf(id);
   sheets.delete(id);
   return id===active?(keys[index-1]??keys[index+1]):active;
  },
  render(active){
   const close=sheets.size>1;
   return '<nav class="cs-sheet-tabs" aria-label="Open character sheets"><div class="cs-sheet-tab-list">'+[...sheets].map(([id,name])=>
    '<div class="cs-sheet-tab'+(id===active?' is-active':'')+'"><button type="button" data-switch-sheet="'+escape(id)+'"'+(id===active?' aria-current="page"':'')+' title="'+escape(name)+'">'+escape(name)+'</button>'+
    (close?'<button type="button" class="cs-sheet-tab-close" data-close-sheet="'+escape(id)+'" aria-label="Close '+escape(name)+'">×</button>':'')+'</div>'
   ).join('')+'</div><button class="cs-icon cs-sheet-tab-add" type="button" data-add-sheet aria-label="Open another character sheet" title="Open another character sheet">+</button></nav>';
  }
 };
}
