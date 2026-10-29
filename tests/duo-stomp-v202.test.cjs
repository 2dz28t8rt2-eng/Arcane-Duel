'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const rules=require('../assets/duo-shared-rules-v160.js');
const registry=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(registry.cards.map(c=>[c.id,c]));
const deck=registry.starterMain,fusions=registry.starterFusions;
const move=(g,seat,action)=>rules.apply(g,seat,action,{catalog});
function room(){
 const game=rules.create({roomId:'stomp-parity-123',chapter:1,entry:'new',catalog,
  hostName:'Hannes',hostDeck:deck,hostFusions:fusions,enemyDeckA:deck,
  enemyDeckB:deck,enemyFusionsA:fusions,enemyFusionsB:fusions});
 const joined=move(game,2,{type:'join',name:'Partner',deck,fusions});
 joined.round=3;return joined;
}
let uid=40000;
function creature(id,{atk=500,def=500,role='combatant',mode='atk',
 fusion=false,materialsUsed=2,...custom}={}){
 return {uid:uid++,id,atk,def,maxDef:def,level:catalog[id].level,role,mode,
  fusion,materialsUsed,used:false,placedRound:0,soul:0,condensed:0,
  decayGrace:1,...custom};
}
function shooter(g,materials=3,boost=0){g.players[0].field[0]=creature(9,{atk:1000,
 def:1200,role:'combatant',fusion:true,materialsUsed:materials,stompBonusPP:boost});}
function foe(g,seat,slot,options={}){g.players[seat].field[slot]=creature(4,
 {atk:400,def:3000,mode:'def',...options});}

