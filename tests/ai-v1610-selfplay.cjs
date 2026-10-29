'use strict';
/* v16.1 research only. Independent fresh seeds + v16 TRAIN-learned endgame,
   role-scoped candidate experiments, unchanged fixed control policies. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let source=fs.readFileSync(path.join(__dirname,'ai-v1600-selfplay.cjs'),'utf8');
for(const [a,b] of [
 ['artifacts/v1600','artifacts/v1610'],
 ['arcane-v1600','arcane-v1610'],
 ['ARCANE_V1600','ARCANE_V1610'],
 ['16000000+','16100000+'],
 ['seed:16000042','seed:16100042'],
 ['40513311546','40839664405'],
 ['defender-v1600-','defender-v1610-'],
 ['fusion-v1600-','fusion-v1610-']
]){
 assert.ok(source.includes(a),'Missing v16 selfplay anchor '+a);
 source=source.split(a).join(b);
}
// v16 mistakenly attached fusion-specific reply weights to ALL roles:
// this altered Predator controls. Remove the unscoped override altogether.
// fusionIdentityPlanner is already explicitly scoped in the base simulator
// to studyStage===9 and candidateRole===fusion. Never weaken parity gates.
const unscoped=/\s*once\('predatorSwarmPreservation:true};',\s*'predatorSwarmPreservation:true,counterfactualFusion:\.55,postReplyMaterial:\.85,sequenceFusion:\.30};'\);/;
assert.ok(unscoped.test(source),'Missing unscoped fusion override');
source=source.replace(unscoped,'');
// Conservative predeclared shrinkage after v16 TRAIN evidence.
// These flags apply only to existing role-scoped defender planners.
for(const [a,b] of [
 ['defenderPairedActionForecast:.88','defenderPairedActionForecast:.80'],
 ['defenderRaidDischargeContest:.90','defenderRaidDischargeContest:.82'],
 ['tacticalCorrection+=correction*.90','tacticalCorrection+=correction*.82']
]){
 assert.ok(source.includes(a),'Missing conservative policy anchor '+a);
 source=source.split(a).join(b);
}
new Function('require','process','console','__dirname',source)(require,process,console,__dirname);
