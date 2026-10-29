'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {boot}=require('./helpers/game-runtime.cjs');
const helper=require('./helpers/research-guardian-stats-v176.cjs');
const modes=helper.MODES;
function snapshot(mode){
 const prev=process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V176;
 try{
  if(mode)process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V176=mode;
  else delete process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V176;
  return boot({seed:17600042}).run('({cards:CARDS.map(c=>({id:c.id,role:c.role,level:c.level,atk:c.atk,def:c.def,rpg:c.rpg,retired:c.retired,fusionOnly:c.fusionOnly,essenceMonster:c.essenceMonster,ace:c.ace})),audit:window.__arcaneResearchGuardianStats||null})');
 }finally{if(prev===undefined)delete process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V176;
  else process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V176=prev;}
}
test('Three explicit stat variants and fixed percentages',()=>{
 assert.deepEqual(modes,['control','guardian22','guardian20']);
 assert.equal(helper.SPECS.guardian22.budget,.95);
 assert.equal(helper.SPECS.guardian22.atkShare,.22);
 assert.equal(helper.SPECS.guardian20.atkShare,.20);
 assert.equal(helper.transform(fs.readFileSync('assets/game.js','utf8'),'control'),
  fs.readFileSync('assets/game.js','utf8'));
 assert.throws(()=>helper.transform('broken source','guardian22'),/anchor missing/);
});
test('Live catalog untouched, only ordinary Guardian templates reweighted exactly',()=>{
 const baseline=snapshot(null),control=snapshot('control'),v22=snapshot('guardian22'),v20=snapshot('guardian20');
 assert.equal(control.audit,null);
 assert.deepEqual(control.cards,baseline.cards);
 const b=new Map(baseline.cards.map(c=>[c.id,c]));
 const n=b.size;assert.equal(v22.cards.length,n);assert.equal(v20.cards.length,n);
 let count=0,atkReduced=0;
 for(const a of v22.cards){
  const orig=b.get(a.id),c20=v20.cards.find(z=>z.id===a.id);
  assert.ok(orig&&c20,'All original card IDs remain stable');
  assert.equal(a.role,orig.role);assert.equal(c20.role,orig.role);
  assert.equal(a.level,orig.level);assert.equal(c20.level,orig.level);
  if(!helper.eligible(orig)){assert.deepEqual(a,orig);assert.deepEqual(c20,orig);continue;}
  count++;const x=helper.reweight(orig,'guardian22'),y=helper.reweight(orig,'guardian20');
  assert.equal(a.atk,x.atk);assert.equal(a.def,x.def);
  assert.equal(c20.atk,y.atk);assert.equal(c20.def,y.def);
  assert.ok(a.atk<=orig.atk&&c20.atk<=a.atk,'Guardian ATK must not increase');
  assert.equal(a.atk+a.def,x.newPool);
  assert.equal(c20.atk+c20.def,y.newPool);
  if(a.atk<orig.atk)atkReduced++;
 }
 assert.ok(count>=10&&atkReduced>0,'Active Guardian cards and actual ATK reductions required');
 assert.equal(v22.audit.changed,count);assert.equal(v20.audit.changed,count);
 assert.equal(v22.audit.changedIds.length,count);
 assert.equal(v22.audit.oldAtk-v22.audit.newAtk,
  v22.cards.reduce((sum,c)=>sum+(helper.eligible(c)?b.get(c.id).atk-c.atk:0),0));
});
test('Research only; exported combat uses 35%-surviving counter and v17.6 runner keeps attack telemetry',()=>{
 const combat=fs.readFileSync('assets/essence-combat.js','utf8');
 assert.match(combat,/const counter= Math.floor\(Math.max\(0,dataOf\(d\).atk\)\*\.35\);/);
 const runtime=fs.readFileSync('tests/helpers/game-runtime.cjs','utf8');
 assert.match(runtime,/ARCANE_RESEARCH_GUARDIAN_STATS_V176/);
 const runner=fs.readFileSync('tests/ai-v1760-selfplay.cjs','utf8');
 assert.match(runner,/research-guardian-stats-v176/);
 assert.match(runner,/offenseBySeat:m.stats.offenseBySeat/);
 assert.match(runner,/guardianHealMetrics:m.stats.guardianHealMetrics/);
});
