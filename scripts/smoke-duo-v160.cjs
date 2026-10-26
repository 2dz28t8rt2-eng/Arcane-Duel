'use strict';
/* Manual online smoke. Creates ONE disposable room with real 40-card decks,
 * verifies invite, 4-seat turn order, server validation and private hands.
 * Requires HTTPS access and a deployed isolated arcane-duo-v2 function.
 */
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const snapshot=require('../assets/duo-card-catalog-v160.json');
const url='https://cvmtmvruutdneyblumgf.supabase.co/functions/v1/arcane-duo-v2';
function post(data,expected=200){
 const out=execFileSync('curl',['--max-time','25','-sS','-w','\n%{http_code}',
  '-X','POST',url,'-H','Origin: https://raw.githack.com',
  '-H','Content-Type: application/json','--data',JSON.stringify(data)],
 {encoding:'utf8',maxBuffer:2e6});
 const i=out.lastIndexOf('\n'),code=Number(out.slice(i+1)),body=JSON.parse(out.slice(0,i));
 assert.equal(code,expected,JSON.stringify({status:code,error:body.error}));
 return body;
}
const deck=snapshot.starterMain,fusions=snapshot.starterFusions;
const host=post({type:'create',name:'Parity QA',entry:'new',deck,fusions});
assert.equal(host.state.schema,2);
assert.equal(host.state.status,'waiting');
assert.ok(host.invite);
const guest=post({type:'join',roomId:host.roomId,invite:host.invite,
 name:'Partner QA',deck,fusions});
assert.equal(guest.seat,2);
assert.deepEqual(guest.state.players.map(p=>p.hand.length),[5,5,5,5]);
assert.equal(guest.state.players[0].hand[0],null);
const blocked=post({type:'action',roomId:host.roomId,token:guest.token,
 expectedRevision:guest.state.revision,action:{type:'end'}},400);
assert.match(blocked.error,/anderer Spieler/);
const summoned=post({type:'action',roomId:host.roomId,token:host.token,
 expectedRevision:guest.state.revision,action:{type:'summon',handIndex:0,slot:0}});
assert.equal(snapshot.cards[summoned.state.players[0].field[0].id].playable,true);
const afterHost=post({type:'action',roomId:host.roomId,token:host.token,
 expectedRevision:summoned.state.revision,action:{type:'end'}});
assert.equal(afterHost.state.activeSeat,2,'The AI must finish seat 1 server-side');
const afterGuest=post({type:'action',roomId:host.roomId,token:guest.token,
 expectedRevision:afterHost.state.revision,action:{type:'end'}});
assert.equal(afterGuest.state.activeSeat,0,'The AI must finish seat 3 server-side');
const checked=post({type:'state',roomId:host.roomId,token:host.token});
assert.equal(checked.state.revision,afterGuest.state.revision);
assert.equal(checked.state.players[2].hand.every(c=>c===null),true);
console.log('Online 2v2 v16.0: lobby, join, sealed hands, protected turn, summon, AI turn cycle and persisted state OK.');
