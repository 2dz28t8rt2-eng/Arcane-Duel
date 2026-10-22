'use strict';
// v14.8.7: Research-only, deterministic, public-information counterplay pilot.
// Reuses the verified v14.8.6 symmetric training VM without changing the game.
const fs=require('node:fs');
const assert=require('node:assert/strict');

function visibleReply1487(position,actor,maxReplies){
 const before=boardValue139(position,actor);
 const state=JSON.parse(JSON.stringify(position));
 if(state.winner!==null)return {penalty:0,replyCount:0,terminal:true};
 if(state.active===actor){
  if(!applyAiAction(state,{type:'end'}))return {penalty:0,replyCount:0,unresolved:true};
 }
 const enemy=1-actor;
 if(state.winner!==null)return {penalty:state.winner===actor?-100:100,
  replyCount:0,terminal:true};
 if(state.active!==enemy)return {penalty:0,replyCount:0,unresolved:true};
 // IMPORTANT: enumerate only publicly visible, already-on-field attackers.
 // Never consult the opponent hand, draw order or candidate summons.
 const afterEnd=boardValue139(state,actor);
 let replyCount=0;
 for(let ply=0;ply<maxReplies&&state.winner===null;ply++){
  let worst=null;
  for(let ai=0;ai<state.players[enemy].field.length;ai++){
   const attacker=state.players[enemy].field[ai];
   if(!attacker||!canAttack(state,attacker))continue;
   const our=state.players[actor].field;
   const targets=our.some(Boolean)?our.map((c,i)=>c?i:null).filter(x=>x!==null):[null];
   for(const di of targets){
    const branch=JSON.parse(JSON.stringify(state));
    let accepted=false;
    try{accepted=!!applyAiAction(branch,{type:'attack',ai,di});}
    catch(e){accepted=false;}
    if(!accepted)continue;
    replyCount++;
    const harm=boardValue139(state,actor)-boardValue139(branch,actor)+
     (branch.winner===enemy?500:0);
    if(!worst||harm>worst.harm)worst={harm,branch};
   }
  }
  if(!worst||worst.harm<=0)break;
  Object.assign(state,worst.branch);
 }
 const total=before-boardValue139(state,actor);
 const decay=before-afterEnd;
 return {penalty:Math.max(0,total)+(state.winner===enemy?500:0),
  endTurnDecay:decay,replyCount,terminal:state.winner!==null};
}

function lookahead1487(g,w,stats,mode='candidate'){
 if(mode!=='candidate'||g.pending||g.winner!==null||
    !['positions','attacks'].includes(g.aiPhase))
   return lookahead148(g,w,stats,mode);
 const actor=g.active,phase=g.aiPhase;
 const cfg=ARCANE1487_CONFIG||{risk:.65};
 const raw=choices135(g,stats).filter(x=>phase==='positions'?
  x.action.type==='switch':
  ['attack','arcane-soul-extract','arcane-guardian-heal','end'].includes(x.action.type));
 if(!raw.length)return lookahead148(g,w,stats,mode);
 const start=boardValue139(g,actor);
 const danger=tacticalThreat144(g,actor);
 const ranked=raw.map(x=>({action:x.action,
  linear:x.base+x.features.reduce((s,n,i)=>s+n*w[i],0)}))
  .sort((a,b)=>b.linear-a.linear).slice(0,18);
 const scored=[];
 for(const item of ranked){
  const next=JSON.parse(JSON.stringify(g));
  let accepted=false;
  try{accepted=!!applyAiAction(next,item.action);}catch(e){accepted=false;}
  if(!accepted)continue;
  const now=boardValue139(next,actor)-start;
  const defended=danger-tacticalThreat144(next,actor);
  let follow=0,followAction=null,replyState=next;
  if(phase==='attacks'&&item.action.type==='attack'&&next.winner===null){
   // A second legal action in our *current* attack phase; only public board
   // state enters its evaluation. No second summons or speculative card draw.
   const candidates=choices135(next,stats).filter(c=>
     ['attack','arcane-soul-extract','arcane-guardian-heal'].includes(c.action.type))
     .map(c=>({action:c.action,
      rank:c.base+c.features.reduce((s,n,i)=>s+n*w[i],0)}))
     .sort((a,b)=>b.rank-a.rank).slice(0,5);
   for(const c of candidates){
    const trial=JSON.parse(JSON.stringify(next));
    try{
     if(!applyAiAction(trial,c.action))continue;
     const benefit=boardValue139(trial,actor)-boardValue139(next,actor);
     if(benefit>follow){follow=benefit;followAction=c.action;replyState=trial;}
    }catch(e){}
   }
  }
  const opponent=visibleReply1487(replyState,actor,2);
  const terminal=next.winner===actor?500:next.winner===1-actor?-500:0;
  const components={
   prior:.18*item.linear,board:2.2*now,
   ownFollow:.7*follow,defense:.4*defended,
   visibleCounter:-Math.max(0,Number(cfg.risk)||0)*opponent.penalty,
   win:terminal,
   end:item.action.type==='end'?-.08:0
  };
  const score=Object.values(components).reduce((a,b)=>a+b,0);
  scored.push({action:item.action,score,components,replyCount:opponent.replyCount,
   followAction,replyPenalty:opponent.penalty});
 }
 if(!scored.length)return lookahead148(g,w,stats,mode);
 scored.sort((a,b)=>b.score-a.score);
 if(phase==='positions'&&scored[0].score<=.10)
   return lookahead148(g,w,stats,mode);
 const best=scored[0];
 stats.v1487Calls=(stats.v1487Calls||0)+1;
 stats.v1487Replies=(stats.v1487Replies||0)+
  scored.reduce((s,x)=>s+x.replyCount,0);
 stats.v1487Chosen=stats.v1487Chosen||{};
 stats.v1487Chosen[best.action.type]=(stats.v1487Chosen[best.action.type]||0)+1;
 if(ARCANE147_TRACE){
  const audit=stats.v1487Examples||(stats.v1487Examples=[]);
  if(audit.length<10)audit.push({
   before:snapState(g),phase,selected:best.action,
   publicCounterplayOnly:true,weights:cfg,
   options:scored.slice(0,8).map(x=>({action:x.action,
    score:Number(x.score.toFixed(5)),
    components:x.components,counterActions:x.replyCount,
    opponentExposure:x.replyPenalty,ownNextAction:x.followAction}))
  });
 }
 return best.action;
}

