'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {boot}=require('./helpers/game-runtime.cjs');
const manifest=require('../assets/role-transfer-v216-manifest.json');
const browser=require('../assets/duo-card-catalog-v160.json');
const server=require('../supabase/functions/arcane-duo-v2/catalog.json');
const all=[...manifest.guardian,...manifest.soul,...manifest.combatant];
test('Exactly 21 stable Predator cards turn into 7 Guardians, 7 Soul and 7 Allrounder cards',()=>{
 const b=boot({seed:216});
 const data=b.run(`({
  roster:window.ArcaneRoleTransferV216.roster.map(x=>({
   ...x,actual:CARDS[x.id].role,style:CARDS[x.id].roleStyle,
   rank:CARDS[x.id].soulRank||0,active:UPDATE_B_SET.has(x.id),fusion:CARDS[x.id].fusionOnly,
   desc:CARDS[x.id].desc
  })),
  total:CARDS.length,oldGuardians:window.ArcaneGuardianBalanceV212.changed
 })`);
 assert.equal(data.total,762);assert.equal(data.oldGuardians,84);
 assert.equal(data.roster.length,21);assert.equal(new Set(all).size,21);
 assert.deepEqual(data.roster.map(x=>x.id).sort((a,b)=>a-b),[...all].sort((a,b)=>a-b));
 for(const [role,ids] of Object.entries(manifest)){
  if(!Array.isArray(ids))continue;
  assert.equal(ids.length,7);
  for(const id of ids){
   const c=data.roster.find(x=>x.id===id);
   assert.ok(c);assert.equal(c.from,'predator');assert.equal(c.to,role);
   assert.equal(c.actual,role);assert.equal(c.active,true);assert.equal(c.fusion,false);
   assert.equal(c.style,role==='combatant'?'allrounder':role);
   assert.ok(c.atk>0&&c.def>0);
   assert.equal(c.rank>0,role==='soul');
   assert.ok(!/\\bPredator\\b/i.test(c.desc));
  }
 }
});
test('New stats follow shared level budgets, Soul protection and v21.2 Guardian weighting',()=>{
 const r=boot({seed:217}).run(`({
  budget:window.ArcaneLevelBudget.totals,
  cards:window.ArcaneRoleTransferV216.roster.map(c=>({
    ...c,factor:window.ArcaneLevelBudget.rarityFactor(CARDS[c.id])
  }))
 })`);
 const round=n=>Math.round(n/10)*10;
 for(const c of r.cards){
  const total=round(r.budget[c.level]*c.factor);
  if(c.to==='guardian'){
   const before=Math.max(50,round(total*.25)),pool=round(total*.95);
   const floor=Math.min(80,before,Math.floor(pool/20)*10);
   const target=Math.max(floor,Math.min(pool-floor,round(pool*.22)));
   assert.equal(c.atk,Math.min(before,target));assert.equal(c.atk+c.def,pool);
  }else{
   assert.equal(c.atk,Math.max(50,round(total*(c.to==='soul'?.22:.5))));
   assert.equal(c.atk+c.def,total);
  }
 }
});
test('Duo browser/server catalog mirrors all 21 roles, stats, PvE bonuses',()=>{
 const rows=boot({seed:2169}).run(`CARDS.map(c=>({
  id:c.id,role:c.role||'combatant',atk:c.atk,def:c.def,
  bonus:!c.fusionOnly&&!c.essenceMonster?
   {atk:normalRoleBonus(c,'atk',1,{}),def:normalRoleBonus(c,'def',1,{})}:{atk:0,def:0}
 }))`);
 assert.deepEqual(browser,server);
 for(const id of all){
  const m=browser.cards[id],r=rows[id];
  assert.equal(m.role,r.role);assert.equal(m.atk,r.atk);assert.equal(m.def,r.def);
  assert.deepEqual(m.pveBaseBonus,r.bonus);
 }
});
test('Field markers tell Wächter from Seelenzehrer by shape and text in both modes',()=>{
 const js=fs.readFileSync('assets/combat-identity-v183.js','utf8'),
 css=fs.readFileSync('assets/combat-identity-v183.css','utf8');
 assert.match(js,/ad183-role-name-'\+role/);
 assert.match(js,/WÄCHTER/);assert.match(js,/SEELENZEHRER/);
 assert.match(js,/Seelenzehrer · Essenz bereit/);
 assert.match(css,/\.ad183-role-name-soul/);
 assert.match(css,/\.ad183-role-name-guardian/);
 assert.match(css,/duo-battle \.field-cell \.ad183-role-name/);
});
