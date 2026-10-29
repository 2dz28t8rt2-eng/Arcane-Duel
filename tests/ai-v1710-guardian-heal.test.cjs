'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {MODES,mode,factor,transform}=require('./helpers/research-guardian-heal-v171.cjs');
const {tuning}=require('./helpers/research-role-balance-v169.cjs');
const source=fs.readFileSync('assets/essence-combat.js','utf8');
const anchor='const layer=statLayer(ally),amount=Math.min(150,25+dataOf(guardian).level*12);';
function healed(v,kind,level,def,maxDef){
 const code=transform(source,v);
 const reg=/const layer=statLayer\(ally\),[^\n]*?;\n     const before=ally\.card\.def;ally\.card\.def=Math\.min\(layer\.maxDef,ally\.card\.def\+amount\);/;
 const match=code.match(reg);assert.ok(match,'missing real Guardian heal statement');
 const ally={role:kind,card:{def}},guardian={level},statLayer:()=>({maxDef}),dataOf:g=>({level:g.level}),roleOf:c=>c.role;
 const context={ally,guardian,statLayer,dataOf,roleOf,Math};
 vm.runInNewContext(match[0],context);
 return ally.card.def-def;
}
test('Selected 15 / 90 / 100 / 120 role balance remains untouched',()=>{
 assert.deepEqual(tuning('predator15Triad90'),{pierce:.15,predator:.9,fusion:1.2});
});
test('Heal reduction affects Guardian recipients only, including healing cap and no overheal',()=>{
 assert.deepEqual(MODES,['control100','guardian85','guardian75']);
 assert.ok(source.includes(anchor));
 for(const v of MODES){
  let f=factor(v),base=Math.min(150,25+5*12);
  assert.equal(healed(v,'guardian',5,100,1000),Math.floor(base*f),v+' Guardian');
  assert.equal(healed(v,'soul',5,100,1000),base,v+' Soul');
  assert.equal(healed(v,'guardian',5,100,110),10,v+' no overheal');
  assert.equal(healed(v,'soul',5,100,110),10,v+' Soul no overheal');
  assert.equal(healed(v,'guardian',10,0,1000),Math.floor(Math.min(150,25+10*12)*f),v+' high-level cap');
 }
 assert.equal(transform(source,'control100'),source);
 assert.ok(source.includes('if(ally===guardian||!ally.card)continue;'));
 assert.ok(source.includes("const allies=team.filter(c=>isDefender(c)&&c.mode==='def');"));
 assert.ok(source.includes("for(const guardian of team.filter(c=>roleOf(c)==='guardian'&&c.mode==='def'))"));
});
test('Research variant selection rejects invalid cohort',()=>{
 if(process.env.ARCANE_RESEARCH_GUARDIAN_HEAL)assert.equal(mode(),process.env.ARCANE_RESEARCH_GUARDIAN_HEAL);
 else assert.throws(()=>mode(),/Explicit v17.1/);
});
