'use strict';
/* Manual online smoke. Creates ONE disposable room with real 40-card decks,
 * verifies invite, 4-seat turn order, server validation, private hands and
 * the v16.1 DEF/Soul active abilities without altering any existing room.
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
// Slots 0–2 are chapter loan cards; put Soul in slot 3 so it survives replacement.
const hostDeck=[...deck.slice(0,3),387,...deck.slice(4)];
const host=post({type:'create',name:'Parity QA',entry:'new',deck:hostDeck,fusions});
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
 expectedRevision:guest.state.revision,action:{type:'summon',handIndex:3,slot:0}});
assert.equal(snapshot.cards[summoned.state.players[0].field[0].id].playable,true);
assert.equal(summoned.state.players[0].field[0].role,'soul');
const defended=post({type:'action',roomId:host.roomId,token:host.token,
 expectedRevision:summoned.state.revision,action:{type:'switch',slot:0}});
assert.equal(defended.state.players[0].field[0].mode,'def');
const focused=post({type:'action',roomId:host.roomId,token:host.token,
 expectedRevision:defended.state.revision,action:{type:'soulFocus',slot:0,stat:'def'}});
assert.equal(focused.state.players[0].field[0].drainPreference,2);
const rejectedFocus=post({type:'action',roomId:host.roomId,token:host.token,
 expectedRevision:focused.state.revision,action:{type:'soulFocus',slot:0,stat:'atk'}},400);
assert.match(rejectedFocus.error,/Fokus in diesem Zug/);
const afterHost=post({type:'action',roomId:host.roomId,token:host.token,
 expectedRevision:focused.state.revision,action:{type:'end'}});
assert.equal(afterHost.state.activeSeat,2,'The AI must finish seat 1 server-side');
const afterGuest=post({type:'action',roomId:host.roomId,token:guest.token,
 expectedRevision:afterHost.state.revision,action:{type:'end'}});
assert.equal(afterGuest.state.activeSeat,0,'The AI must finish seat 3 server-side');
assert.ok(afterGuest.state.players[0].field[0].soul>0,'Passive soul drain must collect energy');
assert.ok(afterGuest.state.teams[1].lp<16000,'Passive Soulbrand must hurt team LP');
assert.ok(afterGuest.state.players[1].field[0],'AI seat 1 should have a legal raid target');
const raided=post({type:'action',roomId:host.roomId,token:host.token,
 expectedRevision:afterGuest.state.revision,
 action:{type:'soulRaid',slot:0,targetSeat:1,targetSlot:0}});
assert.equal(raided.state.players[0].field[0].raidCooldown,3);
assert.equal(raided.state.players[0].field[0].decaySkipOwnTurn,raided.state.players[0].ownTurns);
const checked=post({type:'state',roomId:host.roomId,token:host.token});
assert.equal(checked.state.revision,raided.state.revision);
assert.equal(checked.state.players[2].hand.every(c=>c===null),true);
console.log('Online 2v2 v16.1: invite, sealed hands, seat order, persistence, DEF, focus, Soulbrand and Soul raid OK.');
