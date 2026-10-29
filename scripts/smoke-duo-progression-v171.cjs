'use strict';
/* One-time live smoke for independent 2v2 progression.
 * Run only when explicitly requested: two disposable profiles + one room.
 * No token or secret is printed.
 */
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const catalog=require('../assets/duo-card-catalog-v160.json');
const url='https://cvmtmvruutdneyblumgf.supabase.co/functions/v1/arcane-duo-v2';
function post(payload,expected=200){
 const raw=execFileSync('curl',['--max-time','35','-sS','-w','\n%{http_code}',
 '-X','POST',url,'-H','Origin: https://raw.githack.com',
 '-H','Content-Type: application/json','--data',JSON.stringify(payload)],
 {encoding:'utf8',maxBuffer:2000000});
 const i=raw.lastIndexOf('\n'),code=Number(raw.slice(i+1)),body=JSON.parse(raw.slice(0,i));
 assert.equal(code,expected,JSON.stringify({code,error:body.error}));
 return body;
}
const suffix=Date.now().toString(36);
const A=post({type:'profileCreate',name:'QA 2v2 Gastgeber '+suffix});
const B=post({type:'profileCreate',name:'QA 2v2 Partner '+suffix});
assert.ok(A.profileToken&&B.profileToken&&A.profileToken!==B.profileToken);
assert.equal(A.profile.xp,0);
assert.equal(A.profile.essence,0);
assert.deepEqual(A.profile.clearedChapters,[]);
assert.deepEqual(A.profile.deck,catalog.starterMain);
assert.deepEqual(A.profile.fusions,catalog.starterFusions);
const refetch=post({type:'profile',profileToken:A.profileToken});
assert.equal(refetch.profile.id,A.profile.id);
const cheating=post({type:'upgrade',profileToken:A.profileToken,key:'power',
 expectedRevision:A.profile.revision},400);
assert.match(cheating.error,/Essenz/);
const tamperDeck=Array(40).fill(catalog.starterMain[0]);
const room=post({type:'create',entry:'new',profileToken:A.profileToken,
 deck:tamperDeck,fusions:[-99],upgrades:{power:10},lv1:{perk:true,rank:5},
 enhancements:{},essence:{chosen:12345}});
assert.equal(room.state.players[0].upgrades.power||0,0);
assert.ok(room.state.players[0].hand.every(id=>catalog.cards[id]?.playable));
assert.equal(room.state.players[0].lv1.perk,false);
const invited=post({type:'join',roomId:room.roomId,invite:room.invite,
 profileToken:B.profileToken,deck:tamperDeck,upgrades:{power:10}});
assert.equal(invited.state.players[2].upgrades.power||0,0);
assert.deepEqual(invited.state.players.map(p=>p.kind),['human','ai','human','ai']);
const pA=post({type:'profile',profileToken:A.profileToken});
const pB=post({type:'profile',profileToken:B.profileToken});
assert.equal(pA.lastRoom.roomId,room.roomId);
assert.equal(pA.lastRoom.seat,0);
assert.equal(pB.lastRoom.seat,2);
const aView=post({type:'state',roomId:room.roomId,token:A.profileToken});
const bView=post({type:'state',roomId:room.roomId,token:B.profileToken});
assert.equal(aView.state.revision,bView.state.revision);
assert.ok(aView.state.players[2].hand.every(x=>x===null));
assert.ok(bView.state.players[0].hand.every(x=>x===null));
post({type:'state',roomId:room.roomId,token:'f'.repeat(64)},400);
post({type:'deckReplace',profileToken:A.profileToken,expectedRevision:A.profile.revision,
 zone:'main',slot:0,cardId:999999},400);
const end=post({type:'action',roomId:room.roomId,token:A.profileToken,
 expectedRevision:aView.state.revision,action:{type:'end'}});
assert.equal(end.state.activeSeat,2);
const stale=post({type:'action',roomId:room.roomId,token:A.profileToken,
 expectedRevision:aView.state.revision,action:{type:'end'}},400);
assert.match(stale.error,/Spielstand geändert/);
const partnerView=post({type:'state',roomId:room.roomId,token:B.profileToken});
assert.equal(partnerView.state.revision,end.state.revision);
console.log('2v2 independent progression LIVE OK: 2 server-owned profiles, solo tamper ignored, separate seats, private hands, online save/revision conflict and recovery');
