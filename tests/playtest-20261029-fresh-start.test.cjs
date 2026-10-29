'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');

test('brand new save: ordinary Lv1 materials cannot access exclusive Lv1 fusion, but a Lv2 blueprint can be selected',()=>{
 const r=boot({seed:20261029}).run(`(()=>{
  profile=freshProfile();const g=createGame({id:'new-save-lv1',mode:'pve',context:'free',opponentId:1,seed:201});
  g.active=0;g.turn=4;const p=g.players[0],normal=RPG_BASE_CARDS.find(c=>c.level===1&&!c.fusionOnly&&!c.ace&&!c.retired);
  const mats=[newInstance(g,normal.id,0),newInstance(g,normal.id,0)];
  const options=fusionOptions(g,[1,1],mats),exclusive=options.filter(c=>c.level===1||c.lv1Exclusive);
  const allowed=options.filter(c=>c.level===2);
  return {quest:profile.lv1Saga?.perk===true,blocked:exclusive.length,canLevel2:allowed.length>0,choices:options.map(c=>c.level)};
 })()`);
 assert.equal(r.quest,false);assert.equal(r.blocked,0);
 assert.equal(r.canLevel2,true,'two Lv1 creatures should expose a regular Lv2 fusion in the starter game');
});

test('empty fusion deck still allows the hand-discard route without material loss before confirmation',()=>{
 const r=boot({seed:20261030}).run(`(()=>{
  profile=freshProfile();game=createGame({id:'no-fusion-discard',mode:'pve',context:'free',opponentId:1,seed:202});
  uiMode='duel';game.active=0;game.turn=4;game.pending=null;game.summoned=false;
  const g=game,p=g.players[0],before=p.hand.map(c=>c.uid),uids=before.slice(0,3);
  p.remainingFusion=[];g.materials=[...uids];render();
  const label=$('summonStage').innerHTML;
  const offered=label.includes('data-ad207-mode="discard"');
  const noOptions=fusionOptions(g,uids.map(uid=>dataOf(p.hand.find(c=>c.uid===uid)).level)).length===0;
  const unconsumed=p.graveyard.length===0&&p.hand.length===before.length;
  const ready=prepareNormal(g,uids[0]);
  if(ready)g.pending.discardUids=uids.slice(1);
  const committed=ready?placePending(g,0):null;
  return {offered,noOptions,unconsumed,committed:!!committed,grave:p.graveyard.length,
    keptOnField:p.field[0]?.uid===uids[0],keptOther:p.hand.length===before.length-3};
 })()`);
 assert.deepEqual(r,{offered:true,noOptions:true,unconsumed:true,committed:true,grave:2,keptOnField:true,keptOther:true});
});

test('Lv1 research stays inaccessible before unlocking its perk, even if a template is injected',()=>{
 const r=boot({seed:20261031}).run(`(()=>{
  profile=freshProfile();const g=createGame({mode:'pve',context:'free',opponentId:1,seed:203});
  g.active=0;g.turn=4;const special=window.ArcaneLv1Swarm.ids.hive;
  const id=RPG_BASE_CARDS.find(c=>c.level===1&&!c.fusionOnly&&!c.ace&&!c.retired).id;
  const mats=[0,1,2].map(()=>newInstance(g,id,0));g.players[0].remainingFusion.push(special);
  const blocked=!fusionOptions(g,[1,1,1],mats).some(c=>c.id===special);
  profile.lv1Saga.perk=true;
  const unlocked=fusionOptions(g,[1,1,1],mats).some(c=>c.id===special);
  return {blocked,unlocked};
 })()`);
 assert.deepEqual(r,{blocked:true,unlocked:true});
});
