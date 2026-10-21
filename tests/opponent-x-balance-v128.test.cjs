'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
function snapshot(mode,difficulty){
 return boot({seed:128881,x128Mode:mode}).run(`(()=>{
 const ret={},difficulty='${difficulty}';
 for(let id=1;id<=10;id++){
  const l=rpgEnemyLoadout(id,difficulty),
   tally=deck=>deck.reduce((m,k)=>(m[k]=(m[k]||0)+1,m),{});
  ret[id]={power:l.power,main:l.deck,fusion:l.fusionDeck,
    ace:ACE_CARD_IDS[id],changes:l.roster128||null,
    mainLevel10:l.deck.filter(cid=>CARDS[cid]?.level===10).length,
    fusionLevel10:l.fusionDeck.filter(cid=>CARDS[cid]?.level===10).length,
    legalMain:l.deck.length===40&&l.deck.every(cid=>CARDS[cid]&&!CARDS[cid].fusionOnly)&&
     Object.values(tally(l.deck)).every(n=>n<=3),
    legalFusion:l.fusionDeck.length>=2&&l.fusionDeck.length<=15&&
     l.fusionDeck.every(cid=>CARDS[cid]?.fusionOnly)&&
     Object.values(tally(l.fusionDeck)).every(n=>n<=3)
  };
 }
 const xGame=createGame({mode:'pve',context:'tournament',opponentId:10,
  difficulty,seed:81771});
 return {ret,effectiveXPower:xGame.players[1].power};
 })()`);
}
for(const difficulty of ['easy','hard'])test('v12.8 '+difficulty+' lowers EXACTLY five actual X Lv10 card slots and effective power to 1.0',()=>{
 const old=snapshot('off',difficulty),power=snapshot('power-only',difficulty),now=snapshot('full',difficulty);
 const p=old.ret[10],q=power.ret[10],x=now.ret[10];
 assert.equal(now.effectiveXPower,1);assert.equal(power.effectiveXPower,1);
 assert.ok(p.power>1,'previous power should be above 1');
 assert.equal(q.power,1);assert.equal(x.power,1);
 assert.deepEqual(q.main,p.main);assert.deepEqual(q.fusion,p.fusion);
 assert.ok(x.legalMain&&x.legalFusion);
 assert.equal(x.changes.replaced,5);
 assert.equal(x.changes.changes.length,5);
 assert.equal(p.mainLevel10+p.fusionLevel10-x.mainLevel10-x.fusionLevel10,5);
 assert.equal(x.main.length,p.main.length);
 assert.equal(x.fusion.length,p.fusion.length);
 assert.equal(x.main.filter(k=>k===x.ace).length+x.fusion.filter(k=>k===x.ace).length,1);
 assert.equal(x.main.filter((id,i)=>id!==p.main[i]).length+
  x.fusion.filter((id,i)=>id!==p.fusion[i]).length,5);
 for(const c of x.changes.changes){
  assert.equal(c.fromLevel,10);assert.equal(c.toLevel,9);
  assert.notEqual(c.from,x.ace);assert.notEqual(c.to,x.ace);
  const before=c.kind==='main'?p.main:p.fusion;
  const after=c.kind==='main'?x.main:x.fusion;
  assert.equal(before[c.index],c.from);assert.equal(after[c.index],c.to);
 }
 for(let id=1;id<=9;id++){
  assert.deepEqual(now.ret[id],old.ret[id],'NPC '+id+' must remain unchanged');
 }
});
