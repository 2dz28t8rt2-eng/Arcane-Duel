/* Arcane Duel v7.3: search trained boss policy weights versus new Level-7–10 decks.
 * 112 legal-by-source CONSTRUCTED (NOT earned) deck configurations.
 * No economy/profile updates and NO deployment of experimental AI.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {STYLES,VARIANTS,roster,makeBenchmarkDeck}=
 require('./helpers/lategame-ai-decks-v72.cjs');
const runtime=boot({seed:73013});
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
const tiers=[8,10];
const all=tiers.flatMap(t=>STYLES.flatMap(style=>VARIANTS.map(variant=>
 makeBenchmarkDeck(catalogue,t,style,variant,91))));
assert.equal(all.length,56);
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
const stageDecks=all; // all four variants, independent of the prior 2-variant selection
const profiles=JSON.parse(fs.readFileSync('docs/ai-evolved-weights-v57.json','utf8')).profiles;
const useWeights=t=>profiles.find(p=>p.tier===t)?.weights;
const policies={predator:'offensive',guardian:'guardian',soul:'guardian',
 fusion:'economy',allrounder:'balanced',tempo:'offensive',hybrid:'balanced'};
// Explore legitimate v5.7 scorer weights, preserve ACE priority.
const methods=[
 {name:'trained-baseline',change:{}},
 {name:'press-attack',change:{attack:1.8,tempo:1.4,defense:.75,counter:1.4}},
 {name:'anti-threat',change:{counter:2.4,attack:1.3,defense:.75,tempo:1.1}},
 {name:'sturdy-defense',change:{defense:1.6,counter:1.7,cost:1.2}},
 {name:'fusion-precision',change:{quality:4,cost:.65,tempo:.7}},
 {name:'rapid-pressure',change:{attack:1.45,tempo:2.2,cost:.75,quality:.7}},
 {name:'preserve-cards',change:{cost:2.2,defense:1.15,tempo:.8}},
 {name:'fusion-balanced',change:{attack:1.2,defense:.9,quality:2.8,cost:.65,counter:1.3}}
];
function weightFor(tier,method){
 const old=useWeights(tier),m=methods.find(x=>x.name===method);
 if(!old||!m)throw Error('Unknown policy variant');
 const next={...old};
 for(const [k,v] of Object.entries(m.change))
  next[k]=Math.max(0,Math.min(15,Math.round(old[k]*v*100)/100));
 next.ace=old.ace;
 return next;
}
let totalDuels=0;
function fight(deck,method,seed,starter,mode='real-boss'){
 const config=methods.find(m=>m.name===method);
 assert.ok(config,'No policy '+method);
 const weights=weightFor(deck.tier,method),mirror=mode==='mirror';
 const customEnemy=mirror?{deck:[...deck.deck],fusionDeck:[...deck.fusionDeck],
  power:1,flatBonus:0,enhancements:{}}:null;
 const code=`(()=>{
  profile=freshProfile();profile.guideSeen=true;
  // This is a constructed-stress deck and intentionally NOT granted to
  // the player's inventory. createGame supports externally supplied decks.
  ArcaneAiLearning56.setSandbox(${JSON.stringify(weights)},true);
  ArcaneAiLookahead58.setSandbox(null);ArcaneAiBranches59.setSandbox(null);
  const g=createGame({mode:'pve',context:'tournament',
   opponentId:${deck.tier},seed:${seed},starter:${starter},
   deck:${JSON.stringify(deck.deck)},
   fusionDeck:${JSON.stringify(deck.fusionDeck)},
   difficulty:'easy'${mirror?',enemy:'+JSON.stringify(customEnemy):''}});
  const ace=ACE_CARD_IDS[${deck.tier}];
  const trueBossHasAce=g.players[1].originalDeck.includes(ace)||
   g.players[1].remainingFusion.includes(ace);
  if(${!mirror}&&!trueBossHasAce)throw Error('Real boss missing signature ACE');
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
   bossAceOnField:aceObserved.size>0,trueBossHasAce,
   scoredBranches:branch.evaluated};
 })()`;
 const r=runtime.run(code,120000);
 if(r.error||![0,1].includes(r.winner))
  throw Error('Constructed benchmark battle failed '+deck.id+': '+r.error);
 return r;
}

function run(tier,method,phase,nseeds,mode='real-boss'){
 const rows=stageDecks.filter(d=>d.tier===tier),results=[];
 for(const d of rows)for(let j=0;j<nseeds;j++)for(const starter of [0,1]){
  const seed=(phase==='train'?720971:phase==='confirm'?18379571:8903671)+tier*8513+
   STYLES.indexOf(d.style)*1277+VARIANTS.indexOf(d.variant)*419+
   j*7393;
  results.push(fight(d,method,seed,starter,mode));totalDuels++;
 }
 const avg=k=>Math.round(results.reduce((s,r)=>s+r[k],0)/results.length);
 return {games:results.length,npcWins:results.filter(x=>x.winner===1).length,
  playerWins:results.filter(x=>x.winner===0).length,
  npcMargin:avg('npcMargin'),
  bossAceGames:results.filter(x=>x.bossAceOnField).length,
  choicesEvaluated:results.reduce((s,r)=>s+r.scoredBranches,0)};
}
const trainSeeds=Number(process.env.ARCANE_V73_TRAIN_SEEDS||3);
const testSeeds=Number(process.env.ARCANE_V73_HOLDOUT_SEEDS||6);
if(!Number.isInteger(trainSeeds)||trainSeeds<2||trainSeeds>7)throw Error('Bad training budget');
if(!Number.isInteger(testSeeds)||testSeeds<4||testSeeds>12)
 throw Error('Unsupported holdout seed count');
// This exact candidate was frozen before any of the seeds or new decks
// below were inspected. It is NOT searched on this third confirmation set.
const tier=8,candidate='fusion-precision';
const n=Number(process.env.ARCANE_V73_CONFIRM_SEEDS||8);
if(!Number.isInteger(n)||n<5||n>12)
 throw Error('Independent confirmation needs 5..12 novel seeds');
const before=run(tier,'trained-baseline','confirm',n,'real-boss');
const after=run(tier,candidate,'confirm',n,'real-boss');
const extraWins=after.npcWins-before.npcWins,extraLP=after.npcMargin-before.npcMargin;
const acePreserved=after.bossAceGames>=before.bossAceGames;
const approvedForFutureConsideration=extraWins>=8&&extraLP>=0&&acePreserved;
const report={schema:'independent-frozen-fusion-precision-stage-VIII-v73',
 sourceKind:'CONSTRUCTED_SOURCES_LEGAL_NOT_TRULY_EARNED',
 frozenCandidate:candidate,
 independentDeckGeneratorSeed:91,
 independentBattleSeedStart:18379571,
 comparisonDecks:stageDecks.filter(x=>x.tier===8).length,
 eachDeckSeeds:n,starterChoices:2,
 original:before,modified:after,
 extraWins,extraLP,acePreserved,approvedForFutureConsideration,
 productionDeployment:false,
 notes:['No parameter tuned on these results.',
 'Third seed family is disjoint from v7.3 training and holdout.',
 'Uses previously eligible game cards, hypothetical copies not real player inventory.',
 'A stronger Boss VIII must also satisfy actual career difficulty before deployment.',
 'Boss ACE is the true curated opponent signature, not a mirrored synthetic deck.']};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-frozen-boss-viii-confirmation-v73.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_BOSS_VIII_FROZEN_CONFIRM_V73 '+JSON.stringify({games:totalDuels,
 decks:report.comparisonDecks,seeds:n,candidate,
 baselineWins:before.npcWins,candidateWins:after.npcWins,
 extraWins,extraLP,oldAceGames:before.bossAceGames,
 candidateAceGames:after.bossAceGames,approvedForFutureConsideration,
 byStyle:after.byStyle}));
