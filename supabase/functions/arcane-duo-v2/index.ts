/* 2v2 v16.5 beta. Isolated from the legacy arcane-duo endpoint/room table.
 * Client sends choices only. Deck legality, fusion levels, roles, damage,
 * draw order, turn ownership and private state live on the server.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2";
import snapshot from "./catalog.json" with {type:"json"};
import "./duo-rules.js";

const game=globalThis.ArcaneDuoRules;
if(!game)throw Error("Missing authoritative 2v2 rules");
const catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c]));
const starter=snapshot.starterMain;
const db=createClient(Deno.env.get("SUPABASE_URL")||"",
 Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"",
 {auth:{persistSession:false,autoRefreshToken:false}});
const TABLE="arcane_duo_v2_rooms";
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
Deno.serve(async request=>{
 const origin=request.headers.get("origin")||"";
 const allow=origins.has(origin)?origin:"";
 if(request.method==="OPTIONS")return allow?json({},200,allow):new Response(null,{status:403});
 if(request.method!=="POST"||!allow)return json({error:"Nicht erlaubte Anfrage"},403,allow);
 let body;
 try{
  body=await request.json();
  assert(body&&typeof body==="object"&&JSON.stringify(body).length<=12000,"Anfrage zu groß.");
 }catch{return json({error:"Ungültiges Anfrageformat."},400,allow);}
 try{
  const kind=body.type,roomId=body.roomId,token=body.token;
  if(kind==="create"){
   const entry=body.entry||"new";
   assert(entry==="new"||entry==="chapter","Unbekannter Kampagnenstart.");
   const chapter=entry==="new"?1:body.chapter;
   assert(Number.isInteger(chapter)&&chapter>=1&&chapter<=4,"Ungültiges Kapitel.");
   const ip=request.headers.get("cf-connecting-ip")||
    request.headers.get("x-forwarded-for")?.split(",")[0]||"unknown";
   const fingerprint=await hash("arcane-duo-v2-"+ip);
   const {count,error:limitError}=await db.from(TABLE).select("id",{count:"exact",head:true})
    .eq("creator_fingerprint",fingerprint)
    .gte("created_at",new Date(Date.now()-3600000).toISOString());
   if(limitError)throw limitError;
   assert((count||0)<10,"Maximal zehn neue Räume pro Stunde.");
   const id=uuid(),host=secret(),invite=secret();
   const state=game.create({roomId:id,hostName:safeName(body.name),
    hostDeck:body.deck,hostFusions:body.fusions,
    hostUpgrades:body.upgrades,hostEnhancements:body.enhancements,
    hostEssence:body.essence,hostLv1:body.lv1,
    enemyDeckA:enemyDeck(chapter,1),enemyDeckB:enemyDeck(chapter,3),
    enemyFusionsA:enemyFusions(chapter),enemyFusionsB:enemyFusions(chapter),
    chapter,entry,catalog,
    randomSeed:crypto.getRandomValues(new Uint32Array(1))[0]||1});
   const {error}=await db.from(TABLE).insert({id,status:"waiting",revision:0,state,
    host_token_hash:await hash(host),invitation_hash:await hash(invite),
    creator_fingerprint:fingerprint});
   if(error)throw error;
   return json({roomId:id,token:host,invite,seat:0,state:game.view(state,0)},200,allow);
  }
  assert(typeof roomId==="string"&&/^[0-9a-f-]{36}$/.test(roomId),"Ungültige Raumkennung.");
  const {data:room,error}=await db.from(TABLE).select("*").eq("id",roomId).maybeSingle();
  if(error)throw error;
  assert(room&&new Date(room.expires_at).getTime()>Date.now(),"Raum fehlt oder ist abgelaufen.");
  assert(room.state?.schema===2,"Der Raum gehört zu einer anderen Regelversion.");
  if(kind==="join"){
   assert(typeof body.invite==="string"&&/^[0-9a-f]{64}$/.test(body.invite),"Einladung ungültig.");
   assert(room.status==="waiting"&&!room.guest_token_hash,"Raum bereits besetzt.");
   assert(await hash(body.invite)===room.invitation_hash,"Einladung ungültig.");
   const guest=secret(),next=game.apply(room.state,2,
    {type:"join",name:body.name,deck:body.deck,fusions:body.fusions,
     upgrades:body.upgrades,enhancements:body.enhancements,
     essence:body.essence,lv1:body.lv1},{catalog});
   const {data:updated,error:writeError}=await db.from(TABLE).update({state:next,
    status:next.status,revision:next.revision,guest_token_hash:await hash(guest),
    invitation_hash:await hash(secret())}).eq("id",roomId)
    .eq("revision",room.revision).is("guest_token_hash",null).select("id").maybeSingle();
   if(writeError)throw writeError;
   assert(updated,"Ein anderer Spieler hat den Raum bereits betreten.");
   return json({roomId,token:guest,seat:2,state:game.view(next,2)},200,allow);
  }
  assert(typeof token==="string"&&/^[0-9a-f]{64}$/.test(token),"Sitzung fehlt.");
  const digest=await hash(token);
  const seat=digest===room.host_token_hash?0:digest===room.guest_token_hash?2:-1;
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
  const {data:updated,error:writeError}=await db.from(TABLE).update({state:next,
   status:next.status,revision:next.revision}).eq("id",roomId).eq("revision",room.revision)
   .select("id").maybeSingle();
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
