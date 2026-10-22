'use strict';
/* Honest counterfactual learning prototype, research-only. Real engine applies
 * each alternative on cloned, seed-matched public boards, plus one legal
 * visible-board opponent attack response. No outcome-based all-moves labels.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const out='artifacts/v1511';fs.mkdirSync(out,{recursive:true});
const previousPath='artifacts/v1511/previous-training-q.json';
const previous=fs.existsSync(previousPath)?JSON.parse(fs.readFileSync(previousPath,'utf8')):null;
const epoch=Number(process.env.GITHUB_RUN_NUMBER||0);
if(!Number.isInteger(epoch)||epoch<0)throw Error('Bad training epoch');
const previousByArm=new Map((Array.isArray(previous)?previous:[]).map(x=>[
 String(x.swarm||0)+'|'+String(x.pierce),x]));
const legacyPath='artifacts/v1511/v1497-prior-q.json';
const legacy=fs.existsSync(legacyPath)?JSON.parse(fs.readFileSync(legacyPath,'utf8')):[];
const legacyByPierce=new Map((Array.isArray(legacy)?legacy:[]).map(x=>[String(x.pierce),x]));

function generate(pierce,swarm,offset,count){
 profile=freshProfile();profile.guideSeen=true;
 for(const k of Object.keys(profile.upgrades||{}))profile.upgrades[k]=0;
 const pools={};
 for(const role of ['predator','guardian','soul','combatant']){
  pools[role]=CARDS.filter(c=>c.role===role&&!c.fusionOnly&&!c.ace&&
   c.level>=2&&c.level<=9&&!c.retired&&!c.essenceMonster);
 }
 if(Object.values(pools).some(a=>a.length<3))throw Error('Role pool too small');
 const records=[];
 for(let i=0;i<count;i++){
  const seed=offset+i*127,piercePct=pierce;
  let randSeed=(seed*1664525+1013904223)>>>0;
  function random(n){randSeed=(Math.imul(randSeed,1664525)+1013904223)>>>0;return randSeed%n;}
  const choose=r=>pools[r][random(pools[r].length)];
  const seat=i%2,other=1-seat;
  const g=createGame({mode:'pve',context:'free',seed:seed+405,
   starter:seat,strategicTraining:{enabled:true,noAttackTurns:0,
    symmetricSides:true,disableArenaLPDecay:true,predatorArmorPierce:piercePct,predatorSwarmPercent:swarm}});
  g.fateUsed=[true,true];g.turn=12;g.active=seat;g.aiPhase='attacks';
  for(const p of g.players){p.lp=500+random(9501);p.shield=0;
   p.enhancements={};p.flatBonus=0;p.power=1;p.field=[null,null,null,null,null];}
  const pred=newInstance(g,choose('predator').id,seat);
  pred.card.atk=300+random(220)*10;pred.card.def=250+random(160)*10;pred.mode='atk';
  g.players[seat].field[0]=pred;
  // Balance all five deployed-predator counts across train and holdout.
  const swarmCount=1+i%5;
  for(let k=1;k<swarmCount;k++){
   const ally=newInstance(g,choose('predator').id,seat);
   ally.card.atk=300+random(200)*10;ally.card.def=400+random(100)*10;
   ally.mode=k%2?'def':'atk';
   g.players[seat].field[k]=ally;
  }
  if(swarmCount<=3&&i%4===0){
   const buddy=newInstance(g,choose('guardian').id,seat);buddy.mode='def';
   buddy.card.atk=200+random(80)*10;buddy.card.def=450+random(170)*10;
   g.players[seat].field[swarmCount]=buddy;
  }
  const roles=i%3===0?['guardian','soul']:i%3===1?['soul','predator']:['guardian','combatant'];
  for(let j=0;j<2;j++){
   const role=roles[j],card=newInstance(g,choose(role).id,other);
   card.mode=j===0?'def':(i%2===0?'def':'atk');
   card.card.atk=200+random(180)*10;card.card.def=300+random(270)*10;
   g.players[other].field[j]=card;
  }
  const publicOnly={ownLP:g.players[seat].lp,enemyLP:g.players[other].lp,
   own:g.players[seat].field.filter(Boolean).map(c=>({role:c.roleOverride||CARDS[c.id].role,
    mode:c.mode,atk:c.card.atk,def:c.card.def})),
   enemy:g.players[other].field.filter(Boolean).map(c=>({role:c.roleOverride||CARDS[c.id].role,
    mode:c.mode,atk:c.card.atk,def:c.card.def}))};
  function value(x){
   const own=x.players[seat],enemy=x.players[other];
   const board=p=>p.field.filter(Boolean).reduce((sum,c)=>{
    const d=dataOf(c),r=c.roleOverride||CARDS[c.id]?.role;
    return sum+d.atk*.60+d.def*.45+
     (r==='soul'&&c.mode==='def'?c.essenceCombat?.soul*.65:0);
   },0);
   return (own.lp-enemy.lp)*1.0+board(own)-board(enemy);
  }
  const before=value(g),initial=JSON.stringify(g),moves=[{type:'pass'}];
  for(let j=0;j<2;j++)if(g.players[other].field[j])moves.push({type:'attack',target:j});
  const scored=[];
  for(const move of moves){
   const c=JSON.parse(initial);
   if(move.type==='attack'){
    if(!canAttack(c,c.players[seat].field[0]))continue;
    const ok=attack(c,0,move.target);
    if(!ok)continue;
   }
   if(c.winner===null){
    // One legal response from the opponent's public board. No hidden cards,
    // future draws, opponent hand, or secret fusion deck are inspected.
    c.active=other;c.turn+=1;
    c.players[other].field.forEach(u=>{if(u){u.attacked=false;u.switched=false;}});
    const response=attackPlan(c);
    if(response)attack(c,response.ai,response.di);
   }
   const outcome=Math.max(-15,Math.min(15,(value(c)-before)/500));
   const target=move.type==='attack'?g.players[other].field[move.target]:null;
   const targetRole=target&&(target.roleOverride||CARDS[target.id]?.role)||null;
   const ratio=target?(pred.card.atk/Math.max(1,target.mode==='def'?target.card.def:target.card.atk)):0;
   const hp=g.players[seat].lp;
   const swarmBand=swarmCount===1?'solo':swarmCount===2?'pair':swarmCount===3?'trio':'pack';
   const suffix='|swarm:'+swarmBand;
   const key=(move.type==='pass'?'pass':
    'attack|'+(target.mode==='def'?'def':'atk')+'|'+
    (['guardian','soul'].includes(targetRole)?'defender':'other')+'|'+
    (ratio<.5?'low':ratio<.85?'mid':ratio<1.1?'near':'high')+'|'+
    (hp<2000?'critical':hp<5000?'mid':'safe'))+suffix;
   scored.push({action:move,key,reward:outcome,role:targetRole,
    mode:target?.mode||null,ratio:Math.round(ratio*100)/100});
  }
  if(scored.length<2)continue;
  const best=[...scored].sort((a,b)=>b.reward-a.reward)[0];
  const old=attackPlan(g);
  const baseline=old?scored.find(x=>x.action.type==='attack'&&x.action.target===old.di):
   scored[0];
  records.push({i,seed,seat,stage:0,pierce,swarm,swarmCount,publicBoard:publicOnly,
   scored,bestReward:best.reward,bestAction:best.action,
   baselineReward:(baseline||scored[0]).reward,
   baselineAction:(baseline||scored[0]).action});
 }
 return records;
}
function fitness(data,q){
 let sum=0,baseline=0,oracle=0,chosenAttack=0,baselineAttack=0,exact=0;
 for(const row of data){
  const best=[...row.scored].sort((a,b)=>b.reward-a.reward)[0];
  const chosen=[...row.scored].sort((a,b)=>
   (q[b.key]?.mean??0)-(q[a.key]?.mean??0) ||
   (a.action.type==='pass'?1:0)-(b.action.type==='pass'?1:0))[0];
  sum+=chosen.reward;baseline+=row.baselineReward;oracle+=best.reward;
  chosenAttack+=Number(chosen.action.type==='attack');
  baselineAttack+=Number(row.baselineAction.type==='attack');
  exact+=Number(Math.abs(chosen.reward-best.reward)<1e-9);
 }
 return {cases:data.length,learnerUtility:Math.round(sum*100)/100,
  baselineUtility:Math.round(baseline*100)/100,
  oracleUtility:Math.round(oracle*100)/100,
  meanLearner:Math.round(sum/data.length*10000)/10000,
  meanBaseline:Math.round(baseline/data.length*10000)/10000,
  meanOracle:Math.round(oracle/data.length*10000)/10000,
  exactBestDecisions:exact,learnerAttacks:chosenAttack,baselineAttacks:baselineAttack};
}
const selected=[];
const arms=[
 {swarm:0,pierce:0,label:'control'},
 {swarm:.02,pierce:0,label:'swarm'},
 {swarm:.02,pierce:.10,label:'swarm-plus-10pp-pierce'}
];
for(const {swarm,pierce,label} of arms){
 const training=boot({seed:1497000}).run('('+generate.toString()+')('+[pierce,swarm,6000+epoch*800000,450].join(',')+')',300000);
 const holdout=boot({seed:1497000}).run('('+generate.toString()+')('+[pierce,swarm,160000+epoch*800000,150].join(',')+')',300000);
 assert.equal(training.length,450);assert.equal(holdout.length,150);
 const prior=previousByArm.get(String(swarm)+'|'+String(pierce));
 const starting=prior?.learnedQ?structuredClone(prior.learnedQ):{};
 // Transfer the previous v14.9.6 learned ACTION VALUES as priors, not its
 // stored example outcomes or prior holdouts. New swarm-aware keys are
 // differentiated by present allied-predator count.
 // Carry forward the successful v14.9.7 Q state. The former 8pp model
 // serves only as a warm start for the new 10pp treatment (never as a label).
 const legacySource=(legacyByPierce.get(String(pierce))||
  legacy.find(x=>x.swarm===swarm&&Math.abs((x.pierce||0)-pierce)<.03))?.learnedQ||{};
 if(!prior)for(const [oldKey,value] of Object.entries(legacySource))
  for(const swarmBand of ['solo','pair','trio','pack'])
   starting[oldKey+'|swarm:'+swarmBand]={mean:value.mean,count:value.count||0};
 const initialTrain=fitness(training,starting);
 const q=structuredClone(starting);
 // Genuine counterfactual action-value updates from matched, engine-run moves.
 // This does NOT use victory labels, test labels, or privileged enemy hands.
 for(const row of training)for(const a of row.scored){
  const x=q[a.key]||(q[a.key]={mean:0,count:0});
  x.count++;x.mean+=.13*(a.reward-x.mean);
 }
 const fitCandidate=fitness(training,q);
 const accepted=!prior||fitCandidate.learnerUtility>=initialTrain.learnerUtility;
 const finalQ=accepted?q:starting;
 const fit=fitness(training,finalQ),held=fitness(holdout,finalQ);
 const oldHeld=prior?fitness(holdout,starting):null; // diagnostic only, never used to select
 const record={pierce,swarm,label,train:fit,holdout:held,priorHoldout:oldHeld,
  improvedOnUnseenSincePrior:oldHeld?held.learnerUtility-oldHeld.learnerUtility:null,
  keys:Object.keys(finalQ).length,
  learnedQ:finalQ,priorQ:!!prior,trainValueBefore:initialTrain.learnerUtility,
  newQAccepted:accepted,epoch,replayExamples:training.slice(0,45),
  testExamples:holdout.slice(0,12)};
 selected.push(record);
 console.log('ARCANE_V1511_TACTICAL '+JSON.stringify({pierce,swarm,label,
  train:fit,holdout:held,priorHoldout:oldHeld,keys:record.keys,priorQ:record.priorQ,
  updated:record.newQAccepted,previousTrainUtility:record.trainValueBefore}));
}
const chosen=[...selected].sort((a,b)=>b.train.learnerUtility-a.train.learnerUtility||
 a.pierce-b.pierce||a.swarm-b.swarm)[0];
const report={schema:'arcane-v1511-continued-predator-Q-training',
 status:'completed',sourceSha:process.env.GITHUB_SHA||'unknown',
 selectionMethod:'train-only highest counterfactual tactical value; tie favors smaller buff',
 trainingEpoch:epoch,priorCheckpointLoaded:previousByArm.size>0,legacyQTransferred:legacyByPierce.size>0,
 updatedQArms:selected.filter(x=>x.newQAccepted).length,
 trainingCasesPerArm:450,holdoutCasesPerArm:150,
 chosenResearchSwarm:chosen.swarm,
 chosenResearchPierce:chosen.pierce,productionEnabled:false,
 model:'contextual tabular Q-value with incremental SGD-like updates from real cloned engine alternatives',
 outcomeCredit:false,fullDuelWinRate:false,
 roles:['predator','guardian','soul','combatant'],
 candidates:selected.map(x=>({label:x.label,swarm:x.swarm,pierce:x.pierce,train:x.train,holdout:x.holdout,priorHoldout:x.priorHoldout,updated:x.newQAccepted,keys:x.keys})),
 limitations:['These are synthetic but legal public-board tactical positions, not complete independent matches.',
  'Only ATTACK vs PASS with one public-board reply is learned; summoning, fusion and hidden opponent hand are not included.',
  'Q key generalization is limited to a handful of explicitly selected features; not a pretrained neural network.',
  'The matched one-reply model is a measured local tactical objective, not a direct guarantee of win-rate improvement.',
  'Swarm bonus is active exclusively on Predator attackers and scales with live allied Predator field count.',
  'A learned context table is tested on independent seed families; complete duel winrates are assessed in a separate experiment.',
  'Selection of Predator buff strength is based strictly on training labels, never the independent holdout.',
  'Only previously accepted Q-values, never previous holdout labels, are restored between runs.',
  'No production or main-branch balance change is activated.']};
fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(out+'/training-q-and-examples.json',JSON.stringify(selected,null,2)+'\n');
console.log('ARCANE_V1511_TACTICAL_FINAL '+JSON.stringify({chosen:{swarm:chosen.swarm,pierce:chosen.pierce},candidates:report.candidates}));
