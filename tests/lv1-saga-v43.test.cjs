'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {boot}=require('./helpers/game-runtime.cjs');
test('Lv1 research registers four cards and allows original PvE and PvP to boot',()=>{
 const r=boot().run("({ids:ArcaneLv1Swarm.ids,cards:CARDS.length,late:window.ArcaneLateGameV71?.count||0,newLate:window.ArcaneLateGameV117?.count||0,newFusions:window.ArcaneFusionWaveV129?.installed||0,v130Fusions:window.ArcaneFusionWaveV130?.installed||0,duel:createGame({mode:'pvp',seed:123}).mode})");
 assert.equal(new Set(Object.values(r.ids)).size,4);
 assert.equal(r.cards,Math.max(...Object.values(r.ids))+2+r.late+r.newLate+r.newFusions+r.v130Fusions);
 assert.equal(r.duel,'pvp');
});
test('Encounter uses independent OR conditions and recognizes exact unique Lv1 collection',()=>{
 const r=boot().run("(()=>{profile=freshProfile();const a=ArcaneLv1Saga;profile.xp=1500;const level=a.forced();profile.xp=0;profile.cleared=[1,2,3,4,5];const tournament=a.forced();profile.cleared=[];const {threshold}=a.fraction();for(const c of RPG_BASE_CARDS.filter(c=>c.level===1&&c.rpg&&!c.ace&&!c.fusionOnly&&!c.milestoneOnly).slice(0,threshold))profile.inventory[c.id]=1;return {level,tournament,collection:a.forced(),threshold};})()");
 assert.equal(r.level,true);assert.equal(r.tournament,true);assert.equal(r.collection,true);assert.ok(r.threshold>1);
});
test('Saga first fight features a forty-card Lv1 opponent and 2000 LP',()=>{
 const r=boot().run("(()=>{profile=freshProfile();profile.lv1Saga.offered=true;profile.lv1Saga.met=true;startDuel('pve',1,'lv1-saga','easy',1);return {stage:game.lv1Saga?.stage,maxLP:game.maxLP,player:game.players[0].lp,enemy:game.players[1].lp,deck:game.players[1].originalDeck.length,levels: [...new Set(game.players[1].originalDeck.map(id=>CARDS[id].level))]};})()");
 assert.equal(r.stage,1);assert.equal(r.maxLP,2000);assert.equal(r.player,2000);assert.equal(r.enemy,2000);assert.equal(r.deck,40);assert.deepEqual(r.levels,[1]);
});
test('Floating produces a selectable effectless echo without automatically chaining',()=>{
 const r=boot().run("(()=>{profile=freshProfile();profile.lv1Saga.perk=true;game=createGame({mode:'pve',seed:101,opponentId:1,context:'free'});game.active=0;const c=newInstance(game,RPG_BASE_CARDS.find(c=>c.rpg&&c.level===1&&!c.ace).id,0);game.players[0].field[0]=c;ArcaneLv1Swarm.exitCard(game,c);const choices=ArcaneLv1Swarm.state(game).choices.length;const clicked=ArcaneLv1Swarm.resolveChoice(game,0,'echo');const claimed=ArcaneLv1Swarm.claimOffer(game,0);const copy=game.players[0].hand.at(-1);return {choices,clicked,claimed,echo:copy.lv1Echo,effectless:copy.lv1Effectless,remaining:ArcaneLv1Swarm.state(game).choices.length};})()");
 assert.equal(r.choices,1);assert.equal(r.clicked,true);assert.equal(r.claimed,true);assert.equal(r.echo,true);assert.equal(r.effectless,true);assert.equal(r.remaining,0);
});
test('All Lv1 five-of-a-kind gains 5% quality after perk',()=>{
 const r=boot().run("(()=>{profile=freshProfile();game=createGame({mode:'pve',seed:121,opponentId:1});game.active=0;const lv=[1,1,1,1,1];const before=ArcaneEvolution.tunedFusionQuality(game,lv,[]).factor;profile.lv1Saga.perk=true;const after=ArcaneEvolution.tunedFusionQuality(game,lv,[]).factor;return {before,after};})()");
 assert.ok(Math.abs(r.after-r.before-.05)<.0001);
});
test('Five-story research awards unique ACE and does not duplicate final prizes',()=>{
 const r=boot().run("(()=>{profile=freshProfile();profile.lv1Saga.offered=true;profile.lv1Saga.met=true;profile.lv1Saga.stage=4;startDuel('pve',1,'lv1-saga','easy',5);game.lv1SagaProgress={floating:1,swarm:1,special:1};game.winner=0;const g=game;const one=rewardMatch(g),two=rewardMatch(g);return {completed:profile.lv1Saga.stage,perk:profile.lv1Saga.perk,ace:profile.inventory[ArcaneLv1Swarm.ids.ace],rolls:one.lv1BonusPacks.length,twice:two===null};})()");
 assert.equal(r.completed,5);assert.equal(r.perk,true);assert.equal(r.ace,1);assert.ok(r.rolls>=0&&r.rolls<=10);assert.equal(r.twice,true);
});
test('Lv1-only class fusion is a selectable target with signed custom values',()=>{
 const r=boot().run("(()=>{profile=freshProfile();profile.lv1Saga.perk=true;game=createGame({mode:'pve',seed:17,opponentId:1});game.active=0;game.players[0].remainingFusion.push(ArcaneLv1Swarm.ids.hive);const id=RPG_BASE_CARDS.find(c=>c.rpg&&c.level===1&&!c.ace).id,ms=[0,1,2].map(()=>newInstance(game,id,0)),lv=[1,1,1],opts=fusionOptions(game,lv,ms);game.fusionChoice=ArcaneLv1Swarm.ids.hive;const c=fusedInstance(game,ms,lv);return {offered:opts.some(x=>x.id===game.fusionChoice),made:c?.id===game.fusionChoice,def:c?.card.def,extra:c?.lv1Full?.def,role:c?.roleOverride};})()");
 assert.equal(r.offered,true);assert.equal(r.made,true);assert.ok(r.def>100);assert.equal(r.def,r.extra);
});
test('Four violet creature artworks and interaction styles exist',()=>{
 for(const name of ['lv1-necro-hive.svg','lv1-protector.svg','lv1-attacker.svg','lv1-urfunke.svg']){
  const f=fs.readFileSync(path.resolve(__dirname,'../assets/custom-art',name),'utf8');
  assert.match(f,/<svg /);assert.match(f,/<radialGradient/);assert.match(f,/<filter/);
 }
 const css=fs.readFileSync(path.resolve(__dirname,'../assets/lv1-saga-v43.css'),'utf8');
 assert.match(css,/lv1Glow/);assert.match(css,/lv1Unlock/);
});

