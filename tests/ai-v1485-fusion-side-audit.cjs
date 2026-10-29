'use strict';
// Controlled mechanical audit. Production scripts are unmodified and run in isolated VMs.
const {boot}=require('./helpers/game-runtime.cjs');
const assert=require('node:assert/strict');
const fs=require('node:fs');
function experimentInVm(){
 profile=freshProfile();profile.guideSeen=true;
 for(const k of Object.keys(profile.upgrades||{}))profile.upgrades[k]=0;
 for(const c of CARDS){
  for(const k of ['ability','soulRank','essenceSchool','passive','skill','perk','effect','roleOverride'])delete c[k];
  if(NEUTRAL_TAG_STYLE==='delete')delete c.role;else c.role='__neutral_no_role__';
 }
 const g=createGame({mode:'pve',context:'free',opponentId:0,difficulty:'hard',seed:1485001});
 g.players.forEach(p=>{p.power=1;p.flatBonus=0;p.enhancements={};});
 g.essenceRules=false;g.fateUsed=[true,true];
 const tuned=window.ArcaneFusionMath.getTuned();
 const configs=[[2,2],[3,3,3],[1,2,3],[2,2,2,2],[2,2,3,3,3],[1,2,3,4,5],[4,4,4],[4,5,6],[5,5,5,6,6]];
 function materials(levels){
  return levels.map((level,j)=>{
   const candidates=RPG_BASE_CARDS.filter(x=>x&&x.level===level&&!x.fusionOnly&&x.rpg);
   if(!candidates.length)throw Error('No normal card with level '+level);
   return newInstance(g,candidates[j%candidates.length].id,0);
  });
 }
 function sample(levels){
  const mats=materials(levels),els=mats.map(c=>dataOf(c).element);
  function calc(seat){
   g.active=seat;
   const x=tuned(g,levels,els,mats);
   const res=window.ArcaneAllrounder.evaluate(g,mats);
   return {factor:x.factor,rollBonus:x.rollBonus||0,levelBonus:x.levelBonus||0,
    qualityBonus:x.qualityBonus||0,hasCombo:!!x.hasCombo,name:x.name,
    resonancePct:x.resonancePct||0,materials:res.materials,bonus:res.bonus,
    rolls:Math.min(7,qualityRolls(levels)+(x.rollBonus||0))};
  }
  const a=calc(0),b=calc(1);
  return {levels,seat0:a,seat1:b,qualityGap:+(a.factor-b.factor).toFixed(6),rollGap:a.rolls-b.rolls};
 }
 return {neutralStyle:NEUTRAL_TAG_STYLE,samples:configs.map(sample)};
}
function run(style){
 const engine=boot({seed:1485001});
 engine.exec("var NEUTRAL_TAG_STYLE="+JSON.stringify(style)+";");
 return engine.run('('+experimentInVm.toString()+')()',120000);
}

