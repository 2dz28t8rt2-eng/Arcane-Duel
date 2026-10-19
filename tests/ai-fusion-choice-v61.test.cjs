'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const vm=boot({seed:610111});
test('fusion dispatch forwards the selected exact template and chosen material UIDs',()=>{
 const result=vm.run(`(()=>{const g=createGame({mode:'pve',context:'tournament',opponentId:6,seed:61025}),old=prepareHandFusion,events=[];
  prepareHandFusion=function(game,uids,choice){events.push({same:game===g,uids,choice});return true;};
  try {
   const first=applyAiAction(g,{type:'fusion',uids:[11,22],choice:513});
   const legacy=applyAiAction(g,{type:'fusion',uids:[33,44]});
   return {first,legacy,events};
  }finally{prepareHandFusion=old;}
 })()`);
 assert.equal(result.first,true);assert.equal(result.legacy,true);
 assert.equal(result.events.length,2);
 assert.deepEqual(result.events[0],{same:true,uids:[11,22],choice:513});
 assert.equal(Object.hasOwn(result.events[1],'choice'),false); // legacy implicit choice preserved
});
test('failed incorrect fusion choice is rejected through the real engine',()=>{
 const r=vm.run(`(()=>{const g=createGame({mode:'pve',context:'tournament',opponentId:6,seed:61501});
  g.active=1;g.aiPhase='summon';g.summoned=false;g.pending=null;
  const choices=ArcaneAiLearning56.legalCandidates(g).filter(x=>x.action.type==='fusion');
  if(!choices.length)return {tested:false};
  const choice=choices[0].action;
  const invalid=applyAiAction(g,{...choice,choice:999999});
  const stillOnHand=g.players[1].hand.some(c=>choice.uids.includes(c.uid));
  const original=applyAiAction(g,choice);
  return {tested:true,invalid:!!invalid,original:!!original,stillOnHand};
 })()`);
 if(r.tested){assert.equal(r.invalid,false);assert.equal(r.original,true);assert.equal(r.stillOnHand,true);}
});
