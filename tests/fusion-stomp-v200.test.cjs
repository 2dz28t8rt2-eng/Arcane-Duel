'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const BASE=`profile=freshProfile();profile.guideSeen=true;
 const g=createGame({mode:'pve',context:'free',seed:200127,opponentId:1,starter:0});
 g.turn=12;g.active=0;g.fateUsed=[true,true];g.winner=null;
 for(const p of g.players){p.field=[null,null,null,null,null];p.shield=0;p.power=1;p.flatBonus=0;p.enhancements={};p.lp=10000;}
 const sample=CARDS.find(c=>c.fusionOnly&&!c.essenceMonster&&c.level>=3);
 const ordinary=CARDS.find(c=>c.role==='predator'&&!c.fusionOnly&&!c.essenceMonster&&c.level>=3);
 const guardian=CARDS.find(c=>c.role==='guardian'&&!c.fusionOnly&&!c.essenceMonster&&c.level>=3);
 function card(id,owner,index,atk,def,mode='atk',fusionMaterials=0){const c=newInstance(g,id,owner);c.mode=mode;
  c.card={level:5,atk,def};c.fusion=!!fusionMaterials;
  if(fusionMaterials)c.materialsUsed=fusionMaterials;
  g.players[owner].field[index]=c;return c;}
`;
function run(source){const b=boot({seed:200127});return b.run('(()=>{'+BASE+source+'})()');}
test('loaded after Predator, without overwriting regular impact effects',()=>{
 const b=boot();const files=b.scripts;
 assert.ok(files.indexOf('assets/fusion-stomp-v200.js')>files.indexOf('assets/predator-pack-v198.js'));
 assert.equal(b.run('window.ArcaneFusionStomp.version'),'20.0');
});
test('five-material Stomp distributes 100/50/50/30%, destroys unique ATK targets and costs both stats',()=>{
 const r=run(`const a=card(sample.id,0,0,1000,1200,'atk',5);
  for(const [slot,atk,def] of [[2,100,400],[3,800,500],[1,500,1000],[4,300,100]])
   card(ordinary.id,1,slot,atk,def);
  const x=attack(g,0,2);return {hit:x.stomp?.hits.map(v=>({index:v.index,pct:v.pct,destroyed:v.destroyed})),
   targets:g.players[1].field.map(c=>!!c),atk:a.card.atk,def:a.card.def,fatigue:a.attackFatigue};`);
 assert.deepEqual(r.hit,[{index:3,pct:50,destroyed:true},{index:1,pct:50,destroyed:true},{index:4,pct:30,destroyed:true}]);
 assert.deepEqual(r.targets,[false,false,false,false,false]);
 assert.equal(r.atk,880);assert.equal(r.def,1056);assert.equal(r.fatigue,120);
});
test('failed ATK kill damages DEF even while target remains in ATK posture',()=>{
 const r=run(`const a=card(sample.id,0,0,1000,1200,'atk',3);
  card(ordinary.id,1,2,200,500);const t=card(ordinary.id,1,3,950,1000);
  const x=attack(g,0,2);return {atk:t.card.atk,def:t.card.def,exists:g.players[1].field[3]===t,
   hit:x.stomp.hits[0],fatigue:a.attackFatigue};`);
 assert.equal(r.atk,950);assert.equal(r.def,300);assert.equal(r.exists,true);
 assert.equal(r.hit.pct,70);assert.equal(r.fatigue,60);
});
test('secondary damage uses the individual victim strength, not the primary-target modifier',()=>{
 const r=run(`const a=card(sample.id,0,0,1000,1200,'atk',3);
  const main=card(ordinary.id,1,2,100,500),side=card(ordinary.id,1,3,1050,500);
  const oldEffective=effectiveAttack;
  effectiveAttack=(state,actor,victim)=>oldEffective(state,actor,victim)+(victim===side?600:0);
  const hit=attack(g,0,2).stomp.hits[0];
  return {destroyed:hit.destroyed,raw:hit.raw,present:!!g.players[1].field[3]};`);
 assert.equal(r.destroyed,true);assert.equal(r.raw,1120);assert.equal(r.present,false);
});
test('three-material Stomp falls back left, four- and five-material never hit one monster twice',()=>{
 const r=run(`const field=[null,null,{},null,null];return [3,4,5].map(n=>
   window.ArcaneFusionStomp.adjacent(field,2,0,n));`);
 assert.deepEqual(r,[[],[],[]]);
 const full=run(`const field=[{},{},{},{},{}];return [3,4,5].map(n=>
   window.ArcaneFusionStomp.adjacent(field,3,0,n));`);
 assert.deepEqual(full,[[4],[4,2],[4,2,1]]);
});
test('AI side flips right/left from its own viewpoint',()=>{
 const r=run(`const a=card(sample.id,1,0,1000,1200,'atk',3);g.active=1;
  card(ordinary.id,0,2,100,400);card(ordinary.id,0,1,300,500);
  const x=attack(g,0,2);return {hit:x.stomp.hits.map(h=>h.index),fatigue:a.attackFatigue};`);
 assert.deepEqual(r.hit,[1]);assert.equal(r.fatigue,60);
});
test('collateral Guardian in DEF sends 40%-strength counter to player LP',()=>{
 const r=run(`const a=card(sample.id,0,0,1000,1200,'atk',3);
  card(ordinary.id,1,2,100,400);const d=card(guardian.id,1,3,600,2500,'def');
  const x=attack(g,0,2);return {hp:g.players[0].lp,def:d.card.def,
   counter:x.stomp.hits[0].counter,fatigue:a.attackFatigue};`);
 assert.equal(r.counter,120);assert.equal(r.hp,9880);
 assert.equal(r.def,2045);assert.equal(r.fatigue,60);
});
test('ordinary attacks also pay a single target cost in ATK and DEF',()=>{
 const r=run(`const a=card(ordinary.id,0,0,1000,1200);
  card(ordinary.id,1,2,100,400);attack(g,0,2);
  return {atk:a.card.atk,def:a.card.def,fatigue:a.attackFatigue};`);
 assert.equal(r.atk,970);assert.equal(r.def,1164);assert.equal(r.fatigue,30);
});
test('material bonus has a hard twelve-percentage-point cap and never buffs the main strike',()=>{
 const r=run(`const f=card(sample.id,0,0,1000,1200,'atk',5);
  f.stompMaterials={resonator:5};f.stompBonusPP=12;
  return {bonus:window.ArcaneFusionStomp.materialBoost(f),splash:window.ArcaneFusionStomp.percentByHit(5,3,12)};`);
 assert.equal(r.bonus,12);assert.deepEqual(r.splash,[62,62,42]);
});
test('saved fusion retains material count and rolled Stomp bonus after loading',()=>{
 const b=boot({seed:200127});
 const r=b.run(`(()=>{profile=freshProfile();const g=createGame({mode:'pve',context:'free',seed:200127,opponentId:1,starter:0});
  const sample=CARDS.find(c=>c.fusionOnly&&!c.essenceMonster&&c.level>=3);
  const f=newInstance(g,sample.id,0);f.fusion=true;f.materialsUsed=4;
  f.stompBonusPP=7;f.stompMaterials={resonator:2,combatant:1,predator:1};
  g.players[0].field[2]=f;
  const loaded=validateDuelSnapshot(JSON.parse(JSON.stringify(g))).players[0].field[2];
  return {count:loaded.materialsUsed,bonus:loaded.stompBonusPP,roles:loaded.stompMaterials};})()`);
 assert.deepEqual(r,{count:4,bonus:7,roles:{resonator:2,combatant:1,predator:1}});
});
