import {renderHomeFeed} from '../features/home/feed.mjs';
export default {
  id:'home',title:'Home · Comos',bodyClass:'app',layout:'app',activeMain:'home',section:null,
  description:'Your Comos timeline.',
  content:`<div data-home-feed>${renderHomeFeed()}</div>`,
};