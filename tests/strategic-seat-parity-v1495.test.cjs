'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
function stateProbe(n,seat,phase){
 profile=freshProfile();profile.guideSeen=true;
 for(const k of Object.keys(profile.upgrades||{}))profile.upgrades[k]=0;
 const g=createGame({mode:'pve',context:'free',opponentId:0,
  difficulty:'hard',seed:1495123,starter:0,
  strategicTraining:{enabled:true,noAttackTurns:n,
   disableArenaLPDecay:true,symmetricSides:true}});
 const ids={
  soul:CARDS.find(c=>c.role==='soul'&&c.level>=3&&!c.fusionOnly)?.id,
  guard:CARDS.find(c=>c.role==='guardian'&&c.level>=3&&!c.fusionOnly)?.id,
  pred:CARDS.find(c=>c.role==='predator'&&c.level>=3&&!c.fusionOnly)?.id};
 if(Object.values(ids).some(id=>!Number.isInteger(id)))throw Error('missing role');
 for(const p of g.players){p.shield=0;p.power=1;p.flatBonus=0;p.enhancements={};}
 const actor=g.players[seat],foe=g.players[1-seat],soul=newInstance(g,ids.soul,seat);
 soul.mode='def';
 const victim=newInstance(g,ids.pred,1-seat);victim.mode='def';
 const helper=newInstance(g,ids.guard,seat);helper.mode='def';
 actor.field=[soul,helper,null,null,null];
 foe.field=[victim,null,null,null,null];
 g.fateUsed=[true,true];
 g.active=seat;g.turn=phase;g.aiPhase='attacks';g.pending=null;g.summoned=true;
 const before={atk:victim.card.atk,def:victim.card.def,lp:foe.lp};
 const choice=chooseAiAction(g,'balanced');
 const proposed={type:'soul-raid',idx:0,target:0};
 const applied=applyAiAction(g,proposed);
 return {unlock:g.strategicTraining.soulUnlockTurn,choice:choice?.type||null,
  permitted:!!applied,energy:soul.essenceCombat?.soul||0,
  cooldown:soul.essenceCombat?.raidCooldown||0,
  stolen:before.atk+before.def-victim.card.atk-victim.card.def,
  lpLost:before.lp-foe.lp,attemptAgain:!!applyAiAction(g,proposed),
  sampledAction:applied?.type||null};
}
function run(n,seat,turn){return boot({seed:1495123}).run('('+stateProbe.toString()+')('+[n,seat,turn].join(',')+')');}
test('Soul raid availability is legal on BOTH seats exactly when attacks unlock',()=>{
 for(const n of [0,2,4,6,8,10])for(const seat of [0,1]){
  const last=Math.max(1,n),first=Math.max(2,n+1);
  const locked=run(n,seat,last),open=run(n,seat,first);
  assert.equal(locked.permitted,false,JSON.stringify({n,seat,locked}));
  assert.equal(locked.stolen,0);
  assert.equal(open.permitted,true,JSON.stringify({n,seat,open}));
  assert.equal(open.choice,'soul-raid');
  assert.ok(open.stolen>0);
  assert.ok(open.energy>0);
  assert.equal(open.attemptAgain,false);
  assert.equal(open.cooldown,3);
  assert.equal(open.lpLost,0,'Targeted Raid is value extraction, not direct LP Burn');
 }
});
test('identical legal Soul Raid and tactical opponent have equal seat outcome',()=>{
 for(const n of [0,6,10]){
  const turn=Math.max(2,n+1),a=run(n,0,turn),b=run(n,1,turn);
  assert.deepEqual(a,b,JSON.stringify({n,a,b}));
 }
});
test('regular nonresearch PvE does not activate symmetric Soul actions',()=>{
 const data=boot({seed:1495123}).run('(()=>createGame({mode:"pve",context:"free",seed:1495123}).strategicTraining||null)()');
 assert.equal(data,null);
});
