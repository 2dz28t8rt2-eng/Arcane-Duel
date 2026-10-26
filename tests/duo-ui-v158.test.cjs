'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../assets/duo-campaign-core.js');
const ui=require('../assets/duo-battle-ui-v158.js');
const deck=id=>Array(40).fill(id);
const catalog={10:{name:'Wolf',atk:450,def:350},20:{name:'Schild',atk:280,def:400},
 30:{name:'Falke',atk:370,def:260},40:{name:'Bestie',atk:330,def:290}};
const create=()=>core.createLobby({roomId:'duo-v158-check',hostDeck:deck(10),
 enemyDeckA:deck(20),enemyDeckB:deck(40)});
const joined=()=>core.apply(create(),2,{type:'join',name:'Partner',deck:deck(30)});

test('new, waiting, active and finished rooms get unambiguous interface phases',()=>{
 assert.equal(ui.phase(null,0),'not-created');
 assert.equal(ui.phase(create(),0),'waiting');
 assert.equal(ui.phase(joined(),0),'my-turn');
 assert.equal(ui.phase(joined(),2),'other-turn');
 assert.equal(ui.phase({...joined(),status:'finished',winner:0},0),'victory');
 assert.equal(ui.phase({...joined(),status:'finished',winner:1},2),'defeat');
});
test('on the host turn, all hand cards and all seven free slots are selectable',()=>{
 const choices=ui.legalChoices(joined(),0);
 assert.equal(choices.canAct,true);
 assert.equal(choices.hand.length,5);
 assert.deepEqual(choices.freeSlots,[0,1,2,3,4,5,6]);
 assert.deepEqual(choices.attackers,[]);
});
test('the waiting partner, enemy seats and expired rooms cannot request an action',()=>{
 assert.equal(ui.legalChoices(create(),0).canAct,false);
 assert.equal(ui.legalChoices(joined(),2).canAct,false);
 assert.equal(ui.legalChoices(joined(),1).canAct,false);
 assert.equal(ui.legalChoices({...joined(),status:'finished'},0).canAct,false);
});
test('one summon reserves only the selected zone, ends summon choice, and waits for round two',()=>{
 const s=core.apply(joined(),0,{type:'summon',handIndex:3,slot:6},{catalog});
 const choices=ui.legalChoices(s,0);
 assert.equal(s.players[0].field[6].id,10);
 assert.equal(choices.hand.length,0);
 assert.equal(choices.freeSlots.includes(6),false);
 assert.deepEqual(choices.attackers,[]);
 assert.deepEqual(choices.waiting,[6]);
});
test('any ready monster may attack either opposing seat; direct attacks require both empty',()=>{
 const game=joined();game.round=3;
 game.players[0].field[2]={id:10,atk:450,def:350,mode:'atk',used:false,placedRound:2};
 game.players[0].field[5]={id:30,atk:370,def:260,mode:'atk',used:false,placedRound:1};
 game.players[1].field[0]={id:20,atk:280,def:400,mode:'def',used:false,placedRound:1};
 game.players[3].field[6]={id:40,atk:330,def:290,mode:'atk',used:false,placedRound:1};
 const choices=ui.legalChoices(game,0);
 assert.deepEqual(choices.attackers.map(a=>a.slot),[2,5]);
 assert.deepEqual(choices.targets.map(t=>[t.seat,t.slot]),[[1,0],[3,6]]);
 const cmd=ui.attackCommand(choices.attackers[1],choices.targets[1]);
 assert.deepEqual(cmd,{type:'attack',slot:5,targetSeat:3,targetSlot:6});
 const after=core.apply(game,0,cmd,{catalog});
 assert.equal(after.players[0].field[5].used,true);
 assert.equal(after.players[3].field[6],null);
});
test('used attackers are excluded, and direct target command contains explicit null targets',()=>{
 const game=joined();game.round=2;
 game.players[0].field[4]={id:10,atk:450,def:350,mode:'atk',used:false,placedRound:1};
 let choice=ui.legalChoices(game,0);
 assert.deepEqual(choice.targets,[]);
 assert.deepEqual(ui.attackCommand(choice.attackers[0],null),
  {type:'attack',slot:4,targetSeat:null,targetSlot:null});
 game.players[0].field[4].used=true;
 choice=ui.legalChoices(game,0);
 assert.deepEqual(choice.attackers,[]);
 assert.throws(()=>ui.attackCommand(undefined,null),/Angreifer/);
 assert.throws(()=>ui.attackCommand({slot:2},undefined),/Ziel/);
});
test('Lv1 ghost zones contribute legal attack sources and blocked direct-attack targets',()=>{
 const game=joined();game.round=3;
 game.players[0].lv1={perk:true,ghostSlots:[
  {id:10,atk:300,mode:'atk',used:false,placedRound:1}]};
 game.players[1].lv1={perk:false,ghostSlots:[
  {id:20,atk:280,def:500,mode:'def',used:false,placedRound:1}]};
 const choices=ui.legalChoices(game,0);
 assert.deepEqual(choices.attackers.map(x=>[x.slot,x.area]),[[0,'ghost']]);
 assert.deepEqual(choices.targets.map(x=>[x.seat,x.slot,x.area]),[[1,0,'ghost']]);
 assert.deepEqual(ui.attackCommand(choices.attackers[0],choices.targets[0]),
  {type:'attack',slot:0,targetSeat:1,targetSlot:0,
   area:'ghost',targetArea:'ghost'});
 assert.equal(ui.legalChoices(game,2).canAct,false);
});
