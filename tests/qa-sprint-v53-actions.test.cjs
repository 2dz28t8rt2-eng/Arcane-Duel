'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
function gameFixture(){
 const b=boot({seed:531});
 b.exec("profile.rewardQueue=[];game=createGame({mode:'pve',opponentId:1,context:'free',seed:111,starter:0});game.turn=4;game.active=0;uiMode='duel';busy=false;aiRunning=false;hideModal();game.players[0].field.fill(null);game.players[1].field.fill(null);");
 return b;
}
test('spent attack cannot generate a fake projectile, damage or field attack',async()=>{
 const b=gameFixture();
 b.exec("(()=>{const id=RPG_BASE_CARDS.find(c=>c.rpg&&!c.fusionOnly&&!c.ace&&c.level===2).id;const c=newInstance(game,id,0);c.attacked=true;c.mode='atk';game.players[0].field[0]=c;game.selection={type:'field',idx:0};window.__projectiles=0;bolt=()=>{window.__projectiles++};render();})()");
 const before=b.run("({lp:game.players[1].lp,attacked:game.players[0].field[0].attacked})");
 await b.exec("performAttack(0,null)");
 const after=b.run("({lp:game.players[1].lp,projectiles:window.__projectiles,selected:game.selection,attacked:game.players[0].field[0].attacked})");
 assert.equal(before.attacked,true);
 assert.equal(after.lp,before.lp);
 assert.equal(after.projectiles,0);
 assert.equal(after.selected,null);
 assert.equal(after.attacked,true);
});
test('attack cancellation clears selection without spending attack or changing position',()=>{
 const b=gameFixture();
 const r=b.run("(()=>{const c=newInstance(game,RPG_BASE_CARDS.find(c=>c.rpg&&!c.fusionOnly&&!c.ace&&c.level===2).id,0);game.players[0].field[0]=c;game.selection={type:'field',idx:0};const ok=ArcaneQaSprint53.cancelTarget();return {ok,selected:game.selection,attacked:c.attacked,mode:c.mode}})()");
 assert.deepEqual(r,{ok:true,selected:null,attacked:false,mode:'atk'});
});
test('a single hand card and an occupied own zone can produce an actual field fusion',async()=>{
 const b=gameFixture();
 const setup=b.run("(()=>{const g=game,p=g.players[0],id=RPG_BASE_CARDS.find(c=>c.rpg&&!c.fusionOnly&&!c.ace&&c.level===1).id;p.hand=[newInstance(g,id,0)];p.field[0]=newInstance(g,id,0);p.fusionDeck=[...new Set(RPG_FUSIONS.filter(c=>!c.retired&&!c.enemyOnly).map(c=>c.id))];p.remainingFusion=[...p.fusionDeck];const options=fusionOptions(g,[1,1],[p.hand[0],p.field[0]]);g.selection={type:'hand',uid:p.hand[0].uid};return {choice:options[0]?.id??null,original:p.field[0].uid};})()");
 assert.ok(Number.isInteger(setup.choice),'Missing any valid Lv1+Lv1 field fusion template');
 await b.exec("onOwnSlot(0,"+setup.choice+")");
 const r=b.run("({fused:!!game.players[0].field[0]?.fusion,hand:game.players[0].hand.length,pending:!!game.pending,materials:game.players[0].graveyard.length,newUid:game.players[0].field[0]?.uid})");
 assert.equal(r.fused,true);
 assert.equal(r.hand,0);
 assert.equal(r.pending,false);
 assert.ok(r.materials>=2);
 assert.notEqual(r.newUid,setup.original);
});
