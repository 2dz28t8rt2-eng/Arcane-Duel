/* Node 20+ standalone regression tests for the pure tactical analysis core.
 * Run: node tests/strategy-engine.test.cjs
 * No external dependencies, live account, browser, or profile modifications.
 */
'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const core=require('../assets/strategy-engine.js');
test('combination calculator returns exact counts',()=>{
 assert.equal(core.choose(40,5),658008);
 assert.equal(core.choose(6,5),6);
 assert.equal(core.choose(40,41),0);
});
test('an entirely two-level deck guarantees a level pair',()=>{
 const d=core.fiveCardOdds({1:20,2:20});
 assert.equal(d.total,658008);
 assert.equal(d.probabilities.pair,1);
 assert.equal(d.probabilities.smallStraight,0);
 assert.equal(d.probabilities.bigStraight,0);
});
test('patterns correctly distinguish two pairs, fours and full house',()=>{
 assert.equal(core.patterns({1:4,3:1}).four,true);
 assert.equal(core.patterns({1:4,3:1}).twoPairs,false);
 assert.equal(core.patterns({1:2,3:2,4:1}).twoPairs,true);
 assert.equal(core.patterns({1:3,3:2}).fullHouse,true);
 assert.equal(core.patterns({1:5}).five,true);
 assert.equal(core.patterns({1:1,2:1,3:1,4:1,5:1}).bigStraight,true);
});
test('small street probability for {3,2,1} deck is 5/6',()=>{
 const d=core.fiveCardOdds({1:3,2:2,3:1});
 assert.equal(d.total,6);
 assert.ok(Math.abs(d.probabilities.smallStraight-5/6)<1e-12);
 assert.ok(Math.abs(d.probabilities.fullHouse-1/6)<1e-12);
});
test('matches independent brute-force enumeration for 9 card deck',()=>{
 const hand=[1,1,1,2,2,2,3,4,5];
 const matchCounts=Object.fromEntries(core.PATTERNS.map(([k])=>[k,0]));
 let total=0;
 const indexes=[];
 const visit=(start)=>{
  if(indexes.length===5){
   total++;
   const counts={};
   for(const i of indexes)counts[hand[i]]=(counts[hand[i]]||0)+1;
   const found=core.patterns(counts);
   for(const [key] of core.PATTERNS)if(found[key])matchCounts[key]++;
   return;
  }
  for(let i=start;i<hand.length;i++){indexes.push(i);visit(i+1);indexes.pop();}
 };
 visit(0);
 assert.equal(total,126);
 const actual=core.fiveCardOdds({1:3,2:3,3:1,4:1,5:1});
 assert.equal(actual.total,total);
 for(const [key] of core.PATTERNS)assert.ok(Math.abs(actual.probabilities[key]-matchCounts[key]/total)<1e-12,key);
});
test('does not reorder or mutate the player deck',()=>{
 const ids=Array.from({length:40},(_,i)=>i);
 const cards=ids.map(id=>({id,level:1+Math.floor(id/10),atk:100+id*10,def:150+id*10,element:'WIND'}));
 const before=JSON.stringify(ids)+JSON.stringify(cards);
 const data=core.evaluate(ids,id=>cards[id],[7,8]);
 assert.equal(data.count,40);
 assert.equal(data.validDeck,true);
 assert.equal(data.opening.total,658008);
 assert.equal(data.defHigher,40);
 assert.equal(data.fusionCount,2);
 assert.equal(JSON.stringify(ids)+JSON.stringify(cards),before);
});
test('flags illegal sizes and copies without changing game validation',()=>{
 const pool={1:{level:1,atk:200,def:200,element:'FEUER'}};
 assert.equal(core.evaluate([1,1,1,1,1],id=>pool[id]).validDeck,false);
 assert.throws(()=>core.evaluate([99],()=>undefined),/gültige Stufe/);
});
test('no probability leaves [0,1] even with one-sided decks',()=>{
 for(const levels of [{1:40},{1:10,2:10,3:10,4:10},{1:4,2:4,3:4,4:4,5:4,6:4,7:4,8:12}]){
  const d=core.fiveCardOdds(levels);
  assert.equal(d.total,658008);
  for(const value of Object.values(d.probabilities))assert.ok(value>=0&&value<=1);
 }
});
