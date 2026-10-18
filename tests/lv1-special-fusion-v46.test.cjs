'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const run=code=>boot().run("(()=>{profile=freshProfile();profile.lv1Saga.perk=true;game=createGame({mode:'pve',seed:727,opponentId:1,context:'free'});game.active=0;game.turn=5;game.players[0].field.fill(null);game.players[1].field.fill(null);"+code+"})()");
test('All three exclusive fusions require exactly 3 to 5 Level-1 materials',()=>{
 const r=run("const s=ArcaneLv1Swarm,id=RPG_BASE_CARDS.find(c=>c.level===1&&!c.fusionOnly&&!c.ace).id,x=RPG_BASE_CARDS.find(c=>c.level===2&&!c.fusionOnly).id;const make=(ids)=>ids.map(i=>newInstance(game,i,0));const result={};for(const n of [2,3,4,5]){const m=make(Array(n).fill(id));result[n]=['hive','protector','attacker'].map(k=>fusionOptions(game,m.map(c=>c.card.level),m).some(c=>c.id===s.ids[k]));}const mixed=make([id,id,x]);result.mixed=fusionOptions(game,mixed.map(c=>c.card.level),mixed).filter(c=>c.lv1Exclusive).length;const tagged=make([id,id,id]);tagged[2].lv1Ghost=true;result.ghost=fusionOptions(game,[1,1,1],tagged).filter(c=>c.lv1Exclusive).length;return result;");
 for(const n of [2,3,4,5])assert.deepEqual(r[n],Array(3).fill(n>=3));
 assert.equal(r.mixed,0);assert.equal(r.ghost,0);
});
test('Two Level-1 materials cannot forcibly create an exclusive fusion or consume a template',()=>{
 const r=run("const id=RPG_BASE_CARDS.find(c=>c.level===1&&!c.fusionOnly&&!c.ace).id,materials=Array.from({length:2},()=>newInstance(game,id,0)),target=ArcaneLv1Swarm.ids.hive;game.players[0].remainingFusion.push(target);const before=game.players[0].remainingFusion.filter(x=>x===target).length;game.fusionChoice=target;const fused=fusedInstance(game,materials,[1,1]);return {fused:!!fused,unspent:game.players[0].remainingFusion.filter(x=>x===target).length===before};");
 assert.deepEqual(r,{fused:false,unspent:true});
});
test('Three and five Level-1 materials can make any specialized fusion with its unique bonus',()=>{
 const r=run("const source=RPG_BASE_CARDS.find(c=>c.level===1&&!c.fusionOnly&&!c.ace).id,result=[];for(const n of [3,5])for(const key of ['hive','protector','attacker']){const target=ArcaneLv1Swarm.ids[key],materials=Array.from({length:n},()=>newInstance(game,source,0));game.players[0].remainingFusion.push(target);game.fusionChoice=target;const c=fusedInstance(game,materials,Array(n).fill(1));result.push({key,n,ok:c?.id===target,level:c?.card.level,bonus:c?.lv1Full!=null});}return result;");
 assert.ok(r.every(x=>x.ok&&x.level===1&&x.bonus));
});
