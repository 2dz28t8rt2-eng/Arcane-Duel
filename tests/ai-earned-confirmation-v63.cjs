/* Arcane Duel 6.3 – heldout AI evaluation with genuinely earned career decks.
 * Input comes from real simulations of rewardMatch/booster/milestone actions,
 * not from freely assembled synthetic inventories. Policy candidates are
 * chosen by training-seed performance; entirely new holdout seeds confirm.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {boot}=require('./helpers/game-runtime.cjs');
const input=JSON.parse(fs.readFileSync('artifacts/ai-real-careers-v63.json','utf8'));
const testN=Number(process.env.ARCANE_CAREER_TRAIN_SEEDS||3);
const holdN=Number(process.env.ARCANE_CAREER_HOLDOUT_SEEDS||5);
if(!Number.isInteger(testN)||testN<2||testN>12||
 !Number.isInteger(holdN)||holdN<3||holdN>20)throw Error('Invalid test cohort size');
assert.ok(input.stageSnapshots>0);
const prev=JSON.parse(fs.readFileSync('docs/ai-evolved-weights-v57.json','utf8')).profiles;
const vm=boot({seed:632211});
const methods=[
 {name:'trained-v57',params:null,gate:null},
 {name:'gated-field',params:{material:.7,board:2.15,tempo:.9,risk:1.3,
  support:.8,future:.65,ace:10},gate:{guarded:true,margin:3}},
 {name:'gated-survival',params:{material:1.25,board:1.15,tempo:.5,risk:2.4,
  support:1.9,future:1.5,ace:10},gate:{guarded:true,margin:3}},
 {name:'fusion-preservation',params:{material:1.25,board:1.15,tempo:.5,risk:2.4,
  support:1.9,future:1.5,ace:10},gate:{guarded:true,margin:3,fusionPremium:5}}
];
const roles=['balanced','offensive','guardian'];
const sort=rows=>rows.sort((a,b)=>(a.tier-b.tier)||a.careerId-b.careerId);
const snapshots=sort([...input.entries]);
let games=0;
function run(snapshot,method,seed,starter,playerPolicy){
 const expected=prev.find(x=>x.tier===snapshot.tier)?.weights;
 assert.ok(expected,'Training weights missing for opponent '+snapshot.tier);
 const expr=`(()=>{
  profile=${JSON.stringify(snapshot.profile)};
  // This is a copy of a completed REAL sequence of rewards; never advance
  // or add player inventory between the paired comparison branches.
  const own=profile.inventory,main=profile.activeDeck,fusions=profile.fusionDeck;
  const count=(cards)=>{const result={};for(const id of cards)result[id]=(result[id]||0)+1;
   return Object.entries(result).every(([id,n])=>n<=(own[id]||0));};
  if(!count(main)||!count(fusions)||mainDeckError(main)||fusionDeckError(fusions))
   throw Error('Invalid earned snapshot deck');
  if(profile.cleared.includes(${snapshot.tier}))
   throw Error('Test snapshot already defeated current opponent');
  if(${snapshot.tier}>1&&!profile.cleared.includes(${snapshot.tier-1}))
   throw Error('Test opponent is not legitimately unlocked');
  ArcaneAiLearning56.setSandbox(${JSON.stringify(expected)},true);
  ArcaneAiLookahead58.setSandbox(null);
  ArcaneAiBranches59.setSandbox(${JSON.stringify(method.params)},${!!method.params},
   ${JSON.stringify(method.gate)});
  const g=createGame({mode:'pve',context:'tournament',opponentId:${snapshot.tier},
   id:'earned-comparison-v63-${seed}-${starter}',
   starter:${starter},seed:${seed},difficulty:'easy',
   deck:[...main],fusionDeck:[...fusions],enhancements:profile.enhancements});
  const ace=ACE_CARD_IDS[${snapshot.tier}],seen=new Set();
  const original=applyAiAction;
  applyAiAction=function(duel,action){
   const ok=original(duel,action);
   if(ok&&duel===g)for(const card of g.players[1].field)
    if(card&&card.id===ace)seen.add(card.uid);
   return ok;
  };
  let error=null;
  try{simulateGame(g,'${playerPolicy}','balanced');}catch(e){error=String(e);}
  applyAiAction=original;
  const stats=ArcaneAiBranches59.stats();
  ArcaneAiBranches59.setSandbox(null);ArcaneAiLearning56.setSandbox(null);
  return {winner:g.winner,error,turns:g.turn,lpMargin:g.players[1].lp-g.players[0].lp,
   aceSummoned:seen.size,opponentAceIsReal:g.players[1].remainingFusion.includes(ace)||
    g.players[1].originalDeck.includes(ace),branches:stats.evaluated,
   cardsUnchanged:count(main)&&count(fusions)};
 })()`;
 const r=vm.run(expr,120000);games++;
 if(r.error||![0,1].includes(r.winner)||!r.cardsUnchanged)
  throw Error('Earned profile match failure '+snapshot.tier+': '+r.error);
 return r;
}
function testCohort(tier,policy,seeds,phase){
 const rows=snapshots.filter(x=>x.tier===tier),results=[];
 for(const snapshot of rows)for(const playerPolicy of roles)
  for(let index=0;index<seeds;index++)for(const starter of [0,1]){
   const seed=(phase==='confirm'?49274319:phase==='train'?2133981:8673911)+tier*89131+
    snapshot.careerId*1311+roles.indexOf(playerPolicy)*761+index*3701;
   results.push({career:snapshot.careerId,style:playerPolicy,starter,
    ...run(snapshot,policy,seed,starter,playerPolicy)});
  }
 const count=results.length,sum=k=>results.reduce((v,x)=>v+x[k],0);
 return {games:count,npcWins:results.filter(x=>x.winner===1).length,
  avgLP:Math.round(sum('lpMargin')/count),
  avgTurns:Math.round(sum('turns')/count*10)/10,
  confirmedAceSummons:sum('aceSummoned'),
  gamesWithAce:results.filter(x=>x.aceSummoned>0).length,
  byStageInventory:rows.map(s=>({careerId:s.careerId,
   playerLevel:s.playerLevel,ownedUnique:Object.keys(s.inventoryOwned).length,
   boosts:s.boostersPurchased}))};
}
/* Fixed policy and tier prior to this completely separate control seed set */
const tier=2;
const baseline=methods.find(x=>x.name==='trained-v57');
const candidate=methods.find(x=>x.name==='gated-field');
const sample=snapshots.filter(x=>x.tier===tier);
assert.ok(sample.length>=3,'At least three earned inventories required');
function fp(s){return crypto.createHash('sha256').update(JSON.stringify({
 main:[...s.activeDeck].sort((a,b)=>a-b),
 fusion:[...s.fusionDeck].sort((a,b)=>a-b),
 upgrades:s.profile.upgrades,enhancements:s.enhancements
})).digest('hex');}
const families=Object.groupBy(sample,s=>fp(s)),unique=Object.keys(families);
const fixedCount=Number(process.env.ARCANE_CAREER_CONFIRM_SEEDS||12);
if(!Number.isInteger(fixedCount)||fixedCount<6||fixedCount>25)
 throw Error('Bad confirmation seed budget');
