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
all('artifacts/v1571','artifacts/v1630');
all('arcane-v1571-','arcane-v1630-');
all('ARCANE_V1571_','ARCANE_V1630_');
once('15710000+','16300000+');
once('seed:15710042','seed:16300042');
once('assert.equal(endgame.sourceRun,40477542888);','assert.equal(endgame.sourceRun,40848435201);');
all('defender-v1569-endgame-control','defender-v1630-survival-control');
all('defender-v1569-mixed-control','defender-v1630-counterplay');
all('role-identity-conditional-fusion','fusion-v1630-role-economics');

// The v14.9.71 TRAIN-only diagnostics identify risky Soul discharge and
// insufficient direct H2H strength. Score genuine legal counterplay and
// preserve essence; do not adjust game rules or grant artificial bonuses.
once(
 ` const learnedEndgame={...unifiedReply,defenderEndgameModel:endgame.learned,\n  defenderEndgameReplyDepth:3};\n const mixedCooperation={...learnedEndgame,defenderCooperationPlanner:true};\n const identityFusions={...mixedCooperation,fusionIdentityPlanner:true,predatorSwarmPreservation:true};`,
 ` const learnedEndgame={...targetedL10,defenderUnifiedReplyValue:.48,defenderEndgameModel:endgame.learned,\n  defenderEndgameReplyDepth:3,defenderDischargeWindow:true,\n  defenderDischargeSurvivalGate:true,defenderRaidDischargeContest:.80,\n  defenderPairedActionForecast:.74,defenderSelectiveL10Branches:true};\n const mixedCooperation={...learnedEndgame,defenderCooperationPlanner:true,\n  defenderDischargeCounterfactual:true,defenderThreatSurvivalValue:true};\n const identityFusions={...mixedCooperation,fusionIdentityPlanner:true,\n  predatorSwarmPreservation:true};`
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
      'defenderPairedActionForecast:.76,defenderSelectiveL10Branches:true');
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
      "['attack','soul-raid','soul-discharge','soul-condense','switch','place'].includes(action.type)){");
 once("const gs=a.field.filter(c=>c&&role(c)==='guardian'&&c.mode==='def').length;",
      "const gs=xown.field.filter(c=>c&&role(c)==='guardian'&&c.mode==='def').length;");
 once("const ss=a.field.filter(c=>c&&role(c)==='soul'&&c.mode==='def').length;",
      "const ss=xown.field.filter(c=>c&&role(c)==='soul'&&c.mode==='def').length;");
 once("const change=Math.max(-340,Math.min(230,realOutcome))*.60;",
      "const change=Math.max(-340,Math.min(230,realOutcome))*.72;");

 new Function('require','process','console',source)(require,process,console);
