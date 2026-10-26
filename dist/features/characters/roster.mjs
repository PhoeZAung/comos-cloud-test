// Lightweight 3D coverflow inspired by the Dark-Grasp character carousel.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const validCharacterImage=url=>typeof url==='string'&&url.length<160000&&/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/]+={0,2}$/i.test(url);
const bioExcerpt=value=>{
 if(typeof value!=='string')return '';
 const clean=value.replace(/\s+/gu,' ').trim();
 const visible=Array.from(clean);
 return visible.length>140?visible.slice(0,139).join('').trimEnd()+'…':clean;
};
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
      (bioExcerpt(character.bio)?'<p class="cc-bio">'+esc(bioExcerpt(character.bio))+'</p>':'')+
      '</div></button>'+
      (!id.startsWith('fixture:')?'<div class="cc-panel-actions"><a class="button primary" href="sheet.html?characterId='+encodeURIComponent(id)+'">Open sheet</a><a class="button" href="create-identity.html?characterId='+encodeURIComponent(id)+'">Edit</a></div>':
       '<div class="cc-panel-actions"><span class="cc-preview-note">Preview character</span></div>')+
      '</article>';
}

const listIcon='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" stroke-width="3"/></svg>';
const cardsIcon='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="10" height="13" rx="2"/><path d="M9 4h8a2 2 0 0 1 2 2v11"/><path d="M14 2h6a2 2 0 0 1 2 2v11"/></svg>';
const externalIcon='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9"/><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"/></svg>';
const editIcon='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4Z"/></svg>';
function listRow(character) {
  const name=esc(character.name||'Unnamed character');
  const id=String(character.id||'');
  const fixture=id.startsWith('fixture:');
  const target=encodeURIComponent(id);
  const level=Number(character.level);
  const meta=[Number.isFinite(level)&&level>0?'Level '+level:null,character.race,character.className].filter(Boolean).map(esc).join(' · ');
  const tags=Array.isArray(character.tags)?character.tags.filter(t=>typeof t==='string').slice(0,5):[];
  const portrait=validCharacterImage(character.portraitUrl)?'<img class="cc-character-image" src="'+esc(character.portraitUrl)+'" alt="">':silhouette;
  return '<article class="cc-list-row">'+
    '<div class="cc-list-portrait" aria-hidden="true">'+portrait+'</div>'+
    '<div class="cc-list-info">'+
      (fixture?'<strong class="cc-list-name">'+name+'</strong>':'<a class="cc-list-name" href="sheet.html?characterId='+target+'">'+name+'</a>')+
      (meta?'<p class="cc-list-meta">'+meta+'</p>':'')+
      (tags.length?'<div class="cc-list-tags">'+tags.map(t=>'<span>'+esc(t)+'</span>').join('')+'</div>':'')+
    '</div>'+
    (fixture?'':'<div class="cc-list-actions">'+
      '<a class="cc-list-action" href="sheet.html?characterId='+target+'" aria-label="Open sheet for '+name+'" title="Open character sheet">'+externalIcon+'</a>'+
      '<a class="cc-list-action" href="create-identity.html?characterId='+target+'" aria-label="Edit '+name+'" title="Edit character">'+editIcon+'</a>'+
    '</div>')+
  '</article>';
}
export function renderCharacterRoster({characters=[],selected=0,view='carousel',loading=false,error='',message='',nextCursor=null,preview=false}={}){
  if(!Array.isArray(characters))throw new TypeError('Character roster must be an array.');
  const total=characters.length,active=total?((selected%total)+total)%total:0,asList=view==='list';
  const toggleLabel=asList?'Show rotating cards':'Show list view';
  return '<div class="cc-roster">'+
    '<div class="cc-toolbar"><button type="button" class="cc-view-toggle" data-character-view="'+(asList?'carousel':'list')+'" aria-label="'+toggleLabel+'" title="'+toggleLabel+'">'+(asList?cardsIcon:listIcon)+'</button></div>'+
    '<p class="cc-status" role="status" data-character-status>'+esc(error||message||(loading?'Loading characters…':''))+'</p>'+
    (total?
      (asList?'<section class="cc-list" aria-label="Your characters">'+characters.map(listRow).join('')+'</section>':
        '<section class="cc-carousel" aria-label="Rotating characters">'+
          '<div class="cc-stage" data-character-stage tabindex="0" aria-label="Character carousel. Use left and right arrow keys to rotate.">'+
            characters.map((c,i)=>card(c,i,active,total)).join('')+'</div>'+
          '<div class="cc-navigation"><button class="cc-arrow" type="button" data-rotate-character="-1" aria-label="Previous character" '+(total<2?'disabled':'')+'>‹</button><span aria-live="polite" data-active-position>'+(active+1)+' / '+total+'</span><button class="cc-arrow" type="button" data-rotate-character="1" aria-label="Next character" '+(total<2?'disabled':'')+'>›</button></div></section>'):
      '<div class="cc-empty"><div class="cc-empty-emblem" aria-hidden="true">✧</div><p>'+esc(loading?'Loading characters…':error?'Unable to load characters.':'No characters yet.')+'</p><small>Use Create character to add your first.</small></div>')+
    (nextCursor?'<div class="cc-more"><button class="button" type="button" data-load-characters>Load more characters</button></div>':'')+
    '</div>';
}
