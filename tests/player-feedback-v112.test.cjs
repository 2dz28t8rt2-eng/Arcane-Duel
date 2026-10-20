'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const run=src=>boot({seed:112220}).run(src);
test('existing high-level fusion rule is diagnosed without silently consuming an impossible template',()=>{
 const r=run(`(()=>{
  profile=freshProfile();profile.trainingWins=3;
  const g=createGame({mode:'pve',context:'free',opponentId:3,seed:55112});
  game=g;g.active=0;g.turn=3;g.summoned=false;g.pending=null;
  const p=g.players[0],c4=RPG_BASE_CARDS.find(c=>c.level===4&&!c.retired&&!c.ace&&!c.fusionOnly&&!c.enemyOnly),
   c3=RPG_BASE_CARDS.find(c=>c.level===3&&!c.retired&&!c.ace&&!c.fusionOnly&&!c.enemyOnly),
   f6=RPG_FUSIONS.find(c=>c.level===6&&!c.retired&&!c.enemyOnly),
   f8=RPG_FUSIONS.find(c=>c.level===8&&!c.retired&&!c.enemyOnly);
  p.hand=[newInstance(g,c4.id,0),newInstance(g,c4.id,0)];
  p.field=[newInstance(g,c3.id,0),null,null,null,null];
  p.fusionDeck=[f6.id,f8.id];p.remainingFusion=[f6.id,f8.id];
  const prepared=prepareHandFusion(g,p.hand.map(c=>c.uid),f6.id);
  const result=prepared?placePending(g,0,f8.id):null;
  return {prepared,firstLevel:prepared?dataOf(g.pending.card).level:null,
   actualBudget:fusionBudget([6,3],g),accepted:!!result,remaining:p.remainingFusion.length,
   pendingStillPresent:!!g.pending,fieldUnchanged:p.field[0].id===c3.id};
 })()`);
 assert.equal(r.prepared,true);
 assert.equal(r.firstLevel,6);
 assert.equal(r.actualBudget,5);
 assert.equal(r.accepted,false);
 assert.equal(r.remaining,1);
 assert.equal(r.pendingStillPresent,true);
 assert.equal(r.fieldUnchanged,true);
});
test('existing legal low-level field chain preserves a spent attack',()=>{
 const r=run(`(()=>{
  profile=freshProfile();profile.trainingWins=3;
  const g=createGame({mode:'pve',context:'free',opponentId:1,seed:55113});
  game=g;g.active=0;g.turn=3;g.summoned=false;g.pending=null;
  const p=g.players[0],c=RPG_BASE_CARDS.find(c=>c.level===1&&!c.retired&&!c.ace&&!c.fusionOnly&&!c.enemyOnly),
   f=RPG_FUSIONS.find(c=>c.level===2&&!c.retired&&!c.enemyOnly);
  p.hand=[newInstance(g,c.id,0),newInstance(g,c.id,0)];
  p.field=[newInstance(g,c.id,0),null,null,null,null];p.field[0].attacked=true;
  p.fusionDeck=[f.id,f.id,f.id];p.remainingFusion=[f.id,f.id,f.id];
  const prepared=prepareHandFusion(g,p.hand.map(x=>x.uid),f.id);
  const result=prepared?placePending(g,0,f.id):null;
  return {valid:!!result?.fused,attacked:!!result?.card?.attacked,canAttack:!!result&&canAttack(g,result.card)};
 })()`);
 assert.deepEqual(r,{valid:true,attacked:true,canAttack:false});
});
test('tournament defeat grants no drop charge; free defeat retains its historic reward',()=>{
 const r=run(`(()=>{
  profile=freshProfile();profile.trainingWins=3;profile.dropCharges=0;
  const a=createGame({id:'charged-loss112-a',mode:'pve',context:'tournament',opponentId:1,seed:1190});
  a.winner=1;const lost=rewardMatch(a),afterLost=profile.dropCharges;
  const b=createGame({id:'charged-loss112-b',mode:'pve',context:'free',opponentId:0,seed:1191});
  b.winner=1;const free=rewardMatch(b);
  return {tournamentCharge:lost.charge,afterLost,freeCharge:free.charge,afterFree:profile.dropCharges};
 })()`);
 assert.equal(r.tournamentCharge,0);assert.equal(r.afterLost,0);
 assert.equal(r.freeCharge,1);assert.equal(r.afterFree,1);
});
test('combined booster shop is one section and research cards expose whole-card selection',()=>{
 const r=run(`(()=>{
  profile=freshProfile();profile.trainingWins=3;
  let shop=shopMarkup();
  const fusionInNormal=shop.indexOf('ad112-fusion-inline')>shop.indexOf('Booster-Shop</h2>')&&
   shop.indexOf('ad112-fusion-inline')<shop.indexOf('</section>');
  profile.shardResearch={role:'predator',offers:RPG_BASE_CARDS.filter(c=>c.role==='predator').slice(0,3).map(c=>c.id)};
  shop=shopMarkup();
  return {fusionInNormal,standaloneFusion:shop.includes('<section class="menu-panel fusion-market">'),
    clickCard:shop.includes('data-ad112-research="0"')};
 })()`);
 assert.equal(r.fusionInNormal,true);assert.equal(r.standaloneFusion,false);assert.equal(r.clickCard,true);
});
