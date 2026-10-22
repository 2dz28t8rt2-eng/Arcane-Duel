'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
function scenario(n){
 profile=freshProfile();profile.guideSeen=true;
 const g=createGame({mode:'pve',context:'free',seed:1492002,starter:0,
  strategicTraining:{enabled:true,noAttackTurns:n,disableArenaLPDecay:true}});
 const ids={
  soul:CARDS.find(c=>c.role==='soul'&&!c.fusionOnly&&c.level>=3)?.id,
  predator:CARDS.find(c=>c.role==='predator'&&!c.fusionOnly&&c.level>=3)?.id};
 if(Object.values(ids).some(x=>!Number.isInteger(x)))throw Error('Real role card unavailable');
 const sample=newInstance(g,ids.predator,0);
 sample.mode='atk';g.players[0].field=[sample,null,null,null,null];
 const attacks=[];
 for(const turn of [1,2,4,6,8,10,11,12]){
  g.turn=turn;g.active=turn%2?0:1;sample.attacked=false;
  attacks.push({turn,allowed:canAttack(g,sample)});
 }
 g.turn=21;const before=g.players.map(p=>p.lp);
 settleRound(g);const after=g.players.map(p=>p.lp);
 function soul(turn){
  const x=createGame({mode:'pve',context:'free',seed:1492002,starter:0,
   strategicTraining:{enabled:true,noAttackTurns:n,disableArenaLPDecay:true}});
  x.fateUsed=[true,true];x.turn=turn;x.active=1;x.winner=null;x.pending=null;
  const eater=newInstance(x,ids.soul,0),victim=newInstance(x,ids.predator,1);
  eater.mode='def';victim.mode='atk';
  x.players[0].field=[eater,null,null,null,null];
  x.players[1].field=[victim,null,null,null,null];
  const stats=victim.card.atk+victim.card.def,lp=x.players[1].lp;
  advanceTurn(x);
  return {oldTurn:turn,newTurn:x.turn,energy:eater.essenceCombat?.soul||0,
   enemyLPDamage:lp-x.players[1].lp,statsLost:stats-victim.card.atk-victim.card.def};
 }
 return {mode:g.strategicTraining,attacks,before,after,
  locked:soul(Math.max(2,n-2)),unlocked:soul(Math.max(6,n)),
  normal:createGame({mode:'pve',context:'free',seed:1492002}).strategicTraining||null,
  pvp:createGame({mode:'pvp',seed:1492002,
   strategicTraining:{enabled:true,noAttackTurns:10,disableArenaLPDecay:true}}).strategicTraining||null};
}
function run(n){return boot({seed:1492002}).run('('+scenario.toString()+')('+n+')');}
test('research mode opt-in only, with no arena LP decay',()=>{
 const r=run(10);assert.equal(r.normal,null);assert.equal(r.pvp,null);
 assert.equal(r.mode.noAttackTurns,10);assert.equal(r.mode.soulUnlockTurn,11);
 assert.deepEqual(r.before,r.after);
});
test('all six stages gate normal attacks while first-turn attack rule remains',()=>{
 for(const n of [0,2,4,6,8,10]){
  const r=run(n);assert.equal(r.mode.soulUnlockTurn,Math.max(7,n+1));
  for(const row of r.attacks)
   assert.equal(row.allowed,row.turn>n&&row.turn!==1,JSON.stringify({n,row}));
 }
});
test('soul offensive pressure never bypasses the opening freeze',()=>{
 for(const n of [6,10]){
  const r=run(n);
  assert.equal(r.locked.energy,0,JSON.stringify({n,locked:r.locked}));
  assert.equal(r.locked.enemyLPDamage,0);
  assert.ok(r.unlocked.energy>0,JSON.stringify({n,unlocked:r.unlocked}));
  assert.ok(r.unlocked.statsLost>r.locked.statsLost);
 }
});
