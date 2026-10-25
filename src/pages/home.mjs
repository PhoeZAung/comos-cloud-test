import {renderHomeDashboard} from '../features/home/dashboard.mjs';
export default {
  id:'home', title:'Home · Comos', bodyClass:'app', layout:'app', activeMain:'home', section:null,
  description:'Explore your worlds, characters and stories in Comos.',
  content:`<div data-home-dashboard>${renderHomeDashboard()}</div>`,
};