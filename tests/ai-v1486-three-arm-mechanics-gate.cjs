'use strict';
const assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
function probe(){
 profile=freshProfile();
 for(const k of Object.keys(profile.upgrades||{}))profile.upgrades[k]=0;
 for(const c of CARDS){
  for(const k of ['ability','role','soulRank','essenceSchool','passive','skill','perk','effect','roleOverride'])delete c[k];
  if(MODE!=='baseline')c.role='__neutral_no_role__';
 }
 const g=createGame({mode:'pve',context:'free',opponentId:0,difficulty:'hard',seed:1486001});
 g.players.forEach(p=>{p.power=1;p.enhancements={};p.flatBonus=0;p.shield=0;});
 g.essenceRules=false;g.fateUsed=[true,true];
 const tune=window.ArcaneFusionMath.getTuned();
 if(MODE==='symmetric')window.ArcaneFusionMath.setTuned(function(g,levels,elements,materials){
  if(g?.mode==='pve'&&g.active===1){const saved=g.active;g.active=0;
   try{return tune(g,levels,elements,materials);}finally{g.active=saved;}}
  return tune(g,levels,elements,materials);
 });
 const cards=RPG_BASE_CARDS.filter(c=>c.rpg&&!c.fusionOnly&&c.level===3).slice(0,3);
 if(cards.length<3)throw Error('Not enough normal level3 fusion materials');
 const materials=cards.map(x=>newInstance(g,x.id,0)),levels=[3,3,3],
  elements=materials.map(x=>dataOf(x).element);
 const sides=[0,1].map(seat=>{
  g.active=seat;
  const x=window.ArcaneFusionMath.getTuned()(g,levels,elements,materials);
  const r=window.ArcaneAllrounder.evaluate(g,materials);
  const val={quality:x.factor,rolls:qualityRolls(levels)+(x.rollBonus||0),
   resonance:r.bonus,materials:r.materials,
   levelBudget:fusionBudget(levels,g,materials)};
  return val;
 });
 return {arm:MODE,materials:cards.map(c=>c.id),sides};
}
const arms=['baseline','neutral','symmetric'];
const data=Object.fromEntries(arms.map(arm=>{
 const vm=boot({seed:1486001});
 vm.exec('var MODE='+JSON.stringify(arm)+';');
 return [arm,vm.run('('+probe.toString()+')()',120000)];
}));
const base=data.baseline.sides,neutral=data.neutral.sides,sym=data.symmetric.sides;
assert.deepEqual(data.baseline.materials,data.neutral.materials);
assert.deepEqual(data.baseline.materials,data.symmetric.materials);
assert.ok(base[0].resonance>0&&base[1].resonance===0,'Baseline false resonance not reproduced');
assert.equal(neutral[0].resonance,0);assert.equal(neutral[1].resonance,0);
assert.ok(neutral[0].quality>neutral[1].quality,'NPC fusion penalty not found after role neutralization');
assert.equal(sym[0].quality,sym[1].quality,'Symmetric fusion quality failed');
assert.equal(sym[0].rolls,sym[1].rolls,'Symmetric fusion roll count failed');
assert.equal(sym[0].levelBudget,sym[1].levelBudget,'Symmetric fusion level budget failed');
assert.deepEqual(sym[0],sym[1],'All symmetric fusion stats must match');
console.log('ARCANE_V1486_MECHANISM_GATE '+JSON.stringify({passed:true,arms:data}));
