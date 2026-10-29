'use strict';
/* Manual integration QA for one fresh isolated online 2v2 room.
 * Use: node scripts/smoke-duo-recovery-v168.cjs
 * Two virtual independent clients use their own 64-hex seat bearer tokens.
 * Run intentionally by hand to avoid exhausting the hourly room creation limit.
 */
const assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const data=require('../assets/duo-card-catalog-v160.json');
const recovery=require('../assets/duo-recovery-v168.js');
const url='https://cvmtmvruutdneyblumgf.supabase.co/functions/v1/arcane-duo-v2';
function post(payload,expected=200){
 const raw=execFileSync('curl',['--max-time','25','-sS','-w','\n%{http_code}',
  '-X','POST',url,'-H','Origin: https://raw.githack.com',
  '-H','Content-Type: application/json','--data',JSON.stringify(payload)],
  {encoding:'utf8',maxBuffer:2000000});
 const at=raw.lastIndexOf('\n'),status=Number(raw.slice(at+1)),body=JSON.parse(raw.slice(0,at));
 assert.equal(status,expected,JSON.stringify({status,error:body.error}));
 return body;
}
const started=post({type:'create',entry:'new',name:'QA Gerät A',
 deck:data.starterMain,fusions:data.starterFusions});
assert.equal(started.seat,0);
const joined=post({type:'join',roomId:started.roomId,invite:started.invite,
 name:'QA Gerät B',deck:data.starterMain,fusions:data.starterFusions});
assert.equal(joined.seat,2);
const base='https://raw.githack.com/2dz28t8rt2-eng/Arcane-Duel/development/duo-campaign-v2.html';
const hostAccess=recovery.parse(new URL(recovery.link(base,started.roomId,started.token)).hash);
const guestAccess=recovery.parse(new URL(recovery.link(base,started.roomId,joined.token)).hash);
assert.notEqual(hostAccess.token,guestAccess.token);
const resumedA=post({type:'state',roomId:hostAccess.roomId,token:hostAccess.token});
const resumedB=post({type:'state',roomId:guestAccess.roomId,token:guestAccess.token});
assert.equal(resumedA.seat,0);assert.equal(resumedB.seat,2);
assert.equal(resumedA.state.revision,resumedB.state.revision);
assert.ok(resumedA.state.players[2].hand.every(x=>x===null));
assert.ok(resumedB.state.players[0].hand.every(x=>x===null));
const invalid=post({type:'state',roomId:started.roomId,token:'f'.repeat(64)},400);
assert.match(invalid.error,/Berechtigung/);
const tooEarly=post({type:'action',roomId:started.roomId,token:guestAccess.token,
 expectedRevision:resumedB.state.revision,action:{type:'end'}},400);
assert.match(tooEarly.error,/anderer Spieler/);
const afterHost=post({type:'action',roomId:started.roomId,token:hostAccess.token,
 expectedRevision:resumedA.state.revision,action:{type:'end'}});
assert.equal(afterHost.state.activeSeat,2);
const stale=post({type:'action',roomId:started.roomId,token:hostAccess.token,
 expectedRevision:resumedA.state.revision,action:{type:'end'}},400);
assert.match(stale.error,/Spielstand geändert/);
const partnerSync=post({type:'state',roomId:guestAccess.roomId,token:guestAccess.token});
assert.equal(partnerSync.state.revision,afterHost.state.revision);
const afterPartner=post({type:'action',roomId:started.roomId,token:guestAccess.token,
 expectedRevision:partnerSync.state.revision,action:{type:'end'}});
assert.equal(afterPartner.state.activeSeat,0);
const returned=post({type:'state',roomId:started.roomId,token:hostAccess.token});
assert.equal(returned.state.revision,afterPartner.state.revision);
console.log('2v2 v16.8 online OK: two independent seats, recovered bearer links, private hands, seat ACL, CAS conflicts and post-reconnect resync');
