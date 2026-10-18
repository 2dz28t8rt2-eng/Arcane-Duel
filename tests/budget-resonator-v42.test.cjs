'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
test('Lv1-10 workshop budgets use agreed flattened totals and keep original PvP starters intact',()=>{
 const x=boot().run("({actual:Array.from({length:10},(_,i)=>workshopBudget(i+1)),target:[...ArcaneLevelBudget.totals].slice(1),changed:ArcaneLevelBudget.changed.length,pvpStarter:[CARDS[0].atk,CARDS[0].def],changedIds:ArcaneLevelBudget.changed.slice(0,5)})");
 assert.deepEqual(x.actual,[180,270,420,630,810,1030,1270,1530,1830,2150]);
 assert.deepEqual(x.target,x.actual);assert.ok(x.changed>100);assert.equal(x.changedIds.some(id=>id<20),false);
});
test('Normal PvE templates across every level use role-split common/rare values, no old 3000 spike',()=>{
 const rows=boot().run("(()=>{const rows=[];for(let level=1;level<=10;level++){const c=CARDS.find(c=>c.rpg&&!c.retired&&!c.fusionOnly&&!c.essenceMonster&&c.id>=20&&c.level===level&&c.rarity==='common');if(!c)throw Error('Missing common Lv '+level);rows.push({level,atk:c.atk,def:c.def,share:c.atk/(c.atk+c.def),budget:workshopBudget(level),role:c.role});}return rows;})()");
 for(const row of rows){
  assert.ok(row.atk>0&&row.def>0);
  assert.ok(Math.abs(row.atk+row.def-row.budget)<=10,JSON.stringify(row));
 }
 assert.ok(rows[9].atk+rows[9].def<=2160);
});
test('Material-majority roles win; all neutral and tied combinations create a Resonator',()=>{
 const out=boot().run("(()=>{const c=(role)=>({id:0,roleOverride:role});const R=ArcaneRoleFusion;return {pred:R.inheritance([c('predator'),c('predator'),c('guardian')]),def:R.inheritance([c('guardian'),c('guardian'),c('predator')]),soul:R.inheritance([c('soul'),c('soul')]),tie:R.inheritance([c('guardian'),c('predator')]),neutral:R.inheritance([c('combatant'),c('combatant')]),mixed:R.inheritance([c('predator'),c('guardian'),c('combatant')]),noFixed:R.inheritance([c('predator'),c('guardian'),c('resonator')])};})()");
 assert.deepEqual(out,{pred:'predator',def:'guardian',soul:'soul',tie:'resonator',neutral:'resonator',mixed:'resonator',noFixed:'resonator'});
});
test('Any unbound fusion template can yield a neutral Resonator with genuinely unweighted rolls',()=>{
 const x=boot().run("(()=>{profile=freshProfile();game=createGame({mode:'pve',opponentId:1,context:'free',seed:95212});game.active=0;const a=CARDS.find(c=>c.rpg&&!c.retired&&!c.fusionOnly&&c.role==='predator'&&c.level===2),b=CARDS.find(c=>c.rpg&&!c.retired&&!c.fusionOnly&&c.role==='guardian'&&c.level===2);if(!a||!b)throw Error('Fixtures unavailable');const first=newInstance(game,a.id,0),second=newInstance(game,b.id,0),lv=[2,2],available=fusionOptions(game,lv,[first,second]);if(!available.length)throw Error('No legal template');const pick=available.find(c=>c.role!=='combatant')||available[0];game.fusionChoice=pick.id;const fused=fusedInstance(game,[first,second],lv);if(!fused)throw Error('No result');game.players[0].field[0]=fused;const snap=validateDuelSnapshot(JSON.parse(JSON.stringify(game)));return {templateRole:pick.role,free:pick.fusionRoleFree,role:fused.roleOverride,source:fused.roleOrigin,weights:fused.rollMath.roleWeights,saved:snap.players[0].field[0].roleOverride,art:fused.id===pick.id};})()");
 assert.equal(x.free,true);assert.equal(x.role,'resonator');assert.equal(x.source,'material');
 assert.deepEqual(x.weights,{atk:1,def:1});assert.equal(x.saved,'resonator');assert.equal(x.art,true);
});
test('Resonator as field material contributes 10 / 20 / 30 percent, without fake hand charging',()=>{
 const x=boot().run("(()=>{profile=freshProfile();game=createGame({mode:'pve',opponentId:1,context:'free',seed:91101});game.active=0;const instance={uid:1001000,id:RPG_START_FUSIONS[0],fusion:true,roleOverride:'resonator',resonance:0};game.players[0].field[0]=instance;const compute=()=>ArcaneAllrounder.evaluate(game,[instance]).bonus;const first=compute();instance.resonance=1;const second=compute();instance.resonance=2;const third=compute();game.players[0].field[0]=null;const hand=compute();return {first,second,third,hand,resonator:ArcaneAllrounder.isResonator(instance)};})()");
 assert.deepEqual(x,{first:10,second:20,third:30,hand:10,resonator:true});
});
test('Resonator charges tick on survived own turns and persist; no PvP bonus',()=>{
 const x=boot().run("(()=>{profile=freshProfile();game=createGame({mode:'pve',opponentId:1,context:'free',seed:91102});game.active=0;game.turn=4;const a=CARDS.find(c=>c.fusionOnly&&c.rpg&&!c.retired&&c.level===2);const r=newInstance(game,a.id,0);r.fusion=true;r.roleOverride='resonator';r.roleOrigin='material';r.resonance=0;r.summonedTurn=1;game.players[0].field[0]=r;advanceTurn(game);const step1=r.resonance;game.active=0;game.turn++;advanceTurn(game);const step2=r.resonance;game.active=0;game.turn++;advanceTurn(game);const cap=r.resonance;const snap=validateDuelSnapshot(JSON.parse(JSON.stringify(game)));const p=createGame({mode:'pvp',seed:12});const isolated=ArcaneAllrounder.evaluate(p,[r]).bonus;return {step1,step2,cap,restored:snap.players[0].field[0]?.resonance,isolated};})()");
 assert.deepEqual(x,{step1:1,step2:2,cap:2,restored:2,isolated:0});
});
test('Fusion stamps, role captions and numeric calculations include Resonator',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
 assert.match(read('assets/fusion-cinema-ritual.js'),/resonator:'RESONATOR'/);
 assert.match(read('assets/duel-card-clarity-v41.js'),/resonator:'Resonator'/);
 assert.match(read('assets/evolution.js'),/resonator:'RESONATOR'/);
 assert.match(read('index.html'),/assets\/level-budget-v42\.js/);
});
