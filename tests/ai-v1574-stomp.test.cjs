'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {forecastStomp,evaluateAttack,enumerateLargeFusions}=require('./helpers/ai-stomp-v1574.cjs');
const runtime=boot({seed:15740042});
const stomp=runtime.ctx.ArcaneFusionStomp;
const value=c=>c.card.atk*.55+c.card.def*.45;
const data=c=>c.card;
const role=c=>c.role||'predator';
const card=(atk,def,mode='atk',kind='predator')=>({card:{atk,def},mode,role:kind});

test('the new training policy accepts the current v20.3 Stomp runtime',()=>{
 assert.equal(stomp.version,'20.3');
 assert.throws(()=>forecastStomp({monster:{materialsUsed:5},enemyField:[],
  dataOf:data,cardValue:value,role,stompEngine:{}}),/actual v20.0 Stomp runtime/);
 assert.equal(typeof enumerateLargeFusions,'function');
});

test('wide enemy boards offer Stomp value; two-material monsters get none',()=>{
 const monster={materialsUsed:5,card:{atk:1300,def:1300},stompBonusPP:0};
 const enemies=[card(550,430),card(570,460),card(500,400),card(610,430),card(580,440)];
 const five=forecastStomp({monster,enemyField:enemies,owner:0,
  stompEngine:stomp,cardValue:value,dataOf:data,role});
 const two=forecastStomp({monster:{...monster,materialsUsed:2},enemyField:enemies,owner:0,
  stompEngine:stomp,cardValue:value,dataOf:data,role});
 assert.ok(five.value>0);assert.equal(five.targets,4);
 assert.equal(two.targets,0);assert.equal(two.value,0);
});

test('material expense makes the Predator reply window visible to the model',()=>{
 const monster={materialsUsed:5,card:{atk:1000,def:1200},stompBonusPP:0};
 const enemies=[card(900,300),card(100,200),card(100,200),card(100,200),card(100,200)];
 const r=forecastStomp({monster,enemyField:enemies,owner:0,
  stompEngine:stomp,cardValue:value,dataOf:data,role});
 assert.equal(r.predatorReply,1);assert.equal(r.targets,4);
 assert.ok(r.exposure>0);
});

test('attack learner credits secondary kills and debits ATK+DEF exhaustion',()=>{
 const attacker=card(1000,1200),splash=card(400,300),primary=card(100,200);
 const game={active:0,players:[{field:[attacker]},{field:[splash,primary]}]};
 const trial={players:[{field:[card(940,1128)]},{field:[null,null]}]};
 const result={stomp:{hits:[{index:0,destroyed:true,defLost:0}]}};
 const report=evaluateAttack({game,trial,result,ai:0,di:1,cardValue:value,dataOf:data,role});
 assert.equal(report.splashKills,1);
 assert.ok(report.fatigue>0);
 assert.ok(report.score>0);
});
