/* Arcane Duel 6.6: legal fusion-aware combined main/fusion deck selection offline training.
 * Compare against equipBest() from IDENTICAL actually earned inventories.
 * Candidate training decks are reorders/choices of already owned copies only.
 * Both player policies fight the same real tournament NPC with paired seeds.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const input=JSON.parse(fs.readFileSync('artifacts/ai-real-careers-v64.json','utf8'));
const trained=JSON.parse(fs.readFileSync('docs/ai-evolved-weights-v57.json','utf8')).profiles;
const vm=boot({seed:660341});
const trainN=Number(process.env.ARCANE_BUILDER_TRAIN_SEEDS||2);
const holdN=Number(process.env.ARCANE_BUILDER_HOLD_SEEDS||4);
if(!Number.isInteger(trainN)||trainN<1||trainN>7||
 !Number.isInteger(holdN)||holdN<2||holdN>12)
 throw Error('Invalid player deck builder seed ranges');
const types=['bridge','signature','soul-bridge','predator-bridge'];
const snapshots=input.entries.filter(s=>s.tier>=4&&s.tier<=10);
let games=0,notDistinct=0;
function battle(s,option,seed,starter){
 const previous=trained.find(p=>p.tier===s.tier)?.weights;
 assert.ok(previous,'Tier weights missing');
 const expr=`(()=>{
  profile=${JSON.stringify(s.profile)};
  const beforeMain=[...profile.activeDeck],beforeFusion=[...profile.fusionDeck];
  const legal=main=>!mainDeckError(main)&&!inventoryError(main,profile.inventory);
  if(!legal(beforeMain)||fusionDeckError(beforeFusion))throw Error('Invalid actually earned deck');
  const style='${option}',ids=[...new Set(profile.unlocked)].filter(id=>
   !!CARDS[id]&&!CARDS[id].fusionOnly&&
   (profile.inventory[id]||0)>0);
  const fusions=[...new Set(profile.fusionOwned)].filter(id=>
   CARDS[id]?.fusionOnly&&(profile.inventory[id]||0)>0);
  const maxMaterial=Math.max(...ids.map(id=>CARDS[id].level));
  // A two-card fusion requires at least a material of level target-2.
  // Higher-level templates that cannot be reached are deprioritized.
  const target=fusions.map(id=>CARDS[id])
   .filter(t=>t.level<=Math.min(10,maxMaterial+2))
   .sort((a,b)=>(b.atk+b.def+175*b.level)-
      (a.atk+a.def+175*a.level))[0]||null;
  const rank=c=>{
   const a=c.atk||0,d=c.def||0,r=c.role||'',lv=c.level||1;
   const bonus=style==='soul-bridge'?d*1.28+a*.54+(r==='soul'?670:0)+(r==='guardian'?230:0):
    style==='predator-bridge'?a*1.65+d*.35+(r==='predator'?490:0):
    style==='signature'?a*.9+d*.85+lv*165:
    a+d*.9+lv*130;
   // This *bridge* score values material pairs usable for a legally owned,
   // reachable fusion, not only the largest normal creature on its own.
   const bridge=target?Math.max(0,Math.min(2,lv-(target.level-3)))*230:0;
   const upgraded=(profile.enhancements[c.id]||0)*45;
   return bonus+upgraded+bridge;
  };
  ids.sort((x,y)=>rank(CARDS[y])-rank(CARDS[x])||x-y);
  const chosen=[];for(const id of ids)for(let n=0;n<Math.min(3,profile.inventory[id]||0);n++){
   if(chosen.length<40)chosen.push(id);
  }
  let changed=false,mainChanged=false,fusionChanged=false;
  if(style!=='baseline'&&chosen.length===40&&legal(chosen)){
   const a=beforeMain.slice().sort((x,y)=>x-y).join(',');
   const b=chosen.slice().sort((x,y)=>x-y).join(',');
   if(a!==b){
    if(!setActiveDeck(chosen))throw Error('Legal owned main deck rejected');
    changed=mainChanged=true;
   }
   const material=profile.activeDeck.map(id=>CARDS[id].level);
   const reach=card=>{
    let ways=0;
    for(let i=0;i<material.length;i++)for(let j=i+1;j<material.length;j++){
     const max=Math.max(material[i],material[j]);
     if(Math.min(12,material[i]+material[j],max+2)>=card.level)ways++;
    }
    return ways/Math.max(1,material.length*(material.length-1)/2);
   };
   const sortedFusion=fusions.map(id=>({id,card:CARDS[id]}))
    .sort((x,y)=>{
     const fitness=p=>{
      const good=reach(p.card),risk=good>0?0:-750;
      const roleFit=style==='soul-bridge'&&p.card.role==='soul'?250:0;
      return p.card.level*135+(p.card.atk+p.card.def)*.6+
       good*1100+risk+roleFit;
     };
     return fitness(y)-fitness(x)||x.id-y.id;
    });
   const picked=[],fusedCount={};
   for(const p of sortedFusion){
    const max=Math.min(3,profile.inventory[p.id]||0);
    while(picked.length<15&&(fusedCount[p.id]||0)<max){
     picked.push(p.id);fusedCount[p.id]=(fusedCount[p.id]||0)+1;
    }
   }
   if(picked.length>=2&&!fusionDeckError(picked)&&
    !inventoryError(picked,profile.inventory)){
    const a=beforeFusion.slice().sort((x,y)=>x-y).join(',');
    const b=picked.slice().sort((x,y)=>x-y).join(',');
    if(a!==b){
     if(!setFusionDeck(picked))throw Error('Legal owned fusion deck rejected');
     changed=fusionChanged=true;
    }
   }
  }
  ArcaneAiLearning56.setSandbox(${JSON.stringify(previous)},true);
  ArcaneAiBranches59.setSandbox(null);ArcaneAiLookahead58.setSandbox(null);
  const g=createGame({mode:'pve',context:'tournament',opponentId:${s.tier},
   deck:[...profile.activeDeck],fusionDeck:[...profile.fusionDeck],
   enhancements:profile.enhancements,starter:${starter},seed:${seed},
   difficulty:'easy',id:'deckbuilder-training-v66-${seed}-${starter}'});
  let error=null;try{simulateGame(g,'${s.policy}','balanced');}catch(e){error=String(e);}
  ArcaneAiLearning56.setSandbox(null);
  return {winner:g.winner,npcMinusPlayerLP:g.players[1].lp-g.players[0].lp,
   changed,mainChanged,fusionChanged,error,
   deckLegal:legal(profile.activeDeck)&&!fusionDeckError(profile.fusionDeck)&&
    !inventoryError(profile.fusionDeck,profile.inventory),
   distinct:new Set(profile.activeDeck).size};
 })()`;
 const r=vm.run(expr,120000);games++;
 if(r.error||![0,1].includes(r.winner)||!r.deckLegal)
  throw Error('Deckbuilder run failed '+s.tier+': '+r.error);
 if(!r.changed&&option!=='baseline')notDistinct++;
 return r;
}
function evaluate(tier,option,count,phase){
 const rows=snapshots.filter(s=>s.tier===tier),all=[];
 for(const s of rows)for(let i=0;i<count;i++){
  const seed=(phase==='train'?3417191:7619231)+tier*42797+
   s.careerId*739+i*1301;
  for(const starter of [0,1])all.push(battle(s,option,seed,starter));
 }
 const n=all.length,mean=k=>Math.round(all.reduce((sum,r)=>sum+r[k],0)/n);
 return {games:n,playerWins:all.filter(r=>r.winner===0).length,
  avgNpcLP:mean('npcMinusPlayerLP'),
  changedMatches:all.filter(r=>r.changed).length,
  fusionChangedMatches:all.filter(r=>r.fusionChanged).length,
  nontrivialRate:Math.round(all.filter(r=>r.changed).length/n*100)};
}
const stages=[...new Set(snapshots.map(s=>s.tier))].sort((a,b)=>a-b);
const report={schema:'owned-fusion-bridge-deckbuilder-v66',inputSnapshots:snapshots.length,
 tiers:[],games:0,reference:'identical actual inventory with unchanged equipBest card selection',
 safety:'No synthetic inventory cards or rewarded scout matches; new deck must satisfy actual game API',
 deployed:false,runSeeds:{trainN,holdN}};
for(const tier of stages){
 const baseTrain=evaluate(tier,'baseline',trainN,'train');
 const experiments=types.map(t=>({type:t,result:evaluate(tier,t,trainN,'train')}));
 const sorted=experiments.map(x=>({...x,fitness:
  (x.result.playerWins-baseTrain.playerWins)*10000+
  (baseTrain.avgNpcLP-x.result.avgNpcLP)})).sort((a,b)=>b.fitness-a.fitness);
 const best=sorted[0]?.fitness>0?sorted[0]?.type:'baseline';
 const baseline=evaluate(tier,'baseline',holdN,'hold');
 const candidate=best==='baseline'?baseline:evaluate(tier,best,holdN,'hold');
 const winGain=candidate.playerWins-baseline.playerWins,
  lpGain=baseline.avgNpcLP-candidate.avgNpcLP;
 const improved=best!=='baseline'&&winGain>=3&&lpGain>=0&&
  candidate.changedMatches>0;
 report.tiers.push({tier,snapshots:snapshots.filter(s=>s.tier===tier).length,
  training:{baseline:baseTrain,attempts:sorted.map(x=>({
   type:x.type,fitness:x.fitness,playerWins:x.result.playerWins,
   avgNpcLP:x.result.avgNpcLP,changedMatches:x.result.changedMatches}))},
  selected:best,
  holdout:{baseline,candidate,playerWinGain:winGain,playerLPImprovement:lpGain,improved}});
 console.log('ARCANE_FUSION_DECKBUILDER_STAGE_V66 '+JSON.stringify({tier,
  snapshots:snapshots.filter(s=>s.tier===tier).length,selected:best,
  playerWinGain:winGain,lpGain,changed:candidate.changedMatches,improved}));
}
report.games=games;report.noDifferenceObservations=notDistinct;
report.playerHoldoutWinGain=report.tiers.reduce((n,x)=>n+x.holdout.playerWinGain,0);
report.qualifyingTiers=report.tiers.filter(x=>x.holdout.improved).map(x=>x.tier);
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-fusion-deckbuilder-v66.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_FUSION_DECKBUILDER_SUMMARY_V66 '+JSON.stringify({
 games:report.games,snapshots:report.inputSnapshots,stages:stages.length,
 playerWinGain:report.playerHoldoutWinGain,qualifyingTiers:report.qualifyingTiers,
 noDifference:report.noDifferenceObservations}));
