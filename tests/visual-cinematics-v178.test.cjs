'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const hand=require('../assets/duo-hand-cinema-v178.js');
const packs=require('../assets/pack-cinema-v178.js');
const source=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

test('2v2 draw highlights newly drawn card positions, not all existing hand cards',()=>{
 assert.deepEqual(hand.drawIndices([1,2,3,4],[2,3,4,5],1),[3]);
 assert.deepEqual(hand.drawIndices([1,2,3],[1,2,3,4,5],2),[3,4]);
 assert.deepEqual(hand.drawIndices([1,1,2,3],[1,2,3,1],1),[3]);
 assert.deepEqual(hand.drawIndices([1,2,3],[1,2,3],0),[]);
});
test('2v2 draw does not reveal nonexistent cards',()=>{
 assert.deepEqual(hand.drawIndices([],[],5),[]);
 assert.deepEqual(hand.drawIndices([],[1,2,3],5),[0,1,2]);
});
test('pack reveal preserves only the actual server/game result and avoids unsafe artwork URLs',()=>{
 const result=packs.normalize([
  {id:8,name:'Himmlischer Wächter',level:7,art:'assets/guardian.png',fusion:true},
  {name:'Geheimnis',level:2,art:'javascript:alert(1)'}
 ]);
 assert.equal(result.length,2);
 assert.deepEqual(result[0],{name:'Himmlischer Wächter',level:7,
  art:'assets/guardian.png',fusion:true,ace:false});
 assert.equal(result[1].art,'');
 assert.deepEqual(packs.normalize([]),[]);
});
test('LP completion triggers the initial hand reveal; solo booster opens only after success',()=>{
 const battle=source('assets/arcane-battle-fx.js');
 const handScript=source('assets/hand-draw-v1161.js');
 const solo=source('assets/solo-pack-bridge-v178.js');
 assert.match(battle,/await window\.ArcaneHandDraw1161\?\.revealOpeningHand/);
 assert.match(battle,/ad-opening-hand-wait/);
 assert.match(handScript,/revealOpeningHand/);
 assert.match(solo,/if\(result&&profile\?\.lastBooster\?\.cards\?\.length\)/);
});
test('both game modes load the booster cinema; 2v2 grants are server-confirmed',()=>{
 const solo=source('index.html'),duo=source('duo-campaign-v2.html');
 const parity=source('assets/duo-parity-v160.js');
 for(const html of [solo,duo]){
  assert.match(html,/pack-cinema-v178\.js/);
  assert.match(html,/pack-cinema-v178\.css/);
 }
 assert.match(duo,/duo-hand-cinema-v178\.js/);
 assert.match(parity,/type==='pack'&&Array\.isArray\(data\.newCards\)/);
 assert.match(parity,/ArcaneDuoHand178\?\.sync/);
});
