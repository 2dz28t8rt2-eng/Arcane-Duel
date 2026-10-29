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
 assert.equal(b.run('window.ArcaneFusionStomp.version'),'20.3');
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
test('surviving collateral Guardian in DEF counters for 40% of the current 35%-ATK rule',()=>{
 const r=run(`const a=card(sample.id,0,0,1000,1200,'atk',3);
  card(ordinary.id,1,2,100,400);const d=card(guardian.id,1,3,600,2500,'def');
  const x=attack(g,0,2);return {hp:g.players[0].lp,def:d.card.def,
   counter:x.stomp.hits[0].counter,fatigue:a.attackFatigue};`);
 assert.equal(r.counter,84);assert.equal(r.hp,9916); // floor(floor(600 × 35%) × 40%)
 assert.equal(r.def,2045);assert.equal(r.fatigue,60);
});
test('Stomp cannot counter after collateral defender destruction, for Guardian or Soul',()=>{
 for(const role of ['guardian','soul']){
  const r=run(`const a=card(sample.id,0,0,1000,1200,'atk',3);
   card(ordinary.id,1,2,100,400);
   const id=CARDS.find(c=>c.role===${JSON.stringify(role)}&&!c.fusionOnly&&!c.essenceMonster).id;
   const d=card(id,1,3,600,300,'def');
   const out=attack(g,0,2);const h=out.stomp.hits[0];
   return {destroyed:h.destroyed,counter:h.counter,lp:g.players[0].lp,
    field:g.players[1].field[3]===null};`);
  assert.deepEqual(r,{destroyed:true,counter:0,lp:10000,field:true},role);
 }
});
test('Stomp respects Last Bastion immunity: no collateral damage or counter',()=>{
 const r=run(`card(sample.id,0,0,1000,1200,'atk',3);
  card(ordinary.id,1,2,100,400);
  const d=card(guardian.id,1,3,600,1000,'def');d.essenceCombat={guardLeft:2,soul:0,condensed:0};
  const out=attack(g,0,2);return {counter:out.stomp.hits[0].counter,def:d.card.def,lp:g.players[0].lp};`);
 assert.deepEqual(r,{counter:0,def:1000,lp:10000});
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
test('a Predator can punish a five-material fusion after its four-target energy expenditure',()=>{
 const r=run(`const boss=card(sample.id,0,0,1000,1200,'atk',5);
  const hunter=card(ordinary.id,1,0,900,650);
  hunter.predatorEvolutionAge=4; // Fully evolved hunter can punish the spent Fusion despite 90% opening strength.
  for(const [slot,atk] of [[1,100],[2,100],[3,100],[4,100]])
   card(ordinary.id,1,slot,atk,100);
  attack(g,0,2);const reduced=boss.card.atk;
  g.active=1;const counter=attack(g,0,0);
  return {reduced,bossDead:g.players[0].field[0]===null,
   predatorAlive:g.players[1].field[0]===hunter,damage:counter.damage};`);
 assert.equal(r.reduced,880);
 assert.equal(r.bossDead,true);
 assert.equal(r.predatorAlive,true);
 assert.ok(r.damage>0);
});
