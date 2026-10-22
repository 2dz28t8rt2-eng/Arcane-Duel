'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
function probe(mode,owner,count,attackRole='predator',enemyPredators=0,override=false){
 profile=freshProfile();profile.guideSeen=true;
 for(const key of Object.keys(profile.upgrades||{}))profile.upgrades[key]=0;
 const g=createGame({mode,context:'free',seed:14981571,starter:0});
 g.turn=12;g.active=owner;g.fateUsed=[true,true];
 if(g.strategicTraining)throw Error('Normal match unexpectedly has research settings');
 const predator=CARDS.find(c=>c.role==='predator'&&!c.fusionOnly&&!c.essenceMonster&&c.level>=3);
 const guardian=CARDS.find(c=>c.role==='guardian'&&!c.fusionOnly&&!c.essenceMonster&&c.level>=3);
 if(!predator||!guardian)throw Error('Catalog incomplete');
 for(const p of g.players){p.shield=0;p.power=1;p.flatBonus=0;p.enhancements={};
  p.field=[null,null,null,null,null];p.lp=10000;}
 const team=g.players[owner],enemy=g.players[1-owner];
 const first=newInstance(g,attackRole==='predator'?predator.id:guardian.id,owner);
 first.card.atk=1000;first.mode='atk';
 if(override){first.roleOverride='predator';first.fusion=true;}
 team.field[0]=first;
 for(let i=1;i<count;i++){
  const ally=newInstance(g,predator.id,owner);ally.mode='def';team.field[i]=ally;
 }
 for(let i=0;i<enemyPredators;i++){
  const rival=newInstance(g,predator.id,1-owner);rival.mode='def';enemy.field[i]=rival;
 }
 const outgoing=effectiveAttack(g,first,null);
 let directDamage=null;
 if(enemyPredators===0){
  const success=attack(g,0,null);if(!success)throw Error('Legal direct attack failed');
  directDamage=10000-enemy.lp;
 }
 return {outgoing,directDamage,ownerPredators:team.field.filter(c=>c&&
  (c.roleOverride||CARDS[c.id].role)==='predator').length,
  enemyPredators:enemy.field.filter(c=>c&&CARDS[c.id].role==='predator').length,
  cardAtk:first.card.atk,mode:g.mode,sourceRole:first.roleOverride||CARDS[first.id].role};
}
function run(mode,owner,count,attackRole='predator',enemyPredators=0,override=false){
 const args=[mode,owner,count,attackRole,enemyPredators,override].map(x=>JSON.stringify(x)).join(',');
 return boot({seed:14981571}).run('('+probe.toString()+')('+args+')');
}
test('live PvE and PvP: predator swarm grows by 2% each own deployed Predator',()=>{
 for(const mode of ['pve','pvp'])for(const owner of [0,1]){
  const first=run(mode,owner,1);
  assert.equal(first.ownerPredators,1);
  const normalized=first.outgoing/1.02;
  for(let count=1;count<=5;count++){
   const sample=run(mode,owner,count);
   const expected=normalized*(1+count*.02);
   assert.ok(Math.abs(sample.outgoing-expected)<=2,
    JSON.stringify({mode,owner,count,expected,sample,first}));
   assert.equal(sample.directDamage,sample.outgoing,'Live direct LP hit must respect swarm damage');
  }
  const five=run(mode,owner,5),other=run(mode,1-owner,5);
  assert.equal(five.outgoing,other.outgoing,'Swarm attack should be independent of seat with neutral upgrades');
 }
});
test('live roles: non-Predator attackers never gain the Predator swarm',()=>{
 for(const mode of ['pve','pvp'])for(const owner of [0,1]){
  const first=run(mode,owner,1,'guardian');
  const packed=run(mode,owner,5,'guardian');
  assert.equal(packed.outgoing,first.outgoing);
  assert.equal(packed.directDamage,first.directDamage);
 }
});
test('only own Predator slots count; enemy predators do not boost outgoing attack',()=>{
 for(const mode of ['pve','pvp'])for(const owner of [0,1]){
  const solo=run(mode,owner,1);
  const enemies=run(mode,owner,1,'predator',4);
  assert.equal(enemies.outgoing,solo.outgoing);
  assert.equal(enemies.enemyPredators,4);
 }
});
test('live Predator-role fusion imprint counts in swarm and gains outgoing bonus',()=>{
 for(const mode of ['pve','pvp'])for(const owner of [0,1]){
  const solo=run(mode,owner,1,'guardian',0,true);
  const trio=run(mode,owner,3,'guardian',0,true);
  assert.equal(solo.sourceRole,'predator');
  assert.equal(trio.ownerPredators,3);
  assert.ok(Math.abs(trio.outgoing-solo.outgoing/1.02*1.06)<=2);
 }
});
test('research control without swarm retains opt-out for honest balance comparisons',()=>{
 const result=boot({seed:14981571}).run('(()=>{profile=freshProfile();const a=createGame({mode:"pve",seed:14981571,strategicTraining:{enabled:true,symmetricSides:true,noAttackTurns:0,disableArenaLPDecay:true,predatorSwarmPercent:0}});return a.strategicTraining.predatorSwarmPercent;})()');
 assert.equal(result,0);
});
