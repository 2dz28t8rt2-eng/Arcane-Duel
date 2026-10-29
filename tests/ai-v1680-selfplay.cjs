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
const balance=require('./helpers/research-role-balance-v168.cjs').mode();
all('artifacts/v1571','artifacts/v1680/'+balance);
all('arcane-v1571-','arcane-v1680-');
all('ARCANE_V1571_','ARCANE_V1630_');
once('15710000+','16800000+');
once('seed:15710042','seed:16800042');
once('assert.equal(endgame.sourceRun,40477542888);','assert.equal(endgame.sourceRun,0);');
all('defender-v1569-endgame-control','defender-v1680-survival-control');
all('defender-v1569-mixed-control','defender-v1680-counterplay');
all('role-identity-conditional-fusion','fusion-v1680-role-economics');

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

 // Preserve the original outcome gates; expose new tactical diagnostics only.
 once("        defenderCooperationRolePreservedValue:m.stats.defenderCooperationRolePreservedValue||0,\n        fusionIdentityChecks:m.stats.fusionIdentityChecks||0,","        defenderCooperationRolePreservedValue:m.stats.defenderCooperationRolePreservedValue||0,\n        defenderBondPlacementChecks:m.stats.defenderBondPlacementChecks||0,\n        defenderBondNewPairs:m.stats.defenderBondNewPairs||0,\n        defenderBondBrokenPairs:m.stats.defenderBondBrokenPairs||0,\n        defenderBondSurvivingPairs:m.stats.defenderBondSurvivingPairs||0,\n        defenderBondObservedEssenceGain:m.stats.defenderBondObservedEssenceGain||0,\n        defenderBondObservedLpLoss:m.stats.defenderBondObservedLpLoss||0,\n        defenderBondReplyChecks:m.stats.defenderBondReplyChecks||0,\n        defenderCriticalReplyTripleChecks:m.stats.defenderCriticalReplyChecks||0,\n        fusionIdentityChecks:m.stats.fusionIdentityChecks||0,");
 // v20.7 active Soul abilities no longer require DEF stance. Preserve
 // identical legality in both research seats; game-runtime overlays the
 // authoritative researchSoulAction in its VM for every A/B variant.
 once("if(!c||role(c)!=='soul'||c.mode!=='def')return false;", "if(!c||role(c)!=='soul')return false;");
 new Function('require','process','console',source)(require,process,console);
