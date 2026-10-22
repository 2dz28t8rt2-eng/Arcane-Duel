'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
function setup(){
 const b=boot({seed:170017});
 b.exec(`globalThis.RoleRegression=(()=>{
  const C=window.ArcaneEssenceCombat;
  function fixture(templateRole,inherited,{owner=0,seed=60139,bonus=false,opponentId=7}={}){
   profile=freshProfile();profile.cleared=[1,2,3,4,5,6,7];
   const pool=RPG_FUSIONS.filter(c=>!c.retired&&!c.enemyOnly&&c.level<=6);
   // Fusion templates have no permanent role. Compare two distinct Lv5
   // blueprints while obtaining the live fusion role exclusively from materials.
   const stock=pool.filter(c=>c.level===5).slice(0,2).map(c=>c.id);
   if(stock.length!==2)throw Error('Insufficient role-neutral Lv5 fusion templates');
   const g=createGame({id:'role-regression-'+seed+'-'+owner,mode:'pve',context:'tournament',opponentId,
    seed,starter:owner,deck:RPG_DEFAULT_DECK,fusionDeck:stock});
   g.active=owner;
   for(const p of g.players){p.field.fill(null);p.fusionDeck=[...stock];p.remainingFusion=[...stock];}
   const roots=[...ARCANE_STAGE_IDS.values()].filter(id=>CARDS[id].level===4&&CARDS[id].role===inherited);
   const parts=roots.slice(0,2).map(id=>newInstance(g,id,owner));
   if(bonus)g.players[owner].enhancements[parts[0].id]=3;
   g.fusionChoice=stock[templateRole==='predator'?0:1];
   const f=fusedInstance(g,parts,[4,4]);delete g.fusionChoice;f.mode='def';
   const partnerId=[...ARCANE_STAGE_IDS.values()].find(id=>CARDS[id].level===6&&CARDS[id].role==='soul');
   const partner=newInstance(g,partnerId,owner);partner.mode='def';C.statLayer(partner);partner.card.def-=300;
   g.players[owner].field=[f,partner,null,null,null];g.active=1-owner;g.turn=2;
   game=g;uiMode='duel';busy=false;aiRunning=false;$('overlay').classList.add('hidden');
   return {g,f,partner,C};
  }
  return {fixture};
 })();`);
 return b;
}
test('Guardian regeneration follows the inherited role on both sides',()=>{
 const rows=setup().run(`(()=>{
  const rows=[];
  for(const owner of [0,1])for(const [template,inherited]of [['guardian','guardian'],['predator','guardian'],['guardian','predator']]){
   const {g,f,partner}=RoleRegression.fixture(template,inherited,{owner});
   const before=partner.card.def;advanceTurn(g);
   rows.push({owner,template,inherited,actual:f.roleOverride,heal:partner.card.def-before,
    expected:inherited==='guardian'?Math.min(150,25+dataOf(f).level*12):0});
  }
  return rows;
 })()`);
 for(const row of rows){assert.equal(row.actual,row.inherited);assert.equal(row.heal,row.expected,JSON.stringify(row));}
});
test('Inherited guardian healing respects the HP cap, DEF position and self exclusion',()=>{
 const r=setup().run(`(()=>{
  const {g,f,partner,C}=RoleRegression.fixture('predator','guardian');
  const self=C.statLayer(f);f.card.def-=100;const ownBefore=f.card.def;
  partner.card.def=C.statLayer(partner).maxDef-10;
  advanceTurn(g);const cap=partner.card.def===C.statLayer(partner).maxDef,selfUnchanged=f.card.def===ownBefore;
  const second=RoleRegression.fixture('predator','guardian');second.f.mode='atk';
  const before=second.partner.card.def;advanceTurn(second.g);
  return {cap,selfUnchanged,noAttackModeHeal:second.partner.card.def===before};
 })()`);
 assert.deepEqual(r,{cap:true,selfUnchanged:true,noAttackModeHeal:true});
});
test('An inherited rank-three Soul Eater can switch focus only once per turn',()=>{
 const r=setup().run(`(()=>{
  const {g,f,C}=RoleRegression.fixture('predator','soul');g.active=0;g.turn=4;
  const accepted=C.chooseDrain(0,'def'),repeat=C.chooseDrain(0,'atk');
  const preference=C.statLayer(f).drainPreference;
  const low=RoleRegression.fixture('predator','soul');low.g.active=0;low.g.turn=4;low.f.card.level=3;
  return {role:f.roleOverride,level:dataOf(f).level,accepted,repeat,preference,lowRankAccepted:low.C.chooseDrain(0,'def')};
 })()`);
 assert.equal(r.role,'soul');assert.equal(r.level,5);assert.equal(r.accepted,true);
 assert.equal(r.repeat,false);assert.equal(r.preference,2);assert.equal(r.lowRankAccepted,false);
});
test('Full card previews label the actual Soul role while the template stays role-free',()=>{
 const r=setup().run(`(()=>{
  const {f}=RoleRegression.fixture('predator','soul');
  const html=fullCardHtml(f);
  return {template:CARDS[f.id].role??null,soulChip:html.includes('essence-role-chip essence-role-soul'),
   predatorChip:html.includes('essence-role-chip essence-role-predator')};
 })()`);
 assert.deepEqual(r,{template:null,soulChip:true,predatorChip:false});
});
test('A Soul Eater fusion actually heals LP from its chosen DEF focus',()=>{
 const r=setup().run(`(()=>{
  const {g,f,C}=RoleRegression.fixture('predator','soul');g.active=0;g.turn=4;
  g.players[0].field=[f,null,null,null,null];g.players[0].lp-=500;
  if(!C.chooseDrain(0,'def'))return {accepted:false};
  advanceTurn(g);
  const preyId=[...ARCANE_STAGE_IDS.values()].find(id=>CARDS[id].role==='predator'&&CARDS[id].level===6);
  const prey=newInstance(g,preyId,1);prey.summonedTurn=g.turn;g.players[1].field[0]=prey;
  const beforeDef=prey.card.def,beforeLP=g.players[0].lp;advanceTurn(g);
  return {accepted:true,healed:g.players[0].lp-beforeLP,expected:Math.floor((beforeDef-prey.card.def)*.3),
   nextTurnSwitch:C.chooseDrain(0,'atk')};
 })()`);
 assert.equal(r.accepted,true);assert.ok(r.healed>0);assert.equal(r.healed,r.expected);assert.equal(r.nextTurnSwitch,true);
});
test('Raw fusion rolls remain independent of material bonuses and enemy penalties',()=>{
 const rows=setup().run(`(()=>{
  const out=[];
  for(const owner of [0,1])for(let n=0;n<64;n++){
   const {f}=RoleRegression.fixture('predator','guardian',{owner,seed:117001+n*997,bonus:true,opponentId:2});
   const m=f.rollMath,raw=f.rollTrace[m.winnerIndex];
   out.push({owner,raw,winner:m.winner,largest:Math.max(...f.rollTrace.map(r=>r.atk+r.def)),
    bonus:m.bonus,penalty:m.penalty,final:m.final,card:f.card});
  }
  return out;
 })()`);
 for(const r of rows){
  assert.deepEqual(r.raw,r.winner);assert.equal(r.raw.atk+r.raw.def,r.largest);
  assert.equal(r.bonus.atk+r.bonus.def,60);assert.equal(r.penalty,r.owner===1?50:0);
  for(const stat of ['atk','def'])assert.equal(r.card[stat],Math.max(0,r.raw[stat]+r.bonus[stat]-r.penalty));
 }
});
test('Save/load retains correct raw rolls and repairs provable legacy trace aliasing',()=>{
 const rows=setup().run(`(()=>{
  return [false,true].map(legacy=>{
   const {g,f}=RoleRegression.fixture('predator','guardian',{bonus:true});
   const winner={...f.rollMath.winner},final={...f.rollMath.final};
   if(legacy)f.rollTrace[f.rollMath.winnerIndex]={...final};
   const restored=validateDuelSnapshot(JSON.parse(JSON.stringify(g))).players[0].field[0];
   return {legacy,winner,final,restoredWinner:restored.rollMath?.winner,
    restoredRaw:restored.rollTrace[restored.rollMath.winnerIndex],role:restored.roleOverride,card:restored.card};
  });
 })()`);
 for(const r of rows){assert.deepEqual(r.restoredRaw,r.winner);assert.deepEqual(r.restoredWinner,r.winner);
  assert.equal(r.role,'guardian');assert.equal(r.card.atk,r.final.atk);assert.equal(r.card.def,r.final.def);}
});
test('A role override cannot grant Soul abilities in classic local PvP',()=>{
 const r=setup().run(`(()=>{
  game=createGame({mode:'pvp',seed:1114});uiMode='duel';busy=false;aiRunning=false;$('overlay').classList.add('hidden');
  const c=game.players[0].hand[0];c.roleOverride='soul';c.mode='def';game.players[0].field[0]=c;game.active=0;
  return {focus:window.ArcaneEssenceCombat.chooseDrain(0,'def'),discharge:window.ArcaneEssenceCombat.discharge(0)};
 })()`);
 assert.deepEqual(r,{focus:false,discharge:false});
});
