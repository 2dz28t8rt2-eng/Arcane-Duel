'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const rules=require('../assets/duo-shared-rules-v160.js'),snapshot=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c])),deck=snapshot.starterMain,fusions=snapshot.starterFusions;
const move=(g,seat,action)=>rules.apply(g,seat,action,{catalog});
function setup(){
 let g=rules.create({roomId:'shared-client-tests',hostName:'Host',hostDeck:deck,hostFusions:fusions,enemyDeckA:deck,enemyDeckB:deck,enemyFusionsA:fusions,enemyFusionsB:fusions,chapter:1,entry:'new',catalog});
 g=move(g,2,{type:'join',name:'Partner',deck,fusions});g.groupReleased=true;g.personalDuoRules=true;return g;
}
test('original normal-monster and low-level fusion upgrades affect authoritative combat',()=>{
 const id=snapshot.cards.find(c=>c.playable&&!c.fusionOnly&&!c.essenceMonster&&!c.ace&&c.level===6).id;
 const g=setup();g.players[0].hand[0]=id;
 const base=move(g,0,{type:'summon',handIndex:0,slot:0}).players[0].field[0];
 g.players[0].upgrades.kolossenkraft=3;
 const boosted=move(g,0,{type:'summon',handIndex:0,slot:0}).players[0].field[0];
 assert.equal(boosted.atk,Math.round((base.atk+24)/10)*10);assert.equal(boosted.def,Math.round((base.def+24)/10)*10);
 const f=setup();f.players[0].hand=[0,1,2,3,4];
 const materials=[{from:'hand',index:0},{from:'hand',index:1}],templateId=rules.fusionOptions(f,0,materials,catalog).templates[0];
 const action={type:'fusion',materials,slot:0,templateId};
 const plain=move(f,0,action).players[0].field[0];f.players[0].upgrades.schwarminstinkt=3;
 const swarm=move(f,0,action).players[0].field[0];
 assert.equal(swarm.atk,Math.round(plain.atk*1.045/10)*10);assert.equal(swarm.def,Math.round(plain.def*1.045/10)*10);
});
test('teammates control field cards, never another private hand; attack metrics belong to the acting player',()=>{
 let g=setup();g.players[0].hand[0]=2;g=move(g,0,{type:'summon',handIndex:0,slot:0});
 g.activeSeat=2;g.turn=2;g.players[2].ownTurns=1;
 const id=g.players[0].field[0].id,hand=[...g.players[0].hand];
 const next=move(g,2,{type:'attack',slot:0,sourceSeat:0,targetSlot:null,targetSeat:null});
 assert.ok(next.teams[1].lp<g.teams[1].lp);assert.equal(next.players[0].field[0].used,true);
 assert.equal(next.players[2].soloMetrics.attacks,1);assert.deepEqual(next.players[0].hand,hand);
 assert.equal(next.lastStrike.sourceSeat,0);assert.equal(next.players[0].field[0].id,id);
 assert.throws(()=>move(g,2,{type:'summon',sourceSeat:0,handIndex:0,slot:1}),/Besitzer/);
 assert.throws(()=>move(g,2,{type:'attack',sourceSeat:1,slot:0}),/Besitzer/);
});
test('floating offers retain genuine or echo identity and echo summon does not consume the ordinary summon',()=>{
 let g=setup();Object.assign(g.players[0].lv1,{perk:true,rank:1,choices:[0],offers:[]});
 g=move(g,0,{type:'lv1Choose',index:0,kind:'echo'});g=move(g,0,{type:'lv1ClaimOffer',index:0});
 const index=g.players[0].hand.length-1;assert.equal(g.players[0].hand[index].lv1Echo,true);
 const view=rules.view(g,0,catalog);assert.equal(view.players[0].handFaces[index].lv1Echo,true);
 g=move(g,0,{type:'summon',handIndex:index,slot:0});assert.equal(g.players[0].summoned,false);assert.equal(g.players[0].field[0].lv1Effectless,true);
 g.players[0].lv1.choices=[0];g=move(g,0,{type:'lv1Choose',index:0,kind:'deck'});
 assert.equal(g.players[0].lv1.offers[0].echo,false);
 g=move(g,0,{type:'lv1UseOffer',index:0,slot:1});assert.equal(g.players[0].field[1].lv1Echo,false);
});