function decayInVm(){
 profile=freshProfile();profile.guideSeen=true;
 for(const k of Object.keys(profile.upgrades||{}))profile.upgrades[k]=0;
 for(const c of CARDS){delete c.ability;delete c.essenceSchool;c.role='__neutral_no_role__';}
 const g=createGame({mode:'pve',context:'free',opponentId:0,
  difficulty:'hard',seed:1485002,starter:STARTER});
 g.essenceRules=false;g.fateUsed=[true,true];
 g.players.forEach(p=>{p.power=1;p.enhancements={};p.flatBonus=0;p.shield=0;});
 const template=RPG_BASE_CARDS.find(c=>c&&c.rpg&&!c.fusionOnly&&c.level===4);
 if(!template)throw Error('No level-4 normal monster');
 const first=STARTER,second=1-STARTER;
 const a=newInstance(g,template.id,first);a.summonedTurn=1;
 g.players[first].field[0]=a;
 const origA=a.card.atk,baseA=creatureDecayRate(g,a,first),
  extraA=window.ArcaneQaFollowup.levelDecayExtra(a),rate=baseA+extraA;
 advanceTurn(g); // turn1 ends: summoning exempt
 const b=newInstance(g,template.id,second);b.summonedTurn=2;
 g.players[second].field[0]=b;
 const origB=b.card.atk,baseB=creatureDecayRate(g,b,second),
  extraB=window.ArcaneQaFollowup.levelDecayExtra(b),rateB=baseB+extraB;
 advanceTurn(g); // turn2 ends: other summoning exempt
 const afterFirstTurns=[a.card.atk,b.card.atk];
 advanceTurn(g); // turn3 ends: first monster loses stats
 const afterThirdTurn=[a.card.atk,b.card.atk];
 advanceTurn(g); // turn4 ends: second monster loses stats
 const afterFourthTurn=[a.card.atk,b.card.atk];
 return {starter:first,rate,rateB,baseRates:[baseA,baseB],extra:[extraA,extraB],original:[origA,origB],
  afterFirstTurns,afterThirdTurn,afterFourthTurn};
}
function decayRun(starter){
 const vm=boot({seed:1485002});vm.exec('var STARTER='+starter+';');
 return vm.run('('+decayInVm.toString()+')()',120000);
}
const decay=[decayRun(0),decayRun(1)];
console.log('ARCANE_V1485_RAW_DECAY_TIMELINE '+JSON.stringify(decay));
for(const item of decay){
 assert.equal(item.rate,item.rateB,'Player-dependent monster decay rate');
 assert.deepEqual(item.afterFirstTurns,item.original,
   'Summoned monsters should not decay on first own turn');
 assert.equal(item.original[0]-item.afterThirdTurn[0],item.rate,
   'The first summoning creature should decay at its second own turn end');
 assert.equal(item.afterThirdTurn[1],item.original[1],
   'The second monster should not decay until after its second own turn');
 assert.equal(item.original[1]-item.afterFourthTurn[1],item.rateB,
   'The second monster must receive identical decay one own turn later');
}

const deleted=run('delete'),sentinel=run('sentinel');
assert.equal(deleted.samples.length,9);
assert.equal(sentinel.samples.length,9);
assert.ok(deleted.samples.every(s=>s.seat0.materials===s.levels.length&&s.seat1.materials===0),
 'Role deletion should turn all normal materials into player0-only allrounders');
assert.ok(sentinel.samples.every(s=>s.seat0.materials===0&&s.seat1.materials===0),
 'Sentinel neutral tag must prevent role-less cards from impersonating allrounders');
assert.ok(sentinel.samples.some(s=>s.qualityGap>0||s.rollGap>0),
 'Other player0-vs-NPC fusion quality gaps must remain measurable without resonance');
const report={schema:'arcane-v1485-verified-fusion-side-bias',
 decayTimeline:decay,
 commit:process.env.GITHUB_SHA||'local',
 rolesDeleted:{summary:deleted.samples.map(s=>({levels:s.levels,
  player0Quality:s.seat0.factor,npcQuality:s.seat1.factor,
  player0Resonance:s.seat0.bonus,npcResonance:s.seat1.bonus,
  player0Rolls:s.seat0.rolls,npcRolls:s.seat1.rolls})),raw:deleted},
 rolesSentinel:{summary:sentinel.samples.map(s=>({levels:s.levels,
  player0Quality:s.seat0.factor,npcQuality:s.seat1.factor,
  player0Resonance:s.seat0.bonus,npcResonance:s.seat1.bonus,
  player0Rolls:s.seat0.rolls,npcRolls:s.seat1.rolls})),raw:sentinel},
 checks:{syntheticPlayer0ResonanceReproduced:true,
  correctedNeutralRoleTagsRemoveSyntheticResonance:true,
  npcPokerPenaltyPersistsWithoutResonance:true,
  sameCreatureDecayRateAcrossBothSeatsVerified:true},
 limitations:['This independently proves deterministic rule differences on identical fusion materials.',
 'It does not establish what share of 84% seat0 match wins is caused by each rule.',
 'No AI weights, champion or production rule files were changed.'],
 productionIntegrated:false,promotionEligible:false};
fs.mkdirSync('artifacts/v1485',{recursive:true});
fs.writeFileSync('artifacts/v1485/fusion-side-report.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V1485_FUSION_SIDE_AUDIT '+JSON.stringify({
 checks:report.checks,decayTimeline:decay,examples:{
  deleted:report.rolesDeleted.summary.slice(0,5),
  sentinel:report.rolesSentinel.summary.slice(0,5)}
 }));