test('three materials strike one adjacent target for 70%, with 3% ATK and DEF cost per hit',()=>{
 const g=room();shooter(g,3);foe(g,1,3);foe(g,1,4);foe(g,1,2);
 const after=move(g,0,{type:'attack',slot:0,targetSeat:1,targetSlot:3});
 assert.deepEqual(after.stompEvent.hits.map(x=>[x.seat,x.slot,x.pct]),[[1,4,70]]);
 assert.equal(after.players[1].field[4].def,2300);
 assert.equal(after.players[1].field[2].def,3000);
 assert.equal(after.players[0].field[0].atk,940);
 assert.equal(after.players[0].field[0].def,1128);
 assert.equal(after.players[0].field[0].stompDecayTotal,72);
 assert.equal(after.stompEvent.revision,after.revision);
});
test('four and five materials fan out across both enemy seven-slot boards without duplicates',()=>{
 for(const materials of [4,5]){
  const g=room();shooter(g,materials);foe(g,1,6);foe(g,1,5);
  foe(g,3,0);foe(g,3,1);foe(g,3,2);
  const after=move(g,0,{type:'attack',slot:0,targetSeat:1,targetSlot:6});
  const hits=after.stompEvent.hits;
  assert.deepEqual(hits.map(h=>[h.seat,h.slot,h.pct]),materials===4?
   [[3,0,50],[1,5,50]]:[[3,0,50],[1,5,50],[3,1,30]]);
  assert.equal(new Set(hits.map(h=>h.seat+':'+h.slot)).size,hits.length);
  assert.equal(after.players[0].field[0].atk,1000-30*(hits.length+1));
  assert.equal(after.players[0].field[0].def,1200-36*(hits.length+1));
 }
});
test('enemy side reverses preferred splash direction and never strikes its teammate',()=>{
 const g=room();g.activeSeat=1;g.players[1].field[0]=creature(9,
  {atk:1000,def:800,role:'combatant',fusion:true,materialsUsed:3});
 foe(g,0,3);foe(g,0,2);foe(g,0,4);foe(g,3,1);
 const after=move(g,1,{type:'attack',slot:0,targetSeat:0,targetSlot:3});
 assert.deepEqual(after.stompEvent.hits.map(x=>[x.seat,x.slot]),[[0,2]]);
 assert.equal(after.players[3].field[1].def,3000);
});
test('bonus pp increases each collateral strike but never the primary',()=>{
 const g=room();shooter(g,5,12);foe(g,1,3);foe(g,1,4);foe(g,1,2);foe(g,1,5);
 const after=move(g,0,{type:'attack',slot:0,targetSeat:1,targetSlot:3});
 assert.deepEqual(after.stompEvent.hits.map(h=>h.pct),[62,62,42]);
 assert.equal(after.players[1].field[3].def,2000);
 assert.equal(after.players[1].field[4].def,2380);
 assert.equal(after.players[1].field[2].def,2380);
 assert.equal(after.players[1].field[5].def,2580);
});
test('splash destroys weak ATK targets and damages DEF when it cannot destroy',()=>{
 const g=room();shooter(g,4);foe(g,1,3);
 foe(g,1,4,{atk:300,def:900,mode:'atk'});
 foe(g,1,2,{atk:900,def:900,mode:'atk'});
 const after=move(g,0,{type:'attack',slot:0,targetSeat:1,targetSlot:3});
 assert.equal(after.players[1].field[4],null);
 assert.equal(after.players[1].field[2].def,400);
 assert.equal(after.stompEvent.hits[0].destroyed,true);
 assert.equal(after.stompEvent.hits[1].destroyed,false);
});
test('DEF target armor and guard apply to collateral; defender counter is 40% of usual',()=>{
 const g=room();shooter(g,3);foe(g,1,3);
 foe(g,1,4,{atk:600,def:1000,role:'guardian'});
 const after=move(g,0,{type:'attack',slot:0,targetSeat:1,targetSlot:3});
 assert.equal(after.players[1].field[4].def,440); // 700 * 80%, unbound guardian
 assert.equal(after.stompEvent.hits[0].counter,120); // 600 * 50% * 40%
 assert.equal(after.teams[0].lp,g.teams[0].lp-120);
 const guarded=room();shooter(guarded,3);foe(guarded,1,3);
 foe(guarded,1,4,{atk:600,def:1000,role:'guardian',guardLeft:1});
 const blocked=move(guarded,0,{type:'attack',slot:0,targetSeat:1,targetSlot:3});
 assert.equal(blocked.players[1].field[4].def,1000);
 assert.equal(blocked.stompEvent.hits[0].counter,0);
});
test('old room fusions default to no splash and normal attack costs one 3% hit',()=>{
 const g=room();g.players[0].field[0]=creature(9,
  {atk:1000,def:1200,fusion:true,materialsUsed:undefined,stompBonusPP:undefined});
 const after=move(g,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null});
 assert.equal(after.stompEvent,null);
 assert.equal(after.players[0].field[0].atk,970);
 assert.equal(after.players[0].field[0].def,1164);
});
test('newly fused cards record material count, roles, server-rolled bonus and serialize in room view',()=>{
 const g=room();
 const ids=Object.values(catalog).filter(x=>x.playable&&!x.fusionOnly&&x.role==='combatant')
  .slice(0,5).map(x=>x.id);
 assert.equal(ids.length,5);
 g.players[0].hand=[...ids];
 const materials=ids.map((_,index)=>({from:'hand',index}));
 const options=rules.fusionOptions(g,0,materials,catalog);
 assert.ok(options.templates.length);
 const after=move(g,0,{type:'fusion',slot:0,materials,templateId:options.templates[0]});
 const card=after.players[0].field[0];
 assert.equal(card.materialsUsed,5);
 assert.equal(card.stompMaterials.combatant,5);
 assert.ok(card.stompBonusPP>=5&&card.stompBonusPP<=10);
 assert.equal(rules.stompBonus({stompBonusPP:18}),12);
 const restored=JSON.parse(JSON.stringify(rules.view(after,0))).players[0].field[0];
 assert.equal(restored.stompBonusPP,card.stompBonusPP);
 assert.equal(restored.materialsUsed,5);
});
test('server Edge reducer mirrors browser, client animation only accepts new authoritative events',()=>{
 assert.equal(fs.readFileSync(path.resolve(__dirname,'../supabase/functions/arcane-duo-v2/duo-rules.js'),'utf8'),
  fs.readFileSync(path.resolve(__dirname,'../assets/duo-shared-rules-v160.js'),'utf8'));
 const source=fs.readFileSync(path.resolve(__dirname,'../assets/duo-stomp-cinema-v202.js'),'utf8');
 const sandbox={window:{},document:{}};vm.runInNewContext(source,sandbox);
 const api=sandbox.window.ArcaneDuoStompCinema202;
 const g=room();shooter(g,3);foe(g,1,3);foe(g,1,4);
 const after=move(g,0,{type:'attack',slot:0,targetSeat:1,targetSlot:3});
 assert.equal(api.inspect(g,after).revision,after.revision);
 assert.equal(api.inspect(after,after),null);
 assert.equal(api.inspect(g,{...after,stompEvent:{...after.stompEvent,revision:1}}),null);
 assert.equal(api.inspect({...g,roomId:'other'},after),null);
 const html=fs.readFileSync(path.resolve(__dirname,'../duo-campaign-v2.html'),'utf8');
 assert.match(html,/duo-stomp-cinema-v202\.js/);
 assert.match(html,/duo-stomp-cinema-v202\.css/);
 const client=fs.readFileSync(path.resolve(__dirname,'../assets/duo-parity-v160.js'),'utf8');
 assert.match(client,/ArcaneDuoStompCinema202\?\.onState/);
});
