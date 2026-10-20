/* Arcane Duel 6.5: legal role-aware player deck selection offline training.
 * Compare against equipBest() from IDENTICAL actually earned inventories.
 * Candidate training decks are reorders/choices of already owned copies only.
 * Both player policies fight the same real tournament NPC with paired seeds.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const input=JSON.parse(fs.readFileSync('artifacts/ai-real-careers-v64.json','utf8'));
const trained=JSON.parse(fs.readFileSync('docs/ai-evolved-weights-v57.json','utf8')).profiles;
const vm=boot({seed:650341});
const trainN=Number(process.env.ARCANE_BUILDER_TRAIN_SEEDS||2);
const holdN=Number(process.env.ARCANE_BUILDER_HOLD_SEEDS||4);
if(!Number.isInteger(trainN)||trainN<1||trainN>7||
 !Number.isInteger(holdN)||holdN<2||holdN>12)
 throw Error('Invalid player deck builder seed ranges');
const types=['predator','guardian','soul','fusion','balanced'];
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
  const rank=c=>{
   const a=c.atk||0,d=c.def||0,r=c.role||'',lv=c.level||1;
   const bonus=style==='predator'?a*1.65+d*.25+(r==='predator'?580:0):
    style==='guardian'?d*1.55+a*.35+(r==='guardian'?560:0)+(r==='soul'?310:0):
    style==='soul'?d*1.35+a*.48+(r==='soul'?750:0)+(r==='guardian'?260:0):
    style==='fusion'?a*.90+d*.85+lv*150+((r==='guardian'||r==='predator')?200:0):
    a*1.08+d*.95+((r==='predator'||r==='guardian'||r==='soul')?110:0);
   const upgraded=(profile.enhancements[c.id]||0)*45;
   return bonus+upgraded;
  };
  ids.sort((x,y)=>rank(CARDS[y])-rank(CARDS[x])||x-y);
  const chosen=[];for(const id of ids)for(let n=0;n<Math.min(3,profile.inventory[id]||0);n++){
   if(chosen.length<40)chosen.push(id);
  }
  let changed=false;
  if(style!=='baseline'&&chosen.length===40&&legal(chosen)){
   const a=beforeMain.slice().sort((x,y)=>x-y).join(',');
   const b=chosen.slice().sort((x,y)=>x-y).join(',');
   if(a!==b){if(!setActiveDeck(chosen))throw Error('Legal owned deck rejected');changed=true;}
  }
  ArcaneAiLearning56.setSandbox(${JSON.stringify(previous)},true);
  ArcaneAiBranches59.setSandbox(null);ArcaneAiLookahead58.setSandbox(null);
  const g=createGame({mode:'pve',context:'tournament',opponentId:${s.tier},
   deck:[...profile.activeDeck],fusionDeck:[...profile.fusionDeck],
   enhancements:profile.enhancements,starter:${starter},seed:${seed},
   difficulty:'easy',id:'deckbuilder-training-v65-${seed}-${starter}'});
  let error=null;try{simulateGame(g,'${s.policy}','balanced');}catch(e){error=String(e);}
  ArcaneAiLearning56.setSandbox(null);
  return {winner:g.winner,npcMinusPlayerLP:g.players[1].lp-g.players[0].lp,
   changed,error,deckLegal:legal(profile.activeDeck),
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
  nontrivialRate:Math.round(all.filter(r=>r.changed).length/n*100)};
}
const stages=[...new Set(snapshots.map(s=>s.tier))].sort((a,b)=>a-b);
const report={schema:'owned-role-deckbuilder-v65',inputSnapshots:snapshots.length,
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
 console.log('ARCANE_DECKBUILDER_STAGE_V65 '+JSON.stringify({tier,
  snapshots:snapshots.filter(s=>s.tier===tier).length,selected:best,
  playerWinGain:winGain,lpGain,changed:candidate.changedMatches,improved}));
}
report.games=games;report.noDifferenceObservations=notDistinct;
report.playerHoldoutWinGain=report.tiers.reduce((n,x)=>n+x.holdout.playerWinGain,0);
report.qualifyingTiers=report.tiers.filter(x=>x.holdout.improved).map(x=>x.tier);
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-role-deckbuilder-v65.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_DECKBUILDER_SUMMARY_V65 '+JSON.stringify({
 games:report.games,snapshots:report.inputSnapshots,stages:stages.length,
 playerWinGain:report.playerHoldoutWinGain,qualifyingTiers:report.qualifyingTiers,
 noDifference:report.noDifferenceObservations}));
