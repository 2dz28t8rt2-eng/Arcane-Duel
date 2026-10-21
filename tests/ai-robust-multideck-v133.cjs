'use strict';
/* Arcane Duel v13.3: train a robust policy over source-legal, constructed
 * multi-archetype decks against IX and X, then validate against VII/IX/X.
 * Historical v13.1 model and v13.2 frozen policy loaded from GitHub artifacts.
 * No earned-inventory claims, no production changes, no holdout-based selection.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {summonPolicySource}=require('./helpers/ai-pre-attack-v92.cjs');
const {ruleFeatureSource}=require('./helpers/ai-rule-features-v130.cjs');
const {STYLES,roster,makeBenchmarkDeck}=require('./helpers/lategame-ai-decks-v72.cjs');
const old=JSON.parse(fs.readFileSync('artifacts/v132/ai-ix-x-trained-policy-v132.json','utf8'));
const prior=JSON.parse(fs.readFileSync('artifacts/v131/ai-rule-model-v131.json','utf8'));
assert.equal(old.schema,'arcane-ix-x-policy-v132');
assert.equal(old.trained,true);
assert.equal(old.productionActive,false);
assert.equal(prior.schema,'arcane-tactical-reward-model-v131');
assert.equal(prior.trained,true);
assert.equal(prior.weights.length,16);
const baseline=old.coefficients;
assert.equal(Object.keys(baseline).length,14);
const extracted=boot({seed:133000,x128Mode:'full'}).run(String.raw`(()=>({
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
const catalogue=extracted;
const catalogueVM=boot({seed:133001});
function testDeck(deck){
 assert.equal(deck.deck.length,40);
 assert.ok(deck.fusionDeck.length>=2&&deck.fusionDeck.length<=15);
 assert.equal(catalogueVM.run('mainDeckError('+JSON.stringify(deck.deck)+')'),'');
 assert.equal(catalogueVM.run('fusionDeckError('+JSON.stringify(deck.fusionDeck)+')'),'');
 const eligible=roster(catalogue,deck.tier);
 for(const id of [...deck.deck,...deck.fusionDeck])assert.ok(eligible.allowed(catalogue.cards[id]),
  'Future-locked or non-source card in deck '+deck.id+': '+id);
}

function isSignature132(c,g){return !!c&&(!!CARDS[c.id]?.ace||c.id===OPPONENTS[g.opponentId]?.signature);}
function role132(c){return (c?.roleOverride||CARDS[c?.id]?.role||'').toLowerCase();}
function score132(g,w,stat){
 if(g.active!==0||g.winner!==null||g.pending)return null;
 const me=g.players[0],foe=g.players[1],enemy=foe.field.filter(Boolean),my=me.field.filter(Boolean);
 const hostile=enemy.map(c=>({c,stat:dataOf(c),role:role132(c)}));
 const aceOnBoard=hostile.filter(x=>isSignature132(x.c,g));
 if(aceOnBoard.length)stat.aceObservations++;
 const maxThreat=Math.max(0,...hostile.map(x=>x.c.mode==='def'?x.stat.def:x.stat.atk));
 const aceThreat=Math.max(0,...aceOnBoard.map(x=>x.stat.atk));
 const free=me.field.findIndex(c=>!c);

 // Actual fusionOptions and canCompleteHandFusion are used as legal-action guards.
 // Stats are estimates, not unseen RNG predictions.
 if(g.aiPhase==='summon'&&!g.summoned&&free>=0){
  const hand=me.hand.filter(c=>!isFateCard(c));
  if(!hand.length)return null;
  const normals=hand.map(c=>{
   const d=dataOf(c),r=role132(c);
   const power=d.atk/1000,def=d.def/1000;
   const survives=d.def>=maxThreat;
   const countersAce=aceThreat>0&&d.atk>Math.max(...aceOnBoard.map(x=>x.stat.def));
   const quality=power+w.defenseWeight*def+w.tempoWeight*(survives?1:0)
    +w.aceReach*(isSignature132(c,g)?1:0)
    +w.aceThreat*(countersAce?1:0)
    -w.decayWeight*creatureDecayRate(g,c,0)/1000
    +(r==='guardian'||r==='soul'?0.08*w.defenseWeight:0);
   return {score:quality,action:{type:'normal',uid:c.uid},source:'normal'};
  });
  let best=normals.sort((a,b)=>b.score-a.score)[0];
  const limit=5;
  let considered=0;
  for(let mask=1;mask<(1<<Math.min(limit,hand.length));mask++){
   const chosen=hand.filter((c,i)=>(mask&(1<<i))!==0);
   if(chosen.length<2||chosen.length>5)continue;
   const levels=chosen.map(c=>dataOf(c).level);
   const options=fusionOptions(g,levels,chosen)
    .filter(t=>me.remainingFusion.includes(t.id)&&canCompleteHandFusion(g,levels,t.id));
   for(const card of options){
    considered++;
    const expectedAtk=baseStat(card,'atk',me),expectedDef=baseStat(card,'def',me);
    const strongest=Math.max(...chosen.map(c=>dataOf(c).atk));
    const sacrifice=chosen.reduce((n,c)=>n+dataOf(c).atk,0)-strongest;
    const survives=expectedDef>=maxThreat;
    const counterAce=aceThreat>0&&expectedAtk>Math.max(...aceOnBoard.map(x=>x.stat.def));
    const isAce=!!card.ace||card.id===OPPONENTS[g.opponentId]?.signature;
    const quality=expectedAtk/1000+w.defenseWeight*expectedDef/1000
     +w.tempoWeight*(survives?1:0)
     +w.aceReach*(isAce?1:0)
     +w.aceThreat*(counterAce?1:0)
     +w.fusionBias
     +Math.min(4,qualityRolls(levels))*w.qualityWeight
     -w.materialTax*sacrifice/1000
     -w.cardTax*(chosen.length-1)
     -w.decayWeight*(ASCENSION_DECAY_BY_LEVEL[Math.max(1,Math.min(10,card.level))]||0)/1000;
    if(quality>best.score){
     best={score:quality,action:{type:'fusion',uids:chosen.map(c=>c.uid),choice:card.id},source:'fusion'};
    }
   }
  }
  stat.fusionOffers+=considered;
  if(best.source==='fusion')stat.fusions++;
  else stat.normals++;
  g.aiPhase='positions';return best.action;
 }

 if(g.aiPhase==='positions'){
  // Avoid arbitrary stance switching: only take a stance with clear tactical value.
  // Choosing a defense protects a valuable unit when visible enemy ATK threatens it.
  for(let i=0;i<me.field.length;i++){
   const c=me.field[i];if(!c||c.switched||c.attacked||c.mode!=='atk')continue;
   const d=dataOf(c),threat=Math.max(0,...enemy.filter(t=>t.mode==='atk').map(t=>dataOf(t).atk));
   const myCanKill=enemy.some(t=>effectiveAttack(g,c,t)>(t.mode==='def'?dataOf(t).def:dataOf(t).atk));
   const danger=threat>d.atk&&d.def>threat&&(role132(c)==='guardian'||role132(c)==='soul');
   if(danger&&!myCanKill&&w.guardWeight>0.5){
    stat.guards++;
    return {type:'switch',idx:i};
   }
  }
  return null;
 }

 if(g.aiPhase!=='attacks'||g.turn===1)return null;
 const attacks=tacticalRuleFeatures(g).legalAttacks;
 if(!attacks.length)return null;
 const ready=me.field.filter(c=>c&&canAttack(g,c)).length;
 let best=null,top=-Infinity;
 for(const a of attacks){
  const mine=me.field[a.from],target=a.to===null?null:foe.field[a.to];
  if(!mine||(a.to!==null&&!target))continue;
  const own=dataOf(mine),value=effectiveAttack(g,mine,target);
  const wall=target?(target.mode==='def'?dataOf(target).def:dataOf(target).atk):0;
  const kill=target&&value>wall,trade=target&&target.mode==='atk'&&value===wall;
  const lose=target&&target.mode==='atk'&&value<=wall;
  const direct=a.to===null;
  const ace=target&&isSignature132(target,g);
  const win=direct&&value>=foe.lp+foe.shield;
  const cardWorth=target?(dataOf(target).atk*.6+dataOf(target).def*.3)/1000:0;
  const badBlock=target&&target.mode==='def'&&value<=wall;
  let utility=(direct?value/1100:0)
   +(kill?1.2+cardWorth:0)
   +(trade?0.2:0)
   -(lose?w.attackRisk*(own.atk/1000+0.8):0)
   -(badBlock?w.attackRisk*(wall-value)/1100+0.7:0)
   +(ace&&kill?w.aceThreat*2.5:0)
   +(win?100:0)
   +(ready>=2&&kill?w.futureWeight*.5:0)
   -(target&&!kill&&!trade?.25:0);
  // Carry forward the genuinely fitted previous-run attack-value model.
  const field=me.field.filter(Boolean),other=foe.field.filter(Boolean);
  const maxEnemy=Math.max(0,...other.map(c=>dataOf(c).atk));
  const atk=own.atk,role=role132(mine),targetRole=role132(target);
  const vec=[
   1,atk/3000,wall/3000,Math.max(-2,Math.min(2,(atk-wall)/3000)),
   target?1:0,target?.mode==='def'?1:0,field.length/5,other.length/5,
   Math.min(2,me.lp/10000),Math.min(2,foe.lp/10000),maxEnemy/3000,
   Math.min(1,(own.level||1)/10),mine.fusion?1:0,
   (role.includes('soul')||role.includes('seelen'))?1:0,
   (targetRole.includes('soul')||targetRole.includes('seelen'))?1:0,
   direct&&atk>=foe.lp?1:0
  ];
  utility+=w.priorWeight*vec.reduce((n,v,i)=>n+v*(V132_PRIOR[i]||0),0);
  if(utility>top){top=utility;best={type:'attack',ai:a.from,di:a.to};}
 }
 stat.attacksConsidered+=attacks.length;
 if(best&&top>=w.attackFloor){stat.attacksChosen++;if(best.di!==null&&isSignature132(foe.field[best.di],g))stat.aceTargets++;return best;}
 // Exit instead of forcing costly attack. Real game applies end-of-turn and decay.
 stat.skips++;g.aiPhase='guard';return {type:'end'};
}
function init132(){return {normals:0,fusions:0,fusionOffers:0,attacksConsidered:0,attacksChosen:0,aceTargets:0,aceObservations:0,guards:0,skips:0,invalid:0,steps:0};}


const injected=[isSignature132,role132,score132,init132].map(f=>f.toString()).join('\n');
const trainStyles=['predator','guardian','fusion','hybrid'];
const trainVariants=['balanced','veteran'];
const holdoutVariants=['starter-heavy','specialist'];
const trainRepeat=Number(process.env.ARCANE_V133_TRAIN_REPEAT||1);
const holdRepeat=Number(process.env.ARCANE_V133_HOLDOUT_REPEAT||2);
const numCandidates=Number(process.env.ARCANE_V133_CANDIDATES||12);
assert.ok(Number.isInteger(trainRepeat)&&trainRepeat>=1&&trainRepeat<=3);
assert.ok(Number.isInteger(holdRepeat)&&holdRepeat>=1&&holdRepeat<=4);
assert.ok(Number.isInteger(numCandidates)&&numCandidates>=3&&numCandidates<=20);
function scenario(tier,style,variant,rep,split){
 const id=STYLES.indexOf(style),v=split==='train'?
  trainVariants.indexOf(variant):holdoutVariants.indexOf(variant);
 assert.ok(id>=0&&v>=0);
 // Training and evaluation use different deck generation seeds, actual
 // shuffled duel RNG seeds, deck variants and played opponents.
 const deckSeed=split==='train'?1100+id*167+rep*13+v*71:
   7100+id*191+rep*29+v*103;
 const d=makeBenchmarkDeck(catalogue,tier,style,variant,deckSeed);
 testDeck(d);
 const seed=split==='train'?133000+tier*1019+id*111+v*41+rep*37:
   333000+tier*1031+id*191+v*47+rep*71;
 return {tier,style,variant,rep,split,deck:d,seed,
  difficulty:v===0?'easy':'hard',
  starter:(id+v+rep)%2};
}
const training=[];
for(const tier of [9,10])
 for(const style of trainStyles)
  for(const variant of trainVariants)
   for(let i=0;i<trainRepeat;i++)
    training.push(scenario(tier,style,variant,i,'train'));
const holdout=[];
for(const tier of [7,9,10])
 for(const style of STYLES)
  for(const variant of holdoutVariants)
   for(let i=0;i<(tier===7?1:holdRepeat);i++)
    holdout.push(scenario(tier,style,variant,i,'holdout'));
const trainFingerprints=new Set(training.map(s=>s.deck.fingerprint));
assert.ok(!holdout.some(s=>trainFingerprints.has(s.deck.fingerprint)),'Train/holdout deck fingerprint overlap');
assert.equal(new Set(training.map(x=>x.seed)).size,training.length);
assert.equal(new Set(holdout.map(x=>x.seed)).size,holdout.length);
const fingerprintSummary={
 trainDecks:training.length,
 uniqueTrainingDecks:trainFingerprints.size,
 holdoutDecks:holdout.length,
 uniqueHoldoutDecks:new Set(holdout.map(x=>x.deck.fingerprint)).size,
 trainVariants,holdoutVariants,
 stageLegalConstructedNotEarned:true
};
function duel(s,mode,weights){
 const vm=boot({seed:s.seed+17,x128Mode:'full'});
 vm.exec(summonPolicySource);vm.exec(ruleFeatureSource);vm.exec(injected);
 vm.exec('var V132_PRIOR='+JSON.stringify(prior.weights)+';var V132_W='+
  JSON.stringify(weights)+';');
 const statsBody="{summonObservations:0,normalOffered:0,legalFusionOffers:0,"+
  "fusionAvailableTurns:0,freeSlotObservations:0,fullBoardObservations:0,noNormalHand:0,"+
  "enemyAheadAtSummon:0,attackerOnBoardAtSummon:0,policyNormalChoices:0,"+
  "policyFusionChoices:0,fusionMaterialsChosen:0,fusionTargetAtkSum:0,attacks:0,damageNpc:0}";
 const opt={
  mode:'pve',context:'tournament',
  id:'v133-'+s.seed,opponentId:s.tier,difficulty:s.difficulty,
  seed:s.seed,starter:s.starter,deck:s.deck.deck,fusionDeck:s.deck.fusionDeck
 };
 const code=[
  '(()=>{const g=createGame(',JSON.stringify(opt),');',
  'const stats=init132();const baseStats=',statsBody,';',
  'const oldChoose=chooseAiAction,oldApply=applyAiAction;',
  'chooseAiAction=function(game,policy){',
  'if(game!==g||game.active!==0)return oldChoose(game,policy);',
  mode==='tempo'?'':'const a=score132(game,V132_W,stats);if(a)return a;',
  'return summonPolicy(game,"tempo-board",baseStats)||oldChoose(game,policy);};',
  'applyAiAction=function(game,a){const r=oldApply(game,a);',
  'if(game===g&&game.active===0&&!r)stats.invalid++;return r;};',
  'try{simulateGame(g,"balanced","balanced");}finally{',
  'chooseAiAction=oldChoose;applyAiAction=oldApply;}',
  'const p=g.players[0],e=g.players[1];',
  'const value=i=>g.players[i].field.filter(Boolean).reduce((n,c)=>n+dataOf(c).atk+.35*dataOf(c).def,0);',
  'return {win:g.winner===0,turns:g.turn,ownLPFrac:p.lp/g.maxLP,enemyLPFrac:e.lp/g.maxLP,',
  'boardDelta:(value(0)-value(1))/3000,stats};',
  '})()'
 ].join('');
 const result=vm.run(code,240000);
 assert.ok([true,false].includes(result.win));
 assert.equal(result.stats.invalid,0,'Engine rejected an AI move');
 return result;
}
function outcome(r){return 5*Number(r.win)+1.5*(1-r.enemyLPFrac)+.6*r.ownLPFrac+
 .2*Math.max(-3,Math.min(3,r.boardDelta));}
const bounds={
 fusionBias:[-.8,.7],defenseWeight:[.1,1],tempoWeight:[0,.95],
 aceReach:[0,1.5],aceThreat:[0,2.4],decayWeight:[0,2.5],
 qualityWeight:[0,.5],materialTax:[.2,1.7],cardTax:[.1,1.3],
 guardWeight:[0,1.7],attackRisk:[.5,2.6],futureWeight:[0,1.3],
 attackFloor:[-.8,.6],priorWeight:[0,.85]
};
let state=13307;
function random(){state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;}
function mutate(start,step=.26){
 const v={...start};
 for(const [k,[lo,hi]] of Object.entries(bounds)){
  if(random()>.52)continue;
  v[k]=Math.max(lo,Math.min(hi,v[k]+(random()*2-1)*(hi-lo)*step));
 }
 return v;
}
const candidates=[{name:'frozen-v132',w:baseline}];
for(let i=1;i<numCandidates;i++){
 const parent=i%4===0?baseline:i%4===1?{...baseline,aceThreat:1.5,attackRisk:1.7}:
  i%4===2?{...baseline,cardTax:.55,materialTax:1.1,decayWeight:1.1}:
  {...baseline,defenseWeight:.65,guardWeight:1.1,fusionBias:0};
 candidates.push({name:'v133-'+String(i).padStart(2,'0'),w:mutate(parent)});
}
const ranking=[];
for(const candidate of candidates){
 const byTier={9:[],10:[]};
 for(const s of training)byTier[s.tier].push(duel(s,'learned',candidate.w));
 const ix=byTier[9],x=byTier[10];
 const scoreIX=ix.reduce((n,v)=>n+outcome(v),0)/ix.length;
 const scoreX=x.reduce((n,v)=>n+outcome(v),0)/x.length;
 // Boss X drives tuning while IX regression is penalized.
 const score=.7*scoreX+.3*scoreIX;
 const ixWins=ix.filter(v=>v.win).length,xWins=x.filter(v=>v.win).length;
 const row={...candidate,score,ixWins,xWins,scoreIX,scoreX};
 ranking.push(row);
 console.log('ARCANE_V133_TRAIN '+JSON.stringify({
  candidate:candidate.name,IX:ixWins+'/'+ix.length,X:xWins+'/'+x.length,
  score:+score.toFixed(4)}));
}
ranking.sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
const winner=ranking[0];
console.log('ARCANE_V133_FROZEN '+JSON.stringify({
 selected:winner.name,trainScore:+winner.score.toFixed(5),
 policy:winner.w,trainOnly:true}));
const compared=[];
for(const s of holdout){
 const result={};
 for(const arm of ['tempo','v132','v133']){
  const w=arm==='v133'?winner.w:baseline;
  result[arm]=duel(s,arm==='tempo'?'tempo':'learned',w);
 }
 compared.push({tier:s.tier,style:s.style,variant:s.variant,
  difficulty:s.difficulty,starter:s.starter,seed:s.seed,
  deckFingerprint:s.deck.fingerprint,
  deckLevel:s.deck.meta.meanLevel,
  result});
}
function summarize(rows){
 const out={total:rows.length,
  wins:{tempo:0,v132:0,v133:0},meanTurns:{tempo:0,v132:0,v133:0},
  invalid:0,aceThreatObservations:0,aceTargets:0,handFusions:0,attacksChosen:0};
 for(const x of rows){
  for(const arm of ['tempo','v132','v133']){
   out.wins[arm]+=Number(x.result[arm].win);
   out.meanTurns[arm]+=x.result[arm].turns;
  }
  const st=x.result.v133.stats;
  out.invalid+=st.invalid;
  out.aceThreatObservations+=st.aceObservations;
  out.aceTargets+=st.aceTargets;
  out.handFusions+=st.fusions;
  out.attacksChosen+=st.attacksChosen;
 }
 for(const arm of ['tempo','v132','v133'])
  out.meanTurns[arm]=+(out.meanTurns[arm]/Math.max(1,rows.length)).toFixed(2);
 return out;
}
const byTier=Object.fromEntries([7,9,10].map(t=>[t,summarize(compared.filter(s=>s.tier===t))]));
const byStyle=Object.fromEntries(STYLES.map(style=>[
 style,summarize(compared.filter(s=>s.style===style))]));
const byDifficulty=Object.fromEntries(['easy','hard'].map(d=>[
 d,summarize(compared.filter(s=>s.difficulty===d))]));
for(const [tier,metrics] of Object.entries(byTier))
 console.log('ARCANE_V133_HOLDOUT '+JSON.stringify({tier,...metrics}));
const eligible=holdRepeat>=2&&
 compared.every(s=>s.result.v133.stats.invalid===0)&&
 byTier[9].wins.v133>=byTier[9].wins.v132&&
 byTier[10].wins.v133>=byTier[10].wins.v132&&
 byTier[10].wins.v133>=byTier[10].wins.tempo+3&&
 Object.values(byDifficulty).every(r=>r.wins.v133>=r.wins.tempo);
const report={
 schema:'arcane-v133-robust-multideck-holdout',
 result:'completed',purpose:'train on diverse IX/X decks, verify generalization on independent tier VII IX X decks',
 sourcePolicyRun:39629620617,sourceRewardModelRun:39627739090,
 trainGames:training.length*candidates.length,
 holdoutGames:compared.length*3,
 trainCandidateCount:candidates.length,
 sourceLegalConstructedDecks:true,
 economyProgressionSimulated:false,
 uniqueDecks:fingerprintSummary,
 selectionUsedOnlyTraining:true,
 trainingLeaderboard:ranking.map(r=>({candidate:r.name,score:+r.score.toFixed(5),
  ixWins:r.ixWins,xWins:r.xWins,trainIX:r.scoreIX,trainX:r.scoreX})),
 selectedCandidate:winner.name,
 frozenParameters:winner.w,
 holdout:{
  total:summarize(compared),
  byTier,byStyle,byDifficulty
 },
 cases:compared.map(c=>({
  tier:c.tier,style:c.style,variant:c.variant,difficulty:c.difficulty,starter:c.starter,
  seed:c.seed,deckFingerprint:c.deckFingerprint,meanLevel:c.deckLevel,
  outcomes:Object.fromEntries(['tempo','v132','v133'].map(a=>[
   a,{win:c.result[a].win,turns:c.result[a].turns}])),
  v133Diagnostics:c.result.v133.stats
 })),
 promotionCandidate:eligible,
 productionIntegrated:false,
 safetyNotes:[
  'No private enemy hand, hidden draw sequence or RNG state read by policy',
  'All cards sourced from theoretical previous-stage pool, NOT the player inventory',
  'Real engine validates each AI action and decides all results',
  'v13.2 policy reused unchanged as a control; its former holdout not refit',
  'Even a positive holdout is not automatic NPC deployment: player-side logic must be generalized to active player=1 and ACE behavior verified'
 ]
};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-v133-multideck-report.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync('artifacts/ai-v133-frozen-policy.json',JSON.stringify({
 schema:'arcane-v133-strategy-policy',source:'v13.2 model + train-only v13.3 evolution',
 weights:winner.w,selectedOnTrainOnly:true,
 productionIntegrated:false,holdoutUsedForFitting:false,
 requiresNpcSideAdapter:true
},null,2)+'\n');
console.log('ARCANE_V133_SUMMARY '+JSON.stringify({
 trainGames:report.trainGames,holdoutGames:report.holdoutGames,
 chosen:winner.name,byTier,byDifficulty,promotionCandidate:eligible,
 productionIntegrated:false}));
