'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const rules=require('../assets/duo-shared-rules-v160.js');
const snapshot=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c]));
const deck=snapshot.starterMain,fusions=snapshot.starterFusions;
const opts={catalog};
const action=(state,seat,a)=>rules.apply(state,seat,a,opts);
const live=(id,uid,extra={})=>({id,uid,level:catalog[id].level,
  atk:catalog[id].atk,def:catalog[id].def,role:catalog[id].role,
  fusion:false,mode:'atk',used:false,switched:false,placedRound:0,
  soul:0,condensed:0,soulCooldown:0,raidCooldown:0,condenseLeft:0,
  condenseSlice:0,drainPreference:0,lastSoulAction:-1,lastDrainSwitch:-1,
  decaySkipOwnTurn:-1,decayGrace:0,maxDef:catalog[id].def,resonance:0,...extra});
const setup=()=>{
 const init=rules.create({roomId:'fullboard114',hostName:'Host',hostDeck:deck,hostFusions:fusions,
  enemyDeckA:deck,enemyDeckB:deck,enemyFusionsA:fusions,enemyFusionsB:fusions,catalog,randomSeed:114});
 return action(init,2,{type:'join',name:'Gast',deck,fusions});
};
const id=deck.find(id=>catalog[id]?.level===1);
function full(state){
 for(let i=0;i<7;i++){
  const owner=i%2===0?0:2;
  state.players[owner].field[i]=live(id,8600+i);
 }
 state.players[0].summoned=false;state.activeSeat=0;
 return state;
}

test('enemy Soul passive fires at BEGINNING of its next turn, never its ending',()=>{
 const start=setup();start.players[1].field[0]=live(7,9777,{soul:100,mode:'atk'});
 const lp=start.teams[0].lp;
 const next=action(start,0,{type:'end'});
 assert.equal(next.activeSeat,1);
 assert.equal(next.players[1].field[0].soul,68,'32% stored-soul decay must occur at turn start');
 assert.equal(next.teams[0].lp,lp-11,'35% of decayed stored soul hits opposing team');
 assert.ok(next.log.some(line=>line.includes('Seelenzerfall zum Zugbeginn')));
 const ending=action(next,1,{type:'end'});
 assert.equal(ending.players[1].field[0].soul,68,'no second passive on end of the same turn');
 assert.equal(ending.teams[0].lp,next.teams[0].lp);
});

test('seven occupied team zones: hand monster can replace partner monster without losing partner profile',()=>{
 let g=full(setup());
 const partnerBefore=g.players[2].field[5],handId=g.players[0].hand[0];
 assert.throws(()=>action(g,0,{type:'summon',slot:5,handIndex:0}),/Feldplatz/);
 const after=action(g,0,{type:'replace',slot:5,handIndex:0});
 assert.equal(after.players[2].field[5],null);
 assert.equal(after.players[2].graveyard.at(-1).uid,partnerBefore.uid);
 assert.equal(after.players[0].field[5].id,typeof handId==='number'?handId:handId.id);
 assert.equal(rules.teamField(after,after.players[0]).filter(Boolean).length,7);
 assert.equal(g.players[2].field[5].uid,partnerBefore.uid,'no mutation of prior revision');
 assert.ok(rules.view(after,2).players[0].hand.every(x=>x===null), 'hidden host hand stays private');
});

test('full board fusion from hand requires explicit replacement and correctly credits prior owner',()=>{
 const g=full(setup());
 g.players[0].hand[0]=id;g.players[0].hand[1]=id;
 const materials=[{from:'hand',index:0},{from:'hand',index:1}];
 const templates=rules.fusionOptions(g,0,materials,catalog).templates;
 assert.ok(templates.length,'hand material pair must have a fusion copy');
 const old=g.players[2].field[5];
 const cmd={type:'fusion',materials,slot:5,templateId:templates[0]};
 assert.throws(()=>action(g,0,cmd),/Fusions-Zielfeld/);
 const next=action(g,0,{...cmd,replaceTarget:true});
 assert.equal(next.players[2].field[5],null);
 assert.equal(next.players[2].graveyard.at(-1).uid,old.uid);
 assert.equal(next.players[0].field[5].id,templates[0]);
 assert.equal(rules.teamField(next,next.players[0]).filter(Boolean).length,7);
 assert.equal(next.players[0].hand.length,g.players[0].hand.length-2);
});

test('full board field fusion can consume partner material without an additional replacement',()=>{
 const g=full(setup());g.players[0].hand[0]=id;
 const materials=[{from:'hand',index:0},{from:'allyField',index:5}];
 const templates=rules.fusionOptions(g,0,materials,catalog).templates;
 assert.ok(templates.length);
 const old=g.players[2].field[5];
 const next=action(g,0,{type:'fusion',materials,slot:5,templateId:templates[0]});
 assert.equal(next.players[2].field[5],null);
 assert.equal(next.players[2].graveyard.filter(x=>x.id===old.id&&x.from==='fusion').length,1);
 assert.equal(next.players[0].field[5].id,templates[0]);
 assert.equal(rules.teamField(next,next.players[0]).filter(Boolean).length,7);
});

test('inactive-player field inspection is available for both sides, while actual actions stay turn-restricted',()=>{
 const core=fs.readFileSync(path.join(__dirname,'../assets/game.js'),'utf8');
 const online=fs.readFileSync(path.join(__dirname,'../assets/online-battle-v230.js'),'utf8');
 assert.match(core,/busy\|\|!humanTurn&&\(!game\.online230\|\|!c\)/);
 assert.match(online,/if\(game\.active!==0&&!busy&&!playing\)/);
 assert.match(online,/game\.selection=\{type:'field',idx:index\};game\.materials=\[\]/);
 assert.match(online,/game\.players\[0\]\?\.field\[index\]/);
 const state=setup();
 assert.throws(()=>action(state,2,{type:'summon',handIndex:0,slot:0}),/Zug/);
 assert.throws(()=>action(state,2,{type:'fusion',materials:[{from:'hand',index:0},{from:'hand',index:1}],slot:0,templateId:fusions[0]}),/Zug/);
});

test('client and authoritative server role rules remain identical',()=>{
 const solo=fs.readFileSync(path.join(__dirname,'../assets/duo-shared-rules-v160.js'),'utf8');
 const edge=fs.readFileSync(path.join(__dirname,'../supabase/functions/arcane-duo-v2/duo-rules.js'),'utf8');
 assert.equal(solo,edge);
});
