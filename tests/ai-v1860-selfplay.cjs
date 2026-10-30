'use strict';
if(process.env.ARCANE_RESEARCH_BALANCE_V169!=='control10')throw Error('v17.7 must retain 15/90/100/120');
/* v16.2: role-scoped high-threat champion curriculum; research only. Reuse the sealed v14.9.71 simulator and change
 * only predeclared policy arms and research output names. All replacements
 * are fail-closed so a changed upstream harness cannot silently drift. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let source=fs.readFileSync(path.join(__dirname,'ai-v1571-roles-selfplay.cjs'),'utf8');
function once(before,after){
 assert.equal(source.split(before).length,2,'Expected exactly one v14.9.71 anchor: '+before.slice(0,90));
 source=source.replace(before,after);
}
function all(before,after,min=1){
 const count=source.split(before).length-1;
 assert.ok(count>=min,'Missing v14.9.71 anchor: '+before);
 source=source.split(before).join(after);
}
const balance=require('./helpers/research-ai-v186.cjs').mode();
if(process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V178!=='control')throw Error('v17.9 production card balance must not be reduced a second time');
// Inject candidate-seat assignment into actual duel and record real heal telemetry.
// Count ONLY real board attacks (not tactical clone simulations or counterstrikes).
// Separate role, attacker side, legitimate attack attempts, switched positions and LP damage.
const createAttackMetricsAnchor="' counter.siegeEnemyAttackActions=0;counter.siegeEnemySoulOffense=0;',";
assert.equal(source.split(createAttackMetricsAnchor).length,2,'v17.5 telemetry init anchor changed');
source=source.replace(createAttackMetricsAnchor,createAttackMetricsAnchor+"\n' counter.offenseBySeat=[{},{}];',");
const attackCall="'  try{return baseAttack(game,ai,di);}finally{delete game.__siegeSilentCounter;}',";
assert.equal(source.split(attackCall).length,2,'v17.5 actual attack wrapper anchor changed');
source=source.replace(attackCall,[
 "'  const activeSeat=game.active,attacker=game.players[activeSeat]?.field[ai];',",
 "'  const beforeLP=game.players[1-activeSeat]?.lp??0;',",
 "'  const beforeShield=game.players[1-activeSeat]?.shield??0;',",
 "'  const targetIndex=di,targetUid=d?.uid;',",
 "'  const attackerRole=attacker?(role(attacker)===\"defender\"?\"guardian\":role(attacker)):\"unknown\";',",
 "'  const track=game===g&&!!attacker;',",
 "'  const attackMetrics=track?(counter.offenseBySeat[activeSeat][attackerRole]||',",
 "'   (counter.offenseBySeat[activeSeat][attackerRole]={attempted:0,successful:0,',",
 "'    direct:0,targeted:0,destroyed:0,lpDamage:0,shieldDamage:0,switchToAtk:0,switchToDef:0})):null;',",
 "'  if(attackMetrics)attackMetrics.attempted++;',",
 "'  try{',",
 "'   const result=baseAttack(game,ai,di);',",
 "'   if(attackMetrics&&result){',",
 "'    attackMetrics.successful++;',",
 "'    if(targetIndex===null||targetIndex===undefined)attackMetrics.direct++;',",
 "'    else{attackMetrics.targeted++;',",
 "'     if(targetUid&&!game.players[1-activeSeat].field.some(c=>c&&c.uid===targetUid))attackMetrics.destroyed++;}',",
 "'    attackMetrics.lpDamage+=Math.max(0,beforeLP-(game.players[1-activeSeat]?.lp??beforeLP));',",
 "'    attackMetrics.shieldDamage+=Math.max(0,beforeShield-(game.players[1-activeSeat]?.shield??beforeShield));',",
 "'   }',",
 "'   return result;',",
 "'  }finally{delete game.__siegeSilentCounter;}',"
].join("\n"));
const switchAnchor="'  const ok=baseApply(game,action);',";
assert.equal(source.split(switchAnchor).length,4,'v17.5 expects three upstream switch/apply references; instrument first real apply action only');
source=source.replace(switchAnchor,[
 "'  const actionSeat=game.active;',",
 "'  const actionIndex=Number.isInteger(action?.idx)?action.idx:Number.isInteger(action?.ai)?action.ai:null;',",
 "'  const switchCard=action?.type===\"switch\"&&actionIndex!==null?game.players[actionSeat]?.field[actionIndex]:null;',",
 "'  const switchOldMode=switchCard?.mode||null;',",
 "'  const switchRole=switchCard?(role(switchCard)===\"defender\"?\"guardian\":role(switchCard)):null;',",
 switchAnchor,
 "'  if(game===g&&ok&&switchCard&&switchOldMode!==switchCard.mode){',",
 "'   const row=counter.offenseBySeat[actionSeat][switchRole]||',",
 "'    (counter.offenseBySeat[actionSeat][switchRole]={attempted:0,successful:0,',",
 "'     direct:0,targeted:0,destroyed:0,lpDamage:0,shieldDamage:0,switchToAtk:0,switchToDef:0});',",
 "'   if(switchCard.mode===\"atk\")row.switchToAtk++;',",
 "'   else if(switchCard.mode===\"def\")row.switchToDef++;',",
 "'  }',"
].join("\n"));
const candidateAnchor="' g.strategicTraining.siegeStage=scene.siegeStage;',";
assert.equal(source.split(candidateAnchor).length,2,'v17.4 candidate anchor changed');
source=source.replace(candidateAnchor,candidateAnchor+"\n' g.strategicTraining.researchHealCandidateSeat=learner;',\n' window.__guardianV178StartGame(g,learner);',");
const caseAnchor="focusMode,focusGroup:stage===8||stage===9||stage===10?sameOpponentPair:null,";
assert.equal(source.split(caseAnchor).length,2,'v17.4 full-match case anchor changed');
source=source.replace(caseAnchor,caseAnchor+"\n      guardianHealMetrics:m.stats.guardianHealMetrics,\n      offenseBySeat:m.stats.offenseBySeat,\n      guardianV178Combat:m.stats.guardianV178Combat,\n      guardianV178Setup:m.stats.guardianV178Setup,");
const execAnchor="const inner='\\nnew Function";
assert.equal(source.split(execAnchor).length,2,'v17.4 inner simulator anchor changed');
source=source.replace(execAnchor,
 "patchLines.push('patch('+JSON.stringify('stats:counter};')+','+JSON.stringify('stats:{...counter,guardianHealMetrics:g.__researchGuardianHealMetrics||null,offenseBySeat:counter.offenseBySeat,guardianV178Combat:g.__guardianV178Combat||null,guardianV178Setup:g.__guardianV178Setup||null}};')+');');\n"+execAnchor);

// New deck seeds for stage-8/9 focused role evaluations. Matched across all cohorts.
const seedA="const seedA=5351+sameOpponentPair*157+scenario*79+pairedStage*241;";
const seedB="const seedB=5609+sameOpponentPair*151+scenario*91+pairedStage*(stage===7?170:231);";
assert.equal(source.split(seedA).length,2,'v17.8 seed A source changed');
assert.equal(source.split(seedB).length,2,'v17.8 seed B source changed');
source=source.replace(seedA,"const seedA=5351+sameOpponentPair*157+scenario*79+pairedStage*241+(stage===8?1860:stage===9?860:0);");
source=source.replace(seedB,"const seedB=5609+sameOpponentPair*151+scenario*91+pairedStage*(stage===7?170:231)+(stage===8?1860:stage===9?860:0);");

all('artifacts/v1571','artifacts/v1860/'+balance);
all('arcane-v1571-','arcane-v1860-');
all('ARCANE_V1571_','ARCANE_V1630_');
once('15710000+','18600000+');
once('seed:15710042','seed:18600042');
once('assert.equal(endgame.sourceRun,40477542888);','assert.equal(endgame.sourceRun,0);');
all('defender-v1569-endgame-control','defender-v1860-survival-control');
all('defender-v1569-mixed-control','defender-v1860-counterplay');
all('role-identity-conditional-fusion','fusion-v1860-role-economics');

// The v14.9.71 TRAIN-only diagnostics identify risky Soul discharge and
// insufficient direct H2H strength. Score genuine legal counterplay and
// preserve essence; do not adjust game rules or grant artificial bonuses.
once(
 ` const learnedEndgame={...unifiedReply,defenderEndgameModel:endgame.learned,\n  defenderEndgameReplyDepth:3};\n const mixedCooperation={...learnedEndgame,defenderCooperationPlanner:true};\n const identityFusions={...mixedCooperation,fusionIdentityPlanner:true,predatorSwarmPreservation:true};`,
 ` const learnedEndgame={...targetedL10,defenderBondPlanner:.60,defenderUnifiedReplyValue:.40,defenderCriticalReplyPlanner:.60,defenderEndgameModel:endgame.learned,\n  defenderEndgameReplyDepth:3,defenderDischargeWindow:true,\n  defenderDischargeSurvivalGate:true,defenderRaidDischargeContest:.80,\n  defenderPairedActionForecast:.74,defenderSelectiveL10Branches:true};\n const mixedCooperation={...learnedEndgame,defenderBondPlanner:.92,defenderCriticalReplyPlanner:.72,defenderCooperationPlanner:true,\n  defenderDischargeCounterfactual:true,defenderThreatSurvivalValue:true};\n const identityFusions={...mixedCooperation,fusionIdentityPlanner:true,\n  predatorSwarmPreservation:true};`
);
// The previous run evaluated 3–5-material choices but overwhelmingly took
// two-material fusions. Reward additional HAND materials only when the
// resulting monster is stronger and survives the legal cloned reply.
once(
 `'       const extraValue=materials.length>=3&&product&&powerGain>materialCost?',\n'        Math.min(80,(materials.length-2)*24):0;',`,
 `'       const extraValue=materials.length>=3&&product&&fieldPaid===0&&',\n'        fusedPower>strongest?Math.min(150,(materials.length-2)*52):0;',`
);
once('       tacticalCorrection+=correction*.75;','       tacticalCorrection+=correction*.82;');

// v16.0: keep all frozen baseline arms; tune ONLY experimental policy arms.
 // These parameters are predeclared before any current validation/holdout games.
 once('defenderPairedActionForecast:.74,defenderSelectiveL10Branches:true',
      'defenderPairedActionForecast:.70,defenderSelectiveL10Branches:true');
 once('defenderRaidDischargeContest:.80,',
      'defenderRaidDischargeContest:.86,');
 // Keep role-scoped fusionIdentityPlanner (stage 9) and swarm preservation (stage 10); no global fusion overrides.

 // v16.3: independent visible-board post-reply evaluation in all defender
 // experiments; low weight to avoid counting overlapping forecasts twice.
 // Stage-7 hard-L10 and stage-8 mixed decks: value real survival of both roles
 // after legal placement/switch and up to two enemy attacks; never fabricate
 // attacks, hidden draws, outcomes, or a stat bonus.
 once("if(w.defenderCooperationPlanner&&scene.studyStage===8&&!lethal&&",
      "if(w.defenderCooperationPlanner&&(scene.studyStage===7||scene.studyStage===8)&&!lethal&&");
 once("['attack','soul-raid','soul-discharge','soul-condense'].includes(action.type)){",
      "['attack','soul-raid','soul-discharge','soul-condense'].includes(action.type)){");
 once("const gs=a.field.filter(c=>c&&role(c)==='guardian'&&c.mode==='def').length;",
      "const gs=xown.field.filter(c=>c&&role(c)==='guardian'&&c.mode==='def').length;");
 once("const ss=a.field.filter(c=>c&&role(c)==='soul'&&c.mode==='def').length;",
      "const ss=xown.field.filter(c=>c&&role(c)==='soul'&&c.mode==='def').length;");
 once("const change=Math.max(-340,Math.min(230,realOutcome))*.60;",
      "const change=Math.max(-340,Math.min(230,realOutcome))*.72;");


 // v16.4: optional high-threat legality-scoped post-action counterplay.
 // Unlike observational loss-difference labels, each candidate replays actual
 // legal attacks from the SAME PUBLIC successor state, without drawing cards.
 // This applies ONLY to defender research in focused L10/H2H/mixed stages.
 once("  return {a:action,score:value,lethal,immediate};",String.raw`
  if(w.defenderCriticalReplyPlanner&&!lethal&&
     [4,7,8].includes(scene.studyStage)&&
     ['guardian','soul'].includes(scene.candidateRole)&&
     ['attack','soul-raid','soul-discharge','soul-condense'].includes(action.type)){
   const peak=Math.max(0,...e.field.filter(Boolean).map(c=>dataOf(c).atk));
   const tier=Math.max(0,...e.field.filter(Boolean).map(c=>dataOf(c).level||0));
   const urgent=tier>=7||a.lp<=Math.max(2600,peak*2.2);
   if(urgent&&peak>0){
    const follow=JSON.parse(JSON.stringify(x));
    follow.active=opp;follow.turn++;follow.aiPhase='attacks';
    for(const c of follow.players[opp].field)if(c)c.attacked=false;
    let replies=0;
    for(let n=0;n<3&&follow.winner===null;n++){
     const m=attackPlan(follow);
     if(!m||!Number.isInteger(m.ai)||!attack(follow,m.ai,m.di))break;
     replies++;
    }
    const future=follow.players[me],foe=follow.players[opp];
    const startG=xown.field.filter(c=>c&&role(c)==='guardian').length;
    const startS=xown.field.filter(c=>c&&role(c)==='soul').length;
    const endG=future.field.filter(c=>c&&role(c)==='guardian').length;
    const endS=future.field.filter(c=>c&&role(c)==='soul').length;
    const lostG=Math.max(0,startG-endG),lostS=Math.max(0,startS-endS);
    const ownLoss=Math.max(0,xown.lp-future.lp);
    const enemyLoss=Math.max(0,xfoe.lp-foe.lp);
    const lostMonsters=Math.max(0,xown.field.filter(Boolean).length-future.field.filter(Boolean).length);
    const enemyLost=Math.max(0,xfoe.field.filter(Boolean).length-foe.field.filter(Boolean).length);
    // Only observed outcomes after real legal moves; protect true mutual
    // survivability, not merely owning both roles before an attack.
    const roleLoss=lostG*185+lostS*220;
    const attrition=lostMonsters*130;
    const swing=enemyLost*145+Math.min(230,enemyLoss*.24)-
      roleLoss-attrition-Math.min(500,ownLoss*.35);
    const continuation=(startG>0&&startS>0&&endG>0&&endS>0&&replies>0)?55:0;
    const score=Math.max(-750,Math.min(300,swing+continuation));
    value+=(score-(follow.winner===opp?900:0))*w.defenderCriticalReplyPlanner;
    counter.defenderCriticalReplyChecks=(counter.defenderCriticalReplyChecks||0)+1;
    counter.defenderCriticalReplyAttacks=(counter.defenderCriticalReplyAttacks||0)+replies;
    counter.defenderCriticalReplyOwnLoss=(counter.defenderCriticalReplyOwnLoss||0)+ownLoss;
    counter.defenderCriticalReplyRoleLoss=(counter.defenderCriticalReplyRoleLoss||0)+lostG+lostS;
    counter.defenderCriticalReplyLethal=(counter.defenderCriticalReplyLethal||0)+(follow.winner===opp?1:0);
   }
  }
  return {a:action,score:value,lethal,immediate};`);


 // v16.5: new v20.6 Solo/Soul Bond calibration. Historical endgame labels
 // from previous 35%-solo rules are RESET; no previous VALIDATION/HOLDOUT
 // or previous rule-regime outcomes may influence the new candidate.
 once("assert.ok(endgame.nonzero>=3);",
      "assert.equal(endgame.nonzero,0);assert.equal(endgame.ruleChangeReset,true);assert.equal(endgame.validationUsed,false);assert.equal(endgame.holdoutUsed,false);");
 // Real adjacency is computed via the same live v20.6 rules, not an invented
 // deck synergy bonus. Score a bond only when it survives legal enemy replies
 // and both linked cards remain in DEF.
 const bondLines=[
  '     if(roleWeights?.defenderBondPlanner&&scene.studyStage===8&&',
  '       ["guardian","soul"].includes(scene.candidateRole)){',
  '      const api=window.ArcaneEssenceCombat;',
  '      const prev=api.soulBonds(g,actor),next=api.soulBonds(x,actor);',
  '      const key=b=>b.guardian.uid+":"+b.soul.uid;',
  '      const beforeKeys=new Set(prev.map(key)),afterKeys=new Set(next.map(key));',
  '      const born=next.filter(b=>!beforeKeys.has(key(b))).length;',
  '      const broken=prev.filter(b=>!afterKeys.has(key(b))).length;',
  '      const active=next.filter(b=>b.guardian.mode==="def"&&b.soul.mode==="def");',
  '      const eBefore=prev.reduce((n,b)=>n+(b.soul.essenceCombat?.soul||0),0);',
  '      const eAfter=next.reduce((n,b)=>n+(b.soul.essenceCombat?.soul||0),0);',
  '      const gained=Math.max(0,eAfter-eBefore);',
  '      const ownBefore=g.players[actor],ownAfter=x.players[actor];',
  '      const lostLP=Math.max(0,ownBefore.lp-ownAfter.lp);',
  '      const gainedLP=Math.max(0,ownAfter.lp-ownBefore.lp);',
  '      const survivedNew=active.filter(b=>!beforeKeys.has(key(b))).length;',
  '      const gain=Math.min(250,survivedNew*95+Math.min(80,gained*.85)+Math.min(90,gainedLP*.10));',
  '      const loss=Math.min(480,broken*185+Math.min(110,lostLP*.06));',
  '      tacticalCorrection+=roleWeights.defenderBondPlanner*(gain-loss);',
  '      counter.defenderBondPlacementChecks=(counter.defenderBondPlacementChecks||0)+1;',
  '      counter.defenderBondNewPairs=(counter.defenderBondNewPairs||0)+born;',
  '      counter.defenderBondBrokenPairs=(counter.defenderBondBrokenPairs||0)+broken;',
  '      counter.defenderBondSurvivingPairs=(counter.defenderBondSurvivingPairs||0)+active.length;',
  '      counter.defenderBondObservedEssenceGain=(counter.defenderBondObservedEssenceGain||0)+gained;',
  '      counter.defenderBondObservedLpLoss=(counter.defenderBondObservedLpLoss||0)+lostLP;',
  '     }'
 ];
 const marker="'     return before*.2+future*.8+entry.score*.2-(scene.roleAware?fragile:0)+tacticalCorrection;'";
 once(marker,bondLines.map(l=>JSON.stringify(l)).join(',\n')+',\n'+marker);
 // On the attack/ability branch, compare actual surviving links and real
 // newly stored essence after cloned legal opponent actions; never assume
 // two same-deck roles means they are adjacent.
 once("const change=Math.max(-340,Math.min(230,realOutcome))*.72;",
      "const validLinks=window.ArcaneEssenceCombat.soulBonds(z,me);\n    const oldLinks=window.ArcaneEssenceCombat.soulBonds(x,me);\n    const newEnergy=validLinks.reduce((n,b)=>n+(b.soul.essenceCombat?.soul||0),0);\n    const oldEnergy=oldLinks.reduce((n,b)=>n+(b.soul.essenceCombat?.soul||0),0);\n    const protectedLinks=validLinks.filter(b=>b.guardian.mode==='def'&&b.soul.mode==='def').length;\n    const bondScore=w.defenderBondPlanner?Math.max(-160,Math.min(110,(newEnergy-oldEnergy)*.85+protectedLinks*25-Math.max(0,oldLinks.length-validLinks.length)*120))*w.defenderBondPlanner:0;\n    value+=bondScore;\n    counter.defenderBondReplyChecks=(counter.defenderBondReplyChecks||0)+Number(!!w.defenderBondPlanner);\n    const change=Math.max(-340,Math.min(230,realOutcome))*.72;");

 // v18.0: choose a truly different LEGAL action when a targeted attack
 // destroys a visible high-threat enemy without exposing our own formation.
 // Unlike v17.9 scalar nudges, this can change the executed move.
 // Never evaluate hidden hands, draws or a simulated unknown full enemy turn.
 {
  once(' const learnedEndgame={...targetedL10,defenderBondPlanner:.60,',
       ' const learnedEndgame={...targetedL10,defenderTacticalOverride:true,defenderBondPlanner:.60,');
 }
 const legacyTacticalLines=[
"const defenseCfg=scene.rolePolicy;",
"if(game===g&&game.active===learner&&defenseCfg?.defenderTacticalOverride&&",
" [4,7,8,9].includes(scene.studyStage)&&[\"guardian\",\"soul\"].includes(scene.candidateRole)&&",
" game.aiPhase===\"attacks\"&&game.winner===null&&!game.pending){",
" counter.v1860TacticalChecks=(counter.v1860TacticalChecks||0)+1;",
" const me=game.active,op=1-me,own=game.players[me],foe=game.players[op];",
" const previous=baseChoose(game,policy);",
" if(previous&&[\"attack\",\"end\"].includes(previous.type)){",
"  const bonds=(st)=>window.ArcaneEssenceCombat.soulBonds(st,me).filter(b=>",
"   b.guardian.mode===\"def\"&&b.soul.mode===\"def\").length;",
"  const beforeBonds=bonds(game);",
"  const threat=p=>p.field.filter(Boolean).reduce((n,c)=>n+dataOf(c).atk*.20+",
"   (dataOf(c).level||0)*12+(role(c)===\"soul\"?70:0),0);",
"  const beforeThreat=threat(foe);",
"  const investigate=move=>{",
"   const z=JSON.parse(JSON.stringify(game));",
"   if(!attack(z,move.ai,move.di))return null;",
"   counter.v1860LegalTrials=(counter.v1860LegalTrials||0)+1;",
"   const za=z.players[me],ze=z.players[op];",
"   const damage=Math.max(0,foe.lp-ze.lp),self=Math.max(0,own.lp-za.lp);",
"   const removed=Math.max(0,foe.field.filter(Boolean).length-ze.field.filter(Boolean).length);",
"   const ownLoss=Math.max(0,own.field.filter(Boolean).length-za.field.filter(Boolean).length);",
"   const bondChange=bonds(z)-beforeBonds,threatRemoved=Math.max(0,beforeThreat-threat(ze));",
"   counter.v1860BoardEvaluations=(counter.v1860BoardEvaluations||0)+1;",
"   if(beforeBonds||bondChange)counter.v1860BondEvaluations=(counter.v1860BondEvaluations||0)+1;",
"   const immediateWin=z.winner===me;",
"   let score=immediateWin?100000:damage*.21+self*-.48+",
"    Math.max(0,(foe.shield||0)-(ze.shield||0))*.1+",
"    threatRemoved*.75+removed*110-ownLoss*480+bondChange*170;",
"   let sequenceWin=false,followUpDamage=0;",
"   // Same CURRENT turn through legal attack(); never construct a fictional enemy turn here.",
"   if(!immediateWin&&z.winner===null&&z.active===me&&",
"      (scene.decayEnabled||ze.lp<=3600||za.lp<=3000||za.field.some(c=>c&&canAttack(z,c)))){",
"    const next=attackPlan(z);",
"    if(next&&Number.isInteger(next.ai)){",
"     const f=JSON.parse(JSON.stringify(z));",
"     if(attack(f,next.ai,next.di)){",
"      counter.v1860SequenceTrials=(counter.v1860SequenceTrials||0)+1;",
"      sequenceWin=f.winner===me;",
"      followUpDamage=Math.max(0,ze.lp-f.players[op].lp);",
"      if(sequenceWin){",
"       score+=45000;",
"       counter.v1860SequenceFinishers=(counter.v1860SequenceFinishers||0)+1;",
"      }else{",
"       score+=Math.min(450,followUpDamage*.08);",
"       if(bonds(f)<bonds(z))score-=85;",
"      }",
"     }",
"    }",
"   }",
"   const reason=immediateWin?\"visible-finisher\":sequenceWin?\"two-attack-finisher\":",
"    bondChange>0?\"bond-preservation\":threatRemoved>=150?\"safe-threat-removal\":",
"    damage>0?\"lp-pressure\":\"board-control\";",
"   return {score,reason,immediateWin,sequenceWin,removed,damage,ownLoss,",
"    bondChange,threatRemoved,followUpDamage};",
"  };",
"  const original=previous.type===\"attack\"&&Number.isInteger(previous.ai)?",
"   investigate({type:\"attack\",ai:previous.ai,di:previous.di??null}):null;",
"  const originalScore=original?.score??-25;",
"  let best=null,result=null,trials=0;",
"  const targets=foe.field.some(Boolean)?foe.field.map((c,di)=>({c,di})).filter(x=>x.c):",
"   [{c:null,di:null}];",
"  for(const {i} of own.field.map((c,i)=>({c,i})).filter(x=>x.c&&canAttack(game,x.c))){",
"   for(const {di} of targets){",
"    if(trials++>=18)break;",
"    const move={type:\"attack\",ai:i,di},v=investigate(move);",
"    if(v&&(!result||v.score>result.score)){best=move;result=v;}",
"    if(v?.immediateWin)break;",
"   }",
"   if(result?.immediateWin||trials>=18)break;",
"  }",
"  if(best&&result){",
"   const changed=previous.type!==\"attack\"||previous.ai!==best.ai||",
"    (previous.di??null)!==(best.di??null);",
"   const margin=result.score-originalScore;",
"   if(changed&&(result.immediateWin||result.sequenceWin||",
"     (result.score>=25&&margin>=45))){",
"    counter.v1860TacticalOverrides=(counter.v1860TacticalOverrides||0)+1;",
"    counter.v1860ThreatRemoved=(counter.v1860ThreatRemoved||0)+Number(result.removed>0);",
"    counter.v1860FinisherOverrides=(counter.v1860FinisherOverrides||0)+",
"     Number(result.immediateWin||result.sequenceWin);",
"    const logs=counter.v1860DecisionTraces||(counter.v1860DecisionTraces=[]);",
"    if(logs.length<6)logs.push({turn:game.turn,stage:scene.studyStage,",
"     role:scene.candidateRole,reason:result.reason,",
"     previous:{type:previous.type,ai:previous.ai??null,di:previous.di??null},",
"     chosen:best,attackerUid:own.field[best.ai]?.uid??null,",
"     targetUid:best.di===null?null:foe.field[best.di]?.uid??null,",
"     enemyLP:foe.lp,ownLP:own.lp,score:result.score,priorScore:originalScore,",
"     expectedDamage:result.damage,expectedOwnLoss:result.ownLoss,",
"     expectedReplyLP:0,expectedReplyLoss:0,expectedVisibleReply:false,",
"     expectedImmediateWin:result.immediateWin,expectedSequenceWin:result.sequenceWin,",
"     expectedFollowUpDamage:result.followUpDamage,",
"     expectedBondChange:result.bondChange,",
"     expectedBoardThreatRemoved:result.threatRemoved});",
"    return best;",
"   }",
"  }",
" }",
"}"
 ];

function replaceTactic(before,after){
 const count=tactic.split(before).length-1;
 assert.equal(count,1,'v18.6 tactic anchor changed: '+before.slice(0,75));
 tactic=tactic.replace(before,after);
}
let tactic=legacyTacticalLines.join('\n');
// Wider strategic curriculum, same live rules and role restrictions.
replaceTactic('[4,7,8,9].includes(scene.studyStage)','[4,5,6,7,8,9,10].includes(scene.studyStage)');
// Sealed v18.3 HOLDOUT replay: two 100000-point moves must NOT be swapped.
replaceTactic('  const originalScore=original?.score??-25;',
  '  const originalScore=original?.score??-25;\n  if(original?.immediateWin)counter.v1860SafeFinisherKept=(counter.v1860SafeFinisherKept||0)+1;');
replaceTactic('   if(changed&&(result.immediateWin||result.sequenceWin||\n     (result.score>=25&&margin>=45))){',
  '   if(changed&&!original?.immediateWin&&(\n     result.immediateWin||(result.sequenceWin&&!original?.sequenceWin)||\n     (!original?.sequenceWin&&result.score>=35&&margin>=65))){');
replaceTactic('    counter.v1860TacticalOverrides=(counter.v1860TacticalOverrides||0)+1;',
  '    counter.v1860TacticalOverrides=(counter.v1860TacticalOverrides||0)+1;\n    if(result.sequenceWin)counter.v1860SequenceWinChoices=(counter.v1860SequenceWinChoices||0)+1;');
replaceTactic('     expectedImmediateWin:result.immediateWin,expectedSequenceWin:result.sequenceWin,',
  '     expectedImmediateWin:result.immediateWin,expectedSequenceWin:result.sequenceWin,\n     priorImmediateWin:original?.immediateWin||false,priorSequenceWin:original?.sequenceWin||false,');
replaceTactic('     expectedBondChange:result.bondChange,',
  '     expectedBondChange:result.bondChange,\n     expectedSecondMove:result.secondMove||null,');
replaceTactic('  const beforeBonds=bonds(game);',
  '  const beforeBonds=bonds(game);\n  const bondReserve=st=>window.ArcaneEssenceCombat.soulBonds(st,me).reduce((n,b)=>\n   n+(b.guardian?.mode==="def"&&b.soul?.mode==="def"?\n     Math.min(200,b.soul?.essenceCombat?.soul||0):0),0);\n  const beforeReserve=bondReserve(game);');
replaceTactic('    threatRemoved*.75+removed*110-ownLoss*480+bondChange*170;',
  '    threatRemoved*.75+removed*110-ownLoss*480+bondChange*170+\n    (bondReserve(z)-beforeReserve)*.28;');
// A bounded *enumeration* of legal follow-up attacks instead of a single greedy attackPlan.
const secondFrom=[
'    const next=attackPlan(z);',
'    if(next&&Number.isInteger(next.ai)){',
'     const f=JSON.parse(JSON.stringify(z));',
'     if(attack(f,next.ai,next.di)){',
'      counter.v1860SequenceTrials=(counter.v1860SequenceTrials||0)+1;',
'      sequenceWin=f.winner===me;',
'      followUpDamage=Math.max(0,ze.lp-f.players[op].lp);',
'      if(sequenceWin){',
'       score+=45000;',
'       counter.v1860SequenceFinishers=(counter.v1860SequenceFinishers||0)+1;',
'      }else{',
'       score+=Math.min(450,followUpDamage*.08);',
'       if(bonds(f)<bonds(z))score-=85;',
'      }',
'     }',
'    }'].join('\n');
const secondTo=[
'    const targets2=ze.field.some(Boolean)?',
'      ze.field.map((c,di)=>c?di:null).filter(di=>di!==null):[null];',
'    let checked2=0,best2=-Infinity,chosen2=null;',
'    for(const [ai,c] of za.field.entries()){',
'     if(!c||!canAttack(z,c))continue;',
'     for(const di of targets2){',
'      if(checked2++>=6)break;',
'      const f=JSON.parse(JSON.stringify(z));',
'      if(!attack(f,ai,di))continue;',
'      counter.v1860SequenceTrials=(counter.v1860SequenceTrials||0)+1;',
'      const isWin=f.winner===me;',
'      const dealt=Math.max(0,ze.lp-f.players[op].lp);',
'      const ownLost=Math.max(0,za.field.filter(Boolean).length-f.players[me].field.filter(Boolean).length);',
'      const gain=(isWin?45000:Math.min(450,dealt*.08))',
'        -ownLost*200+(bondReserve(f)-bondReserve(z))*.15;',
'      if(isWin)counter.v1860SequenceFinishers=(counter.v1860SequenceFinishers||0)+1;',
'      if(gain>best2){best2=gain;chosen2={ai,di,isWin,dealt};}',
'     }',
'     if(checked2>=6)break;',
'    }',
'    if(chosen2){',
'      score+=best2;',
'      sequenceWin=chosen2.isWin;',
'      followUpDamage=chosen2.dealt;',
'      secondMove={type:"attack",ai:chosen2.ai,di:chosen2.di};',
'    }'].join('\n');
replaceTactic(secondFrom,secondTo);
replaceTactic('   let sequenceWin=false,followUpDamage=0;',
 '   let sequenceWin=false,followUpDamage=0,secondMove=null;');
replaceTactic('   return {score,reason,immediateWin,sequenceWin,removed,damage,ownLoss,',
 '   return {score,reason,immediateWin,sequenceWin,secondMove,removed,damage,ownLoss,');
const tacticalLines=balance==='optimized'?require('./helpers/ai-v1860-mechanics.cjs').plannerLines:require('./helpers/ai-v1860-mechanics-control.cjs').plannerLines;

  const tacticalAnchor='"   const defenseCfg=scene.rolePolicy;",';
 once(tacticalAnchor,tacticalLines.map(x=>JSON.stringify(x)).join(',\n')+',');
 // Preserve per-duel action-difference telemetry alongside recorded REAL
 // attacks; these numbers cannot be created by hypothetical attack clones.
 once('      candidateActionMix:m.stats.selfPlayActionTypesBySeat[seat],',
      '      candidateActionMix:m.stats.selfPlayActionTypesBySeat[seat],\n'+
      '      v1860TacticalChecks:m.stats.v1860TacticalChecks||0,\n'+
      '      v1860LegalTrials:m.stats.v1860LegalTrials||0,\n'+
      '      v1860TacticalOverrides:m.stats.v1860TacticalOverrides||0,\n'+
      '      v1860ThreatRemoved:m.stats.v1860ThreatRemoved||0,\n'+
      '      v1860FinisherOverrides:m.stats.v1860FinisherOverrides||0,\n'+
      '      v1860ReplyTrials:m.stats.v1860ReplyTrials||0,\n'+
      '      v1860ReplyAwareOverrides:m.stats.v1860ReplyAwareOverrides||0,\n'+
      '      v1860SequenceTrials:m.stats.v1860SequenceTrials||0,\n'+
      '      v1860SequenceFinishers:m.stats.v1860SequenceFinishers||0,\n'+
      '      v1860BoardEvaluations:m.stats.v1860BoardEvaluations||0,\n'+
      '      v1860BondEvaluations:m.stats.v1860BondEvaluations||0,\n'+
      '      v1860SafeFinisherKept:m.stats.v1860SafeFinisherKept||0,\n'+
      '      v1860SequenceWinChoices:m.stats.v1860SequenceWinChoices||0,\n'+
      '      v1860DecisionTraces:m.stats.v1860DecisionTraces||[],');

 // Experimental cohort: change ONLY defender decision heuristics on the
 // already-live 95%/22:78 Guardian catalog. Frozen champion remains fixed.
 {
  for(const [before,after] of [
   ['defenderCriticalReplyPlanner:.72,defenderCooperationPlanner:true','defenderCriticalReplyPlanner:.82,defenderCooperationPlanner:true'],
   ['defenderBondPlanner:.92,defenderCriticalReplyPlanner:.82','defenderBondPlanner:.96,defenderCriticalReplyPlanner:.82'],
   ['defenderRaidDischargeContest:.86,','defenderRaidDischargeContest:.88,'],
   ['tacticalCorrection+=correction*.82;','tacticalCorrection+=correction*.87;']
  ])once(before,after);
 }
 // Preserve the original outcome gates; expose new tactical diagnostics only.
 once("        defenderCooperationRolePreservedValue:m.stats.defenderCooperationRolePreservedValue||0,\n        fusionIdentityChecks:m.stats.fusionIdentityChecks||0,","        defenderCooperationRolePreservedValue:m.stats.defenderCooperationRolePreservedValue||0,\n        defenderBondPlacementChecks:m.stats.defenderBondPlacementChecks||0,\n        defenderBondNewPairs:m.stats.defenderBondNewPairs||0,\n        defenderBondBrokenPairs:m.stats.defenderBondBrokenPairs||0,\n        defenderBondSurvivingPairs:m.stats.defenderBondSurvivingPairs||0,\n        defenderBondObservedEssenceGain:m.stats.defenderBondObservedEssenceGain||0,\n        defenderBondObservedLpLoss:m.stats.defenderBondObservedLpLoss||0,\n        defenderBondReplyChecks:m.stats.defenderBondReplyChecks||0,\n        defenderCriticalReplyTripleChecks:m.stats.defenderCriticalReplyChecks||0,\n        fusionIdentityChecks:m.stats.fusionIdentityChecks||0,");
 // DEF-only Soul abilities: preserve the current game rule for research AI.
 // Do not allow illegal out-of-DEF candidate actions.
 new Function('require','process','console',source)(require,process,console);
