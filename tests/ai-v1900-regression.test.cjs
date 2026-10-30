'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {plannerSource}=require('./helpers/ai-v1900-mechanics.cjs');
const fn=new Function('game','g','learner','scene','counter','baseChoose','baseApply','policy','canAttack','window','dataOf','role',plannerSource);
test('preserve legal Soul discharge over a nonlethal Soul raid',()=>{
 const g={active:0,turn:10,winner:null,pending:null,aiPhase:'attacks',strategicTraining:{symmetricSides:true},
 players:[
  {lp:954,shield:0,field:[{uid:33,role:'soul',mode:'def',atk:15,def:100,essenceCombat:{soul:80,raidCooldown:0,lastSoulAction:9,lastDischarge:9}}]},
  {lp:979,shield:0,field:[{uid:30,role:'fusion',card:{id:30},mode:'def',atk:180,def:120}]}
 ]},old=JSON.stringify(g),counter={};
 const outcome=fn(g,g,0,{studyStage:8,candidateRole:'soul',rolePolicy:{defenderTacticalOverride:true}},
 counter,()=>({type:'soul-discharge',idx:0}),(z,a)=>{
  if(a.type==='soul-discharge'){z.players[1].lp-=5;return true;}
  if(a.type==='soul-raid'){z.players[1].field[0].atk=0;z.players[0].field[0].essenceCombat.soul+=600;return true;}
  return false;
 },'balanced',()=>false,{ArcaneEssenceCombat:{soulBonds:()=>[]}},x=>({atk:x.atk,def:x.def}),x=>x.role);
 assert.equal(outcome,undefined);
 assert.equal(counter.v1900SoulDischargeProtected,1);
 assert.equal(counter.v1900TacticalOverrides||0,0);
 assert.equal(JSON.stringify(g),old);
});
test('retain engine-verified immediate end-turn rescue',()=>{
 const g={active:0,turn:1,winner:null,pending:null,aiPhase:'attacks',players:[
  {lp:1000,shield:0,field:[{uid:1,role:'guardian',mode:'atk',atk:900,def:150,attacked:false}]},
  {lp:500,shield:0,field:[]}]},old=JSON.stringify(g),c={};
 const a=fn(g,g,0,{studyStage:8,candidateRole:'guardian',rolePolicy:{defenderTacticalOverride:true}},
 c,()=>({type:'end'}),(z,move)=>{
  if(move.type!=='attack'||z.players[0].field[move.ai].attacked)return false;
  z.players[0].field[move.ai].attacked=true;z.players[1].lp=Math.max(0,z.players[1].lp-900);
  if(z.players[1].lp===0)z.winner=0;return true;
 },'balanced',(z,card)=>!card.attacked,{ArcaneEssenceCombat:{soulBonds:()=>[]}},x=>({atk:x.atk,def:x.def}),x=>x.role);
 assert.deepEqual(a,{type:'attack',ai:0,di:null});
 assert.equal(c.v1900EndTurnRescues,1);
 assert.equal(JSON.stringify(g),old);
});
