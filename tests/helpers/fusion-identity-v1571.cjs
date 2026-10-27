'use strict';
/* v14.9.71 constructed research decks for fusion identity.
 * Exact 40 legal NORMAL cards, 3-copy limit, genuine unlocked source;
 * no claims about player-owned collection or artificial fusion values.
 * Three fusion-material profiles and a swarm-oriented deck are compared
 * with SAME fusion-aware candidate policy, seats, seeds and opponent.
 */
const assert=require('node:assert/strict');
const {roster,makeBenchmarkDeck}=require('./lategame-ai-decks-v72.cjs');
const MODES=Object.freeze(['fusion-mixed','fusion-allrounder','fusion-predator','predator-swarm']);
const group=c=>c.role==='allrounder'?'allrounder':c.role==='predator'?'predator':
 c.role==='resonator'?'resonator':'other';
function makeFusionRoleDeck(data,tier,mode,seed){
 assert.ok(MODES.includes(mode),'Unknown fusion research archetype');
 const unlocked=roster(data,tier);
 const blueprint=makeBenchmarkDeck(data,tier,mode==='predator-swarm'?'predator':'fusion','balanced',seed);
 const quotas={
  // Predeclared, different *achievable* Allrounder targets.
  // v14.9.70 accidentally requested 23 although only 9 copies were source-legal.
  'fusion-mixed':{allrounder:6,predator:15},
  'fusion-allrounder':{allrounder:9,predator:9},
  'fusion-predator':{allrounder:3,predator:23},
  'predator-swarm':{allrounder:0,predator:30}
 }[mode];
 const counts=new Map(),deck=[];
 const capacity=Object.fromEntries(['allrounder','predator','resonator','other'].map(
  role=>[role,unlocked.normals.filter(c=>group(c)===role).length*3]));
 const actualTargets=Object.fromEntries(Object.entries(quotas).map(([role,n])=>
  [role,Math.min(n,capacity[role]||0)]));
 if(mode==='fusion-allrounder')assert.ok(actualTargets.allrounder>0,
  'No source-legal Allrounder: invalid high-Allrounder study');
 const rank=c=>(c.level||1)*135+(c.atk||0)*.73+(c.def||0)*.66+
  ((Math.imul((seed+7)^c.id,2654435761)>>>0)%157);
 const sorted=unlocked.normals.slice().sort((a,b)=>rank(b)-rank(a)||a.id-b.id);
 const add=c=>{deck.push(c.id);counts.set(c.id,(counts.get(c.id)||0)+1);};
 for(const [wanted,want] of Object.entries(actualTargets)){
  for(let n=0;n<want;n++){
   const next=sorted.find(c=>group(c)===wanted&&(counts.get(c.id)||0)<3);
   assert.ok(next,'Unexpected source-card availability change '+wanted);add(next);
  }
 }
 // Preserve the same unlocked-card source rules, fill remaining slots with
 // best independent supporting cards, preferring actual Resonators first.
 const prefer=mode==='predator-swarm'?['predator','other','resonator','allrounder']:
  ['resonator','other','predator','allrounder'];
 while(deck.length<40){
  const next=prefer.flatMap(w=>sorted.filter(c=>group(c)===w&&
   (counts.get(c.id)||0)<3)).at(0);
  assert.ok(next,'Insufficient source-legal constructed deck cards');
  add(next);
 }
 assert.ok(deck.every(id=>unlocked.allowed(data.cards[id])));
 assert.ok([...counts.values()].every(n=>n<=3));
 const roles={allrounder:0,predator:0,resonator:0,other:0};
 for(const id of deck)roles[group(data.cards[id])]++;
 return {...blueprint,id:'v1571-'+mode+'-'+seed,
  kind:'CONSTRUCTED_BENCHMARK_NOT_EARNED',deck,
  meta:{...blueprint.meta,roleStudyMode:mode,materialTargets:actualTargets,
   requestedTargets:quotas,roleCapacity:capacity,roles,
   fusionTemplates:blueprint.fusionDeck.length,
   sourceLegal:true,benchmarkOnly:true,actualRatioMustBeReported:true}};
}
module.exports={makeFusionRoleDeck,MODES,group};
