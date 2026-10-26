'use strict';
/* One-time isolated online verification of 2v2 v17.2 economy routes.
 * Creates just one disposable 2v2-only profile, does not print any secret.
 */
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const url='https://cvmtmvruutdneyblumgf.supabase.co/functions/v1/arcane-duo-v2';
function post(payload,expected=200){
 const raw=execFileSync('curl',['--max-time','35','-sS','-w','\n%{http_code}',
  '-X','POST',url,'-H','Origin: https://raw.githack.com',
  '-H','Content-Type: application/json','--data',JSON.stringify(payload)],
  {encoding:'utf8',maxBuffer:1000000});
 const i=raw.lastIndexOf('\n'),status=Number(raw.slice(i+1)),res=JSON.parse(raw.slice(0,i));
 assert.equal(status,expected,JSON.stringify({status,error:res.error}));
 return res;
}
const created=post({type:'profileCreate',name:'QA 2v2 Wirtschaft'});
const tok=created.profileToken,base=created.profile;
assert.equal(base.essence,0);assert.equal(base.shards,0);
const state=post({type:'profile',profileToken:tok});
assert.deepEqual(Object.keys(state.economy.packs).sort(),
 ['essence','fusion','fusion10','fusion3','fusion5','material3','normal'].sort());
assert.equal(state.economy.lv1.rank,0);
assert.equal(state.economy.lv1.unlocked,false);
assert.equal(state.economy.essence.unlocked,false);
assert.equal(state.economy.maxCardLevel,3);
for(const type of ['normal','fusion','essence','material3','fusion3','fusion5','fusion10']){
 const result=post({type:'pack',pack:type,profileToken:tok,
  expectedRevision:base.revision},400);
 assert.match(result.error,/Nicht genug/);
}
const notUnlocked=post({type:'research',branch:'lv1',profileToken:tok,
 expectedRevision:base.revision},400);
assert.match(notUnlocked.error,/Kapitel/);
const invalid=post({type:'research',branch:'madeup',profileToken:tok,
 expectedRevision:base.revision},400);
assert.match(invalid.error,/Unbekannt/);
post({type:'bindEssence',cardId:396,profileToken:tok,
 expectedRevision:base.revision},400);
const after=post({type:'profile',profileToken:tok});
assert.equal(after.profile.revision,base.revision);
assert.deepEqual(after.profile.ownedMain,base.ownedMain);
assert.deepEqual(after.profile.ownedFusions,base.ownedFusions);
assert.equal(after.profile.essence,0);
console.log('2v2 economy ONLINE OK: 7 packet offers, solo-independent research gates, denied unaffordable purchases, no inventory or currency mutation');
