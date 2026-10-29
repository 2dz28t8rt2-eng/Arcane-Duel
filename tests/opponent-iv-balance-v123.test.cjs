'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
function check(difficulty='easy',disabled=false){
 const v=boot({seed:12340,withoutIV123:disabled});
 return v.run(`(()=>{
  const byId={},first=1,last=10;
  for(let i=first;i<=last;i++){
   const load=rpgEnemyLoadout(i,'${difficulty}');
   byId[i]={main:load.deck,fusion:load.fusionDeck,ops:load.roster123||null,
     ace:ACE_CARD_IDS[i],levels:Object.fromEntries([...new Set([...load.deck,...load.fusionDeck])].map(id=>[id,CARDS[id].level]))};
  }
  return byId;
 })()`);
}
for(const difficulty of ['easy','hard']){
 test('IV '+difficulty+' exactly 4 normal cards and 1 fusion drop a single tier, ACE untouched',()=>{
  const before=check(difficulty,true),after=check(difficulty,false);
  const b=before[4],a=after[4],ops=a.ops;
  assert.equal(ops.length,2);
  assert.equal(ops[0].kind,'main');assert.equal(ops[0].changed,4);
  assert.equal(ops[1].kind,'fusion');assert.equal(ops[1].changed,1);
  for(const o of ops)for(const change of o.details){
   assert.equal(change.fromLevel-change.toLevel,1,JSON.stringify(change));
   assert.notEqual(change.from,change.to);
   assert.notEqual(change.from,a.ace);
   assert.equal(a.levels[change.to],change.toLevel);
  }
  assert.equal(a.main.length,40);assert.equal(a.fusion.length,b.fusion.length);
  for(const cards of [a.main,a.fusion]){
   const histogram={};for(const id of cards)histogram[id]=(histogram[id]||0)+1;
   assert.ok(Object.values(histogram).every(x=>x<=3));
  }
  assert.equal(a.main.filter(id=>id===a.ace).length+a.fusion.filter(id=>id===a.ace).length,1);
  // Each isolated roster entry must reflect the exact number of successful card substitutions.
  for(const [from,to] of [[b.main,a.main],[b.fusion,a.fusion]]){
   const delta=from.filter((id,j)=>to[j]!==id).length;
   assert.equal(delta,from===b.main?4:1);
  }
  for(let i=1;i<=10;i++)if(i!==4){
   assert.deepEqual(after[i].main,before[i].main,'unexpected main change to '+i);
   assert.deepEqual(after[i].fusion,before[i].fusion,'unexpected fusion change to '+i);
  }
 });
}
test('IV normal/hard cards are legal, including unchanged level-unique ACE',()=>{
 const vm=boot();
 const r=vm.run(`(()=>{
  const x={};for(const difficulty of ['easy','hard']){
   const l=rpgEnemyLoadout(4,difficulty),ace=ACE_CARD_IDS[4];
   x[difficulty]={
    main:l.deck.filter(id=>!CARDS[id]||CARDS[id].fusionOnly),
    fusion:l.fusionDeck.filter(id=>!CARDS[id]?.fusionOnly),
    aceCount:[...l.deck,...l.fusionDeck].filter(id=>id===ace).length,
    deck:l.deck.length,fusions:l.fusionDeck.length
   };
  }return x;
 })()`);
 for(const x of Object.values(r)){assert.deepEqual(x.main,[]);assert.deepEqual(x.fusion,[]);
  assert.equal(x.aceCount,1);assert.equal(x.deck,40);assert.ok(x.fusions>=1&&x.fusions<=15);}
});
