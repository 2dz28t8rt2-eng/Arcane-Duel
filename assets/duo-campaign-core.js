/* Arcane Duel — 2v2 campaign rules laboratory. No dependency on the 1v1 globals.
 * The offline demo is deliberately NOT a network room service.
 */
(function(global,factory){
 const core=factory();
 if(typeof module==='object'&&module.exports)module.exports=core;
 if(global)global.ArcaneDuoCore=core;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const SEATS=Object.freeze([
  Object.freeze({id:0,team:0,kind:'human',title:'Du'}),
  Object.freeze({id:1,team:1,kind:'ai',title:'Gegner A'}),
  Object.freeze({id:2,team:0,kind:'human',title:'Partner'}),
  Object.freeze({id:3,team:1,kind:'ai',title:'Gegner B'})
 ]);
 const CHAPTERS=Object.freeze([
  {id:1,name:'Der Pakt am zerbrochenen Tor',description:'Zwei Duellanten begegnen einer vereinten Vorhut.',enemyLevel:2},
  {id:2,name:'Die Zwillinge der Asche',description:'Ein unberechenbares Gegnerduo nutzt unterschiedliche Rollen.',enemyLevel:4},
  {id:3,name:'Das verlorene Siegel',description:'Zwei Hüter verteidigen die letzte Passage.',enemyLevel:6},
  {id:4,name:'Krone der Vier',description:'Das Finale fordert Timing und Zusammenarbeit.',enemyLevel:8}
 ]);
 const CHAPTER_PACKS=Object.freeze({
  1:Object.freeze([101,102,103]),2:Object.freeze([201,202,203]),
  3:Object.freeze([301,302,303]),4:Object.freeze([401,402,403])
 });
 const CHAPTER_LEVEL=Object.freeze({1:2,2:4,3:6,4:8});
 // Three guaranteed cards arrive in the opening hand without expanding the
 // agreed 40-card deck. No permanent inventory is modified by these trials.
 const chapterPack=n=>[...(CHAPTER_PACKS[n]||[])];
 const packDeck=(deck,chapter)=>{const value=[...deck];value.splice(0,3,...chapterPack(chapter));return value;};
 const assert=(v,msg)=>{if(!v)throw new Error(msg);};
 const safeName=s=>String(s??'').trim().slice(0,32);
 const properDeck=deck=>Array.isArray(deck)&&deck.length===40&&
  deck.every(id=>Number.isSafeInteger(id)&&id>=0&&id<=20000)&&
  new Set(deck).size>=1;
 const copy=x=>JSON.parse(JSON.stringify(x));
 const activeTeams=seat=>SEATS[seat]?.team;
 function createLobby({roomId,hostName='Du',hostDeck,enemyDeckA,enemyDeckB,chapter=1,entry='new',lp=16000}={}){
  assert(/^[a-zA-Z0-9_-]{6,64}$/.test(roomId||''),'Ungültige Raumkennung.');
  for(const d of [hostDeck,enemyDeckA,enemyDeckB])assert(properDeck(d),'Ein Deck benötigt genau 40 gültige Karten-IDs.');
  assert(CHAPTERS.some(c=>c.id===chapter),'Unbekanntes Kapitel.');
  assert(entry==='new'||entry==='chapter','Unbekannte Einstiegsmethode.');
  if(entry==='new')assert(chapter===1,'Eine neue Kampagne beginnt immer bei Kapitel I.');
  assert(Number.isInteger(lp)&&lp>=1000&&lp<=100000,'Ungültige Team-LP.');
  const players=[
   {seat:0,name:safeName(hostName)||'Du',kind:'human',team:0,deck:packDeck(hostDeck,chapter)},
   {seat:1,name:'Gegner A',kind:'ai',team:1,deck:[...enemyDeckA]},
   {seat:2,name:'Partner (ausstehend)',kind:'human',team:0,deck:[]},
   {seat:3,name:'Gegner B',kind:'ai',team:1,deck:[...enemyDeckB]}
  ].map(p=>({...p,originalDeck:[...p.deck],baseDeck:p.seat===0?[...hostDeck]:[...p.deck],hand:[],field:Array(7).fill(null),graveyard:[],summoned:false}));
  return {schema:1,mode:'duo-campaign',roomId,chapter,entry,status:'waiting',
   hostSeat:0,activeSeat:0,turn:0,round:1,revision:0,
   teams:[{lp,maxLp:lp},{lp,maxLp:lp}],players,log:['Raum erstellt. Partner wird erwartet.','Kapitel '+chapter+': 3 Karten auf Level '+CHAPTER_LEVEL[chapter]+' für jeden Verbündeten reserviert.'],winner:null};
 }
 function draw(p,count=1){for(let i=0;i<count;i++){if(p.deck.length)p.hand.push(p.deck.shift());}}
 function apply(state,actor,action,{catalog={}}={}){
  assert(state?.schema===1&&state.mode==='duo-campaign','Kein gültiger 2v2-Spielstand.');
  assert(Number.isInteger(actor)&&actor>=0&&actor<=3,'Ungültiger Sitzplatz.');
  assert(action&&typeof action.type==='string','Ungültige Aktion.');
  const g=copy(state),p=g.players[actor];
  if(action.type==='join'){
   assert(g.status==='waiting'&&actor===2,'Partner kann nicht beitreten.');
   assert(properDeck(action.deck),'Partner benötigt ein Deck mit 40 Karten.');
   const name=safeName(action.name);assert(!!name,'Partnername erforderlich.');
   p.name=name;p.baseDeck=[...action.deck];p.originalDeck=packDeck(action.deck,g.chapter);p.deck=packDeck(action.deck,g.chapter);g.status='active';
   for(const player of g.players)draw(player,5);
   g.log.push(name+' ist beigetreten. Das Duell beginnt.');
   g.revision++;return g;
  }
  assert(g.status==='active'||(action.type==='nextChapter'&&g.status==='finished'),'Die 2v2-Partie ist nicht aktiv.');
  assert(g.winner===null||action.type==='nextChapter','Partie bereits beendet.');
  assert(actor===g.activeSeat||action.type==='nextChapter','Du bist nicht am Zug.');
  assert(p.kind===(actor===0||actor===2?'human':'ai'),'Ungültiger Akteur.');
  if(action.type==='nextChapter'){
   assert(actor===0,'Nur der Gastgeber kann das nächste Kapitel starten.');
   assert(g.winner===0&&g.chapter<4,'Das nächste Kapitel ist noch nicht freigeschaltet.');
   const next=g.chapter+1;
   g.chapter=next;g.status='active';g.winner=null;g.activeSeat=0;g.round=1;g.turn=0;
   for(const player of g.players){
    const original=Array.isArray(player.baseDeck)&&player.baseDeck.length===40?player.baseDeck:
      (player.seat===0?state.players[0].originalDeck:player.seat===2?state.players[2].originalDeck:player.seat===1?state.players[1].originalDeck:state.players[3].originalDeck);
    assert(properDeck(original),'Das Kapiteldeck fehlt.');
    player.deck=player.team===0?packDeck(original,next):[...original];
    player.hand=[];player.field=Array(7).fill(null);player.graveyard=[];player.summoned=false;
    draw(player,5);
   }
   for(const t of g.teams){t.lp=t.maxLp;}
   g.log.push('Kapitel '+next+' beginnt. Beide Verbündeten erhalten 3 Karten auf Level '+CHAPTER_LEVEL[next]+'.');
   g.revision++;return g;
  }
  if(action.type==='summon'){
   assert(!p.summoned,'In diesem Zug bereits beschworen.');
   assert(Number.isInteger(action.handIndex)&&action.handIndex>=0&&action.handIndex<p.hand.length,'Handkarte fehlt.');
   assert(Number.isInteger(action.slot)&&action.slot>=0&&action.slot<7&&!p.field[action.slot],'Eigener Feldplatz muss frei sein.');
   const id=p.hand[action.handIndex],t=catalog[id];
   assert(t&&Number.isFinite(t.atk)&&Number.isFinite(t.def)&&t.atk>=0&&t.def>=0,'Unbekannte Kartenwerte.');
   p.hand.splice(action.handIndex,1);
   p.field[action.slot]={id,atk:Math.round(t.atk),def:Math.round(t.def),
    mode:'atk',used:false,placedRound:g.round};
   p.summoned=true;g.log.push(p.name+' beschwört '+(t.name||'Karte '+id)+'.');
  }else if(action.type==='attack'){
   const src=p.field[action.slot];
   assert(Number.isInteger(action.slot)&&src&&src.mode==='atk'&&!src.used,'Angreifer ist nicht bereit.');
   assert(src.placedRound<g.round,'Frisch beschworene Karten können erst nächste Runde angreifen.');
   const enemySeats=SEATS.filter(x=>x.team!==p.team).map(x=>x.id);
   const remaining=enemySeats.some(s=>g.players[s].field.some(Boolean));
   const dSeat=action.targetSeat,dSlot=action.targetSlot;
   if(dSeat===null){
    assert(!remaining,'Solange gegnerische Kreaturen liegen, kein direkter Angriff.');
    g.teams[1-p.team].lp=Math.max(0,g.teams[1-p.team].lp-src.atk);
    g.log.push(p.name+' verursacht '+src.atk+' direkten LP-Schaden.');
   }else{
    assert(enemySeats.includes(dSeat),'Das Ziel muss ein gegnerischer Sitzplatz sein.');
    assert(Number.isInteger(dSlot)&&dSlot>=0&&dSlot<7,'Ungültige Zielzone.');
    const foe=g.players[dSeat],target=foe.field[dSlot];
    assert(!!target,'Kein Ziel auf dem angegebenen Feld.');
    const diff=src.atk-(target.mode==='def'?target.def:target.atk);
    if(diff>=0){foe.graveyard.push(target);foe.field[dSlot]=null;}
    if(target.mode==='atk'){
     if(diff<0){p.graveyard.push(src);p.field[action.slot]=null;g.teams[p.team].lp=Math.max(0,g.teams[p.team].lp+diff);}
     else if(diff>0){g.teams[1-p.team].lp=Math.max(0,g.teams[1-p.team].lp-diff);}
    }else if(diff<0)g.teams[p.team].lp=Math.max(0,g.teams[p.team].lp+diff);
    g.log.push(p.name+' kämpft gegen '+foe.name+' (Differenz '+diff+').');
   }
   if(p.field[action.slot])p.field[action.slot].used=true;
   if(g.teams[0].lp<=0||g.teams[1].lp<=0){g.status='finished';g.winner=g.teams[0].lp>0?0:1;}
  }else if(action.type==='end'){
   const next=(g.activeSeat+1)%4;
   g.activeSeat=next;g.turn++;
   if(next===0)g.round++;
   const incoming=g.players[next];
   incoming.summoned=false;
   for(const c of incoming.field)if(c)c.used=false;
   draw(incoming,1);
   g.log.push('Am Zug: '+incoming.name+'.');
  }else throw Error('Unbekannte Aktion: '+action.type);
  g.revision++;return g;
 }
 function aiTurn(state,{catalog={}}={}){
  assert(state?.status==='active'&&[1,3].includes(state.activeSeat),'Nur KI-Sitzplätze dürfen automatisch ziehen.');
  const seat=state.activeSeat,p=state.players[seat],slot=p.field.findIndex(c=>!c);
  let g=state;
  if(!p.summoned&&slot>=0){
   const idx=p.hand.findIndex(id=>catalog[id]);
   if(idx>=0)g=apply(g,seat,{type:'summon',slot,handIndex:idx},{catalog});
  }
  const my=g.players[seat],target=g.players.filter(x=>x.team!==my.team)
   .flatMap(x=>x.field.map((c,i)=>c?{seat:x.seat,slot:i}:null).filter(Boolean))[0];
  const mySlot=my.field.findIndex(c=>c&&!c.used&&c.placedRound<g.round);
  if(mySlot>=0)g=apply(g,seat,{type:'attack',slot:mySlot,
   targetSeat:target?.seat??null,targetSlot:target?.slot??null},{catalog});
  if(g.status==='active')g=apply(g,seat,{type:'end'},{catalog});
  return g;
 }
 const order=()=>SEATS.map(s=>s.title).join(' → ');
 return Object.freeze({version:'0.3.0',SEATS,CHAPTERS,CHAPTER_PACKS,CHAPTER_LEVEL,chapterPack,packDeck,createLobby,apply,aiTurn,order,properDeck});
});
