'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {boot}=require('./helpers/game-runtime.cjs');

test('first ordinary creature of starter receives exactly one destruction guard; later hits kill it',()=>{
 const b=boot({seed:20501});
 const r=b.run(`(()=>{
  const g=createGame({mode:'pve',opponentId:1,starter:0,seed:20501});
  const pred=CARDS.find(x=>x.role==='predator'&&!x.fusionOnly&&!x.essenceMonster&&x.level>=3);
  const c=newInstance(g,pred.id,0);c.mode='atk';c.card.atk=300;
  g.players[0].hand=[c];g.players[0].field.fill(null);
  g.pending={kind:'normal',card:c,levels:[c.card.level]};
  const placed=placePending(g,0);
  const guard=!!placed?.card?.openingGuard,age=placed?.card?.predatorEvolutionAge;
  const before=validateDuelSnapshot(JSON.parse(JSON.stringify(g)));
  g.turn=2;g.active=1;g.players[1].field.fill(null);
  const foe=newInstance(g,pred.id,1);foe.card.atk=2000;
  const foe2=newInstance(g,pred.id,1);foe2.card.atk=2000;
  g.players[1].field[0]=foe;g.players[1].field[1]=foe2;
  const first=attack(g,0,0),survived=g.players[0].field[0]===c;
  const last=!!c.openingGuard;
  const second=attack(g,1,0),destroyed=g.players[0].field[0]===null;
  return {guard,age,loadedGuard:!!before.players[0].field[0].openingGuard,
   loadedAge:before.players[0].field[0].predatorEvolutionAge,
   survived,consumed:!last,firstDestroyed:first.destroyed.length,
   destroyed,secondDestroyed:second.destroyed.length,
   saved:g.openingGuardSaved?.uid===c.uid};
 })()`);
 assert.equal(r.guard,true);assert.equal(r.age,0);
 assert.equal(r.loadedGuard,true);assert.equal(r.loadedAge,0);
 assert.equal(r.survived,true);assert.equal(r.consumed,true);
 assert.equal(r.firstDestroyed,0);assert.equal(r.destroyed,true);
 assert.equal(r.secondDestroyed,1);assert.equal(r.saved,true);
});

test('opening protection prevents Essence DEF destruction inside actual combat resolution',()=>{
 const r=boot({seed:20502}).run(`(()=>{
  const g=createGame({mode:'pve',opponentId:1,starter:0,seed:20502});
  g.turn=2;g.active=1;g.players[0].field.fill(null);g.players[1].field.fill(null);
  const pred=CARDS.find(x=>x.role==='predator'&&!x.fusionOnly&&!x.essenceMonster&&x.level>=3);
  const c=newInstance(g,pred.id,0);c.mode='def';c.card.def=200;c.openingGuard=true;
  const enemy=newInstance(g,pred.id,1);enemy.card.atk=1800;
  g.players[0].field[0]=c;g.players[1].field[0]=enemy;
  const result=attack(g,0,0);
  return {survived:g.players[0].field[0]===c,def:c.card.def,guard:!!c.openingGuard,
   destroyed:result.destroyed.length,grave:g.players[0].graveyard.some(x=>x.uid===c.uid)};
 })()`);
 assert.deepEqual(r,{survived:true,def:1,guard:false,destroyed:0,grave:false});
});

test('Fusion monsters cannot receive opening guard even if placed first',()=>{
 const r=boot({seed:20503}).run(`(()=>{
  const g=createGame({mode:'pve',opponentId:1,starter:0,seed:20503});
  const tpl=CARDS.find(x=>x.fusionOnly&&!x.ace);
  const c=newInstance(g,tpl.id,0);c.fusion=true;
  g.pending={kind:'fusion',card:c,levels:[2,2]};
  g.players[0].field.fill(null);
  const r=placePending(g,0);
  return {placed:!!r,guard:!!r?.card?.openingGuard,age:r?.card?.predatorEvolutionAge??null};
 })()`);
 assert.deepEqual(r,{placed:true,guard:false,age:null});
});

test('normal Predator develops after later own completed turns, capped at +12pp, with additive Swarm',()=>{
 const r=boot({seed:20504}).run(`(()=>{
  const g=createGame({mode:'pve',opponentId:1,starter:0,seed:20504});
  const pred=CARDS.find(x=>x.role==='predator'&&!x.fusionOnly&&!x.essenceMonster&&x.level>=3);
  const c=newInstance(g,pred.id,0);c.card.atk=1000;c.card.def=3500;
  g.players[0].hand=[c];g.players[0].field.fill(null);g.players[1].field.fill(null);
  g.pending={kind:'normal',card:c,levels:[c.card.level]};
  placePending(g,0);
  const ages=[c.predatorEvolutionAge],factors=[predatorDevelopmentPct(c)];
  const base=effectiveAttack(g,c,null);
  for(let k=0;k<10;k++){
   if(g.winner!==null)break;
   advanceTurn(g);
   if(g.active===1||g.active===0&&g.turn>1){
    ages.push(c.predatorEvolutionAge);
    factors.push(predatorDevelopmentPct(c));
   }
  }
  const state=window.ArcanePredatorDevelopment.breakdown(g,c,0);
  const preserved=validateDuelSnapshot(JSON.parse(JSON.stringify(g)));
  return {ages,factors,base,after:effectiveAttack(g,c,null),
    cardAtk:c.card.atk,cardDef:c.card.def,parts:state,
    restoredAge:preserved.players[0].field[0].predatorEvolutionAge,
    restoredBorn:preserved.players[0].field[0].predatorDevelopmentBornTurn};
 })()`);
 assert.equal(r.base,920);
 assert.ok(r.ages.includes(0)&&r.ages.includes(1)&&r.ages.includes(2)&&r.ages.includes(3)&&r.ages.includes(4));
 assert.equal(r.parts.evolution,102);
 assert.equal(r.parts.swarm,2);
 assert.equal(r.parts.total,104);
 assert.equal(r.restoredAge,4);assert.equal(r.restoredBorn,1);
});

test('Solo UI exposes growth pulse, total Swarm percent and a detailed large-card explanation',()=>{
 const ui=fs.readFileSync('assets/opening-predator-development-v205.js','utf8');
 const css=fs.readFileSync('assets/opening-predator-development-v205.css','utf8');
 const index=fs.readFileSync('index.html','utf8');
 assert.match(ui,/ENTWICKLUNG/);
 assert.match(ui,/Schwarmbonus:/);
 assert.match(ui,/Gesamt:/);
 assert.match(ui,/renderCardPreview=function/);
 assert.match(css,/ad205-evolve/);
 assert.match(index,/opening-predator-development-v205\.js/);
 assert.match(index,/opening-predator-development-v205\.css/);
});
