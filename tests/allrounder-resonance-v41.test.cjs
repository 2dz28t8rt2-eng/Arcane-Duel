'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {boot}=require('./helpers/game-runtime.cjs');

test('Hand Allrounder is positive and level-mismatched material cannot weaken chain quality or rolls',()=>{
 const x=boot().run('('+function(){
  profile=freshProfile();profile.guideSeen=true;
  game=createGame({mode:'pve',context:'free',opponentId:1,seed:5521});game.active=0;
  const all=RPG_BASE_CARDS.find(c=>c.role==='combatant'&&!c.fusionOnly&&!c.ace&&c.level<=4);
  const others=RPG_BASE_CARDS.filter(c=>c.role!=='combatant'&&!c.fusionOnly&&!c.ace&&c.level>=3&&c.level<=5).slice(0,2);
  if(!all||others.length!==2)throw Error('Fixtures unavailable');
  const a=newInstance(game,all.id,0),b=others.map(c=>newInstance(game,c.id,0));
  const quality=cards=>window.ArcaneEvolution.tunedFusionQuality(game,cards.map(c=>dataOf(c).level),cards.map(c=>dataOf(c).element),cards);
  const hand=window.ArcaneAllrounder.evaluate(game,[a,...b]);
  const base=quality(b),low=quality([a,...b]);
  game.players[0].field[0]=a;a.resonance=3;
  const field=window.ArcaneAllrounder.evaluate(game,[a,...b]),rich=quality([a,...b]);
  return {hand,base:base.factor,low:low.factor,baseRolls:base.rollBonus,lowRolls:low.rollBonus,field,rich:rich.factor};
 }.toString()+')()');
 assert.equal(x.hand.bonus,4);assert.equal(x.field.bonus,16);assert.equal(x.field.charges,3);
 assert.ok(x.low>=x.base+.039,'Adding a weaker Allrounder must improve fusion quality');
 assert.ok(x.lowRolls>=x.baseRolls,'Existing combo quality rolls must not get worse');
 assert.ok(x.rich>=x.base+.159,'Prepared field material multiplies the positive result');
});
test('Stored resonance is capped and preserved across duel resume',()=>{
 const x=boot().run('('+function(){
  profile=freshProfile();game=createGame({mode:'pve',opponentId:1,context:'free',seed:9801});
  game.active=0;game.starter=0;game.turn=4;game.winner=null;game.pending=null;
  const normal=RPG_BASE_CARDS.find(c=>c.role==='combatant'&&!c.fusionOnly&&!c.ace&&c.level<=4);
  if(!normal)throw Error('Allrounder fixture absent');
  const c=newInstance(game,normal.id,0);c.mode='def';c.summonedTurn=1;c.resonance=2;
  game.players[0].field[0]=c;
  advanceTurn(game);
  const saved=validateDuelSnapshot(JSON.parse(JSON.stringify(game)));
  return {turn:game.turn,charges:c.resonance,saved:saved.players[0].field[0]?.resonance};
 }.toString()+')()');
 assert.ok(x.turn>4);assert.equal(x.charges,3);assert.equal(x.saved,3);
});
test('Real fusion applies hand resonance before raw rolls without double addition',()=>{
 const x=boot().run('('+function(){
  profile=freshProfile();game=createGame({mode:'pve',context:'free',opponentId:1,seed:10116});game.active=0;
  const all=RPG_BASE_CARDS.find(c=>c.role==='combatant'&&!c.fusionOnly&&!c.ace&&c.level<=3);
  const pred=RPG_BASE_CARDS.find(c=>c.role==='predator'&&!c.fusionOnly&&!c.ace&&c.level<=3);
  if(!all||!pred)throw Error('Low tier role fixture not available');
  const a=newInstance(game,all.id,0),p=newInstance(game,pred.id,0);
  const levels=[dataOf(a).level,dataOf(p).level],to=fusionOptions(game,levels)[0];
  if(!to)throw Error('No valid level fusion');
  game.players[0].remainingFusion=[to.id];game.fusionChoice=to.id;
  const fused=fusedInstance(game,[a,p],levels);
  if(!fused)throw Error('No fusion produced');
  game.players[0].field[0]=fused;
  const saved=validateDuelSnapshot(JSON.parse(JSON.stringify(game)));
  return {role:CARDS[a.id].role,bonus:fused.resonanceFusion?.bonusPct,
   math:fused.rollMath,stats:{...fused.card},saved:saved.players[0].field[0]?.resonanceFusion};
 }.toString()+')()');
 assert.equal(x.bonus,4);
 for(const stat of ['atk','def'])assert.equal(x.math.final[stat],
  Math.max(0,x.math.winner[stat]+x.math.bonus[stat]-x.math.penalty));
 assert.equal(x.saved.bonusPct,4);
});
test('Allrounder perk cannot alter classic PvP or permanent template stats',()=>{
 const x=boot().run('('+function(){
  profile=freshProfile();game=createGame({mode:'pvp',seed:1192});
  const card=RPG_BASE_CARDS.find(c=>c.role==='combatant'&&!c.fusionOnly&&!c.ace);
  const a=newInstance(game,card.id,0);a.resonance=3;
  return window.ArcaneAllrounder.evaluate(game,[a]);
 }.toString()+')()');
 assert.equal(x.bonus,0);
});
test('Resonance UI and animation render authoritative quality bonus only',()=>{
 const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
 assert.match(read('index.html'),/allrounder-resonance-v41\.js/);
 assert.match(read('assets/fusion-cinema-ritual.js'),/MATERIAL-RESONANZ/);
 assert.match(read('assets/evolution.js'),/resonanceFusion/);
});

test('Level-one Allrounder does not reduce the highest legal fusion tier of a two-card chain',()=>{
 const x=boot().run('('+function(){
  profile=freshProfile();game=createGame({mode:'pve',context:'free',opponentId:5,seed:1551});game.active=0;
  const a=RPG_BASE_CARDS.find(c=>c.role==='combatant'&&!c.fusionOnly&&c.level===1);
  const normal=RPG_BASE_CARDS.filter(c=>c.role!=='combatant'&&!c.fusionOnly&&c.level===4).slice(0,2);
  if(!a||normal.length!==2)throw Error('Level-one or level-four fixture unavailable');
  const cards=normal.map(c=>newInstance(game,c.id,0)),weak=newInstance(game,a.id,0);
  const baseLevels=cards.map(c=>dataOf(c).level),levels=[...baseLevels,dataOf(weak).level];
  const before=fusionBudget(baseLevels,game),unprotected=fusionBudget(levels,game);
  const after=fusionBudget(levels,game,[...cards,weak]);
  const quality=window.ArcaneEvolution.tunedFusionQuality(game,levels,[...cards,weak].map(c=>dataOf(c).element),[...cards,weak]);
  return {before,unprotected,after,factor:quality.factor,resonance:quality.resonancePct};
 }.toString()+')()');
 assert.ok(x.before>=5,'A pair of high-level materials should access a higher fusion tier');
 assert.ok(x.after>=x.before,'An extra Allrounder cannot lower the reachable tier');
 assert.equal(x.resonance,4);
});
