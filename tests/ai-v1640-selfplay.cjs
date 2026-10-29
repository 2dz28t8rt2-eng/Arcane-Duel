'use strict';
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
all('artifacts/v1571','artifacts/v1640');
all('arcane-v1571-','arcane-v1640-');
all('ARCANE_V1571_','ARCANE_V1630_');
once('15710000+','16400000+');
once('seed:15710042','seed:16400042');
once('assert.equal(endgame.sourceRun,40477542888);','assert.equal(endgame.sourceRun,40852605154);');
all('defender-v1569-endgame-control','defender-v1640-survival-control');
all('defender-v1569-mixed-control','defender-v1640-counterplay');
all('role-identity-conditional-fusion','fusion-v1640-role-economics');

// The v14.9.71 TRAIN-only diagnostics identify risky Soul discharge and
// insufficient direct H2H strength. Score genuine legal counterplay and
// preserve essence; do not adjust game rules or grant artificial bonuses.
once(
 ` const learnedEndgame={...unifiedReply,defenderEndgameModel:endgame.learned,\n  defenderEndgameReplyDepth:3};\n const mixedCooperation={...learnedEndgame,defenderCooperationPlanner:true};\n const identityFusions={...mixedCooperation,fusionIdentityPlanner:true,predatorSwarmPreservation:true};`,
 ` const learnedEndgame={...targetedL10,defenderUnifiedReplyValue:.40,defenderCriticalReplyPlanner:.60,defenderEndgameModel:endgame.learned,\n  defenderEndgameReplyDepth:3,defenderDischargeWindow:true,\n  defenderDischargeSurvivalGate:true,defenderRaidDischargeContest:.80,\n  defenderPairedActionForecast:.74,defenderSelectiveL10Branches:true};\n const mixedCooperation={...learnedEndgame,defenderCriticalReplyPlanner:.72,defenderCooperationPlanner:true,\n  defenderDischargeCounterfactual:true,defenderThreatSurvivalValue:true};\n const identityFusions={...mixedCooperation,fusionIdentityPlanner:true,\n  predatorSwarmPreservation:true};`
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
 once("  return {a:action,score:value,lethal,immediate};",String.raw\`
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
  return {a:action,score:value,lethal,immediate};\`);

 new Function('require','process','console',source)(require,process,console);
