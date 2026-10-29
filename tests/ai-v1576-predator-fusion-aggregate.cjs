'use strict';
/* Sealed scenario audit: training / validation / holdout are predeclared by
 * non-overlapping seed ranges. This is a tactical continuation study, not
 * a full-game championship promotion or a substitute for natural self-play.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..','artifacts','v1576');
const names=['native','replyAware'];
const count=(rows,choose)=>rows.reduce((n,row)=>n+(choose(row)?1:0),0);
function rate(n,d){return d?Math.round(n/d*10000)/100:null;}
function summarize(rows){
 const seats=rows.flatMap(r=>r.seats);
 const selected=(k,scope=seats)=>({
  attacks:scope.reduce((n,s)=>n+s[k].attempts,0),
  predatorOnLargeFusion:scope.reduce((n,s)=>n+s[k].vsFusion,0),
  killsLargeFusion:scope.reduce((n,s)=>n+s[k].kills,0),
  largeFusionKillsPerAttack:rate(scope.reduce((n,s)=>n+s[k].kills,0),
   scope.reduce((n,s)=>n+s[k].vsFusion,0)),
  fusionSurvivesReply:count(scope,s=>s[k].bossAlive),
  fusionSurvivalPct:rate(count(scope,s=>s[k].bossAlive),scope.length),
  damageFusionAtk:scope.reduce((n,s)=>n+s[k].damageFusionAtk,0),
  damageFusionDef:scope.reduce((n,s)=>n+s[k].damageFusionDef,0)
 });
 const stomps=seats.map(s=>s.op);
 return {scenarios:rows.length,mirroredStompActions:seats.length,
  seatParity:{openingMismatch:count(rows,r=>!r.openingEqual),
   stompMismatch:count(rows,r=>!r.stompEqual),
   fullReplyStateMismatchNative:count(rows,r=>!r.responseEqual.native),
   fullReplyStateMismatchAware:count(rows,r=>!r.responseEqual['reply-aware']),
   responseImpactMismatchNative:count(rows,r=>!r.responseImpactEqual.native),
   responseImpactMismatchAware:count(rows,r=>!r.responseImpactEqual['reply-aware'])},
  stomp:{collateralHits:stomps.reduce((n,s)=>n+s.hits,0),
   collateralKills:stomps.reduce((n,s)=>n+s.kills,0),
   lostEnemyDef:stomps.reduce((n,s)=>n+s.defDamage,0),
   counterLpToFusionMage:stomps.reduce((n,s)=>n+s.counterLp,0),
   lostFusionAtk:stomps.reduce((n,s)=>n+(s.atkFatigue||0),0),
   lostFusionDef:stomps.reduce((n,s)=>n+(s.defFatigue||0),0),
   fusionDiedOnOwnAttack:count(stomps,s=>s.fusionDiedInAttack)},
  native:selected('native'),replyAware:selected('replyAware'),
  byAbsoluteFusionSeat:Object.fromEntries([0,1].map(seat=>{
   const x=seats.filter(s=>s.seat===seat);
   return [seat,{native:selected('native',x),replyAware:selected('replyAware',x)}];
  }))};
}
function aggregate(){
 const all=[],files=[],problems=[];
 for(const size of [3,4,5])for(const scenario of [0,1,2,3])for(const start of [0,512,1024,1536]){
  const name=`size-${size}-scenario-${scenario}-start-${start}.json`;
  const file=path.join(root,name);
  assert.ok(fs.existsSync(file),'Missing sealed research shard '+name);
  const result=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(result.version,'15.76');assert.equal(result.materials,size);
  assert.equal(result.scenario,scenario);assert.equal(result.samples,512);
  assert.equal(result.rows.length,512);
  for(let i=0;i<result.rows.length;i++){
   const row=result.rows[i];
   assert.equal(row.seed,start+i);assert.equal(row.materials,size);
   assert.equal(row.scenario,scenario);assert.equal(row.seats.length,2);
  }
  files.push(name);all.push(...result.rows);
  if(problems.length<50)problems.push(...result.problems.slice(0,50-problems.length));
 }
 assert.equal(all.length,24576);
 const split=x=>x.seed<1024?'train':x.seed<1536?'validation':'holdout';
 const cohort=Object.fromEntries(['train','validation','holdout'].map(s=>[s,summarize(all.filter(r=>split(r)===s))]));
 const byMaterial=Object.fromEntries([3,4,5].map(s=>[s,summarize(all.filter(r=>r.materials===s))]));
 const byPressure=Object.fromEntries([0,1,2,3].map(s=>[s,summarize(all.filter(r=>r.scenario===s))]));
 const results={version:'15.76',status:'complete',createdUtc:new Date().toISOString(),
  type:'controlled tactical Predator-versus-real-large-fusion mirror audit',
  sampleDesign:{sizes:[3,4,5],scenarioKinds:{0:'predator pack slightly weaker',
   1:'mixed guardians and predators similar strength',2:'predator plus soul stronger',
   3:'predator ambush stronger'},
   seedRanges:{train:[0,1023],validation:[1024,1535],holdout:[1536,2047]},
   scenariosPerSizeAndPressure:2048,shards:files.length},
  samples:all.length,realLargeFusionsCreated:all.length,
  mirroredStompAttacks:all.length*2,predatorReplySequences:all.length*4,
  overall:summarize(all),byMaterial,byPressure,
  sealed:{train:cohort.train,validation:cohort.validation,holdout:cohort.holdout},
  warnings:{fullMatches:false,allPlayersMetaUpgradesDisabled:true,
   playerShieldsDisabled:true,symmetricSides:true,
   plannerIsExperimentalNotProduction:true,selectionFromHoldout:false,
   forceSpawnedPredatorBoards:true,modelsPreviouslyTrainedWeights:false,
   promotedToProduction:false},
  examples:problems};
 // A successful study must actually exercise the counterplay it was built for.
 assert.ok(results.overall.replyAware.predatorOnLargeFusion>1000,'No serious Predator coverage');
 assert.equal(results.overall.seatParity.openingMismatch,0,'Mirrored opening mismatch');
 assert.equal(results.overall.seatParity.stompMismatch,0,'Core Stomp parity violation');
 fs.mkdirSync(root,{recursive:true});
 fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify({status:results.status,scenarios:results.samples,
  mirroredStompAttacks:results.mirroredStompAttacks,
  predatorReplySequences:results.predatorReplySequences,
  seatParity:results.overall.seatParity,
  baseline:results.overall.native,replyAware:results.overall.replyAware},null,2));
 return results;
}
if(require.main===module)aggregate();
module.exports={aggregate,summarize};
