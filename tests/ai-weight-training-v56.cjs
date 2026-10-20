/* Seeded training and independent holdout; real Arcane Duel engine/actions.
 * Neither a neural network nor automatic production rollout.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const n=Number(process.env.ARCANE_WEIGHT_TRAIN_SAMPLES||4);
if(!Number.isInteger(n)||n<2||n>12)throw Error('samples 2..12');
const tiers=Number(process.env.ARCANE_WEIGHT_TIERS||10);
if(!Number.isInteger(tiers)||tiers<1||tiers>10)throw Error('tiers 1..10');
const presetNames=['predator','bastion','alchemist','tempo','balanced'];
const runtime=boot({seed:5608});
const presets=runtime.run('ArcaneAiLearning56.PRESETS');
const original=runtime.run('ArcaneAiLearning56.active()');
assert.equal(original,false);
const match=(tier,name,seed)=>{
 const weights=name==='baseline'?null:presets[name];
 const code=`(()=>{
  ArcaneAiLearning56.setSandbox(${weights?JSON.stringify(weights):'null'},${!!weights});
  const g=createGame({mode:'pve',context:'tournament',opponentId:${tier},
   seed:${seed},difficulty:'easy'});
  let summons=0,fusions=0,aces=0,errors=null;
  const chooseBefore=chooseAiAction;
  chooseAiAction=function(game,policy){
    const action=chooseBefore(game,policy);
    if(game===g&&game.active===1){
      if(action.type==='normal'){
        summons++;
        if(game.players[1].hand.some(x=>x.uid===action.uid&&x.id===ACE_CARD_IDS[${tier}]))aces++;
      }
      if(action.type==='fusion'){fusions++;if(action.choice===ACE_CARD_IDS[${tier}])aces++;}
    }
    return action;
  };
  try{simulateGame(g,'balanced','balanced');}catch(e){errors=String(e);}
  chooseAiAction=chooseBefore;
  ArcaneAiLearning56.setSandbox(null);
  return {winner:g.winner,enemyLP:g.players[1].lp,humanLP:g.players[0].lp,
   turns:g.turn,summons,fusions,aces,error:errors};
 })()`;
 return runtime.run(code,120000);
};
const compare=(tier,name,base,seedCount,start)=>{
 const rows=[];
 for(let i=0;i<seedCount;i++){
  const seed=start+tier*911+i*9127;
  const target=match(tier,name,seed);
  const prior=match(tier,base,seed);
  assert.equal(target.error,null,'candidate '+tier+': '+target.error);
  assert.equal(prior.error,null,'baseline '+tier+': '+prior.error);
  rows.push({seed,target,prior});
 }
 return {n:rows.length,wins:rows.filter(x=>x.target.winner===1).length,
  baselineWins:rows.filter(x=>x.prior.winner===1).length,
  margin:rows.reduce((s,x)=>s+
   ((x.target.enemyLP-x.target.humanLP)-(x.prior.enemyLP-x.prior.humanLP)),0)/rows.length,
  fusionDelta:rows.reduce((s,x)=>s+x.target.fusions-x.prior.fusions,0),
  aceDelta:rows.reduce((s,x)=>s+x.target.aces-x.prior.aces,0),
  errors:0};
};
const report={schema:'arcane-real-action-weight-training-v56',date:'2026-10-19',
 candidateSet:presetNames,trainingMatches:0,holdoutMatches:0,rows:[],productionEnabled:false,
 caveats:['Uses seeded real game engine in headless VM, not a human player',
 'Training differs from live difficulty and is subject to save/version checks',
 'Candidate policies only rank legal normal summons and hand fusion options',
 'Retain old AI for field fusion, positioning, attacks, support and unusual fights',
 'Holdout data is never used for the candidate selection']};
for(let tier=1;tier<=tiers;tier++){
 const training=presetNames.map(name=>({name,...compare(tier,name,'baseline',n,193311)}));
 report.trainingMatches+=n*presetNames.length*2;
 const best=[...training].sort((a,b)=> (b.wins-b.baselineWins)-(a.wins-a.baselineWins)||
  b.margin-a.margin||presetNames.indexOf(a.name)-presetNames.indexOf(b.name))[0];
 const holdout=compare(tier,best.name,'baseline',n+2,802116);
 report.holdoutMatches+=(n+2)*2;
 const passed=holdout.wins>=holdout.baselineWins&&holdout.margin>=0;
 report.rows.push({tier,selected:best.name,train:training,holdout,passed,
  productionActivated:false});
}
report.trainingMatches+=0;
report.holdoutGain=report.rows.reduce((a,r)=>a+r.holdout.wins-r.holdout.baselineWins,0);
report.accepted=report.rows.filter(r=>r.passed).length;
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/arcane-ai-action-training-v56.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_WEIGHT_TRAINING',JSON.stringify({trainingMatches:report.trainingMatches,
 holdoutMatches:report.holdoutMatches,holdoutGain:report.holdoutGain,
 accepted:report.accepted,rows:report.rows.map(r=>({tier:r.tier,selected:r.selected,
 trainWinDelta:r.train.find(x=>x.name===r.selected).wins-
  r.train.find(x=>x.name===r.selected).baselineWins,
 heldWinDelta:r.holdout.wins-r.holdout.baselineWins,
 heldMargin:Math.round(r.holdout.margin),fusions:r.holdout.fusionDelta,
 aces:r.holdout.aceDelta,passed:r.passed}))}));
