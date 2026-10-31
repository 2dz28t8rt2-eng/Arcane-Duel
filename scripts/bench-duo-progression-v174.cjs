'use strict';
/* Deterministic offline checkpoint for 2 humans vs 2 existing AI opponents.
 * The scripted human policy is a deliberately simple baseline; its wins are
 * NOT a human multiplayer win rate and DO NOT train the opponent AI.
 */
const rules=require('../assets/duo-shared-rules-v160.js');
const d=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(d.cards.map(c=>[c.id,c]));
const starter=d.starterMain,fusions=d.starterFusions;
function aiDeck(chapter,seat){
 if(chapter===1)return [...starter];
 const target=[2,4,6,8][chapter-1];
 const options=d.cards.filter(c=>c.playable&&!c.fusionOnly&&!c.ace&&
  c.level<=target&&c.level>=Math.max(1,target-3)&&
  (c.source===null||c.source<=chapter+2));
 options.sort((a,b)=>{const score=c=>Math.abs(target-c.level)*300-
  (seat===1?c.def:c.atk)*.3;return score(a)-score(b)||a.id-b.id});
 const unique=[...new Set(options.slice(0,19).map(c=>c.id))];
 if(unique.length<14)return [...starter];
 const deck=[];
 while(deck.length<40)for(const id of unique){
  if(deck.length>=40)break;
  if(deck.filter(x=>x===id).length<3)deck.push(id);
 }
 return deck;
}
function aiFusions(chapter){
 const cap=[3,5,7,10][chapter-1];
 return d.cards.filter(c=>c.playable&&c.fusionOnly&&c.level>=2&&c.level<=cap)
  .sort((a,b)=>a.level-b.level||a.id-b.id)
  .slice(0,15).map(c=>c.id);
}
function advancedDeck(chapter){
 if(chapter===1)return [...starter];
 const deck=[...starter],level=[2,4,6,8][chapter-1];
 const available=d.cards.filter(c=>c.playable&&!c.fusionOnly&&!c.ace&&
  c.level>=level&&c.level<=Math.min(10,level+1))
  .sort((a,b)=>b.atk-a.atk||a.id-b.id);
 const chosen=available.slice(0,Math.min(6,chapter+1));
 let slot=0;
 for(const c of chosen)for(let n=0;n<2;n++)deck[slot++]=c.id;
 return deck;
}
function scriptedHuman(g,seat){
 const p=g.players[seat],free=p.field.findIndex((x,i)=>rules.freeTeamSlot(g,p,i));
 if(!p.summoned&&free>=0&&p.hand.length){
  const best=p.hand.map((id,i)=>({id:Number.isInteger(id)?id:id?.id,i}))
   .filter(x=>catalog[x.id]?.playable)
   .sort((a,b)=>catalog[b.id].atk-catalog[a.id].atk)[0];
  if(best)g=rules.apply(g,seat,{type:'summon',handIndex:best.i,slot:free},{catalog});
 }
 for(let slot=0;slot<7&&g.status==='active';slot++){
  const p=g.players[seat],src=p.field[slot];
  if(!src||src.used||src.mode!=='atk'||src.placedRound>=g.round)continue;
  const opponents=g.players.filter(x=>x.team===1).flatMap(x=>x.field
   .map((t,j)=>t?{seat:x.seat,slot:j,t}:null).filter(Boolean))
   .sort((a,b)=>(a.t.mode==='atk'?a.t.atk:a.t.def)-
    (b.t.mode==='atk'?b.t.atk:b.t.def));
  const target=opponents[0],resistance=target?
   (target.t.mode==='atk'?target.t.atk:target.t.def):0;
  if(!target||src.atk>resistance){
   try{g=rules.apply(g,seat,{type:'attack',slot,
    targetSeat:target?.seat??null,targetSlot:target?.slot??null},{catalog});
   }catch{} // A basic human heuristic is not an oracle for special defenses.
  }
 }
 if(g.status==='active')g=rules.apply(g,seat,{type:'end'},{catalog});
 return rules.aiTurn(g,{catalog});
}
function one(chapter,scenario,seed){
 const deck=scenario==='starter'?[...starter]:advancedDeck(chapter);
 const options={roomId:'duo-progress-'+chapter+'-'+scenario+'-'+seed,
  hostName:'Human benchmark A',hostDeck:deck,hostFusions:fusions,
  enemyDeckA:aiDeck(chapter,1),enemyDeckB:aiDeck(chapter,3),
  enemyFusionsA:aiFusions(chapter),enemyFusionsB:aiFusions(chapter),
  chapter,entry:chapter===1?'new':'chapter',catalog,randomSeed:seed};
 let g=rules.create(options);
 g=rules.apply(g,2,{type:'join',name:'Human benchmark B',
  deck,fusions,upgrades:scenario==='progressed'?
  {power:Math.min(5,chapter),schildwall:Math.min(2,chapter)}:{}},{catalog});
 let turns=0;
 while(g.status==='active'&&turns++<95){
  if(![0,2].includes(g.activeSeat)){g=rules.aiTurn(g,{catalog});continue;}
  g=scriptedHuman(g,g.activeSeat);
 }
 return {won:g.winner===0,lost:g.winner===1,
  unresolved:g.status==='active',round:g.round};
}
const output=[];
for(let chapter=1;chapter<=4;chapter++){
 for(const scenario of ['starter','progressed']){
  const games=7,results=[];
  for(let i=0;i<games;i++)results.push(one(chapter,scenario,600+i*27+chapter*100));
  const won=results.filter(x=>x.won).length,
   lost=results.filter(x=>x.lost).length,
   unresolved=results.filter(x=>x.unresolved).length;
  if(unresolved)throw Error('Benchmark has unresolved duels: '+chapter);
  output.push({chapter,scenario,games,wins:won,losses:lost,
   averageRound:Math.round(results.reduce((a,b)=>a+b.round,0)/games)});
 }
}
console.log('2v2 progression checkpoint (scripted humans, unchanged NPC AI, 7 deterministic seeds per case):');
console.log(JSON.stringify(output,null,2));