const base=testCohort(tier,baseline,fixedCount,'confirm');
const challenger=testCohort(tier,candidate,fixedCount,'confirm');
const report={schema:'arcane-stage2-real-career-confirmation-v63',
 fixedBeforeRun:true,policy:'gated-field',comparison:'trained-v57',
 tier,profiles:sample.length,uniqueDeckAndUpgradeFingerprints:unique.length,
 duplicateCountByFingerprint:Object.fromEntries(Object.entries(families).map(([k,arr])=>[k,arr.length])),
 confirmationSeedCohort:'49274319 + tier and role offsets (not used in training/holdout)',
 runs:games,baseline:base,candidate:challenger,
 winGain:challenger.npcWins-base.npcWins,
 avgLPGain:challenger.avgLP-base.avgLP,
 aceGameGain:challenger.gamesWithAce-base.gamesWithAce,
 cautions:['Real earned decks from scripted careers, not human account data.',
  'Career runs may contain repeated opening-stage decks.',
  'Paired seed/starter comparisons, but not a symmetric PvP ruleset.',
  'No automatic live promotion; more stages/skill groups still need evaluation.']};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-earned-confirmation-v63.json',
 JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_EARNED_CONFIRMATION_V63 '+JSON.stringify({
 games,stage:tier,profiles:sample.length,uniqueDecks:unique.length,
 baselineWins:base.npcWins,trainedWins:challenger.npcWins,
 winGain:report.winGain,avgLPGain:report.avgLPGain,
 aceGameGain:report.aceGameGain,
 baseAceRate:base.gamesWithAce+'/'+base.games,
 candidateAceRate:challenger.gamesWithAce+'/'+challenger.games
}));
