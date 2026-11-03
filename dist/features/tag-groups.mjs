const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function groupTags(tags){
 return [['world','World'],['party','Party'],['system','']].map(([kind,name])=>({kind,name,tags:tags.filter(tag=>(tag.kind||'party')===kind)})).filter(group=>group.tags.length);
}
export function tagChoices(tags,{selected=[],attribute='data-lore-tag',name=''}={}){
 return groupTags(tags).map(group=>'<section class="tag-choice-group">'+(group.name?'<h3>'+group.name+'</h3>':'')+'<div class="tag-group-options">'+group.tags.map(tag=>'<label class="tag-choice"><input type="checkbox" '+attribute+(name?' name="'+esc(name)+'"':'')+' value="'+esc(tag.id)+'" '+(selected.includes(tag.id)?'checked':'')+'><span>'+esc(tag.name)+'</span></label>').join('')+'</div></section>').join('')||'<p>No tags.</p>';
}
