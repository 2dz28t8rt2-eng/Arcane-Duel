'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const expected=[180,270,420,630,810,1030,1270,1530,1830,2150];
test('Approved level 1–10 curve applies to actual workshop budget',()=>{
 const got=boot().run('Array.from({length:10},(_,i)=>workshopBudget(i+1))');
 assert.deepEqual(got,expected);
});
test('Active ordinary Lv5–10 cards use approved budget with individual role split',()=>{
 const r=boot().run('('+function(){
  const round10=n=>Math.round(n/10)*10;
   const pool=RPG_BASE_CARDS.filter(c=>!c.retired&&!c.fusionOnly&&!c.ace&&!c.essenceMonster&&c.level>=5&&c.level<=10);
  return {count:pool.length,wrong:pool.filter(c=>c.atk+c.def!==(c.role==='guardian'?round10(workshopBudget(c.level)*.95):workshopBudget(c.level))).map(c=>c.id),
    weak:pool.filter(c=>c.atk<80||c.def<80).map(c=>c.id)};
 }.toString()+')()');
 assert.ok(r.count>100,'All currently active high-level normal cards need checking');
 assert.deepEqual(r.wrong,[]);assert.deepEqual(r.weak,[]);
});
test('Fusion ties become neutral resonators and stronger with survived rounds',()=>{
 const r=boot().run('('+function(){
  profile=freshProfile();game=createGame({mode:'pve',opponentId:2,context:'free',seed:9317});game.active=0;
  const predator=CARDS.find(c=>!c.retired&&!c.fusionOnly&&c.role==='predator'&&c.level<=4);
  const guardian=CARDS.find(c=>!c.retired&&!c.fusionOnly&&c.role==='guardian'&&c.level<=4);
  if(!predator||!guardian)throw Error('Missing role fixture');
  const a=newInstance(game,predator.id,0),b=newInstance(game,guardian.id,0);
  const lv=[dataOf(a).level,dataOf(b).level];
  const chosen=fusionOptions(game,lv,[a,b]).find(x=>x.level===2);
  if(!chosen)throw Error('No legal Lv2 fusion');
  game.fusionChoice=chosen.id;game.players[0].remainingFusion=[chosen.id];
  const fused=fusedInstance(game,[a,b],lv);
  if(!fused)throw Error('Fusion rejected');
  game.players[0].field[0]=fused;fused.resonance=2;
  return {inheritance:window.ArcaneRoleFusion.inheritance([a,b]),actual:fused.roleOverride,
    qualityBonus:window.ArcaneAllrounder.evaluate(game,[fused]).resonatorBonus,
    weights:fused.rollMath.roleWeights,templateRole:chosen.role,saved:validateDuelSnapshot(JSON.parse(JSON.stringify(game))).players[0].field[0].roleOverride};
 }.toString()+')()');
 assert.equal(r.inheritance,'resonator');assert.equal(r.actual,'resonator');
 assert.equal(r.qualityBonus,30);assert.deepEqual(r.weights,{atk:1,def:1});
 assert.equal(r.saved,'resonator');
});
test('New high-tier PvE duels remain save compatible',()=>{
 const r=boot().run('('+function(){
  const g=createGame({mode:'pve',opponentId:8,context:'free',seed:9451});
  const snap=validateDuelSnapshot(JSON.parse(JSON.stringify(g)));
  return {players:snap.players.length,turn:snap.turn};
 }.toString()+')()');
 assert.equal(r.players,2);assert.ok(r.turn>=1);
});