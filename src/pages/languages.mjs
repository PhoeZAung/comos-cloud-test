import {ffd20LanguageGroups,ffd20LanguageNames,FFD20_LANGUAGE_SOURCE} from '../features/characters/rules/languages.mjs';
const escape=word=>String(word).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export default {
 id:'languages',title:'FFd20 Languages · Comos',bodyClass:'app',layout:'app',activeMain:'languages',section:null,
 description:'Complete reference to FFd20 languages from the official Linguistics tables.',
 content:'<section class="page-heading"><h1>FFd20 Languages</h1><p>'+ffd20LanguageNames.length+' distinct languages from the official FFd20 Linguistics tables, plus Common where granted by race. These are reference entries, not automatic eligibility for every race.</p><p>High-Intelligence bonus-language choices follow your selected race and final Intelligence modifier. Languages learned through Linguistics or other traits are separate.</p><p>Official FFd20 Linguistics source: finalfantasyd20.com/skills/ · <a href="create-race.html">Character wizard</a></p></section>'+
 ffd20LanguageGroups.map(group=>'<section class="rw-panel"><h2>'+escape(group.name)+'</h2><div class="rw-language-list">'+group.entries.map(([name,speakers])=>'<p><strong>'+escape(name)+'</strong> — '+escape(speakers)+'</p>').join('')+'</div></section>').join('')+
 '<p class="field-help">The official FFd20 list is used in addition to Pathfinder languages, which are not included in these FFd20-specific tables. Some races may select languages beyond this reference if their individual racial rules allow it.</p>'
};
