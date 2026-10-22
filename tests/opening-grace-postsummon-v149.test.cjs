'use strict';
/* v14.9: Turn-one decay grace and mandatory fresh board information after summon.
 * All tests execute the real browser rules in the isolated GitHub CI VM.
 * The grace switch is opt-in; production createGame() remains unchanged.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
function experiment(starter,grace){
 const vm=boot({seed:149001});
 return vm.run(`(()=>{
  profile=freshProfile();profile.guideSeen=true;
  for(const k of Object.keys(profile.upgrades||{}))profile.upgrades[k]=0;
  const g=createGame({id:'opening-grace',mode:'pve',context:'free',
   opponentId:0,seed:149001,starter:${starter},openingDecayGrace:${grace}});
  g.fateUsed=[true,true];g.players.forEach(p=>{p.shield=0;p.power=1;p.enhancements={};p.flatBonus=0;});
  const normal=RPG_BASE_CARDS.find(c=>c.level===3&&!c.fusionOnly&&!c.ace);
  if(!normal)throw Error('No ordinary level 3 card in live catalogue');
  const summon=(owner,turn,slot)=>{
    const card=newInstance(g,normal.id,owner);
    card.summonedTurn=turn;card.decayClass='normal';card.decayTotal=0;
    g.players[owner].field[slot]=card;
    return card;
  };
  const first=summon(g.starter,1,0),original=first.card.atk;
  const decay=creatureDecayRate(g,first,g.starter),history=[],late=[];
  for(let end=1;end<=5;end++){
   if(end===2)var second=summon(1-g.starter,2,0);
   if(!advanceTurn(g))throw Error('Turn advance rejected at '+end);
   history.push({end,atk:first.card.atk,decayTotal:first.decayTotal||0,
    age:first.decayAge||0,active:g.active,turn:g.turn});
   late.push(second?{atk:second.card.atk,decayTotal:second.decayTotal||0}:null);
  }
  return {starter:g.starter,grace:g.openingDecayGrace,rate:decay,original,
   history,late,turn:g.turn,firstTurnSummoned:first.summonedTurn,
   secondTurnSummoned:second.summonedTurn,secondOriginal:original};
 })()`);
}
test('Default rules stay unchanged, grace must be explicitly requested',()=>{
 for(const starter of [0,1]){
  const baseline=experiment(starter,false),grace=experiment(starter,true);
  assert.equal(baseline.grace,false);assert.equal(grace.grace,true);
  assert.equal(baseline.firstTurnSummoned,1);
  assert.equal(grace.firstTurnSummoned,1);
  assert.equal(baseline.history[0].decayTotal,0);
  assert.equal(grace.history[0].decayTotal,0);
  assert.ok(baseline.history[2].decayTotal>0,
   'Without new rule original turn-one card decays after own turn three');
  assert.equal(grace.history[2].decayTotal,0,
   'Opening grace must protect the turn-one monster at end of own turn three');
  assert.ok(grace.history[4].decayTotal>0,
   'Opening grace should expire after own turn five');
  assert.ok(baseline.history[4].decayTotal>baseline.history[2].decayTotal);
  assert.equal(grace.late[3].decayTotal,baseline.late[3].decayTotal,
   'Turn-two monster must receive no extra grace');
  assert.ok(grace.late[3].decayTotal>0);
  assert.equal(grace.history[4].age,1);
  assert.equal(baseline.history[4].age,2);
  assert.ok(grace.history.every(x=>x.atk>=0));
 }
});
test('Opening decay protection is disabled for classic PvP even if requested',()=>{
 const p=boot({seed:149002}).run(`(()=>{
  const a=createGame({id:'no-grace-pvp',mode:'pvp',openingDecayGrace:true,seed:149002});
  const b=createGame({id:'default-pve',mode:'pve',opponentId:0,
   context:'free',openingDecayGrace:false,seed:149002});
  return {pvp:a.openingDecayGrace,defaultPve:b.openingDecayGrace};
 })()`);
 assert.equal(p.pvp,false);assert.equal(p.defaultPve,false);
});
test('After completing summon placement, fresh live board admits new attacks, and target legality is re-read',()=>{
 const output=boot({seed:149003}).run(`(()=>{
  profile=freshProfile();profile.guideSeen=true;
  const g=createGame({id:'post-summon',mode:'pve',opponentId:0,
   context:'free',seed:149003,starter:1});
  g.active=1;g.turn=4;g.aiPhase='positions';g.summoned=false;
  const p=g.players[1],enemy=g.players[0];
  const cid=RPG_BASE_CARDS.find(c=>c.level===3&&!c.fusionOnly&&!c.ace).id;
  const actor=newInstance(g,cid,1);
  p.hand=[actor];p.field.fill(null);enemy.field.fill(null);
  const prepared=applyAiAction(g,{type:'normal',uid:actor.uid});
  const placed=applyAiAction(g,{type:'place',idx:0});
  if(!prepared||!placed)throw Error('Could not execute full normal placement');
  g.aiPhase='attacks';
  const emptyChoice=chooseAiAction(g,'balanced');
  const canAfterPlacement=canAttack(g,g.players[1].field[0]);
  const foe=newInstance(g,cid,0);
  enemy.field[2]=foe;
  const defendedChoice=chooseAiAction(g,'balanced');
  const board={own:g.players[1].field.map(c=>c?c.uid:null),
   foe:g.players[0].field.map(c=>c?c.uid:null)};
  return {prepared:!!prepared,summoned:g.summoned,canAfterPlacement,
   emptyChoice,defendedChoice,board,phase:g.aiPhase};
 })()`);
 assert.equal(output.summoned,true);
 assert.equal(output.canAfterPlacement,true);
 assert.equal(output.emptyChoice.type,'attack',
  'AI must consider the freshly summoned creature when no enemy is present');
 assert.equal(output.emptyChoice.di,null,'Direct attack must target player');
 assert.ok(output.defendedChoice&&typeof output.defendedChoice.type==='string',
  'No valid post-summon decision: '+JSON.stringify(output.defendedChoice));
 if(output.defendedChoice.type==='attack')assert.equal(output.defendedChoice.di,2,
  'Occupied enemy field must not allow stale direct attack');
 assert.ok(output.board.own[0]!==null&&output.board.foe[2]!==null);
});
console.log('ARCANE_V149_OPENING_GRACE_BOARD_REGRESSIONS registered');
