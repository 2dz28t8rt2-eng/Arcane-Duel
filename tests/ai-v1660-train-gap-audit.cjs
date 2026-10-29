'use strict';
/*
 * v16.6 – predeclared descriptive opponent-gap audit using v16.5 TRAIN only.
 * Pure/mixed deck win comparisons cannot by themselves prove a Soul Bond
 * caused a result; no past VALIDATION/HOLDOUT is loaded or optimized on.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=process.env.ARCANE_PREVIOUS_ARTIFACT_DIR;
assert.ok(dir&&fs.existsSync(dir),'Prior v16.5 TRAIN artifact required');
const src=JSON.parse(fs.readFileSync(path.join(dir,'stage-8.json'),'utf8'));
assert.equal(src.stage,8);
const rows=src.allCases.filter(x=>x.split==='train'&&
 ['defender-v1650-survival-control','defender-v1650-counterplay','fusion-v1650-role-economics'].includes(x.arm));
assert.ok(rows.length>=150);
assert.ok(rows.every(x=>x.split==='train'));
const byArm={};
for(const arm of [...new Set(rows.map(x=>x.arm))].sort()){
 const byOpponent={};
 for(const foe of ['predator','fusion']){
  const records=rows.filter(x=>x.arm===arm&&x.roleB===foe);
  const byCore=Object.fromEntries([...new Set(records.map(x=>x.focusMode))].sort().map(core=>{
   const group=records.filter(x=>x.focusMode===core);
   return [core,{games:group.length,wins:group.reduce((a,x)=>a+x.win,0),
     seat0:group.filter(x=>x.seat===0).length,
     seat1:group.filter(x=>x.seat===1).length}];
  }));
  byOpponent[foe]={games:records.length,wins:records.reduce((a,x)=>a+x.win,0),byCore};
 }
 byArm[arm]=byOpponent;
}
const out={
 schema:'arcane-v1660-previous-train-opponent-gap',
 sourceRun:40868047550,sourceRules:'v20.6-soul-bond',sourceStage:8,
 split:'train',validationUsed:false,holdoutUsed:false,
 observationalNotCausal:true,byArm,
 rationale:'Track Predator vs Fusion gap without modifying combat stats or accepting retrospective test labels.'
};
fs.mkdirSync('artifacts/v1660',{recursive:true});
fs.writeFileSync('artifacts/v1660/prior-train-opponent-gap.json',JSON.stringify(out,null,2)+'\n');
console.log('ARCANE_V1660_PRIOR_TRAIN_OPPONENT_GAP '+JSON.stringify(byArm));
