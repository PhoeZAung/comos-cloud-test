import {accountEditor} from '../account/view.mjs';
export default {id:'account',title:'Account · Comos',bodyClass:'app',layout:'app',activeMain:'account',section:null,content:'<section class="page-heading"><h1>Account</h1></section>'+accountEditor({fixture:true})};
