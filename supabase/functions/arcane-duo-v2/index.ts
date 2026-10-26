/* 2v2 v16.6 beta. Isolated from the legacy arcane-duo endpoint/room table.
 * Client sends choices only. Deck legality, fusion levels, roles, damage,
 * draw order, turn ownership and private state live on the server.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2";
import snapshot from "./catalog.json" with {type:"json"};
import "./duo-rules.js";
import "./duo-economy-v172.js";

const game=globalThis.ArcaneDuoRules;
if(!game)throw Error("Missing authoritative 2v2 rules");
const economy=globalThis.ArcaneDuoEconomy172;
if(!economy)throw Error("Missing standalone 2v2 economy rules");
const catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c]));
const starter=snapshot.starterMain;
const db=createClient(Deno.env.get("SUPABASE_URL")||"",
 Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"",
 {auth:{persistSession:false,autoRefreshToken:false}});
const TABLE="arcane_duo_v2_rooms";
const PROFILE_TABLE="arcane_duo_v2_profiles";
const origins=new Set(["https://raw.githack.com","https://2dz28t8rt2-eng.github.io",
 "http://localhost:8757","http://127.0.0.1:8757"]);
function assert(v,message){if(!v)throw Error(message);}
const uuid=()=>crypto.randomUUID();
const secret=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),
 b=>b.toString(16).padStart(2,"0")).join("");
const hash=async(value)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",
 new TextEncoder().encode(value))),v=>v.toString(16).padStart(2,"0")).join("");
const safeName=v=>String(v||"Duellant").replace(/[<>\x00-\x1f]/g,"").trim().slice(0,32)||"Duellant";
function enemyDeck(chapter,seat){
 if(chapter===1)return [...starter];
 const target=[2,4,6,8][chapter-1];
 const options=snapshot.cards.filter(c=>c.playable&&!c.fusionOnly&&!c.ace&&
   c.level<=target&&c.level>=Math.max(1,target-3)&&
   (c.source===null||c.source<=chapter+2));
 options.sort((a,b)=>{
  const score=c=>Math.abs(target-c.level)*300-
   (seat===1?c.def:c.atk)*.3;
  return score(a)-score(b)||a.id-b.id;
 });
 const unique=[...new Set(options.slice(0,19).map(c=>c.id))];
 if(unique.length<14)return [...starter];
 const deck=[];while(deck.length<40)for(const id of unique){
  if(deck.length>=40)break;
  if(deck.filter(x=>x===id).length<3)deck.push(id);
 }
 return deck;
}
function enemyFusions(chapter){
 const cap=[3,5,7,10][chapter-1];
 const pool=snapshot.cards.filter(c=>c.playable&&c.fusionOnly&&c.level>=2&&c.level<=cap)
  .sort((a,b)=>a.level-b.level||a.id-b.id);
 return pool.slice(0,Math.min(15,pool.length)).map(c=>c.id);
}
function json(body,status=200,origin=""){
 return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json",
  "Cache-Control":"no-store","Access-Control-Allow-Origin":origin||"https://raw.githack.com",
  "Access-Control-Allow-Headers":"Content-Type,apikey,authorization",
  "Access-Control-Allow-Methods":"POST,OPTIONS","Vary":"Origin"}});
}

const isToken=x=>typeof x==="string"&&/^[a-f0-9]{64}$/.test(x);
const counts=arr=>arr.reduce((m,x)=>(m.set(x,(m.get(x)||0)+1),m),new Map());
const inventoryAllows=(deck,collection)=>{
 const owned=counts(collection);return [...counts(deck)].every(([id,n])=>n<=(owned.get(id)||0));
};
const profileView=p=>({
 id:p.id,nickname:p.nickname,revision:p.revision,xp:p.xp,
 level:1+Math.floor(p.xp/150),essence:p.essence,shards:p.shards,wins:p.wins,
 clearedChapters:p.cleared_chapters||[],
 ownedMain:p.owned_main,ownedFusions:p.owned_fusions,
 deck:p.deck,fusions:p.fusions,upgrades:p.upgrades,
 enhancements:p.enhancements,essenceBinding:p.essence_binding,
 lv1Research:p.lv1_research,chapterCardCredits:p.chapter_card_credits||0,
 updatedAt:p.updated_at
});
async function profileByToken(token){
 assert(isToken(token),"2v2-Profilzugang fehlt.");
 const {data:p,error}=await db.from(PROFILE_TABLE).select("*")
  .eq("token_hash",await hash(token)).maybeSingle();
 if(error)throw error;assert(p,"2v2-Profil nicht gefunden.");
 return p;
}
async function writeProfile(p,patch){
 const {data:next,error}=await db.from(PROFILE_TABLE).update({
  ...patch,revision:p.revision+1,updated_at:new Date().toISOString()
 }).eq("id",p.id).eq("revision",p.revision).select("*").maybeSingle();
 if(error)throw error;
 assert(next,"2v2-Profil gleichzeitig geändert. Bitte synchronisieren.");
 return next;
}
async function newestRoom(p){
 const {data,error}=await db.from(TABLE)
  .select("id,status,revision,host_profile_id")
  .or("host_profile_id.eq."+p.id+",guest_profile_id.eq."+p.id)
  .gte("expires_at",new Date().toISOString())
  .order("updated_at",{ascending:false}).limit(1);
 if(error)throw error;
 const room=data?.[0];
 return room?{roomId:room.id,seat:room.host_profile_id===p.id?0:2,
  status:room.status,revision:room.revision}:null;
}
const maxChapter=p=>economy.maxChapter(p);
const capLevel=p=>economy.maxCardLevel(p);
const profileResult=async(p,extra={})=>({profile:profileView(p),
 lastRoom:await newestRoom(p),
 economy:{packs:economy.PACKS,
  lv1:economy.researchOffer(p,"lv1"),
  essence:economy.researchOffer(p,"essence"),
  maxCardLevel:capLevel(p),maxChapter:maxChapter(p),
  rewards:economy.rewardTable()},
 ...extra});

Deno.serve(async request=>{
 const origin=request.headers.get("origin")||"";
 const allow=origins.has(origin)?origin:"";
 if(request.method==="OPTIONS")return allow?json({},200,allow):new Response(null,{status:403});
 if(request.method!=="POST"||!allow)return json({error:"Nicht erlaubte Anfrage"},403,allow);
 let body;
 try{
  body=await request.json();
  assert(body&&typeof body==="object"&&JSON.stringify(body).length<=12000,
   "Anfrage zu groß.");
 }catch{return json({error:"Ungültiges Anfrageformat."},400,allow);}
 try{
  const kind=body.type,roomId=body.roomId,token=body.token;
  if(kind==="profileCreate"){
   const ip=request.headers.get("cf-connecting-ip")||
    request.headers.get("x-forwarded-for")?.split(",")[0]||"unknown";
   const fp=await hash("arcane-duo-v2-profile-"+ip);
   const {count:created,error:limitError}=await db.from(PROFILE_TABLE)
    .select("id",{count:"exact",head:true}).eq("creator_fingerprint",fp)
    .gte("created_at",new Date(Date.now()-3600000).toISOString());
   if(limitError)throw limitError;
   assert((created||0)<5,"Maximal fünf neue Profile pro Stunde.");
   const id=uuid(),profileToken=secret();
   const {data:p,error}=await db.from(PROFILE_TABLE).insert({
    id,token_hash:await hash(profileToken),
    nickname:safeName(body.name),creator_fingerprint:fp,
    owned_main:[...starter],owned_fusions:[...snapshot.starterFusions],
    deck:[...starter],fusions:[...snapshot.starterFusions]
   }).select("*").single();
   if(error)throw error;
   return json({profileToken,...await profileResult(p)},200,allow);
  }
  if(["profile","upgrade","pack","deckReplace","research","bindEssence","enhance","recycle","chapterCard"].includes(kind)){
   const p=await profileByToken(body.profileToken);
   if(kind==="profile")return json(await profileResult(p),200,allow);
   assert(Number.isInteger(body.expectedRevision)&&body.expectedRevision===p.revision,
    "2v2-Profil geändert. Bitte synchronisieren.");
   if(kind==="upgrade"){
    assert(typeof body.key==="string","Ungültige Verbesserung.");
    const max=game.PERK_LIMITS[body.key]||0,rank=p.upgrades?.[body.key]||0;
    assert(max>0&&Number.isInteger(rank)&&rank>=0&&rank<max,
     "Verbesserung ungültig oder bereits auf Maximalrang.");
    const price=100+70*rank;
    assert(p.essence>=price,"Nicht genug 2v2-Essenz.");
    const next=await writeProfile(p,{essence:p.essence-price,
     upgrades:{...p.upgrades,[body.key]:rank+1}});
    return json(await profileResult(next),200,allow);
   }
   if(kind==="pack"){
    const offer=economy.PACKS[body.pack];
    assert(offer,"Unbekanntes 2v2-Kartenpaket.");
    assert(p.essence>=offer.essence&&p.shards>=offer.shards,
     "Nicht genug 2v2-Essenz oder Splitter.");
    const rng=max=>crypto.getRandomValues(new Uint32Array(1))[0]%max;
    const reward=economy.packDraw(p,body.pack,catalog,rng);
    const next=await writeProfile(p,{essence:p.essence-offer.essence,
     shards:p.shards-offer.shards,
     owned_main:reward.owned_main,owned_fusions:reward.owned_fusions});
    return json(await profileResult(next,{
     newCards:reward.cards,fusionCount:reward.fusionCount,
     normalCount:reward.normalCount}),200,allow);
   }
   if(kind==="research"){
    assert(["lv1","essence"].includes(body.branch),"Unbekannter 2v2-Forschungszweig.");
    const offer=economy.researchOffer(p,body.branch);
    assert(offer&&!offer.maxed,"Forschungszweig bereits abgeschlossen.");
    assert(offer.unlocked,"Für diesen Forschungsrang fehlt ein abgeschlossenes 2v2-Kapitel.");
    assert(p.essence>=offer.essence&&p.shards>=offer.shards,
     "Nicht genügend 2v2-Essenz oder Splitter.");
    const patch:any={essence:p.essence-offer.essence,shards:p.shards-offer.shards};
    let granted:any[]=[];
    if(body.branch==="lv1"){
     patch.lv1_research={...p.lv1_research,perk:true,rank:offer.nextRank};
     if(offer.nextRank===1){
      granted=snapshot.cards.filter(c=>c.lv1Exclusive&&c.playable).map(c=>({
       id:c.id,name:c.name,level:c.level,fusion:true
      }));
      patch.owned_fusions=[...p.owned_fusions,...granted.map(c=>c.id)];
      patch.fusions=[...p.fusions,
       ...granted.map(c=>c.id).slice(0,Math.max(0,15-p.fusions.length))];
     }
    }else{
     patch.essence_binding={...p.essence_binding,researchRank:offer.nextRank,rank:offer.nextRank};
    }
    const next=await writeProfile(p,patch);
    return json(await profileResult(next,{researchUnlocked:body.branch,
     newCards:granted}),200,allow);
   }
   if(kind==="chapterCard"){
    assert((p.chapter_card_credits||0)>=1,
     "Keine offenen Kapitel-Kartenbelohnungen.");
    const pool=economy.chapterCardPool(p,catalog);
    assert(pool.length>0,"Alle Karten der freigeschalteten Stufe sind ausgeschöpft.");
    const id=pool[crypto.getRandomValues(new Uint32Array(1))[0]%pool.length].id;
    const next=await writeProfile(p,{
     chapter_card_credits:p.chapter_card_credits-1,
     owned_main:[...p.owned_main,id]
    });
    return json(await profileResult(next,{chapterCard:{
     id,name:catalog[id].name,level:catalog[id].level
    }}),200,allow);
   }
   if(kind==="enhance"){
    assert(Number.isInteger(body.cardId),"Ungültige 2v2-Karte.");
    const offer=economy.enhanceOffer(p,body.cardId,catalog);
    assert(offer&&!offer.maxed,"Karte nicht im aktiven Deck oder bereits auf Verstärkungsrang 5.");
    assert(p.essence>=offer.essence&&p.shards>=offer.shards,
     "Nicht genug 2v2-Essenz oder Splitter.");
    const next=await writeProfile(p,{
     essence:p.essence-offer.essence,
     shards:p.shards-offer.shards,
     enhancements:{...p.enhancements,[body.cardId]:offer.nextRank}
    });
    return json(await profileResult(next,{enhanced:{
     id:body.cardId,rank:offer.nextRank,bonusPerStat:offer.bonusPerStat}
    }),200,allow);
   }
   if(kind==="recycle"){
    assert(Number.isInteger(body.cardId),"Ungültige 2v2-Karte.");
    const offer=economy.recycleOffer(p,body.cardId,catalog);
    assert(offer,"Diese Karte ist geschützt oder es gibt kein freies Exemplar.");
    const column=offer.fusion?"owned_fusions":"owned_main",
     collection=[...p[column]];
    const idx=collection.indexOf(body.cardId);
    assert(idx>=0,"Karte nicht im Inventar.");
    collection.splice(idx,1);
    const next=await writeProfile(p,{
     essence:p.essence+offer.essence,
     shards:p.shards+offer.shards,
     [column]:collection
    });
    return json(await profileResult(next,{recycled:{
     id:body.cardId,essence:offer.essence,shards:offer.shards}
    }),200,allow);
   }
   if(kind==="bindEssence"){
    const id=body.cardId,card=catalog[id];
    assert(economy.researchRank(p,"essence")>=1,
     "Erst Essenzforschung in der 2v2-Kampagne freischalten.");
    assert(Number.isInteger(id)&&card?.essenceMonster===true&&
     p.owned_main.includes(id)&&p.deck.includes(id),
     "Essenzwesen muss dir gehören und im 2v2-Hauptdeck sein.");
    const next=await writeProfile(p,{
     essence_binding:{...p.essence_binding,chosen:id,
      school:card.essenceSchool||null,
      rank:economy.researchRank(p,"essence"),
      tier:Math.max(0,...(p.cleared_chapters||[]))}
    });
    return json(await profileResult(next),200,allow);
   }
   assert(["main","fusion"].includes(body.zone)&&Number.isInteger(body.slot)&&
    Number.isInteger(body.cardId),"Ungültige Deckänderung.");
   const fusion=body.zone==="fusion",deck=fusion?[...p.fusions]:[...p.deck];
   assert(body.slot>=0&&body.slot<deck.length,"Ungültiger Deckplatz.");
   deck[body.slot]=body.cardId;
   assert(game.validDeck(deck,catalog,fusion)&&
    inventoryAllows(deck,fusion?p.owned_fusions:p.owned_main),
    "Karte fehlt in deiner 2v2-Sammlung oder verletzt Deckregeln.");
   const main=fusion?p.deck:deck,side=fusion?deck:p.fusions;
   const remaining=new Set([...main,...side]),enhancements={};
   for(const [id,rank] of Object.entries(p.enhancements||{}))
    if(remaining.has(Number(id)))enhancements[id]=rank;
   // Do not let editing a deck silently remove a currently bound creature.
   if(p.essence_binding?.chosen!=null)
    assert(main.includes(p.essence_binding.chosen),
     "Das gebundene Essenzwesen muss im 2v2-Hauptdeck bleiben.");
   // Ensure the modified deck is still a valid combat build, not merely an inventory list.
   game.normalizedBuild(p.upgrades,enhancements,main,side,catalog,
    p.essence_binding,p.lv1_research);
   const next=await writeProfile(p,{[fusion?"fusions":"deck"]:deck,enhancements});
   return json(await profileResult(next),200,allow);
  }
  if(kind==="create"){
   const p=await profileByToken(body.profileToken);
   const entry=body.entry||"new",chapter=entry==="new"?1:body.chapter;
   assert(["new","chapter"].includes(entry)&&Number.isInteger(chapter)&&
    chapter>=1&&chapter<=maxChapter(p),"2v2-Kapitel nicht freigeschaltet.");
   const ip=request.headers.get("cf-connecting-ip")||
    request.headers.get("x-forwarded-for")?.split(",")[0]||"unknown";
   const fp=await hash("arcane-duo-v2-"+ip);
   const {count,error:limitError}=await db.from(TABLE).select("id",{count:"exact",head:true})
    .eq("creator_fingerprint",fp)
    .gte("created_at",new Date(Date.now()-3600000).toISOString());
   if(limitError)throw limitError;
   assert((count||0)<10,"Maximal zehn neue Räume pro Stunde.");
   const id=uuid(),host=secret(),invite=secret();
   const state=game.create({roomId:id,hostName:p.nickname,
    hostDeck:p.deck,hostFusions:p.fusions,
    hostUpgrades:p.upgrades,hostEnhancements:p.enhancements,
    hostEssence:p.essence_binding,hostLv1:p.lv1_research,
    enemyDeckA:enemyDeck(chapter,1),enemyDeckB:enemyDeck(chapter,3),
    enemyFusionsA:enemyFusions(chapter),enemyFusionsB:enemyFusions(chapter),
    chapter,entry,catalog,randomSeed:crypto.getRandomValues(new Uint32Array(1))[0]||1});
   const {error}=await db.from(TABLE).insert({id,status:"waiting",revision:0,state,
    host_token_hash:await hash(host),invitation_hash:await hash(invite),
    host_profile_id:p.id,creator_fingerprint:fp,
    expires_at:new Date(Date.now()+90*86400000).toISOString()});
   if(error)throw error;
   return json({roomId:id,token:host,invite,seat:0,
    state:game.view(state,0)},200,allow);
  }
  assert(typeof roomId==="string"&&/^[0-9a-f-]{36}$/.test(roomId),"Ungültige Raumkennung.");
  const {data:room,error}=await db.from(TABLE).select("*").eq("id",roomId).maybeSingle();
  if(error)throw error;
  assert(room&&new Date(room.expires_at).getTime()>Date.now(),"Raum fehlt oder ist abgelaufen.");
  assert(room.state?.schema===2,"Raum hat keine gültigen 2v2-Regeln.");
  if(kind==="join"){
   assert(isToken(body.invite),"Einladung ungültig.");
   assert(room.status==="waiting"&&!room.guest_token_hash,"Raum bereits besetzt.");
   assert(await hash(body.invite)===room.invitation_hash,"Einladung ungültig.");
   const p=await profileByToken(body.profileToken);
   assert(p.id!==room.host_profile_id,"Du kannst nicht beide Plätze übernehmen.");
   assert(room.state.chapter<=maxChapter(p),"Partner hat dieses Kapitel noch nicht freigeschaltet.");
   const guest=secret(),next=game.apply(room.state,2,{
    type:"join",name:p.nickname,deck:p.deck,fusions:p.fusions,
    upgrades:p.upgrades,enhancements:p.enhancements,
    essence:p.essence_binding,lv1:p.lv1_research},{catalog});
   const {data:updated,error:writeError}=await db.from(TABLE).update({
    state:next,status:next.status,revision:next.revision,
    guest_token_hash:await hash(guest),guest_profile_id:p.id,
    invitation_hash:await hash(secret()),
    updated_at:new Date().toISOString(),
    expires_at:new Date(Date.now()+90*86400000).toISOString()
   }).eq("id",roomId).eq("revision",room.revision).is("guest_token_hash",null)
    .select("id").maybeSingle();
   if(writeError)throw writeError;
   assert(updated,"Ein anderer Spieler ist bereits beigetreten.");
   return json({roomId,token:guest,seat:2,state:game.view(next,2)},200,allow);
  }
  assert(isToken(token),"Sitzung fehlt.");
  const digest=await hash(token);
  let seat=digest===room.host_token_hash?0:digest===room.guest_token_hash?2:-1;
  if(seat<0&&room.host_profile_id){
   const p=await profileByToken(token);
   seat=p.id===room.host_profile_id?0:p.id===room.guest_profile_id?2:-1;
  }
  assert(seat>=0,"Keine Berechtigung.");
  if(kind==="state")return json({seat,state:game.view(room.state,seat)},200,allow);
  assert(kind==="action","Unbekannte Anfrage.");
  assert(Number.isInteger(body.expectedRevision)&&body.expectedRevision===room.revision,
   "Spielstand geändert. Bitte synchronisieren.");
  assert(body.action&&["summon","attack","switch","fusion","end","nextChapter",
   "soulCondense","soulDischarge","soulRaid","soulFocus","essencePredatorMode",
   "lv1Station","lv1Return","lv1GhostSwitch","lv1UseOffer","lv1Floating"].includes(body.action.type),
   "Aktion nicht erlaubt.");
  let next=game.apply(room.state,seat,body.action,{catalog});
  next=game.aiTurn(next,{catalog});
  const {data:updated,error:writeError}=await db.from(TABLE).update({
   state:next,status:next.status,revision:next.revision,
   updated_at:new Date().toISOString(),
   expires_at:new Date(Date.now()+90*86400000).toISOString()
  }).eq("id",roomId).eq("revision",room.revision).select("id").maybeSingle();
  if(writeError)throw writeError;
  assert(updated,"Konkurrierender Zug. Bitte synchronisieren.");
  return json({seat,state:game.view(next,seat)},200,allow);
 }catch(error){
  const message=String(error instanceof Error?error.message:error);
  const safe=/^[\w\säöüÄÖÜß.,:!\-–()]+$/.test(message)&&message.length<=180?
   message:"Online-Aktion fehlgeschlagen.";
  return json({error:safe},400,allow);
 }
});
