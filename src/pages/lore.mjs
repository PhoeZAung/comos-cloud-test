import {renderLoreLibrary} from '../features/lore/library.mjs';
export default {
 id:'lore', title:'Lore · Comos',bodyClass:'app',layout:'app',activeMain:'lore',section:null,
 description:'Browse lore from your Comos worlds and campaigns.',
 content:`<div data-lore-library>${renderLoreLibrary()}</div>`,
};