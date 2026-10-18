import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { ArcaneDuoCore as core } from "./duo-core.mjs";

const API_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const db = createClient(API_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const TABLE = "arcane_duo_rooms";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff"
};
// Only these server-approved cards can be played in the prototype.
// Player-supplied card stats are NEVER trusted.
const CATALOG = Object.freeze({
  1:{name:"Runenfuchs",atk:260,def:170},
  2:{name:"Mooswächter",atk:140,def:340},
  3:{name:"Klingenwolf",atk:420,def:150},
  4:{name:"Sternenrufer",atk:300,def:290},
  5:{name:"Dornenschreiter",atk:350,def:210},
  6:{name:"Eisenhüter",atk:180,def:450},
  7:{name:"Aschenritter",atk:440,def:220},
  8:{name:"Glutgreif",atk:460,def:310}
});
const deck = (ids:number[])=>Array.from({length:40},(_,i)=>ids[i%ids.length]);
const hex = (n:number)=>Array.from(crypto.getRandomValues(new Uint8Array(n)),v=>v.toString(16).padStart(2,"0")).join("");
const hash = async(s:string)=>{
 const raw=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));
 return Array.from(new Uint8Array(raw),v=>v.toString(16).padStart(2,"0")).join("");
};
const respond = (value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:CORS});
const invalid = (msg:string,status=400)=>respond({error:msg},status);
const validRoom=(s:unknown):s is string=>typeof s==="string"&&/^[0-9a-f]{24}$/.test(s);
const validToken=(s:unknown):s is string=>typeof s==="string"&&/^[0-9a-f]{64}$/.test(s);
const publicSnapshot=(state:any,seat:number)=>{
 // The database stores PRIVATE full state. Never expose other hands/decks.
 const g=structuredClone(state);
 for(const p of g.players){
  p.deckCount=p.deck.length;p.handCount=p.hand.length;
  p.deck=[];p.hand=p.seat===seat?p.hand:[];
 }
 return g;
};
const fetchRoom=async(id:string)=>{
 const {data,error}=await db.from(TABLE).select(
  "id,revision,room_status,host_token_hash,invite_token_hash,partner_token_hash,state,expires_at"
 ).eq("id",id).maybeSingle();
 if(error)throw Error("DB_READ");
 return data;
};
const saveCAS=async (id:string,revision:number,patch:Record<string,unknown>)=>{
 const {data,error}=await db.from(TABLE).update({
  ...patch,revision:revision+1,updated_at:new Date().toISOString()
 }).eq("id",id).eq("revision",revision).select("id").maybeSingle();
 if(error)throw Error("DB_WRITE");
 return !!data;
};
const seatFor=(row:any,digest:string)=>{
 if(digest===row.host_token_hash)return 0;
 if(row.partner_token_hash&&digest===row.partner_token_hash)return 2;
 return null;
};
function assertCardDeck(cards:unknown){
 // The prototype accepts catalog cards only; never trust incoming stats.
 return core.properDeck(cards)&&(cards as number[]).every(id=>Object.hasOwn(CATALOG,id));
}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:CORS});
 if(req.method!=="POST")return invalid("POST erforderlich",405);
 if(Number(req.headers.get("content-length")||0)>10000)return invalid("Anfrage zu groß",413);
 let body:any;
 try{body=await req.json()}catch{return invalid("Ungültiges JSON");}
 if(!body||typeof body!=="object")return invalid("Ungültige Anfrage");
 try{
  const action=String(body.op||"");
  if(action==="create"){
   const name=String(body.name||"").trim().slice(0,32);
   if(!name)return invalid("Spielername fehlt.");
   const chapter=Number(body.chapter||1);
   if(!core.CHAPTERS.some(c=>c.id===chapter))return invalid("Kapitel unbekannt.");
   const roomId=hex(12),hostToken=hex(32),inviteToken=hex(32);
   const state=core.createLobby({roomId,hostName:name,chapter,lp:16000,
    hostDeck:deck([1,2,3,4]),enemyDeckA:deck([2,5,6]),enemyDeckB:deck([3,7,8])});
   const expires=new Date(Date.now()+7*24*60*60*1000).toISOString();
   const {error}=await db.from(TABLE).insert({
    id:roomId,revision:state.revision,room_status:"waiting",
    host_token_hash:await hash(hostToken),invite_token_hash:await hash(inviteToken),
    state,expires_at:expires
   });
   if(error)throw Error("DB_WRITE");
   return respond({roomId,seat:0,token:hostToken,inviteToken,
    revision:state.revision,state:publicSnapshot(state,0),expiresAt:expires},201);
  }
  if(!validRoom(body.roomId))return invalid("Ungültige Raumkennung");
  const row=await fetchRoom(body.roomId);
  if(!row||new Date(row.expires_at).getTime()<=Date.now())
   return invalid("Raum nicht gefunden oder abgelaufen",404);
  if(action==="join"){
   if(!validToken(body.inviteToken))return invalid("Einladung ungültig",403);
   const inviteHash=await hash(body.inviteToken);
   if(row.room_status!=="waiting"||!row.invite_token_hash||
      row.invite_token_hash!==inviteHash)return invalid("Einladung bereits verwendet oder ungültig",403);
   const name=String(body.name||"").trim().slice(0,32);
   if(!name)return invalid("Spielername fehlt");
   const next=core.apply(row.state,2,{type:"join",name,deck:deck([4,1,6,3])});
   const token=hex(32);
   if(!await saveCAS(row.id,row.revision,{
     state:next,partner_token_hash:await hash(token),invite_token_hash:null,room_status:"active"
   }))return invalid("Der Raum wurde inzwischen geändert",409);
   return respond({roomId:row.id,seat:2,token,revision:next.revision,
    state:publicSnapshot(next,2)});
  }
  if(!validToken(body.token))return invalid("Raumzugang erforderlich",403);
  const seat=seatFor(row,await hash(body.token));
  if(seat===null)return invalid("Kein gültiger Zugriff auf diesen Raum",403);
  if(action==="state"){
   return respond({roomId:row.id,seat,revision:row.revision,
    state:publicSnapshot(row.state,seat)});
  }
  if(action!=="act")return invalid("Unbekannte Aktion",400);
  if(!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision!==row.revision)
   return invalid("Spielstand hat sich geändert. Bitte aktualisieren.",409);
  const cmd=body.action;
  if(!cmd||!["summon","attack","end"].includes(cmd.type))
   return invalid("Ungültige Spielaktion");
  let next;
  try{
   next=core.apply(row.state,seat,cmd,{catalog:CATALOG});
   if(next.status==="active"&&[1,3].includes(next.activeSeat)){
    next=core.aiTurn(next,{catalog:CATALOG});
   }
  }catch(e){
   return invalid(e instanceof Error?e.message:"Aktion nicht erlaubt",400);
  }
  if(!await saveCAS(row.id,row.revision,{
   state:next,room_status:next.status
  }))return invalid("Gleichzeitige Aktion: bitte Raum aktualisieren",409);
  // Action may generate 2 reducer revisions (human then NPC). Database revision
  // increments exactly once per accepted request and remains the CAS authority.
  return respond({roomId:row.id,seat,revision:row.revision+1,
   state:publicSnapshot(next,seat)});
 }catch(e){
  console.error("Arcane Duo room:",e instanceof Error?e.message:"unknown");
  return invalid("Der Raumserver ist gerade nicht verfügbar.",503);
 }
});
