'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluateAttack,MODES}=require('./helpers/ai-counterplay-v1575.cjs');
const {evaluateAttack:previous}=require('./helpers/ai-stomp-v1574.cjs');
const card=(atk,def,kind='predator')=>({uid:Math.random(),card:{atk,def},
 role:kind,mode:'atk'});
const value=c=>c?.card?c.card.atk*.55+c.card.def*.45:0;
const data=c=>c.card;
const role=c=>c.role;
const initial=()=>{
 const attacker=card(1000,1200,'combatant');attacker.fusion=true;
 attacker.materialsUsed=4;
 const side=card(350,350),primary=card(500,300);
 const game={active:0,players:[{lp:6000,field:[attacker]},
  {lp:6000,field:[side,primary]}]};
 const trial=structuredClone(game);trial.players[0].field[0].card.atk=910;
 trial.players[0].field[0].card.def=1092;
 trial.players[1].field[0]=null;
 const result={stomp:{hits:[{index:0,destroyed:true,defLost:0}]}};
 return {game,trial,result,ai:0,di:1,cardValue:value,dataOf:data,role};
};

test('all four causal modes are named in advance',()=>{
 assert.deepEqual(MODES,['baseline','splash-only','fatigue-only','reply-aware']);
});
test('baseline matches the frozen v15.74 attack scorer exactly',()=>{
 const scene=initial();
 assert.equal(evaluateAttack({...scene,mode:'baseline'}).score,previous(scene).score);
});
test('ablation changes scores, never the supplied legal trial or combat result',()=>{
 const scene=initial(),before=JSON.stringify([scene.game,scene.trial,scene.result]);
 const base=evaluateAttack({...scene,mode:'baseline'});
 const splash=evaluateAttack({...scene,mode:'splash-only'});
 const fatigue=evaluateAttack({...scene,mode:'fatigue-only'});
 assert.ok(splash.score>base.score,'ignoring fatigue should favor wide attacks');
 assert.ok(fatigue.score<base.score,'ignoring splash should lower attack value');
 assert.equal(JSON.stringify([scene.game,scene.trial,scene.result]),before);
});
test('reply search accepts only an executable attack and keeps real game intact',()=>{
 const scene=initial();scene.game.players[1].field[0]=card(970,250);
 scene.trial.players[1].field[0]=structuredClone(scene.game.players[1].field[0]);
 const before=JSON.stringify(scene.game);
 const res=evaluateAttack({...scene,mode:'reply-aware',attack:(copy,i,di)=>{
  assert.equal(copy.active,1);assert.equal(i,0);assert.equal(di,0);
  copy.players[0].field[0]=null;
  return {destroyed:['0:0']};
 }});
 assert.equal(res.replyTrials,1);
 assert.equal(res.replyKills,1);
 assert.equal(JSON.stringify(scene.game),before);
});
test('unknown scorer modes fail closed',()=>{
 assert.throws(()=>evaluateAttack({...initial(),mode:'unsafe'}),/Unknown v15.75/);
});
