'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const load=(difficulty,old)=>boot({seed:12621,withoutRoster126:old}).run(`(()=>{
 const all={};
 for(let i=1;i<=10;i++){let b=rpgEnemyLoadout(i,'${difficulty}');
 all[i]={main:b.deck,fusions:b.fusionDeck,ace:ACE_CARD_IDS[i],
   changes:b.roster126||[],f10:b.fusionDeck.filter(id=>CARDS[id].level===10).length};
 }return all;
})()`);
for(const difficulty of ['easy','hard'])test('v12.6 '+difficulty+' correct 2 one-rank exchanges at VII/VIII only',()=>{
 const old=load(difficulty,true),now=load(difficulty,false);
 for(let id=1;id<=10;id++){
  const a=old[id],b=now[id];
  assert.equal(b.main.length,40);assert.equal(b.fusions.length,a.fusions.length);
  assert.equal(b.main.filter(c=>c===b.ace).length+b.fusions.filter(c=>c===b.ace).length,1);
  if(id!==7&&id!==8){
   assert.deepEqual(b.main,a.main,'untouched main '+id);
   assert.deepEqual(b.fusions,a.fusions,'untouched fusions '+id);
   continue;
  }
  assert.equal(b.changes.length,2);
  assert.equal(b.main.filter((x,j)=>x!==a.main[j]).length,2);
  assert.deepEqual(b.fusions,a.fusions);
  for(const c of b.changes){
   assert.equal(c.kind,'main');assert.equal(c.delta,id===7?-1:1);
   if(id===8)assert.ok(c.toLevel<=9,'VIII must respect its intended main deck level ceiling');
   assert.notEqual(c.from,b.ace);assert.notEqual(c.to,b.ace);
  }
  assert.ok([...new Set(b.main)].every(c=>b.main.filter(k=>k===c).length<=3));
  if(id===7)assert.equal(b.f10,4);
  if(id===8)assert.ok(b.main.every(c=>c!=null), 'VIII must have valid cards');
 }
});
