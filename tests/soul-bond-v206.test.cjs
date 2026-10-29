'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const rules=require('../assets/duo-shared-rules-v160.js');
const registry=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(registry.cards.map(c=>[c.id,c]));
const deck=registry.starterMain,fusions=registry.starterFusions;
function room(){
 const waiting=rules.create({roomId:'soulbond-v206',catalog,hostName:'Host',hostDeck:deck,hostFusions:fusions,
  enemyDeckA:deck,enemyDeckB:deck,enemyFusionsA:fusions,enemyFusionsB:fusions});
 const g=rules.apply(waiting,2,{type:'join',name:'Partner',deck,fusions},{catalog});
 g.round=4;g.turn=12;g.activeSeat=0;return g;
}
const card=(uid,role,mode='def')=>({uid,id:9,role,mode,atk:1000,def:10000,maxDef:10000,level:5,
 fusion:false,placedRound:0,used:false,switched:false,decayGrace:2,soul:0,condensed:0,guardLeft:0});
const hit=(g,slot=0)=>rules.apply(g,0,{type:'attack',slot,targetSeat:1,targetSlot:0},{catalog});
test('one-to-one adjacent matching never stacks and stays inside a seven-card seat',()=>{
 const p={field:[card(1,'guardian'),card(2,'soul'),card(3,'guardian'),null,
  card(4,'soul'),card(5,'guardian'),null]};
 assert.deepEqual(rules.soulBonds(p).map(x=>[x.guardianIndex,x.soulIndex]),[[0,1],[5,4]]);
 p.field[1]=null;
 assert.deepEqual(rules.soulBonds(p).map(x=>[x.guardianIndex,x.soulIndex]),[[5,4]]);
});
test('solo Defender armor 20%, linked defender 35%, extra damage gives 25% essence',()=>{
 const one=room();one.players[0].field[0]=card(101,'combatant','atk');
 one.players[1].field[0]=card(201,'guardian');
 const unlinked=hit(one);assert.equal(unlinked.players[1].field[0].def,9200);
 const two=room();two.players[0].field[0]=card(101,'combatant','atk');
 two.players[1].field[0]=card(201,'guardian');two.players[1].field[1]=card(202,'soul');
 const linked=hit(two);
 assert.equal(linked.players[1].field[0].def,9350);
 assert.equal(linked.players[1].field[1].soul,37);
 assert.equal(linked.players[1].field[1].bondChargeUsed,37);
 assert.equal(linked.players[1].field[1].bondChargeRound,4);
 assert.equal(rules.view(linked,0).players[1].field[1].soul,37);
});
test('energy from linked guard is capped at fifty per round, preserved in the room snapshot',()=>{
 let g=room();
 for(let i=0;i<3;i++)g.players[0].field[i]=card(101+i,'combatant','atk');
 g.players[1].field[0]=card(201,'guardian');g.players[1].field[1]=card(202,'soul');
 for(let i=0;i<3;i++)g=hit(g,i);
 assert.equal(g.players[1].field[1].bondChargeUsed,50);
 assert.equal(g.players[1].field[1].soul,50);
 assert.equal(JSON.parse(JSON.stringify(g)).players[1].field[1].bondChargeUsed,50);
});
test('live combat is byte-identical on the client and Supabase Edge',()=>{
 const r=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
 assert.equal(r('assets/duo-shared-rules-v160.js'),r('supabase/functions/arcane-duo-v2/duo-rules.js'));
 for(const needle of ['soul-bond-v206.js','soul-bond-v206.css'])
  assert.ok(r('index.html').includes(needle));
 assert.ok(r('duo-campaign-v2.html').includes('duo-soul-bond-v206.js'));
 assert.match(r('assets/handbook-human-v180.js'),/26 · Seelenbund/);
 assert.match(r('assets/soul-bond-v206.css'),/prefers-reduced-motion/);
 assert.match(r('assets/duo-ux-v204.js'),/ArcaneDuoSoulBond206\?\.inspect/);
});
