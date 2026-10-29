'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const root='artifacts/v1513';
const labels=['baseline-heuristic','gated-Q','Q-one-counter-planner','Q-two-counter-planner'];
const styles=['predator','guardian','soul','fusion','hybrid','allrounder'],stages=[0,6,10],tiers=[7,10];
const keys=['qMoves','lookaheadChecks','lookaheadChanges','summonChecks','summonLegal','summonChanges','fusionChanges','doubleCounters','soulActions'];
const rows=[],seen=new Set();
for(let n=0;n<36;n++){
 const f=root+'/shards/part-'+String(n).padStart(2,'0')+'.json';
 assert.ok(fs.existsSync(f),'Missing shard '+n);
 const d=JSON.parse(fs.readFileSync(f,'utf8'));assert.equal(d.schema,'arcane-v1513-mirror-shard');
 assert.equal(d.shardIndex,n);assert.equal(d.shardCount,36);assert.equal(d.cases.length,64);
 const tier=tiers[Math.floor(n/18)],stage=stages[Math.floor((n%18)/6)],style=styles[n%6];
 for(const r of d.cases){
  assert.equal(r.tier,tier);assert.equal(r.stage,stage);assert.equal(r.style,style);
  assert.equal(r.mirror,true,'An asymmetric match was supplied');
  assert.ok(labels.includes(r.arm)&&[0,1].includes(r.starter)&&[0,1].includes(r.seat)&&[0,1].includes(r.win));
  assert.ok(Number.isInteger(r.scenario)&&r.scenario>=0&&r.scenario<4);
  assert.equal(typeof r.timeout,'boolean');
  for(const k of keys)assert.ok(Number.isInteger(r[k])&&r[k]>=0,'Missing metric '+k);
  const hash=[tier,stage,style,r.scenario,r.arm,r.starter,r.seat].join('|');
  assert.ok(!seen.has(hash),'Duplicate mirrored match '+hash);
  seen.add(hash);rows.push(r);
 }
 for(let i=0;i<4;i++)for(const label of labels)for(const starter of [0,1])for(const seat of [0,1])
  assert.ok(seen.has([tier,stage,style,i,label,starter,seat].join('|')),'Incomplete matched quadruplet');
}
assert.equal(rows.length,2304);
const q=JSON.parse(fs.readFileSync(root+'/report.json','utf8'));
assert.equal(q.priorCheckpointLoaded,true,'Missing historical checkpoint');
const summaries=labels.map(label=>{
 const group=rows.filter(x=>x.arm===label);
 const out={label,games:group.length,wins:group.reduce((a,b)=>a+b.win,0),
 timeouts:group.filter(x=>x.timeout).length,
 seats:[0,1].map(seat=>group.filter(x=>x.seat===seat).reduce((n,x)=>n+x.win,0)),
 starters:[0,1].map(starter=>group.filter(x=>x.starter===starter).reduce((n,x)=>n+x.win,0)),
 byStyle:Object.fromEntries(styles.map(style=>[style,{games:group.filter(x=>x.style===style).length,
 wins:group.filter(x=>x.style===style).reduce((n,x)=>n+x.win,0)}])),
 actionTypes:{}};
 for(const k of keys)out[k]=group.reduce((n,x)=>n+x[k],0);
 for(const r of group)for(const [k,v] of Object.entries(r.chosenActionTypes||{}))
  out.actionTypes[k]=(out.actionTypes[k]||0)+v;
 assert.equal(group.length,576);assert.equal(out.seats[0]+out.seats[1],out.wins);
 return out;
});
const report={
 schema:'arcane-v1513-symmetric-history-fullmatch',status:'completed',
 sourceSha:process.env.GITHUB_SHA||'unknown',matches:rows.length,shards:36,
 historicalSources:q.historicalSources,
 symmetric:{sameDeck:true,sameOpeningHand:true,sameFusionStock:true,sameLP:true,
 noHandicaps:true,bothSeats:true,bothStarters:true},
 policies:summaries,
 researchOnly:true,productionEnabled:false,
 limitations:['Tactical Q still primarily covers Predator attack-versus-pass',
 'Opponent policies may differ by comparison, equipment and start conditions do not',
 'Arena LP decay suppressed symmetrically for this research study',
 'Role coverage and planner activity are not proofs of multi-turn strategic mastery']};
fs.writeFileSync(root+'/fullmatch.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(root+'/fullmatch-cases.json',JSON.stringify(rows)+'\n');
console.log('ARCANE_V1513_FULLMATCH '+JSON.stringify({games:rows.length,
 historicalSources:q.historicalSources,
 policies:summaries.map(s=>({name:s.label,wins:s.wins,seatWins:s.seats,
 fusions:s.fusionChanges,doubleCounters:s.doubleCounters}))}));
