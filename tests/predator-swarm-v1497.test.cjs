'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
function probe(count,seat,percent=.02,override=false,attackRole='predator'){
 profile=freshProfile();profile.guideSeen=true;
 for(const k of Object.keys(profile.upgrades||{}))profile.upgrades[k]=0;
 const opts={mode:'pve',context:'free',seed:1497100,starter:0,
  strategicTraining:{enabled:true,symmetricSides:true,noAttackTurns:0,
   disableArenaLPDecay:true,predatorSwarmPercent:percent}};
 const g=createGame(opts);g.turn=12;g.active=seat;g.fateUsed=[true,true];
 const pred=CARDS.find(c=>c.role==='predator'&&!c.fusionOnly&&!c.essenceMonster&&c.level>=3);
 const guard=CARDS.find(c=>c.role==='guardian'&&!c.fusionOnly&&!c.essenceMonster&&c.level>=3);
 if(!pred||!guard)throw Error('Role cards not found');
 const a=newInstance(g,attackRole==='predator'?pred.id:guard.id,seat);
 a.card.atk=1000;a.mode='atk';
 if(override){a.roleOverride='predator';a.fusion=true;} // Actual role-inherited Predator Fusion, not a normal card
 const owner=g.players[seat];owner.field=[a,null,null,null,null];
 for(let i=1;i<count;i++){
  const add=newInstance(g,pred.id,seat);add.card.atk=1000;
  add.mode=i%2===0?'atk':'def';owner.field[i]=add;
 }
 const attacking=effectiveAttack(g,a,null);
 const opponent=g.players[1-seat];
 opponent.shield=0;opponent.lp=10000;opponent.field=[null,null,null,null,null];
 const hit=attack(g,0,null);
 if(!hit)throw Error('Attack failed');
 return {attack:attacking,lpDamage:10000-opponent.lp,sourceCount:owner.field.filter(c=>c&&
   (c.roleOverride||CARDS[c.id].role)==='predator').length,
   sourceRole:a.roleOverride||CARDS[a.id].role};
}
function run(n,s,p=.02,f=false,r='predator'){
 return boot({seed:1497100}).run('('+probe.toString()+')('+
  [JSON.stringify(n),JSON.stringify(s),JSON.stringify(p),JSON.stringify(f),JSON.stringify(r)].join(',')+')');
}
test('each own deployed predator adds 2% actual attack damage, self included, 1-5',()=>{
 for(let count=1;count<=5;count++){
  const base=run(count,0,0),x=run(count,0),y=run(count,1);
  // Independent role/surge effects may also apply. Measure only marginal buff.
  assert.ok(x.attack>base.attack,JSON.stringify({count,base,x}));
  assert.ok(Math.abs(x.attack-(base.attack+1000*count*.02))<=2,
   JSON.stringify({count,base,x}));
  assert.equal(x.lpDamage,x.attack);
  assert.deepEqual(x,y,'Owner-seat asymmetry at '+count);
 }
});
test('no bonus for other roles or with research switch disabled',()=>{
 const nonPred=run(5,0,.02,false,'guardian'),
   base=run(5,0,0,false,'guardian');
 assert.equal(nonPred.attack,base.attack,
  'Non-Predator attacks must not inherit the swarm bonus');
 assert.equal(run(5,0,0).lpDamage,run(5,0,0).attack);
});
test('fusion roleOverride predators also receive the swarm bonus',()=>{
 const base=run(3,0,0,true,'guardian'),p=run(3,0,.02,true,'guardian');
 assert.ok(Math.abs(p.attack-base.attack*1.06)<=2,JSON.stringify({base,p}));
 assert.equal(p.sourceCount,3);
});
test('the normal PvE game never enables this research rule automatically',()=>{
 const s=boot({seed:1497100}).run('(()=>{profile=freshProfile();const a=createGame({mode:"pve",seed:1497100});const b=createGame({mode:"pve",seed:1497100,strategicTraining:{enabled:false,symmetricSides:true,noAttackTurns:0,predatorSwarmPercent:.02}});return {a:a.strategicTraining||null,b:b.strategicTraining||null};})()');
 assert.deepEqual(s,{a:null,b:null});
});
