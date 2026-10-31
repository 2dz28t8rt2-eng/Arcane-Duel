/* Arcane Duel 2v2 · server-authoritative ruleset v20.2 beta.
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
  {id:4,name:'Krone der Vier',level:8},
  {id:5,name:'Die vergessene Schmiede',level:8},
  {id:6,name:'Der Sturm der Runen',level:9},
  {id:7,name:'Das zersplitterte Firmament',level:9},
  {id:8,name:'Die Bastion der Schatten',level:10},
  {id:9,name:'Der Thron ohne Herrscher',level:10},
  {id:10,name:'Die Prüfung der Hochmütigen',level:10}];
 // Independent five-part side campaign. IDs are deliberately disjoint from
 // the ten main chapters so old completed chapters keep their meaning.
 const QUESTS=[
  {id:11,name:'Der hoffnungslose Forscher',level:1,goal:'win',
   dialogue:'Meine kleinen Freunde verbergen ein Geheimnis. Ihr werdet es sehen!',
   after:'Die winzigen Kreaturen hinterlassen Echos. Erforsche das Schweben!'},
  {id:12,name:'Die erste Regung',level:2,goal:'floating',
   dialogue:'Sie verschwinden nicht einfach! Beweist mir, dass ihr Echo lebt!',
   after:'Das Schweben ist erst der Anfang. Als Nächstes kommt der Schwarm.'},
  {id:13,name:'Die Stimme des Schwarms',level:4,goal:'swarm',
   dialogue:'Warum gehorchen diese winzigen Geister ausgerechnet euch?',
   after:'Er kehrt der Forschung den Rücken und sammelt stärkere Predatoren.'},
  {id:14,name:'Die verworfene Lehre',level:5,goal:'special',
   dialogue:'Schluss mit dem Geisterspiel! Zeigt mir eure verbotene Fusion!',
   after:'Eine letzte Prüfung bleibt. Die Verzweiflung wächst.'},
  {id:15,name:'Der letzte Funke · Lumiras Fall',level:7,goal:'all',
   dialogue:'Lumira ... ein letztes Mal! Ich brauche keine schwachen Geister mehr!',
   after:'Der Fall ist überstanden. Das Vermächtnis der Level-1-Forschung gehört euch.'}
 ];
 const ENCOUNTERS=[...CHAPTERS,...QUESTS];
 const encounter=id=>ENCOUNTERS.find(c=>c.id===id);
 const isQuest=id=>id>=11&&id<=15;
 // Same LP progression as duelStartingLP('pve',tier,'easy','tournament')
 // in the singleplayer; Lv1 sidequest LP come from DECK_PROFILES in its saga.
 const QUEST_SOLO_LP=[2000,2000,4000,4000,8000];
 const soloStartingLp=chapter=>isQuest(chapter)?QUEST_SOLO_LP[chapter-11]:
  chapter<=3?2000:chapter<=8?4000:8000;
 const duoStartingLp=chapter=>soloStartingLp(chapter)*2;
 const opponentNames=chapter=>chapter===10?['Eiman Huel Stalker','Hans Ess Kirk']:
  isQuest(chapter)?['Der Level-1-Fanatiker',chapter===15?'Verderbter Adept':'Fanatikers Adept']:
  ['Gegner A','Gegner B'];
 const questPassed=g=>{
  const goal=encounter(g.chapter)?.goal,q=g.questProgress||{};
  return !isQuest(g.chapter)||goal==='win'||goal==='floating'&&q.floating>0||
   goal==='swarm'&&q.swarm>0||goal==='special'&&q.special>0||
   goal==='all'&&q.floating>0&&q.swarm>0&&q.special>0;
 };
 const fail=m=>{throw Error(m);};
 const assert=(v,m)=>{if(!v)fail(m);};
 const copy=value=>JSON.parse(JSON.stringify(value));
 const safeName=n=>String(n||'Duellant').replace(/[<>\x00-\x1f]/g,'').trim().slice(0,32)||'Duellant';
 const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
 // The solo Level-1 fanatic starts at 0.38x. Never silently clamp a real
 // solo NPC loadout back to 1.0x during 2v2 parity conversion.
 const npcPower=value=>Number.isFinite(value)&&value>=.1&&value<=1.5?value:1;
 const round10=n=>Math.round(n/10)*10;
 const roomSeed=id=>{let h=2166136261;for(const ch of String(id)){
  h=Math.imul(h^ch.charCodeAt(0),16777619);
 }return h>>>0||1;};
 function randomInt(g,bound){
  assert(Number.isInteger(bound)&&bound>0&&bound<=10000,'Ungültige Würfelgröße.');
  let x=(g.rngSeed??roomSeed(g.roomId))>>>0;
  x^=x<<13;x^=x>>>17;x^=x<<5;
  g.rngSeed=x>>>0||1;
  return g.rngSeed%bound;
 }
 const definition=(catalog,id)=>catalog[id]||catalog[String(id)]||null;
 const PERK_LIMITS=Object.freeze({power:10,jagdinstinkt:5,schildwall:5,
  resilience:2,combatDiscipline:3,fusionLore:1,fusionPrecision:3,openingAegis:3});
 const ESSENCE_SCHOOLS=['predator','fusion','defense'];
 const essencePerkRank=tier=>1+(tier>=5?1:0)+(tier>=7?1:0)+
  (tier>=8?1:0)+(tier>=10?1:0);
 const essenceLevel=tier=>tier>=10?10:tier>=8?7:tier>=5?5:3;
 const essenceRankCap=tier=>tier>=10?5:tier>=8?4:tier>=5?3:tier>=3?2:0;
 const TRAINING_BONUSES=[35,25,15,10,8,6,4,3,2,2];
 const DECAY_BY_LEVEL=[0,20,25,30,40,55,65,80,105,135,170];
 const perk=(p,key)=>clamp(p?.upgrades?.[key]||0,0,PERK_LIMITS[key]||0);
 function normalizedBuild(upgrades={},enhancements={},deck=[],fusions=[],catalog={},essence={},lv1={}){
  assert(upgrades&&typeof upgrades==='object'&&!Array.isArray(upgrades),
   'Ausbauten haben ein ungültiges Format.');
  assert(enhancements&&typeof enhancements==='object'&&!Array.isArray(enhancements),
   'Kartenverstärkungen haben ein ungültiges Format.');
  const u={};
  for(const [key,max]of Object.entries(PERK_LIMITS)){
   const rank=upgrades[key]??0;
   assert(Number.isInteger(rank)&&rank>=0&&rank<=max,
    'Ungültiger Rang für '+key+'.');
   u[key]=rank;
  }
  assert(Object.keys(upgrades).every(key=>Object.hasOwn(PERK_LIMITS,key)),
   'Unbekannter Kampf-Ausbau.');
  const owned=new Set([...deck,...fusions]),e={};
  assert(Object.keys(enhancements).length<=55,'Zu viele Kartenverstärkungen.');
  for(const [key,rank]of Object.entries(enhancements)){
   const id=Number(key);
   assert(Number.isSafeInteger(id)&&String(id)===key&&owned.has(id)&&
    definition(catalog,id)&&Number.isInteger(rank)&&rank>=0&&rank<=5,
    'Kartenverstärkung ist ungültig.');
   if(rank)e[id]=rank;
  }
  assert(essence&&typeof essence==='object'&&!Array.isArray(essence),
   'Essenzbindung hat ein ungültiges Format.');
  const essenceIds=deck.filter(id=>definition(catalog,id)?.essenceMonster===true);
  assert(essenceIds.length<=1,'Es darf nur ein gebundenes Essenzwesen im Hauptdeck sein.');
  const chosen=essence.chosen??null,school=essence.school??null;
  const tier=essence.tier??0,rank=essence.rank??0;
  assert(Number.isInteger(tier)&&tier>=0&&tier<=10&&
   Number.isInteger(rank)&&rank>=0&&rank<=essenceRankCap(tier),
   'Essenzstufe oder Verstärkung ist ungültig.');
  assert(school===null||ESSENCE_SCHOOLS.includes(school),
   'Unbekannte Essenz-Spezialisierung.');
  if(chosen===null){
   assert(!essenceIds.length&&school===null&&tier===0&&rank===0,
    'Essenzmonster erfordert die passende aktive Bindung.');
  }else assert(Number.isInteger(chosen)&&essenceIds.length===1&&
   essenceIds[0]===chosen&&definition(catalog,chosen)?.essenceSchool,
   'Gebundenes Essenzmonster muss einmal im eigenen Deck sein.');
  assert(lv1&&typeof lv1==='object'&&!Array.isArray(lv1),
   'Level-1-Forschung hat ein ungültiges Format.');
  const researched=lv1.perk===true,researchRank=lv1.rank??0;
  assert(Number.isInteger(researchRank)&&researchRank>=(researched?1:0)&&
   researchRank<=(researched?5:0),
   'Verbotene Forschung benötigt eine gültige Freischaltung (Rang 1–5).');
  return {upgrades:u,enhancements:e,essence:{chosen,school,tier,rank,
   type:chosen===null?null:definition(catalog,chosen).essenceSchool},
   lv1:{perk:researched,rank:researchRank}};
 }
 const trainingBonus=p=>TRAINING_BONUSES.slice(0,perk(p,'power')).reduce((a,b)=>a+b,0);
 const ascensionStep=c=>c.id<20?10:c.fusionOnly?20:30;
 function statBonus(c,stat,p){
  const base=c.fusionOnly||c.essenceMonster?0:c.pveBaseBonus?.[stat]||0;
  const ench=(p?.enhancements?.[c.id]||0)*ascensionStep(c);
  const training=trainingBonus(p);
  if(c.fusionOnly||c.essenceMonster)return base+ench+training;
  const level=clamp(c.level,1,10),defensive=['guardian','soul'].includes(c.role);
  const hunt=c.role==='predator'?perk(p,'jagdinstinkt'):0;
  const wall=defensive?perk(p,'schildwall'):0;
  return base+ench+training+(stat==='atk'?
   hunt*(20+10*level)+wall*(6+3*level):
   hunt*(6+3*level)+wall*(28+10*level));
 }
 const referenceStat=(template,stat,p)=>{
  const mid=template.fusionReference?.[stat]??template[stat];
  return mid*(template[stat]+statBonus(template,stat,p))/Math.max(1,template[stat]);
 };
 const maxAegis=p=>25*perk(p,'openingAegis');
 const teamAegis=g=>g.players.filter(p=>p.team===0).reduce((n,p)=>n+maxAegis(p),0);
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
 // A deterministic, temporary level-matched build; it never changes a profile.
 function loanBuild(catalog,chapter){
  const target=encounter(chapter);assert(target,'Ungültiges Duellziel.');
  const level=target.level,all=Object.values(catalog);
  const main=all.filter(c=>c.playable&&!c.fusionOnly&&!c.ace&&!c.essenceMonster&&c.level<=level)
   .sort((a,b)=>b.level-a.level||a.id-b.id);
  const fusion=all.filter(c=>c.playable&&c.fusionOnly&&!c.ace&&c.level<=Math.max(2,level)&&
   (!c.lv1Exclusive||isQuest(chapter)))
   .sort((a,b)=>b.level-a.level||a.id-b.id).slice(0,15).map(c=>c.id);
  const deck=[];
  for(let copy=0;copy<3&&deck.length<40;copy++)for(const c of main){
   if(deck.length===40)break;deck.push(c.id);
  }
  assert(validDeck(deck,catalog)&&validDeck(fusion,catalog,true),'Kein gültiges Leihdeck für diese Stufe verfügbar.');
  return {deck,fusions:fusion,upgrades:{},enhancements:{},essence:{},
   lv1:isQuest(chapter)?{perk:true,rank:Math.min(5,chapter-10)}:{},loanedDeck:true};
 }
 function validNpcFusionDeck(ids,catalog){
  if(!Array.isArray(ids)||ids.length<1||ids.length>15)return false;
  const counts=new Map();
  for(const id of ids){
   const c=definition(catalog,id);
   if(!Number.isSafeInteger(id)||!c?.fusionOnly||c.fateTemplate)return false;
   counts.set(id,(counts.get(id)||0)+1);
   if(counts.get(id)>3)return false;
  }
  return true;
 }
 const seats=[{seat:0,team:0,kind:'human'},{seat:1,team:1,kind:'ai'},
  {seat:2,team:0,kind:'human'},{seat:3,team:1,kind:'ai'}];
 const packIds=(catalog,chapter)=>{
  const level=encounter(chapter)?.level||2;
  return Object.values(catalog).filter(c=>c.playable&&!c.fusionOnly&&!c.ace&&c.level===level)
   .sort((a,b)=>(a.source??0)-(b.source??0)||a.id-b.id)
   .slice(0,3).map(c=>c.id);
 };
 // Temporary chapter loaners are catch-up cards, not a penalty for improving
 // the first three slots of an owned 40-card deck. Only replace a weaker
 // template, and never push a template over the three-copy deck limit.
 function chapterDeck(ids,catalog,chapter){
  const deck=[...ids],value=id=>{
   const c=definition(catalog,id);
   return c?Math.max(c.atk,c.def)+c.level*10:0;
  };
  for(const id of packIds(catalog,chapter)){
   if(deck.filter(owned=>owned===id).length>=3)continue;
   const candidates=deck.map((owned,index)=>({index,value:value(owned)}))
    .filter(item=>item.value<value(id))
    .sort((a,b)=>a.value-b.value||a.index-b.index);
   if(candidates.length)deck[candidates[0].index]=id;
  }
  return deck;
 }
 function player(seat,name,deck=[],fusions=[],build={upgrades:{},enhancements:{}}){
  return {...seats[seat],name,baseDeck:[...deck],baseFusions:[...fusions],
   deck:[...deck],fusionDeck:[...fusions],remainingFusion:[...fusions],
   upgrades:build.upgrades,enhancements:build.enhancements,
   essence:build.essence||{chosen:null,school:null,tier:0,rank:0,type:null},
   lv1:{perk:build.lv1?.perk===true,rank:build.lv1?.rank||0,
    ghostSlots:[],charges:0,choices:[],offers:[],floatUsed:0,swarmUsed:0},
   fusionsPerformed:0,fusionLoreChainUsed:false,fateUsed:false,hand:[],
   field:Array(7).fill(null),graveyard:[],summoned:false,ownTurns:0};
 }
 // Ownership remains per seat; field indices are physical team-zone indices.
 // Legacy active rooms retain their old layout until the next accepted duel.
 const sharedField=g=>g.fieldLayout==='team7';
 const teamMate=(g,p)=>g.players.find(x=>x.team===p.team&&x.seat!==p.seat);
 const teamField=(g,p)=>sharedField(g)?p.field.map((c,i)=>c||teamMate(g,p)?.field[i]||null):p.field;
 const freeTeamSlot=(g,p,i)=>!p.field[i]&&(!sharedField(g)||!teamMate(g,p)?.field[i]);
 function draw(p,n=5){while(p.hand.length<n&&p.deck.length)p.hand.push(p.deck.shift());}
 // Each seat gets its own Fisher-Yates shuffle from the server-owned RNG.
 function shuffleDeck(g,p){
  for(let i=p.deck.length-1;i>0;i--){
   const j=randomInt(g,i+1);[p.deck[i],p.deck[j]]=[p.deck[j],p.deck[i]];
  }
 }
 function fanaticOpening(g){
  if(g.chapter<11||g.chapter>14)return;
  // Same sealed Lumira as in the solo Lv1 saga: a guaranteed fifth hand
  // card, separate from the unchanged 40-card solo opponent deck.
  const fanatic=g.players[1],returned=fanatic.hand.pop();
  if(returned!==undefined)fanatic.deck.push(returned);
  fanatic.hand.unshift(714);
  g.log.push('Der Level-1-Fanatiker hält Lumira als versiegelte Startkarte.');
 }
 function create({roomId,hostName,hostDeck,hostFusions,enemyDeckA,enemyDeckB,
    enemyFusionsA,enemyFusionsB,chapter=1,entry='new',catalog,randomSeed,
    hostUpgrades={},hostEnhancements={},hostEssence={},hostLv1={},hostPortrait='hero-01',
    enemyPowerA=1,enemyPowerB=1,enemyNameA=null,enemyNameB=null,personalDuoRules=false}){
  assert(typeof roomId==='string'&&roomId.length>=6,'Raumkennung fehlt.');
  assert(!!encounter(chapter),'Ungültiges Kapitel.');
  assert(['new','chapter','quest'].includes(entry),'Ungültiger Einstieg.');
  assert(entry!=='new'||chapter===1,'Neue Kampagne beginnt mit Kapitel I.');
  assert((entry==='quest')===isQuest(chapter),'Questreihe und Kampagne bleiben getrennt.');
  for(const d of [hostDeck,enemyDeckA,enemyDeckB])
   assert(validDeck(d,catalog),'Hauptdeck muss aus 40 gültigen Einzelspieler-Karten bestehen (maximal 3 Kopien).');
  assert(validDeck(hostFusions,catalog,true),'Spieler-Fusionsdeck ist ungültig.');
  for(const f of [enemyFusionsA,enemyFusionsB])
   assert(validNpcFusionDeck(f,catalog),'NPC-Fusionsdeck ist ungültig.');
  const hostBuild=normalizedBuild(hostUpgrades,hostEnhancements,hostDeck,hostFusions,
   catalog,hostEssence,hostLv1);
  const lp=duoStartingLp(chapter);
  const g={schema:2,mode:'duo-campaign',ruleset:'duo-v166',roomId,chapter,entry,
   lpParityVersion:2,duelNo:1,fieldLayout:'team7',personalDuoRules:personalDuoRules===true,
   status:'waiting',revision:0,activeSeat:0,turn:0,round:1,uid:1,
   rngSeed:Number.isSafeInteger(randomSeed)&&randomSeed>=1&&randomSeed<=0xffffffff?
    randomSeed:roomSeed(roomId), // deterministic Node QA; Edge injects secret crypto seed
   teams:[{lp,maxLp:lp,shield:maxAegis(hostBuild),
    essenceTauntTurn:-1,essenceBastionUsed:false},
    {lp,maxLp:lp,shield:0}],
   players:[player(0,safeName(hostName),personalDuoRules?[...hostDeck]:chapterDeck(hostDeck,catalog,chapter,entry),hostFusions,hostBuild),
    player(1,safeName(enemyNameA||opponentNames(chapter)[0]),enemyDeckA,enemyFusionsA),
    player(2,'Partner (ausstehend)'),
    player(3,safeName(enemyNameB||opponentNames(chapter)[1]),enemyDeckB,enemyFusionsB)],
   winner:null,fateEvent:null,arenaEvent:null,
   questProgress:{floating:0,swarm:0,special:0},questPassed:null,
   log:['Raum erstellt. Der Partner wird erwartet.']};
  if(isQuest(chapter))g.log.push('Fanatiker-Saga · '+encounter(chapter).name+': '+encounter(chapter).dialogue);
  g.players[0].portraitId=/^hero-(0[1-9]|1[0-6])$/.test(hostPortrait)?hostPortrait:'hero-01';
  g.players[1].opponentPower=npcPower(enemyPowerA);
  g.players[3].opponentPower=npcPower(enemyPowerB);
  // Tiebreak initiative is chosen once, never supplied by a browser client.
  g.tiePriority=randomInt(g,2);
  return g;
 }
 function instance(g,id,catalog,{fusion=false,roleOverride=null,quality=1,
  ownerSeat=null,fate=null,storyCorruption=false}={}){
  const c=definition(catalog,id);
  const p=Number.isInteger(ownerSeat)?g.players[ownerSeat]:null;
  const npcFusion=p?.team===1&&!!c?.fusionOnly&&
   p.baseFusions?.includes(id)===true;
  assert(c&&(c.playable||(fate&&c.fateTemplate)||
   npcFusion||
   (storyCorruption&&isQuest(g.chapter)&&g.chapter===15&&id===715&&ownerSeat===1)),
   'Karte existiert nicht im aktuellen Singleplayer-Katalog.');
  const npcBoost=!fate&&p?.team===1?npcPower(p.opponentPower):1;
  let atk=fate?fate.atk:Math.max(0,round10((c.atk+statBonus(c,'atk',p))*quality*npcBoost));
  let def=fate?fate.def:Math.max(0,round10((c.def+statBonus(c,'def',p))*quality*npcBoost));
  const companion=!fate&&!!c.essenceMonster&&p?.essence?.chosen===id;
  const level=companion?essenceLevel(p.essence.tier):c.level;
  if(companion){atk=Math.min(10000,atk+level*45+p.essence.rank*35);
   def=Math.min(10000,def+level*70+p.essence.rank*55);}
  if(!fate&&p?.lv1?.perk&&c.level===1&&!c.fusionOnly&&!c.ace&&!c.essenceMonster){
   atk=Math.min(10000,atk+p.lv1.rank*5);def=Math.min(10000,def+p.lv1.rank*5);
  }
  // Lumira is an exact-stat story ACE, including outside the research build.
  if(c.lv1Special==='ace'){atk=111;def=111;}
  if(storyCorruption){atk=920;def=220;}
  // The stat multiplier comes from the exact solo NPC loadout, not a
  // second, independently balanced 2v2 number.
  const develops=(roleOverride||c.role)==='predator'&&!fusion&&!fate&&
   !c.essenceMonster;
  return {uid:g.uid++,id,level,atk,def,fate:!!fate,role:roleOverride||c.role||'combatant',
   fusion,mode:'atk',used:false,switched:false,placedRound:g.round,
   ...(develops?{predatorEvolutionAge:0,predatorBornOwnTurn:p?.ownTurns||0}:{}),
   essenceChoice:1,essenceAttacks:0,essenceLastToggle:-1,
   guardLeft:0,guardGrantedTurn:-1,
   lv1Echo:false,lv1Effectless:false,lv1SwarmApplied:0,lv1Attacks:0,
   lv1Shield:0,lv1AceSaved:false,lv1Mourn:0,lv1MournUntil:0,
   resonance:0,soul:0,condensed:0,soulCooldown:0,raidCooldown:0,
   condenseLeft:0,condenseSlice:0,drainPreference:0,lastSoulAction:-1,
   lastDrainSwitch:-1,decaySkipOwnTurn:-1,maxDef:def,
   decayGrace:1};
 }
 // v19.8: Predator leadership is scoped to a single duellant, not the whole
 // 2v2 team. The authoritative reducer owns all rolls and token creation.
 const PREDATOR_POWERS=Object.freeze(['swarm','mark','token']);
 const PREDATOR_POWER_NAMES=Object.freeze({swarm:'Rudelinstinkt',mark:'Blutspur',
  token:'Rudelruf'});
 const predatorLeader=p=>p.field.filter(c=>c?.fusion&&c.role==='predator'&&
  c.predatorLeader).sort((a,b)=>(b.predatorLeader.bornUid||b.uid)-
  (a.predatorLeader.bornUid||a.uid))[0]||null;
 const predatorPower=(alpha,power)=>!!alpha?.predatorLeader?.powers?.includes(power);
 function imprintPredator(g,p,result,materials){
  if(result.role!=='predator')return;
  const pool=[...PREDATOR_POWERS];
  for(let i=pool.length-1;i>0;i--){
   const j=randomInt(g,i+1);[pool[i],pool[j]]=[pool[j],pool[i]];
  }
  const count=clamp(materials,2,5),powers=count===2?[]:count===3?
   pool.slice(0,1):count===4?pool.slice(0,2):[...PREDATOR_POWERS];
  // One deterministic, server-authoritative leadership challenge per summon.
  // A predecessor consumed as fusion material was removed before this call.
  const predecessor=predatorLeader(p);
  g.predatorShowdown=null;
  if(predecessor){
   const oldStats={uid:predecessor.uid,id:predecessor.id,level:predecessor.level,
    atk:predecessor.atk,def:predecessor.def};
   const newStats={uid:result.uid,id:result.id,level:result.level,
    atk:result.atk,def:result.def};
   const rolled=randomInt(g,100);
   const outcome=rolled<30?'struggle':rolled<50?'overthrow':'stalemate';
   if(outcome==='struggle'){
    for(const card of [predecessor,result]){
     const oldMaxDef=card.maxDef??card.def;
     card.atk=Math.max(0,round10(card.atk*.85));
     card.def=Math.max(0,round10(card.def*.85));
     card.maxDef=Math.max(0,round10(oldMaxDef*.85));
    }
    g.log.push('🐾 Machtkampf: Beide Rudelführer erleiden −15 % ATK und DEF.');
   }else if(outcome==='overthrow'){
    const slot=p.field.findIndex(card=>card?.uid===predecessor.uid);
    if(slot>=0){p.field[slot]=null;delete predecessor.predatorLeader;
     p.graveyard.push(predecessor);}
    g.log.push('🐾 Rudelführersturz: Der neue Alpha zerfleischt seinen Vorgänger.');
   }else g.log.push('🐾 Patt: Beide Predatoren bleiben, der Neue erhält die Krone.');
   g.predatorShowdown={seat:p.seat,newUid:result.uid,oldUid:predecessor.uid,
    outcome,penaltyPct:outcome==='struggle'?15:0,old:oldStats,new:newStats,
    round:g.round,turn:g.turn};
  }
  // Permanently retire previous leaders. Killing the new leader must never
  // reactivate its predecessor, even after a stalemate.
  for(const old of p.field)if(old?.predatorLeader)delete old.predatorLeader;
  result.predatorLeader={materials:count,powers,bornUid:result.uid,ownTurns:0,
   createdTurn:g.turn};
  g.log.push('🐾 Rudelführer geprägt · '+count+' Materialien · '+
   (powers.length?powers.map(id=>PREDATOR_POWER_NAMES[id]).join(', '):
    'nur Rudelführer-Basisbonus'));
 }
 function predatorSource(catalog,level){
  return Object.values(catalog).filter(c=>c?.role==='predator'&&c.playable===true&&
   !c.fusionOnly&&!c.ace&&!c.fateOnly&&!c.essenceMonster&&c.level<=level)
   .sort((a,b)=>b.level-a.level||a.id-b.id)[0]||null;
 }
 function beginPredatorTurn(g,p,catalog){
  const alpha=predatorLeader(p);
  if(!predatorPower(alpha,'token')||g.turn===alpha.predatorLeader.createdTurn)return;
  alpha.predatorLeader.ownTurns=Math.min(3,(alpha.predatorLeader.ownTurns||0)+1);
  if(alpha.predatorLeader.ownTurns<3)return;
  const slot=p.field.findIndex((c,i)=>freeTeamSlot(g,p,i));
  if(slot<0)return; // A full field keeps the ready summon charged.
  const level=clamp(Math.floor(alpha.level||1),1,10);
  const template=predatorSource(catalog,level);
  if(!template)return;
  const token=instance(g,template.id,catalog,{ownerSeat:p.seat});
  token.level=level;token.role='predator';token.fusion=false;
  token.atk=Math.max(10,round10(Math.max(10,template.atk*.55)));
  token.def=Math.max(10,round10(Math.max(10,template.def*.55)));
  token.maxDef=token.def;
  token.predatorToken={leaderUid:alpha.uid,level};
  p.field[slot]=token;alpha.predatorLeader.ownTurns=0;
  g.log.push('🐾 Rudelruf: Rudelgeist · Lv '+level+' auf Feld '+(slot+1)+'.');
 }
 function predatorBonus(g,p,src,target){
  if(src?.role!=='predator')return {followups:0,bonusPct:0};
  const hunt=g.predatorPursuit;
  if(!target||!hunt||hunt.turn!==g.turn||hunt.ownerSeat!==p.seat||
   hunt.targetUid!==target.uid||!hunt.attackers?.length)
   return {followups:0,bonusPct:0};
  if(hunt.attackers.includes(src.uid))return {followups:0,bonusPct:0};
  const followups=Math.min(2,hunt.attackers.length),alpha=predatorLeader(p);
  return {followups,bonusPct:followups*.05+
   (predatorPower(alpha,'mark')?.03:0)};
 }
 function removePredatorTokenGraves(g){
  for(const p of g.players)p.graveyard=p.graveyard.filter(c=>!c?.predatorToken);
 }
 const hasCards=(p)=>p.field.some(Boolean)||p.lv1?.ghostSlots?.some(Boolean);
 const defensive=c=>c&&['guardian','soul'].includes(c.role);
 const essenceCompanion=(p,c,type)=>!!c&&!c.fate&&p?.essence?.chosen===c.id&&
  p.essence?.type===type;
 const defenseSpecialist=p=>p?.essence?.school==='defense'&&p.essence.chosen!==null;
 const defensePerk=g=>Math.max(0,...g.players.filter(p=>p.team===0&&defenseSpecialist(p))
  .map(p=>essencePerkRank(p.essence.tier)));
 const protectBastion=(g,p,slot,catalog)=>{
  const c=p.field[slot];
  if(!c||c.mode!=='def'||c.def>0||p.team!==0||!defensive(c)||
   defensePerk(g)<5||g.teams[0].essenceBastionUsed)return false;
  g.teams[0].essenceBastionUsed=true;
  c.def=1;c.guardLeft=2;c.guardGrantedTurn=g.turn;
  g.log.push('✦ Letztes Bollwerk: '+definition(catalog,c.id).name+
   ' überlebt mit 1 DEF und schützt sich zwei weitere gegnerische Züge.');
  return true;
 };
 const roleName={predator:'Predator',guardian:'Wächter',soul:'Seelenzehrer',
  resonator:'Resonator',combatant:'Allrounder'};
 function combat(c){
  // Migrate cards in already-running v16.0 rooms without invalidating a session.
  if(c.maxDef===undefined)c.maxDef=c.def;
  if(c.raidCooldown===undefined)c.raidCooldown=0;
  if(c.condenseLeft===undefined)c.condenseLeft=0;
  if(c.condenseSlice===undefined)c.condenseSlice=0;
  if(c.drainPreference===undefined)c.drainPreference=0;
  if(c.lastSoulAction===undefined)c.lastSoulAction=-1;
  if(c.lastDrainSwitch===undefined)c.lastDrainSwitch=-1;
  if(c.decaySkipOwnTurn===undefined)c.decaySkipOwnTurn=-1;
  if(c.soulCooldown===undefined)c.soulCooldown=0;
  if(c.soul===undefined)c.soul=0;
  if(c.condensed===undefined)c.condensed=0;
  return c;
 }
 // Match solo Verdichten: the same remaining shield pool grants half as
 // much temporary ATK. Never write that bonus into base ATK, or decay and
 // incoming DEF damage would leave behind permanent/off-by-one attack.
 // Per-seat adjacency: a Guardian can protect one neighboring Soul,
 // and a Soul cannot receive protection from multiple Guardians.
 function soulBonds(p,g){
  const f=g?teamField(g,p):p?.field||[],seen=new Set(),pairs=[];
  for(let i=0;i<f.length-1;i++){
   const a=f[i],b=f[i+1];
   if(!a||!b||seen.has(i)||seen.has(i+1)||!
    (a.role==='guardian'&&b.role==='soul'||a.role==='soul'&&b.role==='guardian'))continue;
   const guardianIndex=a.role==='guardian'?i:i+1,soulIndex=a.role==='soul'?i:i+1;
   pairs.push({guardianIndex,soulIndex,guardianUid:f[guardianIndex].uid,soulUid:f[soulIndex].uid});
   seen.add(i);seen.add(i+1);i++;
  }
  return pairs;
 }
 function bondArmor(g,enemy,target,attacker,raw){
  if(target.mode!=='def'||!defensive(target))return {dealt:raw,mitigation:0,extra:0,link:null};
  const link=soulBonds(enemy,g).find(pair=>pair.guardianUid===target.uid||pair.soulUid===target.uid);
  const pierce=attacker.role==='predator'?.10:0;
  const base=Math.max(0,.20-pierce),mitigation=Math.max(0,(link?.35:.20)-pierce);
  const dealt=Math.max(0,Math.floor(raw*(1-mitigation)));
  return {dealt,mitigation,link,extra:link?
   Math.max(0,Math.floor(raw*(1-base))-dealt):0};
 }
 function awardBond(g,enemy,armor){
  if(!armor?.link||armor.extra<=0)return 0;
  const soul=teamField(g,enemy)[armor.link.soulIndex];
  if(!soul||soul.uid!==armor.link.soulUid)return 0;
  combat(soul);
  if(soul.bondChargeRound!==g.round){soul.bondChargeRound=g.round;soul.bondChargeUsed=0;}
  const add=Math.min(Math.max(0,50-soul.bondChargeUsed),Math.floor(armor.extra*.25),
   Math.max(0,soulCapacity(soul)-soul.soul));
  if(add>0){
   soul.soul+=add;soul.bondChargeUsed+=add;
   g.log.push('✦ Seelenbund · '+armor.extra+' zusätzlicher Schutz, +'+add+
    ' Seelenessenz ('+soul.bondChargeUsed+'/50 pro Runde).');
  }
  return add;
 }
 const attackValue=c=>Math.min(10000,Math.max(0,Number(c?.atk)||0)+
  (c?.role==='soul'?Math.floor(Math.max(0,Number(c.condensed)||0)*.5):0));
 // v20.2: the same material-scaled Stomp and symmetric attack attrition as
 // singleplayer, with the two opposing seven-slot fields treated as one
 // fourteen-slot enemy line. The server owns all dice, hits and casualties.
 const STOMP_PERCENTS=Object.freeze({3:[70],4:[50,50],5:[50,50,30]});
 const stompCount=c=>c?.fusion?clamp(Number.isInteger(c.materialsUsed)?c.materialsUsed:2,2,5):2;
 const stompBonus=c=>Number.isInteger(c?.stompBonusPP)?clamp(c.stompBonusPP,0,12):
  Math.min(12,Math.max(0,c?.stompMaterials?.resonator||0)*3+
   Math.max(0,c?.stompMaterials?.combatant||0));
 const stompFatigue=(atk,def,hits)=>({atk:Math.ceil(Math.max(0,atk)*.03*hits),
  def:Math.ceil(Math.max(0,def)*.03*hits)});
 function stompLine(g,p,enemy,slot,count){
  if(!enemy||!Number.isInteger(slot)||slot<0||slot>6)return [];
  const foes=g.players.filter(x=>x.team!==p.team).sort((a,b)=>a.seat-b.seat);
  const row=sharedField(g)?Array.from({length:7},(_,i)=>{
   const owner=foes.find(foe=>foe.field[i]);return {seat:owner?.seat,slot:i,uid:owner?.field[i]?.uid??null};
  }):foes.flatMap(foe=>foe.field.map((card,i)=>({seat:foe.seat,slot:i,uid:card?.uid??null})));
  const middle=sharedField(g)?slot:foes.findIndex(foe=>foe.seat===enemy.seat)*7+slot;
  if(middle<0)return [];
  const already=new Set([middle]),towards=p.team===0?1:-1,out=[];
  const choices=count===3?[[towards,-towards]]:count===4?
   [[towards,-towards],[-towards,towards]]:count===5?
   [[towards,-towards],[-towards,towards],[towards,-towards]]:[];
  for(const directions of choices){
   let next=-1;
   for(const direction of directions){for(let gap=1;gap<row.length;gap++){
    const index=middle+gap*direction;
    if(index>=0&&index<row.length&&row[index].uid!==null&&!already.has(index)){
     next=index;break;
    }
   }if(next>=0)break;}
   if(next>=0){already.add(next);out.push(row[next]);}
  }
  return out;
 }
 function stompSecondary(g,p,src,candidate,power,pct,catalog){
  const enemy=g.players[candidate.seat],target=enemy?.field?.[candidate.slot];
  // Stale snapshots must never damage a different monster that has moved in.
  if(!target||target.uid!==candidate.uid)return null;
  combat(target);
  const immune=target.guardLeft>0,defender=defensive(target),mode=target.mode;
  const raw=Math.max(0,Math.floor(power*pct/100)),oldAttack=attackValue(target);
  let dealt=raw,shieldLost=0,condensedLost=0,soulLost=0,defLost=0;
  let destroyed=false;
  const lifeInAtk=activeLv1(enemy,target,catalog)&&
   (!!lv1Key(target,catalog)||hasLv1Class(enemy,'protector',catalog));
  if(mode==='atk'&&!lifeInAtk&&!immune&&raw>=oldAttack){
   enemy.graveyard.push(target);enemy.field[candidate.slot]=null;
   lv1Leave(g,enemy,target,catalog);destroyed=true;
  }else if(!immune){
   const sideArmor=mode==='def'&&defender?bondArmor(g,enemy,target,src,raw):null;
   if(sideArmor)dealt=sideArmor.dealt;
   let remaining=dealt;
   shieldLost=Math.min(Math.max(0,target.lv1Shield||0),remaining);
   target.lv1Shield=(target.lv1Shield||0)-shieldLost;remaining-=shieldLost;
   condensedLost=Math.min(target.condensed,remaining);
   target.condensed-=condensedLost;remaining-=condensedLost;
   soulLost=Math.min(target.soul,remaining);
   target.soul-=soulLost;remaining-=soulLost;
   defLost=Math.min(Math.max(0,target.def),remaining);target.def-=defLost;
   if(soulLost)score(g,enemy.team,Math.floor(soulLost*.5),
    definition(catalog,target.id).name+' · Stomp-Seelenverlust');
   removeIfEmpty(g,enemy,candidate.slot,catalog);
   if(sideArmor)awardBond(g,enemy,sideArmor);
   if(enemy.field[candidate.slot]===target&&target.def<=0&&mode==='atk'){
    enemy.graveyard.push(target);enemy.field[candidate.slot]=null;
    lv1Leave(g,enemy,target,catalog);
   }
   destroyed=enemy.field[candidate.slot]!==target;
  }
  let counter=0;
  if(mode==='def'&&defender&&!immune&&!destroyed&&enemy.field[candidate.slot]===target){
   // Just like solo, a DEF counter requires survival after the splash.
   // Splash damage is 40% of the normal 35%-ATK counter.
   counter=score(g,enemy.team,Math.floor(Math.floor(oldAttack*.35)*.4),
    definition(catalog,target.id).name+' · Stomp-Gegenschlag');
  }
  g.log.push('✦ FUSIONS-STOMP · '+definition(catalog,target.id).name+' ('+pct+
   ' %): '+(destroyed?'vernichtet':immune?'Letztes Bollwerk blockiert':
   '−'+defLost+' DEF'+(condensedLost?' / −'+condensedLost+' Verdichtung':'')+
   (soulLost?' / −'+soulLost+' Seele':''))+'.');
  return {...candidate,pct,raw:dealt,shieldLost,condensedLost,soulLost,defLost,
   destroyed,counter};
 }
 function win(g,team,reason){
  g.status='finished';g.winner=team;g.log.push(reason);
  if(team===0&&isQuest(g.chapter)){
   for(const p of g.players.filter(p=>p.team===0)){
    g.questProgress.floating=Math.max(g.questProgress.floating,p.lv1?.floatUsed||0);
    g.questProgress.swarm=Math.max(g.questProgress.swarm,p.lv1?.swarmUsed||0);
   }
   g.questPassed=questPassed(g);
   if(!g.questPassed)g.log.push('Fanatiker-Prüfung nicht erfüllt: '+encounter(g.chapter).goal+
    '. Wiederholt dieses Duell und erfüllt das Questziel.');
   else g.log.push('Fanatiker-Prüfung bestanden! '+encounter(g.chapter).after);
  }
 }
 const score=(g,team,damage,label)=>{
  const target=g.teams[1-team],incoming=Math.max(0,Math.floor(damage));
  const blocked=Math.min(incoming,Math.max(0,target.shield||0));
  if(blocked){
   target.shield-=blocked;
   g.log.push(label+': '+blocked+' Schaden durch Vorhut-Schutz abgefangen.');
  }
  const dealt=Math.min(target.lp,incoming-blocked);
  if(dealt){target.lp-=dealt;g.log.push(label+': '+dealt+' LP Schaden.');}
  if(g.teams[1-team].lp===0&&g.status==='active')win(g,team,'Seelenenergie oder Angriff beendet das Duell.');
  return dealt;
 };
 const isV166=g=>g.ruleset==='duo-v166';
 // The solo Arena applies 200 damage at round 10 and doubles thereafter.
 // Scale by the 2v2 team's 16,000 / 10,000 maximum LP to preserve pacing.
 const arenaDamage=(g,round)=>round<=9?0:
  Math.min(g.teams[0].maxLp,
   (g.lpParityVersion===2?400:Math.floor(200*g.teams[0].maxLp/10000))*
    2**(round-10));
 function settleArena(g){
  if(!isV166(g)||g.status!=='active')return;
  const damage=arenaDamage(g,g.round);
  if(!damage)return;
  const before=g.teams.map(t=>t.lp);
  g.teams.forEach(t=>t.lp=Math.max(0,t.lp-damage));
  g.arenaEvent={round:g.round,damage,before,after:g.teams.map(t=>t.lp)};
  g.log.push('☄ Arena-Zerfall, Runde '+g.round+': Beide Teams verlieren '+
   damage+' LP (unabhängig vom Schild).');
  const dead=g.teams.map(t=>t.lp===0);
  if(dead[0]&&dead[1]){
   const winner=before[0]===before[1]?g.tiePriority:(before[0]>before[1]?0:1);
   win(g,winner,before[0]===before[1]?
    'Arena-Zerfall: Gleichstand, ausgeloste Entscheidungsinitiative.':
    'Arena-Zerfall: Team mit mehr LP vor dem Zerfall gewinnt.');
  }else if(dead[0]||dead[1])win(g,dead[0]?1:0,
   'Arena-Zerfall: Ein Team hat keine LP mehr.');
 }
 function fatePressure(g,seat){
  const team=g.players[seat].team,own=g.teams[team];
  const allies=g.players.filter(p=>p.team===team),opponents=g.players.filter(p=>p.team!==team);
  const allied=allies.flatMap(p=>[...p.field,...(p.lv1?.ghostSlots||[])].filter(Boolean));
  const enemies=opponents.flatMap(p=>[...p.field,...(p.lv1?.ghostSlots||[])].filter(Boolean));
  const ratio=own.lp/Math.max(1,own.maxLp);
  const life=ratio<=.1?40:ratio<=.2?35:ratio<=.35?25:ratio<=.5?15:ratio<=.65?5:0;
  const power=cards=>cards.reduce((n,c)=>n+Math.max(attackValue(c),c.def),0);
  const ours=power(allied),theirs=power(enemies);
  const field=!enemies.length?0:!allied.length?40:
   theirs>=ours*1.7?30:theirs>=ours*.85?10:0;
  const openThreat=Math.max(0,enemies.reduce((n,c)=>n+(c.mode==='atk'?attackValue(c):0),0)-ours);
  const lethal=enemies.length>0&&openThreat>=own.lp+(own.shield||0);
  return {score:life+field+(lethal?20:0),life,field,lethal};
 }
 function fateReference(g,seat,catalog){
  const team=g.players[seat].team;
  let strongest=null;
  const consider=(atk,def)=>{if(!Number.isFinite(atk)||!Number.isFinite(def))return;
   if(!strongest||atk+def>strongest.atk+strongest.def)strongest={atk,def};};
  for(const p of g.players.filter(x=>x.team!==team)){
   for(const id of p.deck){const c=definition(catalog,id);if(c)
    consider(c.atk+statBonus(c,'atk',p),c.def+statBonus(c,'def',p));}
   for(const c of [...p.field,...(p.lv1?.ghostSlots||[]),...p.graveyard].filter(Boolean)){
    const definitionCard=definition(catalog,c.id);
    consider(c.atk===undefined?definitionCard?.atk:attackValue(c),c.def??definitionCard?.def);
   }
  }
  return strongest||{atk:500,def:500};
 }
 function maybeFate(g,p,catalog){
  if(!isV166(g)||g.round<3||p.fateUsed||g.winner!==null)return false;
  const pressure=fatePressure(g,p.seat);
  const chance=pressure.score>=90?5:pressure.score>=75?3:pressure.score>=60?1:0;
  if(!chance||randomInt(g,100)>=chance)return false;
  const candidates=Object.values(catalog).filter(c=>c.fateTemplate===true)
   .sort((a,b)=>a.id-b.id).map(c=>c.id);
  assert(candidates.length===10,'Der Singleplayer-Schicksalskartenpool ist unvollständig.');
  const reference=fateReference(g,p.seat,catalog);
  p.deck.push(...p.hand.filter(c=>Number.isInteger(c)));
  p.hand=[];
  for(let i=p.deck.length-1;i>0;i--){const j=randomInt(g,i+1);
   [p.deck[i],p.deck[j]]=[p.deck[j],p.deck[i]];}
  for(let i=candidates.length-1;i>0;i--){const j=randomInt(g,i+1);
   [candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
  const chosen=candidates.slice(0,5);
  for(const id of chosen)p.hand.push({id,fate:true,atk:Math.min(10000,reference.atk+100),
   def:Math.min(10000,reference.def+100)});
  p.fateUsed=true;
  g.fateEvent={ownerSeat:p.seat,cardIds:chosen,round:g.round,score:pressure.score};
  g.log.push('✦ SCHICKSALSZUG! '+p.name+
   ' erhält fünf temporäre, unverschmelzbare Schicksalsmonster!');
  return true;
 }
 const lv1State=p=>{
  if(!p.lv1)p.lv1={perk:false,rank:0,ghostSlots:[],charges:0,choices:[],offers:[],
   floatUsed:0,swarmUsed:0};
  return p.lv1;
 };
 const ghostZone=p=>lv1State(p).ghostSlots;
 const lv1Key=(c,catalog)=>c&&!c.predatorToken&&!c.lv1Effectless?
  definition(catalog,c.id)?.lv1Special||'':'';
 const lv1Troops=p=>[...p.field,...ghostZone(p)].filter(Boolean);
 const genuineLv1=(c,catalog)=>!!c&&c.level===1&&!c.fusion&&!c.lv1Echo&&
  !c.predatorToken&&
  !definition(catalog,c.id)?.fusionOnly;
 const activeLv1=(p,c,catalog)=>lv1State(p).perk&&!!c&&!c.predatorToken&&c.level===1&&
  (!c.fusion||!!definition(catalog,c.id)?.lv1Exclusive);
 const hasLv1Class=(p,key,catalog)=>lv1State(p).perk&&lv1Troops(p).some(c=>lv1Key(c,catalog)===key);
 function syncLv1Swarm(p,catalog){
  if(!lv1State(p).perk)return;
  const troops=lv1Troops(p).filter(c=>activeLv1(p,c,catalog));
  const amount=Math.min(9,troops.length-1)*10;
  for(const c of troops){const delta=amount-(c.lv1SwarmApplied||0);
   if(delta){c.atk=Math.max(0,c.atk+delta);c.def=Math.max(1,c.def+delta);
    c.maxDef=Math.max(1,(c.maxDef||c.def)+delta);}
   c.lv1SwarmApplied=amount;
  }
 }
 function lv1Leave(g,p,c,catalog){
  if(!activeLv1(p,c,catalog))return;
  for(const other of lv1Troops(p).filter(x=>x!==c&&activeLv1(p,x,catalog))){
   other.lv1Mourn=(other.lv1Mourn||0)+8;
   other.lv1MournUntil=p.ownTurns+3;
   other.atk+=8;other.def+=8;other.maxDef=(other.maxDef||other.def)+8;
  }
  const s=lv1State(p);
  if(genuineLv1(c,catalog)&&s.floatUsed<5){
   const count=Math.min(hasLv1Class(p,'hive',catalog)?2:1,5-s.floatUsed);
   for(let n=0;n<count;n++)s.choices.push(c.id);
   s.choices=s.choices.slice(-5);s.floatUsed+=count;
   if(hasLv1Class(p,'hive',catalog))s.charges=Math.min(5,s.charges+1);
  }
  syncLv1Swarm(p,catalog);
 }
 function lv1Arrival(g,p,c,catalog){
  if(!lv1State(p).perk||!genuineLv1(c,catalog))return;
  const s=lv1State(p);
  if(s.swarmUsed<5&&s.offers.length<5){s.offers.push(c.id);s.swarmUsed++;}
  if(hasLv1Class(p,'hive',catalog))s.charges=Math.min(5,s.charges+1);
  syncLv1Swarm(p,catalog);
 }
 function lv1Rescue(g,p,slot,catalog,area){
  const zone=area==='ghost'?ghostZone(p):p.field,c=zone[slot],key=lv1Key(c,catalog);
  if(!lv1State(p).perk||!c)return false;
  if(key==='ace'&&!c.lv1AceSaved){c.lv1AceSaved=true;c.def=1;
   g.log.push('✧ Lumira überlebt einmalig mit 1 DEF.');return true;}
  if(key!=='hive')return false;
  const slots=ghostZone(p),index=slots.findIndex(x=>x&&x!==c);
  if(index<0)return false;
  const sacrifice=slots[index];slots[index]=null;p.graveyard.push(sacrifice);
  lv1Leave(g,p,sacrifice,catalog);
  c.atk=c.lv1Full?.atk??definition(catalog,c.id).atk;
  c.def=c.lv1Full?.def??definition(catalog,c.id).def;
  c.maxDef=c.def;
  g.log.push('✧ Nekroth opfert einen Geisterslot und wird vollständig wiedergeboren.');
  return true;
 }
 function removeIfEmpty(g,p,slot,catalog,area='field'){
  const zone=area==='ghost'?ghostZone(p):p.field,c=zone[slot];
  if(c&&c.def<=0&&(c.mode==='def'||
   activeLv1(p,c,catalog)&&(!!lv1Key(c,catalog)||hasLv1Class(p,'protector',catalog)))){
   if(lv1Rescue(g,p,slot,catalog,area))return;
   if(area==='field'&&protectBastion(g,p,slot,catalog))return;
   p.graveyard.push(c);zone[slot]=null;lv1Leave(g,p,c,catalog);
   g.log.push(definition(catalog,c.id).name+' hat keine DEF mehr und wird zerstört.');
  }
 }
 function endOwnerTurn(g,p,catalog){
  for(let slot=0;slot<p.field.length;slot++){
   const c=p.field[slot];if(!c)continue;combat(c);
   const oldAtk=c.atk,oldDef=c.def;
   if(c.role==='soul'){
    if(c.decaySkipOwnTurn!==p.ownTurns){
     if(c.soul>0){
      const lost=Math.min(c.soul,Math.max(10,Math.ceil(c.soul*.32)));
      c.soul-=lost;
      score(g,p.team,Math.floor(lost*.35),definition(catalog,c.id).name+' · Seelenzerfall');
     }
     if(c.condenseLeft>0){
      c.condensed=Math.max(0,c.condensed-Math.min(c.condensed,c.condenseSlice));
      c.condenseLeft--;
      if(c.condenseLeft===0)c.condensed=0;
     }
    }
    if(c.soulCooldown>0)c.soulCooldown--;
    if(c.raidCooldown>0)c.raidCooldown--;
   }
   // Active Seelenraub pauses both stored-soul and creature-value decay.
   if(c.decaySkipOwnTurn!==p.ownTurns){
    if(c.decayGrace>0)c.decayGrace--;
    else{
     const base=DECAY_BY_LEVEL[clamp(c.level,1,10)];
     let lost=Math.max(1,Math.round(base*(1-.1*perk(p,'resilience'))));
     if(defenseSpecialist(p)&&c.mode==='def'&&defensive(c)){
      const reduction=essencePerkRank(p.essence.tier)>=3?.25:.15;
      lost-=Math.floor(lost*reduction);
     }
     c.atk=Math.max(0,c.atk-lost);c.def=Math.max(0,c.def-lost);
    }
   }
   if(lv1State(p).perk&&activeLv1(p,c,catalog)){
    c.atk+=Math.floor(Math.max(0,oldAtk-c.atk)*.3);
    c.def+=Math.floor(Math.max(0,oldDef-c.def)*.3);
   }
   removeIfEmpty(g,p,slot,catalog);
   // Growth follows a later completed OWN turn and affects only attack power,
   // never the stored ATK/DEF (therefore creature decay stays untouched).
   if(p.field[slot]===c&&c.role==='predator'&&!c.fusion&&!c.predatorToken&&!c.fate){
    if(!Number.isInteger(c.predatorEvolutionAge))c.predatorEvolutionAge=0;
    if(!Number.isInteger(c.predatorBornOwnTurn))c.predatorBornOwnTurn=p.ownTurns;
    if(p.ownTurns>c.predatorBornOwnTurn&&c.predatorEvolutionAge<4){
     c.predatorEvolutionAge++;
     g.log.push('Entwicklung: '+definition(catalog,c.id).name+' · '+
      (90+c.predatorEvolutionAge*3)+' % ATK-Grundfaktor.');
    }
   }
  }
 }
 function beginLv1Turn(g,p,catalog){
  const s=lv1State(p);if(!s.perk)return;
  s.floatUsed=0;s.swarmUsed=0;
  for(let i=0;i<s.ghostSlots.length;i++){
   const c=s.ghostSlots[i];if(!c)continue;
   c.used=false;c.switched=false;c.lv1Attacks=0;
   c.atk=Math.max(0,c.atk-21);c.def=Math.max(0,c.def-21);
   removeIfEmpty(g,p,i,catalog,'ghost');
  }
  for(const c of lv1Troops(p)){
   if(c.lv1Mourn&&p.ownTurns>=(c.lv1MournUntil||0)){
    c.atk=Math.max(0,c.atk-c.lv1Mourn);
    c.def=Math.max(1,c.def-c.lv1Mourn);
    c.maxDef=Math.max(1,(c.maxDef||c.def)-c.lv1Mourn);
    c.lv1Mourn=0;
   }
  }
  const hive=hasLv1Class(p,'hive',catalog);
  if(hive&&s.ghostSlots.length<5){s.ghostSlots.push(null);
   g.log.push('✧ Nekroth öffnet Geisterslot '+s.ghostSlots.length+'/5.');}
  if(hive){const healing=s.ghostSlots.filter(Boolean).length*20;
   g.teams[p.team].lp=Math.min(g.teams[p.team].maxLp,g.teams[p.team].lp+healing);}
  if(hasLv1Class(p,'protector',catalog))for(const c of lv1Troops(p)){
   if(!activeLv1(p,c,catalog))continue;
   const deficit=Math.max(0,(c.maxDef||c.def)-c.def);
   if(deficit)c.def+=Math.ceil(deficit*.5);
   else c.lv1Shield=Math.min(Math.floor(c.def*.5),
    (c.lv1Shield||0)+Math.floor(c.def*.25));
  }
  for(const c of lv1Troops(p).filter(x=>lv1Key(x,catalog)==='attacker')){
   const gain=Math.min(5,lv1Troops(p).filter(x=>activeLv1(p,x,catalog)).length)*20;
   c.atk=Math.min(10000,c.atk+gain);
  }
  for(const c of lv1Troops(p))c.lv1Attacks=0;
  const lumira=lv1Troops(p).find(c=>lv1Key(c,catalog)==='ace');
  if(lumira){const healed=score(g,p.team,Math.floor(lumira.atk*.3),'Lumira · Seelenfunke');
   lumira.def=Math.min(lumira.maxDef,lumira.def+healed);
   g.teams[p.team].lp=Math.min(g.teams[p.team].maxLp,g.teams[p.team].lp+healed);}
  syncLv1Swarm(p,catalog);
 }
 function restoreAllies(g,p,catalog){
  // Allied Guardian healing, including the partner's board, is base DEF only.
  const allies=g.players.filter(x=>x.team===p.team)
   .flatMap(x=>x.field.map((c,slot)=>({owner:x,slot,c})))
   .filter(x=>x.c&&defensive(x.c)&&x.c.mode==='def');
  for(const guardian of p.field.filter(c=>c?.role==='guardian'&&c.mode==='def')){
   for(const ally of allies){
    if(ally.c===guardian)continue;
    combat(ally.c);
    const amount=Math.min(150,25+guardian.level*12);
    const healed=Math.min(amount,Math.max(0,ally.c.maxDef-ally.c.def));
    if(healed){ally.c.def+=healed;
     g.log.push('Wächter stärkt '+definition(catalog,ally.c.id).name+' um '+healed+' DEF.');}
   }
  }
 }
 function soulCapacity(c){return 250+c.level*125;}
 const essenceSoulFactor=(g,p)=>{
  const rank=p.team===0?defensePerk(g):0;
  return rank>=4?1.22:rank>=2?1.08:1;
 };
 function storeSoul(c,amount,schoolFactor=1){
  combat(c);
  const gain=Math.min(Math.max(0,soulCapacity(c)-c.soul),
   Math.floor(amount*Math.max(c.fusion?1.5:1,schoolFactor)));
  c.soul+=gain;return gain;
 }
 function absorbSouls(g,p,catalog){
  for(const source of p.field.filter(c=>c?.role==='soul'&&c.mode==='def')){
   combat(source);
   let earned=0,drainedDef=0,drainedAtk=0;
   for(const opponent of g.players.filter(x=>x.team!==p.team)){
    for(const target of opponent.field.filter(Boolean)){
     const amount={atk:0,def:0};
     for(const stat of ['atk','def']){
      const n=Math.min(target[stat],10);target[stat]-=n;amount[stat]+=n;
     }
     for(let i=0;i<source.level;i++){
      const chance=source.drainPreference===1?75:source.drainPreference===2?25:50;
      // Stable server-side sequence; client never decides how much is drained.
      const sample=(((g.turn+1)*2654435761+source.uid*2246822519+
       target.uid*3266489917+i*668265263)>>>0)%100;
      let stat=sample<chance?'atk':'def';
      if(target[stat]===0&&target[stat==='atk'?'def':'atk']>0)
       stat=stat==='atk'?'def':'atk';
      const n=Math.min(5,target[stat]);target[stat]-=n;amount[stat]+=n;
     }
     earned+=amount.atk+amount.def;drainedAtk+=amount.atk;drainedDef+=amount.def;
    }
   }
   if(!earned)continue;
   const gain=storeSoul(source,earned,essenceSoulFactor(g,p));
   score(g,p.team,Math.min(60+source.level*60,Math.floor(earned*1.75)),
    definition(catalog,source.id).name+' · Seelenbrand');
   if(source.level>=5&&source.drainPreference===2)
    g.teams[p.team].lp=Math.min(g.teams[p.team].maxLp,
     g.teams[p.team].lp+Math.floor(drainedDef*.3));
   g.log.push(definition(catalog,source.id).name+' entzieht beiden Gegnerfeldern '+
    drainedAtk+' ATK / '+drainedDef+' DEF und speichert '+gain+' Seele.');
   if(g.status!=='active')return;
  }
 }
 function moveOn(g,catalog){
  g.activeSeat=(g.activeSeat+1)%4;g.turn++;
  g.predatorPursuit=null;
  if(g.activeSeat===0)g.round++;
  const p=g.players[g.activeSeat];
  p.ownTurns++;p.summoned=false;
  // Deck exhaustion is checked at the START of the owner's next turn.
  if(p.deck.length===0){win(g,1-p.team,p.name+' hat zum Zugbeginn keine Deckkarten mehr.');return;}
  for(const c of p.field){
   if(!c)continue;
   combat(c);
   c.used=false;c.switched=false;
   c.essenceAttacks=0;
   if(c.role==='combatant'||c.role==='allrounder')
    c.resonance=Math.min(3,c.resonance+1);
   if(c.fusion&&c.role==='resonator')c.resonance=Math.min(2,c.resonance+1);
  }
  beginPredatorTurn(g,p,catalog);
  beginLv1Turn(g,p,catalog);
  if(g.status!=='active')return;
  restoreAllies(g,p,catalog);
  absorbSouls(g,p,catalog);
  if(g.status!=='active')return;
  maybeFate(g,p,catalog);
  draw(p);
  g.log.push(p.name+' ist am Zug und zieht bis auf fünf Handkarten.');
 }
 const isStreet=lv=>lv.length>=3&&new Set(lv).size===lv.length&&
  [...lv].sort((a,b)=>a-b).every((v,i,a)=>i===0||v===a[i-1]+1);
 function resonatorLineage(materials){
  let count=0,used=false;
  for(const card of materials){
   const prior=card.fusionResonatorLineage;
   if(prior&&Number.isInteger(prior.count)){
    count+=clamp(prior.count,0,2);used=used||prior.used===true;
   }else if(card.fusion&&card.role==='resonator')count++;
   used=used||card.resonatorAscentUsed===true; // v16.1 saved rooms
  }
  count=Math.min(2,count);return {count,used,granted:count>=2&&!used};
 }
 function fusionLevel(materials,{coreIndex:chosen}={}){
  const lv=materials.map(c=>c.level);
  assert(lv.length>=2&&lv.length<=5&&lv.every(n=>Number.isInteger(n)&&n>=1&&n<=12),
   'Fusion benötigt zwei bis fünf gültige Materiallevel.');
  const street=isStreet(lv),strongest=Math.max(...lv);
  // Full streets use their highest card; for other patterns core is selectable.
  const coreIndex=street?lv.indexOf(strongest):Number.isInteger(chosen)&&
   chosen>=0&&chosen<lv.length?chosen:lv.indexOf(strongest);
  const core=lv[coreIndex],others=lv.filter((_,i)=>i!==coreIndex)
   .sort((a,b)=>Math.abs(a-core)-Math.abs(b-core)||b-a);
  const gap=Math.abs(core-others[0]),base=core>=5?3:core>=3?2:core===2?1:0;
  const gain=gap<=1?base:gap===2?Math.min(base,2):gap===3?Math.min(base,1):gap>=5?-2:-1;
  const chain=materials[coreIndex].fusion===true,floor=chain?core:Math.max(1,core-1);
  const initial=core<=2?Math.min(core,Math.max(1,floor+Math.max(0,gain))):
   Math.max(floor,floor+gain-(chain?1:0));
  const strong=others.length>=2&&others.every(x=>Math.abs(x-core)<=2)&&core>=3;
  const bonus=street?(lv.length===5&&core>=4?1:0):(strong?1:0);
  const pair=core===1&&lv.length===2&&lv.every(n=>n===1)?2:initial+bonus;
  const lineage=resonatorLineage(materials),natural=clamp(
   Math.min(lv.reduce((a,b)=>a+b,0),pair),1,10);
  const level=clamp(natural+(lineage.granted?1:0),1,10);
  const weights=[1,.75,.55,.4],weighted=others.reduce((sum,n,i)=>
   sum+Math.max(0,Math.abs(core-n)-1)*weights[i],0);
  const distance=weighted/others.reduce((sum,_,i)=>sum+weights[i],0);
  return {level,core,coreIndex,coreIsFusion:chain,floor,gain,bonus,
   street,streetName:street?(lv.length===5?'Gigantische Straße':
    lv.length===4?'Große Straße':'Kleine Straße'):null,
   distance,penalty:street?0:Math.min(.22,distance*.055),
   resonatorAscent:lineage.granted,resonatorLineage:lineage};
 }
 function materialSelection(g,seat,materials,catalog){
  const p=g.players[seat],ally=g.players[seat^2];
  assert(Array.isArray(materials)&&materials.length>=2&&materials.length<=5,
   'Fusion benötigt zwei bis fünf eigene oder verbündete Materialien.');
  const keys=new Set(),cards=[];
  for(const m of materials){
   assert(m&&['hand','field','allyField','ghost','charge'].includes(m.from)&&
    Number.isInteger(m.index)&&m.index>=0,
    'Ungültiges Fusionsmaterial.');
   const key=m.from+':'+m.index;assert(!keys.has(key),'Material doppelt ausgewählt.');keys.add(key);
   assert((m.from!=='ghost'&&m.from!=='charge')||lv1State(p).perk,
    'Geistermaterial benötigt die Verbotene Forschung.');
   assert(m.from!=='allyField'||ally?.team===p.team&&ally?.field,
    'Verbündetes Feld nicht verfügbar.');
   const card=m.from==='hand'?p.hand[m.index]:m.from==='field'?p.field[m.index]:
    m.from==='allyField'?ally.field[m.index]:
    m.from==='ghost'?ghostZone(p)[m.index]:m.index<lv1State(p).charges?
     {_charge:true,id:-1,level:2,role:'combatant',fusion:false}:null;
   assert(card!==null&&card!==undefined,'Fusionsmaterial ist nicht vorhanden.');
   assert(!card.fate,'Schicksalsmonster sind nicht fusionierbar.');
   const id=Number.isInteger(card)?card:card.id;
   assert(!definition(catalog,id)?.ace,'ACE-Monster dürfen nicht als Fusionsmaterial verwendet werden.');
   assert(!card.predatorToken,'Rudelruf-Tokens sind niemals Fusionsmaterial.');
   cards.push(m.from==='hand'?{id:card,level:0,...{_hand:true}}:card);
  }
  return cards;
 }
 function fusionOptions(g,seat,materials,catalog,{coreIndex}={}){
  const p=g.players[seat];
  const cards=materialSelection(g,seat,materials,catalog).map(c=>c._charge?{
   id:-1,level:2,role:'combatant',fusion:false,resonance:0,
   element:'',ability:'',_charge:true}:c._hand?{
   id:c.id,level:definition(catalog,c.id).level,
   role:definition(catalog,c.id).role||'combatant',fusion:false,resonance:0,
   element:definition(catalog,c.id).element,ability:definition(catalog,c.id).ability}:
   {...c,element:definition(catalog,c.id).element,
    ability:definition(catalog,c.id).ability});
  const rule=fusionLevel(cards,{coreIndex});
  const analysis=fusionAnalysis(cards,rule,p);
  const eligibleSpecial=lv1State(p).perk&&cards.length>=3&&cards.length<=5&&
   cards.every(c=>c.level===1&&!c._charge);
  return {rule,cards,analysis,templates:[...new Set(p.remainingFusion)].filter(id=>{
   const c=definition(catalog,id);
   return c?.lv1Exclusive?eligibleSpecial:c?.level<=rule.level&&c?.level>=2;
  })};
 }
 function specialFusionAnalysis(analysis,materials,template){
  if(!template.lv1Exclusive)return analysis;
  return {...analysis,quality:Math.min(2.2,analysis.quality+(materials.length===5?.05:.18)),
   rolls:clamp(Math.max(3,analysis.rolls),1,7),specialLv1:true};
 }
 function fusionPattern(cards){
  const levels=cards.map(c=>c.level),counts=new Map();
  for(const level of levels)counts.set(level,(counts.get(level)||0)+1);
  const groups=[...counts.values()].sort((a,b)=>b-a),unique=[...counts.keys()].sort((a,b)=>a-b);
  let streak=1,longest=1;
  for(let i=1;i<unique.length;i++){
   streak=unique[i]===unique[i-1]+1?streak+1:1;
   longest=Math.max(longest,streak);
  }
  longest=Math.min(5,longest);
  let name='Freie Fusion',rollBonus=0,levelBonus=0,qualityBonus=0;
  const levelOnePair=(counts.get(1)||0)>=2;
  if(groups[0]===5){name='Fünfling';rollBonus=3;levelBonus=2;qualityBonus=.18;}
  else if(groups[0]===4){name='Vierling';rollBonus=2;levelBonus=1;qualityBonus=.13;}
  else if(groups[0]===3&&groups[1]===2){name='Full House';rollBonus=2;levelBonus=2;qualityBonus=.14;}
  else if(longest>=3){
   name=longest===5?'Gigantische Straße':longest===4?'Große Straße':'Kleine Straße';
   rollBonus=longest===5?4:longest===4?3:1;
   levelBonus=longest===5?3:longest===4?2:1;
   qualityBonus=longest===5?.36:longest===4?.30:.20;
  }else if(groups[0]===3){name='Drilling';rollBonus=1;levelBonus=1;qualityBonus=.08;}
  else if(groups[0]===2&&groups[1]===2){name='Zwei Paare';rollBonus=1;
   levelBonus=1;qualityBonus=.12+(levelOnePair?.05:0);}
  else if(groups[0]===2){name='Paar';qualityBonus=.04+(levelOnePair?.015:0);}
  const lowLevelBonus=levels.length>=3&&name!=='Freie Fusion'?
   Math.min(.08,levels.filter(l=>l===1).length*.02+
    levels.filter(l=>l===2).length*.01):0;
  qualityBonus+=lowLevelBonus;
  const elemental=cards.length>=2&&!!cards[0].element&&
   cards.every(c=>c.element===cards[0].element);
  if(elemental){qualityBonus+=.025;name+=' · Elementharmonie';}
  return {name,rollBonus,levelBonus,qualityBonus,lowLevelBonus,elemental,
   hasCombo:name!=='Freie Fusion'};
 }
 function fusionAnalysis(cards,rule,p={}){
  const pattern=fusionPattern(cards),levels=cards.map(c=>c.level);
  const precision=perk(p,'fusionPrecision');
  const fullStreet=rule.street&&cards.length>=4;
  const precisionPct=cards.length>=3&&pattern.hasCombo?
   precision*(fullStreet?2:1.5):0;
  const baseFactor=clamp(1+.045*(cards.length-2)-rule.penalty+
   pattern.qualityBonus+precisionPct/100,.72,1.48);
  const normal=cards.filter(c=>['combatant','allrounder'].includes(c.role)&&!c.fusion);
  const resonators=cards.filter(c=>c.role==='resonator'&&c.fusion);
  const normalPct=Math.min(24,normal.reduce((sum,c)=>
   sum+4+4*clamp(c.resonance||0,0,3),0));
  const resonatorPct=Math.min(60,resonators.reduce((sum,c)=>
   sum+10+10*clamp(c.resonance||0,0,2),0));
  const resonancePct=normalPct+resonatorPct;
  // Allrounders enhance a valid chain; the addition cannot erase prior quality.
  const specialists=cards.filter(c=>!['combatant','allrounder'].includes(c.role)&&
   !(c.role==='resonator'&&c.fusion));
  let protectedBase=baseFactor,bonusRolls=pattern.rollBonus+
   (fullStreet&&precision>=3?1:0);
  if(resonancePct&&specialists.length>=2){
   const specialistPattern=fusionPattern(specialists),specialistRule=fusionLevel(specialists);
   protectedBase=Math.max(baseFactor,clamp(1+.045*(specialists.length-2)-
    specialistRule.penalty+specialistPattern.qualityBonus,.72,1.48));
   bonusRolls=Math.max(bonusRolls,specialistPattern.rollBonus);
  }
  const roles=cards.map(c=>c.role),pureRolePct=
   ['predator','guardian','soul'].includes(roles[0])&&
   roles.every(r=>r===roles[0])?5:0;
  const heritagePct=Math.min(15,cards.reduce((sum,c)=>{
   if(!c.fusion)return sum;
   const earned=Number.isFinite(c.fusionHeritage?.earnedPct)?
    c.fusionHeritage.earnedPct:clamp(((c.quality||1)-1)*100,0,30);
   return sum+clamp(earned,0,30)*.35;
  },0));
  const loreChainApplied=perk(p,'fusionLore')>0&&
   !p.fusionLoreChainUsed&&cards.some(c=>c.fusion===true);
  const loreOpeningRoll=perk(p,'fusionLore')>0&&!p.fusionsPerformed;
  const runeCompanion=p?.field?.some(c=>essenceCompanion(p,c,'fusion'));
  const essenceRolls=runeCompanion?1+
   (p.essence?.school==='fusion'&&essencePerkRank(p.essence.tier)>=3?1:0):0;
  const factor=clamp(protectedBase+resonancePct/100+pureRolePct/100+
   heritagePct/100+(loreChainApplied?.03:0),.72,2.2);
  const ordinaryRolls=1+Math.min(3,Math.floor((levels.reduce((a,b)=>a+b,0)-
   Math.max(...levels))/2));
  const rolls=clamp(ordinaryRolls+bonusRolls+(loreOpeningRoll?1:0)+essenceRolls+
   cards.filter(c=>c.ability==='guide').length,1,7);
  const materialBlocks=Math.min(24,cards.reduce((sum,c)=>
   sum+(c.fusion?Math.min(12,c.level):0),0));
  const role=fusionRole(cards);
  const soulOdds=role==='guardian'&&cards.length>=3?
   Math.min(.75,.20+cards.reduce((sum,c)=>sum+.035+.007*Math.min(12,c.level),0)):0;
  return {pattern:pattern.name,rolls,role,quality:factor,
   baseQuality:protectedBase,elemental:pattern.elemental,lowLevelBonus:pattern.lowLevelBonus,
   resonancePct,normalPct,resonatorPct,pureRolePct,heritagePct,
   materialBlocks,soulOdds,comboLevelBonus:pattern.levelBonus,precisionPct,
   loreChainApplied,loreOpeningRoll,essenceRolls};
 }
 function fusionPreview(g,seat,materials,catalog,{coreIndex,templateId}={}){
  const {rule,cards,analysis:baseAnalysis,templates}=fusionOptions(g,seat,materials,catalog,{coreIndex});
  const chosen=templateId??templates[0];
  assert(templates.includes(chosen),'Keine passende Fusionsvorlage verfügbar.');
  const template=definition(catalog,chosen),
   analysis=specialFusionAnalysis(baseAnalysis,cards,template),
   weight=roleWeights(analysis.role);
  const fieldSoul=cards.reduce((sum,c,i)=>sum+
   (materials[i].from==='field'?Math.max(0,Math.min(2000,c.soul||0)):0),0);
  const soulDef=Math.min(250,Math.floor(fieldSoul*.3/10)*10);
  const bounds=stat=>{
   const midpoint=referenceStat(template,stat,g.players[seat])*
    weight[stat]*analysis.quality;
   const carry=stat==='def'?soulDef:0;
   const low=Math.max(0,round10(midpoint*.88)+carry);
   const high=Math.max(0,round10(midpoint*1.12)+analysis.materialBlocks*10+carry);
   return [low,high];
  };
  const extra=template.lv1Special==='hive'?{atk:0,def:100}:
   template.lv1Special==='protector'?{atk:0,def:200}:
   template.lv1Special==='attacker'?{atk:120,def:0}:{atk:0,def:0};
  const atk=bounds('atk'),def=bounds('def');
  atk[0]+=extra.atk;atk[1]+=extra.atk;
  def[0]+=extra.def;def[1]+=extra.def;
  return {rule,analysis,templateId:chosen,atk,def,
   resultingLevel:template.lv1Exclusive?1:rule.level,
   soulDef,remaining:g.players[seat].remainingFusion.filter(id=>id===chosen).length};
 }
 function fusionRole(cards){
  const specialist=cards.map(c=>c.role).filter(r=>['predator','guardian','soul'].includes(r));
  if(!specialist.length)return 'resonator';
  if(specialist.every(r=>r==='soul'))return 'soul';
  const defense=specialist.filter(r=>r==='guardian'||r==='soul').length;
  const predators=specialist.filter(r=>r==='predator').length;
  const majority=Math.floor(specialist.length/2)+1;
  if(defense>=majority&&defense>predators)return 'guardian';
  if(predators>=majority&&predators>defense)return 'predator';
  return 'resonator';
 }
 const roleWeights=role=>role==='predator'?{atk:1.2,def:.75}:
  defensive({role})?{atk:.75,def:1.35}:{atk:1,def:1};
 function soulActor(g,p,slot,catalog){
  assert(Number.isInteger(slot)&&slot>=0&&slot<7,'Ungültiger Feldplatz.');
  const c=p.field[slot];
  assert(c&&c.role==='soul'&&c.mode==='def','Nur Seelenzehrer in DEF können diese Fähigkeit nutzen.');
  combat(c);return c;
 }
 function soulAction(g,p,action,catalog){
  const c=soulActor(g,p,action.slot,catalog),label=definition(catalog,c.id).name;
  if(action.type==='soulFocus'){
   assert(c.level>=5,'Entzugsfokus wird erst ab Rang 3 verfügbar.');
   assert(['atk','def'].includes(action.stat),'Fokus muss ATK oder DEF sein.');
   assert(c.lastDrainSwitch!==p.ownTurns,'Fokus in diesem Zug schon gewechselt.');
   c.drainPreference=action.stat==='atk'?1:2;c.lastDrainSwitch=p.ownTurns;
   g.log.push(label+' konzentriert den Seelenentzug auf '+action.stat.toUpperCase()+'.');
   return;
  }
  assert(c.lastSoulAction!==p.ownTurns,'Bereits eine aktive Seelenfähigkeit in diesem Zug benutzt.');
  if(action.type==='soulCondense'){
   assert(c.soul>=40&&c.soulCooldown===0,'Nicht genug Seele oder Verdichten auf Abklingzeit.');
   const amount=Math.floor(c.soul*.75);
   c.soul-=amount;c.condensed=Math.min(9000,c.condensed+amount);
   c.condenseLeft=3;c.condenseSlice=Math.ceil(c.condensed/3);c.soulCooldown=3;
   g.log.push(label+' verdichtet '+amount+' Seele: +'+Math.floor(c.condensed*.5)+
    ' ATK und vorübergehende DEF (drei eigene Züge). Angriff und Positionswechsel bleiben möglich.');
  }else if(action.type==='soulDischarge'){
   assert(c.soul>=40,'Für die Entladung werden mindestens 40 Seelenpunkte benötigt.');
   const amount=c.soul;c.soul=0;
   score(g,p.team,Math.floor(amount*1.3),label+' · Seelenentladung');
  }else if(action.type==='soulRaid'){
   assert(c.raidCooldown===0,'Seelenraub ist noch auf Abklingzeit.');
   assert(Number.isInteger(action.targetSeat)&&Number.isInteger(action.targetSlot)&&
    action.targetSlot>=0&&action.targetSlot<7,'Ungültiges Seelenraub-Ziel.');
   const enemy=g.players[action.targetSeat];
   assert(enemy&&enemy.team!==p.team,'Seelenraub ist nur gegen Gegner erlaubt.');
   const target=enemy.field[action.targetSlot];assert(target,'Seelenraub-Ziel ist leer.');
   const budget=Math.floor((20+5*c.level)*2.5);
   const ratio=c.drainPreference===1?.7:c.drainPreference===2?.3:.5;
   const first=ratio>=.5?'atk':'def',second=first==='atk'?'def':'atk';
   let remaining=budget,atk=0,def=0;
   const take=(stat,n)=>{
    const actual=Math.min(Math.max(0,target[stat]),n);
    target[stat]-=actual;remaining-=actual;
    if(stat==='atk')atk+=actual;else def+=actual;
   };
   take(first,Math.ceil(budget*Math.max(ratio,1-ratio)));
   take(second,remaining);if(remaining>0)take(first,remaining);
   assert(atk+def>0,'Dieses Ziel besitzt keine entziehbaren Werte mehr.');
   const gained=storeSoul(c,atk+def,essenceSoulFactor(g,p));
   c.raidCooldown=3;c.decaySkipOwnTurn=p.ownTurns;
   g.log.push(label+' raubt '+definition(catalog,target.id).name+' '+atk+
    ' ATK / '+def+' DEF und speichert '+gained+' Seele.');
   removeIfEmpty(g,enemy,action.targetSlot,catalog);
  }else fail('Unbekannte Seelenfähigkeit.');
  c.lastSoulAction=p.ownTurns;
 }
 function beginDuel(g,chapter,entry,{catalog,enemyDeckA,enemyDeckB,enemyFusionsA,enemyFusionsB,enemyPowerA,enemyPowerB,enemyNameA,enemyNameB,humanBuilds}={}){
   g.chapter=chapter;g.entry=entry;g.duelNo=(g.duelNo||1)+1;g.status='active';g.winner=null;g.surrenderedBy=null;g.round=1;g.turn=0;g.activeSeat=0;
   g.lpParityVersion=2;g.fieldLayout='team7';
   g.questProgress={floating:0,swarm:0,special:0};g.questPassed=null;
   g.fateEvent=null;g.arenaEvent=null;g.predatorPursuit=null;g.predatorImpact=null;g.stompEvent=null;
   const nextLp=duoStartingLp(g.chapter);
   g.teams.forEach(t=>{t.maxLp=nextLp;t.lp=nextLp;});
   g.teams[0].shield=teamAegis(g);g.teams[1].shield=0;
   g.teams[0].essenceTauntTurn=-1;g.teams[0].essenceBastionUsed=false;
   for(const pl of g.players){
    const updated=humanBuilds?.[pl.seat];
    if(pl.team===0&&updated){
     assert(validDeck(updated.deck,catalog)&&validDeck(updated.fusions,catalog,true),
      'Aktualisiertes 2v2-Partnerdeck ist ungültig.');
     const build=normalizedBuild(updated.upgrades,updated.enhancements,
      updated.deck,updated.fusions,catalog,updated.essence,updated.lv1);
     pl.name=safeName(updated.name||pl.name);
     pl.baseDeck=[...updated.deck];pl.baseFusions=[...updated.fusions];
     pl.upgrades=build.upgrades;pl.enhancements=build.enhancements;
     pl.essence=build.essence;
     pl.loanedDeck=updated.loanedDeck===true;
     pl.portraitId=/^hero-(0[1-9]|1[0-6])$/.test(updated.portraitId||'')?updated.portraitId:'hero-01';
     pl.lv1.perk=build.lv1.perk;pl.lv1.rank=build.lv1.rank;
    }
    if(pl.seat===1&&enemyDeckA&&enemyFusionsA){
     assert(validDeck(enemyDeckA,catalog)&&validNpcFusionDeck(enemyFusionsA,catalog),
      'Gegnerdeck des nächsten Kapitels ist ungültig.');
     pl.baseDeck=[...enemyDeckA];pl.baseFusions=[...enemyFusionsA];
     pl.opponentPower=npcPower(enemyPowerA);
    }
    if(pl.seat===3&&enemyDeckB&&enemyFusionsB){
     assert(validDeck(enemyDeckB,catalog)&&validNpcFusionDeck(enemyFusionsB,catalog),
      'Partner-Gegnerdeck des nächsten Kapitels ist ungültig.');
     pl.baseDeck=[...enemyDeckB];pl.baseFusions=[...enemyFusionsB];
     pl.opponentPower=npcPower(enemyPowerB);
    }
    if(pl.seat===1)pl.name=safeName(enemyNameA||opponentNames(g.chapter)[0]);
    if(pl.seat===3)pl.name=safeName(enemyNameB||opponentNames(g.chapter)[1]);
    // Canonical solo NPC card pool must never be altered by human catch-up loaners.
    pl.deck=pl.team===0?(g.personalDuoRules?[...pl.baseDeck]:chapterDeck(pl.baseDeck,catalog,g.chapter,'chapter')):
     [...pl.baseDeck];
    pl.fusionDeck=[...pl.baseFusions];pl.remainingFusion=[...pl.baseFusions];
    pl.hand=[];pl.field=Array(7).fill(null);pl.graveyard=[];
    pl.summoned=false;pl.ownTurns=0;pl.fusionsPerformed=0;pl.fateUsed=false;
    pl.fusionLoreChainUsed=false;shuffleDeck(g,pl);draw(pl);
    const saved=lv1State(pl);
    saved.ghostSlots=[];saved.charges=0;saved.choices=[];saved.offers=[];
    saved.floatUsed=0;saved.swarmUsed=0;
   }
   g.teams[0].shield=teamAegis(g);
   fanaticOpening(g);
   if(g.chapter===15){
    g.players[1].graveyard.push({id:714,from:'story'});
    g.players[1].field[0]=instance(g,715,catalog,{fusion:true,ownerSeat:1,storyCorruption:true});
    g.log.push('✧ Lumiras Fall erscheint nach der erzwungenen Verwandlung.');
   }
   if(isQuest(g.chapter))g.log.push('Fanatiker-Saga · '+encounter(g.chapter).dialogue);
   g.log.push('Kapitel '+g.chapter+' beginnt mit vollständigen eigenen Decks.');
 }
 function apply(old,seat,action,{catalog,enemyDeckA,enemyDeckB,enemyFusionsA,enemyFusionsB,
  enemyPowerA,enemyPowerB,enemyNameA,enemyNameB,humanBuilds,now=Date.now()}={}){
  assert(old?.schema===2&&old.mode==='duo-campaign','Unbekanntes 2v2-Spielstandsformat.');
  assert(Number.isInteger(seat)&&seat>=0&&seat<=3,'Ungültiger Sitzplatz.');
  assert(action&&typeof action.type==='string','Aktion fehlt.');
  const g=copy(old),p=g.players[seat];
  if(action.type==='join'){
   assert(g.status==='waiting'&&seat===2,'Raum kann nicht mehr betreten werden.');
   assert(validDeck(action.deck,catalog),'Das Partnerdeck ist ungültig.');
   assert(validDeck(action.fusions,catalog,true),'Das Partner-Fusionsdeck ist ungültig.');
   const build=normalizedBuild(action.upgrades,action.enhancements,
    action.deck,action.fusions,catalog,action.essence,action.lv1);
   const partner=player(2,safeName(action.name),
    g.personalDuoRules?[...action.deck]:chapterDeck(action.deck,catalog,g.chapter,g.entry),action.fusions,build);
   partner.portraitId=/^hero-(0[1-9]|1[0-6])$/.test(action.portraitId||'')?action.portraitId:'hero-01';
   g.players[2]=partner;g.status=action.deferStart===true?'lobby':'active';
   g.teams[0].shield=teamAegis(g);
   for(const pl of g.players){shuffleDeck(g,pl);draw(pl);}
   fanaticOpening(g);
   if(g.chapter===15){
    const fanatic=g.players[1];
    fanatic.graveyard.push({id:714,from:'story'});
    fanatic.field[0]=instance(g,715,catalog,{fusion:true,ownerSeat:1,storyCorruption:true});
    g.log.push('✧ Lumira wird im ersten Zug zu „Lumiras Fall“ (920 ATK / 220 DEF) zwangsfusioniert.');
   }
   g.log.push(partner.name+(g.status==='lobby'?' ist der Party beigetreten. Wartet auf den gemeinsamen Start.':' ist beigetreten. 2v2 beginnt.'));
   g.revision++;return g;
  }
  if(action.type==='requestDuel'){
   if(g.personalDuoRules)assert(seat===0,'Nur der Host kann ein Duell anfragen.');
   const expired=g.status==='party_ready'&&g.partyStartInvite?.expiresAt<=now;
   assert([0,2].includes(seat)&&(['lobby','finished'].includes(g.status)||expired)&&
    g.players[2].name!=='Partner (ausstehend)', 'Beide Gruppenmitglieder müssen verbunden und außerhalb eines Duells sein.');
   for(const humanSeat of [0,2])if(humanBuilds?.[humanSeat]?.name)g.players[humanSeat].name=safeName(humanBuilds[humanSeat].name);
   const target=Number(action.chapter),entry=target>=11?'quest':'chapter';
   assert(Number.isInteger(target)&&!!encounter(target),'Ungültiges Duellziel.');
   const previousStatus=expired?(g.partyStartInvite.returnStatus||'lobby'):g.status;
   g.partyStartInvite={fromSeat:seat,toSeat:seat===0?2:0,id:g.revision+1,
    chapter:target,entry,returnStatus:previousStatus,expiresAt:now+120000};
   g.status='party_ready';
   g.log.push(p.name+' lädt den Partner zu '+encounter(target).name+' ein.');
   g.revision++;return g;
  }
  if(action.type==='startParty'){
   if(g.personalDuoRules)assert(seat===0,'Nur der Host kann ein Duell anfragen.');
   assert(g.status==='lobby'&&[0,2].includes(seat)&&g.players[2].name!=='Partner (ausstehend)',
    'Nur verbundene Party-Mitglieder können ein Duell anfragen.');
   const partnerSeat=seat===0?2:0;
   g.status='party_ready';
   g.partyStartInvite={fromSeat:seat,toSeat:partnerSeat};
   g.log.push(g.players[seat].name+' bittet '+g.players[partnerSeat].name+' um die Startfreigabe.');
   g.revision++;return g;
  }
  if(action.type==='cancelPartyStart'||action.type==='declinePartyStart'){
   assert(g.status==='party_ready'&&
    (action.type==='cancelPartyStart'?seat===g.partyStartInvite?.fromSeat:
      seat===g.partyStartInvite?.toSeat),
    'Es liegt keine entsprechende Startanfrage vor.');
   assert(g.partyStartInvite?.id==null||action.inviteId===g.partyStartInvite.id,'Diese Einladung wurde inzwischen ersetzt.');
   g.status=g.partyStartInvite?.returnStatus||'lobby';g.partyStartInvite=null;
   g.log.push(g.players[seat].name+' hat die Startanfrage zurückgezogen oder abgelehnt.');
   g.revision++;return g;
  }
  if(action.type==='acceptPartyStart'){
   assert(g.status==='party_ready'&&seat===g.partyStartInvite?.toSeat&&
    humanBuilds?.[0]&&humanBuilds?.[2],
    'Start benötigt die Zustimmung des Partners und beide aktuellen Decks.');
   const invitation=g.partyStartInvite;
   if(invitation.id!=null){
    assert(action.inviteId===invitation.id,'Diese Einladung wurde inzwischen ersetzt.');
    assert(invitation.expiresAt>now,'Diese Einladung ist abgelaufen. Bitte erneut anfragen.');
    beginDuel(g,invitation.chapter,invitation.entry,{catalog,enemyDeckA,enemyDeckB,
     enemyFusionsA,enemyFusionsB,enemyPowerA,enemyPowerB,enemyNameA,enemyNameB,humanBuilds});
   }else{
   for(const humanSeat of [0,2]){
    const updated=humanBuilds[humanSeat];
    assert(validDeck(updated.deck,catalog)&&validDeck(updated.fusions,catalog,true),
     'Ein aktuelles Partnerdeck ist ungültig.');
    const build=normalizedBuild(updated.upgrades,updated.enhancements,
     updated.deck,updated.fusions,catalog,updated.essence,updated.lv1);
    const prior=g.players[humanSeat];
    const fresh=player(humanSeat,prior.name,
     g.personalDuoRules?[...updated.deck]:chapterDeck(updated.deck,catalog,g.chapter,g.entry),updated.fusions,build);
    fresh.portraitId=/^hero-(0[1-9]|1[0-6])$/.test(updated.portraitId||'')?updated.portraitId:'hero-01';
    shuffleDeck(g,fresh);draw(fresh);g.players[humanSeat]=fresh;
   }
   g.teams[0].shield=teamAegis(g);
   }
   g.partyStartInvite=null;g.status='active';
   g.log.push(g.players[0].name+' und '+g.players[2].name+' beginnen gemeinsam das Duell.');
   g.revision++;return g;
  }
  if(action.type==='nextChapter'){
   if(g.personalDuoRules)assert(seat===0,'Nur der Host kann das nächste Duell anfragen.');
   assert([0,2].includes(seat)&&g.status==='finished'&&g.winner===0&&
    (isQuest(g.chapter)?g.chapter<15&&g.questPassed===true:g.chapter<CHAPTERS.length),
    'Nur ein menschlicher Teamspieler kann das nächste freigeschaltete Kapitel anfragen.');
   const partnerSeat=seat===0?2:0;
   g.status='inviting_next';g.chapterInvite={from:g.players[seat].name,fromSeat:seat,toSeat:partnerSeat,chapter:g.chapter+1};
   g.log.push(g.players[seat].name+' lädt '+g.players[partnerSeat].name+' zu Kapitel '+(g.chapter+1)+' ein.');
   g.revision++;return g;
  }
  if(action.type==='declineNextChapter'){
   assert([0,2].includes(seat)&&seat===g.chapterInvite?.toSeat&&g.status==='inviting_next'&&g.winner===0,
    'Es liegt keine offene Einladung vor.');
   g.status='finished';g.chapterInvite=null;
   g.log.push(g.players[2].name+' hat die Einladung abgelehnt.');
   g.revision++;return g;
  }
  if(action.type==='acceptNextChapter'){
   assert([0,2].includes(seat)&&seat===g.chapterInvite?.toSeat&&g.status==='inviting_next'&&g.winner===0&&
    (isQuest(g.chapter)?g.chapter<15&&g.questPassed===true:g.chapter<CHAPTERS.length),
    'Einladung kann nicht angenommen werden.');
   g.chapterInvite=null;
   beginDuel(g,g.chapter+1,g.entry,{catalog,enemyDeckA,enemyDeckB,enemyFusionsA,enemyFusionsB,enemyPowerA,enemyPowerB,enemyNameA,enemyNameB,humanBuilds});
   g.revision++;return g;
  }
  assert(g.status==='active'&&g.winner===null,'Partie ist nicht aktiv.');
  if(action.type==='surrender'){
   assert([0,2].includes(seat),'Nur ein menschlicher Spieler kann aufgeben.');
   g.surrenderedBy=seat;
   win(g,1,p.name+' hat für das Team aufgegeben. Es gibt keine Belohnung.');
   g.revision++;return g;
  }
  assert(seat===g.activeSeat,'Ein anderer Spieler ist am Zug.');
  if(action.type==='summon'||action.type==='replace'){
   assert(!p.summoned,'Dieser Zug hat bereits eine Beschwörung.');
   assert(Number.isInteger(action.handIndex)&&p.hand[action.handIndex]!==undefined,'Handkarte fehlt.');
   assert(Number.isInteger(action.slot)&&action.slot>=0&&action.slot<7&&
    (action.type==='replace'?!!p.field[action.slot]:freeTeamSlot(g,p,action.slot)),'Feldplatz kann nicht belegt werden.');
   const handCard=p.hand[action.handIndex];
   const id=Number.isInteger(handCard)?handCard:handCard?.id;
   const fate=handCard?.fate===true?handCard:null;
   assert(allowed(catalog,id)||fate&&definition(catalog,id)?.fateTemplate,
    'Karte ist nicht regulär beschwörbar.');
   // A discard-stage summon keeps exactly one selected hand card and
   // atomically sends every other selected material to the graveyard.
   const discardIndices=action.discardIndices??[];
   assert(Array.isArray(discardIndices)&&discardIndices.length<=4&&
    new Set(discardIndices).size===discardIndices.length&&
    discardIndices.every(i=>Number.isInteger(i)&&i>=0&&i<p.hand.length&&
     i!==action.handIndex),'Ungültige Wegwerfen-Auswahl.');
   const discarded=discardIndices.map(i=>p.hand[i]);
   for(const index of [action.handIndex,...discardIndices].sort((a,b)=>b-a))
    p.hand.splice(index,1);
   if(discarded.length){
    p.graveyard.push(...discarded.map(c=>typeof c==='number'?{id:c,from:'discard'}:{...c,from:'discard'}));
    g.log.push(p.name+' behält ein Monster und wirft '+discarded.length+' Handkarten ab.');
   }
   if(action.type==='replace'){
    const old=p.field[action.slot];
    p.graveyard.push(old);lv1Leave(g,p,old,catalog);
    g.log.push(p.name+' ersetzt '+definition(catalog,old.id).name+' in Zone '+(action.slot+1)+'.');
   }
   p.field[action.slot]=instance(g,id,catalog,{ownerSeat:seat,fate});
   lv1Arrival(g,p,p.field[action.slot],catalog);
   p.summoned=true;g.log.push(p.name+' beschwört '+
    (fate?'ein Schicksalsmonster':definition(catalog,id).name)+'.');
  }else if(action.type==='lv1Station'){
   const s=lv1State(p),c=p.field[action.slot],i=action.ghostSlot;
   assert(s.perk&&Number.isInteger(i)&&i>=0&&i<s.ghostSlots.length&&
    s.ghostSlots[i]===null&&c&&!c.used&&!c.switched&&
    c.lv1MovedTurn!==g.turn&&!c.fate&&!c.predatorToken,
    'Geisterslot ist belegt oder Monster hat bereits gehandelt.');
   p.field[action.slot]=null;s.ghostSlots[i]=c;
   c.used=true;c.switched=true;c.lv1MovedTurn=g.turn;
   syncLv1Swarm(p,catalog);
   g.log.push(p.name+' versetzt '+definition(catalog,c.id).name+
    ' in Geisterslot '+(i+1)+'.');
  }else if(action.type==='lv1Return'){
   const s=lv1State(p),i=action.ghostSlot,j=action.slot;
   const c=s.ghostSlots[i];
   assert(s.perk&&Number.isInteger(j)&&j>=0&&j<7&&freeTeamSlot(g,p,j)&&
    c&&!c.used&&!c.switched&&c.lv1MovedTurn!==g.turn,
    'Rückverlegung aus dem Geisterslot ist nicht möglich.');
   s.ghostSlots[i]=null;p.field[j]=c;
   c.used=true;c.switched=true;c.lv1MovedTurn=g.turn;
   syncLv1Swarm(p,catalog);
   g.log.push(p.name+' holt '+definition(catalog,c.id).name+
    ' auf Feld '+(j+1)+' zurück.');
  }else if(action.type==='lv1GhostSwitch'){
   const c=ghostZone(p)[action.ghostSlot];
   assert(lv1State(p).perk&&c&&!c.used&&!c.switched&&c.lv1MovedTurn!==g.turn,
    'Geistermonster kann die Position nicht mehr ändern.');
   c.mode=c.mode==='atk'?'def':'atk';c.switched=true;
   g.log.push(definition(catalog,c.id).name+' im Geisterslot wechselt auf '+
    c.mode.toUpperCase()+'.');
  }else if(action.type==='lv1UseOffer'||action.type==='lv1Floating'){
   const s=lv1State(p),j=action.slot,i=action.index;
   assert(s.perk&&Number.isInteger(j)&&j>=0&&j<7&&freeTeamSlot(g,p,j)&&
    Number.isInteger(i)&&i>=0,'Freie Lv1-Beschwörung benötigt einen freien Feldplatz.');
   let id,echo=true;
   if(action.type==='lv1UseOffer'){
    id=s.offers[i];assert(Number.isInteger(id),'Kein Schwarm-Echo verfügbar.');
    s.offers.splice(i,1);
   }else{
    id=s.choices[i];assert(Number.isInteger(id),'Keine Floating-Wahl verfügbar.');
    assert(['echo','deck'].includes(action.kind),'Floating-Art ist ungültig.');
    if(action.kind==='deck'){
     const candidates=p.deck.map((id,index)=>({id,index})).filter(x=>
      definition(catalog,x.id)?.level===1&&!definition(catalog,x.id)?.fusionOnly);
     assert(candidates.length>0,'Kein echtes Level-1-Monster mehr im Deck.');
     const pick=candidates[randomInt(g,candidates.length)];
     id=pick.id;p.deck.splice(pick.index,1);echo=false;
    }
    s.choices.splice(i,1);
   }
   const c=instance(g,id,catalog,{ownerSeat:seat});
   if(echo){c.lv1Echo=true;c.lv1Effectless=true;}
   p.field[j]=c;
   if(!echo)lv1Arrival(g,p,c,catalog);
   syncLv1Swarm(p,catalog);
   g.log.push(p.name+' ruft '+(echo?'ein effektloses Echo':'einen echten Wandergeist')+
    ': '+definition(catalog,id).name+'.');
  }else if(action.type==='switch'){
   const c=p.field[action.slot];
   assert(c&&!c.used&&!c.switched&&!(c.essenceAttacks>0),
    'Positionswechsel nicht möglich.');
   c.mode=c.mode==='atk'?'def':'atk';c.switched=true;
   g.log.push(p.name+' ändert die Position von '+definition(catalog,c.id).name+'.');
  }else if(action.type==='essencePredatorMode'){
   const c=p.field[action.slot];
   assert(essenceCompanion(p,c,'predator')&&c.mode==='atk',
    'Nur deine gebundene Predatoren-Essenz kann diese Angriffswahl treffen.');
   assert(Number.isInteger(action.mode)&&[1,2].includes(action.mode)&&
    action.mode!==c.essenceChoice,'Ungültige Angriffswahl.');
   assert(!c.used&&!(c.essenceAttacks>0)&&c.essenceLastToggle!==p.ownTurns,
    'Angriffswahl ist in diesem Zug bereits verbraucht.');
   c.essenceChoice=action.mode;c.essenceLastToggle=p.ownTurns;
   g.log.push(p.name+' wählt für '+definition(catalog,c.id).name+
    (action.mode===2?' zwei Angriffe mit je 70 % Stärke.':' einen Angriff mit 100 % Stärke.'));
  }else if(action.type==='fusion'){
   assert(!p.summoned,'Dieser Zug hat bereits eine Beschwörung.');
   assert(Number.isInteger(action.slot)&&action.slot>=0&&action.slot<7,'Ungültiger Zielfeldplatz.');
   const {rule,cards,analysis:baseAnalysis,templates}=fusionOptions(g,seat,action.materials,catalog,
    {coreIndex:action.coreIndex});
   assert(templates.includes(action.templateId),'Fusionskarte nicht verfügbar oder Stufe zu hoch.');
   const template=definition(catalog,action.templateId);
   const analysis=specialFusionAnalysis(baseAnalysis,cards,template);
   const removingField=new Set(action.materials.filter(m=>m.from==='field').map(m=>m.index));
   const ally=g.players[seat^2];
   const removingAlly=new Set(action.materials.filter(m=>m.from==='allyField').map(m=>m.index));
   assert((!p.field[action.slot]||removingField.has(action.slot))&&
    (!sharedField(g)||!teamMate(g,p)?.field[action.slot]||removingAlly.has(action.slot)),'Fusions-Zielfeld ist nicht frei.');
   // Do not alter state until every constraint is verified.
   const types=cards.map((c,i)=>({...c,from:action.materials[i].from,
    sourceSeat:action.materials[i].from==='allyField'?ally.seat:seat}));
   for(const index of action.materials.filter(m=>m.from==='hand').map(m=>m.index).sort((a,b)=>b-a))
    p.hand.splice(index,1);
   for(const index of removingField)p.field[index]=null;
   for(const index of removingAlly)ally.field[index]=null;
   for(const index of action.materials.filter(m=>m.from==='ghost').map(m=>m.index))
    ghostZone(p)[index]=null;
   const charges=action.materials.filter(m=>m.from==='charge').length;
   lv1State(p).charges-=charges;
   for(const c of types.filter(c=>!c._charge)){
    const owner=c.sourceSeat===seat?p:ally;
    owner.graveyard.push({id:c.id,from:'fusion'});
    if(c.from==='field'||c.from==='allyField'||c.from==='ghost')lv1Leave(g,owner,c,catalog);
   }
   p.remainingFusion.splice(p.remainingFusion.indexOf(action.templateId),1);
   const fieldTypes=types.filter(c=>c.from==='field'||c.from==='allyField');
   const guaranteedSoul=fieldTypes.length>=3&&fieldTypes.every(c=>defensive(c));
   const awakened=analysis.role==='guardian'&&(guaranteedSoul||
    (analysis.soulOdds>0&&randomInt(g,10000)<Math.floor(analysis.soulOdds*10000)));
   const inherited=awakened?'soul':analysis.role,weights=roleWeights(inherited);
   const baseline={atk:referenceStat(template,'atk',p)*weights.atk*analysis.quality,
    def:referenceStat(template,'def',p)*weights.def*analysis.quality};
   let best=null,winnerIndex=-1;
   const trace=[];
   for(let i=0;i<analysis.rolls;i++){
    const roll={atk:round10(baseline.atk*(.88+randomInt(g,25)/100)),
     def:round10(baseline.def*(.88+randomInt(g,25)/100))};
    trace.push(roll);
    if(!best||roll.atk+roll.def>best.atk+best.def){best=roll;winnerIndex=i;}
   }
   const bonus={atk:0,def:0};
   for(let i=0;i<analysis.materialBlocks;i++)
    bonus[randomInt(g,2)?'atk':'def']+=10;
   const result=instance(g,action.templateId,catalog,{fusion:true,roleOverride:inherited,ownerSeat:seat});
   result.atk=Math.max(0,best.atk+bonus.atk);
   result.def=Math.max(0,best.def+bonus.def);
   if(template.lv1Exclusive){
    const extra=template.lv1Special==='hive'?{atk:0,def:100}:
     template.lv1Special==='protector'?{atk:0,def:200}:{atk:120,def:0};
    result.level=1;result.atk+=extra.atk;result.def+=extra.def;
    result.lv1Full={atk:result.atk,def:result.def};
   }
   result.maxDef=result.def;
   result.quality=Math.round(analysis.quality*1000)/1000;
   result.roleOrigin='material';
   result.pattern=analysis.pattern;
   result.qualityRolls=analysis.rolls;
   result.materialBonus=bonus;
   result.rollTrace=trace;
   result.rollMath={base:{atk:round10(baseline.atk),def:round10(baseline.def)},
    winnerIndex,winner:{...best},bonus:{...bonus},role:inherited,roleWeights:weights,
    quality:analysis.quality,resonancePct:analysis.resonancePct,
    pattern:analysis.pattern,coreLevel:rule.core};
   result.fusionCoreLevel=rule.core;
   result.materialsUsed=cards.length;
   result.stompMaterials={};
   for(const card of cards){
    const role=card.role==='allrounder'?'combatant':card.role;
    result.stompMaterials[role]=(result.stompMaterials[role]||0)+1;
   }
   let stompIncrease=0;
   for(let i=0;i<(result.stompMaterials.resonator||0);i++)
    stompIncrease+=2+randomInt(g,3);
   for(let i=0;i<(result.stompMaterials.combatant||0);i++)
    stompIncrease+=1+randomInt(g,2);
   result.stompBonusPP=Math.min(12,stompIncrease);
   result.fusionResonatorLineage={count:rule.resonatorLineage.count,
    used:rule.resonatorLineage.used||rule.resonatorAscent};
   result.soulOdds=analysis.soulOdds;
   result.soulAwakened=awakened;
   const carriedPct=analysis.heritagePct;
   const earnedPct=clamp((analysis.quality-1)*100-carriedPct,0,30);
   result.fusionHeritage={earnedPct:Math.round(earnedPct*100)/100,
    carriedPct:Math.round(carriedPct*100)/100};
   const charged=types.filter(c=>c.from==='field'||c.from==='allyField').reduce((v,c)=>
    v+Math.max(0,Math.min(2000,c.soul||0)),0);
   if(charged){
    const defGain=Math.min(250,Math.floor(charged*.3/10)*10);
    result.def+=defGain;result.maxDef=result.def;
    if(inherited==='soul')result.soul=Math.min(soulCapacity(result),Math.floor(charged*.3));
    result.soulInheritance={energy:charged,defBonus:defGain,carried:result.soul};
   }
   result.used=types.some(c=>c.used===true);
   result.switched=types.some(c=>c.switched===true);
   if(rule.resonatorAscent)result.resonatorAscentUsed=true;
   p.fusionsPerformed=(p.fusionsPerformed||0)+1;
   if(p.team===0&&isQuest(g.chapter)&&template.lv1Special&&
    ['hive','protector','attacker'].includes(template.lv1Special))
    g.questProgress.special++;
   if(analysis.loreChainApplied)p.fusionLoreChainUsed=true;
   imprintPredator(g,p,result,cards.length);
   p.field[action.slot]=result;p.summoned=true;
   syncLv1Swarm(p,catalog);
   g.log.push(p.name+' fusioniert '+cards.length+' eigene Monster zu '+
    definition(catalog,action.templateId).name+' (Lv '+result.level+', Rolle '+
    (roleName[inherited]||inherited)+', '+analysis.pattern+', '+
    analysis.rolls+' Würfelpaare, Qualität '+Math.round((analysis.quality-1)*100)+' %).');
  }else if(action.type==='attack'){
   g.predatorImpact=null;g.stompEvent=null;
   const sourceArea=action.area==='ghost'?'ghost':'field';
   const sourceZone=sourceArea==='ghost'?ghostZone(p):p.field;
   assert(sourceArea!=='ghost'||lv1State(p).perk,'Geisterangriffe sind nicht freigeschaltet.');
   const src=sourceZone[action.slot];
   assert(src&&src.mode==='atk'&&!src.used&&src.placedRound<g.round&&
    !(src.lv1LockedUntil>p.ownTurns),'Angreifer ist nicht bereit.');
   const foes=g.players.filter(x=>x.team!==p.team);
   let enemy=foes.find(x=>x.seat===action.targetSeat);
   // Swarm includes only the active player's own field, capped at five.
   const predators=p.field.filter(x=>x?.role==='predator').length;
   const alpha=predatorLeader(p);
   const swarmPct=alpha?(predatorPower(alpha,'swarm')?.035:.03):.02;
   const developing=src.role==='predator'&&!src.fusion&&!src.predatorToken&&!src.fate&&
    Number.isInteger(src.predatorEvolutionAge);
   const evolution=developing?
    .90+.03*Math.max(0,Math.min(4,src.predatorEvolutionAge||0)):1;
   // Evolution and active-team Swarm bonuses add on the same base ATK.
   let raw=Math.max(0,Math.floor(attackValue(src)*(src.role==='predator'?
    evolution+swarmPct*Math.min(5,predators):1)));
   if(essenceCompanion(p,src,'predator')&&src.essenceChoice===2)
    raw=Math.floor(raw*.7);
   const stompPower=raw,stompBefore={atk:Math.max(0,src.atk),
    def:Math.max(0,src.def)};
   let stompCandidates=[],stompPrimary=null;
   if(action.targetSeat===null){
    assert(foes.every(x=>!hasCards(x)),'Direkter Angriff ist durch Gegnerkarten blockiert.');
    score(g,p.team,raw,p.name+' · direkter Angriff');
   }else{
    assert(enemy&&Number.isInteger(action.targetSlot)&&
     action.targetSlot>=0&&action.targetSlot<7,'Gegnerischer Feldplatz fehlt.');
    let targetSlot=action.targetSlot,targetArea=action.targetArea==='ghost'?'ghost':'field';
    let targetZone=targetArea==='ghost'?ghostZone(enemy):enemy.field;
    let target=targetZone[targetSlot];assert(target,'Ziel ist leer.');
    if(p.team===1){
     const protector=g.players.filter(owner=>owner.team===0)
      .flatMap(owner=>[{owner,area:'field',cards:owner.field},
       {owner,area:'ghost',cards:ghostZone(owner)}])
      .flatMap(x=>x.cards.map((c,slot)=>({...x,c,slot})))
      .find(x=>lv1State(x.owner).perk&&lv1Key(x.c,catalog)==='protector');
     if(protector){enemy=protector.owner;targetSlot=protector.slot;
      targetArea=protector.area;
      targetZone=targetArea==='ghost'?ghostZone(enemy):enemy.field;
      target=targetZone[targetSlot];
      g.log.push('✧ Aegurion zieht den gegnerischen Einzelangriff auf sich.');}
    }
    let taunt=false;
    if(p.team===1&&lv1Key(target,catalog)!=='protector'&&
     g.teams[0].essenceTauntTurn!==g.turn){
     const guard=g.players.filter(owner=>owner.team===0)
      .flatMap(owner=>owner.field.map((c,slot)=>({owner,c,slot})))
      .find(x=>essenceCompanion(x.owner,x.c,'defense')&&
       x.owner.essence.school==='defense'&&x.c.mode==='def'&&!(x.c.guardLeft>0));
     if(guard){enemy=guard.owner;targetSlot=guard.slot;target=guard.c;
      targetArea='field';targetZone=enemy.field;
      taunt=true;g.teams[0].essenceTauntTurn=g.turn;
      g.log.push('✦ Aschenhort lenkt den ersten Gegnerangriff auf sich und halbiert ihn.');}
    }
    if(targetArea==='field'&&stompCount(src)>=3){
     stompCandidates=stompLine(g,p,enemy,targetSlot,stompCount(src));
     stompPrimary={seat:enemy.seat,slot:targetSlot,uid:target.uid};
    }
    const chase=predatorBonus(g,p,src,target);
    if(chase.bonusPct>0)raw=Math.floor(raw*(1+chase.bonusPct));
    const huntedUid=target.uid;
    const lifeInAtk=activeLv1(enemy,target,catalog)&&
     (!!lv1Key(target,catalog)||hasLv1Class(enemy,'protector',catalog));
    if(target.mode==='atk'&&!lifeInAtk){
     const diff=raw-attackValue(target);
     if(diff>=0){enemy.graveyard.push(target);targetZone[targetSlot]=null;
      lv1Leave(g,enemy,target,catalog);}
     if(diff<=0){p.graveyard.push(src);sourceZone[action.slot]=null;
      lv1Leave(g,p,src,catalog);}
     if(diff!==0)score(g,diff>0?p.team:enemy.team,Math.abs(diff),
      p.name+' · ATK-Duell gegen '+enemy.name);
     g.log.push(p.name+' greift '+enemy.name+' in ATK an (Differenz '+diff+').');
    }else{
     combat(target);
     const guarded=target.guardLeft>0;
     const incoming=taunt?Math.floor(raw*.5):raw;
     const armor=bondArmor(g,enemy,target,src,incoming);
     const mitigation=armor.mitigation;
     let remaining=guarded?0:armor.dealt;
     const original=remaining;
     const lv1ShieldLost=Math.min(target.lv1Shield||0,remaining);
     target.lv1Shield=(target.lv1Shield||0)-lv1ShieldLost;
     remaining-=lv1ShieldLost;
     const condensedLost=Math.min(target.condensed,remaining);
     target.condensed-=condensedLost;remaining-=condensedLost;
     const soulLost=Math.min(target.soul,remaining);
     target.soul-=soulLost;remaining-=soulLost;
     const defLost=Math.min(target.def,remaining);
     target.def-=defLost;
     if(soulLost)score(g,enemy.team,Math.floor(soulLost*.5),
      definition(catalog,target.id).name+' · erzwungener Seelenverlust');
     removeIfEmpty(g,enemy,targetSlot,catalog,targetArea);
     if(!guarded)awardBond(g,enemy,armor);
     // Same 35%-ATK survivor-only defender rule as the solo combat core.
     // A killed or fully immune defender cannot retaliate.
     if(target.mode==='def'&&defensive(target)&&!guarded&&
        targetZone[targetSlot]===target&&target.def>0)
      score(g,enemy.team,Math.floor(attackValue(target)*.35),
      definition(catalog,target.id).name+' · Gegenschlag');
     g.log.push(p.name+' greift '+enemy.name+' in DEF an: '+original+
      ' Trefferstärke, −'+condensedLost+' Verdichtung / −'+soulLost+
      ' Seele / −'+defLost+' Grund-DEF'+(lv1ShieldLost?' / −'+lv1ShieldLost+' Schutzorb':'')+
      ' ('+Math.round(mitigation*100)+' % Rüstung)'+
      (guarded?' · Letztes Bollwerk immun.':'')+'.');
    }
    if(src.role==='predator'){
     const survived=targetZone.some(c=>c?.uid===huntedUid);
     const mark=g.predatorPursuit;
     if(mark&&mark.turn===g.turn&&mark.ownerSeat===seat&&
       mark.targetUid===huntedUid){
      if(!mark.attackers.includes(src.uid))mark.attackers.push(src.uid);
     }else g.predatorPursuit={turn:g.turn,ownerSeat:seat,targetSeat:enemy.seat,
      targetUid:huntedUid,attackers:[src.uid]};
     g.predatorImpact={revision:g.revision+1,ownerSeat:seat,attackerUid:src.uid,
      targetSeat:enemy.seat,targetSlot,targetArea,targetUid:huntedUid,
      followups:chase.followups,bonusPct:chase.bonusPct,broken:!survived};
     if(chase.followups)g.log.push('🐾 Blutspur · Folgeangriff '+chase.followups+
      ' · +'+Math.round(chase.bonusPct*100)+' % Schaden'+
      (!survived?' · Klauen-Finisher!':'.'));
     if(!survived)g.predatorPursuit=null;
    }
   }
   const stompHits=[];
   if(stompPrimary&&stompCandidates.length){
    const patterns=STOMP_PERCENTS[stompCount(src)],bonus=stompBonus(src);
    for(let i=0;i<stompCandidates.length;i++){
     const hit=stompSecondary(g,p,src,stompCandidates[i],stompPower,
      patterns[i]+bonus,catalog);
     if(hit)stompHits.push(hit);
    }
   }
   if(sourceZone[action.slot]){
    if(essenceCompanion(p,src,'predator')){
     src.essenceAttacks=(src.essenceAttacks||0)+1;
     src.used=src.essenceChoice!==2||src.essenceAttacks>=2;
    }else if(lv1State(p).perk&&lv1Key(src,catalog)==='attacker'){
     src.lv1Attacks=(src.lv1Attacks||0)+1;
     src.used=src.lv1Attacks>=2;
     if(src.lv1Attacks<=2&&p.field.includes(src)&&p.field.some((c,i)=>freeTeamSlot(g,p,i))&&
      lv1State(p).offers.length<5){
      const id=lv1Troops(p).find(c=>genuineLv1(c,catalog))?.id;
      if(Number.isInteger(id))lv1State(p).offers.push(id);
     }
    }else src.used=true;
    const fatigue=stompFatigue(stompBefore.atk,stompBefore.def,1+stompHits.length);
    src.atk=Math.max(0,src.atk-fatigue.atk);
    src.def=Math.max(0,src.def-fatigue.def);
    src.stompDecayTotal=(src.stompDecayTotal||0)+fatigue.def;
    g.log.push(definition(catalog,src.id).name+' · Magieverschleiß ('+
     (1+stompHits.length)+' Ziel(e)): −'+fatigue.atk+' ATK / −'+fatigue.def+' DEF.');
   }
   if(stompPrimary){
    const source=definition(catalog,src.id);
    g.stompEvent={revision:g.revision+1,sourceSeat:seat,sourceSlot:action.slot,
     sourceUid:src.uid,primary:stompPrimary,materials:stompCount(src),
     bonusPP:stompBonus(src),element:source.element||src.element||'LICHT',
     hits:stompHits};
   }
  }else if(['soulCondense','soulDischarge','soulRaid','soulFocus'].includes(action.type)){
   soulAction(g,p,action,catalog);
  }else if(action.type==='end'){
   endOwnerTurn(g,p,catalog);
   if(p.team===1)for(const ally of g.players.filter(x=>x.team===0))
    for(const c of ally.field.filter(Boolean))if(c.guardLeft>0&&c.guardGrantedTurn!==g.turn)
     c.guardLeft--;
   if(g.status==='active'&&seat===3)settleArena(g);
   if(g.status==='active')moveOn(g,catalog);
  }else fail('Unbekannte Aktion.');
  removePredatorTokenGraves(g);
  g.revision++;return g;
 }
 // v18.6 research-inspired, actual-rule-checked SOLO-STYLE AI for BOTH 2v2 NPCs.
 // Decision features look at PUBLIC opponent fields and the current NPC's
 // own hand, field and fusion stock. All final actions run through apply().
 const AI186=Object.freeze({version:'18.6-duo-live.1',firstActions:24,replyActions:6});
 function npcCardPower(c){return Math.max(0,c?.atk||0)*.7+Math.max(0,c?.def||0)*.45;}
 function npcRole(card,catalog){
  return card?.role||definition(catalog,Number.isInteger(card)?card:card?.id)?.role||'combatant';
 }
 function npcPublicCopy(g,seat){
  const s=copy(g);
  // Never read the human opponents' private cards, future draws or build.
  for(const p of s.players)if(p.team!==s.players[seat].team){
   p.hand=[];p.deck=[];p.originalDeck=[];p.baseDeck=[];
   p.fusionDeck=[];p.remainingFusion=[];p.baseFusions=[];
   p.enhancements={};
  }
  // No future-dice oracle: hypothetical RNG is independent of live rngSeed.
  s.rngSeed=0x1860a11;
  return s;
 }
 function npcVisible(g,seat){
  const p=g.players[seat],ours=g.players.filter(x=>x.team===p.team),
   foes=g.players.filter(x=>x.team!==p.team);
  const cards=group=>group.flatMap(x=>x.field.filter(Boolean));
  const ownCards=cards(ours),enemyCards=cards(foes);
  return {ownLP:g.teams[p.team].lp,enemyLP:g.teams[1-p.team].lp,
   ownShield:g.teams[p.team].shield||0,enemyShield:g.teams[1-p.team].shield||0,
   ownCount:ownCards.length,enemyCount:enemyCards.length,
   ownPower:ownCards.reduce((v,c)=>v+npcCardPower(c),0),
   enemyPower:enemyCards.reduce((v,c)=>v+npcCardPower(c),0),
   soul:ownCards.reduce((v,c)=>v+(c.soul||0)+(c.condensed||0)*.5,0),
   bond:sharedField(g)?soulBonds(ours[0],g).length:ours.reduce((v,owner)=>v+soulBonds(owner).length,0),
   status:g.status,winner:g.winner};
 }
 function npcDelta(a,b,seat){
  if(b.status==='finished')return b.winner===1?1000000:-1000000;
  return (a.enemyLP-b.enemyLP)*.45-(a.ownLP-b.ownLP)*.9+
   (a.enemyShield-b.enemyShield)*.25-(a.ownShield-b.ownShield)*.3+
   (a.enemyCount-b.enemyCount)*210-(a.ownCount-b.ownCount)*610+
   (a.enemyPower-b.enemyPower)*.3+(b.ownPower-a.ownPower)*.16+
   (b.soul-a.soul)*.16+(b.bond-a.bond)*145;
 }
 function npcTrial(state,seat,action,catalog,before){
  try{
   const next=apply(npcPublicCopy(state,seat),seat,action,{catalog});
   return {action,next,score:npcDelta(before,npcVisible(next,seat),seat)};
  }catch(_){return null;} // a failed legality check is not an AI action
 }
 function npcTargetList(g,seat){
  const p=g.players[seat],foes=g.players.filter(x=>x.team!==p.team),targets=[];
  for(const enemy of foes){
   for(let i=0;i<enemy.field.length;i++)if(enemy.field[i])
    targets.push({targetSeat:enemy.seat,targetSlot:i,targetArea:'field',
     strength:npcCardPower(enemy.field[i])});
   for(let i=0;i<ghostZone(enemy).length;i++)if(ghostZone(enemy)[i])
    targets.push({targetSeat:enemy.seat,targetSlot:i,targetArea:'ghost',
     strength:npcCardPower(ghostZone(enemy)[i])});
  }
  return targets.sort((a,b)=>b.strength-a.strength||a.targetSeat-b.targetSeat||a.targetSlot-b.targetSlot);
 }
 function npcAttackOptions(g,seat){
  const p=g.players[seat],targets=npcTargetList(g,seat),out=[];
  for(let slot=0;slot<p.field.length;slot++){
   const c=p.field[slot];
   if(!c||c.mode!=='atk'||c.used||c.placedRound>=g.round||
      (c.lv1LockedUntil>p.ownTurns))continue;
   if(!targets.length)out.push({type:'attack',slot,targetSeat:null,targetSlot:null});
   else{
    // Include both the strongest threat and the weakest breakable target.
    const ordered=[...targets.slice(0,3),...targets.slice(-3)];
    const visited=new Set();
    for(const t of ordered){
     const key=t.targetSeat+':'+t.targetSlot+':'+t.targetArea;
     if(visited.has(key))continue;visited.add(key);
     out.push({type:'attack',slot,targetSeat:t.targetSeat,
      targetSlot:t.targetSlot,targetArea:t.targetArea});
    }
   }
  }
  return out;
 }
 function npcSoulOptions(g,seat){
  const p=g.players[seat],targets=npcTargetList(g,seat),out=[];
  for(let slot=0;slot<p.field.length;slot++){
   const c=p.field[slot];
   if(!c||c.role!=='soul'||c.mode!=='def'||c.lastSoulAction===p.ownTurns)continue;
   if(c.soul>=40){
    out.push({type:'soulDischarge',slot});
    if(c.soulCooldown===0)out.push({type:'soulCondense',slot});
   }
   if(c.raidCooldown===0)for(const t of targets.filter(x=>x.targetArea==='field').slice(0,3))
    out.push({type:'soulRaid',slot,targetSeat:t.targetSeat,targetSlot:t.targetSlot});
  }
  return out;
 }
 function npcTacticalChoice(g,seat,catalog){
  const before=npcVisible(g,seat),moves=[...npcSoulOptions(g,seat),...npcAttackOptions(g,seat)];
  let trials=[],count=0;
  for(const action of moves){
   if(count++>=AI186.firstActions)break;
   const result=npcTrial(g,seat,action,catalog,before);
   if(result)trials.push(result);
  }
  trials.sort((a,b)=>b.score-a.score);
  // Same-turn 2-ply preview, only when visibly near a game-ending attack.
  if(g.teams[0].lp<=2500&&trials.length>1){
   for(const x of trials.slice(0,3)){
    if(x.score>=1000000||x.next.status!=='active')continue;
    let best=0,checked=0;
    for(const second of npcAttackOptions(x.next,seat)){
     if(checked++>=AI186.replyActions)break;
     const y=npcTrial(x.next,seat,second,catalog,before);
     if(y)best=Math.max(best,y.score);
    }
    x.score+=best*.33;
   }
   trials.sort((a,b)=>b.score-a.score);
  }
  const first=trials[0];
  if(!first)return null;
  // A legal meaningful action; do not sacrifice a defender for negligible gain.
  if(first.score<-80&&first.action.type==='attack')return null;
  return first.action;
 }
 function npcPlacementSlot(p,role,g){
  const field=teamField(g,p),free=field.flatMap((c,i)=>c?[]:[i]);
  if(!free.length)return -1;
  const opposite=role==='guardian'?'soul':role==='soul'?'guardian':null;
  const linked=opposite===null?[]:free.filter(i=>
   [field[i-1],field[i+1]].some(x=>x?.role===opposite));
  return (linked.length?linked:free).sort((a,b)=>Math.abs(a-3)-Math.abs(b-3)||a-b)[0];
 }
 function npcSummonChoice(g,seat,catalog){
  const p=g.players[seat];if(p.summoned)return null;
  // The Fanatiker's sealed Lumira is a story-required opening action.
  // Its identity is fixed by fanaticOpening(), not a strength heuristic.
  if(isQuest(g.chapter)&&g.chapter<=14&&seat===1){
   const sealed=p.hand.findIndex(item=>(Number.isInteger(item)?item:item?.id)===714);
   const free=p.field.findIndex((c,i)=>freeTeamSlot(g,p,i));
   if(sealed>=0&&free>=0)return {type:'summon',handIndex:sealed,slot:free};
  }
  const hand=p.hand.map((item,i)=>({item,i,id:Number.isInteger(item)?item:item?.id}))
   .filter(x=>definition(catalog,x.id)&&!definition(catalog,x.id).fusionOnly);
  const normal=hand.filter(x=>allowed(catalog,x.id)||x.item?.fate);
  const options=[];
  for(const h of normal){
   const card=definition(catalog,h.id),role=npcRole(h.item,catalog);
   const free=npcPlacementSlot(p,role,g);
   const weight=npcCardPower(card)*(p.opponentPower||1);
   if(free>=0){
    const mate=role==='guardian'?'soul':role==='soul'?'guardian':null;
    const adjacent=mate&&[teamField(g,p)[free-1],teamField(g,p)[free+1]].some(c=>c?.role===mate);
    options.push({action:{type:'summon',handIndex:h.i,slot:free},
     score:weight+(adjacent?400:0)+(h.item?.fate?250:0)});
   }else{
    const weakest=p.field.map((c,i)=>({c,i})).filter(x=>x.c&&!x.c.fate&&!x.c.predatorToken)
     .sort((a,b)=>npcCardPower(a.c)-npcCardPower(b.c))[0];
    if(weakest&&weight>npcCardPower(weakest.c)*1.35)
     options.push({action:{type:'replace',handIndex:h.i,slot:weakest.i},
      score:weight-npcCardPower(weakest.c)*1.18});
   }
  }
  // Predict fusions with the canonical live-rule preview, never with future RNG.
  // Prioritize same-hand pairs and a hand/field follow-up for full boards.
  const ordered=hand.filter(h=>!h.item?.fate&&
   !definition(catalog,h.id)?.ace)
   .sort((a,b)=>definition(catalog,b.id).level-definition(catalog,a.id).level);
  const groups=[];
  for(let i=0;i<Math.min(4,ordered.length);i++)
   for(let j=i+1;j<Math.min(5,ordered.length);j++)
    groups.push([{from:'hand',index:ordered[i].i},{from:'hand',index:ordered[j].i}]);
  for(const h of ordered.slice(0,3))for(let i=0;i<p.field.length;i++)
   if(p.field[i]&&!p.field[i].fate&&!p.field[i].predatorToken)
    groups.push([{from:'hand',index:h.i},{from:'field',index:i}]);
  const ally=g.players[seat^2];
  for(const h of ordered.slice(0,3))for(let i=0;i<ally.field.length;i++)
   if(ally.field[i]&&!ally.field[i].fate&&!ally.field[i].predatorToken)
    groups.push([{from:'hand',index:h.i},{from:'allyField',index:i}]);
  for(const material of groups){
   let data;
   try{data=fusionOptions(g,seat,material,catalog);}catch(_){continue;}
   if(!data.templates.length)continue;
   const removing=material.filter(m=>m.from==='field'||m.from==='allyField').map(m=>m.index);
   const free=p.field.findIndex((c,i)=>freeTeamSlot(g,p,i)||removing.includes(i));
   if(free<0)continue;
   for(const templateId of data.templates.slice(0,8)){
    let preview;try{preview=fusionPreview(g,seat,material,catalog,{templateId});}catch(_){continue;}
    const avg={atk:(preview.atk[0]+preview.atk[1])/2,def:(preview.def[0]+preview.def[1])/2};
    const spent=material.reduce((v,m)=>{
     const source=m.from==='hand'?definition(catalog,Number.isInteger(p.hand[m.index])?
      p.hand[m.index]:p.hand[m.index]?.id):m.from==='allyField'?ally.field[m.index]:p.field[m.index];
     return v+npcCardPower(source)*(m.from==='hand'?.27:.85);
    },0);
    // Fusions should beat a routine summon by genuine expected value,
    // never by granting unearned cards/stats.
    const score=npcCardPower(avg)*1.07-spent+
     (preview.analysis?.pattern!=='Freie Fusion'?120:0);
    options.push({action:{type:'fusion',materials:material,slot:free,templateId},
     score});
   }
  }
  options.sort((a,b)=>b.score-a.score);
  return options[0]?.action||null;
 }
 function npcDefenseSwitch(g,seat){
  const p=g.players[seat];
  for(let i=0;i<p.field.length;i++){
   const c=p.field[i];
   if(!c||c.mode!=='atk'||c.used||c.switched||c.essenceAttacks>0)continue;
   if((c.role==='guardian'||c.role==='soul')&&
    (c.def>c.atk*.9||c.role==='soul')){
    return {type:'switch',slot:i};
   }
  }
  return null;
 }
 function aiTurn(old,{catalog}){
  let g=old,actors=0;
  while(g.status==='active'&&[1,3].includes(g.activeSeat)&&actors++<2){
   const seat=g.activeSeat,p=g.players[seat];
   const summon=npcSummonChoice(g,seat,catalog);
   if(summon)g=apply(g,seat,summon,{catalog});
   // Live Solo-style positioning first, then tactically chosen attacks and
   // supported Soul skills; every action is run through the same reducer.
   const switches=new Set();
   for(let i=0;i<7;i++){
    const action=npcDefenseSwitch(g,seat);
    if(!action||switches.has(action.slot))break;
    g=apply(g,seat,action,{catalog});switches.add(action.slot);
   }
   let steps=0;
   while(g.status==='active'&&g.activeSeat===seat&&steps++<18){
    const action=npcTacticalChoice(g,seat,catalog);
    if(!action)break;
    g=apply(g,seat,action,{catalog});
   }
   if(g.status==='active'&&g.activeSeat===seat)
    g=apply(g,seat,{type:'end'},{catalog});
  }
  return g;
 }

 function view(g,seat){
  const v=copy(g);
  v.supportsSurrender=true; // Advertised by the deployed server, not the browser.
  delete v.uid;delete v.rngSeed; // Never disclose upcoming server-side dice.
  // A Fate event names the cards newly drawn into its owner's private hand.
  // Other clients may see the event, but must not receive those card IDs.
  if(v.fateEvent&&v.fateEvent.ownerSeat!==seat)delete v.fateEvent.cardIds;
  for(const p of v.players){
   delete p.baseDeck;delete p.baseFusions;
   p.deck=Array(p.deck.length).fill(null);
   if(p.seat!==seat)p.hand=Array(p.hand.length).fill(null);
   if(p.seat!==seat){p.fusionDeck=Array(p.fusionDeck.length).fill(null);
    p.remainingFusion=Array(p.remainingFusion.length).fill(null);}
  }
  return v;
 }
 return Object.freeze({version:'20.2-beta',aiPolicy:AI186.version,CHAPTERS,QUESTS,ENCOUNTERS,seats,allowed,validDeck,loanBuild,
  validNpcFusionDeck,soloStartingLp,duoStartingLp,packIds,
  chapterDeck,create,apply,aiTurn,view,attackValue,fusionLevel,fusionPattern,fusionOptions,
  fusionAnalysis,fusionPreview,fusionRole,arenaDamage,fatePressure,PERK_LIMITS,normalizedBuild,
  sharedField,teamField,freeTeamSlot,stompCount,stompBonus,stompFatigue,stompLine,soulBonds,bondArmor});
});
