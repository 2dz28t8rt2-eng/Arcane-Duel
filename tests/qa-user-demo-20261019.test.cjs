'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const evalGame=src=>boot({seed:10209}).run(src);
test('player can fuse a selected hand card directly onto an occupied monster slot',()=>{
 const r=evalGame("(()=>{profile=freshProfile();const g=createGame({mode:'pve',seed:109,opponentId:1,context:'free'});game=g;g.active=0;g.turn=3;const p=g.players[0],c=RPG_BASE_CARDS.find(x=>x.rpg&&x.level===1&&!x.fusionOnly&&!x.ace&&!x.retired),f=RPG_FUSIONS.find(x=>x.level===2&&!x.retired&&!x.enemyOnly);p.field[0]=newInstance(g,c.id,0);p.hand=[newInstance(g,c.id,0)];p.fusionDeck=[f.id,f.id];p.remainingFusion=[f.id,f.id];const uid=p.hand[0].uid;const prepared=prepareNormal(g,uid);const opts=fusionOptions(g,[1,1],[g.pending.card,p.field[0]]).map(c=>c.id);const applied=placePending(g,0,f.id);return {prepared,options:opts.includes(f.id),fused:!!applied?.fused,placed:!!p.field[0]?.fusion,used:p.remainingFusion.length,hand:p.hand.length};})()");
 assert.deepEqual(r,{prepared:true,options:true,fused:true,placed:true,used:1,hand:0});
});
test('player can continue a prepared hand fusion onto an occupied field monster',()=>{
 const r=evalGame("(()=>{profile=freshProfile();const g=createGame({mode:'pve',seed:110,opponentId:1,context:'free'});game=g;g.active=0;g.turn=3;const p=g.players[0],c=RPG_BASE_CARDS.find(x=>x.rpg&&x.level===1&&!x.fusionOnly&&!x.ace&&!x.retired),f=RPG_FUSIONS.find(x=>x.level===2&&!x.retired&&!x.enemyOnly);p.field[0]=newInstance(g,c.id,0);p.hand=[newInstance(g,c.id,0),newInstance(g,c.id,0)];p.fusionDeck=[f.id,f.id,f.id];p.remainingFusion=[f.id,f.id,f.id];const ids=p.hand.map(c=>c.uid);const prepared=prepareHandFusion(g,ids,f.id);const opts=prepared?fusionOptions(g,[...g.pending.levels,1],[g.pending.card,p.field[0]]).map(c=>c.id):[];const applied=prepared?placePending(g,0,f.id):null;return {prepared,options:opts.includes(f.id),fused:!!applied?.fused,placed:!!p.field[0]?.fusion,used:p.remainingFusion.length,hand:p.hand.length};})()");
 assert.deepEqual(r,{prepared:true,options:true,fused:true,placed:true,used:1,hand:0});
});
