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
const balance=require('./helpers/research-ai-v182.cjs').mode();
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
source=source.replace(seedA,"const seedA=5351+sameOpponentPair*157+scenario*79+pairedStage*241+(stage===8?810:stage===9?510:0);");
source=source.replace(seedB,"const seedB=5609+sameOpponentPair*151+scenario*91+pairedStage*(stage===7?170:231)+(stage===8?810:stage===9?510:0);");

all('artifacts/v1571','artifacts/v1820/'+balance);
all('arcane-v1571-','arcane-v1820-');
all('ARCANE_V1571_','ARCANE_V1630_');
once('15710000+','18000000+');
once('seed:15710042','seed:18200042');
once('assert.equal(endgame.sourceRun,40477542888);','assert.equal(endgame.sourceRun,0);');
all('defender-v1569-endgame-control','defender-v1820-survival-control');
all('defender-v1569-mixed-control','defender-v1820-counterplay');
all('role-identity-conditional-fusion','fusion-v1820-role-economics');

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
 if(balance==='optimized'){
  once(' const learnedEndgame={...targetedL10,defenderBondPlanner:.60,',
       ' const learnedEndgame={...targetedL10,defenderTacticalOverride:true,defenderBondPlanner:.60,');
 }
 const tacticalLines=[
"   const defenseCfg=scene.rolePolicy;",
"   if(game===g&&game.active===learner&&defenseCfg?.defenderTacticalOverride&&",
"      [4,7,8,9].includes(scene.studyStage)&&",
"      [\"guardian\",\"soul\"].includes(scene.candidateRole)&&",
"      game.aiPhase===\"attacks\"&&game.winner===null&&!game.pending){",
"     counter.v1820TacticalChecks=(counter.v1820TacticalChecks||0)+1;",
"     const me=game.active,op=1-me,own=game.players[me],foe=game.players[op];",
"     // The live game's attack() validates each cloned attempt. No guessed",
"     // future draw, opponent hidden hand or relaxed attack delay.",
"     let best=null,bestScore=-Infinity,bestReason=\"\";",
"     if(!foe.field.some(Boolean)){",
"       for(let ai=0;ai<own.field.length;ai++){",
"         if(!own.field[ai]||!canAttack(game,own.field[ai]))continue;",
"         const z=JSON.parse(JSON.stringify(game));",
"         if(!attack(z,ai,null))continue;",
"         counter.v1820LegalTrials=(counter.v1820LegalTrials||0)+1;",
"         if(z.winner===me){best={type:\"attack\",ai,di:null};",
"          bestScore=1e6;bestReason=\"visible-direct-lethal\";break;}",
"       }",
"     }else{",
"       for(let ai=0;ai<own.field.length;ai++){",
"         const attacker=own.field[ai];if(!attacker||!canAttack(game,attacker))continue;",
"         for(let di=0;di<foe.field.length;di++){",
"           const target=foe.field[di];if(!target)continue;",
"           const attr=dataOf(target);",
"           if(attr.level<7&&attr.atk<350&&role(target)!==\"soul\")continue;",
"           const z=JSON.parse(JSON.stringify(game));",
"           if(!attack(z,ai,di))continue;",
"           counter.v1820LegalTrials=(counter.v1820LegalTrials||0)+1;",
"           const removed=!z.players[op].field[di];",
"           const ourLoss=own.field.filter(Boolean).length-z.players[me].field.filter(Boolean).length;",
"           if(z.winner===me){best={type:\"attack\",ai,di};bestScore=1e6;",
"            bestReason=\"visible-target-lethal\";break;}",
"           if(!removed||ourLoss>0)continue;",
"           const foeLossLP=Math.max(0,foe.lp-z.players[op].lp);",
"           const ownLossLP=Math.max(0,own.lp-z.players[me].lp);",
"           const targetValue=attr.atk*.55+attr.def*.13+attr.level*35+",
"             (role(target)===\"soul\"?140:0);",
"           const score=targetValue+Math.min(200,foeLossLP*.12)-ownLossLP*.30;",
"           if(score>bestScore){best={type:\"attack\",ai,di};bestScore=score;",
"            bestReason=\"safe-high-threat-removal\";}",
"         }",
"         if(bestScore===1e6)break;",
"       }",
"     }",
"     if(best&&(bestScore>=280||bestScore===1e6)){",
"       const previous=baseChoose(game,policy);",
"       // Preserve nonattack abilities and summons: they have separate",
"       // resource/cooldown constraints outside this tactical experiment.",
"       if(previous&&[\"attack\",\"end\"].includes(previous.type)){",
"         let previousScore=-Infinity;",
"         if(previous.type===\"attack\"&&Number.isInteger(previous.ai)){",
"           const z=JSON.parse(JSON.stringify(game));",
"           if(attack(z,previous.ai,previous.di??null)){",
"             if(z.winner===me)previousScore=1e6;",
"             else if(Number.isInteger(previous.di)&&foe.field[previous.di]&&",
"                     !z.players[op].field[previous.di]&&",
"                     own.field.filter(Boolean).length<=z.players[me].field.filter(Boolean).length){",
"               const t=foe.field[previous.di],attr=dataOf(t);",
"               previousScore=attr.atk*.55+attr.def*.13+attr.level*35+",
"                 (role(t)===\"soul\"?140:0)+",
"                 Math.min(200,Math.max(0,foe.lp-z.players[op].lp)*.12)-",
"                 Math.max(0,own.lp-z.players[me].lp)*.30;",
"             }",
"           }",
"         }",
"         const changed=previous.type!==\"attack\"||",
"          previous.ai!==best.ai||(previous.di??null)!==(best.di??null);",
"         if(changed&&bestScore>previousScore+75){",
"           counter.v1820TacticalOverrides=(counter.v1820TacticalOverrides||0)+1;",
"           counter.v1820ThreatRemoved=(counter.v1820ThreatRemoved||0)+",
"             Number(bestReason!==\"visible-direct-lethal\");",
"           if(bestReason.includes(\"lethal\"))",
"             counter.v1820FinisherOverrides=(counter.v1820FinisherOverrides||0)+1;",
"           const log=counter.v1820DecisionTraces||(counter.v1820DecisionTraces=[]);",
"           if(log.length<6)log.push({turn:game.turn,stage:scene.studyStage,role:scene.candidateRole,",
"             reason:bestReason,previous:{type:previous.type,ai:previous.ai??null,di:previous.di??null},",
"             chosen:best,attackerUid:own.field[best.ai]?.uid??null,",
"             targetUid:best.di===null?null:foe.field[best.di]?.uid??null,",
"             enemyLP:foe.lp,ownLP:own.lp,score:bestScore,priorScore:previousScore});",
"           return best;",
"         }",
"       }",
"     }",
"   }"
 ];
 const tacticalAnchor='"   const defenseCfg=scene.rolePolicy;",';
 once(tacticalAnchor,tacticalLines.map(x=>JSON.stringify(x)).join(',\n')+',');
 // Preserve per-duel action-difference telemetry alongside recorded REAL
 // attacks; these numbers cannot be created by hypothetical attack clones.
 once('      candidateActionMix:m.stats.selfPlayActionTypesBySeat[seat],',
      '      candidateActionMix:m.stats.selfPlayActionTypesBySeat[seat],\n'+
      '      v1820TacticalChecks:m.stats.v1820TacticalChecks||0,\n'+
      '      v1820LegalTrials:m.stats.v1820LegalTrials||0,\n'+
      '      v1820TacticalOverrides:m.stats.v1820TacticalOverrides||0,\n'+
      '      v1820ThreatRemoved:m.stats.v1820ThreatRemoved||0,\n'+
      '      v1820FinisherOverrides:m.stats.v1820FinisherOverrides||0,\n'+
      '      v1820DecisionTraces:m.stats.v1820DecisionTraces||[],');

 // Experimental cohort: change ONLY defender decision heuristics on the
 // already-live 95%/22:78 Guardian catalog. Frozen champion remains fixed.
 if(balance==='optimized'){
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
