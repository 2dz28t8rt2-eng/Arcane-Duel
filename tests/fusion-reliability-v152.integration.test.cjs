'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const helper=path.join(__dirname,'helpers/game-runtime.cjs');
if(!fs.existsSync(helper)){
  test('Fusion regression requires the checked-out Arcane Duel runtime', {skip:true},()=>{});
}else{
  const {boot}=require(helper);
  const run=source=>boot({seed:152025}).run(source);

  test('poker recognition is selection-order independent, even with duplicate extras',()=>{
    const data=run("(()=>{const levels=[1,2,3,1,1];const a=window.ArcaneFusionMath.pattern(levels);const b=window.ArcaneFusionMath.pattern([...levels].reverse());const g=createGame({mode:'pve',opponentId:2,seed:1521});return {a:a.name,b:b.name,capA:fusionBudget(levels,g),capB:fusionBudget([...levels].reverse(),g),rule:window.ArcaneFusionRework113.calculate(levels,g,[])};})()");
    assert.match(data.a,/Straße/);
    assert.equal(data.a,data.b);
    assert.equal(data.capA,data.capB);
    assert.equal(data.rule.street,false);
  });

  test('real five-material hand fusion consumes only selected material and creates a field monster',()=>{
    const data=run("(()=>{const g=createGame({mode:'pve',opponentId:2,seed:1522});g.active=0;g.turn=3;g.summoned=false;g.pending=null;const base=RPG_BASE_CARDS.find(c=>c.level===1&&!c.fusionOnly&&!c.ace);if(!base)throw Error('missing L1 source');const levels=[1,2,3,1,1],m=levels.map(l=>{const x=newInstance(g,base.id,0);x.card.level=l;return x;});const p=g.players[0];p.hand=[...m];p.field=[null,null,null,null,null];const options=fusionOptions(g,levels,m).filter(c=>canCompleteHandFusion(g,levels,c.id));if(!options.length)throw Error('no starter fusion option');const choice=options[0],used=new Set(m.map(c=>c.uid));const before=p.remainingFusion.length,success=prepareHandFusion(g,m.map(c=>c.uid),choice.id);if(!success)return {success};const pending=!!g.pending,cleared=p.hand.every(c=>!used.has(c.uid)),grave=p.graveyard.filter(c=>used.has(c.uid)).length;const result=placePending(g,0);return {success,pending,cleared,grave,placed:!!result,field:p.field[0]?.fusion===true,remaining:p.remainingFusion.length,before,materialLevels:levels,resultLevel:p.field[0]?.card?.level??null};})()");
    assert.equal(data.success,true);
    assert.equal(data.pending,true);
    assert.equal(data.cleared,true);
    assert.equal(data.grave,5);
    assert.equal(data.placed,true);
    assert.equal(data.field,true);
    assert.equal(data.remaining,data.before-1);
    assert.ok(data.resultLevel>=1);
  });

  test('field-chain fusion consumes field material and keeps previous attack spent until next turn',()=>{
    const data=run("(()=>{const g=createGame({mode:'pve',opponentId:2,seed:1523});g.active=0;g.turn=3;g.pending=null;g.summoned=false;const p=g.players[0],source=RPG_BASE_CARDS.find(c=>c.level===2&&!c.fusionOnly&&!c.ace)||RPG_BASE_CARDS.find(c=>!c.fusionOnly&&!c.ace);const old=newInstance(g,source.id,0),incoming=newInstance(g,source.id,0);old.mode='atk';old.attacked=true;p.field=[old,null,null,null,null];p.hand=[incoming];const choices=fusionOptions(g,[dataOf(incoming).level,dataOf(old).level],[incoming,old]);if(!choices.length)throw Error('no legal chain template');p.remainingFusion=[...p.remainingFusion,choices[0].id];const started=prepareNormal(g,incoming.uid),possible=fusionOptions(g,[...g.pending.levels,dataOf(old).level],[g.pending.card,old]),picked=possible.find(c=>p.remainingFusion.includes(c.id));if(!picked)throw Error('no legal field-chain choice');const result=placePending(g,0,picked.id);return {started,placed:!!result,fieldIsFusion:p.field[0]?.fusion===true,inheritAttack:p.field[0]?.attacked===true,graveHasOld:p.graveyard.some(c=>c.uid===old.uid),graveHasIncoming:p.graveyard.some(c=>c.uid===incoming.uid),pendingCleared:g.pending===null};})()");
    assert.equal(data.started,true);
    assert.equal(data.placed,true);
    assert.equal(data.fieldIsFusion,true);
    assert.equal(data.inheritAttack,true);
    assert.equal(data.graveHasOld,true);
    assert.equal(data.graveHasIncoming,true);
    assert.equal(data.pendingCleared,true);
  });
}
