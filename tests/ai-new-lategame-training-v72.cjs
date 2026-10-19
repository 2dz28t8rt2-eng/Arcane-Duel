/* Arcane Duel v7.2: ACTUAL new Level 7–10 card gameplay stress and AI holdouts.
 * 112 legal-by-source CONSTRUCTED (NOT earned) deck configurations.
 * No economy/profile updates and NO deployment of experimental AI.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {STYLES,VARIANTS,roster,makeBenchmarkDeck}=
 require('./helpers/lategame-ai-decks-v72.cjs');
const runtime=boot({seed:72013});
const catalogue=runtime.run(`(()=>({
 cards:CARDS.map(c=>c?({id:c.id,name:c.name,level:c.level,atk:c.atk,
 def:c.def,role:c.role,source:c.source,requiredTier:c.requiredTier,
 hard:c.hard,ace:c.ace,retired:c.retired,enemyOnly:c.enemyOnly,
 essenceMonster:c.essenceMonster,lv1Exclusive:c.lv1Exclusive,
 workshopOnly:c.workshopOnly,fateOnly:c.fateOnly,fusionOnly:c.fusionOnly,
 milestoneOnly:c.milestoneOnly,manifestOf:c.manifestOf,eventOnly:c.eventOnly,
 questOnly:c.questOnly,legendaryOnly:c.legendaryOnly,fate:c.fate}):null),
 defaultDeck:[...DEFAULT_DECK],
 startFusions:[...RPG_START_FUSIONS],
 opponents:RPG_OPPONENTS.map(o=>({level:o.level,loot:[...o.loot]}))
}))()`);
assert.equal(catalogue.cards.length,732,'New 16 late-game cards must be live');
const tiers=[7,8,9,10];
const all=tiers.flatMap(t=>STYLES.flatMap(style=>VARIANTS.map(variant=>
 makeBenchmarkDeck(catalogue,t,style,variant,21))));
assert.equal(all.length,112);
const lateSet=new Set(Array.from({length:16},(_,i)=>716+i));
for(const d of all){
 assert.equal(d.deck.length,40);
 assert.ok(d.fusionDeck.length>=2&&d.fusionDeck.length<=15);
 assert.equal(runtime.run('mainDeckError('+JSON.stringify(d.deck)+')'),'');
 assert.equal(runtime.run('fusionDeckError('+JSON.stringify(d.fusionDeck)+')'),'');
 const eligible=roster(catalogue,d.tier);
 for(const id of [...d.deck,...d.fusionDeck])
  assert.ok(eligible.allowed(catalogue.cards[id]),'Illegal future item '+id+' in '+d.id);
}
const countNew=d=>d.deck.filter(id=>lateSet.has(id)).length;
const coverage=tiers.map(t=>{
 const d=all.filter(x=>x.tier===t),r=roster(catalogue,t);
 return {tier:t,uniqueDecks:new Set(d.map(x=>x.fingerprint)).size,
  constructedDecks:d.length,normalPool:r.normals.length,
  fusionPool:r.fusions.length,levelCap:r.cap,
  newLateGameAvailable:r.normals.filter(x=>lateSet.has(x.id)).length,
  decksUsingNewCards:d.filter(x=>countNew(x)>0).length,
  totalLateCardCopies:d.reduce((sum,x)=>sum+countNew(x),0),
  maxNewCardsInMain:Math.max(...d.map(countNew)),
  maxMainLevel:Math.max(...d.map(x=>x.meta.maxLevel))};
});
for(const x of coverage)
 assert.ok(x.newLateGameAvailable>=4&&x.decksUsingNewCards>=7,
  'No source-unlocked late-game cards for tier '+x.tier);
const stageDecks=all.filter(d=>['balanced','veteran'].includes(d.variant));
const profiles=JSON.parse(fs.readFileSync('docs/ai-evolved-weights-v57.json','utf8')).profiles;
const useWeights=t=>profiles.find(p=>p.tier===t)?.weights;
const policies={predator:'offensive',guardian:'guardian',soul:'guardian',
 fusion:'economy',allrounder:'balanced',tempo:'offensive',hybrid:'balanced'};
const methods=[
 {name:'trained-baseline',weights:null,guard:null},
 {name:'gated-field',weights:{material:.7,board:2.15,tempo:.9,risk:1.3,support:.8,future:.65,ace:10},guard:{guarded:true,margin:3}},
 {name:'gated-survival',weights:{material:1.25,board:1.15,tempo:.5,risk:2.4,support:1.9,future:1.5,ace:10},guard:{guarded:true,margin:3}},
 {name:'gated-balanced',weights:{material:.8,board:1.45,tempo:1.1,risk:1.2,support:1.1,future:.6,ace:10},guard:{guarded:true,margin:5}}
];
let totalDuels=0;
function fight(deck,method,seed,starter){
 const config=methods.find(m=>m.name===method);
 assert.ok(config,'No policy '+method);
 const weights=useWeights(deck.tier);assert.ok(weights);
 const code=`(()=>{
  profile=freshProfile();profile.guideSeen=true;
  // This is a constructed-stress deck and intentionally NOT granted to
  // the player's inventory. createGame supports externally supplied decks.
  ArcaneAiLearning56.setSandbox(${JSON.stringify(weights)},true);
  ArcaneAiLookahead58.setSandbox(null);
  ArcaneAiBranches59.setSandbox(${config.weights?JSON.stringify(config.weights):'null'},
   ${!!config.weights},${JSON.stringify(config.guard)});
  const g=createGame({mode:'pve',context:'tournament',
   opponentId:${deck.tier},seed:${seed},starter:${starter},
   deck:${JSON.stringify(deck.deck)},
   fusionDeck:${JSON.stringify(deck.fusionDeck)},
   difficulty:'easy'});
  const ace=ACE_CARD_IDS[${deck.tier}];
  const aceObserved=new Set(),realApply=applyAiAction;
  applyAiAction=function(battle,action){
   const ok=realApply(battle,action);
   if(ok&&battle===g)for(const c of g.players[1].field)
    if(c&&c.id===ace)aceObserved.add(c.uid);
   return ok;
  };
  let error=null;
  try{simulateGame(g,'${policies[deck.style]}','balanced');}catch(e){error=String(e);}
  applyAiAction=realApply;
  const branch=ArcaneAiBranches59.stats();
  ArcaneAiBranches59.setSandbox(null);ArcaneAiLearning56.setSandbox(null);
  return {winner:g.winner,turns:g.turn,error,
   npcMargin:g.players[1].lp-g.players[0].lp,
   bossAceOnField:aceObserved.size>0,
   scoredBranches:branch.evaluated};
 })()`;
 const r=runtime.run(code,120000);
 if(r.error||![0,1].includes(r.winner))
  throw Error('Constructed benchmark battle failed '+deck.id+': '+r.error);
 return r;
}

function run(tier,method,phase,nseeds){
 const rows=stageDecks.filter(d=>d.tier===tier),results=[];
 for(const d of rows)for(let j=0;j<nseeds;j++)for(const starter of [0,1]){
  const seed=(phase==='train'?720971:8903671)+tier*8513+
   STYLES.indexOf(d.style)*1277+VARIANTS.indexOf(d.variant)*419+
   j*7393;
  results.push(fight(d,method,seed,starter));totalDuels++;
 }
 const avg=k=>Math.round(results.reduce((s,r)=>s+r[k],0)/results.length);
 return {games:results.length,npcWins:results.filter(x=>x.winner===1).length,
  playerWins:results.filter(x=>x.winner===0).length,
  npcMargin:avg('npcMargin'),
  bossAceGames:results.filter(x=>x.bossAceOnField).length,
  choicesEvaluated:results.reduce((s,r)=>s+r.scoredBranches,0)};
}
const testSeeds=Number(process.env.ARCANE_NEW_LATE_HOLDOUT_SEEDS||2);
if(!Number.isInteger(testSeeds)||testSeeds<1||testSeeds>5)
 throw Error('Unsupported holdout seed count');
const stages=[];
for(const tier of tiers){
 const train=methods.map(m=>({name:m.name,...run(tier,m.name,'train',1)}));
 const b=train[0];
 const ranked=train.slice(1).map(row=>({...row,score:
  (row.npcWins-b.npcWins)*5000+(row.npcMargin-b.npcMargin)}))
  .sort((a,b)=>b.score-a.score);
 const winner=ranked[0].npcWins>=b.npcWins+2&&ranked[0].npcMargin>=b.npcMargin
  ?ranked[0].name:'trained-baseline';
 const base=run(tier,'trained-baseline','hold',testSeeds);
 const candidate=winner==='trained-baseline'?base:
  run(tier,winner,'hold',testSeeds);
 const winGain=candidate.npcWins-base.npcWins,
  marginGain=candidate.npcMargin-base.npcMargin;
 const qualified=winner!=='trained-baseline'&&winGain>=3&&marginGain>=0&&
  candidate.bossAceGames>=base.bossAceGames;
 const result={tier,newCardsAvailable:coverage.find(x=>x.tier===tier).newLateGameAvailable,
  train,selectedBeforeHoldout:winner,holdout:{
   baseline:base,candidate,winGain,marginGain,qualified}};
 stages.push(result);
 console.log('ARCANE_NEW_LATE_STAGE_V72 '+JSON.stringify({
  tier,late:result.newCardsAvailable,winner,
  baselineWins:base.npcWins,candidateWins:candidate.npcWins,
  winGain,marginGain,qualified}));
}
const report={schema:'arcane-genuine-card-pool-synthetic-ai-v72',
 notes:['Real cards and unlocked source rules, but theoretical owned copies.',
 'Not a real-earned career audit. No change to player inventories.',
 'Policies selected on one training seed then independently checked on new seeds.',
 'Do NOT auto-deploy; evaluate varied actual career decks before any AI rollout.'],
 allLateCardsAvailableAtX:coverage.find(x=>x.tier===10).newLateGameAvailable,
 cardsAddedToRealGame:0,experimentalAiLive:false,
 configurations:all.length,
 uniqueFingerprints:new Set(all.map(x=>x.fingerprint)).size,
 totalSimulationDuels:totalDuels,coverage,stages,
 generatedDecks:all.map(d=>({id:d.id,tier:d.tier,style:d.style,
  variant:d.variant,main:d.deck,fusions:d.fusionDeck,
  fingerprint:d.fingerprint,lateCardCopies:countNew(d)}))};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-new-16-lategame-training-v72.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_NEW_LATE_SUMMARY_V72 '+JSON.stringify({
 decks:report.configurations,unique:report.uniqueFingerprints,
 duels:totalDuels,coverage,stages:stages.map(x=>({
 tier:x.tier,selected:x.selectedBeforeHoldout,
 winGain:x.holdout.winGain,marginGain:x.holdout.marginGain,
 qualified:x.holdout.qualified}))}));
