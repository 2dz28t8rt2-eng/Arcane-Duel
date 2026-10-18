import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const URL=Deno.env.get("SUPABASE_URL")||"";
const KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const db=createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const origins=new Set(["https://raw.githack.com","https://2dz28t8rt2-eng.github.io","http://localhost:8757","http://127.0.0.1:8757"]);
const catalog:Record<number,{name:string,atk:number,def:number}>={
 1:{name:"Runenfuchs",atk:260,def:170},2:{name:"Mooswächter",atk:140,def:340},
 3:{name:"Klingenwolf",atk:420,def:150},4:{name:"Sternenrufer",atk:300,def:290},
 5:{name:"Dornenschreiter",atk:350,def:210},6:{name:"Eisenhüter",atk:180,def:450},
 7:{name:"Aschenritter",atk:440,def:220},8:{name:"Glutgreif",atk:460,def:310},
101:{name:"Wurzelwacht",atk:360,def:390,level:2},
102:{name:"Glutspäher",atk:460,def:270,level:2},
103:{name:"Sternenfalter",atk:420,def:310,level:2},
201:{name:"Runenjäger",atk:610,def:500,level:4},
202:{name:"Felsbastion",atk:420,def:780,level:4},
203:{name:"Frostgreif",atk:720,def:410,level:4},
301:{name:"Donnerkoloss",atk:950,def:660,level:6},
302:{name:"Schattenhüter",atk:660,def:1070,level:6},
303:{name:"Himmelsdrache",atk:1080,def:570,level:6},
401:{name:"Aetherarchon",atk:1360,def:970,level:8},
402:{name:"Leviathan der Tiefe",atk:1030,def:1400,level:8},
403:{name:"Klingenseraph",atk:1560,def:810,level:8}
};
const deck=(ids:number[])=>Array.from({length:40},(_,i)=>ids[i%ids.length]);
const CHAPTER_LEVEL:Record<number,number>={1:2,2:4,3:6,4:8};
const CHAPTER_PACKS:Record<number,number[]>={1:[101,102,103],2:[201,202,203],3:[301,302,303],4:[401,402,403]};
const starterDeck=(seat:number)=>deck(seat===0?[1,2,3,4]:seat===1?[2,5,6]:seat===2?[4,1,6,3]:[3,7,8]);
const packDeck=(baseline:number[],chapter:number)=>{
 const d=[...baseline];d.splice(0,3,...CHAPTER_PACKS[chapter]);return d;
};
const validDeck=(d:unknown)=>Array.isArray(d)&&d.length===40&&d.every(x=>Number.isInteger(x)&&catalog[x]);
const name=(v:unknown)=>String(v||"Duellant").replace(/[\x00-\x1f<>]/g,"").trim().slice(0,32)||"Duellant";
const uuid=()=>crypto.randomUUID();
const secret=()=>{const b=crypto.getRandomValues(new Uint8Array(32));return Array.from(b,x=>x.toString(16).padStart(2,"0")).join("")};
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,"0")).join("");
const copy=(s:any)=>structuredClone(s);
const draw=(p:any,n=1)=>{for(let i=0;i<n;i++)if(p.deck.length)p.hand.push(p.deck.shift())};
function initial(id:string,n:string,ch:number,entry:"new"|"chapter"){
 const decks=[packDeck(starterDeck(0),ch),packDeck(starterDeck(1),ch),[],packDeck(starterDeck(3),ch)];
 const players=decks.map((d,seat)=>({seat,team:seat%2,kind:seat%2===0?"human":"ai",name:[n,"Gegner A","Partner (ausstehend)","Gegner B"][seat],deck:d,hand:[],field:Array(7).fill(null),graveyard:[],summoned:false}));
 return {schema:1,mode:"duo-campaign",roomId:id,chapter:ch,entry,chapterLevel:CHAPTER_LEVEL[ch],chapterPack:[...CHAPTER_PACKS[ch]],status:"waiting",activeSeat:0,turn:0,round:1,revision:0,teams:[{lp:16000,maxLp:16000},{lp:16000,maxLp:16000}],players,log:["Raum erstellt. Partner wird erwartet.","Kapitel "+ch+": Alle Verbündeten erhalten drei Level-"+CHAPTER_LEVEL[ch]+"-Karten im Startdeck."],winner:null};
}
function assert(x:unknown,msg:string):asserts x{if(!x)throw new Error(msg)}
function apply(current:any,seat:number,a:any){
 const g=copy(current),p=g.players[seat];
 if(a.type==="join"){
  assert(g.status==="waiting"&&seat===2,"Raum ist nicht mehr frei");
  assert(validDeck(a.deck),"Ungültiges 40-Karten-Deck");
  p.name=name(a.name);p.deck=packDeck(starterDeck(2),g.chapter);g.status="active";
  for(const player of g.players)draw(player,5);
  g.log.push(p.name+" ist beigetreten.");
  g.revision++;return g;
 }
 if(a.type==="nextChapter"){
  assert(seat===0,"Nur der Gastgeber darf ein neues Kapitel beginnen");
  assert(g.status==="finished"&&g.winner===0&&g.chapter<4,"Das nächste Kapitel ist noch gesperrt");
  const chapter=g.chapter+1;
  g.chapter=chapter;g.chapterLevel=CHAPTER_LEVEL[chapter];g.chapterPack=[...CHAPTER_PACKS[chapter]];
  g.status="active";g.winner=null;g.turn=0;g.round=1;g.activeSeat=0;
  for(const pl of g.players){
   pl.deck=packDeck(starterDeck(pl.seat),chapter);
   pl.hand=[];pl.field=Array(7).fill(null);pl.graveyard=[];pl.summoned=false;
   draw(pl,5);
  }
  for(const t of g.teams)t.lp=t.maxLp;
  g.log.push("Kapitel "+chapter+" freigeschaltet: drei Level-"+CHAPTER_LEVEL[chapter]+"-Karten pro Verbündetem.");
  g.revision++;return g;
 }
 assert(g.status==="active"&&g.winner===null,"Partie ist nicht aktiv");
 assert(seat===g.activeSeat,"Ein anderer Spieler ist am Zug");
 if(a.type==="summon"){
  assert(!p.summoned,"Bereits beschworen");
  assert(Number.isInteger(a.slot)&&a.slot>=0&&a.slot<7&&!p.field[a.slot],"Ungültiger Feldplatz");
  assert(Number.isInteger(a.handIndex)&&a.handIndex>=0&&a.handIndex<p.hand.length,"Ungültige Handkarte");
  const id=p.hand.splice(a.handIndex,1)[0],t=catalog[id];
  assert(t,"Ungültige Karten-ID");
  p.field[a.slot]={id,atk:t.atk,def:t.def,mode:"atk",used:false,placedRound:g.round};
  p.summoned=true;g.log.push(p.name+" beschwört "+t.name);
 }else if(a.type==="attack"){
  assert(Number.isInteger(a.slot)&&a.slot>=0&&a.slot<7,"Ungültiger Angreifer");
  const src=p.field[a.slot];assert(src&&src.mode==="atk"&&!src.used&&src.placedRound<g.round,"Angriff nicht erlaubt");
  const targets=g.players.filter((x:any)=>x.team!==p.team);
  if(a.targetSeat===null){
   assert(targets.every((x:any)=>x.field.every((c:any)=>!c)),"Direkter Angriff ist blockiert");
   g.teams[1-p.team].lp=Math.max(0,g.teams[1-p.team].lp-src.atk);
  }else{
   assert(Number.isInteger(a.targetSeat)&&g.players[a.targetSeat]?.team!==p.team,"Ungültiges Gegnerfeld");
   assert(Number.isInteger(a.targetSlot)&&a.targetSlot>=0&&a.targetSlot<7,"Ungültige Zielzone");
   const foe=g.players[a.targetSeat],d=foe.field[a.targetSlot];assert(d,"Ziel fehlt");
   const delta=src.atk-(d.mode==="def"?d.def:d.atk);
   if(delta>=0){foe.graveyard.push(d);foe.field[a.targetSlot]=null}
   if(d.mode==="atk"){
    if(delta<0){p.graveyard.push(src);p.field[a.slot]=null;g.teams[p.team].lp=Math.max(0,g.teams[p.team].lp+delta)}
    else if(delta>0)g.teams[1-p.team].lp=Math.max(0,g.teams[1-p.team].lp-delta);
   }else if(delta<0)g.teams[p.team].lp=Math.max(0,g.teams[p.team].lp+delta);
  }
  if(p.field[a.slot])p.field[a.slot].used=true;
  g.log.push(p.name+" greift an.");
  if(g.teams[0].lp===0||g.teams[1].lp===0){g.status="finished";g.winner=g.teams[0].lp>0?0:1}
 }else if(a.type==="end"){
  g.activeSeat=(seat+1)%4;g.turn++;
  if(g.activeSeat===0)g.round++;
  const next=g.players[g.activeSeat];next.summoned=false;
  for(const c of next.field)if(c)c.used=false;
  draw(next);g.log.push("Am Zug: "+next.name);
 }else throw Error("Unbekannte Aktion");
 g.revision++;return g;
}
function auto(g:any){
 let n=0;
 while(g.status==="active"&&(g.activeSeat===1||g.activeSeat===3)&&n++<5){
  const seat=g.activeSeat,p=g.players[seat],slot=p.field.findIndex((x:any)=>!x);
  if(slot>=0&&!p.summoned&&p.hand.length)g=apply(g,seat,{type:"summon",slot,handIndex:0});
  const src=g.players[seat].field.findIndex((c:any)=>c&&!c.used&&c.placedRound<g.round);
  if(src>=0){
   const t=g.players.filter((x:any)=>x.team!==p.team).flatMap((x:any)=>x.field.map((c:any,i:number)=>c?{seat:x.seat,slot:i}:null).filter(Boolean))[0];
   g=apply(g,seat,{type:"attack",slot:src,targetSeat:t?.seat??null,targetSlot:t?.slot??null});
  }
  if(g.status==="active")g=apply(g,seat,{type:"end"});
 }
 return g;
}
function view(g:any,seat:number){
 const v=copy(g);
 for(const p of v.players){
  delete p.baseDeck;delete p.originalDeck;
  p.deck=Array(p.deck.length).fill(null);
  if(p.seat!==seat)p.hand=Array(p.hand.length).fill(null);
 }
 return v;
}
const response=(body:any,status=200,origin="")=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":origin||"https://raw.githack.com","Access-Control-Allow-Headers":"Content-Type, apikey, authorization","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"}});
Deno.serve(async(req)=>{
 const origin=req.headers.get("origin")||"";
 const allow=origins.has(origin)?origin:"";
 if(req.method==="OPTIONS")return allow?response({},200,allow):new Response(null,{status:403});
 if(req.method!=="POST"||!allow)return response({error:"Nicht erlaubte Anfrage"},403,allow);
 let body:any;
 try{body=await req.json();assert(JSON.stringify(body).length<4000,"Anfrage zu groß")}catch{return response({error:"Ungültige Anfrage"},400,allow)}
 const kind=body?.type,roomId=body?.roomId,token=body?.token;
 try{
  if(kind==="create"){
   const entry=body.entry===undefined?"new":body.entry;
   assert(entry==="new"||entry==="chapter","Unbekannter Kampagnenstart");
   const chapter=entry==="new"?1:body.chapter;
   assert(Number.isInteger(chapter)&&chapter>=1&&chapter<=4,"Ungültiges Kapitel");
   const ip=req.headers.get("cf-connecting-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]||"unknown";
   const fingerprint=await hash("arcane-duo-"+ip);
   const {count,error:limitErr}=await db.from("arcane_duo_rooms").select("id",{count:"exact",head:true}).eq("creator_fingerprint",fingerprint).gte("created_at",new Date(Date.now()-3600000).toISOString());
   if(limitErr)throw limitErr;
   assert((count||0)<10,"Maximal 10 neue Räume pro Stunde");
   const id=uuid(),host=secret(),invite=secret(),state=initial(id,name(body.name),chapter,entry);
   const {error}=await db.from("arcane_duo_rooms").insert({id,status:"waiting",revision:0,state,host_token_hash:await hash(host),invitation_hash:await hash(invite),creator_fingerprint:fingerprint});
   if(error)throw error;
   return response({roomId:id,token:host,invite,seat:0,state:view(state,0)},200,allow);
  }
  assert(typeof roomId==="string"&&/^[a-f0-9-]{36}$/.test(roomId),"Ungültige Raumkennung");
  const {data:row,error}=await db.from("arcane_duo_rooms").select("*").eq("id",roomId).maybeSingle();
  if(error)throw error;
  assert(row&&new Date(row.expires_at).getTime()>Date.now(),"Raum nicht gefunden oder abgelaufen");
  if(kind==="join"){
   assert(typeof body.invite==="string"&&body.invite.length===64,"Einladung ungültig");
   assert(row.status==="waiting"&&!row.guest_token_hash,"Raum bereits besetzt");
   assert(await hash(body.invite)===row.invitation_hash,"Einladung ungültig");
   const guest=secret(),next=apply(row.state,2,{type:"join",name:body.name,deck:starterDeck(2)});
   const {data:updated,error:writeErr}=await db.from("arcane_duo_rooms").update({state:next,status:next.status,revision:next.revision,guest_token_hash:await hash(guest),invitation_hash:await hash(secret())})
    .eq("id",roomId).eq("revision",row.revision).is("guest_token_hash",null).select("id").maybeSingle();
   if(writeErr)throw writeErr;
   assert(updated,"Raum wurde bereits belegt");
   return response({roomId,token:guest,seat:2,state:view(next,2)},200,allow);
  }
  assert(typeof token==="string"&&token.length===64,"Sitzung fehlt");
  const digest=await hash(token),seat=digest===row.host_token_hash?0:digest===row.guest_token_hash?2:-1;
  assert(seat>=0,"Keine Berechtigung");
  if(kind==="state")return response({seat,state:view(row.state,seat)},200,allow);
  assert(kind==="action","Unbekannte Anfrage");
  assert(Number.isInteger(body.expectedRevision)&&body.expectedRevision===row.revision,"Spielstand geändert, bitte neu laden");
  assert(body.action&&["summon","attack","end","nextChapter"].includes(body.action.type),"Aktion nicht erlaubt");
  let next=apply(row.state,seat,body.action);
  next=auto(next);
  const {data:updated,error:writeErr}=await db.from("arcane_duo_rooms").update({state:next,status:next.status,revision:next.revision})
    .eq("id",roomId).eq("revision",row.revision).select("id").maybeSingle();
  if(writeErr)throw writeErr;
  assert(updated,"Konkurrierende Aktion: bitte neu laden");
  return response({seat,state:view(next,seat)},200,allow);
 }catch(e){const msg=String(e instanceof Error?e.message:e);
  const safe=/^(\w|\s|[äöüÄÖÜß,.:!-])+$/.test(msg)&&msg.length<180?msg:"Anfrage fehlgeschlagen";
  return response({error:safe},400,allow);
 }
});
