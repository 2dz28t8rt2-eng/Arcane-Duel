'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const run=src=>boot({seed:112220}).run(src);
test('actual chain fusion treats a newly formed LV6 as LV6 when fused onto LV3 field material',()=>{
 const r=run(`(()=>{
  profile=freshProfile();profile.trainingWins=3;
  const g=createGame({mode:'pve',context:'free',opponentId:3,seed:55112});
  game=g;g.active=0;g.turn=3;g.summoned=false;g.pending=null;
  const p=g.players[0],main4=RPG_BASE_CARDS.find(c=>c.level===4&&!c.retired&&!c.ace&&!c.fusionOnly&&!c.enemyOnly),
   main3=RPG_BASE_CARDS.find(c=>c.level===3&&!c.retired&&!c.ace&&!c.fusionOnly&&!c.enemyOnly),
   f6=RPG_FUSIONS.find(c=>c.level===6&&!c.retired&&!c.enemyOnly),
   f8=RPG_FUSIONS.find(c=>c.level===8&&!c.retired&&!c.enemyOnly);
  if(!main4||!main3||!f6||!f8)throw Error('missing level IV/III/VI/VIII card definitions');
  p.hand=[newInstance(g,main4.id,0),newInstance(g,main4.id,0)];
  p.field=[newInstance(g,main3.id,0),null,null,null,null];
  p.field[0].attacked=false;
  p.fusionDeck=[f6.id,f8.id];p.remainingFusion=[f6.id,f8.id];
  const original=p.hand.map(c=>c.uid),prepared=prepareHandFusion(g,original,f6.id);
  const handFusionLevel=prepared?dataOf(g.pending.card).level:null;
  const maxFromOldMaterials=prepared?fusionBudget([...g.pending.levels,3],g):null;
  const maxFromActualMonster=prepared?fusionBudget([handFusionLevel,3],g):null;
  const result=prepared?placePending(g,0,f8.id):null;
  const proper=result?.card?dataOf(result.card).level:null;
  return {prepared,handFusionLevel,maxFromOldMaterials,maxFromActualMonster,
   resultFused:!!result?.fused,proper,canAttack:!!result&&canAttack(g,result.card),
   remaining:p.remainingFusion.length};
 })()`);
 assert.equal(r.prepared,true);
 assert.equal(r.handFusionLevel,6);
 assert.equal(r.maxFromOldMaterials,6);
 assert.equal(r.maxFromActualMonster,8);
 assert.equal(r.resultFused,true);
 assert.equal(r.proper,8);
 assert.equal(r.canAttack,true);
 assert.equal(r.remaining,0);
});
test('a used field creature cannot reset a consumed attack through a chained fusion',()=>{
 const r=run(`(()=>{
  profile=freshProfile();profile.trainingWins=3;
  const g=createGame({mode:'pve',context:'free',opponentId:3,seed:55113});
  game=g;g.active=0;g.turn=3;g.summoned=false;g.pending=null;
  const p=g.players[0],c4=RPG_BASE_CARDS.find(c=>c.level===4&&!c.retired&&!c.ace&&!c.fusionOnly&&!c.enemyOnly),
   c3=RPG_BASE_CARDS.find(c=>c.level===3&&!c.retired&&!c.ace&&!c.fusionOnly&&!c.enemyOnly),
   f6=RPG_FUSIONS.find(c=>c.level===6&&!c.retired&&!c.enemyOnly),
   f8=RPG_FUSIONS.find(c=>c.level===8&&!c.retired&&!c.enemyOnly);
  p.hand=[newInstance(g,c4.id,0),newInstance(g,c4.id,0)];
  p.field=[newInstance(g,c3.id,0),null,null,null,null];p.field[0].attacked=true;
  p.fusionDeck=[f6.id,f8.id];p.remainingFusion=[f6.id,f8.id];
  const prepared=prepareHandFusion(g,p.hand.map(x=>x.uid),f6.id);
  const result=prepared?placePending(g,0,f8.id):null;
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
  profile.shardResearch={role:'predator',offers:shardResearchPool('predator').slice(0,3).map(c=>c.id)};
  shop=shopMarkup();
  return {fusionInNormal,standaloneFusion:shop.includes('<section class="menu-panel fusion-market">'),
    clickCard:shop.includes('data-ad112-research="0"')};
 })()`);
 assert.equal(r.fusionInNormal,true);assert.equal(r.standaloneFusion,false);assert.equal(r.clickCard,true);
});
