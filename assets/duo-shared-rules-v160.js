/* Arcane Duel 2v2 · server-authoritative ruleset v16.0 beta.
 * The same pure reducer runs in Node tests and the Supabase Edge Function.
 * All card IDs/stats are from the generated singleplayer CARDS registry.
 * No browser-provided damage or derived stats are ever trusted.
 */
(function(root,factory){
 const rules=factory();
 if(typeof module==='object'&&module.exports)module.exports=rules;
 if(root)root.ArcaneDuoRules=rules;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const CHAPTERS=[{id:1,name:'Der Pakt am zerbrochenen Tor',level:2},
  {id:2,name:'Die Zwillinge der Asche',level:4},
  {id:3,name:'Das verlorene Siegel',level:6},
  {id:4,name:'Krone der Vier',level:8}];
 const fail=m=>{throw Error(m);};
 const assert=(v,m)=>{if(!v)fail(m);};
 const copy=value=>JSON.parse(JSON.stringify(value));
 const safeName=n=>String(n||'Duellant').replace(/[<>\x00-\x1f]/g,'').trim().slice(0,32)||'Duellant';
 const definition=(catalog,id)=>catalog[id]||catalog[String(id)]||null;
 const allowed=(catalog,id,fusion=false)=>{
  const c=definition(catalog,id);
  return !!c&&c.playable===true&&!!c.fusionOnly===fusion;
 };
 function validDeck(ids,catalog,fusion=false){
  if(!Array.isArray(ids)||ids.length<(fusion?2:40)||ids.length>(fusion?15:40))return false;
  const counts=new Map();
  for(const id of ids){
   if(!Number.isSafeInteger(id)||!allowed(catalog,id,fusion))return false;
   counts.set(id,(counts.get(id)||0)+1);
   if(counts.get(id)>(definition(catalog,id).ace?1:3))return false;
  }
  return true;
 }
 const seats=[{seat:0,team:0,kind:'human'},{seat:1,team:1,kind:'ai'},
  {seat:2,team:0,kind:'human'},{seat:3,team:1,kind:'ai'}];
 const packIds=(catalog,chapter)=>{
  const level=CHAPTERS.find(x=>x.id===chapter)?.level||2;
  return Object.values(catalog).filter(c=>c.playable&&!c.fusionOnly&&!c.ace&&c.level===level)
   .sort((a,b)=>(a.source??0)-(b.source??0)||a.id-b.id)
   .slice(0,3).map(c=>c.id);
 };
 const chapterDeck=(ids,catalog,chapter)=>[...packIds(catalog,chapter),...ids.slice(3)];
 function player(seat,name,deck=[],fusions=[]){
  return {...seats[seat],name,baseDeck:[...deck],baseFusions:[...fusions],
   deck:[...deck],fusionDeck:[...fusions],remainingFusion:[...fusions],hand:[],
   field:Array(7).fill(null),graveyard:[],summoned:false,ownTurns:0};
 }
 function draw(p,n=5){while(p.hand.length<n&&p.deck.length)p.hand.push(p.deck.shift());}
 function create({roomId,hostName,hostDeck,hostFusions,enemyDeckA,enemyDeckB,
    enemyFusionsA,enemyFusionsB,chapter=1,entry='new',catalog}){
  assert(typeof roomId==='string'&&roomId.length>=6,'Raumkennung fehlt.');
  assert(CHAPTERS.some(c=>c.id===chapter),'Ungültiges Kapitel.');
  assert(['new','chapter'].includes(entry),'Ungültiger Einstieg.');
  assert(entry!=='new'||chapter===1,'Neue Kampagne beginnt mit Kapitel I.');
  for(const d of [hostDeck,enemyDeckA,enemyDeckB])
   assert(validDeck(d,catalog),'Hauptdeck muss aus 40 gültigen Einzelspieler-Karten bestehen (maximal 3 Kopien).');
  for(const f of [hostFusions,enemyFusionsA,enemyFusionsB])
   assert(validDeck(f,catalog,true),'Fusionsdeck muss aus 2–15 freigeschalteten Fusionen bestehen (maximal 3 Kopien).');
  return {schema:2,mode:'duo-campaign',ruleset:'duo-v160',roomId,chapter,entry,
   status:'waiting',revision:0,activeSeat:0,turn:0,round:1,uid:1,
   teams:[{lp:16000,maxLp:16000},{lp:16000,maxLp:16000}],
   players:[player(0,safeName(hostName),chapterDeck(hostDeck,catalog,chapter,entry),hostFusions),
    player(1,'Gegner A',enemyDeckA,enemyFusionsA),
    player(2,'Partner (ausstehend)'),player(3,'Gegner B',enemyDeckB,enemyFusionsB)],
   winner:null,log:['Raum erstellt. Der Partner wird erwartet.']};
 }
 function instance(g,id,catalog,{fusion=false,roleOverride=null,quality=1}={}){
  const c=definition(catalog,id);
  assert(c&&c.playable,'Karte existiert nicht im aktuellen Singleplayer-Katalog.');
  return {uid:g.uid++,id,level:c.level,atk:Math.max(0,Math.round(c.atk*quality)),
   def:Math.max(0,Math.round(c.def*quality)),role:roleOverride||c.role||'combatant',
   fusion,mode:'atk',used:false,switched:false,placedRound:g.round,
   resonance:0,soul:0,condensed:0,soulCooldown:0,decayGrace:1};
 }
 const hasCards=(p)=>p.field.some(Boolean);
 function win(g,team,reason){
  g.status='finished';g.winner=team;g.log.push(reason);
 }
 function moveOn(g,catalog){
  g.activeSeat=(g.activeSeat+1)%4;g.turn++;
  if(g.activeSeat===0)g.round++;
  const p=g.players[g.activeSeat];
  p.ownTurns++;p.summoned=false;
  // Deck exhaustion is checked at the START of the owner's next turn.
  if(p.deck.length===0){win(g,1-p.team,p.name+' hat zum Zugbeginn keine Deckkarten mehr.');return;}
  for(const c of p.field){
   if(!c)continue;
   c.used=false;c.switched=false;
   if(c.decayGrace>0)c.decayGrace--;
   else{
    const lost=c.fusion?50:30;
    c.atk=Math.max(0,c.atk-lost);c.def=Math.max(0,c.def-lost);
   }
   if(c.role==='combatant')c.resonance=Math.min(3,c.resonance+1);
   if(c.fusion&&c.role==='resonator')c.resonance=Math.min(2,c.resonance+1);
   if(c.soulCooldown>0)c.soulCooldown--;
  }
  draw(p);
  g.log.push(p.name+' ist am Zug und zieht bis auf fünf Handkarten.');
 }
 function fusionLevel(materials){
  const lv=materials.map(c=>c.level),street=lv.length>=3&&new Set(lv).size===lv.length&&
   [...lv].sort((a,b)=>a-b).every((v,i,a)=>i===0||v===a[i-1]+1);
  const strongest=Math.max(...lv),coreIndex=lv.indexOf(strongest),core=lv[coreIndex];
  const other=lv.filter((_,i)=>i!==coreIndex).sort((a,b)=>Math.abs(a-core)-Math.abs(b-core)||b-a);
  const gap=Math.abs(core-other[0]),base=core>=5?3:core>=3?2:core===2?1:0;
  const gain=gap<=1?base:gap===2?Math.min(base,2):gap===3?Math.min(base,1):gap>=5?-2:-1;
  const chain=materials[coreIndex].fusion===true,floor=chain?core:Math.max(1,core-1);
  const initial=core<=2?Math.min(core,Math.max(1,floor+Math.max(0,gain))):
   Math.max(floor,floor+gain-(chain?1:0));
  const strong=other.length>=2&&other.every(x=>Math.abs(x-core)<=2)&&core>=3;
  const bonus=street?(lv.length===5&&core>=4?1:0):(strong?1:0);
  const pair=core===1&&lv.length===2?2:initial+bonus;
  const r=materials.filter(c=>c.fusion&&c.role==='resonator');
  const ascent=r.length>=2&&!materials.some(c=>c.resonatorAscentUsed);
  return {level:Math.max(1,Math.min(10,Math.min(lv.reduce((a,b)=>a+b,0),pair)+(ascent?1:0))),
   street,resonatorAscent:ascent};
 }
 function materialSelection(p,materials){
  assert(Array.isArray(materials)&&materials.length>=2&&materials.length<=5,
   'Fusion benötigt zwei bis fünf eigene Materialien.');
  const keys=new Set(),cards=[];
  for(const m of materials){
   assert(m&&['hand','field'].includes(m.from)&&Number.isInteger(m.index),
    'Ungültiges Fusionsmaterial.');
   const key=m.from+':'+m.index;assert(!keys.has(key),'Material doppelt ausgewählt.');keys.add(key);
   const card=m.from==='hand'?p.hand[m.index]:p.field[m.index];
   assert(card!==null&&card!==undefined,'Fusionsmaterial ist nicht vorhanden.');
   cards.push(m.from==='hand'?{id:card,level:0,...{_hand:true}}:card);
  }
  return cards;
 }
 function fusionOptions(g,seat,materials,catalog){
  const p=g.players[seat];
  const cards=materialSelection(p,materials).map(c=>c._hand?{id:c.id,level:definition(catalog,c.id).level,
   role:definition(catalog,c.id).role||'combatant',fusion:false,resonance:0}:c);
  const rule=fusionLevel(cards);
  return {rule,cards,templates:[...new Set(p.remainingFusion)].filter(id=>
   definition(catalog,id)?.level<=rule.level&&definition(catalog,id)?.level>=2)};
 }
 function apply(old,seat,action,{catalog}){
  assert(old?.schema===2&&old.mode==='duo-campaign','Unbekanntes 2v2-Spielstandsformat.');
  assert(Number.isInteger(seat)&&seat>=0&&seat<=3,'Ungültiger Sitzplatz.');
  assert(action&&typeof action.type==='string','Aktion fehlt.');
  const g=copy(old),p=g.players[seat];
  if(action.type==='join'){
   assert(g.status==='waiting'&&seat===2,'Raum kann nicht mehr betreten werden.');
   assert(validDeck(action.deck,catalog),'Das Partnerdeck ist ungültig.');
   assert(validDeck(action.fusions,catalog,true),'Das Partner-Fusionsdeck ist ungültig.');
   const partner=player(2,safeName(action.name),chapterDeck(action.deck,catalog,g.chapter,g.entry),action.fusions);
   g.players[2]=partner;g.status='active';
   for(const pl of g.players)draw(pl);
   g.log.push(partner.name+' ist beigetreten. 2v2 beginnt.');
   g.revision++;return g;
  }
  if(action.type==='nextChapter'){
   assert(seat===0&&g.status==='finished'&&g.winner===0&&g.chapter<4,
    'Nur der Gastgeber kann das nächste freigeschaltete Kapitel starten.');
   g.chapter++;g.status='active';g.winner=null;g.round=1;g.turn=0;g.activeSeat=0;
   g.teams.forEach(t=>t.lp=t.maxLp);
   for(const pl of g.players){
    pl.deck=chapterDeck(pl.baseDeck,catalog,g.chapter,'chapter');
    pl.fusionDeck=[...pl.baseFusions];pl.remainingFusion=[...pl.baseFusions];
    pl.hand=[];pl.field=Array(7).fill(null);pl.graveyard=[];pl.summoned=false;pl.ownTurns=0;draw(pl);
   }
   g.log.push('Kapitel '+g.chapter+' beginnt mit vollständigen eigenen Decks.');
   g.revision++;return g;
  }
  assert(g.status==='active'&&g.winner===null,'Partie ist nicht aktiv.');
  assert(seat===g.activeSeat,'Ein anderer Spieler ist am Zug.');
  if(action.type==='summon'){
   assert(!p.summoned,'Dieser Zug hat bereits eine Beschwörung.');
   assert(Number.isInteger(action.handIndex)&&p.hand[action.handIndex]!==undefined,'Handkarte fehlt.');
   assert(Number.isInteger(action.slot)&&action.slot>=0&&action.slot<7&&!p.field[action.slot],'Feldplatz belegt.');
   const id=p.hand[action.handIndex];assert(allowed(catalog,id),'Karte ist nicht regulär beschwörbar.');
   p.hand.splice(action.handIndex,1);p.field[action.slot]=instance(g,id,catalog);
   p.summoned=true;g.log.push(p.name+' beschwört '+definition(catalog,id).name+'.');
  }else if(action.type==='switch'){
   const c=p.field[action.slot];
   assert(c&&!c.used&&!c.switched,'Positionswechsel nicht möglich.');
   c.mode=c.mode==='atk'?'def':'atk';c.switched=true;
   g.log.push(p.name+' ändert die Position von '+definition(catalog,c.id).name+'.');
  }else if(action.type==='fusion'){
   assert(!p.summoned,'Dieser Zug hat bereits eine Beschwörung.');
   assert(Number.isInteger(action.slot)&&action.slot>=0&&action.slot<7,'Ungültiger Zielfeldplatz.');
   const {rule,cards,templates}=fusionOptions(g,seat,action.materials,catalog);
   assert(templates.includes(action.templateId),'Fusionskarte nicht verfügbar oder Stufe zu hoch.');
   const removingField=new Set(action.materials.filter(m=>m.from==='field').map(m=>m.index));
   assert(!p.field[action.slot]||removingField.has(action.slot),'Fusions-Zielfeld ist nicht frei.');
   // Do not alter state until every constraint is verified.
   const types=cards.map((c,i)=>({...c,from:action.materials[i].from}));
   for(const index of action.materials.filter(m=>m.from==='hand').map(m=>m.index).sort((a,b)=>b-a))
    p.hand.splice(index,1);
   for(const index of removingField)p.field[index]=null;
   p.graveyard.push(...types.map(c=>({id:c.id,from:'fusion'})));
   p.remainingFusion.splice(p.remainingFusion.indexOf(action.templateId),1);
   const inherited=types.find(c=>c.from==='field')?.role||types[0].role;
   const normalBonus=types.reduce((sum,c)=>sum+(c.role==='combatant'&&!c.fusion?4+4*(c.resonance||0):0),0);
   const resonatorBonus=types.reduce((sum,c)=>sum+(c.role==='resonator'&&c.fusion?10+10*(c.resonance||0):0),0);
   const quality=1+Math.min(.24,normalBonus/100)+Math.min(.6,resonatorBonus/100);
   const result=instance(g,action.templateId,catalog,{fusion:true,roleOverride:inherited,quality});
   if(rule.resonatorAscent)result.resonatorAscentUsed=true;
   p.field[action.slot]=result;p.summoned=true;
   g.log.push(p.name+' fusioniert '+cards.length+' eigene Monster zu '+
    definition(catalog,action.templateId).name+' (Lv '+result.level+').');
  }else if(action.type==='attack'){
   const src=p.field[action.slot];
   assert(src&&src.mode==='atk'&&!src.used&&src.placedRound<g.round,'Angreifer ist nicht bereit.');
   const foes=g.players.filter(x=>x.team!==p.team);
   const enemy=foes.find(x=>x.seat===action.targetSeat);
   const predators=g.players.filter(x=>x.team===p.team)
    .flatMap(x=>x.field).filter(x=>x?.role==='predator').length;
   const raw=Math.max(0,Math.floor(src.atk*(src.role==='predator'?1+.02*predators:1)));
   if(action.targetSeat===null){
    assert(foes.every(x=>!hasCards(x)),'Direkter Angriff ist durch Gegnerkarten blockiert.');
    g.teams[1-p.team].lp=Math.max(0,g.teams[1-p.team].lp-raw);
    g.log.push(p.name+' verursacht '+raw+' direkten Schaden.');
   }else{
    assert(enemy&&Number.isInteger(action.targetSlot),'Gegnerischer Feldplatz fehlt.');
    const target=enemy.field[action.targetSlot];assert(target,'Ziel ist leer.');
    const power=target.mode==='def'?target.def:target.atk;
    const armor=target.mode==='def'&&['guardian','soul'].includes(target.role)?0.35:0;
    const piercing=src.role==='predator'&&target.mode==='def'&&armor>0?.10:0;
    const eff=raw>power?Math.floor((raw-power)*(1-armor+piercing)):raw-power;
    if(eff>0||eff===0&&target.mode==='atk'){
     enemy.graveyard.push(target);enemy.field[action.targetSlot]=null;
    }
    if(target.mode==='atk'){
     if(eff<=0){p.graveyard.push(src);p.field[action.slot]=null;}
     g.teams[eff<0?p.team:enemy.team].lp=Math.max(0,g.teams[eff<0?p.team:enemy.team].lp-Math.abs(eff));
    }else if(eff<0)g.teams[p.team].lp=Math.max(0,g.teams[p.team].lp+eff);
    if(target.role==='guardian'){
     const counter=Math.floor(target.atk*.5);
     g.teams[p.team].lp=Math.max(0,g.teams[p.team].lp-counter);
     g.log.push('Wächter-Gegenschlag: '+counter+' LP Schaden.');
    }
    g.log.push(p.name+' greift '+enemy.name+' an ('+eff+').');
   }
   if(p.field[action.slot])p.field[action.slot].used=true;
   if(g.teams[0].lp===0||g.teams[1].lp===0)
    win(g,g.teams[0].lp>0?0:1,'Ein Team hat keine LP mehr.');
  }else if(action.type==='end'){
   moveOn(g,catalog);
  }else fail('Unbekannte Aktion.');
  g.revision++;return g;
 }
 function aiTurn(old,{catalog}){
  let g=old,n=0;
  while(g.status==='active'&&[1,3].includes(g.activeSeat)&&n++<2){
   const seat=g.activeSeat,p=g.players[seat],free=p.field.findIndex(x=>!x);
   if(!p.summoned&&free>=0&&p.hand.length){
    const ix=p.hand.findIndex(id=>allowed(catalog,id));
    if(ix>=0)g=apply(g,seat,{type:'summon',handIndex:ix,slot:free},{catalog});
   }
   const active=g.players[seat],foes=g.players.filter(x=>x.team!==active.team);
   const attackers=active.field.map((c,i)=>({c,i})).filter(x=>x.c&&x.c.mode==='atk'&&!x.c.used&&x.c.placedRound<g.round);
   for(const attacker of attackers){
    const goal=g.players.filter(x=>x.team!==active.team)
     .flatMap(x=>x.field.map((c,i)=>c?{seat:x.seat,slot:i,card:c}:null).filter(Boolean))
     .sort((a,b)=>Math.max(a.card.atk,a.card.def)-Math.max(b.card.atk,b.card.def))[0];
    g=apply(g,seat,{type:'attack',slot:attacker.i,targetSeat:goal?.seat??null,
     targetSlot:goal?.slot??null},{catalog});
    if(g.status!=='active')break;
   }
   if(g.status==='active')g=apply(g,seat,{type:'end'},{catalog});
  }
  return g;
 }
 function view(g,seat){
  const v=copy(g);
  delete v.uid;
  for(const p of v.players){
   delete p.baseDeck;delete p.baseFusions;
   p.deck=Array(p.deck.length).fill(null);
   if(p.seat!==seat)p.hand=Array(p.hand.length).fill(null);
   if(p.seat!==seat){p.fusionDeck=Array(p.fusionDeck.length).fill(null);
    p.remainingFusion=Array(p.remainingFusion.length).fill(null);}
  }
  return v;
 }
 return Object.freeze({version:'16.0-beta',CHAPTERS,seats,allowed,validDeck,packIds,
  chapterDeck,create,apply,aiTurn,view,fusionLevel,fusionOptions});
});
