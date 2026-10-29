'use strict';
/* v13.2: experimental endgame decision training against IX/X.
 * Reuses v13.1 trained attack model, then learns higher-level summon/fusion,
 * board defense, ACE pressure and tactical targeting from REAL duel outcomes.
 * No player inventory changes; no production opponent changes.
 * Tune on training seeds ONLY. Untouched matched holdout used once at the end.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {summonPolicySource}=require('./helpers/ai-pre-attack-v92.cjs');
const {ruleFeatureSource}=require('./helpers/ai-rule-features-v130.cjs');
const prior=JSON.parse(fs.readFileSync('artifacts/v131/ai-rule-model-v131.json','utf8'));
assert.equal(prior.schema,'arcane-tactical-reward-model-v131');
assert.equal(prior.trained,true);
assert.equal(prior.productionActive,false);
assert.equal(prior.weights.length,16);
assert.ok(prior.weights.every(Number.isFinite));

function isAce132(c){return !!c&&(!!CARDS[c.id]?.ace||c.id===OPPONENTS[g132OpponentId]?.signature);}
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
const startsTrain=Number(process.env.ARCANE_V132_TRAIN_STARTS||8);
const startsHoldout=Number(process.env.ARCANE_V132_HOLDOUT_STARTS||16);
const candidateLimit=Number(process.env.ARCANE_V132_CANDIDATES||14);
assert.ok(Number.isInteger(startsTrain)&&startsTrain>=2&&startsTrain<=16);
assert.ok(Number.isInteger(startsHoldout)&&startsHoldout>=2&&startsHoldout<=32);
assert.ok(Number.isInteger(candidateLimit)&&candidateLimit>=4&&candidateLimit<=32);
const initial={
 fusionBias:-0.10,defenseWeight:.39,tempoWeight:.25,aceReach:.5,
 aceThreat:.5,decayWeight:.5,qualityWeight:.08,materialTax:.52,
 cardTax:.30,guardWeight:.5,attackRisk:1.0,futureWeight:.5,
 attackFloor:-.15,priorWeight:.18
};
// Deterministic candidates, deliberately retain a conservative seeded control.
let rng=1329;function next(){rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;}
const bounds={
 fusionBias:[-.7,.8],defenseWeight:[.15,.85],tempoWeight:[0,.8],
 aceReach:[0,1.5],aceThreat:[.15,2],decayWeight:[0,2.2],
 qualityWeight:[0,.4],materialTax:[.15,1.3],cardTax:[.1,1.1],
 guardWeight:[0,1.5],attackRisk:[.5,2.5],futureWeight:[0,1],
 attackFloor:[-.7,.35],priorWeight:[0,.7]
};
const mutate=(base,scale=1)=>{
 const out={...base};
 for(const [k,[lo,hi]] of Object.entries(bounds)){
  if(next()<.52){
   out[k]=Math.max(lo,Math.min(hi,out[k]+(next()*2-1)*(hi-lo)*.54*scale));
  }
 }
 return out;
};
const policies=[{name:'conservative-seed',w:initial}];
for(let i=1;i<candidateLimit;i++){
 const parent=i%3===0?initial:i%3===1?{...initial,aceThreat:1.4,fusionBias:.25,guardWeight:.95}: {...initial,cardTax:.7,materialTax:.85,attackRisk:1.8};
 policies.push({name:'candidate-'+String(i).padStart(2,'0'),w:mutate(parent)});
}
const scoreResult=r=>5*(r.win?1:0)+1.7*(1-r.enemyLPFrac)+.6*r.ownLPFrac+
 .25*Math.max(-3,Math.min(3,r.boardPowerDelta));
// Independent sandbox boots prevent any training modifications to persistent saves.
function duel(tier,seed,w,mode='candidate'){
 const vm=boot({seed:seed+101,x128Mode:'full'});
 vm.exec(summonPolicySource);vm.exec(ruleFeatureSource);vm.exec(injected);
 vm.exec('var V132_PRIOR='+JSON.stringify(prior.weights)+';var V132_W='+JSON.stringify(w)+';');
 const code='(()=>{'+
  'const roster=rpgEnemyLoadout(10,"easy");'+
  'const g=createGame({mode:"pve",context:"tournament",id:"v132-"+'+seed+','+
  'opponentId:'+tier+',seed:'+seed+',starter:'+(seed%2)+
  ',deck:[...roster.deck],fusionDeck:[...roster.fusionDeck]});'+
  'const stats=init132(),old=chooseAiAction,apply=applyAiAction;'+
  'chooseAiAction=function(game,style){'+
   'if(game!==g||game.active!==0)return old(game,style);'+
   (mode==='candidate'?'const a=score132(game,V132_W,stats);if(a)return a;':'')+
   'return summonPolicy(game,"tempo-board",BASE_STATS)||old(game,style);'+
  '};'+
  'const BASE_STATS={summonObservations:0,normalOffered:0,legalFusionOffers:0,fusionAvailableTurns:0,'+
   'freeSlotObservations:0,fullBoardObservations:0,noNormalHand:0,enemyAheadAtSummon:0,'+
   'attackerOnBoardAtSummon:0,policyNormalChoices:0,policyFusionChoices:0,'+
   'fusionMaterialsChosen:0,fusionTargetAtkSum:0,attacks:0,damageNpc:0};'+
  'applyAiAction=function(game,a){const value=apply(game,a);'+
   'if(game===g&&game.active===0&&!value)stats.invalid++;return value;};'+
  'try{simulateGame(g,"balanced","balanced");}finally{chooseAiAction=old;applyAiAction=apply;}'+
  'const p=g.players[0],e=g.players[1];'+
  'const boardPower=id=>g.players[id].field.filter(Boolean).reduce((n,c)=>n+dataOf(c).atk+dataOf(c).def*.35,0);'+
  'return {win:g.winner===0,turns:g.turn,ownLPFrac:p.lp/g.maxLP,enemyLPFrac:e.lp/g.maxLP,'+
  'boardPowerDelta:(boardPower(0)-boardPower(1))/3000,stats};'+
 '})()';
 const result=vm.run(code,240000);
 assert.equal(result.stats.invalid,0,'Engine rejected an AI action');
 return result;
}
const trainSeeds=(tier,n)=>Array.from({length:n},(_,i)=>132000+tier*1000+i*73);
const evalPolicy=(w,tiers,seeds)=> {
 const games=[];
 for(const tier of tiers)for(const seed of seeds(tier))games.push({tier,seed,result:duel(tier,seed,w)});
 return {score:games.reduce((n,x)=>n+scoreResult(x.result),0)/games.length,games};
};
const ranking=[];
for(const policy of policies){
 const r=evalPolicy(policy.w,[9,10],tier=>trainSeeds(tier,startsTrain));
 ranking.push({...policy,trainScore:+r.score.toFixed(5),
  trainWins:r.games.reduce((n,g)=>n+Number(g.result.win),0)});
 console.log('ARCANE_V132_TRAIN '+JSON.stringify({name:policy.name,score:+r.score.toFixed(4),wins:ranking[ranking.length-1].trainWins,duels:r.games.length}));
}
ranking.sort((a,b)=>b.trainScore-a.trainScore||a.name.localeCompare(b.name));
const winner=ranking[0];
console.log('ARCANE_V132_FROZEN_POLICY '+JSON.stringify({name:winner.name,score:winner.trainScore,winnerGenes:winner.w}));
// Holdout is evaluated AFTER freezing all coefficients. No holdout selection.
const report=[];
for(const tier of [7,9,10]){
 const limit=tier===7?Math.max(4,Math.floor(startsHoldout/2)):startsHoldout;
 let baseline=0,challenger=0,attackChoices=0,fusions=0,aceObservations=0,aceTargets=0,invalid=0;
 let baseScore=0,challengeScore=0;
 for(let i=0;i<limit;i++){
  const seed=232000+tier*1000+i*79;
  const a=duel(tier,seed,initial,'baseline');
  const b=duel(tier,seed,winner.w,'candidate');
  baseline+=Number(a.win);challenger+=Number(b.win);
  baseScore+=scoreResult(a);challengeScore+=scoreResult(b);
  attackChoices+=b.stats.attacksChosen;fusions+=b.stats.fusions;
  aceObservations+=b.stats.aceObservations;aceTargets+=b.stats.aceTargets;
  invalid+=b.stats.invalid;
 }
 const entry={tier,starts:limit,baselineWins:baseline,challengerWins:challenger,
  deltaWins:challenger-baseline,
  baselineUtility:+(baseScore/limit).toFixed(4),challengerUtility:+(challengeScore/limit).toFixed(4),
  attacksChosen:attackChoices,handFusions:fusions,aceThreatObservations:aceObservations,
  aceTargets,invalid};
 report.push(entry);console.log('ARCANE_V132_HOLDOUT '+JSON.stringify(entry));
}
const boss9=report.find(x=>x.tier===9),boss10=report.find(x=>x.tier===10);
const promotionEligible=startsHoldout>=16&&report.every(r=>r.invalid===0)&&
 boss9.challengerWins>=boss9.baselineWins&&
 boss10.challengerWins>=boss10.baselineWins&&
 boss9.challengerWins+boss10.challengerWins>=boss9.baselineWins+boss10.baselineWins+4;
const artifact={
 schema:'arcane-ix-x-strategy-training-v132',status:'completed',trainingMethod:'deterministic outcome-based policy search on real rule-engine duels',
 sourceModel:'v13.1-trained-reward-model',sourceRun:39627739090,
 previousModelWeightsUsed:true,noHiddenEnemyCards:true,liveRulesAuthoritative:true,
 trainingStartCountPerBoss:startsTrain,candidatesTested:policies.length,
 trainDuelCount:policies.length*2*startsTrain,
 holdoutDuelCount:report.reduce((n,r)=>n+r.starts*2,0),
 trainRanking:ranking.map(p=>({name:p.name,score:p.trainScore,wins:p.trainWins})),
 selectedOnTrainingOnly:winner.name,
 chosenPolicy:winner.w,
 holdout:report,productionIntegrated:false,promotionEligible,
 conclusions:[
  'Fixed X balance and real game decks were not modified',
  'Counters, defenses, fusion quality and decay are estimates in the policy; actual action effects come from the engine',
  'The prior v13.1 fitted attack model is reused without exposure to its holdout trajectories',
  'All current holdout matchups use fresh seeds never used for policy selection',
  'No claim of learned enemy private-hand distributions or perfect minimax search',
  'Before deploying to AI-controlled opponents, refactor player-index assumptions and retest NPC legal action handling'
 ]
};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-ix-x-strategy-report-v132.json',JSON.stringify(artifact,null,2)+'\n');
fs.writeFileSync('artifacts/ai-ix-x-trained-policy-v132.json',JSON.stringify({
 schema:'arcane-ix-x-policy-v132',sourceModel:'v13.1',sourceRun:39627739090,
 coefficients:winner.w,trainSelection:winner.name,trained:true,productionActive:false,
 requireOpponentSideAdaptation:true,holdoutSelectionForbidden:true
},null,2)+'\n');
console.log('ARCANE_V132_SUMMARY '+JSON.stringify({winner:winner.name,trainDuelCount:artifact.trainDuelCount,
 holdoutDuelCount:artifact.holdoutDuelCount,holdout:report,
 promotionEligible,productionIntegrated:false}));
