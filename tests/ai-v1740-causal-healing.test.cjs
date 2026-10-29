'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const causal=require('./helpers/research-guardian-causal-v174.cjs');
const balance=require('./helpers/research-role-balance-v169.cjs');
const source=fs.readFileSync('assets/essence-combat.js','utf8');
function heal(cohort,{owner=0,candidate=0,guardians=3,initialDef=0,maxDef=10000}={}){
 const code=causal.transform(source,cohort);
 const beg=code.indexOf("const allies=team.filter(c=>isDefender(c)&&c.mode==='def');");
 const end=code.indexOf('for(const creature of team){',beg);
 assert.ok(beg>0&&end>beg,'must execute real shipped heal code');
 const team=Array.from({length:guardians},(_,i)=>({id:i,uid:i+1,role:'guardian',mode:'def',level:5,card:{def:initialDef}}));
 const soul={uid:100,role:'soul',mode:'def',level:5,card:{def:initialDef}};team.push(soul);
 const g={players:[{field:team},{field:team}],strategicTraining:{researchHealCandidateSeat:candidate}};
 const fx={beginTurn(){},record(){},endTurn(){}};
 new Function('g','owner','team','window','isDefender','roleOf','statLayer','dataOf',code.slice(beg,end))(
  g,owner,team,{ArcaneDefenderFX:fx},c=>c.role==='guardian'||c.role==='soul',c=>c.role,
  c=>({maxDef}),c=>({level:c.level}));
 return {team,soul,metrics:g.__researchGuardianHealMetrics};
}
test('Causal cohorts are exact and do not reuse the 85% flat nerf',()=>{
 assert.deepEqual(causal.MODES,['none','candidateOnly','opponentOnly','both']);
 assert.deepEqual(causal.RATE,[0,1,.55,.40,.33,.28]);
 assert.deepEqual(balance.tuning('predator15Triad90'),{pierce:.15,predator:.9,fusion:1.2});
 for(let n=0;n<=5;n++)assert.equal(causal.factor(n),causal.RATE[n]);
 for(let owner of [0,1])for(let candidate of [0,1]){
  assert.equal(causal.reduced('candidateOnly',owner,candidate),owner===candidate);
  assert.equal(causal.reduced('opponentOnly',owner,candidate),owner!==candidate);
  assert.equal(causal.reduced('both',owner,candidate),true);
  assert.equal(causal.reduced('none',owner,candidate),false);
 }
 assert.throws(()=>causal.reduced('old85',0,0));
 assert.ok(source.includes("const counter= Math.floor(Math.max(0,dataOf(d).atk)*.35);"));
 assert.ok(source.includes("if(isDefender(d)&&!immuneBefore&&!endDefense&&q.field[di]===d){"));
});
test('Full source healing on different sides matches causal selection exactly',()=>{
 for(const cohort of causal.MODES){
  for(let owner of [0,1])for(let candidate of [0,1]){
   const n=3,actual=heal(cohort,{owner,candidate,guardians:n});
   const per=Math.floor(85*(causal.reduced(cohort,owner,candidate)?.40:1));
   assert.equal(actual.soul.card.def,n*per,cohort+' owner '+owner+' candidate '+candidate);
   assert.ok(actual.team.slice(0,n).every(x=>x.card.def===(n-1)*per));
   const m=actual.metrics;
   assert.equal(m.turnsByOwner[owner][n],1);
   assert.equal(m.eventsByOwner[owner][n],n*n);
   assert.equal(m.actualDefByOwner[owner][n],n*n*per);
   assert.equal(m.possibleUnscaledDefByOwner[owner][n],n*n*85);
   assert.equal(m.preventedDefByScaleByOwner[owner][n],n*n*(85-per));
   assert.equal(m.soulActualDefByOwner[owner],n*per);
   assert.equal(m.guardianActualDefByOwner[owner],n*(n-1)*per);
  }
 }
});
test('Stairs 1-5, self-exclusion, observed losses at max DEF and absent defenders',()=>{
 for(let n=1;n<=5;n++){
  let out=heal('both',{guardians:n});
  const per=Math.floor(85*causal.factor(n));
  assert.equal(out.soul.card.def,n*per);
  assert.ok(out.team.slice(0,n).every(c=>c.card.def===(n-1)*per));
  assert.equal(out.metrics.actualDefByOwner[0][n],n*n*per);
 }
 let max=heal('both',{guardians:3,initialDef:90,maxDef:100});
 assert.equal(max.soul.card.def,100);
 assert.equal(max.metrics.actualDefByOwner[0][3],(3*3)*10);
 assert.ok(max.metrics.budgetLostAtCapByOwner[0][3]>0);
 let empty=heal('both',{guardians:0});
 assert.equal(empty.soul.card.def,0);
 assert.equal(empty.metrics.turnsByOwner[0][0],1);
});
test('Full research runner binds candidate seat and includes actual-healing telemetry',()=>{
 const src=fs.readFileSync('tests/ai-v1740-selfplay.cjs','utf8');
 assert.ok(src.includes('researchHealCandidateSeat=learner'));
 assert.ok(src.includes('guardianHealMetrics:m.stats.guardianHealMetrics'));
 assert.ok(src.includes('guardianHealMetrics:g.__researchGuardianHealMetrics||null'));
 const runtime=fs.readFileSync('tests/helpers/game-runtime.cjs','utf8');
 assert.ok(runtime.includes('ARCANE_RESEARCH_GUARDIAN_CAUSAL_V174'));
 assert.ok(runtime.includes('if(process.env.ARCANE_RESEARCH_GUARDIAN_HEAL||'));
});
