'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const check=(difficulty,withoutRoster125)=>boot({seed:12541,withoutRoster125}).run(`(()=>{
 const o={};
 for(let i=1;i<=10;i++){
  const p=rpgEnemyLoadout(i,'${difficulty}'),h=deck=>deck.reduce((m,id)=>(m[CARDS[id].level]=(m[CARDS[id].level]||0)+1,m),{});
  o[i]={deck:p.deck,fusion:p.fusionDeck,modified:p.roster125||null,
   ace:ACE_CARD_IDS[i],hist:h(p.fusionDeck)};
 }
 return o;
})()`);
for(const difficulty of ['easy','hard'])test('v12.5 '+difficulty+' substitutes legal VII/X cards only',()=>{
 const prev=check(difficulty,true),next=check(difficulty,false);
 for(let id=1;id<=10;id++){
  const a=prev[id],b=next[id],changes=b.modified||[];
  if(id!==7&&id!==10){assert.deepEqual(b.deck,a.deck,'main '+id);assert.deepEqual(b.fusion,a.fusion,'fusion '+id);continue;}
  const target=id===7?{main:2,fusion:1}:{main:2,fusion:4};
  assert.equal(changes.length,target.main+target.fusion);
  assert.equal(changes.filter(x=>x.kind==='main').length,target.main);
  assert.equal(changes.filter(x=>x.kind==='fusion').length,target.fusion);
  for(const c of changes){
   assert.notEqual(c.from,b.ace);assert.notEqual(c.to,b.ace);
   assert.equal(c.delta,id===7&&c.kind==='fusion'?10-c.fromLevel:id===7?1:-1);
   if(id===7&&c.kind==='main')assert.ok(c.fromLevel<9);
   assert.notEqual(c.from,c.to);
  }
  assert.equal(b.deck.length,40);assert.equal(b.fusion.length,a.fusion.length);
  assert.equal(b.deck.filter((c,i)=>c!==a.deck[i]).length,target.main);
  assert.equal(b.fusion.filter((c,i)=>c!==a.fusion[i]).length,target.fusion);
  assert.equal(b.deck.filter(c=>c===b.ace).length+b.fusion.filter(c=>c===b.ace).length,1);
  for(const ids of [b.deck,b.fusion]){
   assert.ok(ids.every(c=>Number.isInteger(c)),id+' non-id present');
   assert.ok([...new Set(ids)].every(c=>ids.filter(x=>x===c).length<=3));
  }
  if(id===7){assert.equal(a.hist[10],3);assert.equal(b.hist[10],4);}
 }
});
