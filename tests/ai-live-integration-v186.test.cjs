'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {boot}=require('./helpers/game-runtime.cjs');
test('v18.6 agent loads last; only authentic engine combat and public-board cloning',()=>{
 const index=fs.readFileSync('index.html','utf8'),js=fs.readFileSync('assets/ai-production-bridge-v186.js','utf8');
 assert.equal(index.split('assets/ai-production-bridge-v186.js').length,2);
 assert.ok(index.indexOf('assets/ai-production-bridge-v186.js')>index.indexOf('assets/fusion-guide-v213.js'));
 assert.match(js,/ArcaneAiBranches59\.publicState/);
 assert.match(js,/applyAiAction\(state,action\)/);
 assert.match(js,/!g\.strategicTraining/);
 assert.doesNotMatch(js,/researchSoulAction|symmetricSides:true|soul-raid|soul-discharge/);
});
test('live hook is active for eligible Solo monsters and excludes PvP, beginner and training',()=>{
 const result=boot({seed:186100}).run("(()=>{const v=window.ArcaneAiProduction186,g=createGame({mode:'pve',opponentId:7,seed:186100}),id=CARDS.find(c=>c.rpg&&c.role==='guardian'&&!c.fusionOnly&&!c.ace&&!c.essenceMonster).id;g.active=1;g.turn=4;g.aiPhase='attacks';g.players[1].field[0]=newInstance(g,id,1);const live=v.supported(g);v.setEnabled(false);const disabled=v.supported(g);v.setEnabled(true);return {version:v.version,live,disabled,pvp:v.supported({...g,mode:'pvp'}),early:v.supported({...g,opponentId:1}),training:v.supported({...g,strategicTraining:{enabled:true}})};})()");
 assert.equal(result.version,'18.6-live.1');
 assert.deepEqual(result,{version:'18.6-live.1',live:true,disabled:false,pvp:false,early:false,training:false});
});
test('real Solo finisher preview executes only on clone and does not mutate actual duel',()=>{
 const result=boot({seed:186101}).run("(()=>{const g=createGame({mode:'pve',opponentId:7,seed:186101}),c=CARDS.find(c=>c.rpg&&c.role==='guardian'&&!c.fusionOnly&&!c.ace&&!c.essenceMonster);g.players[1].field.fill(null);const a=newInstance(g,c.id,1);a.mode='atk';a.card.atk=5000;g.players[1].field[0]=a;g.players[0].field.fill(null);g.players[0].lp=500;g.active=1;g.turn=4;g.aiPhase='attacks';g.pending=null;const before=JSON.stringify(g),choice=window.ArcaneAiProduction186.plan(g,{type:'end'}),unchanged=JSON.stringify(g)===before,action=choice?.action||null,applied=action?!!applyAiAction(g,action):false;return {unchanged,action,applied,winner:g.winner};})()");
 assert.equal(result.unchanged,true);
 assert.equal(result.action?.type,'attack');assert.equal(result.action?.di,null);
 assert.equal(result.applied,true);assert.equal(result.winner,1);
});
test('preview never touches hidden human hand or deck',()=>{
 const result=boot({seed:186102}).run("(()=>{const g=createGame({mode:'pve',opponentId:8,seed:186102}),c=CARDS.find(c=>c.rpg&&c.role==='soul'&&!c.fusionOnly&&!c.ace&&!c.essenceMonster);g.players[1].field.fill(null);const a=newInstance(g,c.id,1);a.mode='atk';a.card.atk=5000;g.players[1].field[0]=a;g.players[0].field.fill(null);g.players[0].lp=500;g.active=1;g.turn=4;g.aiPhase='attacks';g.pending=null;let touched=false;for(const key of ['hand','deck'])Object.defineProperty(g.players[0],key,{get(){touched=true;throw Error('hidden-player-information')}});let action=null,error=null;try{action=window.ArcaneAiProduction186.plan(g,{type:'end'})?.action||null;}catch(e){error=e.message;}return {touched,action,error};})()");
 assert.equal(result.touched,false);assert.equal(result.error,null);
 assert.equal(result.action?.type,'attack');
});
