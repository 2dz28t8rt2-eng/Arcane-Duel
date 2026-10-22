'use strict';
/* Deterministic v14.9.11 sharded full-duel aggregator.
 * Never accept missing, repeated, wrong-seat, wrong-setup, or duplicate duels.
 * Both a raw per-match report and validated group summaries are retained.
 */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const root='artifacts/v1512';
const nShards=24,nPerShard=64;
const labels=[
 {label:'baseline-heuristic',swarm:.02,pierce:.10,decision:'heuristic',summonForecast:false,safeSummon:false},
 {label:'gated-Q',swarm:.02,pierce:.10,decision:'gated-Q',summonForecast:false,safeSummon:false},
 {label:'old-fusion-and-attacks',swarm:.02,pierce:.10,decision:'lookahead',summonForecast:true,safeSummon:false},
 {label:'conservative-fusion-and-attacks',swarm:.02,pierce:.10,decision:'lookahead',summonForecast:true,safeSummon:true}
];
const stages=[0,6,10],styles=['guardian','soul','fusion','hybrid'];
const data=JSON.parse(fs.readFileSync(root+'/training-q-and-examples.json','utf8'));
const summary={};
const rows=[],ids=new Set();
const metricKeys=['qMoves','lookaheadChecks','lookaheadChanges','summonChecks',
 'summonLegal','summonChanges','fusionChanges'];