test('Earned unique ACE survives a full fresh-browser reload without corrupting earlier inventory',()=>{
 const b=boot();
 const first=b.run("(()=>{profile=freshProfile();profile.lv1Saga.perk=true;profile.lv1Saga.offered=true;profile.lv1Saga.stage=5;addCard(ArcaneLv1Swarm.ids.ace);profile.coins=1234;saveProfile();return {ace:profile.inventory[ArcaneLv1Swarm.ids.ace],coins:profile.coins};})()");
 assert.equal(first.ace,1);
 const key='arcane-duel-rpg-profile-v4-reborn';
 const raw=b.storage.get(key);
 assert.ok(raw,'saved inventory should exist');
 const restored=boot({saved:{[key]:raw}}).run("({ace:profile.inventory[ArcaneLv1Swarm.ids.ace],coins:profile.coins,perk:profile.lv1Saga.perk,stage:profile.lv1Saga.stage})");
 assert.deepEqual(restored,{ace:1,coins:1234,perk:true,stage:5});
});

test('Approved detailed Lv1 fusion art is embedded as valid high resolution local WebP',()=>{
 for(const [key,name] of Object.entries({hive:'lv1-necro-hive-illustration.webp',protector:'lv1-protector-illustration.webp',attacker:'lv1-attacker-illustration.webp',ace:'lv1-urfunke-illustration.webp'})){
  const bytes=fs.readFileSync(path.resolve(__dirname,'../assets/custom-art',name));
  assert.equal(bytes.subarray(0,4).toString('ascii'),'RIFF');assert.equal(bytes.subarray(8,12).toString('ascii'),'WEBP');
  assert.ok(bytes.length>120000);
 }
 const r=boot().run('Object.fromEntries(Object.entries(ArcaneLv1Swarm.ids).map(([k,id])=>[k,CARDS[id].art]))');
 assert.ok(Object.entries(r).every(([k,art])=>k==='ace'?art.endsWith('lumira-angel-v49.webp'):art.endsWith('-illustration.webp')));
});

