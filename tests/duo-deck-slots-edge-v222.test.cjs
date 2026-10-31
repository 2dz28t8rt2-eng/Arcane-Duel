'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {stripTypeScriptTypes}=require('node:module');
const snapshot=require('../assets/duo-card-catalog-v160.json');
const opponents=require('../assets/duo-opponent-catalog-v201.json');
const rules=require('../assets/duo-shared-rules-v160.js');
const economy=require('../assets/duo-economy-v172.js');
const adversaries=require('../assets/duo-adversaries-v200.js');
const deckSlots=require('../assets/duo-deck-slots-v222.js');

test('real Edge request handlers keep 2v2 deck variants, upgrades and profiles isolated',
 {skip:typeof stripTypeScriptTypes!=='function'},async()=>{
 const tokens=['a'.repeat(64),'b'.repeat(64),'c'.repeat(64)];
 const rows=tokens.map((token,i)=>({id:'profile-'+i,token_hash:crypto.createHash('sha256').update(token).digest('hex'),
  nickname:'Spieler '+i,avatar_id:'hero-01',revision:0,xp:0,essence:0,shards:0,wins:0,
  cleared_chapters:[],owned_main:[...snapshot.starterMain,1],owned_fusions:[...snapshot.starterFusions],
  deck:[...snapshot.starterMain],fusions:[...snapshot.starterFusions],deck_slots:[],active_deck_slot:0,
  upgrades:{},enhancements:{'0':2},essence_binding:{},lv1_research:{}}));
 // Compatibility when code reaches a database not migrated yet.
 delete rows[2].deck_slots;delete rows[2].active_deck_slot;
 const client={from(table){
  let patch=null,conditions=[];
  const q={select(){return q;},update(v){patch=v;return q;},
   eq(k,v){conditions.push([k,v]);return q;},or(){return q;},gte(){return q;},order(){return q;},limit(){return q;},
   async maybeSingle(){const p=rows.find(row=>conditions.every(([k,v])=>row[k]===v));
    if(!p)return {data:null,error:null};if(patch)Object.assign(p,structuredClone(patch));
    return {data:structuredClone(p),error:null};},
   then(resolve,reject){return Promise.resolve({data:[],error:null}).then(resolve,reject);}};
  if(!['arcane_duo_v2_profiles','arcane_duo_v2_rooms'].includes(table))throw Error('Unexpected table');
  return q;
 }};
 let serve;
 const source=fs.readFileSync(require('node:path').join(__dirname,'../supabase/functions/arcane-duo-v2/index.ts'),'utf8');
 const code=stripTypeScriptTypes(source,{mode:'strip'}).replace(/^\s*import\s+[^\r\n]+;[ \t]*$/gm,'');
 const context={snapshot,soloOpponents:opponents,createClient:()=>client,
  ArcaneDuoRules:rules,ArcaneDuoEconomy172:economy,ArcaneDuoAdversaries200:adversaries,
  ArcaneDuoDeckSlots222:deckSlots,Deno:{env:{get:()=>''},serve:fn=>{serve=fn;}},
  crypto:crypto.webcrypto,Request,Response,TextEncoder,Uint8Array,Date,URL,console};
 context.globalThis=context;vm.runInNewContext(code,context);
 async function request(token,type,expectedRevision,extra={}){
  const response=await serve(new Request('https://example.test',{method:'POST',
   headers:{'content-type':'application/json',origin:'http://localhost:8757'},
   body:JSON.stringify({type,profileToken:token,expectedRevision,...extra})}));
  return {status:response.status,body:await response.json()};
 }
 const initial=await request(tokens[0],'profile');
 assert.equal(initial.status,200);assert.equal(initial.body.profile.deckSlots.length,3);
 const edited=await request(tokens[0],'deckReplace',0,{zone:'main',slot:0,cardId:1});
 assert.equal(edited.status,200);assert.equal(edited.body.profile.deckSlots[1].main[0],0);
 const switched=await request(tokens[0],'deckSlotSelect',1,{slot:1});
 assert.equal(switched.status,200);assert.equal(switched.body.profile.deck[0],0);
 assert.equal(switched.body.profile.enhancements['0'],2);
 const conflict=await request(tokens[0],'deckSlotCopy',1,{slot:2});
 assert.equal(conflict.status,400);assert.match(conflict.body.error,/geändert/);
 const other=await request(tokens[1],'profile');
 assert.equal(other.body.profile.revision,0);assert.equal(other.body.profile.activeDeckSlot,0);
 assert.deepEqual(other.body.profile.deck,snapshot.starterMain);
 const old=await request(tokens[2],'profile');
 assert.equal(old.status,200);assert.equal(Object.hasOwn(old.body.profile,'deckSlots'),false);
 const unavailable=await request(tokens[2],'deckSlotSelect',0,{slot:1});
 assert.equal(unavailable.status,400);assert.match(unavailable.body.error,/Aktualisierung/);
});
