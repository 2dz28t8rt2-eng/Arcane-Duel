'use strict';
/* v15.75 research-only causal scoring ablations. Real duel rules, materials,
 * attack costs and legality are intentionally NEVER modified by these arms.
 */
const assert=require('node:assert/strict');
const prior=require('./ai-stomp-v1574.cjs');

const MODES=Object.freeze(['baseline','splash-only','fatigue-only','reply-aware']);
const roleOf=c=>c?.roleOverride||c?.role||'combatant';
const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));

function evaluateAttack(options){
 const {game,trial,result,ai,di,cardValue,dataOf,role,attack,mode='baseline'}=options;
 assert.ok(MODES.includes(mode),'Unknown v15.75 predeclared ablation '+mode);
 const base=prior.evaluateAttack(options);
 if(!result||mode==='baseline')return {...base,replyTrials:0,replyKills:0,
  predatorFusionAttacks:0,predatorFusionKills:0};
 const actor=game.active,original=game.players[actor]?.field[ai];
 const enemy=Number.isInteger(di)?game.players[1-actor]?.field[di]:null;
 const lostAtk=Math.max(0,(original?.card?.atk||0)-
  (trial.players[actor]?.field[ai]?.card?.atk||0));
 const lostDef=Math.max(0,(original?.card?.def||0)-
  (trial.players[actor]?.field[ai]?.card?.def||0));
 const rawFatigue=lostAtk*.47+lostDef*.37;
 const fatiguePenalty=rawFatigue*.52;
 const splashCredit=(result.stomp?.hits||[]).reduce((n,hit)=>{
  const victim=game.players[1-actor].field[hit.index];
  return n+(hit.destroyed?cardValue(victim)*.65:(hit.defLost||0)*.62);
 },0);
 const windowPenalty=base.predatorWindow&&original?
  cardValue(original)*.26:0;
 let score=base.score,replyTrials=0,replyKills=0;
 let predatorFusionAttacks=0,predatorFusionKills=0;
 // Neither ablation alters the underlying engine: one removes the AI's
 // fatigue term, the other removes only its AI splash-reward term.
 if(mode==='splash-only')score+=Math.round(fatiguePenalty+windowPenalty);
 if(mode==='fatigue-only')score-=Math.round(splashCredit);
 if(mode==='reply-aware'){
  const attackerRole=role(original);
  const fusionTarget=enemy?.fusion&&(enemy?.materialsUsed||0)>=3;
  if(attackerRole==='predator'&&fusionTarget){
   predatorFusionAttacks=1;
   const remains=trial.players[1-actor].field[di];
   if(!remains||remains.uid!==enemy.uid){
    predatorFusionKills=1;score+=Math.min(440,cardValue(enemy)*.24);
   }else{
    const atkChip=Math.max(0,(enemy.card?.atk||0)-(remains.card?.atk||0));
    const defChip=Math.max(0,(enemy.card?.def||0)-(remains.card?.def||0));
    score+=Math.min(140,atkChip*.26+defChip*.12);
   }
  }
  const formed=trial.players[actor]?.field[ai];
  if(original?.fusion&&original.materialsUsed>=3&&formed&&
     formed.uid===original.uid&&typeof attack==='function'){
   const enemies=trial.players[1-actor].field;
   const predators=enemies.map((c,i)=>({c,i})).filter(x=>x.c&&
    role(x.c)==='predator'&&x.c.mode==='atk');
   let worst=0;
   for(const {i} of predators.slice(0,2)){
    const next=JSON.parse(JSON.stringify(trial));
    next.active=1-actor;next.turn++;next.aiPhase='attacks';
    for(const card of next.players[1-actor].field)if(card)card.attacked=false;
    let response=null;
    try{response=attack(next,i,ai);}catch(_){response=null;}
    if(!response)continue;
    replyTrials++;
    const survivor=next.players[actor].field[ai];
    const removed=!survivor||survivor.uid!==formed.uid;
    if(removed)replyKills++;
    const ownLP=Math.max(0,trial.players[actor].lp-next.players[actor].lp);
    const lostPower=removed?cardValue(formed):
     Math.max(0,(formed.card?.atk||0)-(survivor.card?.atk||0))*.48+
     Math.max(0,(formed.card?.def||0)-(survivor.card?.def||0))*.35;
    worst=Math.max(worst,Math.min(900,lostPower*.34+ownLP*.18));
   }
   score-=Math.round(worst*.72);
  }
 }
 return {...base,score:Math.round(clamp(score,-20000,20000)),
  replyTrials,replyKills,predatorFusionAttacks,predatorFusionKills};
}

module.exports={...prior,evaluateAttack,MODES};
