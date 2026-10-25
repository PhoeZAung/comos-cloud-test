// Lightweight 3D coverflow inspired by the Dark-Grasp character carousel.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const validCharacterImage=url=>typeof url==='string'&&url.length<160000&&/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/]+={0,2}$/i.test(url);
const silhouette='<svg viewBox="0 0 100 120" class="cc-default-portrait" role="img" aria-label="Default character portrait" fill="none"><circle cx="50" cy="35" r="20" fill="currentColor" opacity=".74"/><path d="M11 114v-11c0-24 18-42 39-42s39 18 39 42v11" fill="currentColor" opacity=".60"/><path d="M26 26c4-18 17-25 26-24 15 1 27 12 26 29-7-9-20-10-25-20-4 14-18 16-27 15Z" fill="currentColor" opacity=".9"/></svg>';
function card(character,index,selected,total){
  const forward=(index-selected+total)%total,backward=(selected-index+total)%total;
  const position=index===selected?'is-current':backward===1?'is-prev':forward===1?'is-next':'is-offstage';
  const isCurrent=index===selected;
  const tags=Array.isArray(character.tags)?character.tags.filter(t=>typeof t==='string').slice(0,5):[];
  const name=String(character.name||'Unnamed character');
  const id=String(character.id||'');
  const level=Number(character.level);
  const meta=[Number.isFinite(level)&&level>0?'Level '+level:null,character.race,character.className].filter(Boolean).map(v=>esc(v)).join(' · ');
  const photo=validCharacterImage(character.portraitUrl)?'<img class="cc-character-image" src="'+esc(character.portraitUrl)+'" alt="">':silhouette;
  return '<article class="cc-panel '+position+'" data-card-index="'+index+'" '+(!isCurrent&&position==='is-offstage'?'inert aria-hidden="true"':'')+'>'+
    '<button type="button" class="cc-card-select" data-select-character="'+index+'" aria-label="'+(isCurrent?'Selected character: ':'Select character: ')+esc(name)+'" '+(isCurrent?'aria-current="true"':'')+'>'+
      '<div class="cc-portrait">'+photo+'</div>'+
      '<div class="cc-panel-copy"><h2>'+esc(name)+'</h2><p class="cc-metadata">'+(meta||'Character')+'</p>'+
      '<div class="cc-tags">'+(tags.length?tags.map(t=>'<span>'+esc(t)+'</span>').join(''):'<span class="cc-untagged">No tags yet</span>')+'</div>'+
      '<p class="cc-bio">'+(character.bio?esc(String(character.bio).slice(0,140)):'Bio space reserved for later')+'</p>'+
      '</div></button>'+
      (!id.startsWith('fixture:')?'<div class="cc-panel-actions"><a class="button primary" href="sheet.html?characterId='+encodeURIComponent(id)+'">Open sheet</a><a class="button" href="create-source.html?characterId='+encodeURIComponent(id)+'">Edit</a></div>':
       '<div class="cc-panel-actions"><span class="cc-preview-note">Preview character</span></div>')+
      '</article>';
}
export function renderCharacterRoster({characters=[],selected=0,loading=false,error='',message='',nextCursor=null,preview=false}={}){
  if(!Array.isArray(characters))throw new TypeError('Character roster must be an array.');
  const total=characters.length,active=total?((selected%total)+total)%total:0;
  return '<div class="cc-roster">'+
    '<div class="cc-toolbar"><div><h2>Character collection</h2><p>'+ (preview?'Sample preview · no saved data':total+' saved character'+(total===1?'':'s'))+'</p></div>'+
      '<div class="cc-toolbar-actions"><button type="button" class="button" data-import-character>Import character</button>'+
      '<input type="file" accept=".json,application/json" data-character-file hidden aria-label="Choose a character JSON file"></div></div>'+
    '<p class="cc-status" role="status" data-character-status>'+esc(error||message||(loading?'Loading characters…':''))+'</p>'+
    (total?'<section class="cc-carousel" aria-label="Rotating character collection">'+
      '<div class="cc-stage" data-character-stage tabindex="0" aria-label="Character carousel. Use left and right arrow keys to rotate.">'+
      characters.map((c,i)=>card(c,i,active,total)).join('')+'</div>'+
      '<div class="cc-navigation"><button class="cc-arrow" type="button" data-rotate-character="-1" aria-label="Previous character" '+(total<2?'disabled':'')+'>‹</button><span aria-live="polite" data-active-position>'+(active+1)+' / '+total+'</span><button class="cc-arrow" type="button" data-rotate-character="1" aria-label="Next character" '+(total<2?'disabled':'')+'>›</button></div></section>':
      '<div class="cc-empty"><div class="cc-empty-emblem" aria-hidden="true">✧</div><p>'+esc(loading?'Loading your collection…':error?'Unable to load your collection.':'No characters in your collection yet.')+'</p><small>Create a character or import an existing JSON character to begin.</small></div>')+
      (nextCursor?'<div class="cc-more"><button class="button" type="button" data-load-characters>Load more characters</button></div>':'')+
      '</div>';
}
