'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {boot}=require('./helpers/game-runtime.cjs');
function setup(){
 const b=boot({seed:4681});
 b.exec("profile=freshProfile();profile.lv1Saga.perk=true;game=createGame({mode:'pve',opponentId:1,seed:877,context:'free'});game.active=0;game.turn=6;game.pending=null;game.winner=null;game.players[0].field.fill(null);game.players[1].field.fill(null);");
 return b;
}
test('special Level-1 fusions require 3-5 exact Level-1 materials and their own unlocked stage',()=>{
 const r=setup().run("(()=>{const g=game,p=g.players[0],id=ArcaneLv1Swarm.ids.hive,cid=RPG_BASE_CARDS.find(c=>c.rpg&&c.level===1&&!c.fusionOnly&&!c.ace).id,high=RPG_BASE_CARDS.find(c=>c.rpg&&c.level===2&&!c.fusionOnly).id;p.remainingFusion.push(id);const cards=n=>Array.from({length:n},()=>newInstance(g,cid,0)),check=cs=>fusionOptions(g,cs.map(x=>dataOf(x).level),cs).some(x=>x.id===id);const results=[check(cards(2)),check(cards(3)),check(cards(4)),check(cards(5)),check([...cards(2),newInstance(g,high,0)])];const strict=ArcaneLv1Swarm.specialFusionLegal(g,[1,1,1],[...cards(2),newInstance(g,high,0)]);return {results,strict};})()");
 assert.deepEqual(r.results,[false,true,true,true,false]);assert.equal(r.strict,false);
});
test('three real Lv1 hand materials create the specialized Lv1 class exactly once',()=>{
 const r=setup().run("(()=>{const g=game,p=g.players[0],id=ArcaneLv1Swarm.ids.hive,cid=RPG_BASE_CARDS.find(c=>c.level===1&&!c.fusionOnly&&!c.ace).id;const ms=[0,1,2].map(()=>newInstance(g,cid,0));p.hand=[...ms];p.remainingFusion.push(id);const blocked=prepareHandFusion(g,ms.slice(0,2).map(x=>x.uid),id);const made=prepareHandFusion(g,ms.map(x=>x.uid),id);return {blocked,made,lv:g.pending?.card.card.level,kind:g.pending?.card.id,consumed:p.hand.length,grave:p.graveyard.length,stock:p.remainingFusion.filter(x=>x===id).length};})()");
 assert.equal(r.blocked,false);assert.equal(r.made,true);assert.equal(r.lv,1);assert.ok(Number.isInteger(r.kind));assert.equal(r.consumed,0);assert.equal(r.grave,3);assert.equal(r.stock,0);
});
test('ghost slots accept only movement from field and spend the monster action on entry and return',()=>{
 const r=setup().run("(()=>{const g=game,p=g.players[0],id=RPG_BASE_CARDS.find(c=>c.level===2&&!c.fusionOnly&&!c.ace).id,c=newInstance(g,id,0),s=ArcaneLv1Swarm.state(g);s.ghostSlots=[null];p.hand=[c];const fromHand=ArcaneLv1Swarm.station(g,0,'hand',0);p.hand=[];p.field[2]=c;const moved=ArcaneLv1Swarm.station(g,0,'field',2),sameTurnAttack=ArcaneLv1Swarm.ghostAttack(g,0,null),sameTurnReturn=ArcaneLv1Swarm.returnFromGhost(g,0,0);g.turn+=2;c.attacked=false;c.switched=false;const returned=ArcaneLv1Swarm.returnFromGhost(g,0,0);return {fromHand,moved,sameTurnAttack,sameTurnReturn,returned,field:p.field[0]===c,spent:c.attacked&&c.switched};})()");
 assert.deepEqual(r,{fromHand:false,moved:true,sameTurnAttack:false,sameTurnReturn:false,returned:true,field:true,spent:true});
});
test('ghost combat zones are valid direct targets even while the main battlefield is occupied',()=>{
 const r=setup().run("(()=>{const g=game,p=g.players[0],e=g.players[1],base=ArcaneLv1Swarm.ids.hive,foe=RPG_BASE_CARDS.find(c=>c.level===4&&!c.fusionOnly).id,c=newInstance(g,base,0),other=newInstance(g,base,0),enemy=newInstance(g,foe,1),s=ArcaneLv1Swarm.state(g);c.card.def=1800;e.field[0]=enemy;p.field[0]=other;s.ghostSlots=[{kind:'card',card:c}];g.active=1;enemy.card.atk=115;enemy.summonedTurn=1;const before=c.card.def;const result=attack(g,0,5);return {result:!!result,ghostDamaged:c.card.def<before,stillGhost:s.ghostSlots[0]?.card===c,mainUnaffected:p.field[0]===other};})()");
 assert.equal(r.result,true);assert.equal(r.ghostDamaged,true);assert.equal(r.stillGhost,true);assert.equal(r.mainUnaffected,true);
});
test('ghost cards count as Nekroth revival costs and are sacrificed instead of empty capacity',()=>{
 const r=setup().run("(()=>{const g=game,p=g.players[0],e=g.players[1],h=newInstance(g,ArcaneLv1Swarm.ids.hive,0),id=RPG_BASE_CARDS.find(c=>c.level===1&&!c.fusionOnly&&!c.ace).id,sacrifice=newInstance(g,id,0),enemy=newInstance(g,RPG_BASE_CARDS.find(c=>c.level===5&&!c.fusionOnly).id,1),s=ArcaneLv1Swarm.state(g);h.card.def=10;h.lv1Full={atk:130,def:610};h.fusion=true;p.field[0]=h;e.field[0]=enemy;enemy.card.atk=2000;enemy.summonedTurn=1;s.ghostSlots=[null,{kind:'card',card:sacrifice}];g.active=1;const hit=attack(g,0,0);return {hit:!!hit,resurrected:p.field[0]===h,restored:h.card.def>=600,used:s.ghostSlots[1]===null,unspent:s.ghostSlots[0]===null,grave:p.graveyard.some(x=>x.uid===sacrifice.uid)};})()");
 assert.deepEqual(r,{hit:true,resurrected:true,restored:true,used:true,unspent:true,grave:true});
});
test('fusion selector considers every marked hand card rather than silently slicing to two',()=>{
 const src=fs.readFileSync(path.join(__dirname,'../assets/game.js'),'utf8');
 assert.match(src,/const uids=\[\.\.\.game\.materials\],materials=uids\.map\(/);
 assert.match(src,/fusionOptions\(game,levels,materials\)/);
 assert.doesNotMatch(src,/materials=uids\.slice\(-2\)/);
});

test('four and five selected normal fusion materials all feed the actual rolls and enter graveyard',()=>{
 const r=setup().run("(()=>{const g=game,p=g.players[0],id=RPG_BASE_CARDS.find(c=>c.level===1&&!c.fusionOnly&&!c.ace).id,fusion=p.remainingFusion[0],m=Array.from({length:5},()=>newInstance(g,id,0));p.hand=[...m];const ok=prepareHandFusion(g,m.map(c=>c.uid),fusion);return {ok,used:g.pending?.card.materialsUsed,grave:p.graveyard.length,hand:p.hand.length,levelCount:g.pending?.levels.length,rolled:g.pending?.card.rollMath?.combo?.materialCount};})()");
 assert.deepEqual(r,{ok:true,used:5,grave:5,hand:0,levelCount:5,rolled:5});
});
