'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
test('Defender fusion rolls use 135% DEF and 75% ATK before dice; no post-roll second multiplier',()=>{
 const b=boot();const r=b.run(`(()=>{
  const a=fusionRoleWeights('guardian'),s=fusionRoleWeights('soul'),p=fusionRoleWeights('predator');
  return {a,s,p};
 })()`);
 assert.deepEqual(r.a,{atk:.75,def:1.35});assert.deepEqual(r.s,r.a);assert.deepEqual(r.p,{atk:1.2,def:.75});
});
test('Targeted Seelenraub costs one active soul action and only drains existing target stats',()=>{
 const b=boot();const r=b.run(`(()=>{
   profile=freshProfile();profile.guideSeen=true;
   game=createGame({id:'soul-raid',mode:'pve',opponentId:1,context:'free',seed:9284});
   game.active=0;game.turn=4;uiMode='duel';busy=false;aiRunning=false;$('overlay').classList.add('hidden');
   const soulId=CARDS.find(c=>c.role==='soul'&&!c.fusionOnly&&c.level<=6).id;
   const enemyId=CARDS.find(c=>c.role==='predator'&&!c.fusionOnly&&c.level<=6).id;
   const soul=newInstance(game,soulId,0),foe=newInstance(game,enemyId,1);
   soul.mode='def';game.players[0].field=[soul,null,null,null,null];game.players[1].field=[foe,null,null,null,null];
   const C=window.ArcaneEssenceCombat,original=foe.card.atk+foe.card.def;
   const first=C.soulRaid(0,0),left=foe.card.atk+foe.card.def,stored=C.statLayer(soul).soul;
   const repeat=C.soulRaid(0,0),condense=C.condense(0),discharge=C.discharge(0);
   const snapshot=validateDuelSnapshot(JSON.parse(JSON.stringify(game)));
   return {first,repeat,condense,discharge,taken:original-left,stored,limit:250+dataOf(soul).level*125,
    cooldown:C.statLayer(soul).raidCooldown,saved:snapshot.players[0].field[0].essenceCombat};
 })()`);
 assert.equal(r.first,true);assert.equal(r.repeat,false);assert.equal(r.condense,false);
 assert.equal(r.discharge,false);assert.ok(r.taken>0&&r.taken<=250);assert.ok(r.stored<=r.limit);
 assert.equal(r.cooldown,3);assert.equal(r.saved.lastSoulAction,4);assert.equal(r.saved.raidCooldown,3);
});
test('Stored soul conversion is 150% on soul fusions without multiplying Bollwerk',()=>{
 const r=boot().run(`(()=>{
  const C=window.ArcaneEssenceCombat,g=createGame({mode:'pve',opponentId:7,context:'free',seed:931});
  const soul=CARDS.find(c=>c.role==='soul'&&!c.fusionOnly),c={id:soul.id,card:{level:5,atk:500,def:500},fusion:false};
  g.essenceSchool='defense';g.essenceTier=10;
  const regular=C.conversionFactor(g,c,0);c.fusion=true;
  const fused=C.conversionFactor(g,c,0);return {regular,fused};
 })()`);
 assert.equal(r.regular,1.22);assert.equal(r.fused,1.5);
});
test('Charged FIELD materials give only the fused card bounded DEF and soul energy',()=>{
 const rows=boot().run(`(()=>{
  function run(stored,field=true){
   profile=freshProfile();profile.guideSeen=true;
   const g=createGame({id:'inherit-'+stored+'-'+field,mode:'pve',opponentId:4,context:'free',seed:4071});
   g.players[0].field.fill(null);
   const mat=CARDS.find(c=>c.role==='soul'&&!c.fusionOnly&&c.level===4)||CARDS.find(c=>c.role==='soul'&&!c.fusionOnly);
   const fusions=RPG_FUSIONS.filter(c=>!c.retired&&!c.enemyOnly&&c.role==='soul');
   const base=newInstance(g,mat.id,0),extra=newInstance(g,mat.id,0);
   g.players[0].field[0]=base;
   window.ArcaneEssenceCombat.statLayer(base).soul=stored;
   const options=fusionOptions(g,[dataOf(base).level,dataOf(extra).level]);
   const to=options.find(c=>c.role==='soul')||options.find(c=>c.role==='guardian')||options[0];
   g.players[0].remainingFusion=[to.id];g.fusionChoice=to.id;
   if(!field)g.players[0].field.fill(null);
   const fused=fusedInstance(g,[base,extra],[dataOf(base).level,dataOf(extra).level]);
   const energy=fused.essenceCombat?.soul||0;
   return {role:fused.roleOverride||CARDS[fused.id].role,stored,fusedDef:fused.card.def,energy,
    imprint:fused.soulInheritance,roll:fused.rollMath,rawBase:base.essenceCombat.soul};
  }
  return [run(500),run(0),run(500,false)];
 })()`);
 const [charged,empty,hand]=rows;
 assert.ok(charged.imprint&&charged.imprint.defBonus===150,JSON.stringify(charged));
 assert.equal(charged.fusedDef-empty.fusedDef,150);
 assert.equal(empty.imprint,undefined);assert.equal(hand.imprint,undefined);
 assert.equal(charged.fusedDef,charged.roll.winner.def+charged.roll.bonus.def-charged.roll.penalty);
 assert.ok(charged.energy>=0&&charged.energy<=150);
 assert.equal(charged.rawBase,500,'Material retains charge until transaction removes it');
});
test('PvP role overrides cannot activate Seelenraub',()=>{
 const r=boot().run(`(()=>{
  game=createGame({mode:'pvp',seed:42010});game.active=0;uiMode='duel';busy=false;aiRunning=false;$('overlay').classList.add('hidden');
  return window.ArcaneEssenceCombat.soulRaid(0,0);
 })()`);assert.equal(r,false);
});
