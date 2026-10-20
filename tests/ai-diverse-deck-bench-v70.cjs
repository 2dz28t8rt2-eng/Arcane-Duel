/* Arcane Duel 7.0 – validate + run DIVERSE constructed high-tier decks.
 * Explicitly separate tactical stress sets from legitimately earned careers.
 * All cards are existing in-game cards; no new designs or save changes.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {STYLES,VARIANTS,roster,makeBenchmarkDeck}=
 require('./helpers/diverse-benchmark-decks-v70.cjs');
const levels=[7,8,9,10],runtime=boot({seed:70013});
const catalogue=runtime.run(`(()=>{const p=freshProfile();return {
 cards:CARDS.map(c=>c?({id:c.id,name:c.name,level:c.level,atk:c.atk,
 def:c.def,role:c.role,source:c.source,hard:c.hard,ace:c.ace,
 retired:c.retired,enemyOnly:c.enemyOnly,essenceMonster:c.essenceMonster,
 lv1Exclusive:c.lv1Exclusive,workshopOnly:c.workshopOnly,fateOnly:c.fateOnly,
 fusionOnly:c.fusionOnly,milestoneOnly:c.milestoneOnly,
 manifestOf:c.manifestOf,eventOnly:c.eventOnly,
 questOnly:c.questOnly,legendaryOnly:c.legendaryOnly,fate:c.fate}):null),
 defaultDeck:[...DEFAULT_DECK],startFusions:[...RPG_START_FUSIONS],
 opponents:RPG_OPPONENTS.map(o=>({level:o.level,loot:[...o.loot]})),
 starterOwned:p.inventory};})()`);
// Catalogue audit: separate "not in this reward pool" from "not in game".
const nonSpecial=c=>c&&Number.isInteger(c.id)&&!c.fusionOnly&&
 !c.retired&&!c.hard&&!c.ace&&!c.enemyOnly&&!c.essenceMonster&&
 !c.lv1Exclusive&&!c.workshopOnly&&!c.fateOnly&&!c.milestoneOnly&&
 !c.eventOnly&&!c.questOnly&&!c.legendaryOnly&&!c.fate&&
 (c.manifestOf===null||c.manifestOf===undefined);
const regularNormals=catalogue.cards.filter(nonSpecial);
const allSeenDrops=new Set(catalogue.opponents.flatMap(o=>o.loot));
const topRoster=roster(catalogue,10);
const audit={
 totalCardDefinitions:catalogue.cards.filter(Boolean).length,
 nonSpecialNormalCards:regularNormals.length,
 nonSpecialNormalByLevel:Object.fromEntries(Array.from({length:10},(_,i)=>[
  i+1,regularNormals.filter(c=>c.level===i+1).length])),
 highLevelRegularNormals:regularNormals.filter(c=>c.level>=7).length,
 highLevelExamples:regularNormals.filter(c=>c.level>=7).slice(0,15)
  .map(c=>({id:c.id,level:c.level,name:c.name,source:c.source,
    includedInAnyOpponentLoot:allSeenDrops.has(c.id)})),
 lateStagePreviousLootNormalCount:topRoster.normals.length,
 lateStagePreviousLootMaxNormalLevel:Math.max(...topRoster.normals.map(c=>c.level)),
 lateStagePreviousLootFusionTemplates:topRoster.fusions.length,
 normalCardsNotInPreviousOpponentRewardSet:regularNormals.filter(
  c=>!topRoster.allowed(c)).length
};
const all=[];
for(const tier of levels)for(const style of STYLES)for(const variant of VARIANTS)
 all.push(makeBenchmarkDeck(catalogue,tier,style,variant,7));
assert.equal(all.length,112);
const expected=JSON.parse(fs.readFileSync('docs/ai-evolved-weights-v57.json','utf8'));
const useWeights=tier=>expected.profiles.find(x=>x.tier===tier)?.weights;
for(const d of all){
 assert.equal(d.deck.length,40);assert.ok(d.fusionDeck.length>=2&&d.fusionDeck.length<=15);
 assert.ok(d.meta.reachableFusionTemplates>=2,'Unplayable fusion pool '+d.id);
 assert.equal(runtime.run('mainDeckError('+JSON.stringify(d.deck)+')'),'','Illegal main deck '+d.id);
 assert.equal(runtime.run('fusionDeckError('+JSON.stringify(d.fusionDeck)+')'),'','Illegal fusion deck '+d.id);
 const r=roster(catalogue,d.tier);
 for(const id of [...d.deck,...d.fusionDeck]){
  assert.ok(r.allowed(catalogue.cards[id]),'Current/future/quest-locked card '+id+' at '+d.id);
 }
}
const coverage=levels.map(tier=>{
 const cards=all.filter(d=>d.tier===tier),r=roster(catalogue,tier);
 return {tier,existingSourceLegalNormalCards:r.normals.length,
  existingSourceLegalFusionTemplates:r.fusions.length,
  constructedDeckCount:cards.length,
  uniqueMainFingerprints:new Set(cards.map(d=>d.deck.slice().sort((a,b)=>a-b).join(','))).size,
  uniqueFullDecks:new Set(cards.map(d=>d.fingerprint)).size,
  mainLevelRange:[Math.min(...cards.map(d=>d.meta.maxLevel)),
   Math.max(...cards.map(d=>d.meta.maxLevel))],
  maxMainLevel:r.cap,
  meanStarterCopies:Math.round(cards.reduce((s,d)=>s+d.meta.starterCopies,0)/cards.length),
  roles:STYLES};
});
for(const c of coverage)assert.ok(c.uniqueFullDecks>=10,
 'Insufficient tactical deck diversity at stage '+c.tier);
const trials=Number(process.env.ARCANE_DIVERSE_TRIALS_PER_DECK||2);
if(!Number.isInteger(trials)||trials<1||trials>5)throw Error('Invalid trial budget');
const evaluate=process.env.ARCANE_DIVERSE_VALIDATE_ONLY!=='1';
const scenarios=[];
const policies={predator:'offensive',guardian:'guardian',soul:'guardian',
 fusion:'economy',allrounder:'balanced',tempo:'offensive',hybrid:'balanced'};
const better={material:1.25,board:1.15,tempo:.5,risk:2.4,support:1.9,future:1.5,ace:10};
function fight(deck,config,seed,starter){
 const weights=useWeights(deck.tier);assert.ok(weights);
 const code=`(()=>{
  profile=freshProfile();profile.guideSeen=true;
  // This is a constructed-stress deck and intentionally NOT granted to
  // the player's inventory. createGame supports externally supplied decks.
  ArcaneAiLearning56.setSandbox(${JSON.stringify(weights)},true);
  ArcaneAiLookahead58.setSandbox(null);
  ArcaneAiBranches59.setSandbox(${config?JSON.stringify(better):'null'},
   ${config},{guarded:true,margin:3});
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
if(evaluate)for(const d of all)for(let n=0;n<trials;n++){
 const seed=7001821+d.tier*13391+STYLES.indexOf(d.style)*1597+
  VARIANTS.indexOf(d.variant)*367+n*719;
 const starter=n%2;
 // Baseline and challenger get the same constructed deck, RNG seed
 // and start order, but only the NPC's sandbox decision logic differs.
 for(const option of ['baseline','guarded-survival']){
  scenarios.push({tier:d.tier,style:d.style,variant:d.variant,
   fingerprint:d.fingerprint,seed,starter,option,
   ...fight(d,option==='guarded-survival',seed,starter)});
 }
}
const summary=coverage.map(c=>{
 const trials=scenarios.filter(x=>x.tier===c.tier);
 const per=option=>{
  const rows=trials.filter(x=>x.option===option),n=rows.length;
  return {games:n,
   npcWins:rows.filter(x=>x.winner===1).length,
   playerWins:rows.filter(x=>x.winner===0).length,
   averageNPCMinusPlayerLP:n?Math.round(rows.reduce((s,r)=>s+r.npcMargin,0)/n):null,
   gamesWithBossACE:rows.filter(x=>x.bossAceOnField).length};
 };
 const old=per('baseline'),next=per('guarded-survival');
 return {...c,control:old,candidate:next,
  npcWinChange:next.npcWins-old.npcWins,
  npcMarginChange:(next.averageNPCMinusPlayerLP??0)-(old.averageNPCMinusPlayerLP??0)};
});
const report={schema:'arcane-constructed-diverse-tournament-decks-v70',
 catalogueAudit:audit,
 label:'SYNTHETIC_CONSTRUCTED_NOT_EARNED',
 noCardsAdded:true,mainBranchUnchanged:true,actualCareerData:false,
 userInventoriesUntouched:true,decks:all.length,
 decksUnique:new Set(all.map(d=>d.fingerprint)).size,
 matchCount:scenarios.length,trialsPerDeck:trials,
 stages:summary,
 warnings:['Hypothetical copies of earlier obtainable rewards; NO proof of drop rates or owner inventory.',
  'No new cards are needed for this controlled decision stress test.',
  'For conclusions about real progression, pair with actual won/rewarded career profiles.',
  'Result is a fixed challenger diagnostic, NOT an independently selected and tested trained champion.'],
 // Numeric IDs and source descriptions enable future reproducibility.
 entries:all};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-constructed-training-decks-v70.json',
 JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_CONSTRUCTED_V70_SUMMARY '+JSON.stringify({decks:report.decks,
 unique:report.decksUnique,matches:report.matchCount,
 catalogueAudit:audit,stages:summary}));
