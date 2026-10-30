'use strict';
/* Aggregate factual successful attacks from REAL matches, not AI candidate simulations.
 * Keep all stages, roles, winners and opponent-side attacks separate.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const mode=require('./helpers/research-ai-v189.cjs').mode();
const root='artifacts/v1890/'+mode;
const keys=['attempted','successful','direct','targeted','destroyed','lpDamage','shieldDamage','switchToAtk','switchToDef'];
function blank(){return Object.fromEntries(keys.map(k=>[k,0]));}
function add(a,b){for(const k of keys)a[k]+=Number(b?.[k]||0);}
const report={schema:'arcane-v1890-real-attack-frequency',mode,totalGames:0,
 definition:'Real engine attack(game,ai,di) returned success on game===g. No cloned planning attacks or passive counterstrikes.',
 byRole:{candidate:{},opponent:{}},byStage:{},byFocus:{},candidateAttacksByRoleAgainst:{},
 candidateAttackGames:{},sample:{gamesWithDefenderAttacks:0,gamesWithGuardianAttacks:0,gamesWithSoulAttacks:0,
  gamesWithAnyAttacks:0,guardianAttacks:0,soulAttacks:0,allAttacks:0,guardianToAtkSwitches:0,soulToAtkSwitches:0},
 attackMetricsMissing:0,invalid:0,turnsSum:0};
for(let stage=0;stage<11;stage++){
 const s=JSON.parse(fs.readFileSync(root+'/stage-'+stage+'.json','utf8'));
 assert.equal(s.stage,stage);
 const row=report.byStage[stage]={games:0,roleCounts:{},candidateWins:0};
 for(const x of s.allCases){
  const m=x.offenseBySeat;
  if(!m||m.length!==2||!m.every(q=>q&&typeof q==='object'))report.attackMetricsMissing++;
  assert.ok(m&&m.length===2,'All v17.5 matches require real attack telemetry');
  assert.ok(x.seat===0||x.seat===1,'Candidate seat must be 0 or 1');
  assert.ok(x.guardianV178Setup&&x.guardianV178Setup.adjusted.length===2,'v17.9 live stat telemetry missing');
  assert.ok(x.guardianV178Setup.adjusted.every(n=>n===0),'v17.9 stat overlay cannot re-nerf the live 22/78 cards');
  report.totalGames++;row.games++;row.candidateWins+=x.win;
  report.turnsSum+=Number(x.turn||0);
  if(x.illegalSwitchesBySeat?.some(v=>v!==0))report.invalid++;
  const candidate=m[x.seat],opponent=m[1-x.seat];
  const candidateCounts=report.byRole.candidate,opponentCounts=report.byRole.opponent;
  for(const [from,to] of [[candidate,candidateCounts],[opponent,opponentCounts]]){
   for(const [role,stats] of Object.entries(from)){
    if(!to[role])to[role]=blank();
    add(to[role],stats);
    if(from===candidate){if(!row.roleCounts[role])row.roleCounts[role]=blank();add(row.roleCounts[role],stats);}
   }
  }
  if(stage===8){
   const id=x.focusMode+'::'+x.roleB+'::'+x.split;
   const group=report.byFocus[id]||(report.byFocus[id]={games:0,wins:0,roles:{}});
   group.games++;group.wins+=x.win;
   for(const [role,stats] of Object.entries(candidate)){
    if(!group.roles[role])group.roles[role]=blank();
    add(group.roles[role],stats);
   }
  }
  const guardian=candidate.guardian||{},soul=candidate.soul||{};
  if((guardian.successful||0)>0){report.sample.gamesWithGuardianAttacks++;report.sample.gamesWithDefenderAttacks++;}
  if((soul.successful||0)>0){report.sample.gamesWithSoulAttacks++;if(!guardian.successful)report.sample.gamesWithDefenderAttacks++;}
  if(Object.values(candidate).some(y=>y.successful>0))report.sample.gamesWithAnyAttacks++;
  report.sample.guardianAttacks+=guardian.successful||0;report.sample.soulAttacks+=soul.successful||0;
  report.sample.guardianToAtkSwitches+=guardian.switchToAtk||0;
  report.sample.soulToAtkSwitches+=soul.switchToAtk||0;
  report.sample.allAttacks+=Object.values(candidate).reduce((n,v)=>n+(v.successful||0),0);
 }
}
assert.equal(report.totalGames,23040,'All 11 stages must be included');
assert.equal(report.attackMetricsMissing,0);
assert.equal(report.invalid,0);
assert.ok(report.sample.allAttacks>0,'Attack tracking must observe actual gameplay');
for(const side of ['candidate','opponent'])for(const [role,m] of Object.entries(report.byRole[side])){
 assert.ok(m.attempted>=m.successful,'Successful attacks cannot exceed attempted');
 assert.equal(m.successful,m.direct+m.targeted,'Direct + targeted must equal successful');
}
fs.writeFileSync(root+'/attack-telemetry.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V1890_ATTACK_TELEMETRY_OK '+JSON.stringify({mode,games:report.totalGames,roles:report.byRole.candidate,defenders:report.sample}));
