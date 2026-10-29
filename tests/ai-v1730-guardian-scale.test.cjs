'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const scale=require('./helpers/research-guardian-scale-v173.cjs');
const role=require('./helpers/research-role-balance-v169.cjs');
const combat=fs.readFileSync('assets/essence-combat.js','utf8');
function heal(variant,guardians,opts={}){
 const source=scale.transform(combat,variant);
 const start=source.indexOf("const allies=team.filter(c=>isDefender(c)&&c.mode==='def');");
 const end=source.indexOf('for(const creature of team){',start);
 assert.ok(start>0&&end>start,'actual live healing block must exist');
 const healingCode=source.slice(start,end);
 const team=[];
 for(let i=0;i<guardians;i++)team.push({uid:i+1,role:'guardian',mode:'def',level:5,card:{atk:100,def:opts.initialDef??0}});
 const soul={uid:100,role:'soul',mode:opts.soulMode||'def',level:5,card:{atk:100,def:opts.initialDef??0}};
 team.push(soul);
 if(opts.extraAtkGuardian)team.push({uid:110,role:'guardian',mode:'atk',level:5,card:{atk:100,def:0}});
 const record=[];
 const g={players:[{field:team}]};
 const fx={beginTurn(){},record(_g,x){record.push(x)},endTurn(){}};
 const execute=new Function('team','isDefender','roleOf','statLayer','dataOf','window','g','owner',
  healingCode);
 execute(team,c=>['guardian','soul'].includes(c.role),c=>c.role,c=>({maxDef:opts.maxDef??10000}),
  c=>({level:c.level}),{ArcaneDefenderFX:fx},g,0);
 return {team,soul,record,guardianHeals:team.filter(c=>c.role==='guardian'&&c.mode==='def').map(c=>c.card.def),
  soulHeal:soul.card.def-(opts.initialDef??0)};
}
test('Explicit cohorts, exact percentage schedule, fixed 35% counter and 15/90/100/120',()=>{
 assert.deepEqual(scale.MODES,['control100','guardianScale']);
 assert.deepEqual(scale.PERCENT,[0,100,55,40,33,28]);
 for(let n=0;n<=5;n++){
  assert.equal(scale.fraction(n,'guardianScale'),scale.PERCENT[n]/100);
  assert.equal(scale.fraction(n,'control100'),n?1:0);
 }
 assert.deepEqual(role.tuning('predator15Triad90'),{pierce:.15,predator:.9,fusion:1.2});
 assert.ok(combat.includes("const counter= Math.floor(Math.max(0,dataOf(d).atk)*.35);"));
 assert.ok(combat.includes("if(isDefender(d)&&!immuneBefore&&!endDefense&&q.field[di]===d){"));
 assert.equal(scale.transform(combat,'control100'),combat);
 assert.throws(()=>scale.fraction(6,'guardianScale'),/0..5/);
 assert.throws(()=>scale.transform(combat,'guardian85'),/Invalid/);
});
test('Real combat heal block scales with number of DEF Guardians, not recipients',()=>{
 const baseHeal=85;
 for(let n=1;n<=5;n++){
  const value=Math.floor(baseHeal*scale.fraction(n,'guardianScale'));
  const a=heal('guardianScale',n);
  assert.equal(a.soulHeal,n*value,'Soul recipient n='+n);
  for(const hp of a.guardianHeals)assert.equal(hp,(n-1)*value,'Guardian recipient n='+n);
  assert.equal(a.record.length,n*n,'total actual heal FX, excluding n self pairs');
 }
 const baseline=heal('control100',5);
 assert.equal(baseline.soulHeal,5*85);
 assert.deepEqual(baseline.guardianHeals,[340,340,340,340,340]);
});
test('ATK Guardian does not lower other Guardians healing, ATK Soul does not receive heal',()=>{
 const normal=heal('guardianScale',2);
 const extra=heal('guardianScale',2,{extraAtkGuardian:true});
 assert.equal(extra.soulHeal,normal.soulHeal);
 assert.deepEqual(extra.guardianHeals,normal.guardianHeals);
 assert.equal(extra.team.find(x=>x.uid===110).card.def,0);
 assert.equal(heal('guardianScale',2,{soulMode:'atk'}).soulHeal,0);
});
test('No over-healing; no self-healing; multiple DEF Guardians use same fraction',()=>{
 const m=heal('guardianScale',3,{initialDef:75,maxDef:100});
 assert.equal(m.soulHeal,25);
 assert.deepEqual(m.guardianHeals,[100,100,100]);
 assert.equal(heal('guardianScale',1).guardianHeals[0],0);
 assert.equal(heal('guardianScale',0).soulHeal,0);
});
test('v17.3 VM guard rejects stacking with old 85% or v17.2 counter research overlay',()=>{
 const runtime=fs.readFileSync('tests/helpers/game-runtime.cjs','utf8');
 assert.ok(runtime.includes("process.env.ARCANE_RESEARCH_GUARDIAN_SCALE_V173"));
 assert.ok(runtime.includes("process.env.ARCANE_RESEARCH_GUARDIAN_HEAL||process.env.ARCANE_RESEARCH_COUNTERSTRIKE_V172"));
 assert.ok(!scale.MODES.includes('guardian85'));
});
