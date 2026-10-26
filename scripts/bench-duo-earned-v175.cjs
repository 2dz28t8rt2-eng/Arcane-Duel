'use strict';
/* Earned-inventory 2v2 pacing diagnostic. No DB calls, server writes, or AI
 * training. Two scripted human seats face the existing two NPC policies.
 * Unlike v17.4's advanced-deck ceiling, no card is inserted without first
 * being earned through a chapter credit or an affordable shop purchase.
 */
const rules=require('../assets/duo-shared-rules-v160.js');
const economy=require('../assets/duo-economy-v172.js');
const data=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(data.cards.map(c=>[c.id,c]));

function rng(seed){
 let state=seed>>>0;
 return bound=>{
  if(!Number.isInteger(bound)||bound<1)throw Error('Invalid RNG bound');
  state^=state<<13;state^=state>>>17;state^=state<<5;
  return (state>>>0)%bound;
 };
}
function profile(){
 return {owned_main:[...data.starterMain],owned_fusions:[...data.starterFusions],
  deck:[...data.starterMain],fusions:[...data.starterFusions],
  cleared_chapters:[],essence:0,shards:0,enhancements:{},upgrades:{}};
}
function aiDeck(chapter,seat){
 if(chapter===1)return [...data.starterMain];
 const target=[2,4,6,8][chapter-1];
 const options=data.cards.filter(c=>c.playable&&!c.fusionOnly&&!c.ace&&
  c.level<=target&&c.level>=Math.max(1,target-3)&&
  (c.source===null||c.source<=chapter+2));
 options.sort((a,b)=>{
  const score=c=>Math.abs(target-c.level)*300-(seat===1?c.def:c.atk)*.3;
  return score(a)-score(b)||a.id-b.id;
 });
 const unique=[...new Set(options.slice(0,19).map(c=>c.id))];
 if(unique.length<14)return [...data.starterMain];
 const deck=[];
 while(deck.length<40)for(const id of unique){
  if(deck.length>=40)break;
  if(deck.filter(x=>x===id).length<3)deck.push(id);
 }
 return deck;
}
function aiFusions(chapter){
 const cap=[3,5,7,10][chapter-1];
 return data.cards.filter(c=>c.playable&&c.fusionOnly&&c.level>=2&&c.level<=cap)
  .sort((a,b)=>a.level-b.level||a.id-b.id).slice(0,15).map(c=>c.id);
}
function rebuild(p){
 // A deliberately transparent offensive deckbuilder: best owned ATK first,
 // retaining 40 legal physical cards. It cannot fabricate extra copies.
 p.deck=[...p.owned_main].sort((a,b)=>catalog[b].atk-catalog[a].atk||
  catalog[b].level-catalog[a].level||a-b).slice(0,40);
 if(!rules.validDeck(p.deck,catalog,false))throw Error('Illegal earned deck');
}
function claim(p,randomInt){
 const pool=economy.chapterCardPool(p,catalog);
 if(!pool.length)throw Error('Missing chapter reward pool');
 const id=pool[randomInt(pool.length)].id;
 p.owned_main.push(id);
 return id;
}
function award(p,chapter,repeat=false){
 const r=economy.rewardTable()[chapter-1][repeat?'repeat':'first'];
 p.essence+=r.essence;p.shards+=r.shards;
 if(!repeat){p.cleared_chapters.push(chapter);
  if(!p.chapterCardCredits)p.chapterCardCredits=0;
  p.chapterCardCredits+=r.chapterCards;
 }
}
function purchases(p,kind,randomInt){
 const offer=economy.PACKS[kind];
 if(p.essence<offer.essence||p.shards<offer.shards)return false;
 const result=economy.packDraw(p,kind,catalog,randomInt);
 p.essence-=offer.essence;p.shards-=offer.shards;
 p.owned_main=result.owned_main;p.owned_fusions=result.owned_fusions;
 return true;
}
function spendCredits(p,randomInt){
 while((p.chapterCardCredits||0)>0){claim(p,randomInt);p.chapterCardCredits--;}
 rebuild(p);
}
function humanTurn(g,seat){
 const p=g.players[seat],free=p.field.findIndex(x=>!x);
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
    targetSeat:target?.seat??null,targetSlot:target?.slot??null},{catalog});}
   catch{} // Simulated human does not infer complex defensive effects.
  }
 }
 if(g.status==='active')g=rules.apply(g,seat,{type:'end'},{catalog});
 return rules.aiTurn(g,{catalog});
}
function duel(a,b,chapter,seed){
 let g=rules.create({roomId:'earned-'+chapter+'-'+seed,
  hostName:'Scripted A',hostDeck:a.deck,hostFusions:a.fusions,
  hostUpgrades:a.upgrades,hostEnhancements:a.enhancements,
  enemyDeckA:aiDeck(chapter,1),enemyDeckB:aiDeck(chapter,3),
  enemyFusionsA:aiFusions(chapter),enemyFusionsB:aiFusions(chapter),
  chapter,entry:chapter===1?'new':'chapter',catalog,randomSeed:seed});
 g=rules.apply(g,2,{type:'join',name:'Scripted B',deck:b.deck,
  fusions:b.fusions,upgrades:b.upgrades,enhancements:b.enhancements},{catalog});
 let turns=0;
 while(g.status==='active'&&turns++<95){
  if(![0,2].includes(g.activeSeat)){g=rules.aiTurn(g,{catalog});continue;}
  g=humanTurn(g,g.activeSeat);
 }
 if(g.status==='active')throw Error('Unresolved seeded duel');
 return {win:g.winner===0,round:g.round};
}
function career(seed,plan,extraCredits=0){
 const a=profile(),b=profile(),randomA=rng(seed*17+1),randomB=rng(seed*17+2);
 const first=duel(a,b,1,seed*29+1);
 if(!first.win)return {stage:0,round:first.round};
 for(const p of [a,b]){
  award(p,1);
  // Diagnostic only: estimate how many earned, stage-relevant rewards
  // would be needed to bridge chapter I and II for this cautious policy.
  p.chapterCardCredits+=extraCredits;
 }
 for(const [p,rand] of [[a,randomA],[b,randomB]]){
  spendCredits(p,rand);
  if(plan==='normal')purchases(p,'normal',rand);
 }
 if(plan==='farm-material'||plan==='farm-upgrade'){
  for(let i=0;i<3;i++){
   const repeat=duel(a,b,1,seed*29+2+i);
   if(!repeat.win)return {stage:1,repeatFailure:true};
   for(const p of [a,b])award(p,1,true);
  }
  for(const [p,rand] of [[a,randomA],[b,randomB]]){
   if(plan==='farm-material')purchases(p,'material3',rand);
   else {
    // The first permanent upgrade costs 75 essence and 1 shard;
    // strengthen the best owned card already in the deck.
    const id=p.deck[0],offer=economy.enhanceOffer(p,id,catalog);
    if(offer&&p.essence>=offer.essence&&p.shards>=offer.shards){
     p.essence-=offer.essence;p.shards-=offer.shards;
     p.enhancements[id]=offer.nextRank;
    }
    purchases(p,'normal',rand);
   }
   rebuild(p);
  }
 }
 const second=duel(a,b,2,seed*29+5);
 return {stage:second.win?2:1,round:second.round,
  highCards:[a,b].map(p=>p.deck.filter(id=>catalog[id].level>=4).length),
  currencies:[a,b].map(p=>({essence:p.essence,shards:p.shards}))};
}
function run(games=80){
 const rows=[];
 for(const plan of ['claims','normal','farm-material','farm-upgrade']){
  let wins=0,repeatFailures=0,rounds=0,high=0;
  for(let i=0;i<games;i++){
   const r=career(2000+i*19,plan);
   if(r.stage>=2)wins++;
   if(r.repeatFailure)repeatFailures++;
   rounds+=r.round;
   high+=r.highCards?.reduce((x,y)=>x+y,0)||0;
  }
  rows.push({plan,games,chapter2Wins:wins,repeatFailures,
   averageFinalRound:Math.round(rounds/games),
   averageLevel4PlusCardsPerTeam:+(high/games).toFixed(2)});
 }
 return rows;
}
if(require.main===module){
 const games=Math.max(1,Math.min(1000,Number(process.argv[2])||80));
 console.log('Earned-inventory v17.5 offline pacing; scripted humans, unchanged NPC AI:');
 console.log(JSON.stringify(run(games),null,2));
}
module.exports={rng,profile,aiDeck,rebuild,claim,award,purchases,spendCredits,duel,career,run};
