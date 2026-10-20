/* Arcane Duel 6.2 – learn from concrete sandbox decision errors.
 * Every trace contains only public enemy fields, own hand material IDs,
 * legally simulated actions and scores. No player account data.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {makeStageOwnedDeck}=require('./helpers/stage-owned-decks-v60.cjs');
const count=Number(process.env.ARCANE_DIAGNOSTIC_SEEDS||2);
if(!Number.isInteger(count)||count<1||count>8)throw Error('Invalid diagnostic seed count');
const tiers=[3,6,9],roles=['fusion','soul','balanced'],variants=['normal','invested'];
const vm=boot({seed:62101});
const context=vm.run(`(()=>{const p=freshProfile();return {
 cards:CARDS.map(c=>({id:c.id,level:c.level,atk:c.atk,def:c.def,role:c.role,
  source:c.source,hard:c.hard,ace:c.ace,retired:c.retired,rpg:c.rpg,
  enemyOnly:c.enemyOnly,essenceMonster:c.essenceMonster,lv1Exclusive:c.lv1Exclusive,
  workshopOnly:c.workshopOnly,fateOnly:c.fateOnly,fusionOnly:c.fusionOnly,
  milestoneOnly:c.milestoneOnly,manifestOf:c.manifestOf,eventOnly:c.eventOnly,
  questOnly:c.questOnly,legendaryOnly:c.legendaryOnly})),
 defaultDeck:[...DEFAULT_DECK],startFusions:[...RPG_START_FUSIONS],
 opponents:RPG_OPPONENTS.map(o=>({loot:o.loot,level:o.level})),
 initialInventory:p.inventory};})()`);
const profiles=JSON.parse(fs.readFileSync('docs/ai-evolved-weights-v57.json','utf8')).profiles;
const policies={fusion:'economy',soul:'guardian',balanced:'balanced'};
const config={material:1.25,board:1.15,tempo:.5,risk:2.4,support:1.9,future:1.5,ace:10};
const output={kind:'public-training-decision-audit-v62',sampledGames:0,
 limits:{tiers,roles,variants,seedsPerDeck:count,maxDecisionSamplesPerGame:7},
 byTier:[],examples:[],provenance:'synthetic stage-owned inventory, paired player controllers, public-only audited actions'};
for(const tier of tiers){
 const measurements=[];
 for(const role of roles)for(const variant of variants)for(let sample=0;sample<count;sample++){
  const deck=makeStageOwnedDeck(context,tier,role,variant);
  const weights=profiles.find(p=>p.tier===tier)?.weights;assert.ok(weights);
  const code=`(()=>{
   profile=freshProfile();profile.cleared=Array.from({length:10},(_,i)=>i+1);
   const own=${JSON.stringify(deck.deck)},fus=${JSON.stringify(deck.fusionDeck)};
   ArcaneAiLearning56.setSandbox(${JSON.stringify(weights)},true);
   ArcaneAiLookahead58.setSandbox(null);
   ArcaneAiBranches59.setSandbox(${JSON.stringify(config)},true,{guarded:true,margin:3});
   const g=createGame({mode:'pve',context:'tournament',opponentId:${tier},
    seed:${270121+tier*613+sample*3921+roles.indexOf(role)*811+variants.indexOf(variant)*233},
    starter:${sample%2},difficulty:'easy',
    deck:own,fusionDeck:fus,enemy:{deck:[...own],fusionDeck:[...fus],
      power:1,flatBonus:0,enhancements:{}}});
   const records=[],old=chooseAiAction;
   chooseAiAction=function(x,policy){
    if(x===g&&x.active===1&&x.aiPhase==='summon'&&!x.pending&&!x.summoned&&records.length<7){
     const d=ArcaneAiBranches59.diagnose(x,5);
     if(d.available)records.push(d);
    }
    return old(x,policy);
   };
   let error=null;
   try{simulateGame(g,'${policies[role]}','balanced');}catch(e){error=String(e);}
   chooseAiAction=old;
   const counters=ArcaneAiBranches59.stats();
   ArcaneAiBranches59.setSandbox(null);ArcaneAiLearning56.setSandbox(null);
   return {error,winner:g.winner,turns:g.turn,records,counters};
  })()`;
  const res=vm.run(code,120000);
  if(res.error||![0,1].includes(res.winner))throw Error('Diagnostic match failure '+tier+' '+res.error);
  const changes=res.records.filter(x=>x.best&&
   (x.best.type!==x.baseline.type||x.best.template!==x.baseline.template));
  measurements.push({tier,role,variant,won:res.winner===1,records:res.records.length,
    differing:changes.length,meanAdvantage:changes.length?Math.round(changes.reduce((s,x)=>s+(x.margin||0),0)/changes.length*100)/100:0,
    cueCount:res.records.filter(x=>x.hasRemainingSignatureFusion).length,
    simulated:res.counters.evaluated});
  for(const entry of changes.slice(0,2)){
   output.examples.push({tier,role,variant,turn:entry.turn,
    strategy:entry.strategy,ownHandCount:entry.ownHandCount,
    enemyVisibleBoard:entry.enemyVisibleBoard,
    baseline:entry.baseline,best:entry.best,
    margin:entry.margin,alternatives:entry.alternatives.slice(0,3)});
  }
  output.sampledGames++;
 }
 output.byTier.push({tier,matches:measurements.length,
  wins:measurements.filter(x=>x.won).length,
  comparisons:measurements.reduce((n,x)=>n+x.records,0),
  deviations:measurements.reduce((n,x)=>n+x.differing,0),
  avgAdvantage:Math.round(100*measurements.reduce((s,x)=>s+x.meanAdvantage,0)/measurements.length)/100,
  profile:'previous v5.7 weights plus confidence-gated v5.9 branch',
  samples:measurements});
}
output.examples=output.examples.sort((a,b)=>Math.abs(b.margin)-Math.abs(a.margin)).slice(0,35);
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-decision-audit-v62.json',JSON.stringify(output,null,2)+'\n');
console.log('ARCANE_DECISION_AUDIT_V62 '+JSON.stringify({games:output.sampledGames,
 tiers:output.byTier.map(x=>({tier:x.tier,games:x.matches,comparisonPoints:x.comparisons,
 proposalDifferences:x.deviations,avgAdvantage:x.avgAdvantage})),
 biggestDisagreements:output.examples.slice(0,5).map(x=>({tier:x.tier,turn:x.turn,
  baseline:x.baseline.type,proposal:x.best.type,gap:x.margin}))}));
