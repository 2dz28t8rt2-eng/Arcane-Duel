'use strict';
/* Isolated online negative test of v17.4 first-clear card claims.
 * No secrets printed; only one disposable 2v2 profile created.
 */
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const endpoint='https://cvmtmvruutdneyblumgf.supabase.co/functions/v1/arcane-duo-v2';
function call(body,expected=200){
 const raw=execFileSync('curl',['--max-time','35','-sS','-w','\n%{http_code}',
  '-X','POST',endpoint,'-H','Origin: https://raw.githack.com',
  '-H','Content-Type: application/json','--data',JSON.stringify(body)],
  {encoding:'utf8',maxBuffer:1200000});
 const mark=raw.lastIndexOf('\n'),status=Number(raw.slice(mark+1)),
  parsed=JSON.parse(raw.slice(0,mark));
 assert.equal(status,expected,JSON.stringify({status,error:parsed.error}));
 return parsed;
}
const newProfile=call({type:'profileCreate',name:'QA v174 Pacing'});
const token=newProfile.profileToken,first=newProfile.profile;
assert.equal(first.chapterCardCredits,0);
assert.equal(first.revision,0);
assert.equal(newProfile.economy.rewards.length,4);
assert.deepEqual(newProfile.economy.rewards[0].first,
 {xp:60,essence:105,shards:2,chapterCards:3});
const refused=call({type:'chapterCard',profileToken:token,
 expectedRevision:first.revision},400);
assert.match(refused.error,/Keine offenen Kapitel-Kartenbelohnungen/);
const after=call({type:'profile',profileToken:token}).profile;
assert.equal(after.revision,first.revision);
assert.deepEqual(after.ownedMain,first.ownedMain);
assert.equal(after.chapterCardCredits,0);
assert.equal(after.essence,first.essence);
assert.equal(after.shards,first.shards);
console.log('2v2 v17.4 LIVE OK: chapter rewards exposed, unearned card claims denied, inventory/revision/currencies unchanged');
