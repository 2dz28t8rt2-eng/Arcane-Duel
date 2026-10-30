'use strict';
/* Deployment-oriented AI comparison under live post-v21.2 rules; no auto-promotion.
 * Preserve matched starts, frozen champion gates and unseen HOLDOUT.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const MODES=['baseline','optimized'],root='artifacts/v1790';
const data={schema:'arcane-v1790-live-rule-learning',liveCombat:true,guardianPool:.95,
 guardianAtkShare:.22,modeDefinitions:{
  baseline:'Latest frozen experimental defender research candidate on the live catalogue',
  optimized:'Increased legal post-reply threat forecast, survivor bond protection and tactical assessment; same frozen champion'
 },modes:{},paired:{},championCandidate:null};
let duels=0;
for(const mode of MODES){
 const dir=root+'/'+mode,r=JSON.parse(fs.readFileSync(dir+'/report.json')),
  stage=JSON.parse(fs.readFileSync(dir+'/stage-8.json')),
  offense=JSON.parse(fs.readFileSync(dir+'/attack-telemetry.json'));
 assert.equal(r.status,'completed');assert.equal(r.totalDuels,23040);
 assert.equal(r.globalSelection.holdoutSeenBySelector,false);
 assert.equal(stage.stage,8);assert.equal(stage.allCases.length,2304);
 assert.equal(offense.totalGames,23040);assert.equal(offense.attackMetricsMissing,0);
 assert.ok(offense.sample.allAttacks>0);
 assert.ok(stage.allCases.every(x=>x.guardianV178Setup?.adjusted?.every(n=>n===0)),
  'No research-only stat nerfs may be applied on top of production 22/78');
 const next=JSON.parse(fs.readFileSync(dir+'/next-run-endgame-learner.json'));
 assert.equal(next.split,'train');assert.equal(next.validationUsed,false);
 assert.equal(next.holdoutUsed,false);assert.equal(next.sourceRun,0);
 const survivor=r.arms.find(x=>x.arm==='defender-v1790-survival-control');
 const counterplay=r.arms.find(x=>x.arm==='defender-v1790-counterplay');
 assert.ok(survivor&&counterplay);
 const summarize=x=>Object.fromEntries(['train','validation','holdout'].map(k=>
  [k,{wins:x.splits[k].wins,games:x.splits[k].games}]));
 const roleFocus={};
 for(const split of ['validation','holdout'])for(const opponent of ['predator','fusion'])
  for(const core of ['guardian-core','mixed-50','soul-core']){
   const filtered=stage.allCases.filter(x=>x.arm===survivor.arm&&x.split===split&&x.roleB===opponent&&x.focusMode===core);
   assert.equal(filtered.length,16);
   roleFocus[split+'/'+opponent+'/'+core]={wins:filtered.reduce((n,x)=>n+x.win,0),games:filtered.length};
  }
 data.modes[mode]={totalDuels:r.totalDuels,promoted:r.globalSelection.promoted,
  bestCandidate:r.globalSelection.arm,
  candidateGates:r.globalSelection.candidates,
  survival:summarize(survivor),counterplay:summarize(counterplay),
  roleFocus,attacks:offense.sample,trainOnlyCheckpoint:{games:next.games,nonzero:next.nonzero},
  nextModelReadyForValidationOnly:next.nonzero>0};
 duels+=r.totalDuels;
}
const all=Object.fromEntries(MODES.map(mode=>[mode,
 JSON.parse(fs.readFileSync(root+'/'+mode+'/stage-8.json')).allCases]));
const key=x=>[x.stage,x.pair,x.scenario,x.starter,x.seat,x.arm].join('|');
const previous=new Map(all.baseline.map(x=>[key(x),x]));assert.equal(previous.size,2304);
let changes=0,improved=0,worsened=0;const seen=new Set();
for(const x of all.optimized){const k=key(x),a=previous.get(k);
 assert.ok(a&&!seen.has(k),'Missing matched baseline or duplicated scenario');seen.add(k);
 for(const prop of ['seed','seedA','seedB','roleA','roleB','focusMode'])
  assert.deepEqual(x[prop],a[prop],'v17.9 unmatched split/seed/deck '+prop);
 if(x.win!==a.win){changes++;if(x.win>a.win)improved++;else worsened++;}
}
assert.equal(seen.size,2304);
data.paired={casesPerMode:2304,uniqueScenarioSeatKeys:new Set(all.baseline.map(x=>
 [x.stage,x.pair,x.scenario,x.starter,x.seat].join('|'))).size,
 winnerChanged:changes,optimizedImproved:improved,optimizedWorsened:worsened};
assert.equal(duels,46080);
data.championCandidate=data.modes.optimized.bestCandidate;
data.promotedAutomatically=false;data.integrationGate='manual approval only after complete holdout/H2H and engine parity';
fs.writeFileSync(root+'/ai-comparison.json',JSON.stringify(data,null,2)+'\n');
console.log('ARCANE_V1790_DEPLOYMENT_RESEARCH_VERIFIED '+JSON.stringify({
 duels,modes:MODES,paired:data.paired,optimizedPromotionDiagnostic:data.modes.optimized.promoted,
 optimizedNewTrainContexts:data.modes.optimized.trainOnlyCheckpoint.nonzero}));
