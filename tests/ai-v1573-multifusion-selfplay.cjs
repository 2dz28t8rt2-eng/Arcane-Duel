'use strict';
/* v14.9.73 research: preserve frozen v14.9.55 champion and strict v14.9.72
 * comparison gates, but give ONLY the predeclared fusion challenger legal
 * 3–5 HAND-material candidates. All game results are cloned/real, no extra
 * rewards, invented stats, weakened holdout gates or live-AI edits.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let source=fs.readFileSync(path.join(__dirname,'ai-v1571-roles-selfplay.cjs'),'utf8');
function replaceOnce(before,after){
assert.equal(source.split(before).length,2,'Missing or duplicate research anchor: '+before.slice(0,90));
 source=source.replace(before,after);
}
function replaceAll(before,after){
 assert.ok(source.includes(before),'Missing research anchor: '+before);
 source=source.split(before).join(after);
}
replaceAll('artifacts/v1571','artifacts/v1573');
replaceAll('arcane-v1571-','arcane-v1573-');
replaceAll('ARCANE_V1571_','ARCANE_V1573_');
replaceOnce('15710000+','15730000+');
replaceOnce('seed:15710042','seed:15730042');
replaceOnce('assert.equal(endgame.sourceRun,40477542888);',
 'assert.equal(endgame.sourceRun,40499008498);');
replaceAll('defender-v1569-endgame-control','defender-v1573-survival-control');
replaceAll('defender-v1569-mixed-control','defender-v1573-counterplay');
replaceAll('role-identity-conditional-fusion','fusion-v1573-multimaterial');

replaceOnce(
 ` const learnedEndgame={...unifiedReply,defenderEndgameModel:endgame.learned,\n  defenderEndgameReplyDepth:3};\n const mixedCooperation={...learnedEndgame,defenderCooperationPlanner:true};\n const identityFusions={...mixedCooperation,fusionIdentityPlanner:true,predatorSwarmPreservation:true};`,
 ` const learnedEndgame={...unifiedReply,defenderEndgameModel:endgame.learned,\n  defenderEndgameReplyDepth:3,defenderDischargeWindow:true,\n  defenderDischargeSurvivalGate:true,defenderRaidDischargeContest:.80,\n  defenderPairedActionForecast:.74,defenderSelectiveL10Branches:true};\n const mixedCooperation={...learnedEndgame,defenderCooperationPlanner:true,\n  defenderDischargeCounterfactual:true,defenderThreatSurvivalValue:true};\n const identityFusions={...mixedCooperation,fusionIdentityPlanner:true,\n  predatorSwarmPreservation:true,multiFusionCandidates:true};`
);
replaceOnce(
 `'       const extraValue=materials.length>=3&&product&&powerGain>materialCost?',\n'        Math.min(80,(materials.length-2)*24):0;',`,
 `'       const extraValue=materials.length>=3&&product&&fieldPaid===0&&',\n'        fusedPower>strongest?Math.min(150,(materials.length-2)*52):0;',`
);
replaceOnce('       tacticalCorrection+=correction*.75;',
 '       tacticalCorrection+=correction*.90;');
replaceOnce(" const {boot}=require('./helpers/game-runtime.cjs');",
 " const {boot:baseBoot}=require('./helpers/game-runtime.cjs');\n"+
 " const {enumerateLargeFusions}=require('./helpers/ai-multifusion-v1573.cjs');\n"+
 " const boot=options=>{const runtime=baseBoot(options);\n"+
 "  runtime.ctx.__arcaneResearchLargeFusion=enumerateLargeFusions;return runtime;};");

// v14.9.72's policy rewarded 3+ materials, but its underlying candidate
// generator could generate ONLY hand pairs. Inject the missing *legal action*
// generation before all later ranking modifiers and lookahead evaluations.
const hook=String.raw`inject("const {boot}=require('./helpers/game-runtime.cjs');",[
 "const {boot:baseBoot}=require('./helpers/game-runtime.cjs');",
 "const {enumerateLargeFusions}=require('./helpers/ai-multifusion-v1573.cjs');",
 "const boot=options=>{const runtime=baseBoot(options);",
 " runtime.ctx.__arcaneResearchLargeFusion=enumerateLargeFusions;return runtime;};"
]);
inject('  if(scene.roleAware){',[
 '  if(scene.rolePolicy?.multiFusionCandidates&&scene.candidateRole==="fusion"){',
 '   const additional=__arcaneResearchLargeFusion({game:g,own,profile:scene.profile,',
 '    cardValue,dataOf,isFateCard,fusionOptions,canCompleteHandFusion,applyAiAction,role,',
 '    guardianCount:guardians,soulCount:souls,maxPerSize:3});',
 '   for(const choice of additional.choices)ranking.push(choice);',
 '   if(!counter.multiFusionBySize)counter.multiFusionBySize={3:{legal:0,previewed:0,accepted:0},',
 '    4:{legal:0,previewed:0,accepted:0},5:{legal:0,previewed:0,accepted:0}};',
 '   for(const size of [3,4,5])for(const metric of ["legal","previewed","accepted"])',
 '    counter.multiFusionBySize[size][metric]+=additional.bySize[size][metric];',
 '   ranking.sort((a,b)=>b.score-a.score);',
 '  }',
 '  if(scene.roleAware){'
]);`;
const forecastHook=String.raw`inject('   const actor=g.active,op=1-actor,options=ranking.slice(0,4);',[
 '   const actor=g.active,op=1-actor,options=ranking.slice(0,4);',
 '   if(scene.rolePolicy?.multiFusionCandidates&&scene.candidateRole==="fusion"){',
 '    for(const size of [3,4,5]){',
 '     const extra=ranking.find(x=>x.a.type==="fusion"&&x.a.uids?.length===size);',
 '     if(extra&&!options.includes(extra)){options.push(extra);',
 '      counter.multiFusionForecastComparisons=(counter.multiFusionForecastComparisons||0)+1;}',
 '    }',
 '   }'
]);`;
const innerAnchor="const inner='\\nnew Function";
replaceOnce(innerAnchor,hook+'\n'+forecastHook+'\n'+innerAnchor);
replaceOnce('        fusionMultiMaterialChosen:m.stats.fusionMultiMaterialChosen||0,',
 '        fusionMultiMaterialChosen:m.stats.fusionMultiMaterialChosen||0,\n'+
 '        multiFusionChosenBySize:m.stats.multiFusionChosenBySize||null,\n'+
 '        multiFusionBySize:m.stats.multiFusionBySize||null,\n'+
 '        multiFusionForecastComparisons:m.stats.multiFusionForecastComparisons||0,');
replaceOnce("'    if((action.uids||[]).length>=3)counter.fusionMultiMaterialChosen++;',",
 "'    if((action.uids||[]).length>=3){',\n"+
 "'     counter.fusionMultiMaterialChosen++;',\n"+
 "'     if(!counter.multiFusionChosenBySize)counter.multiFusionChosenBySize={3:0,4:0,5:0};',\n"+
 "'     counter.multiFusionChosenBySize[(action.uids||[]).length]++;',\n"+
 "'    }',");

new Function('require','process','console',source)(require,process,console);