test('intro fight precedes the questline and unlocks it only upon victory',()=>{
 const b=boot({seed:9021});
 const r=b.run("(()=>{profile=freshProfile();profile.lv1Saga.offered=true;startDuel('pve',1,'lv1-saga','easy','prologue');const before={stage:game?.lv1Saga?.stage,intro:game?.lv1SagaPrologue,met:profile.lv1Saga.met,progress:profile.lv1Saga.stage};game.winner=0;const won=rewardMatch(game);return {before,after:{met:profile.lv1Saga.met,progress:profile.lv1Saga.stage,firstQuestAvailable:profile.lv1Saga.offered,reward:!!won?.lv1Prologue}};})()");
 assert.deepEqual(r,{before:{stage:1,intro:true,met:false,progress:0},after:{met:true,progress:0,firstQuestAvailable:true,reward:true}});
});
test('chapter II no longer hard-locks a legitimate victory if Floating instrumentation was missed',()=>{
 const r=boot().run("(()=>{profile=freshProfile();profile.lv1Saga.offered=true;profile.lv1Saga.met=true;profile.lv1Saga.stage=1;startDuel('pve',1,'lv1-saga','easy',2);const g=game;g.lv1SagaProgress={floating:0,swarm:0,special:0};g.winner=0;const prize=rewardMatch(g);return {stage:profile.lv1Saga.stage,next:prize?.lv1StageNew,win:prize?.lv1Saga===2};})()");
 assert.deepEqual(r,{stage:2,next:true,win:true});
});

test('discarding an old paused duel keeps the selected Level-1 research chapter',()=>{
 const r=boot().run("(()=>{profile=freshProfile();profile.lv1Saga.offered=true;profile.lv1Saga.met=true;profile.lv1Saga.stage=1;profile.activeDuel={id:'unrelated-pause',rulesVersion:5};startDuel('pve',1,'lv1-saga','easy',2);const offered=typeof $('discardSaved').onclick==='function';$('discardSaved').onclick();return {offered,chapter:game?.lv1Saga?.stage,context:game?.context,oldPauseRetained:profile.activeDuel?.id==='unrelated-pause'};})()");
 assert.equal(r.offered,true);assert.equal(r.chapter,2);assert.equal(r.context,'challenge');assert.equal(r.oldPauseRetained,false);
});
test('Lumiras Fall is built directly from the fanatic hand during chapter V',()=>{
 const r=boot().run("(()=>{profile=freshProfile();profile.lv1Saga={offered:true,met:true,stage:4,perk:false,skillRank:0};startDuel('pve',1,'lv1-saga','easy',5);const g=game;g.active=1;g.aiPhase='summon';g.summoned=false;g.pending=null;const ace=g.players[1].hand.find(c=>c.id===ArcaneLv1Swarm.ids.ace),action=chooseAiAction(g);const made=action.type==='fusion'?applyAiAction(g,action):false;return {ace:!!ace,action:action.type,used:action.uids?.includes(ace?.uid)===true,made:!!made,fall:g.pending?.card?.id===ArcaneLv1Saga.corruptedId,summoned:g.lv1FanaticAce?.played===true};})()");
 assert.equal(r.ace,true);assert.equal(r.action,'fusion');assert.equal(r.used,true);
 assert.equal(r.made,true);assert.equal(r.fall,true);assert.equal(r.summoned,false);
});
