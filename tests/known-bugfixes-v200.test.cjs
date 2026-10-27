'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const rules=require('../assets/duo-shared-rules-v160.js');
const snapshot=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c]));

test('all three literal Allrounders count for neutral fusion resonance in 2v2',()=>{
 for(const id of [719,725,728]){
  const g=rules.create({roomId:'allrounder-alias-v200',hostName:'Test',
   hostDeck:snapshot.starterMain,hostFusions:snapshot.starterFusions,
   enemyDeckA:snapshot.starterMain,enemyDeckB:snapshot.starterMain,
   enemyFusionsA:snapshot.starterFusions,enemyFusionsB:snapshot.starterFusions,
   catalog,randomSeed:17});
  const p=g.players[0];
  p.hand=[id,4,5];
  const choice=rules.fusionOptions(g,0,[0,1,2].map(index=>({from:'hand',index})),catalog);
  assert.equal(catalog[id].role,'allrounder');
  assert.equal(choice.analysis.normalPct,4,`ID ${id} must provide 4% resonance`);
  assert.equal(choice.analysis.role,'predator',`ID ${id} must not dilute predator majority`);
  assert.ok(choice.analysis.quality>choice.analysis.baseQuality);
 }
});

test('free hand+field fusion performs the solo alpha challenge only if old leader survives',async()=>{
 const solo=fs.readFileSync(path.join(root,'assets/predator-showdown-solo-v199.js'),'utf8');
 const field=fs.readFileSync(path.join(root,'assets/arcane-role-fusions.js'),'utf8');
 for(const consumeLeader of [false,true]){
  const old={uid:10,id:1,fusion:true,card:{level:3,atk:1300,def:1000},
   predatorLeader:{bornUid:10,powers:['mark']}};
  const fodder={uid:12,id:2,card:{level:2,atk:200,def:190}};
  const hand={uid:13,id:4,card:{level:2,atk:240,def:100}};
  const king={uid:15,id:41,fusion:true,card:{level:4,atk:1600,def:900},
   predatorLeader:{bornUid:15,powers:['swarm']}};
  const g={mode:'pve',active:0,turn:7,players:[{
   hand:[hand],field:[old,fodder,null],graveyard:[],remainingFusion:[41]}],
   pending:{kind:'normal',card:hand},totalFusions:[0],selection:null,materials:[]};
  const handlers={},played=[];let choose;
  const row={addEventListener(type,listener){handlers.row=listener;},querySelectorAll(){return [];}};
  const stage={addEventListener(type,listener){handlers.stage=listener;},insertAdjacentHTML(){}};
  const fakeNode={querySelectorAll(){return [];}};
  const context={game:g,uiMode:'duel',busy:false,window:{
    ArcanePredatorShowdown199:{play:async event=>played.push('duel:'+event.outcome)}},
   CARDS:{41:{id:41,level:4}},
   $:id=>id==='ownRow'?row:id==='summonStage'?stage:fakeNode,
   dataOf:c=>({...c.card,name:'Monster',art:'monster.webp'}),
   isFateCard:()=>false,escapeHtml:x=>x,
   fusedInstance:()=>king,advanceTurn:()=>true,
   placePending:()=>null,onOwnSlot:async()=>null,applyAiAction:()=>null,
   render:()=>{},saveDuelSnapshot:()=>{},randomInt:()=>95,logEvent:()=>{},toast:()=>{},
   fusionOptions:()=>[{id:41}],chooseFusionModal:(lv,material,callback)=>{choose=callback;},
   fusionAnimation:async()=>played.push('fusion')};
  vm.runInNewContext(solo,context,{filename:'predator-showdown-solo-v199.js'});
  vm.runInNewContext(field,context,{filename:'arcane-role-fusions.js'});
  const stageClick=action=>handlers.stage({target:{closest:()=>({dataset:{fieldSynthesis:action}})},
   preventDefault(){},stopImmediatePropagation(){}});
  stageClick('toggle');
  handlers.row({target:{closest:()=>({dataset:{mine:String(consumeLeader?0:1)}})},
   preventDefault(){},stopImmediatePropagation(){}});
  stageClick('commit');
  assert.equal(typeof choose,'function');
  await choose(41);
  assert.equal(g.players[0].field[consumeLeader?0:1],king);
  assert.equal(played[0],'fusion','fusion animation must finish first');
  if(consumeLeader){
   assert.equal(g.predatorShowdown,undefined,'consumed predecessor cannot fight');
   assert.deepEqual(played,['fusion']);
  }else{
   assert.equal(g.predatorShowdown.outcome,'stalemate');
   assert.equal(g.predatorShowdown.presented,true);
   assert.deepEqual(played,['fusion','duel:stalemate']);
   assert.equal(old.predatorLeader,undefined);
  }
 }
});
