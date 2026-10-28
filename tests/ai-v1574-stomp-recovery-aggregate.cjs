'use strict';
/* Recovery of run 40631509643. Reuse the sealed v15.73/v15.74 aggregation
 * unchanged except for one scope-incompatible old role-identity assertion.
 * The new Stomp-aware candidate deliberately changes legal attack scoring
 * for non-fusion roles too. All OTHER arms retain their exact role-safe
 * identity check; champion, H2H, train/validation/holdout and seat gates
 * remain untouched and fail closed.
 */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
let source=fs.readFileSync(path.join(__dirname,'ai-v1573-multifusion-aggregate.cjs'),'utf8');
function once(from,to){
 assert.equal(source.split(from).length,2,'Unexpected upstream aggregation drift: '+from);
 source=source.replace(from,to);
}
function all(from,to){
 assert.ok(source.includes(from),'Missing upstream aggregation anchor: '+from);
 source=source.split(from).join(to);
}
once("!(r.arm==='fusion-v1573-multimaterial'&&r.roleA==='fusion')",
     "!(r.arm==='fusion-v1573-multimaterial')");
all('artifacts/v1573','artifacts/v1574');
all('arcane-v1573','arcane-v1574');
all('15730000+','15740000+');
all('fusion-v1573-multimaterial','fusion-v1574-stomp-conscious');
new Function('require','process','console','__dirname',source)(require,process,console,__dirname);

const root='artifacts/v1574';
const reportPath=path.join(root,'report.json');
const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
assert.equal(report.status,'completed');
assert.equal(report.totalDuels,23040);
assert.equal(report.primaryDuels,9216);
assert.equal(report.authenticPredatorSwarmDuels,2304);
assert.equal(report.controls.holdoutNeverUsedForSelection,true);
assert.equal(report.globalSelection.holdoutSeenBySelector,false);
assert.equal(report.controls.noProductionChanges,true);
assert.deepEqual(report.globalSelection.selectionGateStages,[0,1,2,3,4,7,8]);

const challenger='fusion-v1574-stomp-conscious';
const stats={};
for(let stage=0;stage<11;stage++){
 const obj=JSON.parse(fs.readFileSync(path.join(root,'stage-'+stage+'.json'),'utf8'));
 assert.equal(obj.stage,stage);
 for(const c of obj.allCases.filter(x=>x.arm===challenger)){
  const k=c.roleA||'unknown';
  const out=stats[k]||(stats[k]={games:0,largeFusions:0,stompEvaluations:0,
   collateralKills:0,collateralDefLost:0,attackFatigue:0,predatorReplyWindows:0});
  out.games++;
  out.largeFusions+=(c.multiFusionChosenBySize?.[3]||0)+
   (c.multiFusionChosenBySize?.[4]||0)+(c.multiFusionChosenBySize?.[5]||0);
  out.stompEvaluations+=c.stompAttackEvaluations||0;
  out.collateralKills+=c.stompSplashKills||0;
  out.collateralDefLost+=c.stompSplashChip||0;
  out.attackFatigue+=c.stompFatigueCosts||0;
  out.predatorReplyWindows+=c.stompPredatorWindows||0;
 }
}
const audit={schema:'arcane-v1574-stomp-recovery-audit',sourceRun:40631509643,
 allElevenStagesReused:true,simulationRerun:false,
 roleSafetyException:{arm:challenger,reason:'The new Stomp-aware attack scoring changes this one challenger across roleA; older identity-only assertion was scoped to defender research.',
  unchangedArmsRemainStrictlyIdentityGated:true},
 frozenPromotionAndHoldoutGatesRetained:true,
 selected:report.globalSelection.arm,promoted:report.globalSelection.promoted,
 byChallengerRole:stats};
fs.writeFileSync(path.join(root,'recovery-audit.json'),JSON.stringify(audit,null,2)+'\n');
report.recoveryAudit=audit;
fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V1574_RECOVERY_OK '+JSON.stringify({duels:report.totalDuels,
 selected:audit.selected,promoted:audit.promoted,byRole:stats}));