for(let idx=0;idx<nShards;idx++){
 const file=root+'/shards/part-'+String(idx).padStart(2,'0')+'.json';
 assert.ok(fs.existsSync(file),'Missing full-duel shard '+idx);
 const d=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.equal(d.schema,'arcane-v1512-predator-fusion-shard');
 assert.equal(d.shardIndex,idx);
 assert.equal(d.shardCount,nShards);
 assert.equal(d.duelsPerShard,nPerShard);
 assert.equal(d.cases?.length,nPerShard,'Incomplete shard '+idx);
 const lead=idx>=12,stage=stages[Math.floor(idx%12/4)],style=styles[idx%4];
 const keys=new Set();
 for(const r of d.cases){
  assert.equal(r.defenderLead,lead,'Wrong hard-DEF scenario in shard '+idx);
  assert.equal(r.stage,stage,'Wrong stage in shard '+idx);
  assert.equal(r.opponent,style,'Wrong rival style in shard '+idx);
  assert.equal(r.opponentPolicy,['economy','economy','offensive','offensive'][styles.indexOf(style)]);
  assert.ok(labels.some(a=>a.label===r.arm),'Unknown arm');
  assert.ok(Number.isInteger(r.scenario)&&r.scenario>=0&&r.scenario<4);
  assert.ok([0,1].includes(r.seat)&&[0,1].includes(r.starter));
  assert.ok([0,1].includes(r.win));
  assert.equal(typeof r.timeout,'boolean');
  for(const name of metricKeys)assert.ok(Number.isInteger(r[name])&&r[name]>=0,
   'Missing/invalid '+name+' for shard '+idx);
  const key=[r.defenderLead,r.stage,r.opponent,r.scenario,r.arm,r.starter,r.seat].join('|');
  assert.ok(!ids.has(key),'Duplicate match across shards: '+key);
  assert.ok(!keys.has(key),'Duplicate match within shard: '+key);
  ids.add(key);keys.add(key);rows.push(r);
 }
 assert.equal(keys.size,nPerShard);
 for(let scenario=0;scenario<4;scenario++)for(const arm of labels)
  for(let starter=0;starter<2;starter++)for(let seat=0;seat<2;seat++){
   const key=[lead,stage,style,scenario,arm.label,starter,seat].join('|');
   assert.ok(keys.has(key),'Missing uniquely matched duel '+key);
  }
 console.log('ARCANE_V1512_AGG_SHARD '+JSON.stringify({idx,games:d.cases.length,
  wins:d.cases.reduce((n,r)=>n+r.win,0)}));
}
assert.equal(rows.length,1536,'Incomplete combined research');
for(const r of rows){
 const group=r.arm+(r.defenderLead?'-hard-defender':'-normal');
 const x=summary[group]||(summary[group]={games:0,wins:0,timeouts:0,
  seatWins:[0,0],qMoves:0,lookaheadChecks:0,lookaheadChanges:0,
  summonChecks:0,summonLegal:0,summonChanges:0,fusionChanges:0,
  stage:{},opponents:{}});
 x.games++;x.wins+=r.win;x.timeouts+=Number(r.timeout);
 x.seatWins[r.seat]+=r.win;
 for(const key of metricKeys)x[key]+=r[key];
 const st=x.stage[r.stage]||(x.stage[r.stage]={games:0,wins:0});
 st.games++;st.wins+=r.win;
 const op=x.opponents[r.opponent]||(x.opponents[r.opponent]={games:0,wins:0});
 op.games++;op.wins+=r.win;
}
const report={
 schema:'arcane-v1512-predator-summon-fusion-forecast-fullmatch',
 status:'completed',sourceSha:process.env.GITHUB_SHA||'unknown',
 totalMatches:rows.length,shardCount:nShards,duelsPerShard:nPerShard,
 stages,opponents:styles,
 controls:{roleActive:true,researchOnly:true,freezeOpponent:'economy/offensive',
  seatsMirrored:true,startersMirrored:true,arenaLPDecayDisabled:true,
  QWeightsFromSeparateTraining:true,productionEnabled:false},
 arms:labels.flatMap(a=>[false,true].map(defenderLead=>({
   ...a,defenderLead,
   qKeys:a.decision==='heuristic'?0:
    Object.keys(data.find(x=>x.swarm===a.swarm&&x.pierce===a.pierce)?.learnedQ||{}).length,
   ...summary[a.label+(defenderLead?'-hard-defender':'-normal')]
 }))),
 limitations:[
  'Genuine 40-card benchmark decks but generated research scenarios, not earned collections.',
  'Opponent uses defensive economy policy for Guardian/Soul and offensive policy for Fusion/Hybrid.',
  'Hard defender scenarios begin with THREE real opposing deck cards in DEF slots: controlled handicap, not regular initial play.',
  'Summon/fusion planning simulates a legal clone placement and one visible enemy reply, not entire rounds.',
  'Attack rollout likewise approximates two future attacks; no hidden opponent hand is read.',
  'Arena LP decay disabled in research, not a production-mode simulation.',
  'Multiple matchup/seed comparisons are correlated; do not assume statistical significance.',
  'Production AI and main branch remain unchanged.'
 ]
};
assert.equal(report.arms.length,8);
for(const arm of report.arms){
 assert.equal(arm.games,192);
 assert.equal(arm.seatWins[0]+arm.seatWins[1],arm.wins);
 if(arm.decision!=='heuristic')assert.ok(arm.qKeys>0);
 for(const stage of stages)assert.equal(arm.stage[stage].games,64);
 for(const style of styles)assert.equal(arm.opponents[style].games,48);
}
fs.writeFileSync(root+'/fullmatch.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(root+'/fullmatch-cases.json',JSON.stringify(rows,null,2)+'\n');
for(const hard of [false,true]){
 const lead=hard?'-hard-defender':'-normal';
 const baseline=summary['baseline-heuristic'+lead];
 for(const id of ['gated-Q','old-fusion-and-attacks','conservative-fusion-and-attacks']){
  const test=summary[id+lead];
  console.log('ARCANE_V1512_POLICY_COMPARISON '+JSON.stringify({
   hard,arm:id,baselineWins:baseline.wins,policyWins:test.wins,
   delta:test.wins-baseline.wins,byOpponent:styles.map(style=>({
    style,baseline:baseline.opponents[style].wins,policy:test.opponents[style].wins}))
  }));
 }
}
console.log('ARCANE_V1512_FULLMATCH '+JSON.stringify({total:rows.length,
 shards:nShards,arms:report.arms.map(a=>({name:a.label,hard:a.defenderLead,
 wins:a.wins,games:a.games,forecast:a.summonChecks,legal:a.summonLegal,
 changed:a.summonChanges,fusions:a.fusionChanges,q:a.qMoves}))}));
