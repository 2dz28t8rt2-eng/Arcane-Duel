'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
function setup(){const b=boot({seed:9811});b.exec("profile=freshProfile();profile.lv1Saga.perk=true;game=createGame({mode:'pve',opponentId:1,context:'free',seed:1234});game.active=0;game.turn=6;game.pending=null;game.winner=null;game.players.forEach(p=>p.field.fill(null));");return b;}
test('approved fusion artworks retain their final identity, correct templates and effect descriptions',()=>{
 const r=setup().run("Object.fromEntries(Object.entries(ArcaneLv1Swarm.ids).map(([role,id])=>[role,{name:CARDS[id].name,art:CARDS[id].art,atk:CARDS[id].atk,def:CARDS[id].def,desc:CARDS[id].desc}]))");
 for(const [role,expected]of Object.entries({hive:'Nekroth',protector:'Aegurion',attacker:'Nyxar',ace:'Lumira'})){
  assert.match(r[role].name,new RegExp(expected));assert.ok(role==='ace'?r[role].art.endsWith('lumira-angel-v49.webp'):r[role].art.endsWith('-illustration.webp'));
  assert.ok(r[role].desc.length>130,role);
 }
 assert.deepEqual([r.ace.atk,r.ace.def],[111,111]);
});
test('all subsequent research chapters require their own active mechanics, not just a win',()=>{
 const r=setup().run("(()=>{const f=ArcaneLv1Saga.mastered;const a=[2,3,4,5].map(stage=>({lv1Saga:{stage},lv1SagaProgress:{floating:0,swarm:0,special:0}}));const initial=a.map(f);a[0].lv1SagaProgress.floating=1;a[1].lv1SagaProgress.swarm=1;a[2].lv1SagaProgress.special=1;a[3].lv1SagaProgress={floating:1,swarm:1,special:1};return {initial,done:a.map(f)};})()");
 assert.deepEqual(r.initial,[false,false,false,false]);assert.deepEqual(r.done,[true,true,true,true]);
});
test('free Floating echo can be placed after ordinary summon was already consumed',()=>{
 const r=setup().run("(()=>{const id=RPG_BASE_CARDS.find(c=>c.level===1&&!c.ace&&!c.fusionOnly&&!c.retired).id;game.summoned=true;ArcaneLv1Swarm.offer(game,id,true);const claimed=ArcaneLv1Swarm.claimOffer(game,0);const placed=placePending(game,0);return {claimed,placed:!!placed,echo:game.players[0].field[0]?.lv1Effectless,spent:game.summoned,pending:game.pending===null};})()");
 assert.deepEqual(r,{claimed:true,placed:true,echo:true,spent:true,pending:true});
});
test('Protector redirects enemy attack and treats DEF as a damaged health pool',()=>{
 const r=setup().run("(()=>{const ids=ArcaneLv1Swarm.ids;const p=game.players[0],e=game.players[1];const protector=newInstance(game,ids.protector,0),minor=newInstance(game,RPG_BASE_CARDS.find(c=>c.level===1&&!c.fusionOnly&&!c.ace).id,0),enemy=newInstance(game,RPG_BASE_CARDS.find(c=>c.level===4&&!c.fusionOnly).id,1);protector.card.def=1800;enemy.card.atk=220;enemy.mode='atk';enemy.attacked=false;enemy.summonedTurn=1;p.field[0]=protector;p.field[1]=minor;e.field[0]=enemy;game.active=1;const before=protector.card.def;const result=attack(game,0,1);return {result:!!result,redirected:result?.di,protectorDamaged:protector.card.def<before,minorUnhurt:p.field[1]===minor};})()");
 assert.equal(r.result,true);assert.equal(r.redirected,0);assert.equal(r.protectorDamaged,true);assert.equal(r.minorUnhurt,true);
});
test('ghost-slot Lv1 creature can perform a true combat-engine direct attack',()=>{
 const r=setup().run("(()=>{const p=game.players[0],id=RPG_BASE_CARDS.find(c=>c.level===1&&!c.ace&&!c.fusionOnly).id;const c=newInstance(game,id,0);c.summonedTurn=1;const state=ArcaneLv1Swarm.state(game);state.ghostSlots=[{kind:'card',card:c}];const lp=game.players[1].lp,shield=game.players[1].shield;const ok=ArcaneLv1Swarm.ghostAttack(game,0,null);return {ok,damage:lp-game.players[1].lp+shield-game.players[1].shield,stillThere:state.ghostSlots[0]?.card===c,attacked:c.attacked,fieldClear:p.field.every(x=>!x)};})()");
 assert.equal(r.ok,true);assert.ok(r.damage>0);assert.equal(r.stillThere,true);assert.equal(r.attacked,true);assert.equal(r.fieldClear,true);
});
test('research story finale has a five-phase skippable reveal',()=>{
 const r=setup().run("(()=>{profile.lv1Saga={offered:true,met:true,stage:4,perk:false,story:[1,2,3,4],finalRewards:false,aceGranted:false};startDuel('pve',1,'lv1-saga','easy',5);game.lv1SagaProgress={floating:1,swarm:1,special:1};game.winner=0;showFinished();return {finished:profile.lv1Saga.stage,perk:profile.lv1Saga.perk,ace:profile.inventory[ArcaneLv1Swarm.ids.ace]};})()");
 assert.equal(r.finished,5);assert.equal(r.perk,true);assert.equal(r.ace,1);
});

