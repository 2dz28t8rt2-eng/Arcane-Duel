'use strict';
// One-off integration QA: use real Edge API, independent QA profiles and a
// manually seeded cleared_chapters value on the QA-only advanced profile.
// No credentials or recovery links are printed, saved, or committed.
const assert=require('node:assert/strict');
const snap=require('../assets/duo-card-catalog-v160.json');
const rules=require('../assets/duo-shared-rules-v160.js');
const catalog=Object.fromEntries(snap.cards.map(c=>[c.id,c]));
const endpoint='https://cvmtmvruutdneyblumgf.supabase.co/functions/v1/arcane-duo-v2';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function api(payload){
 const res=await fetch(endpoint,{method:'POST',headers:{Origin:'https://raw.githack.com','Content-Type':'application/json'},
  body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
 const data=await res.json();
 if(!res.ok||data.error)throw Error(data.error||('HTTP '+res.status));
 return data;
}
const profile=token=>api({type:'profile',profileToken:token});
(async()=>{
 const tag=Date.now().toString(36).slice(-7);
 const advanced=await api({type:'profileCreate',name:'QA333 Advanced '+tag});
 const beginner=await api({type:'profileCreate',name:'QA333 Beginner '+tag});
 assert.notEqual(advanced.profile.id,beginner.profile.id);
 const beforeDeck=[...advanced.profile.deck],beforeRevision=advanced.profile.revision;
 console.log('QA333_SEED_READY '+JSON.stringify({advancedProfileId:advanced.profile.id,
  qaNickname:advanced.profile.nickname, beginnerProfileId:beginner.profile.id}));
 // The supervisor seeds only this newly created QA profile using SQL:
 // cleared_chapters={1,2}, revision incremented. No real player data touched.
 let seeded;
 for(let i=0;i<100;i++){
  const p=(await profile(advanced.profileToken)).profile;
  if(p.clearedChapters.includes(1)&&p.clearedChapters.includes(2)){seeded=p;break;}
  await sleep(1800);
 }
 assert.ok(seeded,'QA-only progression seed was not applied');
 assert.deepEqual(seeded.deck,beforeDeck);
 assert.equal(seeded.revision,beforeRevision+1);
 const fresh=(await profile(beginner.profileToken)).profile;
 assert.deepEqual(fresh.clearedChapters,[]);
 const target=rules.ENCOUNTERS.find(e=>e.id===1);
 const report={backend:'arcane-duo-v2',source:'real-live-edge',progress:'explicit QA-only SQL seed',
  checks:[],loanBySeat:{}};
 async function scenario(host,guest,advancedSeat){
  const created=await api({type:'create',profileToken:host.profileToken,entry:'new',personalDuoRules:true});
  const joined=await api({type:'join',profileToken:guest.profileToken,roomId:created.roomId,
   invite:created.invite,deferStart:true});
  assert.equal(joined.partyLimits.maxChapter,1);
  assert.equal(joined.partyLimits.loanSeatChapter,advancedSeat);
  const hostAction=(revision,action)=>api({type:'action',roomId:created.roomId,token:created.token,
   expectedRevision:revision,action});
  await assert.rejects(()=>hostAction(joined.state.revision,{type:'requestDuel',chapter:2}),
   /freigeschaltet/);
  const invited=await hostAction(joined.state.revision,{type:'requestDuel',chapter:1});
  assert.equal(invited.state.partyStartInvite.toSeat,2);
  const started=await api({type:'action',roomId:created.roomId,token:joined.token,
   expectedRevision:invited.state.revision,
   action:{type:'acceptPartyStart',inviteId:invited.state.partyStartInvite.id}});
  assert.equal(started.state.status,'active');
  assert.equal(started.state.fieldLayout,'team7');
  assert.equal(started.state.players[advancedSeat].loanedDeck,true);
  assert.equal(started.state.players[advancedSeat===0?2:0].loanedDeck,false);
  const advancedView=await api({type:'state',roomId:created.roomId,
   token:advancedSeat===0?created.token:joined.token});
  const noviceView=await api({type:'state',roomId:created.roomId,
   token:advancedSeat===0?joined.token:created.token});
  assert.ok(advancedView.state.players[advancedSeat===0?2:0].hand.every(c=>c===null));
  assert.ok(noviceView.state.players[advancedSeat].hand.every(c=>c===null));
  const loanPlayer=advancedView.state.players[advancedSeat];
  const cards=[...loanPlayer.hand,...loanPlayer.deck];
  assert.equal(cards.length,40);
  assert.ok(cards.every(id=>Number.isInteger(id)&&catalog[id]?.level<=target.level));
  report.loanBySeat[advancedSeat]=true;
  report.checks.push('real room and consent, lower progress cap, chapter 2 denied, chapter 1 started; loan seat '+advancedSeat);
 }
 await scenario(advanced,beginner,0);
 await scenario(beginner,advanced,2);
 const after=(await profile(advanced.profileToken)).profile;
 assert.deepEqual(after.deck,beforeDeck);
 assert.deepEqual(after.clearedChapters,[1,2]);
 assert.equal(after.revision,seeded.revision);
 report.checks.push('both private views redact other hand, source profile deck/progress untouched');
 console.log('QA333_LIVE_PASS '+JSON.stringify(report));
})().catch(e=>{console.error('QA333_LIVE_FAIL '+e.message);process.exitCode=1;});