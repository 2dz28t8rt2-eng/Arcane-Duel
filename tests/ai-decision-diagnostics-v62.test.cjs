'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const run=expr=>boot({seed:620113}).run(expr,120000);
test('decision audit is disabled for production games and rejects invalid bounds',()=>{
 const r=run(`(()=>{const g=createGame({mode:'pve',context:'tournament',opponentId:6,seed:6201});
  g.active=1;g.aiPhase='summon';
  const production=ArcaneAiBranches59.diagnose(g);
  let invalid=0;
  ArcaneAiBranches59.setSandbox(ArcaneAiBranches59.STANDARD,true,{guarded:true,margin:3});
  for(const n of [0,16,3.3,-1])try{ArcaneAiBranches59.diagnose(g,n);}catch(_){invalid++;}
  ArcaneAiBranches59.setSandbox(null);
  return {production,invalid,active:ArcaneAiBranches59.active()};})()`);
 assert.deepEqual(r.production,{available:false});assert.equal(r.invalid,4);assert.equal(r.active,false);
});
test('bounded audit uses own cards and public enemy field without reading secrets',()=>{
 const r=run(`(()=>{const g=createGame({mode:'pve',context:'tournament',opponentId:9,seed:6202});
  g.active=1;g.aiPhase='summon';g.pending=null;g.summoned=false;
  for(const k of ['hand','deck','originalDeck','fusionDeck','remainingFusion'])
   Object.defineProperty(g.players[0],k,{get(){throw Error('CHEAT: '+k);}});
  ArcaneAiLearning56.setSandbox(ArcaneAiLearning56.PRESETS.alchemist,true);
  ArcaneAiBranches59.setSandbox(ArcaneAiBranches59.STANDARD,true,{guarded:true,margin:3});
  const prev=JSON.stringify({hand:g.players[1].hand,field:g.players[0].field,turn:g.turn});
  const result=ArcaneAiBranches59.diagnose(g,6);
  const still=prev===JSON.stringify({hand:g.players[1].hand,field:g.players[0].field,turn:g.turn});
  ArcaneAiBranches59.setSandbox(null);ArcaneAiLearning56.setSandbox(null);
  return {result,still};})()`);
 assert.equal(r.result.available,true);assert.equal(r.still,true);
 assert.equal(r.result.tier,9);assert.ok(r.result.alternatives.length<=6);
 assert.ok(r.result.alternatives.every(c=>['normal','fusion'].includes(c.type)));
 assert.ok(r.result.alternatives.every(c=>c.materials.every(m=>m.id>=0&&m.level>=1)));
});
test('existing ACE preparation changes no cards quantities and never inspects opponent secret hand',()=>{
 const r=run(`(()=>{const rows=[];
 for(const tier of [3,6,9]){
  const g=createGame({mode:'pve',context:'tournament',opponentId:tier,seed:7200+tier});
  g.active=1;g.turn=30;g.aiPhase='summon';g.summoned=false;g.pending=null;g.arcaneAceCue=false;
  Object.defineProperty(g.players[0],'hand',{get(){throw Error('CHEAT opponent hand');}});
  Object.defineProperty(g.players[0],'deck',{get(){throw Error('CHEAT opponent deck');}});
  const p=g.players[1],before=p.deck.length;
  const ids=[...p.deck].sort((a,b)=>a-b).join(',');
  const one=ArcaneAiRevamp55.prepareAce(g);
  const two=ArcaneAiRevamp55.prepareAce(g);
  rows.push({tier,sameSize:before===p.deck.length,sameIds:ids===[...p.deck].sort((a,b)=>a-b).join(','),
   first:one,second:two,cued:!!g.arcaneAceCue});
 }return rows;})()`);
 assert.equal(r.length,3);assert.ok(r.every(x=>x.sameIds&&x.sameSize));
});
