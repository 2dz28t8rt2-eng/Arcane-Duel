'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(base,file),'utf8');
const ctx={window:{}};
vm.runInNewContext(read('assets/collection-rewards-v184.js'),ctx);
const rewards=ctx.window.ArcaneCollectionRewards184;

test('Solo summary counts only actually owned and playable cards; new discoveries are not invented',()=>{
 const templates=[
  {id:1,rpg:true,level:2,name:'Anfang',fusionOnly:false},
  {id:2,rpg:true,level:6,name:'Seltene Fusion',fusionOnly:true,rarity:'rare'},
  {id:3,rpg:true,level:9,name:'ACE',ace:true},
  {id:4,rpg:true,level:10,name:'Unbekannt'},
  {id:5,rpg:true,level:10,name:'Gegner',enemyOnly:true},
  {id:6,rpg:true,level:10,name:'Ausgedient',retired:true}
 ];
 const player={inventory:{1:2,2:1,3:1,5:1,6:1},unseen:[2,4]};
 const before=JSON.stringify(player);
 const summary=rewards.soloSummary(templates,player);
 assert.equal(summary.varieties,3);
 assert.equal(summary.copies,4);
 assert.equal(summary.fusions,1);
 assert.equal(summary.highlights,2);
 assert.equal(summary.newCards,1);
 assert.equal(summary.highest,9);
 assert.equal(JSON.stringify(player),before,'Display statistics cannot alter the save');
});

test('Duo summary always uses the separate owned 2v2 economy rows',()=>{
 const rows=[
  {id:4,name:'Begleiter',level:3,quantity:3,fusion:false,enhancement:1},
  {id:5,name:'Höhere Fusion',level:7,quantity:1,fusion:true,enhancement:0},
  {id:6,name:'Nicht besessen',level:10,quantity:0,fusion:true,enhancement:5}
 ];
 const before=JSON.stringify(rows),sum=rewards.duoSummary(rows);
 assert.equal(sum.varieties,2);
 assert.equal(sum.copies,4);
 assert.equal(sum.fusions,1);
 assert.equal(sum.enhanced,1);
 assert.equal(sum.highest,7);
 assert.equal(JSON.stringify(rows),before);
});

test('v18.4 is wired into solo, duo and monster gallery without reward or AI changes',()=>{
 const solo=read('index.html'),duo=read('duo-campaign-v2.html'),gallery=read('collection-v3.html');
 const logic=read('assets/duo-parity-v160.js'),render=read('assets/collection-v3.js');
 assert.match(solo,/collection-rewards-v184\.js/);
 assert.match(duo,/collection-rewards-v184\.js/);
 assert.match(duo,/id="ad184-duo-collection-showcase"/);
 assert.match(logic,/ArcaneCollectionRewards184\?\.duoCollection/);
 assert.match(gallery,/id="typeFilter"/);
 assert.match(gallery,/id="catalogSpotlight"/);
 assert.ok(render.includes("cards.length+' Kartenvorlagen'"));
 assert.doesNotMatch(read('assets/collection-rewards-v184.js'),/saveProfile\(|localStorage\.setItem|createReward\(/);
});
