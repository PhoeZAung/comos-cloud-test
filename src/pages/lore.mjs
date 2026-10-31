import {renderLoreLibrary} from '../features/lore/library.mjs';
export default {
 id:'lore', title:'Lore · Cosmos',bodyClass:'app',layout:'app',activeMain:'lore',section:null,
 description:'Browse Cosmos lore using search and your character tags.',
 content:`<div data-lore-library>${renderLoreLibrary()}</div>`,
};