'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
function seatAudit(seat=null){
 profile=freshProfile();profile.guideSeen=true;
 for(const k of Object.keys(profile.upgrades||{}))profile.upgrades[k]=0;
 Object.assign(profile.upgrades,{resilience:2,fusionLore:2,combatDiscipline:2,openingAegis:2});
 const catalog={pred:CARDS.find(c=>c.role==='predator'&&!c.fusionOnly&&c.level>=3)?.id,
  guard:CARDS.find(c=>c.role==='guardian'&&!c.fusionOnly&&c.level>=3)?.id,
  soul:CARDS.find(c=>c.role==='soul'&&!c.fusionOnly&&c.level>=3)?.id};
 if(Object.values(catalog).some(x=>!Number.isInteger(x)))throw Error('Real roles missing');
 function game(n,symmetric){
  const g=createGame({mode:'pve',context:'free',seed:14941234,starter:0,
    strategicTraining:{enabled:true,noAttackTurns:n,
     disableArenaLPDecay:true,symmetricSides:symmetric}});
  const initialShields=g.players.map(p=>p.shield);
  for(const p of g.players){p.shield=0;p.enhancements={};p.flatBonus=0;p.power=1;}
  // Identical actual hands/decks/fusion stocks but unique UIDs.
  const a=g.players[0],b=g.players[1];
  b.hand=a.hand.map(c=>({...JSON.parse(JSON.stringify(c)),uid:g.nextUid++}));
  b.deck=[...a.deck];b.originalDeck=[...a.originalDeck];
  b.fusionDeck=[...a.fusionDeck];b.remainingFusion=[...a.remainingFusion];
  g.fateUsed=[true,true];g.essenceParticipated=false;
  return {g,initialShields};
 }
 function fusion(seat,symmetric){
  const {g}=game(10,symmetric);
  g.active=seat;g.turn=11;g.seed=17319;
  let combo=null;const hand=g.players[seat].hand;
  for(let i=0;i<hand.length;i++)for(let j=i+1;j<hand.length;j++){
   if(combo)continue;
   const l=[dataOf(hand[i]).level,dataOf(hand[j]).level];
   const f=fusionOptions(g,l,[hand[i],hand[j]])
    .find(c=>canCompleteHandFusion(g,l,c.id));
   if(f)combo={a:hand[i],b:hand[j],choice:f.id};
  }
  if(!combo)throw Error('No fusion available in mirrored opening');
  const ok=prepareHandFusion(g,[combo.a.uid,combo.b.uid],combo.choice);
  if(!ok||!g.pending?.card)throw Error('Fusion action failed');
  const c=g.pending.card;
  return {id:c.id,atk:c.card.atk,def:c.card.def,
   level:c.card.level,role:c.roleOverride||CARDS[c.id].role,
   rollQuality:c.rollMath?.quality||null};
 }
 function attackPair(seat,symmetric){
  const {g}=game(10,symmetric);g.seed=196778;g.turn=12;g.active=seat;
  const attacker=newInstance(g,catalog.pred,seat),def=newInstance(g,catalog.guard,1-seat);
  attacker.mode='atk';def.mode='def';
  g.players[seat].field=[attacker,null,null,null,null];
  g.players[1-seat].field=[def,null,null,null,null];
  const beforeLP=g.players.map(p=>p.lp),beforeDEF=def.card.def;
  const result=attack(g,0,0);
  if(!result)throw Error('Attack action failed');
  return {attackOwnLP:beforeLP[seat]-g.players[seat].lp,
   defenderLP:beforeLP[1-seat]-g.players[1-seat].lp,
   remainingDef:g.players[1-seat].field[0]?.card?.def||0,
   destroyed:g.players[1-seat].field[0]===null,
   damageToDef:beforeDEF-(g.players[1-seat].field[0]?.card?.def||0),
   fatigue:attacker.attackFatigue||0};
 }
 function passive(seat,symmetric,n){
  const {g}=game(n,symmetric);g.seed=198011;
  g.turn=n;g.active=1-seat;
  const guardian=newInstance(g,catalog.guard,seat);
  const soul=newInstance(g,catalog.soul,seat);
  const predator=newInstance(g,catalog.pred,1-seat);
  guardian.mode='def';soul.mode='def';predator.mode='atk';
  g.players[seat].field=[guardian,soul,null,null,null];
  g.players[1-seat].field=[predator,null,null,null,null];
  window.ArcaneEssenceCombat.statLayer(soul);
  const victimAtk=predator.card.atk,victimDef=predator.card.def;
  const beforeLP=g.players[1-seat].lp;
  const moved=advanceTurn(g);if(!moved)throw Error('Advance failed');
  return {turn:g.turn,soulEnergy:soul.essenceCombat?.soul||0,
   enemyStatsReduced:victimAtk+victimDef-predator.card.atk-predator.card.def,
   enemyLpLost:beforeLP-g.players[1-seat].lp};
 }
 function nStats(n,symmetric){
  const {g,initialShields}=game(n,symmetric);
  const a=newInstance(g,catalog.guard,0),b=newInstance(g,catalog.guard,1);
  return {decay0:creatureDecayRate(g,a,0),
   decay1:creatureDecayRate(g,b,1),initialShields,
   essenceSchool:g.essenceSchool,essenceTier:g.essenceTier,
   soulUnlock:g.strategicTraining.soulUnlockTurn};
 }
 if(seat===0||seat===1)return {stats:nStats(10,true),fusion:fusion(seat,true),
  attack:attackPair(seat,true),passive:passive(seat,true,10),early:passive(seat,true,2)};
 return {symmetric:{stats:nStats(10,true),fusion:[fusion(0,true),fusion(1,true)],
  attack:[attackPair(0,true),attackPair(1,true)],
  passive:[passive(0,true,10),passive(1,true,10)],
  early:[passive(0,true,2),passive(1,true,2)]},
 legacy:{stats:nStats(10,false),fusion:[fusion(0,false),fusion(1,false)],
  attack:[attackPair(0,false),attackPair(1,false)]},
 normal:{
  strategyMode:createGame({mode:'pve',seed:12}).strategicTraining||null,
  pvp:createGame({mode:'pvp',seed:12,strategicTraining:{enabled:true,
    noAttackTurns:10,disableArenaLPDecay:true,symmetricSides:true}}).strategicTraining||null}
 };
}
function run(){return boot({seed:14941234}).run('('+seatAudit.toString()+')()');}
function runSeat(seat){return boot({seed:14941234}).run('('+seatAudit.toString()+')('+seat+')');}
test('research-only controls do not alter regular PvE or PvP',()=>{
 const r=run();assert.equal(r.normal.strategyMode,null);assert.equal(r.normal.pvp,null);
});
test('symmetric seat test neutralizes owner-zero resilience and opening meta effects',()=>{
 const r=run();
 assert.equal(r.symmetric.stats.decay0,r.symmetric.stats.decay1);
 assert.deepEqual(r.symmetric.stats.initialShields,[0,0]);
 assert.equal(r.symmetric.stats.essenceTier,0);
 assert.equal(r.symmetric.stats.soulUnlock,11);
 assert.notEqual(r.legacy.stats.decay0,r.legacy.stats.decay1,
  'Unmasked PvE deliberately demonstrates active player-zero resilience advantage');
});
test('same fusion, same attack and same passive Soul state have equal seat outputs',()=>{
 const left=runSeat(0),right=runSeat(1);
 for(const kind of ['fusion','attack','passive','early'])
  assert.deepEqual(left[kind],right[kind],
   'Unmatched mirrored '+kind+' outputs: '+JSON.stringify([left[kind],right[kind]]));
 assert.ok(left.passive.soulEnergy>0,'Soul must work on attack unlock');
 assert.ok(left.early.soulEnergy>0,'Soul must work on earlier stage');
});