test('all specialist fusions are genuine Lv1, contribute to Swarm and may occupy ghost slots',()=>{
 const r=setup().run("(()=>{const ids=ArcaneLv1Swarm.ids,k=['hive','protector','attacker'];const cards=k.map(key=>{const c=newInstance(game,ids[key],0);c.fusion=true;return c;});cards.forEach((c,i)=>game.players[0].field[i]=c);ArcaneLv1Swarm.syncSwarm(game);const s=ArcaneLv1Swarm.state(game);const statuses=cards.map(c=>({lv:CARDS[c.id].level,eligible:ArcaneLv1Swarm.isLv1(c),real:ArcaneLv1Swarm.isReal(c),slot:ArcaneLv1Swarm.stationable(c),bonus:c.lv1SwarmApplied}));const before=s.choices.length;ArcaneLv1Swarm.exitCard(game,cards[0]);return {statuses,avoidsCopy:s.choices.length===before,aceLv:CARDS[ids.ace].level};})()");
 assert.deepEqual(r.statuses.map(x=>x.lv),[1,1,1]);
 assert.ok(r.statuses.every(x=>x.eligible&&x.slot&&!x.real&&x.bonus===20));
 assert.equal(r.avoidsCopy,true);
 assert.equal(r.aceLv,1);
});

test('a Level-1 class fusion can be relocated from the ordinary field into a ghost slot',()=>{
 const r=setup().run("(()=>{const id=ArcaneLv1Swarm.ids.hive,c=newInstance(game,id,0),p=game.players[0],s=ArcaneLv1Swarm.state(game);c.fusion=true;p.field[0]=c;s.ghostSlots=[null];const moved=ArcaneLv1Swarm.station(game,0,'field',0);const canGrow=ArcaneLv1Swarm.counts(game)>0;return {moved,cleared:p.field[0]===null,card:s.ghostSlots[0]?.card?.id,canGrow};})()");
 assert.deepEqual(r,{moved:true,cleared:true,card:setup().run("ArcaneLv1Swarm.ids.hive"),canGrow:true});
});
test('Aegurion still redirects enemy attacks while occupying a ghost slot',()=>{
 const r=setup().run("(()=>{const ids=ArcaneLv1Swarm.ids,p=game.players[0],e=game.players[1],a=newInstance(game,ids.protector,0),little=newInstance(game,RPG_BASE_CARDS.find(c=>c.level===1&&!c.ace&&!c.fusionOnly).id,0),enemy=newInstance(game,RPG_BASE_CARDS.find(c=>c.level===4&&!c.fusionOnly).id,1),s=ArcaneLv1Swarm.state(game);a.fusion=true;a.card.def=1800;enemy.card.atk=210;enemy.mode='atk';enemy.summonedTurn=1;p.field[1]=little;e.field[0]=enemy;s.ghostSlots=[{kind:'card',card:a}];game.active=1;const before=a.card.def;const result=attack(game,0,1);return {hit:!!result,guardLostDef:a.card.def<before,guardStayed:s.ghostSlots[0]?.card===a,otherStayed:p.field[1]===little};})()");
 assert.equal(r.hit,true);assert.equal(r.guardLostDef,true);assert.equal(r.guardStayed,true);assert.equal(r.otherStayed,true);
});
