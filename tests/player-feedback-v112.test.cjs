'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const run=src=>boot({seed:112220}).run(src);
test('new material formula: Lv4 + Lv4 cannot jump to a Lv6 template',()=>{
 const r=run("(()=>{const g=createGame({mode:'pve',opponentId:3,seed:55112});const p=g.players[0];const card=RPG_BASE_CARDS.find(c=>c.level===4&&!c.fusionOnly&&!c.retired);const f6=RPG_FUSIONS.find(c=>c.level===6&&!c.retired);p.hand=[newInstance(g,card.id,0),newInstance(g,card.id,0)];p.fusionDeck=[f6.id];p.remainingFusion=[f6.id];return {limit:fusionBudget([4,4],g),accepted:prepareHandFusion(g,p.hand.map(x=>x.uid),f6.id),remain:p.remainingFusion.length};})()");
 assert.deepEqual(r,{limit:5,accepted:false,remain:1});
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
