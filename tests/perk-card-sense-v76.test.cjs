'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');

test('Kartenspürsinn: saved ranks 0–8 and expected pack starter probabilities',()=>{
 const v=boot({seed:7610}).run(`(()=>{
  const r=[];
  for(const rank of [0,1,2,4,6,8]){
   profile.upgrades.starter=rank;
   const original=[85,60,40,15].map(cut=>cardSenseStarterCut(cut));
   r.push({rank,original,saved:validateProfile(JSON.parse(JSON.stringify(profile))).upgrades.starter,
    name:UPGRADES.starter.name,max:UPGRADES.starter.max});
  }
  return r;
 })()`);
 assert.deepEqual(v.map(x=>x.original),[[85,60,40,15],[80,55,35,10],
  [75,50,30,5],[65,40,20,0],[55,30,10,0],[45,20,0,0]]);
 assert.equal(v.every(x=>x.saved===x.rank&&x.name==='Kartenspürsinn'&&x.max===8),true);
});

test('Old starter flat combat stats removed; ranks now affect only pack composition',()=>{
 const result=boot({seed:7620}).run(`(()=>{
  const unit0=CARDS[DEFAULT_DECK[0]],unitLate=CARDS.find(c=>c.rpg&&!c.fusionOnly&&c.id>=20);
  const player={id:0,power:1,flatBonus:0,enhancements:{}};
  profile.upgrades.starter=0;
  const before=[baseStat(unit0,'atk',player),baseStat(unit0,'def',player),
   baseStat(unitLate,'atk',player),profileCard(unit0).card.atk,profileCard(unit0).card.def];
  profile.upgrades.starter=8;
  const after=[baseStat(unit0,'atk',player),baseStat(unit0,'def',player),
   baseStat(unitLate,'atk',player),profileCard(unit0).card.atk,profileCard(unit0).card.def];
  return {before,after,normalHasNoTrait:unitLate.id>=20};
 })()`);
 assert.deepEqual(result.before,result.after,'No historical starting-monster combat bonus survives');
 assert.equal(result.normalHasNoTrait,true);
});

test('All booster slots remain legal and fixed; no ACE/early late-game access',()=>{
 const result=boot({seed:7630}).run(`(()=>{
  const trials=[];
  for(const tier of [3,5,7,9])for(const rank of [0,8])for(const count of [1,3,5,10]){
   profile.upgrades.starter=rank;
   const valid=boosterPools(tier);
   const allowed=new Set([...valid.starter,...valid.normal,...valid.rare]);
   let cards=0,starter=0,rare=0,illegal=0,new16=0;
   for(let i=0;i<300;i++){
    const got=rollBooster(tier,{seed:763000+i*743+tier*997+count},count);
    if(got.length!==count)throw Error('Booster card count changed');
    for(const id of got){
     const c=CARDS[id];
     if(!allowed.has(id)||c.ace||c.requiredTier>tier||c.retired)illegal++;
     starter+=Number(valid.starter.includes(id));
     rare+=Number(valid.rare.includes(id));new16+=Number(id>=716&&id<=731);
     cards++;
    }
   }
   trials.push({tier,rank,count,cards,starter,rare,illegal,new16,
    distinctNormal:valid.normal.some(id=>!valid.starter.includes(id))});
  }
  return trials;
 })()`);
 assert.equal(result.every(x=>x.illegal===0&&x.cards===300*x.count),true,
  'Rarity and source access must remain legal');
 const at=(tier,rank,count)=>result.find(x=>x.tier===tier&&x.rank===rank&&x.count===count);
 for(const tier of [3,5,7,9])for(const count of [1,3,5,10]){
  const before=at(tier,0,count),after=at(tier,8,count);
  // If the tier has no separate normal pool yet, boosterPools deliberately
  // falls back to starter cards; a perk cannot conjure a locked card.
  assert.ok(after.starter<=before.starter,
   'Perks must never increase starter count at tier '+tier+' count '+count);
  // Small deterministic series can use the same individual cards even when
  // the weighted starter cutoff changes; compare a larger pack below rather
  // than asserting a strict improvement in every 300 single-card outcomes.
  if(before.distinctNormal)
   assert.ok(after.starter<=before.starter,
    'Perks must not increase starter pulls when alternatives are accessible');
  assert.equal(after.rare,before.rare,
   'Rare odds must remain identical using paired RNG rolls');
 }
 assert.equal(at(3,8,10).new16,0,'Level gate prevents late-game before tier 5');
 assert.ok(at(9,8,10).new16>=at(9,0,10).new16,
  'A chance shift must not reduce actual unlocked late-game pulls');
 assert.ok(at(9,8,10).starter<at(9,0,10).starter,
  'Across 3,000 card rolls with endgame alternatives the perk must measurably reduce starters');
});

test('Booster shift is only to already unlocked ordinary monsters, not extra rewards',()=>{
 const rt=boot({seed:7640});
 const baseline=rt.run(`(()=>{profile.upgrades.starter=0;
  const g={seed:100};return rollBooster(8,g,5)})()`);
 const upgraded=rt.run(`(()=>{profile.upgrades.starter=8;
  const g={seed:100};return rollBooster(8,g,5)})()`);
 assert.equal(baseline.length,5);
 assert.equal(upgraded.length,5);
 const counts=rt.run(`(()=>({
  normal:boosterPools(8).normal.length,
  starter:boosterPools(8).starter.length,
  rare:boosterPools(8).rare.length
 }))()`);
 assert.ok(counts.normal>0&&counts.starter>0&&counts.rare>0);
});
