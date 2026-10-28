'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {boot,repo}=require('./helpers/game-runtime.cjs');
const read=name=>fs.readFileSync(require('node:path').join(repo,name),'utf8');

test('ACE cannot be consumed by field or hand fusion, and AI chooses an empty zone',()=>{
 const b=boot({seed:230});
 const result=b.run(`(()=>{
  const g=createGame({mode:'pve',opponentId:3,seed:22});
  g.active=1;g.summoned=false;g.pending=null;
  const aceTemplate=CARDS.find(c=>c.ace),ace=newInstance(g,aceTemplate.id,1);
  const material=newInstance(g,RPG_BASE_CARDS.find(c=>!c.ace&&c.level===2).id,1);
  const fieldFusion=fusedInstance(g,[ace,material],[dataOf(ace).level,dataOf(material).level]);
  g.players[1].field=[ace,null,null,null,null];
  g.players[1].hand.push(material);
  g.pending={kind:'normal',card:material,levels:[dataOf(material).level]};
  const placed=applyAiAction(g,{type:'place',idx:0});
  return {fieldFusion:fieldFusion===null,aceStayed:g.players[1].field[0]?.uid===ace.uid,
   usedEmpty:g.players[1].field[1]?.uid===material.uid,placed:!!placed};
 })()`);
 assert.deepEqual(result,{fieldFusion:true,aceStayed:true,usedEmpty:true,placed:true});
});

test('Dropladungen first unlock with the first autofarm opponent and survive profile import',()=>{
 const b=boot({seed:240});
 const result=b.run(`(()=>{
  profile=freshProfile();profile.trainingWins=3;profile.mastery[0]=2;
  const locked=dropChargesUnlocked(),first=createGame({id:'ux203-unlock-1',mode:'pve',context:'free',opponentId:0,seed:44});
  first.winner=0;const reward=rewardMatch(first);
  const exported=validateProfile(JSON.parse(JSON.stringify(profile)));
  return {locked,unlocked:dropChargesUnlocked(),charge:profile.dropCharges,
   resultCharge:reward.charge,popupQueued:exported.dropChargeIntroPending};
 })()`);
 assert.deepEqual(result,{locked:false,unlocked:true,charge:1,resultCharge:1,popupQueued:true});
});

test('duel controls, staggered hand draws and cinematic victory are connected',()=>{
 const game=read('assets/game.js'),draw=read('assets/hand-draw-v1161.js');
 const result=read('assets/duel-polish-v197.js'),ux=read('assets/duel-ux-v203.js');
 const index=read('index.html');
 assert.match(game,/else if\(key==='d'\)switchMode\(\)/);
 assert.match(game,/else if\(key==='a'.*performAttack/);
 assert.match(ux,/event\.key\.toLowerCase\(\)!=='h'/);
 assert.match(draw,/i\*440\+'ms'/);
 assert.doesNotMatch(result,/if\(game\?\.finishShown&&!wasShown\)void blackout/);
 assert.match(result,/Sieg.*Niederlage/);
 assert.match(index,/duel-ux-v203\.js/);
 assert.match(index,/duel-ux-v203\.css/);
});
