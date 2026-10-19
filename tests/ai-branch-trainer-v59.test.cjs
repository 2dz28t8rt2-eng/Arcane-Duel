'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const run=(code,timeout=120000)=>boot({seed:59049}).run(code,timeout);
test('engine branch module is opt-in and cannot rewrite live game saves',()=>{
 const x=run('({active:ArcaneAiBranches59.active(),prior:ArcaneAiLookahead58.active(),learn:ArcaneAiLearning56.active()})');
 assert.deepEqual(x,{active:false,prior:false,learn:false});
});
test('public simulator strips human hand/deck, preserves visible fields and own cards',()=>{
 const x=run(`(()=>{const g=createGame({mode:'pve',context:'tournament',opponentId:8,seed:5918});
  const old=JSON.stringify({turn:g.turn,own:g.players[1].hand,field:g.players[0].field,deck:g.players[0].deck});
  const mask=ArcaneAiBranches59.publicState(g);
  return {hidden:mask.players[0].hand.length,deck:mask.players[0].deck.length,
   humanGrave:mask.players[0].graveyard.length,ownHand:mask.players[1].hand.length,
   same:old===JSON.stringify({turn:g.turn,own:g.players[1].hand,field:g.players[0].field,deck:g.players[0].deck}),
   separate:mask.players[0].field!==g.players[0].field};})()`);
 assert.equal(x.hidden,0);assert.equal(x.deck,0);assert.equal(x.humanGrave,0);
 assert.ok(x.ownHand>0);assert.equal(x.same,true);assert.equal(x.separate,true);
});
test('public branch does not access hidden player hand, deck or original deck',()=>{
 const x=run(`(()=>{const g=createGame({mode:'pve',context:'tournament',opponentId:9,seed:5915});
  g.active=1;g.aiPhase='summon';g.summoned=false;g.pending=null;
  for(const key of ['hand','deck','originalDeck','fusionDeck'])Object.defineProperty(g.players[0],key,
   {get(){throw Error('CHEAT hidden: '+key)}});
  ArcaneAiLearning56.setSandbox(ArcaneAiLearning56.PRESETS.balanced,true);
  const list=ArcaneAiLearning56.rank(g),chosen=ArcaneAiBranches59.branch(g,list[0]);
  ArcaneAiLearning56.setSandbox(null);
  return {options:list.length,has:!!chosen,score:chosen?.score,phase:g.aiPhase};})()`);
 assert.ok(x.options>0);assert.equal(x.has,true);assert.ok(Number.isFinite(x.score));
 assert.equal(x.phase,'summon');
});
test('simulated legal normal summon changes cloned field, never live duel',()=>{
 const x=run(`(()=>{const g=createGame({mode:'pve',context:'tournament',opponentId:5,seed:5925});
  g.active=1;g.aiPhase='summon';g.pending=null;g.summoned=false;
  ArcaneAiLearning56.setSandbox(ArcaneAiLearning56.PRESETS.balanced,true);
  const action=ArcaneAiLearning56.rank(g).find(c=>c.action.type==='normal');
  const current=g.players[1].field.filter(Boolean).length;
  const evaluated=ArcaneAiBranches59.branch(g,action);
  const clone=ArcaneAiBranches59.publicState(g);
  const applied=applyAiAction(clone,action.action);
  const placed=applyAiAction(clone,{type:'place',idx:2});
  ArcaneAiLearning56.setSandbox(null);
  return {before:current,after:g.players[1].field.filter(Boolean).length,
    copy:clone.players[1].field.filter(Boolean).length,applied:!!applied,placed:!!placed,
    valid:!!evaluated,slot:evaluated?.slot};})()`);
 assert.equal(x.before,x.after);assert.equal(x.applied,true);assert.equal(x.placed,true);
 assert.ok(x.copy>x.before);assert.equal(x.valid,true);assert.ok(Number.isInteger(x.slot));
});
test('illegal actions are rejected by real game engine and not promoted',()=>{
 const x=run(`(()=>{const g=createGame({mode:'pve',context:'tournament',opponentId:6,seed:5916});
  g.active=1;g.aiPhase='summon';
  const invalid=ArcaneAiBranches59.branch(g,{action:{type:'normal',uid:999999},
    template:CARDS[0]});return invalid;})()`);
 assert.equal(x,null);
});
test('sandbox chooses valid first steps for every opponent and preserves player game',()=>{
 const x=run(`(()=>{const rows=[];ArcaneAiLearning56.setSandbox(ArcaneAiLearning56.PRESETS.balanced,true);
  ArcaneAiBranches59.setSandbox(ArcaneAiBranches59.STANDARD,true);
  for(let tier=1;tier<=10;tier++){
   const g=createGame({mode:'pve',context:'tournament',opponentId:tier,seed:59000+tier});
   let error=null;try{simulateGame(g,'balanced','balanced');}catch(e){error=String(e);}
   rows.push({tier,error,winner:g.winner});}
  ArcaneAiBranches59.setSandbox(null);ArcaneAiLearning56.setSandbox(null);
  return {rows,active:ArcaneAiBranches59.active(),stats:ArcaneAiBranches59.stats()};})()`,240000);
 for(const t of x.rows){assert.equal(t.error,null,'tier '+t.tier+' '+t.error);assert.ok([0,1].includes(t.winner))}
 assert.equal(x.active,false);assert.ok(x.stats.evaluated>0);
});
