import test from 'node:test';import assert from 'node:assert/strict';
import {renderHomeDashboard} from '../src/features/home/dashboard.mjs';
test('home dashboard does not invent group membership or activity',()=>{
 const html=renderHomeDashboard();assert.match(html,/Worlds are not shown here yet/);assert.match(html,/server before showing any activity/);assert.doesNotMatch(html,/SAMPLE WORLD/);
});
test('fixture home is labeled and escapes untrusted strings',()=>{
 const html=renderHomeDashboard({worlds:[{name:'<img src=x onerror=alert(1)>',description:'<script>bad</script>'}],preview:true});
 assert.match(html,/Ghost preview/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>|<img src=x/);
});
test('home limits untrusted world previews to four',()=>{assert.equal((renderHomeDashboard({worlds:Array.from({length:20},(_,i)=>({name:`W${i}`}))}).match(/class="cosmos-world"/g)||[]).length,4);assert.throws(()=>renderHomeDashboard({worlds:null}),TypeError);});