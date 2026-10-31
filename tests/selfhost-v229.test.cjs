'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {randomUUID,randomBytes}=require('node:crypto');
if(Number(process.versions.node.split('.')[0])<24){test('selfhost requires Node 24',{skip:true},()=>{});}else{
const {Store}=require('../server/sqlite-store.cjs'),{createHandler}=require('../server/duo-handler.cjs');
const origin='https://arcane.example';
const profiles='arcane_duo_v2_profiles',rooms='arcane_duo_v2_rooms';
function setup(t,file=':memory:'){
 const store=new Store(file);t.after(()=>store.close());const handler=createHandler(store,{origins:[origin]});
 const raw=async(body,other=origin)=>{const response=await handler(new Request(origin+'/api/duo',{method:'POST',headers:{origin:other,'content-type':'application/json','x-forwarded-for':'127.0.0.1'},body:JSON.stringify(body)}));return {status:response.status,...await response.json()};};
 const call=async body=>{const r=await raw(body);assert.equal(r.status,200,r.error);return r;};
 return {store,call,raw};
}
test('real authoritative handler: independent profiles, private hands, parties, consent, surrender',async t=>{
 const {store,call,raw}=setup(t);const a=await call({type:'profileCreate',name:'Host'}),b=await call({type:'profileCreate',name:'Partner'});
 assert.notEqual(a.profile.id,b.profile.id);assert.notEqual(a.profileToken,b.profileToken);
 const room=await call({type:'create',profileToken:a.profileToken,personalDuoRules:true});
 assert.equal((await raw({type:'join',roomId:room.roomId,invite:room.invite,profileToken:a.profileToken,deferStart:true})).status,400);
 const guest=await call({type:'join',roomId:room.roomId,invite:room.invite,profileToken:b.profileToken,deferStart:true});
 assert.equal(guest.state.status,'lobby');
 let g=guest.state;
 const action=async(token,action)=>{const r=await call({type:'action',roomId:room.roomId,token,expectedRevision:g.revision,action});g=r.state;return r;};
 await action(room.token,{type:'requestDuel',chapter:1,entry:'chapter'});
 assert.equal(g.status,'party_ready');
 await action(guest.token,{type:'declinePartyStart',inviteId:g.partyStartInvite.id});assert.equal(g.status,'lobby');
 await action(room.token,{type:'requestDuel',chapter:1,entry:'chapter'});
 await action(guest.token,{type:'acceptPartyStart',inviteId:g.partyStartInvite.id});assert.equal(g.status,'active');assert.equal(g.activeSeat,0);
 const host=await call({type:'state',roomId:room.roomId,token:room.token});
 assert.ok(host.state.players[0].hand.length);assert.ok(host.state.players[2].hand.every(c=>c===null));
 assert.ok(g.players[2].hand.length);assert.ok(g.players[0].hand.every(c=>c===null));
 const privateState=store.read('rooms',room.roomId).state;
 assert.notDeepEqual(privateState.players[0].deck,privateState.players[2].deck);
 await action(room.token,{type:'surrender'});assert.equal(g.status,'finished');
 assert.deepEqual((await call({type:'profile',profileToken:a.profileToken})).profile.deck,a.profile.deck);
 assert.deepEqual((await call({type:'profile',profileToken:b.profileToken})).profile.deck,b.profile.deck);
 assert.equal((await raw({type:'profile',profileToken:a.profileToken},'https://unrelated.example')).status,403);
});
test('optimistic profile revisions allow exactly one concurrent edit',async t=>{
 const {call,raw}=setup(t);const a=await call({type:'profileCreate',name:'First'});
 const results=await Promise.all(['Alpha','Beta'].map(name=>raw({type:'profileName',profileToken:a.profileToken,expectedRevision:0,name})));
 assert.equal(results.filter(x=>x.status===200).length,1);assert.equal(results.filter(x=>x.status===400).length,1);
});
test('SQLite keeps private profiles after closing and reopening',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'arcane-229-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const file=path.join(dir,'game.sqlite');let db=new Store(file);const id=randomUUID(),token=randomBytes(32).toString('hex');
 assert.equal((await db.from(profiles).insert({id,token_hash:token,nickname:'Persisted'})).error,null);db.close();
 db=new Store(file);assert.equal((await db.from(profiles).select('*').eq('token_hash',token).single()).data.nickname,'Persisted');db.close();
});
test('winning rewards are atomic, per player, per duel and capped for repeats',async t=>{
 const {store}=setup(t),ids=[randomUUID(),randomUUID()],id=randomUUID();
 for(const pid of ids)assert.equal((await store.from(profiles).insert({id:pid,token_hash:randomBytes(32).toString('hex')})).error,null);
 const initial={id,host_profile_id:ids[0],guest_profile_id:ids[1],state:{status:'active',chapter:1,duelNo:1},status:'active'};
 await store.from(rooms).insert(initial);
 const win=n=>store.from(rooms).update({state:{status:'finished',winner:0,chapter:1,duelNo:n},status:'finished'}).eq('id',id);
 await win(1);await win(1);
 for(const pid of ids){const p=store.read('profiles',pid);assert.equal(p.xp,60);assert.equal(p.chapter_card_credits,3);assert.equal(p.wins,1);}
 for(let n=2;n<=6;n++){await store.from(rooms).update({state:{status:'active',chapter:1,duelNo:n},status:'active'}).eq('id',id);await win(n);}
 for(const pid of ids){const p=store.read('profiles',pid);assert.equal(p.xp,150);assert.equal(p.wins,4);assert.equal(p.chapter_card_credits,3);assert.deepEqual(p.cleared_chapters,[1]);}
 assert.equal(store.db.prepare('SELECT count(*) n FROM rewards').get().n,8);
});
test('reward failure rolls back both room state and first teammate payout',async t=>{
 const {store}=setup(t),id=randomUUID(),pid='00000000-0000-4000-8000-000000000000';
 await store.from(profiles).insert({id:pid,token_hash:randomBytes(32).toString('hex')});
 await store.from(rooms).insert({id,host_profile_id:pid,guest_profile_id:'ffffffff-ffff-4fff-8fff-ffffffffffff',status:'active',state:{status:'active',chapter:1}});
 const r=await store.from(rooms).update({status:'finished',state:{status:'finished',chapter:1,winner:0}}).eq('id',id);
 assert.ok(r.error);assert.equal(store.read('profiles',pid).xp,0);assert.equal(store.read('rooms',id).status,'active');
 assert.equal(store.db.prepare('SELECT count(*) n FROM rewards').get().n,0);
});
test('quest rewards require objective and preserve research unlocks',async t=>{
 const {store}=setup(t),ids=[randomUUID(),randomUUID()],id=randomUUID();
 for(const pid of ids)await store.from(profiles).insert({id:pid,token_hash:randomBytes(32).toString('hex')});
 await store.from(rooms).insert({id,host_profile_id:ids[0],guest_profile_id:ids[1],status:'active',state:{status:'active',chapter:11}});
 await store.from(rooms).update({status:'finished',state:{status:'finished',chapter:11,winner:0,entry:'quest',questPassed:false}}).eq('id',id);
 assert.equal(store.read('profiles',ids[0]).xp,0);
 await store.from(rooms).update({status:'active',state:{status:'active',chapter:11}}).eq('id',id);
 await store.from(rooms).update({status:'finished',state:{status:'finished',chapter:11,winner:0,entry:'quest',questPassed:true}}).eq('id',id);
 for(const pid of ids){const p=store.read('profiles',pid);assert.equal(p.lv1_research.rank,1);assert.deepEqual(p.owned_fusions,[711,712,713]);assert.equal(p.xp,100);}
});
test('lower progress caps opponents and gives advanced player a temporary loan deck',async t=>{
 const {store,call,raw}=setup(t),a=await call({type:'profileCreate',name:'Advanced'}),b=await call({type:'profileCreate',name:'Beginner'});
 await store.from(profiles).update({cleared_chapters:[1,2,3]}).eq('id',a.profile.id);
 const room=await call({type:'create',profileToken:a.profileToken,personalDuoRules:true});
 const guest=await call({type:'join',roomId:room.roomId,invite:room.invite,profileToken:b.profileToken,deferStart:true});
 assert.equal(guest.partyLimits.maxChapter,1);assert.equal(guest.partyLimits.loanSeatChapter,0);
 assert.equal((await raw({type:'action',roomId:room.roomId,token:room.token,expectedRevision:guest.state.revision,action:{type:'requestDuel',chapter:4}})).status,400);
 const request=await call({type:'action',roomId:room.roomId,token:room.token,expectedRevision:guest.state.revision,action:{type:'requestDuel',chapter:1}});
 await call({type:'action',roomId:room.roomId,token:guest.token,expectedRevision:request.state.revision,action:{type:'acceptPartyStart',inviteId:request.state.partyStartInvite.id}});
 assert.deepEqual(store.read('profiles',a.profile.id).deck,a.profile.deck);
 assert.deepEqual(store.read('profiles',b.profile.id).deck,b.profile.deck);
 assert.match(JSON.stringify(store.read('rooms',room.roomId).state),/Leihdeck|loan/i);
});
test('simultaneous joins cannot occupy the same seat twice',async t=>{
 const {call,raw}=setup(t),people=[];
 for(const name of ['Host','One','Two'])people.push(await call({type:'profileCreate',name}));
 const room=await call({type:'create',profileToken:people[0].profileToken,personalDuoRules:true});
 const results=await Promise.all(people.slice(1).map(p=>raw({type:'join',roomId:room.roomId,invite:room.invite,profileToken:p.profileToken,deferStart:true})));
 assert.equal(results.filter(r=>r.status===200).length,1);assert.equal(results.filter(r=>r.status===400).length,1);
});
test('verified legacy import is explicit and never overwrites local progress',async t=>{
 const {store,call}=setup(t),{importProfile}=require('../server/import-profile.cjs');
 const original=await call({type:'profileCreate',name:'Source'}),token=randomBytes(32).toString('hex');
 const data={...original.profile,id:randomUUID(),xp:777,clearedChapters:[1],wins:4};let calls=0;
 const fetcher=async(url,opts)=>{calls++;assert.match(url,/^https:\/\/cvmtmvruutdneyblumgf\.supabase\.co\//);assert.equal(JSON.parse(opts.body).profileToken,token);return new Response(JSON.stringify({profile:data}));};
 assert.equal((await importProfile(store,token,{fetcher})).imported,true);
 assert.equal(store.read('profiles',data.id).xp,777);
 await store.from(profiles).update({xp:999}).eq('id',data.id);
 assert.equal((await importProfile(store,token,{fetcher})).imported,false);assert.equal(calls,1);assert.equal(store.read('profiles',data.id).xp,999);
 assert.equal(store.db.prepare('SELECT count(*) n FROM rewards WHERE profile_id=?').get(data.id).n,3);
 await assert.rejects(()=>importProfile(store,randomBytes(32).toString('hex'),{fetcher:async()=>new Response('{}',{status:403})}));
});
test('HTTP boundary serves the game but rejects private files, other origins and oversized bodies',async t=>{
 const {createServer}=require('../server/main.cjs');const {server,store}=createServer({database:':memory:',origin});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(async()=>{await new Promise(resolve=>server.close(resolve));store.close();});
 const base='http://127.0.0.1:'+server.address().port;
 assert.equal((await fetch(base+'/index.html')).status,200);
 assert.match(await (await fetch(base+'/arcane-host-config.js')).text(),/\/api\/duo/);
 for(const url of ['/server/main.cjs','/supabase/functions/arcane-duo-v2/index.ts','/.git/config','/assets/%2e%2e%2fserver/main.cjs'])assert.equal((await fetch(base+url)).status,404);
 assert.equal((await fetch(base+'/api/duo',{method:'POST',headers:{origin:'https://aetherfall.example'},body:'{}'})).status,403);
 assert.equal((await fetch(base+'/api/duo',{method:'POST',headers:{origin},body:'x'.repeat(13000)})).status,413);
 const r=await fetch(base+'/api/duo',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({type:'profileCreate',name:'HTTP'})});
 assert.equal(r.status,200);assert.equal((await r.json()).profile.nickname,'HTTP');
 assert.equal((await fetch(base+'/api/duo',{method:'POST',headers:{origin},body:JSON.stringify({type:'legacyImport',profileToken:'f'.repeat(64)})})).status,403);
});
}
