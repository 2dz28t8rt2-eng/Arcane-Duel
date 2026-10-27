'use strict';
/* Research-only v14.9.71: source-legal constructed L10 defender core decks.
 * Existing game rules, rarity, card stats and inventories remain unchanged.
 * Ratios refer to an EXACT 20-card defensive core; 20 others are support.
 */
const assert=require('node:assert/strict');
const {roster,makeBenchmarkDeck}=require('./lategame-ai-decks-v72.cjs');
const MODES=Object.freeze({
 'mixed-50':{guardian:10,soul:10},
 'mixed-60g':{guardian:12,soul:8},
 'mixed-40g':{guardian:8,soul:12},
 'guardian-core':{guardian:20,soul:0},
 'soul-core':{guardian:0,soul:20}
});
const role=c=>['guardian','defender'].includes(c?.role)?'guardian':
 ['soul','souldrainer'].includes(c?.role)?'soul':'support';
function benchmark(data,tier,mode,seed,variant='balanced'){
 assert.ok(MODES[mode],'Unrecognized mixed research mode');
 const accessible=roster(data,tier),quotas=MODES[mode];
 const base=makeBenchmarkDeck(data,tier,'hybrid',variant,seed);
 const counts=new Map(),deck=[];
 const pool=accessible.normals;
 const score=c=>(Number(c.atk)||0)*.9+(Number(c.def)||0)*1.1+
  c.level*105+((Math.imul(c.id+101,2654435761)^Math.imul(seed+1,2246822519))>>>0)%251/10;
 const sorted=pool.slice().sort((a,b)=>score(b)-score(a)||a.id-b.id);
 const add=(c)=>{if((counts.get(c.id)||0)>=3)return false;deck.push(c.id);counts.set(c.id,(counts.get(c.id)||0)+1);return true;};
 for(const [wanted,amount] of Object.entries(quotas)){
  let n=0;
  while(n<amount){
   const candidate=sorted.find(c=>role(c)===wanted&&(counts.get(c.id)||0)<3);
   assert.ok(candidate,'Insufficient source-legal '+wanted+' cards for '+mode);
   add(candidate);n++;
  }
 }
 assert.equal(deck.length,20);
 // The support section is deliberately identical per seed across all defender
 // mixes and has no Guardian/Soul cards; this isolates the defensive ratio.
 let support=0;
 while(support<20){
  const card=sorted.find(c=>role(c)==='support'&&(counts.get(c.id)||0)<3);
  assert.ok(card,'Insufficient source-legal neutral support at tournament '+tier);
  add(card);support++;
 }
 assert.equal(deck.length,40);
 assert.ok(deck.every(id=>accessible.allowed(data.cards[id])));
 assert.ok([...counts.values()].every(n=>n<=3));
 const actual={guardian:0,soul:0,support:0};
 deck.forEach(id=>actual[role(data.cards[id])]++);
 assert.deepEqual(actual,{...quotas,support:20});
 return {...base,id:'v1571-'+mode+'-'+seed,deck,
  kind:'CONSTRUCTED_BENCHMARK_NOT_EARNED',
  meta:{...base.meta,defenderMode:mode,defenderCore:20,roles:actual,
   benchmarkOnly:true,ownedInventoryAssumed:false,
   sourceLegal:true,ratioIsWithinDefensiveCore:true}};
}
module.exports={benchmark,MODES,role};