function run1487(){
 const oldReport=JSON.parse(fs.readFileSync('artifacts/history-v147/report.json','utf8'));
 assert.equal(oldReport.schema,'arcane-v147-final-score-transparent-mirrors');
 const profiles=oldReport.selectedProfiles;
 const groups={offense:['predator','tempo'],defense:['guardian','soul'],
  fusion:['fusion','allrounder','hybrid']};
 const group=scene=>Object.keys(groups).find(k=>groups[k].includes(scene.style));
 const conditions=[
  {name:'starter0',starterOverride:0,flipOpeningHands:false},
  {name:'starter1',starterOverride:1,flipOpeningHands:false},
  {name:'starter0_alternate',starterOverride:0,flipOpeningHands:true},
  {name:'starter1_alternate',starterOverride:1,flipOpeningHands:true}
 ];
 const risks=[.2,.65,1.1];
 function game(s,roles,condition,risk,capture=false){
  const scene={...s,...condition,policy1487:{risk},neutralSkills:true,
   lockIdenticalOpenings:true,fusionAuditArm:'symmetric'};
  const m=play(scene,model.weights,model.weights,'none','attacks',false,
   2,'always',2.35,roles,{bySide:roles.map(()=>profiles[group(s)]),
    oldProfile:profiles[group(s)]},capture);
  const a=m.openingAudit;
  assert.ok(a?.strictIdenticalOpenings);
  assert.equal(a.fusionAuditArm,'symmetric');
  assert.equal(a.skillMetadata,0);
  assert.equal(JSON.stringify(a.handsDetailed[0]),JSON.stringify(a.handsDetailed[1]));
  assert.equal(JSON.stringify(a.decksRemaining[0]),JSON.stringify(a.decksRemaining[1]));
  assert.equal(JSON.stringify(a.fusionStock[0]),JSON.stringify(a.fusionStock[1]));
  assert.deepEqual(a.openingShield,[0,0]);
  assert.equal(m.invalid,0);
  return m;
 }
 function recordPair(s,condition,risk,capture=false){
  const left=game(s,['candidate','prior147'],condition,risk,capture);
  const right=game(s,['prior147','candidate'],condition,risk,capture);
  return {games:2,wins:Number(left.winner===0)+Number(right.winner===1),
   seat0Wins:Number(left.winner===0)+Number(right.winner===0),
   starterWins:Number(left.winner===condition.starterOverride)+
     Number(right.winner===condition.starterOverride),
   plannerCalls:(left.tally.v1487Calls||0)+(right.tally.v1487Calls||0),
   responseBranches:(left.tally.v1487Replies||0)+(right.tally.v1487Replies||0),
   types:[left.tally.v1487Chosen||{},right.tally.v1487Chosen||{}],
   examples:capture?[...(left.tally.v1487Examples||[]),
    ...(right.tally.v1487Examples||[])].slice(0,8):[]};
 }
 function combine(rows){
  return {games:rows.reduce((n,x)=>n+x.games,0),
   wins:rows.reduce((n,x)=>n+x.wins,0),
   seat0Wins:rows.reduce((n,x)=>n+x.seat0Wins,0),
   starterWins:rows.reduce((n,x)=>n+x.starterWins,0),
   plannerCalls:rows.reduce((n,x)=>n+x.plannerCalls,0),
   responseBranches:rows.reduce((n,x)=>n+x.responseBranches,0),
   winRate:rows.reduce((n,x)=>n+x.wins,0)/rows.reduce((n,x)=>n+x.games,0)};
 }
 // True training selection only. Test cohort is not used to pick risk.
 const trainStats=risks.map(risk=>{
  const rows=[];
  for(const s of train)for(const c of conditions.slice(0,2))
   rows.push(recordPair(s,c,risk));
  return {risk,...combine(rows)};
 });
 trainStats.sort((a,b)=>b.winRate-a.winRate||a.risk-b.risk);
 const selectedRisk=trainStats[0].risk;
 const heldout=[];
 for(const s of holdout)for(const c of conditions)
  heldout.push({scene:s,condition:c,
   match:recordPair(s,c,selectedRisk,heldout.length<2)});
 const overall=combine(heldout.map(x=>x.match));
 const byStyle={};
 for(const style of styles){
  const rows=heldout.filter(x=>x.scene.style===style);
  if(rows.length)byStyle[style]=combine(rows.map(x=>x.match));
 }
 const byStarter={};
 for(const c of conditions)
  byStarter[c.name]=combine(heldout.filter(x=>x.condition.name===c.name)
    .map(x=>x.match));
 const heldoutDivergence=overall.plannerCalls;
 const promotionEligible=overall.games>=64&&overall.winRate>=.56&&
  overall.plannerCalls>=16&&
  byStarter.starter0.winRate>=.52&&byStarter.starter1.winRate>=.52;
 const report={schema:'arcane-v1487-public-visible-two-ply-pilot',date:'2026-10-22',
  sourceCommit:process.env.GITHUB_SHA||'unknown',status:'completed',
  purpose:'Select opponent-response risk on disjoint train, then validate mirrored legal actions on untouched holdout',
  testOnly:true,productionIntegrated:false,
  championPromoted:false,promotionEligible,
  controls:{symmetricFusionOnlyInIsolatedVM:true,
   identicalOrderedFiveCardHands:true,identical35CardDrawOrder:true,
   neutralSkillsAndPerks:true,zeroStartShields:true,
   independentHoldoutDecks:true,actorStartsBothSeats:true,
   publicOpponentInformationOnly:true,opponentFutureSummonsNeverInspected:true},
  selectedRisk,trainingProfiles:trainStats,
  holdout:{scenarios:holdout.length,stats:overall,byStarter,byStyle,
   traces:heldout.flatMap(x=>x.match.examples).slice(0,14)},
  caveats:[
   'Two-ply is immediate legal action plus at most one own attack continuation and two known-field opponent attacks after legal end-turn transition.',
   'It is not full minimax or MCTS and does not foresee opponent unknown hand, draws or future fusion random rolls.',
   'Fusion/summon decisions still use existing v14.7 shallow planner; this is the first safe multi-action attack/defense module.',
   'The responder intentionally does not model enemy summons or hidden cards; partial-public-board lower-bound, not perfect prediction.',
   'A high win rate in this small pilot is not evidence of a fully trained or generally superior game AI; verify larger varied holdouts.',
   'No change to game, main, career NPC behavior, skills, perks or champion checkpoint.'
  ]};
 fs.mkdirSync('artifacts/v1487',{recursive:true});
 fs.writeFileSync('artifacts/v1487/report.json',JSON.stringify(report,null,2)+'\n');
 console.log('ARCANE_V1487_RESULT '+JSON.stringify({
  training:trainStats,selectedRisk,holdout:overall,
  byStarter,promotionEligible,productionIntegrated:false}));
}

