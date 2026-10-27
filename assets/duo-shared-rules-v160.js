/* Arcane Duel 2v2 · server-authoritative ruleset v16.6 beta.
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
 const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
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
 const seats=[{seat:0,team:0,kind:'human'},{seat:1,team:1,kind:'ai'},
  {seat:2,team:0,kind:'human'},{seat:3,team:1,kind:'ai'}];
 const packIds=(catalog,chapter)=>{
  const level=CHAPTERS.find(x=>x.id===chapter)?.level||2;
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
 function draw(p,n=5){while(p.hand.length<n&&p.deck.length)p.hand.push(p.deck.shift());}
 function create({roomId,hostName,hostDeck,hostFusions,enemyDeckA,enemyDeckB,
    enemyFusionsA,enemyFusionsB,chapter=1,entry='new',catalog,randomSeed,
    hostUpgrades={},hostEnhancements={},hostEssence={},hostLv1={}}){
  assert(typeof roomId==='string'&&roomId.length>=6,'Raumkennung fehlt.');
  assert(CHAPTERS.some(c=>c.id===chapter),'Ungültiges Kapitel.');
  assert(['new','chapter'].includes(entry),'Ungültiger Einstieg.');
  assert(entry!=='new'||chapter===1,'Neue Kampagne beginnt mit Kapitel I.');
  for(const d of [hostDeck,enemyDeckA,enemyDeckB])
   assert(validDeck(d,catalog),'Hauptdeck muss aus 40 gültigen Einzelspieler-Karten bestehen (maximal 3 Kopien).');
  for(const f of [hostFusions,enemyFusionsA,enemyFusionsB])
   assert(validDeck(f,catalog,true),'Fusionsdeck muss aus 2–15 freigeschalteten Fusionen bestehen (maximal 3 Kopien).');
  const hostBuild=normalizedBuild(hostUpgrades,hostEnhancements,hostDeck,hostFusions,
   catalog,hostEssence,hostLv1);
  const g={schema:2,mode:'duo-campaign',ruleset:'duo-v166',roomId,chapter,entry,
   status:'waiting',revision:0,activeSeat:0,turn:0,round:1,uid:1,
   rngSeed:Number.isSafeInteger(randomSeed)&&randomSeed>=1&&randomSeed<=0xffffffff?
    randomSeed:roomSeed(roomId), // deterministic Node QA; Edge injects secret crypto seed
   teams:[{lp:16000,maxLp:16000,shield:maxAegis(hostBuild),
    essenceTauntTurn:-1,essenceBastionUsed:false},
    {lp:16000,maxLp:16000,shield:0}],
   players:[player(0,safeName(hostName),chapterDeck(hostDeck,catalog,chapter,entry),hostFusions,hostBuild),
    player(1,'Gegner A',enemyDeckA,enemyFusionsA),
    player(2,'Partner (ausstehend)'),player(3,'Gegner B',enemyDeckB,enemyFusionsB)],
   winner:null,fateEvent:null,arenaEvent:null,
   log:['Raum erstellt. Der Partner wird erwartet.']};
  // Tiebreak initiative is chosen once, never supplied by a browser client.
  g.tiePriority=randomInt(g,2);
  return g;
 }
 function instance(g,id,catalog,{fusion=false,roleOverride=null,quality=1,
  ownerSeat=null,fate=null}={}){
  const c=definition(catalog,id);
  assert(c&&(c.playable||(fate&&c.fateTemplate)),
   'Karte existiert nicht im aktuellen Singleplayer-Katalog.');
  const p=Number.isInteger(ownerSeat)?g.players[ownerSeat]:null;
  let atk=fate?fate.atk:Math.max(0,round10((c.atk+statBonus(c,'atk',p))*quality));
  let def=fate?fate.def:Math.max(0,round10((c.def+statBonus(c,'def',p))*quality));
  const companion=!fate&&!!c.essenceMonster&&p?.essence?.chosen===id;
  const level=companion?essenceLevel(p.essence.tier):c.level;
  if(companion){atk=Math.min(10000,atk+level*45+p.essence.rank*35);
   def=Math.min(10000,def+level*70+p.essence.rank*55);}
  if(!fate&&p?.lv1?.perk&&c.level===1&&!c.fusionOnly&&!c.ace&&!c.essenceMonster){
   atk=Math.min(10000,atk+p.lv1.rank*5);def=Math.min(10000,def+p.lv1.rank*5);
  }
  // Lumira is an exact-stat story ACE, including outside the research build.
  if(c.lv1Special==='ace'){atk=111;def=111;}
  return {uid:g.uid++,id,level,atk,def,fate:!!fate,role:roleOverride||c.role||'combatant',
   fusion,mode:'atk',used:false,switched:false,placedRound:g.round,
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
  const slot=p.field.findIndex(c=>!c);
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
 const attackValue=c=>Math.min(10000,Math.max(0,Number(c?.atk)||0)+
  (c?.role==='soul'?Math.floor(Math.max(0,Number(c.condensed)||0)*.5):0));
 function win(g,team,reason){
  g.status='finished';g.winner=team;g.log.push(reason);
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
  Math.min(g.teams[0].maxLp,Math.floor(200*g.teams[0].maxLp/10000)*2**(round-10));
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
 function materialSelection(p,materials){
  assert(Array.isArray(materials)&&materials.length>=2&&materials.length<=5,
   'Fusion benötigt zwei bis fünf eigene Materialien.');
  const keys=new Set(),cards=[];
  for(const m of materials){
   assert(m&&['hand','field','ghost','charge'].includes(m.from)&&
    Number.isInteger(m.index)&&m.index>=0,
    'Ungültiges Fusionsmaterial.');
   const key=m.from+':'+m.index;assert(!keys.has(key),'Material doppelt ausgewählt.');keys.add(key);
   assert((m.from!=='ghost'&&m.from!=='charge')||lv1State(p).perk,
    'Geistermaterial benötigt die Verbotene Forschung.');
   const card=m.from==='hand'?p.hand[m.index]:m.from==='field'?p.field[m.index]:
    m.from==='ghost'?ghostZone(p)[m.index]:m.index<lv1State(p).charges?
     {_charge:true,id:-1,level:2,role:'combatant',fusion:false}:null;
   assert(card!==null&&card!==undefined,'Fusionsmaterial ist nicht vorhanden.');
   assert(!card.fate,'Schicksalsmonster sind nicht fusionierbar.');
   assert(!card.predatorToken,'Rudelruf-Tokens sind niemals Fusionsmaterial.');
   cards.push(m.from==='hand'?{id:card,level:0,...{_hand:true}}:card);
  }
  return cards;
 }
 function fusionOptions(g,seat,materials,catalog,{coreIndex}={}){
  const p=g.players[seat];
  const cards=materialSelection(p,materials).map(c=>c._charge?{
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
 function apply(old,seat,action,{catalog}){
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
    chapterDeck(action.deck,catalog,g.chapter,g.entry),action.fusions,build);
   g.players[2]=partner;g.status='active';
   g.teams[0].shield=teamAegis(g);
   for(const pl of g.players)draw(pl);
   g.log.push(partner.name+' ist beigetreten. 2v2 beginnt.');
   g.revision++;return g;
  }
  if(action.type==='nextChapter'){
   assert(seat===0&&g.status==='finished'&&g.winner===0&&g.chapter<4,
    'Nur der Gastgeber kann das nächste freigeschaltete Kapitel starten.');
   g.chapter++;g.status='active';g.winner=null;g.round=1;g.turn=0;g.activeSeat=0;
   g.fateEvent=null;g.arenaEvent=null;g.predatorPursuit=null;g.predatorImpact=null;
   g.teams.forEach(t=>t.lp=t.maxLp);
   g.teams[0].shield=teamAegis(g);g.teams[1].shield=0;
   g.teams[0].essenceTauntTurn=-1;g.teams[0].essenceBastionUsed=false;
   for(const pl of g.players){
    pl.deck=chapterDeck(pl.baseDeck,catalog,g.chapter,'chapter');
    pl.fusionDeck=[...pl.baseFusions];pl.remainingFusion=[...pl.baseFusions];
    pl.hand=[];pl.field=Array(7).fill(null);pl.graveyard=[];
    pl.summoned=false;pl.ownTurns=0;pl.fusionsPerformed=0;pl.fateUsed=false;
    pl.fusionLoreChainUsed=false;draw(pl);
    const saved=lv1State(pl);
    saved.ghostSlots=[];saved.charges=0;saved.choices=[];saved.offers=[];
    saved.floatUsed=0;saved.swarmUsed=0;
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
   const handCard=p.hand[action.handIndex];
   const id=Number.isInteger(handCard)?handCard:handCard?.id;
   const fate=handCard?.fate===true?handCard:null;
   assert(allowed(catalog,id)||fate&&definition(catalog,id)?.fateTemplate,
    'Karte ist nicht regulär beschwörbar.');
   p.hand.splice(action.handIndex,1);
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
   assert(s.perk&&Number.isInteger(j)&&j>=0&&j<7&&!p.field[j]&&
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
   assert(s.perk&&Number.isInteger(j)&&j>=0&&j<7&&!p.field[j]&&
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
   assert(!p.field[action.slot]||removingField.has(action.slot),'Fusions-Zielfeld ist nicht frei.');
   // Do not alter state until every constraint is verified.
   const types=cards.map((c,i)=>({...c,from:action.materials[i].from}));
   for(const index of action.materials.filter(m=>m.from==='hand').map(m=>m.index).sort((a,b)=>b-a))
    p.hand.splice(index,1);
   for(const index of removingField)p.field[index]=null;
   for(const index of action.materials.filter(m=>m.from==='ghost').map(m=>m.index))
    ghostZone(p)[index]=null;
   const charges=action.materials.filter(m=>m.from==='charge').length;
   lv1State(p).charges-=charges;
   p.graveyard.push(...types.filter(c=>!c._charge).map(c=>({id:c.id,from:'fusion'})));
   for(const c of types.filter(c=>(c.from==='field'||c.from==='ghost')&&!c._charge))
    lv1Leave(g,p,c,catalog);
   p.remainingFusion.splice(p.remainingFusion.indexOf(action.templateId),1);
   const guaranteedSoul=types.filter(c=>c.from==='field').length>=3&&
    types.filter(c=>c.from==='field').every(c=>defensive(c));
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
   const result=instance(g,action.templateId,catalog,{fusion:true,roleOverride:inherited});
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
   result.fusionResonatorLineage={count:rule.resonatorLineage.count,
    used:rule.resonatorLineage.used||rule.resonatorAscent};
   result.soulOdds=analysis.soulOdds;
   result.soulAwakened=awakened;
   const carriedPct=analysis.heritagePct;
   const earnedPct=clamp((analysis.quality-1)*100-carriedPct,0,30);
   result.fusionHeritage={earnedPct:Math.round(earnedPct*100)/100,
    carriedPct:Math.round(carriedPct*100)/100};
   const charged=types.filter(c=>c.from==='field').reduce((v,c)=>
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
   if(analysis.loreChainApplied)p.fusionLoreChainUsed=true;
   imprintPredator(g,p,result,cards.length);
   p.field[action.slot]=result;p.summoned=true;
   syncLv1Swarm(p,catalog);
   g.log.push(p.name+' fusioniert '+cards.length+' eigene Monster zu '+
    definition(catalog,action.templateId).name+' (Lv '+result.level+', Rolle '+
    (roleName[inherited]||inherited)+', '+analysis.pattern+', '+
    analysis.rolls+' Würfelpaare, Qualität '+Math.round((analysis.quality-1)*100)+' %).');
  }else if(action.type==='attack'){
   g.predatorImpact=null;
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
   let raw=Math.max(0,Math.floor(attackValue(src)*(src.role==='predator'?
    1+swarmPct*Math.min(5,predators):1)));
   if(essenceCompanion(p,src,'predator')&&src.essenceChoice===2)
    raw=Math.floor(raw*.7);
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
     const mitigation=target.mode==='def'&&defensive(target)?
      (src.role==='predator'?.25:.35):0;
     let remaining=guarded?0:Math.max(0,
      Math.floor((taunt?Math.floor(raw*.5):raw)*(1-mitigation)));
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
     if(target.mode==='def'&&defensive(target)&&!guarded)
      score(g,enemy.team,Math.floor(attackValue(target)*.5),
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
   if(sourceZone[action.slot]){
    if(essenceCompanion(p,src,'predator')){
     src.essenceAttacks=(src.essenceAttacks||0)+1;
     src.used=src.essenceChoice!==2||src.essenceAttacks>=2;
    }else if(lv1State(p).perk&&lv1Key(src,catalog)==='attacker'){
     src.lv1Attacks=(src.lv1Attacks||0)+1;
     src.used=src.lv1Attacks>=2;
     if(src.lv1Attacks<=2&&p.field.includes(src)&&p.field.some(c=>!c)&&
      lv1State(p).offers.length<5){
      const id=lv1Troops(p).find(c=>genuineLv1(c,catalog))?.id;
      if(Number.isInteger(id))lv1State(p).offers.push(id);
     }
    }else src.used=true;
    let fatigue=30-2*perk(p,'combatDiscipline');
    if(activeLv1(p,src,catalog)&&hasLv1Class(p,'attacker',catalog))
     fatigue=Math.floor(fatigue*.5);
    src.atk=Math.max(0,src.atk-fatigue);
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
 function aiTurn(old,{catalog}){
  let g=old,n=0;
  while(g.status==='active'&&[1,3].includes(g.activeSeat)&&n++<2){
   const seat=g.activeSeat,p=g.players[seat],free=p.field.findIndex(x=>!x);
   if(!p.summoned&&free>=0&&p.hand.length){
    const ix=p.hand.findIndex(item=>allowed(catalog,Number.isInteger(item)?item:item?.id)||
     item?.fate===true&&definition(catalog,item.id)?.fateTemplate);
    if(ix>=0)g=apply(g,seat,{type:'summon',handIndex:ix,slot:free},{catalog});
   }
   const active=g.players[seat],foes=g.players.filter(x=>x.team!==active.team);
   const attackers=active.field.map((c,i)=>({c,i})).filter(x=>x.c&&x.c.mode==='atk'&&!x.c.used&&x.c.placedRound<g.round);
   for(const attacker of attackers){
    const goal=g.players.filter(x=>x.team!==active.team)
     .flatMap(x=>[{cards:x.field,area:'field'},
      {cards:ghostZone(x),area:'ghost'}].flatMap(zone=>
      zone.cards.map((c,i)=>c?{seat:x.seat,slot:i,area:zone.area,card:c}:null)
       .filter(Boolean)))
     .sort((a,b)=>Math.max(attackValue(a.card),a.card.def)-
      Math.max(attackValue(b.card),b.card.def))[0];
    g=apply(g,seat,{type:'attack',slot:attacker.i,targetSeat:goal?.seat??null,
     targetSlot:goal?.slot??null,targetArea:goal?.area??null},{catalog});
    if(g.status!=='active')break;
   }
   if(g.status==='active')g=apply(g,seat,{type:'end'},{catalog});
  }
  return g;
 }
 function view(g,seat){
  const v=copy(g);
  delete v.uid;delete v.rngSeed; // Never disclose upcoming server-side dice.
  for(const p of v.players){
   delete p.baseDeck;delete p.baseFusions;
   p.deck=Array(p.deck.length).fill(null);
   if(p.seat!==seat)p.hand=Array(p.hand.length).fill(null);
   if(p.seat!==seat){p.fusionDeck=Array(p.fusionDeck.length).fill(null);
    p.remainingFusion=Array(p.remainingFusion.length).fill(null);}
  }
  return v;
 }
 return Object.freeze({version:'16.6-beta',CHAPTERS,seats,allowed,validDeck,packIds,
  chapterDeck,create,apply,aiTurn,view,attackValue,fusionLevel,fusionPattern,fusionOptions,
  fusionAnalysis,fusionPreview,fusionRole,arenaDamage,fatePressure,PERK_LIMITS,normalizedBuild});
});
