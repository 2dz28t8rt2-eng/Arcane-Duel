'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {plannerSource}=require('./helpers/ai-v1920-mechanics.cjs');
const fn=new Function('game','g','learner','scene','counter','baseChoose','baseApply','policy','canAttack','window','dataOf','role',plannerSource);
const sc=role=>({studyStage:8,candidateRole:role,rolePolicy:{defenderTacticalOverride:true}});
const window={ArcaneEssenceCombat:{soulBonds:()=>[]}},data=c=>({atk:c.atk,def:c.def}),role=c=>c.role;
test('v18.9 regression: do not trade planned Soul discharge for resource-only raid',()=>{
 const g={active:0,turn:10,winner:null,pending:null,aiPhase:'attacks',strategicTraining:{symmetricSides:true},players:[
 {lp:954,shield:0,field:[{uid:33,role:'soul',mode:'def',atk:15,def:100,essenceCombat:{soul:80,lastSoulAction:9,lastDischarge:9,raidCooldown:0}}]},
 {lp:979,shield:0,field:[{uid:30,role:'fusion',card:{id:30},mode:'def',atk:180,def:120}]}]};
 const old=JSON.stringify(g),c={};
 const a=fn(g,g,0,sc('soul'),c,()=>({type:'soul-discharge',idx:0}),(z,m)=>{
  if(m.type==='soul-discharge'){z.players[1].lp-=5;return true;}
  if(m.type==='soul-raid'){z.players[1].field[0].atk=0;z.players[0].field[0].essenceCombat.soul+=600;return true;}
  return false;
 },'balanced',()=>false,window,data,role);
 assert.equal(a,undefined);assert.ok(c.v1920SoulRaidFiltered>0);
 assert.equal(c.v1920TacticalOverrides||0,0);assert.equal(JSON.stringify(g),old);
});
test('v19.0 regression: allow verified attack instead of Soul discharge',()=>{
 const g={active:0,turn:13,winner:null,pending:null,aiPhase:'attacks',strategicTraining:{symmetricSides:true},players:[
 {lp:650,shield:0,field:[{uid:10,role:'soul',mode:'def',atk:30,def:80,essenceCombat:{soul:80,lastSoulAction:12,lastDischarge:12,raidCooldown:0}},
 {uid:11,role:'guardian',mode:'atk',atk:800,def:200,attacked:false}]},
 {lp:850,shield:0,field:[{uid:20,role:'fusion',card:{id:20},mode:'atk',atk:350,def:120}]}]};
 const old=JSON.stringify(g),c={};
 const a=fn(g,g,0,sc('soul'),c,()=>({type:'soul-discharge',idx:0}),(z,m)=>{
  if(m.type==='soul-discharge'){z.players[1].lp-=2;return true;}
  if(m.type==='soul-raid'){z.players[0].field[0].essenceCombat.soul+=600;return true;}
  if(m.type==='attack'&&m.ai===1&&m.di===0){z.players[1].field[0]=null;return true;}
  return false;
 },'balanced',(z,card)=>card.mode==='atk'&&!card.attacked,window,data,role);
 assert.deepEqual(a,{type:'attack',ai:1,di:0});assert.ok(c.v1920TacticalOverrides>0);assert.equal(JSON.stringify(g),old);
});
test('new bounded three-action search verifies a 3900 LP win',()=>{
 const g={active:0,turn:8,winner:null,pending:null,aiPhase:'attacks',players:[
 {lp:5000,shield:0,field:[0,1,2].map(i=>({uid:i+1,role:'guardian',mode:'atk',atk:1300,def:200,attacked:false}))},
 {lp:3900,shield:0,field:[]}]},old=JSON.stringify(g),c={};
 const a=fn(g,g,0,sc('guardian'),c,()=>({type:'end'}),(z,m)=>{
  if(m.type!=='attack')return false;const card=z.players[0].field[m.ai];if(!card||card.attacked)return false;
  card.attacked=true;z.players[1].lp=Math.max(0,z.players[1].lp-card.atk);
  if(z.players[1].lp===0)z.winner=0;return true;
 },'balanced',(z,card)=>!card.attacked,window,data,role);
 assert.equal(a?.type,'attack');assert.ok(c.v1920ThreeActionFinders>0);assert.equal(JSON.stringify(g),old);
});
test('no invented enemy turn or fabricated hidden response',()=>{
 assert.doesNotMatch(plannerSource,/response.active=op|follow.active=opp/);
 assert.match(plannerSource,/baseApply\(z,move\)/);
});

test('v19.2 observed opponent attack-mode board penalizes exposed LP only',()=>{
 const c={};
 const make=(attackMode)=>({active:0,turn:6,winner:null,pending:null,aiPhase:'attacks',players:[
  {lp:700,shield:0,field:[{uid:1,role:'guardian',mode:'atk',atk:100,def:80,attacked:false}]},
  {lp:800,shield:0,field:[{uid:2,role:'predator',mode:attackMode,atk:1000,def:100}]}
 ]});
 const g=make('atk'),old=JSON.stringify(g);
 const choose=()=>({type:'attack',ai:0,di:0});
 fn(g,g,0,sc('guardian'),c,choose,(z,m)=>{
  if(m.type!=='attack')return false;
  if(m.di===0){z.players[0].field[0]=null;z.players[1].field[0].atk=800;return true;}
  return false;
 },'balanced',(z,card)=>!card.attacked,window,data,role);
 assert.ok(c.v1920VisibleThreatChecks>0);
 assert.ok(c.v1920ExposedThreatPenalty>0);
 assert.equal(JSON.stringify(g),old);
 const d={};const safe=make('def');
 fn(safe,safe,0,sc('guardian'),d,choose,(z,m)=>{
  if(m.type!=='attack'||m.di!==0)return false;
  z.players[0].field[0]=null;z.players[1].field[0].atk=800;return true;
 },'balanced',(z,card)=>!card.attacked,window,data,role);
 assert.ok(d.v1920VisibleThreatChecks>0);
 assert.equal(d.v1920ExposedThreatPenalty||0,0);
});
test('v19.2 never accesses opponent hand or deck when estimating visible threats',()=>{
 assert.doesNotMatch(plannerSource,/foe\.hand|foe\.deck|st\.players\[op\]\.hand|st\.players\[op\]\.deck/);
 assert.match(plannerSource,/const visibleExposure=st=>/);
});
