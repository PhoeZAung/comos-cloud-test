import {renderHomeFeed} from '../features/home/feed.mjs';
export default {
  id:'home',title:'Home · Cosmos',bodyClass:'app',layout:'app',activeMain:'home',section:null,
  description:'Your Cosmos timeline.',
  content:`<div data-home-feed>${renderHomeFeed()}</div>`,
};