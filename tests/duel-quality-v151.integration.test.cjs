'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

// Runs against the actual game runtime in CI, not against copied damage rules.
const helper=path.join(__dirname,'helpers/game-runtime.cjs');
if(!fs.existsSync(helper)){
  test('integration suite requires checked-out repository runtime', {skip:true},()=>{});
}else{
  const {boot}=require(helper);
  const run=code=>boot({seed:151002}).run(code);

  test('real ATK-vs-ATK attack outcome agrees with read-only combat preview',()=>{
    const result=run("(()=>{const g=createGame({mode:'pve',opponentId:2,seed:15101});g.active=0;g.turn=3;g.pending=null;g.summoned=false;const attacker=CARDS.find(c=>c.rpg&&!c.fusionOnly&&c.level>=2&&!c.ace);const defender=CARDS.find(c=>c.rpg&&!c.fusionOnly&&c.level>=2&&c.id!==attacker.id&&!c.ace);if(!attacker||!defender)throw Error('catalog');const a=newInstance(g,attacker.id,0),d=newInstance(g,defender.id,1);a.mode='atk';d.mode='atk';a.card.atk=840;d.card.atk=650;g.players[0].field=[a,null,null,null,null];g.players[1].field=[d,null,null,null,null];g.players[0].shield=0;g.players[1].shield=0;const before=JSON.stringify(g),lp0=g.players[0].lp,lp1=g.players[1].lp,f=window.ArcaneDuelQuality151.combatForecast(g,0,0),pure=JSON.stringify(g)===before;const outcome=attack(g,0,0);return {f,pure,used:!!outcome,ownLoss:lp0-g.players[0].lp,foeLoss:lp1-g.players[1].lp,destroyAttacker:!g.players[0].field[0],destroyDefender:!g.players[1].field[0]};})()");
    assert.equal(result.pure,true);
    assert.equal(result.used,true);
    assert.equal(result.f.allowed,true);
    assert.equal(result.f.ownLoss,result.ownLoss);
    assert.equal(result.f.enemyLoss,result.foeLoss);
    assert.equal(result.f.destroyAttacker,result.destroyAttacker);
    assert.equal(result.f.destroyDefender,result.destroyDefender);
  });

  test('real predator versus guardian DEF reproduces armor/piercing, counter and shield',()=>{
    const result=run("(()=>{const g=createGame({mode:'pve',opponentId:2,seed:15102});g.active=0;g.turn=3;g.pending=null;const predator=CARDS.find(c=>c.rpg&&!c.fusionOnly&&c.role==='predator'&&!c.ace),guardian=CARDS.find(c=>c.rpg&&!c.fusionOnly&&c.role==='guardian'&&!c.ace);if(!predator||!guardian)throw Error('missing roles');const a=newInstance(g,predator.id,0),d=newInstance(g,guardian.id,1);a.mode='atk';d.mode='def';a.card.atk=900;d.card.atk=150;d.card.def=900;g.players[0].field=[a,null,null,null,null];g.players[1].field=[d,null,null,null,null];g.players[0].shield=45;g.players[1].shield=0;g.essenceRules=true;const b=JSON.stringify(g),own=g.players[0].lp,foe=g.players[1].lp,f=window.ArcaneDuelQuality151.combatForecast(g,0,0),pure=JSON.stringify(g)===b;const answer=attack(g,0,0);return {f,pure,used:!!answer,ownLoss:own-g.players[0].lp,foeLoss:foe-g.players[1].lp,defAfter:g.players[1].field[0]?.card?.def??0,defBefore:900};})()");
    assert.equal(result.pure,true);
    assert.equal(result.used,true);
    assert.equal(result.f.ownLoss,result.ownLoss);
    assert.equal(result.f.enemyLoss,result.foeLoss);
    assert.equal(result.f.remainingDefense,result.defAfter);
    assert.ok(result.f.prevented>0);
  });

  test('full fusion poker pattern retains a three-card subset street even with duplicate Lv1 materials',()=>{
    const result=run("(()=>{const g=createGame({mode:'pve',opponentId:2,seed:15103});g.active=0;const m=[1,2,3,1,1].map(l=>({id:RPG_BASE_CARDS[0].id,card:{level:l}}));const info=window.ArcaneDuelQuality151.fusionExplanation(g,m);return {pattern:window.ArcaneFusionMath.pattern([1,2,3,1,1]).name,info};})()");
    assert.match(result.pattern,/Straße/);
    assert.equal(result.info.partialStreet,true);
    assert.equal(result.info.closedStreet,false);
  });
}
