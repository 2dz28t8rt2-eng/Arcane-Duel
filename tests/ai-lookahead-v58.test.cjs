'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const run=(s,timeout=120000)=>boot({seed:5809}).run(s,timeout);
test('lookahead remains off for every player game until explicitly enabled in test sandbox',()=>{
 const r=run("({on:ArcaneAiLookahead58.active(),learning:ArcaneAiLearning56.active(),depths:Object.values(ArcaneAiLookahead58.DEPTH)})");
 assert.equal(r.on,false);assert.equal(r.learning,false);
 assert.deepEqual(r.depths,[1,1,1,2,2,2,3,3,3,3]);
});
test('1–3-turn public board forecast changes with tier cap and depth',()=>{
 const r=run(`(()=>{const g=createGame({mode:'pve',opponentId:10,context:'tournament',seed:2219});g.active=1;g.aiPhase='summon';g.pending=null;g.summoned=false;
 const candidate=ArcaneAiLearning56.legalCandidates(g)[0],base=ArcaneAiLookahead58.STANDARD;
 return {candidates:ArcaneAiLearning56.legalCandidates(g).length,
  first:ArcaneAiLookahead58.forecast(g,candidate,{...base,depth:1}),
  third:ArcaneAiLookahead58.forecast(g,candidate,{...base,depth:3}),
  cardsKept:g.players[1].hand.length};})()`);
 assert.ok(r.candidates>0);assert.equal(r.first.depth,1);assert.equal(r.third.depth,3);
 assert.notEqual(r.first.total,r.third.total);
 assert.equal(r.cardsKept,5);
});
test('depth is capped for early tier even when training config requests 3',()=>{
 const r=run(`(()=>{const g=createGame({mode:'pve',opponentId:1,context:'tournament',seed:2219});g.active=1;g.aiPhase='summon';const c=ArcaneAiLearning56.legalCandidates(g)[0];return ArcaneAiLookahead58.forecast(g,c,{...ArcaneAiLookahead58.STANDARD,depth:3}).depth;})()`);
 assert.equal(r,1);
});
test('public-board forecast and ranking never touch hidden player cards or deck',()=>{
 const r=run(`(()=>{const g=createGame({mode:'pve',opponentId:9,context:'tournament',seed:2205});g.active=1;g.aiPhase='summon';
 Object.defineProperty(g.players[0],'hand',{get(){throw Error('CHEAT: human hand');}});
 Object.defineProperty(g.players[0],'deck',{get(){throw Error('CHEAT: human deck');}});
 ArcaneAiLearning56.setSandbox(ArcaneAiLearning56.PRESETS.alchemist,true);
 ArcaneAiLookahead58.setSandbox(ArcaneAiLookahead58.STANDARD,true);
 const a=ArcaneAiLookahead58.perspective(g),p=ArcaneAiLookahead58.plan(g);
 ArcaneAiLookahead58.setSandbox(null);ArcaneAiLearning56.setSandbox(null);
 return {plans:p.length,enemyCount:a.enemyCount,publicFields:typeof a.ownCount==='number'};})()`);
 assert.ok(r.plans>0);assert.equal(r.publicFields,true);
});
test('support planning offers only adjacent guardians and real soul drain targets',()=>{
 const r=run(`(()=>{const g=createGame({mode:'pve',opponentId:8,context:'tournament',seed:2230}),p=g.players[1],e=g.players[0];g.active=1;g.turn=8;g.aiPhase='attacks';g.pending=null;p.field.fill(null);e.field.fill(null);
 const guard=newInstance(g,p.originalDeck[0],1),soul=newInstance(g,p.originalDeck[1],1),target=newInstance(g,e.originalDeck[0],0);
 guard.roleOverride='guardian';guard.mode='def';guard.attacked=false;guard.switched=false;
 soul.roleOverride='soul';soul.mode='def';soul.attacked=false;soul.switched=false;soul.card.def=1;
 target.mode='atk';target.card.atk=900;p.field[0]=guard;p.field[1]=soul;e.field[4]=target;
 const a=ArcaneAiLookahead58.supportActions(g);
 p.field[0]=null;p.field[4]=guard;
 const b=ArcaneAiLookahead58.supportActions(g);
 return {nearHeal:a.filter(x=>x.kind==='heal').length,farHeal:b.filter(x=>x.kind==='heal').length,
  drain:b.filter(x=>x.kind==='drain').length};})()`);
 assert.ok(r.nearHeal>0);assert.equal(r.farHeal,0);assert.ok(r.drain>0);
});
test('invalid configs rejected, no production toggle and sandbox can be reset',()=>{
 const r=run(`(()=>{let invalid=0;for(const arg of [{...ArcaneAiLookahead58.STANDARD,depth:8},{...ArcaneAiLookahead58.STANDARD,board:-1},{}])try{ArcaneAiLookahead58.setSandbox(arg,true);}catch(e){invalid++;}
 const before=ArcaneAiLookahead58.active();ArcaneAiLookahead58.setSandbox(ArcaneAiLookahead58.STANDARD,true);
 const during=ArcaneAiLookahead58.active();ArcaneAiLookahead58.setSandbox(null);
 return {invalid,before,during,after:ArcaneAiLookahead58.active()};})()`);
 assert.deepEqual(r,{invalid:3,before:false,during:true,after:false});
});
test('real seeded tournament games complete for all 10 opponents with lookahead enabled',()=>{
 const r=run(`(()=>{const res=[];ArcaneAiLearning56.setSandbox(ArcaneAiLearning56.PRESETS.balanced,true);
 ArcaneAiLookahead58.setSandbox(ArcaneAiLookahead58.STANDARD,true);
 for(let tier=1;tier<=10;tier++){
  const g=createGame({mode:'pve',context:'tournament',opponentId:tier,seed:6500+tier});
  let error=null;
  try{simulateGame(g,'balanced','balanced');}catch(e){error=String(e);}
  res.push({tier,winner:g.winner,error,turns:g.turn});
 }
 ArcaneAiLookahead58.setSandbox(null);ArcaneAiLearning56.setSandbox(null);
 return res;})()`,180000);
 assert.equal(r.length,10);
 for(const item of r){assert.equal(item.error,null,'tier '+item.tier+': '+item.error);assert.ok([0,1].includes(item.winner));}
});
