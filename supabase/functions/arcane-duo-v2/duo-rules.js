/* Arcane Duel 2v2 · server-authoritative ruleset v16.4 beta.
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
 function normalizedBuild(upgrades={},enhancements={},deck=[],fusions=[],catalog={},essence={}){
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
  return {upgrades:u,enhancements:e,essence:{chosen,school,tier,rank,
   type:chosen===null?null:definition(catalog,chosen).essenceSchool}};
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
 const chapterDeck=(ids,catalog,chapter)=>[...packIds(catalog,chapter),...ids.slice(3)];
 function player(seat,name,deck=[],fusions=[],build={upgrades:{},enhancements:{}}){
  return {...seats[seat],name,baseDeck:[...deck],baseFusions:[...fusions],
   deck:[...deck],fusionDeck:[...fusions],remainingFusion:[...fusions],
   upgrades:build.upgrades,enhancements:build.enhancements,
   essence:build.essence||{chosen:null,school:null,tier:0,rank:0,type:null},
   fusionsPerformed:0,fusionLoreChainUsed:false,hand:[],
   field:Array(7).fill(null),graveyard:[],summoned:false,ownTurns:0};
 }
 function draw(p,n=5){while(p.hand.length<n&&p.deck.length)p.hand.push(p.deck.shift());}
 function create({roomId,hostName,hostDeck,hostFusions,enemyDeckA,enemyDeckB,
    enemyFusionsA,enemyFusionsB,chapter=1,entry='new',catalog,randomSeed,
    hostUpgrades={},hostEnhancements={},hostEssence={}}){
  assert(typeof roomId==='string'&&roomId.length>=6,'Raumkennung fehlt.');
  assert(CHAPTERS.some(c=>c.id===chapter),'Ungültiges Kapitel.');
  assert(['new','chapter'].includes(entry),'Ungültiger Einstieg.');
  assert(entry!=='new'||chapter===1,'Neue Kampagne beginnt mit Kapitel I.');
  for(const d of [hostDeck,enemyDeckA,enemyDeckB])
   assert(validDeck(d,catalog),'Hauptdeck muss aus 40 gültigen Einzelspieler-Karten bestehen (maximal 3 Kopien).');
  for(const f of [hostFusions,enemyFusionsA,enemyFusionsB])
   assert(validDeck(f,catalog,true),'Fusionsdeck muss aus 2–15 freigeschalteten Fusionen bestehen (maximal 3 Kopien).');
  const hostBuild=normalizedBuild(hostUpgrades,hostEnhancements,hostDeck,hostFusions,
   catalog,hostEssence);
  return {schema:2,mode:'duo-campaign',ruleset:'duo-v164',roomId,chapter,entry,
   status:'waiting',revision:0,activeSeat:0,turn:0,round:1,uid:1,
   rngSeed:Number.isSafeInteger(randomSeed)&&randomSeed>=1&&randomSeed<=0xffffffff?
    randomSeed:roomSeed(roomId), // deterministic Node QA; Edge injects secret crypto seed
   teams:[{lp:16000,maxLp:16000,shield:maxAegis(hostBuild),
    essenceTauntTurn:-1,essenceBastionUsed:false},
    {lp:16000,maxLp:16000,shield:0}],
   players:[player(0,safeName(hostName),chapterDeck(hostDeck,catalog,chapter,entry),hostFusions,hostBuild),
    player(1,'Gegner A',enemyDeckA,enemyFusionsA),
    player(2,'Partner (ausstehend)'),player(3,'Gegner B',enemyDeckB,enemyFusionsB)],
   winner:null,log:['Raum erstellt. Der Partner wird erwartet.']};
 }
 function instance(g,id,catalog,{fusion=false,roleOverride=null,quality=1,ownerSeat=null}={}){
  const c=definition(catalog,id);
  assert(c&&c.playable,'Karte existiert nicht im aktuellen Singleplayer-Katalog.');
  const p=Number.isInteger(ownerSeat)?g.players[ownerSeat]:null;
  let atk=Math.max(0,round10((c.atk+statBonus(c,'atk',p))*quality));
  let def=Math.max(0,round10((c.def+statBonus(c,'def',p))*quality));
  const companion=!!c.essenceMonster&&p?.essence?.chosen===id;
  const level=companion?essenceLevel(p.essence.tier):c.level;
  if(companion){atk=Math.min(10000,atk+level*45+p.essence.rank*35);
   def=Math.min(10000,def+level*70+p.essence.rank*55);}
  return {uid:g.uid++,id,level,atk,def,role:roleOverride||c.role||'combatant',
   fusion,mode:'atk',used:false,switched:false,placedRound:g.round,
   essenceChoice:1,essenceAttacks:0,essenceLastToggle:-1,
   guardLeft:0,guardGrantedTurn:-1,
   resonance:0,soul:0,condensed:0,soulCooldown:0,raidCooldown:0,
   condenseLeft:0,condenseSlice:0,drainPreference:0,lastSoulAction:-1,
   lastDrainSwitch:-1,decaySkipOwnTurn:-1,maxDef:def,
   decayGrace:1};
 }
 const hasCards=(p)=>p.field.some(Boolean);
 const defensive=c=>c&&['guardian','soul'].includes(c.role);
 const essenceCompanion=(p,c,type)=>!!c&&p?.essence?.chosen===c.id&&
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
 function removeIfEmpty(g,p,slot,catalog){
  const c=p.field[slot];
  if(c&&c.mode==='def'&&c.def<=0){
   if(protectBastion(g,p,slot,catalog))return;
   p.graveyard.push(c);p.field[slot]=null;
   g.log.push(definition(catalog,c.id).name+' hat keine DEF mehr und wird zerstört.');
  }
 }
 function endOwnerTurn(g,p,catalog){
  for(let slot=0;slot<p.field.length;slot++){
   const c=p.field[slot];if(!c)continue;combat(c);
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
   removeIfEmpty(g,p,slot,catalog);
  }
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
   if(c.role==='combatant')c.resonance=Math.min(3,c.resonance+1);
   if(c.fusion&&c.role==='resonator')c.resonance=Math.min(2,c.resonance+1);
  }
  restoreAllies(g,p,catalog);
  absorbSouls(g,p,catalog);
  if(g.status!=='active')return;
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
   assert(m&&['hand','field'].includes(m.from)&&Number.isInteger(m.index),
    'Ungültiges Fusionsmaterial.');
   const key=m.from+':'+m.index;assert(!keys.has(key),'Material doppelt ausgewählt.');keys.add(key);
   const card=m.from==='hand'?p.hand[m.index]:p.field[m.index];
   assert(card!==null&&card!==undefined,'Fusionsmaterial ist nicht vorhanden.');
   cards.push(m.from==='hand'?{id:card,level:0,...{_hand:true}}:card);
  }
  return cards;
 }
 function fusionOptions(g,seat,materials,catalog,{coreIndex}={}){
  const p=g.players[seat];
  const cards=materialSelection(p,materials).map(c=>c._hand?{
   id:c.id,level:definition(catalog,c.id).level,
   role:definition(catalog,c.id).role||'combatant',fusion:false,resonance:0,
   element:definition(catalog,c.id).element,ability:definition(catalog,c.id).ability}:
   {...c,element:definition(catalog,c.id).element,
    ability:definition(catalog,c.id).ability});
  const rule=fusionLevel(cards,{coreIndex});
  const analysis=fusionAnalysis(cards,rule,p);
  return {rule,cards,analysis,templates:[...new Set(p.remainingFusion)].filter(id=>
   definition(catalog,id)?.level<=rule.level&&definition(catalog,id)?.level>=2)};
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
  const normal=cards.filter(c=>c.role==='combatant'&&!c.fusion);
  const resonators=cards.filter(c=>c.role==='resonator'&&c.fusion);
  const normalPct=Math.min(24,normal.reduce((sum,c)=>
   sum+4+4*clamp(c.resonance||0,0,3),0));
  const resonatorPct=Math.min(60,resonators.reduce((sum,c)=>
   sum+10+10*clamp(c.resonance||0,0,2),0));
  const resonancePct=normalPct+resonatorPct;
  // Allrounders enhance a valid chain; the addition cannot erase prior quality.
  const specialists=cards.filter(c=>c.role!=='combatant'&&!(c.role==='resonator'&&c.fusion));
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
  const {rule,cards,analysis,templates}=fusionOptions(g,seat,materials,catalog,{coreIndex});
  const chosen=templateId??templates[0];
  assert(templates.includes(chosen),'Keine passende Fusionsvorlage verfügbar.');
  const template=definition(catalog,chosen),
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
  return {rule,analysis,templateId:chosen,atk:bounds('atk'),def:bounds('def'),
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
   g.log.push(label+' verdichtet '+amount+' Seele zu vorübergehender DEF.');
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
    action.deck,action.fusions,catalog,action.essence);
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
   g.teams.forEach(t=>t.lp=t.maxLp);
   g.teams[0].shield=teamAegis(g);g.teams[1].shield=0;
   g.teams[0].essenceTauntTurn=-1;g.teams[0].essenceBastionUsed=false;
   for(const pl of g.players){
    pl.deck=chapterDeck(pl.baseDeck,catalog,g.chapter,'chapter');
    pl.fusionDeck=[...pl.baseFusions];pl.remainingFusion=[...pl.baseFusions];
    pl.hand=[];pl.field=Array(7).fill(null);pl.graveyard=[];
    pl.summoned=false;pl.ownTurns=0;pl.fusionsPerformed=0;
    pl.fusionLoreChainUsed=false;draw(pl);
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
   p.hand.splice(action.handIndex,1);p.field[action.slot]=instance(g,id,catalog,{ownerSeat:seat});
   p.summoned=true;g.log.push(p.name+' beschwört '+definition(catalog,id).name+'.');
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
   const {rule,cards,analysis,templates}=fusionOptions(g,seat,action.materials,catalog,
    {coreIndex:action.coreIndex});
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
   const guaranteedSoul=types.filter(c=>c.from==='field').length>=3&&
    types.filter(c=>c.from==='field').every(c=>defensive(c));
   const awakened=analysis.role==='guardian'&&(guaranteedSoul||
    (analysis.soulOdds>0&&randomInt(g,10000)<Math.floor(analysis.soulOdds*10000)));
   const inherited=awakened?'soul':analysis.role,weights=roleWeights(inherited);
   const template=definition(catalog,action.templateId);
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
   p.field[action.slot]=result;p.summoned=true;
   g.log.push(p.name+' fusioniert '+cards.length+' eigene Monster zu '+
    definition(catalog,action.templateId).name+' (Lv '+result.level+', Rolle '+
    (roleName[inherited]||inherited)+', '+analysis.pattern+', '+
    analysis.rolls+' Würfelpaare, Qualität '+Math.round((analysis.quality-1)*100)+' %).');
  }else if(action.type==='attack'){
   const src=p.field[action.slot];
   assert(src&&src.mode==='atk'&&!src.used&&src.placedRound<g.round,'Angreifer ist nicht bereit.');
   const foes=g.players.filter(x=>x.team!==p.team);
   let enemy=foes.find(x=>x.seat===action.targetSeat);
   // Swarm includes only the active player's own field, capped at five.
   const predators=p.field.filter(x=>x?.role==='predator').length;
   let raw=Math.max(0,Math.floor(src.atk*(src.role==='predator'?
    1+.02*Math.min(5,predators):1)));
   if(essenceCompanion(p,src,'predator')&&src.essenceChoice===2)
    raw=Math.floor(raw*.7);
   if(action.targetSeat===null){
    assert(foes.every(x=>!hasCards(x)),'Direkter Angriff ist durch Gegnerkarten blockiert.');
    score(g,p.team,raw,p.name+' · direkter Angriff');
   }else{
    assert(enemy&&Number.isInteger(action.targetSlot)&&
     action.targetSlot>=0&&action.targetSlot<7,'Gegnerischer Feldplatz fehlt.');
    let targetSlot=action.targetSlot;
    let target=enemy.field[targetSlot];assert(target,'Ziel ist leer.');
    let taunt=false;
    if(p.team===1&&g.teams[0].essenceTauntTurn!==g.turn){
     const guard=g.players.filter(owner=>owner.team===0)
      .flatMap(owner=>owner.field.map((c,slot)=>({owner,c,slot})))
      .find(x=>essenceCompanion(x.owner,x.c,'defense')&&
       x.owner.essence.school==='defense'&&x.c.mode==='def'&&!(x.c.guardLeft>0));
     if(guard){enemy=guard.owner;targetSlot=guard.slot;target=guard.c;
      taunt=true;g.teams[0].essenceTauntTurn=g.turn;
      g.log.push('✦ Aschenhort lenkt den ersten Gegnerangriff auf sich und halbiert ihn.');}
    }
    if(target.mode==='atk'){
     const diff=raw-target.atk;
     if(diff>=0){enemy.graveyard.push(target);enemy.field[targetSlot]=null;}
     if(diff<=0){p.graveyard.push(src);p.field[action.slot]=null;}
     if(diff!==0)score(g,diff>0?p.team:enemy.team,Math.abs(diff),
      p.name+' · ATK-Duell gegen '+enemy.name);
     g.log.push(p.name+' greift '+enemy.name+' in ATK an (Differenz '+diff+').');
    }else{
     combat(target);
     const guarded=target.guardLeft>0;
     const mitigation=defensive(target)?(src.role==='predator'?.25:.35):0;
     let remaining=guarded?0:Math.max(0,
      Math.floor((taunt?Math.floor(raw*.5):raw)*(1-mitigation)));
     const original=remaining;
     const condensedLost=Math.min(target.condensed,remaining);
     target.condensed-=condensedLost;remaining-=condensedLost;
     const soulLost=Math.min(target.soul,remaining);
     target.soul-=soulLost;remaining-=soulLost;
     const defLost=Math.min(target.def,remaining);
     target.def-=defLost;
     if(soulLost)score(g,enemy.team,Math.floor(soulLost*.5),
      definition(catalog,target.id).name+' · erzwungener Seelenverlust');
     removeIfEmpty(g,enemy,targetSlot,catalog);
     if(defensive(target)&&!guarded)score(g,enemy.team,Math.floor(target.atk*.5),
      definition(catalog,target.id).name+' · Gegenschlag');
     g.log.push(p.name+' greift '+enemy.name+' in DEF an: '+original+
      ' Trefferstärke, −'+condensedLost+' Verdichtung / −'+soulLost+
      ' Seele / −'+defLost+' Grund-DEF ('+Math.round(mitigation*100)+' % Rüstung)'+
      (guarded?' · Letztes Bollwerk immun.':'')+'.');
    }
   }
   if(p.field[action.slot]){
    if(essenceCompanion(p,src,'predator')){
     src.essenceAttacks=(src.essenceAttacks||0)+1;
     src.used=src.essenceChoice!==2||src.essenceAttacks>=2;
    }else src.used=true;
    p.field[action.slot].atk=Math.max(0,p.field[action.slot].atk-
     (30-2*perk(p,'combatDiscipline')));
   }
  }else if(['soulCondense','soulDischarge','soulRaid','soulFocus'].includes(action.type)){
   soulAction(g,p,action,catalog);
  }else if(action.type==='end'){
   endOwnerTurn(g,p,catalog);
   if(p.team===1)for(const ally of g.players.filter(x=>x.team===0))
    for(const c of ally.field.filter(Boolean))if(c.guardLeft>0&&c.guardGrantedTurn!==g.turn)
     c.guardLeft--;
   if(g.status==='active')moveOn(g,catalog);
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
 return Object.freeze({version:'16.4-beta',CHAPTERS,seats,allowed,validDeck,packIds,
  chapterDeck,create,apply,aiTurn,view,fusionLevel,fusionPattern,fusionOptions,
  fusionAnalysis,fusionPreview,fusionRole,PERK_LIMITS,normalizedBuild});
});
