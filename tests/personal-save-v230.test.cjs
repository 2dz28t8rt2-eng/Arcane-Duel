'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
if(Number(process.versions.node.split('.')[0])<24){test('personal save needs Node 24',{skip:true},()=>{});}else{
 const {createRuntime}=require('../server/singleplayer-runtime.cjs'),{PlayerSaves}=require('../server/player-save.cjs');
 const {Store}=require('../server/sqlite-store.cjs'),{createHandler}=require('../server/duo-handler.cjs');
 const runtime=createRuntime(),origin='https://arcane.example';
 async function fixture(t){
  const store=new Store(':memory:');t.after(()=>store.close());const saves=new PlayerSaves(store,runtime),handler=createHandler(store,{origins:[origin]});
  const call=async body=>{const res=await handler(new Request(origin+'/api/duo',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)}));const r=await res.json();assert.equal(res.status,200,r.error);return r;};
  const a=await call({type:'profileCreate',name:'Host'}),b=await call({type:'profileCreate',name:'Partner'});
  return {store,saves,call,a,b,handler};
 }
 test('same canonical save validation preserves names and original collection/decks',()=>{
  const p=runtime.fresh();p.duelistName='Duellant ABC 012 ÄÖÜ';
  assert.equal(runtime.normalize(p).duelistName,p.duelistName);
  assert.deepEqual(runtime.loadout(p).deck,p.activeDeck);
  assert.equal(runtime.loadout(p).owned_main.length,40);
 });
 test('explicit adoption backs up both alternatives, never adds balances, isolates players and rejects stale writes',async t=>{
  const {store,saves,a,b}=await fixture(t),p=runtime.fresh();p.coins=123;p.duelistName='Alice';
  const before=saves.save({type:'load',profileToken:a.profileToken});assert.equal(before.legacy.coins,0);
  const result=saves.save({type:'adopt',choice:'solo',expectedRevision:0,profileToken:a.profileToken,save:p});
  assert.equal(result.save.coins,123);assert.equal(store.read('profiles',a.profile.id).essence,123);
  assert.equal(store.db.prepare('SELECT count(*) n FROM player_save_backups').get().n,1);
  assert.equal(saves.save({type:'load',profileToken:b.profileToken}).save,null);
  assert.throws(()=>saves.save({type:'save',expectedRevision:0,profileToken:a.profileToken,save:p}),/inzwischen geändert/);
  assert.throws(()=>saves.save({type:'load',profileToken:'0'.repeat(64)}),/Profilzugang/);
  p.coins=88;const next=saves.save({type:'save',expectedRevision:1,profileToken:a.profileToken,save:p});
  assert.equal(next.save.coins,88);assert.equal(next.revision,2);
 });
 test('legacy conversion preserves currencies, cards, slots and outstanding chapter credits',async t=>{
  const {store,saves,a}=await fixture(t),old=store.read('profiles',a.profile.id);
  old.xp=456;old.essence=789;old.shards=12;old.chapter_card_credits=6;store.save('profiles',old);
  const r=saves.save({type:'adopt',choice:'online',expectedRevision:0,profileToken:a.profileToken,save:runtime.fresh()});
  assert.equal(r.save.xp,456);assert.equal(r.save.coins,789);assert.equal(r.save.shards[0],12);
  assert.equal(r.save.onlineLegacy230.chapterCardCredits,6);assert.deepEqual(r.save.activeDeck,old.deck);
 });
 test('real duel start locks personal writes and surrender updates only each own canonical save once',async t=>{
  const {store,saves,call,a,b}=await fixture(t);
  for(const [person,coins]of [[a,71],[b,29]]){const p=runtime.fresh();p.coins=coins;saves.save({type:'adopt',choice:'solo',expectedRevision:0,profileToken:person.profileToken,save:p});}
  const room=await call({type:'create',profileToken:a.profileToken,personalDuoRules:true});
  const joined=await call({type:'join',roomId:room.roomId,invite:room.invite,profileToken:b.profileToken,deferStart:true});
  const request=await call({type:'action',roomId:room.roomId,token:room.token,expectedRevision:joined.state.revision,action:{type:'requestDuel',chapter:1}});
  const start=await call({type:'action',roomId:room.roomId,token:joined.token,expectedRevision:request.state.revision,action:{type:'acceptPartyStart',inviteId:request.state.partyStartInvite.id}});
  assert.throws(()=>saves.save({type:'save',profileToken:a.profileToken,expectedRevision:1,save:runtime.fresh()}),/gemeinsamen Duells/);
  await call({type:'action',roomId:room.roomId,token:room.token,expectedRevision:start.state.revision,action:{type:'surrender'}});
  for(const [person,coins]of [[a,71],[b,29]]){const p=saves.save({type:'load',profileToken:person.profileToken});assert.equal(p.save.coins,coins);assert.equal(p.save.losses,1);assert.equal(p.revision,2);}
  assert.equal(store.db.prepare('SELECT count(*) n FROM rewards').get().n,2);
 });
 test('canonical victory awards original rewards once and leaves both personal decks intact',async t=>{
  const {store,saves,call,a,b}=await fixture(t);
  for(const person of [a,b])saves.save({type:'adopt',choice:'solo',expectedRevision:0,profileToken:person.profileToken,save:runtime.fresh()});
  const room=await call({type:'create',profileToken:a.profileToken,personalDuoRules:true});
  const joined=await call({type:'join',roomId:room.roomId,invite:room.invite,profileToken:b.profileToken,deferStart:true});
  const request=await call({type:'action',roomId:room.roomId,token:room.token,expectedRevision:joined.state.revision,action:{type:'requestDuel',chapter:1}});
  await call({type:'action',roomId:room.roomId,token:joined.token,expectedRevision:request.state.revision,action:{type:'acceptPartyStart',inviteId:request.state.partyStartInvite.id}});
  const row=store.read('rooms',room.roomId);row.state.status='finished';row.state.winner=0;row.state.turn=9;row.status='finished';
  const first=await store.from('arcane_duo_v2_rooms').update(row).eq('id',row.id);assert.equal(first.error,null);
  const second=await store.from('arcane_duo_v2_rooms').update(row).eq('id',row.id);assert.equal(second.error,null);
  for(const person of [a,b]){const p=saves.save({type:'load',profileToken:person.profileToken});assert.deepEqual(p.save.cleared,[1]);assert.equal(p.save.wins,1);assert.ok(p.save.xp>0);assert.deepEqual(p.save.activeDeck,runtime.fresh().activeDeck);}
  assert.equal(store.db.prepare('SELECT count(*) n FROM rewards').get().n,2);
 });
 for(const seat of [0,2])for(const turn of [29,30,59])test(`surrender at recorded turn ${turn+1} by seat ${seat} saves both personal results`,async t=>{
  const {store,saves,call,a,b}=await fixture(t);
  const originals=[];
  for(const [person,coins]of [[a,71],[b,29]]){const p=runtime.fresh();p.coins=coins;originals.push(p);saves.save({type:'adopt',choice:'solo',expectedRevision:0,profileToken:person.profileToken,save:p});}
  const room=await call({type:'create',profileToken:a.profileToken,personalDuoRules:true});
  const joined=await call({type:'join',roomId:room.roomId,invite:room.invite,profileToken:b.profileToken,deferStart:true});
  const request=await call({type:'action',roomId:room.roomId,token:room.token,expectedRevision:joined.state.revision,action:{type:'requestDuel',chapter:1}});
  const start=await call({type:'action',roomId:room.roomId,token:joined.token,expectedRevision:request.state.revision,action:{type:'acceptPartyStart',inviteId:request.state.partyStartInvite.id}});
  // A late-game fixture avoids playing 30+ irrelevant turns to reach the save boundary.
  const row=store.read('rooms',room.roomId);row.state.turn=turn;row.state.round=Math.floor(turn/4)+1;row.state.activeSeat=turn%4;store.save('rooms',row);
  const finished=await call({type:'action',roomId:room.roomId,token:seat===0?room.token:joined.token,expectedRevision:start.state.revision,action:{type:'surrender'}});
  assert.equal(finished.state.status,'finished');assert.equal(finished.state.winner,1);assert.equal(finished.state.surrenderedBy,seat);
  for(const [i,person]of [a,b].entries()){
   const result=saves.save({type:'load',profileToken:person.profileToken});
   assert.equal(result.save.losses,1);assert.equal(result.save.history[0].turns,turn+1);assert.equal(result.revision,2);
   for(const key of ['coins','xp','activeDeck','fusionDeck','inventory','cleared','shards','dropCharges','packProgress'])assert.deepEqual(result.save[key],originals[i][key],key);
   assert.deepEqual(runtime.normalize(result.save),result.save);
   await call({type:'state',roomId:room.roomId,token:person.profileToken});
   assert.equal(saves.save({type:'load',profileToken:person.profileToken}).save.losses,1);
  }
  assert.equal(store.db.prepare('SELECT count(*) n FROM rewards').get().n,2);
 });
 for(const winner of [0,1])test(`late online ${winner===0?'victory':'defeat'} remains a valid personal save`,async t=>{
  const {store,saves,call,a,b}=await fixture(t);
  for(const person of [a,b])saves.save({type:'adopt',choice:'solo',expectedRevision:0,profileToken:person.profileToken,save:runtime.fresh()});
  const room=await call({type:'create',profileToken:a.profileToken,personalDuoRules:true});
  const joined=await call({type:'join',roomId:room.roomId,invite:room.invite,profileToken:b.profileToken,deferStart:true});
  const request=await call({type:'action',roomId:room.roomId,token:room.token,expectedRevision:joined.state.revision,action:{type:'requestDuel',chapter:1}});
  await call({type:'action',roomId:room.roomId,token:joined.token,expectedRevision:request.state.revision,action:{type:'acceptPartyStart',inviteId:request.state.partyStartInvite.id}});
  const row=store.read('rooms',room.roomId);row.state.status='finished';row.state.winner=winner;row.state.turn=31;row.status='finished';
  const update=await store.from('arcane_duo_v2_rooms').update(row).eq('id',row.id);assert.equal(update.error,null);
  for(const person of [a,b]){
   const save=saves.save({type:'load',profileToken:person.profileToken}).save;
   assert.equal(save.history[0].turns,32);assert.equal(save.history[0].win,winner===0);
   assert.equal(save.bestTurns,winner===0?32:null);assert.deepEqual(runtime.normalize(save),save);
  }
 });
 test('four-seat history preserves up to 60 turns and still rejects invalid turn counts',()=>{
  const p=runtime.fresh();p.bestTurns=60;p.history=[{opponent:1,win:true,turns:60,coins:0,xp:0,at:Date.now(),context:'tournament'}];
  const saved=runtime.normalize(p);assert.equal(saved.bestTurns,60);assert.equal(saved.history[0].turns,60);
  for(const turns of [-1,30.5,61,Number.MAX_SAFE_INTEGER]){
   const wrong=structuredClone(p);wrong.history[0].turns=turns;assert.throws(()=>runtime.normalize(wrong),/Duelleintrag/);
   const wrongBest=structuredClone(p);wrongBest.bestTurns=turns;assert.throws(()=>runtime.normalize(wrongBest),/Statistik/);
  }
 });
 test('shared client requires host release, filters every animation frame and recovers the active personal room',async t=>{
  const {store,saves,call,a,b,handler}=await fixture(t);
  for(const person of [a,b])saves.save({type:'adopt',choice:'solo',expectedRevision:0,profileToken:person.profileToken,save:runtime.fresh()});
  const room=await call({type:'create',profileToken:a.profileToken,personalDuoRules:true,sharedClient:true});
  const joined=await call({type:'join',roomId:room.roomId,invite:room.invite,profileToken:b.profileToken,deferStart:true});
  const rejected=async(token,action)=>{
   const r=await handler(new Request(origin+'/api/duo',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({type:'action',roomId:room.roomId,token,expectedRevision:joined.state.revision,action})}));assert.equal(r.status,400);
  };
  await rejected(joined.token,{type:'continueGroup'});await rejected(room.token,{type:'requestDuel',chapter:1});
  const released=await call({type:'action',roomId:room.roomId,token:room.token,expectedRevision:joined.state.revision,action:{type:'continueGroup'}});
  const request=await call({type:'action',roomId:room.roomId,token:room.token,expectedRevision:released.state.revision,action:{type:'requestDuel',chapter:1}});
  const start=await call({type:'action',roomId:room.roomId,token:joined.token,expectedRevision:request.state.revision,action:{type:'acceptPartyStart',inviteId:request.state.partyStartInvite.id}});
  const turn=await call({type:'action',roomId:room.roomId,token:room.token,expectedRevision:start.state.revision,action:{type:'end'}});
  assert.equal(turn.state.activeSeat,2);assert.ok(turn.presentation.length>1);
  for(const person of [a,b]){
   const seat=person===a?0:2;
   const data=await call({type:'state',roomId:room.roomId,token:person.profileToken,afterRevision:-1});
   for(const state of [data.state,...data.presentation.map(f=>f.state)]){
    assert.equal(state.rngSeed,undefined);assert.equal(state.uid,undefined);
    for(const p of state.players){if(p.seat===seat)continue;assert.ok(p.hand.every(c=>c===null));assert.ok(p.deck.every(c=>c===null));assert.equal(p.handFaces,undefined);assert.equal(p.originalDeck,undefined);}
   }
   const personal=saves.save({type:'load',profileToken:person.profileToken});assert.deepEqual(personal.lastRoom,{id:room.roomId,seat,status:'active'});
   assert.throws(()=>store.claimLegacyCard(store.read('profiles',person.profile.id),0),/Beende zuerst/);
  }
 });
}