const previous=fs.readFileSync('tests/ai-v1486-three-arm-symmetric-training.cjs','utf8');
const cutoff=previous.indexOf('const run=String.raw');
assert.ok(cutoff>0,'Changed source layout in v14.8.6');
const prelude=previous.slice(0,cutoff);
const glue=[
 'patch('+JSON.stringify("+'\\n'+lookahead148.toString()+'\\n'+explain146.toString()")+','+
  JSON.stringify("+'\\n'+lookahead148.toString()+'\\n'+lookahead1487.toString()+'\\n'+explain146.toString()")+');',
 'patch('+JSON.stringify("'suggested=lookahead148(game,weights,tally,ARCANE144_SIDES[side]);',")+','+
  JSON.stringify("'suggested=lookahead1487(game,weights,tally,ARCANE144_SIDES[side]);',")+');',
 'patch('+JSON.stringify("vm.exec('var ARCANE147_TRACE='+String(auditCapture)+';');")+','+
  JSON.stringify("vm.exec('var ARCANE147_TRACE='+String(auditCapture)+';');\n vm.exec('var ARCANE1487_CONFIG='+JSON.stringify(scene.policy1487||{})+';');")+');',
 'script=script.replace("function play(scene",POLICY_SOURCE+"\\nfunction play(scene");',
 "new Function('require','process','console',script+RUN_SOURCE)(require,process,console);"
].join('\n');
const policySource=[visibleReply1487,lookahead1487].map(fn=>fn.toString()).join('\n');
new Function('require','process','console','POLICY_SOURCE','RUN_SOURCE',prelude+'\n'+glue)(
 require,process,console,policySource,'('+run1487.toString()+')();');
