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
 makeBenchmarkDeck(catalogue,t,style,variant,73))));
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
const stageDecks=all.filter(d=>['balanced','veteran'].includes(d.variant));
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
  const seed=(phase==='train'?720971:8903671)+tier*8513+
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
const stages=[];
for(const tier of tiers){
 // Real boss VIII; X mirror tests tactical weights without saturated 100% real wins.
 const mode=tier===10?'mirror':'real-boss';
 const train=methods.map(m=>({name:m.name,...run(tier,m.name,'train',trainSeeds,mode)}));
 const b=train[0];
 const ranked=train.slice(1).map(row=>({...row,score:
  (row.npcWins-b.npcWins)*5000+(row.npcMargin-b.npcMargin)}))
  .sort((a,b)=>b.score-a.score);
 const winner=ranked[0].npcWins>=b.npcWins+2&&ranked[0].npcMargin>=b.npcMargin
  ?ranked[0].name:'trained-baseline';
 const base=run(tier,'trained-baseline','hold',testSeeds,mode);
 const candidate=winner==='trained-baseline'?base:
  run(tier,winner,'hold',testSeeds,mode);
 const winGain=candidate.npcWins-base.npcWins,
  marginGain=candidate.npcMargin-base.npcMargin;
 // Mirror wins alone are NEVER a sufficient reason to alter the real X boss.
 const qualified=mode==='real-boss'&&winner!=='trained-baseline'&&
  winGain>=4&&marginGain>=0&&candidate.bossAceGames>=base.bossAceGames;
 const realX=tier===10?(()=>{
  const old=run(tier,'trained-baseline','hold',testSeeds,'real-boss');
  const next=winner==='trained-baseline'?old:
   run(tier,winner,'hold',testSeeds,'real-boss');
  return {baseline:old,candidate:next,
   winGain:next.npcWins-old.npcWins,marginGain:next.npcMargin-old.npcMargin,
   acePreserved:next.bossAceGames>=old.bossAceGames};
 })():null;
 const result={tier,mode,newCardsAvailable:coverage.find(x=>x.tier===tier).newLateGameAvailable,
  train,selectedBeforeHoldout:winner,holdout:{
   baseline:base,candidate,winGain,marginGain,qualified},realX};
 stages.push(result);
 console.log('ARCANE_FOCUSED_BOSS_STAGE_V73 '+JSON.stringify({
  tier,late:result.newCardsAvailable,winner,
  baselineWins:base.npcWins,candidateWins:candidate.npcWins,
  winGain,marginGain,qualified,
  authenticX:realX&&{baseWins:realX.baseline.npcWins,
   candidateWins:realX.candidate.npcWins,aceOld:realX.baseline.bossAceGames,
   aceNew:realX.candidate.bossAceGames,marginGain:realX.marginGain}}));
}
const report={schema:'arcane-focused-boss-policy-optimizer-v73',
 notes:['Real cards and unlocked source rules, but theoretical owned copies.',
 'Not a real-earned career audit. No change to player inventories.',
 'Eight scorer variants trained on independent seeds, and then held out.',
 'X mirror is a diagnostic, not genuine ACE boss. X true boss separately audited.',
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
fs.writeFileSync('artifacts/ai-focused-boss-v73.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_FOCUSED_BOSS_SUMMARY_V73 '+JSON.stringify({
 decks:report.configurations,unique:report.uniqueFingerprints,
 duels:totalDuels,coverage,stages:stages.map(x=>({
 tier:x.tier,selected:x.selectedBeforeHoldout,
 winGain:x.holdout.winGain,marginGain:x.holdout.marginGain,
 qualified:x.holdout.qualified,
 trueBossXWins:x.realX?.baseline.npcWins??null}))}));
