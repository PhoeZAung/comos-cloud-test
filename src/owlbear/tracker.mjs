import {stateFrom} from './party-state.mjs';
// Party membership and pictures come exclusively from the site's shared roster.
export function trackerRows(metadata){return stateFrom(metadata)?.characters||[];}
