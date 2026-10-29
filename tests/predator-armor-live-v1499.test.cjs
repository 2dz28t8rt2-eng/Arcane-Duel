'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
function probe(seat,defRole,attackerRole='predator',variant='live',pack=1,defMode='def'){
 profile=freshProfile();profile.guideSeen=true;
 for(const k of Object.keys(profile.upgrades||{}))profile.upgrades[k]=0;
 const opts={mode:'pve',context:'free',opponentId:1,seed:14990422,starter:0};
 if(variant==='research-zero'||variant==='research-ten')
  opts.strategicTraining={enabled:true,symmetricSides:true,noAttackTurns:0,
   disableArenaLPDecay:true,predatorSwarmPercent:.02,
   predatorArmorPierce:variant==='research-zero'?0:.10};
 const g=createGame(opts);g.active=seat;g.turn=12;g.fateUsed=[true,true];
 for(const p of g.players){p.field=[null,null,null,null,null];
  p.shield=0;p.enhancements={};p.power=1;p.flatBonus=0;p.lp=10000;}
 const card=role=>CARDS.find(c=>c.role===role&&!c.fusionOnly&&!c.essenceMonster&&c.level>=3);
 const enemy=card(defRole),attacker=card(attackerRole),ally=card('predator');
 if(!enemy||!attacker||!ally)throw Error('Missing real role '+[defRole,attackerRole]);
 const first=newInstance(g,attacker.id,seat),target=newInstance(g,enemy.id,1-seat);
 first.mode='atk';first.card.atk=800;first.card.def=800;
 target.mode=defMode;target.card.def=1500;target.card.atk=120;
 g.players[seat].field[0]=first;g.players[1-seat].field[0]=target;
 for(let i=1;i<pack;i++){const pred=newInstance(g,ally.id,seat);pred.mode='def';
  g.players[seat].field[i]=pred;}
 const atk=effectiveAttack(g,first,target),before=target.card.def;
 const result=attack(g,0,0);
 if(!result)throw Error('Legal combat action failed');
 return {atk,defLost:before-(target.card?.def??0),remaining:target.card?.def??0,
  dead:g.players[1-seat].field[0]===null,opponentLP:10000-g.players[1-seat].lp,
  ownLP:10000-g.players[seat].lp,
  research:g.strategicTraining?.predatorArmorPierce??null};
}
function run(seat,defRole,attackerRole='predator',variant='live',pack=1,defMode='def'){
 return boot({seed:14990422}).run('('+probe.toString()+')('+
  [seat,defRole,attackerRole,variant,pack,defMode].map(x=>JSON.stringify(x)).join(',')+')');
}
test('live Predator ignores 10 percentage points of Guardian / Soul DEF armor; no extra LP damage',()=>{
 for(const seat of [0,1])for(const role of ['guardian','soul']){
  const live=run(seat,role),bare=run(seat,role,'predator','research-zero'),
   equivalent=run(seat,role,'predator','research-ten');
  assert.equal(live.atk,736);
  assert.equal(bare.atk,736);
  assert.equal(live.defLost,552,'25% remaining armor: 736 * .75');
  assert.equal(bare.defLost,478,'Without penetration: 736 * .65 floor');
  assert.equal(live.remaining,948);
  assert.equal(live.opponentLP,0);
  assert.deepEqual(live.defLost,equivalent.defLost);
 }
});
test('Predator defender has zero DEF armor, so penetration never amplifies raw attack',()=>{
 for(const seat of [0,1]){
  const unarmored=run(seat,'predator'),zero=run(seat,'predator','predator','research-zero');
  assert.equal(unarmored.defLost,unarmored.atk);
  assert.equal(unarmored.defLost,zero.defLost);
  assert.equal(unarmored.atk,736);
 }
});
test('Predator armor penetration is not granted to non-Predator attackers',()=>{
 for(const seat of [0,1])for(const role of ['guardian','soul']){
  const live=run(seat,role,'guardian'),research=run(seat,role,'guardian','research-zero');
  assert.equal(live.defLost,research.defLost);
  assert.equal(live.defLost,520,'Non-Predator 800 * .65');
 }
});
test('swarm + armor pierce stacks only once; same results on both seats',()=>{
 for(const role of ['guardian','soul']){
  for(const count of [1,2,3,4,5]){
   const a=run(0,role,'predator','live',count);
   const b=run(1,role,'predator','live',count);
   assert.equal(a.atk,Math.floor(800*(.9+count*.02)));
   assert.equal(a.defLost,Math.floor(a.atk*.75));
   assert.equal(a.defLost,b.defLost);
  }
 }
});
