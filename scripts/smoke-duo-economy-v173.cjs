'use strict';
/* One disposable independent 2v2 profile; no tokens or secrets printed.
 * Simulates disallowed upgrade and recycling attempts against the deployed
 * Edge Function and checks no balances, inventory or revision have changed.
 */
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const catalog=require('../assets/duo-card-catalog-v160.json');
const endpoint='https://cvmtmvruutdneyblumgf.supabase.co/functions/v1/arcane-duo-v2';
function send(input,expected=200){
 const res=execFileSync('curl',['--max-time','35','-sS','-w','\n%{http_code}',
  '-X','POST',endpoint,'-H','Origin: https://raw.githack.com',
  '-H','Content-Type: application/json','--data',JSON.stringify(input)],
  {encoding:'utf8',maxBuffer:1200000});
 const i=res.lastIndexOf('\n'),status=Number(res.slice(i+1)),body=JSON.parse(res.slice(0,i));
 assert.equal(status,expected,JSON.stringify({status,error:body.error}));
 return body;
}
const created=send({type:'profileCreate',name:'QA 2v2 Kartenschmiede'});
const token=created.profileToken,old=created.profile;
assert.equal(old.revision,0);assert.equal(old.essence,0);assert.equal(old.shards,0);
const owned=old.deck[0];
assert.ok(catalog.cards[owned].playable);
const cannotEnhance=send({type:'enhance',profileToken:token,
 expectedRevision:old.revision,cardId:owned},400);
assert.match(cannotEnhance.error,/Essenz|Splitter/);
const cannotRecycle=send({type:'recycle',profileToken:token,
 expectedRevision:old.revision,cardId:owned},400);
assert.match(cannotRecycle.error,/geschützt|freies Exemplar/);
const bogusRecycle=send({type:'recycle',profileToken:token,
 expectedRevision:old.revision,cardId:999999},400);
assert.ok(bogusRecycle.error);
const bogusEnhance=send({type:'enhance',profileToken:token,
 expectedRevision:old.revision,cardId:999999},400);
assert.ok(bogusEnhance.error);
const again=send({type:'profile',profileToken:token}).profile;
assert.equal(again.revision,old.revision);
assert.equal(again.essence,old.essence);
assert.equal(again.shards,old.shards);
assert.deepEqual(again.ownedMain,old.ownedMain);
assert.deepEqual(again.ownedFusions,old.ownedFusions);
assert.deepEqual(again.enhancements,old.enhancements);
console.log('2v2 v17.3 LIVE OK: unowned items rejected, active cards cannot be dismantled, insufficient resources cannot enhance, profile remains unchanged');
