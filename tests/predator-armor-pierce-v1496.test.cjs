'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
function armorProbe(pierce,seat,defenderRole,defenderMode){
 profile=freshProfile();profile.guideSeen=true;
 for(const k of Object.keys(profile.upgrades||{}))profile.upgrades[k]=0;
 const g=createGame({mode:'pve',context:'free',seed:14961234,starter:0,
  strategicTraining:{enabled:true,symmetricSides:true,
   noAttackTurns:0,disableArenaLPDecay:true,predatorArmorPierce:pierce}});
 g.turn=12;g.active=seat;g.fateUsed=[true,true];
 for(const p of g.players){p.shield=0;p.enhancements={};p.power=1;p.flatBonus=0;}
 const role=(id)=>CARDS.find(c=>c.role===id&&!c.fusionOnly&&c.level>=3);
 const pred=role('predator'),def=role(defenderRole);
 if(!pred||!def)throw Error('Cards missing');
 const a=newInstance(g,pred.id,seat),b=newInstance(g,def.id,1-seat);
 a.mode='atk';b.mode=defenderMode;
 a.card.atk=500;b.card.def=3000;b.card.atk=150;
 g.players[seat].field=[a,null,null,null,null];
 g.players[1-seat].field=[b,null,null,null,null];
 const before=b.card.def,initialLP=g.players.map(p=>p.lp);
 const r=attack(g,0,0);
 if(!r)throw Error('Failed legitimate attack');
 return {dealtDef:before-b.card.def,oppLP:initialLP[1-seat]-g.players[1-seat].lp,
  myLP:initialLP[seat]-g.players[seat].lp,
  rawAttack:500,mitigation:g.strategicTraining?.predatorArmorPierce||0};
}
function run(pierce,seat,role='guardian',mode='def'){
 return boot({seed:14961234}).run('('+armorProbe.toString()+')('+JSON.stringify(pierce)+','+seat+','+JSON.stringify(role)+','+JSON.stringify(mode)+')');
}
test('0/8/12pp predator armour-pierce damages defender DEF, not their LP',()=>{
 for(const role of ['guardian','soul'])for(const seat of [0,1]){
  const a=run(0,seat,role),b=run(.08,seat,role),c=run(.12,seat,role);
  assert.equal(a.dealtDef,360);assert.equal(b.dealtDef,396);assert.equal(c.dealtDef,414); // 90% Predator baseline, 0/8/12pp of armor pierce
  assert.equal(a.oppLP,0);assert.equal(b.oppLP,0);assert.equal(c.oppLP,0);
  assert.equal(a.myLP,b.myLP);assert.equal(b.myLP,c.myLP);
 }
});
test('research predator armour piercing is exactly seat-symmetric',()=>{
 for(const p of [0,.08,.12])for(const role of ['guardian','soul']){
  assert.deepEqual(run(p,0,role),run(p,1,role));
 }
});
test('armour tuning has zero benefit against ATK-mode monsters',()=>{
 for(const seat of [0,1]){
  const a=run(0,seat,'guardian','atk'),b=run(.12,seat,'guardian','atk');
  assert.equal(a.oppLP,b.oppLP);assert.equal(a.myLP,b.myLP);
  assert.equal(a.dealtDef,b.dealtDef);
 }
});
test('tuning is not accidentally enabled in ordinary PvE',()=>{
 const r=boot({seed:14961234}).run('(()=>{profile=freshProfile();const g=createGame({mode:"pve",seed:14961234,strategicTraining:{enabled:false,noAttackTurns:0,symmetricSides:true,predatorArmorPierce:.12}});return g.strategicTraining||null;})()');
 assert.equal(r,null);
});
