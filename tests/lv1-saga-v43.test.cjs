'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {boot}=require('./helpers/game-runtime.cjs');
test('Lv1 research registers four cards and allows original PvE and PvP to boot',()=>{
 const r=boot().run("({ids:ArcaneLv1Swarm.ids,cards:CARDS.length,duel:createGame({mode:'pvp',seed:123}).mode})");
 assert.equal(new Set(Object.values(r.ids)).size,4);
 assert.equal(r.cards,374);
 assert.equal(r.duel,'pvp');
});
test('Encounter uses independent OR conditions and recognizes exact unique Lv1 collection',()=>{
 const r=boot().run("(()=>{profile=freshProfile();const a=ArcaneLv1Saga;profile.xp=1500;const level=a.forced();profile.xp=0;profile.cleared=[1,2,3,4,5];const tournament=a.forced();profile.cleared=[];const {threshold}=a.fraction();for(const c of RPG_BASE_CARDS.filter(c=>c.level===1&&c.rpg&&!c.ace&&!c.fusionOnly&&!c.milestoneOnly).slice(0,threshold))profile.inventory[c.id]=1;return {level,tournament,collection:a.forced(),threshold};})()");
 assert.equal(r.level,true);assert.equal(r.tournament,true);assert.equal(r.collection,true);assert.ok(r.threshold>1);
});
test('Saga first fight features a forty-card Lv1 opponent and 2000 LP',()=>{
 const r=boot().run("(()=>{profile=freshProfile();profile.lv1Saga.offered=true;startDuel('pve',1,'lv1-saga','easy',1);return {stage:game.lv1Saga?.stage,maxLP:game.maxLP,player:game.players[0].lp,enemy:game.players[1].lp,deck:game.players[1].originalDeck.length,levels: [...new Set(game.players[1].originalDeck.map(id=>CARDS[id].level))]};})()");
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
 const r=boot().run("(()=>{profile=freshProfile();profile.lv1Saga.offered=true;profile.lv1Saga.stage=4;startDuel('pve',1,'lv1-saga','easy',5);game.winner=0;const g=game;const one=rewardMatch(g),two=rewardMatch(g);return {completed:profile.lv1Saga.stage,perk:profile.lv1Saga.perk,ace:profile.inventory[ArcaneLv1Swarm.ids.ace],rolls:one.lv1BonusPacks.length,twice:two===null};})()");
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
