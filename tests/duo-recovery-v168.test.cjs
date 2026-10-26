'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const session=require('../assets/duo-recovery-v168.js');
const room='abc12345-0123-4abc-8765-aabbccddeeff',host='a'.repeat(64),guest='b'.repeat(64);
test('each of two seats has a distinct recovery link, no invitation secret',()=>{
 const base='https://raw.githack.com/2dz28t8rt2-eng/Arcane-Duel/development/duo-campaign-v2.html';
 const x=session.link(base,room,host),y=session.link(base,room,guest);
 assert.notEqual(x,y);
 assert.equal(session.parse(new URL(x).hash).token,host);
 assert.equal(session.parse(new URL(y).hash).token,guest);
 assert.equal(session.parse(new URL(x).hash).roomId,room);
 assert.equal(session.parse('#room='+room).kind,'room');
});
test('reject malformed hashes, UUIDs and truncated bearer secrets',()=>{
 for(const hash of ['#resume='+room+'.'+host.slice(1),'#resume='+room+'.'+host+'.extra',
 '#join='+room+'.'+guest,'#resume=../'+host,'#room=wrong','#resume=x'])assert.equal(session.parse(hash),null);
 assert.throws(()=>session.link('javascript:alert(1)',room,host),/Ungültiger Seitenlink/);
 assert.throws(()=>session.link('https://example.org',room,'z'.repeat(64)),/Ungültiger Raumzugang/);
});
test('recovery URLs contain token only in fragment and discard search params',()=>{
 const link=session.link('https://raw.githack.com/duo.html?v=cache#room=old',room,host);
 assert.equal(new URL(link).search,'');
 assert.equal(new URL(link).pathname,'/duo.html');
 assert.equal(new URL(link).hash,'#resume='+room+'.'+host);
});
test('conflict detection supports server CAS revision rejection',()=>{
 assert.equal(session.isConflict('Spielstand geändert. Bitte synchronisieren.'),true);
 assert.equal(session.isConflict('Konkurrierender Zug. Bitte synchronisieren.'),true);
 assert.equal(session.isConflict('Netzwerk ausgefallen.'),false);
});
test('bounded retries back off on transient network failures',()=>{
 assert.deepEqual([0,1,2,3,4,5,20].map(session.pollDelay),[2500,5000,10000,20000,30000,30000,30000]);
});
