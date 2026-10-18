(function arcaneLv1Swarm(){
 'use strict';
 const defs=[
  {key:'hive',name:'Nekroth · König des Seelenschwarms',level:1,atk:130,def:610,role:'guardian',desc:'Je eigenem Zug +1 Geisterslot (maximal 5); echte Level-1-Monster erzeugen Geister bei Beschwörung und Tod. Doppelte Floating-Todeseffekte. Je belegtem Geisterslot +20 Spieler-LP pro Runde. Stirbt Nekroth, opfert er einen belegten Slot und kehrt mit voller ATK/DEF zurück. Geister können als Stufe-2-Fusionsmaterial dienen.',art:'assets/custom-art/lv1-necro-hive-illustration.webp'},
  {key:'protector',name:'Aegurion · Hüter der Funken',level:1,atk:60,def:780,role:'guardian',desc:'Alle gegnerischen Einzelangriffe werden auf Aegurion umgeleitet. Für eigene Level-1-Monster gilt DEF als Lebensbalken, auch in Angriffsposition. Heilt je eigener Runde 50 % des fehlenden DEF und verteilt bei voller DEF einen Schutzorb (25 % des aktuellen DEF, maximal 50 %).',art:'assets/custom-art/lv1-protector-illustration.webp'},
  {key:'attacker',name:'Nyxar · Klinge des Schwarms',level:1,atk:590,def:170,role:'predator',desc:'Erhält jede eigene Runde +20 ATK pro eigenem Level-1-Monster; bis zu zwei Angriffe je Zug. Nach jedem Angriff kann bei freiem Feldplatz eine effektlose Level-1-Kopie bereitgestellt werden. Halbiert die Angriffsabnutzung verbündeter Level-1-Monster.',art:'assets/custom-art/lv1-attacker-illustration.webp'},
  {key:'ace',name:'Lumira · Der erste Funke',level:1,atk:111,def:111,role:'combatant',desc:'Exakt 111 ATK und 111 DEF. Fügt je eigener Runde automatisch 30 % seiner ATK als LP-Schaden zu. Verursachter Schaden durch Fähigkeiten und Angriffe heilt Spieler-LP und seine eigene DEF. Überlebt einmalig die Zerstörung mit 1 DEF; verliert DEF auch in Angriffsposition.',art:'assets/custom-art/lv1-urfunke-illustration.webp'}
 ];
 const IDS={};
 for(const d of defs){
  const already=CARDS.find(c=>c.lv1Special===d.key);
  if(already){IDS[d.key]=already.id;continue;}
  const id=CARDS.length;IDS[d.key]=id;
  const c={id,level:d.level,name:d.name,kind:'spirit',element:'DUNKEL',color:'#bf79fa',atk:d.atk,def:d.def,
   rpg:true,source:-1,rarity:d.key==='ace'?'legendary':'rare',role:'combatant',lv1Role:d.role,retired:false,fusionOnly:d.key!=='ace',ace:d.key==='ace',
   milestoneOnly:d.key==='ace',lv1Special:d.key,lv1Exclusive:d.key!=='ace',desc:d.desc,art:d.art,customArt:d.art};
  CARDS.push(c);
  if(c.fusionOnly){
   RPG_FUSIONS.push(c);
   if(typeof UPDATE_B_FUSION_IDS!=='undefined'&&Object.isExtensible(UPDATE_B_FUSION_IDS))UPDATE_B_FUSION_IDS.push(id);
  }else {
   RPG_BASE_CARDS.push(c);
   if(typeof UPDATE_B_MAIN_IDS!=='undefined'&&Object.isExtensible(UPDATE_B_MAIN_IDS))UPDATE_B_MAIN_IDS.push(id);
  }
  if(typeof UPDATE_B_SET!=='undefined')UPDATE_B_SET.add(id);
 }
 const keyOf=c=>c?.lv1Effectless?'':CARDS[c?.id]?.lv1Special||'';
 const levelOf=c=>c?dataOf(c).level:0;
 // Klassenfusionen zählen bei Level-1-Schwarmboni als Level 1, lösen aber selbst keine Basiskarten-Echos aus.
 const isLv1=c=>!!c&&levelOf(c)===1&&!c.fate&&(!c.fusion||!!CARDS[c.id]?.lv1Exclusive);
 const isReal=c=>isLv1(c)&&!c.fusion&&!c.lv1Echo&&!c.lv1Ghost&&!CARDS[c.id]?.fusionOnly;
 const stationable=c=>isLv1(c)&&!c.lv1Ghost&&!c.lv1Echo&&!c.lv1Effectless;
 const enabled=g=>!!g&&g.mode==='pve'&&g.active!==undefined&&(profile?.lv1Saga?.perk===true||g.lv1Saga?.stage>=2);
 const has=g=>enabled(g)&&troops(g).some(c=>keyOf(c)==='hive');
 const maxTurns=5;
 function state(g){
  if(!g.lv1State)g.lv1State={choices:[],offers:[],ghostSlots:[],tick:-1,float:0,swarm:0,events:[]};
  return g.lv1State;
 }
 function logFx(g,type,value='',zone=0){const s=state(g);s.events.push({type,value,zone,id:g.turn});s.events=s.events.slice(-12);}
 function current(g){const s=state(g);if(s.tick!==g.turn){s.tick=g.turn;s.float=0;s.swarm=0;}return s;}
 function stageAllowed(g,minimum){return enabled(g)&&(profile?.lv1Saga?.perk||g.lv1Saga?.stage>=minimum);}
 function owned(g){return g?.players?.[0]?.field?.filter(Boolean)||[];}
 function availableSlots(g){return Math.min(5,Math.max(0,state(g).ghostSlots.length));}
 function spirits(g){return state(g).ghostSlots.filter(x=>x&&(x.kind==='ghost'||x.kind==='card'));}
 function troops(g){return [...owned(g),...spirits(g).filter(x=>x.kind==='card').map(x=>x.card)];}
 function grantGhost(g){const s=state(g),i=s.ghostSlots.findIndex(x=>x===null);if(i<0)return false;s.ghostSlots[i]={kind:'ghost'};logFx(g,'ghost',i);return true;}
 function counts(g){return troops(g).filter(isLv1).length;}
 function syncSwarm(g){
  if(!stageAllowed(g,3))return;
  const n=counts(g);
  const list=troops(g).filter(isLv1);
  for(const c of list){
   const target=Math.max(0,n-1)*10,prev=c.lv1SwarmApplied||0,delta=target-prev;
   if(delta&&c.card){c.card.atk=Math.max(0,c.card.atk+delta);c.card.def=Math.max(1,c.card.def+delta);}
   c.lv1SwarmApplied=target;
  }
 }
 function offer(g,id,echo){
  const s=state(g);if(s.offers.length>=5)return false;
  s.offers.push({id,echo:!!echo});logFx(g,echo?'echo':'draw',CARDS[id]?.name);return true;
 }
 function exitCard(g,c){
  if(!stageAllowed(g,2)||!isLv1(c))return;
  const s=current(g);
  // An exiting Lv1 class fusion strengthens survivors, without creating a new Floating chain.
  for(const other of troops(g).filter(x=>x!==c&&isLv1(x))){
   other.lv1Mourn=(other.lv1Mourn||0)+8;
   other.lv1MournUntil=g.turn+3;
   if(other.card){other.card.atk+=8;other.card.def+=8;}
  }
  logFx(g,'mourning',CARDS[c.id].name);
  if(!isReal(c)||s.float>=maxTurns){syncSwarm(g);return;}
  s.float++;
  s.choices.push({id:c.id});
  if(has(g))grantGhost(g);
  if(g.lv1Saga)g.lv1SagaProgress={...(g.lv1SagaProgress||{}),floating:(g.lv1SagaProgress?.floating||0)+1};
  if(has(g)&&s.float<maxTurns){
   s.float++;s.choices.push({id:c.id});
  }
  syncSwarm(g);
 }
 function resolveChoice(g,index,type){
  if(!enabled(g)||g.active!==0)return false;
  const s=state(g),ch=s.choices[index];if(!ch)return false;
  if(type!=='echo'&&type!=='deck')return false;
  if(s.offers.length>=5)return false;
  let id=ch.id,echo=true;
  if(type==='deck'){
   const p=g.players[0],poss=p.deck.map((card,i)=>({id:card,i})).filter(x=>CARDS[x.id]?.level===1&&!CARDS[x.id].fusionOnly);
   if(!poss.length)return false;
   const choice=poss[randomInt(g,poss.length)];id=choice.id;p.deck.splice(choice.i,1);echo=false;
  }
  if(!offer(g,id,echo))return false;
  s.choices.splice(index,1);return true;
 }
 function claimOffer(g,index){
  if(!enabled(g)||g.active!==0)return false;
  const s=state(g),p=g.players[0],o=s.offers[index];if(!o||p.hand.length>=9||g.pending)return false;
  const c=newInstance(g,o.id,0);
  if(o.echo){c.lv1Echo=true;c.lv1Effectless=true;}
  c.lv1FromOffer=true;
  p.hand.push(c);s.offers.splice(index,1);
  g.pending={kind:'normal',card:c,levels:[1],lv1Effect:true};
  g.selection=null;g.materials=[];
  logEvent(g,(o.echo?'Effektloses Echo':'Wandernder Geist')+' als kostenlose Effektbeschwörung bereit. Wähle einen Feldplatz oder eine Feldfusion.');
  return true;
 }
 const previousNewInstance=newInstance;
 newInstance=function(g,id,owner=g.active){
  const card=previousNewInstance(g,id,owner);
  if(id===IDS.ace&&card.card){card.card.atk=111;card.card.def=111;}
  return card;
 };
 const previousCreate=createGame;
 createGame=function(opts={}){
  const g=previousCreate(opts);
  if(g.mode==='pve')state(g);
  return g;
 };
 const previousSnapshot=validateDuelSnapshot;
 validateDuelSnapshot=function(raw){
  const g=previousSnapshot(raw);
  if(raw?.mode!=='pve'||!raw.lv1State)return g;
  const s=raw.lv1State;
  if(!Array.isArray(s.choices)||!Array.isArray(s.offers)||!Array.isArray(s.ghostSlots)||s.ghostSlots.length>5)throw Error('Ungültiger Schwarmspielstand.');
  const validId=id=>Number.isInteger(id)&&!!CARDS[id]&&CARDS[id].level===1&&!CARDS[id].fusionOnly;
  if(s.choices.length>5||s.offers.length>5||s.choices.some(x=>!validId(x.id))||s.offers.some(x=>!validId(x.id)||typeof x.echo!=='boolean'))throw Error('Ungültige Schwarmwarteschlange.');
  g.lv1State={choices:s.choices.map(x=>({id:x.id})),offers:s.offers.map(x=>({id:x.id,echo:x.echo})),
   ghostSlots:s.ghostSlots.map(x=>x&&x.kind==='ghost'?{kind:'ghost'}:x?.kind==='card'&&validId(x.card?.id)&&Number.isInteger(x.card?.uid)?{kind:'card',card:{id:x.card.id,uid:x.card.uid,mode:'atk',attacked:false,switched:false,card:{level:1,atk:Math.max(0,Math.min(10000,x.card.card?.atk||0)),def:Math.max(1,Math.min(10000,x.card.card?.def||1))}}}:null),
   tick:Number.isInteger(s.tick)?s.tick:-1,float:Math.max(0,Math.min(5,s.float||0)),
   swarm:Math.max(0,Math.min(5,s.swarm||0)),events:[]};
  if(Number.isInteger(raw.lv1Saga?.stage)&&raw.lv1Saga.stage>=1&&raw.lv1Saga.stage<=5)
   g.lv1Saga={stage:raw.lv1Saga.stage};
  function restoreCard(to,from){
   if(!to||!from||to.uid!==from.uid||to.id!==from.id)return;
   for(const k of ['lv1Echo','lv1Effectless','lv1FromOffer','lv1AceSaved']){
    if(from[k]===true)to[k]=true;
   }
   for(const k of ['lv1SwarmApplied','lv1Mourn','lv1MournUntil','lv1Shield','lv1MaxDef','lv1Attacks','lv1Growth','lv1LockedUntil']){
    if(Number.isInteger(from[k])&&from[k]>=0&&from[k]<=10000)to[k]=from[k];
   }
   if(from.lv1Full&&Number.isInteger(from.lv1Full.atk)&&Number.isInteger(from.lv1Full.def))
    to.lv1Full={atk:Math.max(0,Math.min(10000,from.lv1Full.atk)),def:Math.max(0,Math.min(10000,from.lv1Full.def))};
  }
  for(let owner=0;owner<2;owner++){
   for(const location of ['hand','graveyard']){
    const cards=g.players[owner][location],saved=raw.players?.[owner]?.[location]||[];
    for(let i=0;i<cards.length;i++)restoreCard(cards[i],saved[i]);
   }
   for(let i=0;i<5;i++)restoreCard(g.players[owner].field[i],raw.players?.[owner]?.field?.[i]);
  }
  restoreCard(g.pending?.card,raw.pending?.card);
  if(g.pending&&raw.pending?.lv1Effect===true)g.pending.lv1Effect=true;
  const x=raw.lv1SagaProgress;
  if(x&&['floating','swarm','special'].every(k=>Number.isInteger(x[k])&&x[k]>=0&&x[k]<=100))g.lv1SagaProgress={floating:x.floating,swarm:x.swarm,special:x.special};
  return g;
 };
 const previousOptions=fusionOptions;
 fusionOptions=function(g,levels,materials=[]){
  const normal=previousOptions(g,levels,materials);
  return normal.filter(c=>!c.lv1Exclusive||
   (stageAllowed(g,4)&&materials.length>=3&&materials.every(isLv1)&&materials.every(x=>!x.lv1Ghost)));
 };
 const previousFusion=fusedInstance;
 fusedInstance=function(g,material,levels){
  if(enabled(g)&&g.active===0&&material.some(c=>c.lv1LockedUntil>g.turn))return null;
  const done=previousFusion(g,material,levels);if(!done||!enabled(g)||g.active!==0)return done;
  const t=keyOf(done),special=!!t&&t!=='ace';
  if(special){
   if(!material.every(isLv1)){return done;}
   const extra=t==='hive'?{atk:0,def:100}:t==='protector'?{atk:0,def:200}:{atk:120,def:0};
   for(const k of ['atk','def'])done.card[k]+=extra[k];
   done.lv1Full={atk:done.card.atk,def:done.card.def};
   done.lv1Special=true;
   if(done.rollMath){for(const k of ['atk','def']){done.rollMath.bonus[k]+=extra[k];done.rollMath.final[k]+=extra[k];}}
   logFx(g,'fusion',t);
   if(g.lv1Saga)g.lv1SagaProgress={...(g.lv1SagaProgress||{}),special:(g.lv1SagaProgress?.special||0)+1};
  }
  for(const c of material)if(owned(g).includes(c))exitCard(g,c);
  return done;
 };
 const previousQuality=window.ArcaneEvolution?.tunedFusionQuality;
 // The original five-of-a-kind bonus stays in the core, this +5% applies to actual five-Lv1 chains.
 const previousPrepare=prepareHandFusion;
 prepareHandFusion=function(g,uids,choice){
  if(g?.mode!=='pve'||!stageAllowed(g,4))return previousPrepare(g,uids,choice);
  return previousPrepare(g,uids,choice);
 };
 const previousPlace=placePending;
 placePending=function(g,idx,choice){
  const before=g?.pending?.card;
  const bonusSummon=!!g?.pending?.lv1Effect,previousSummoned=g?.summoned;
  if(bonusSummon)g.summoned=false;
  let result;
  try{result=previousPlace(g,idx,choice);}finally{if(bonusSummon)g.summoned=previousSummoned||!!result;}
  if(result&&enabled(g)&&g.active===0){
   const spawned=result.card;
   if(isReal(spawned)&&!result.fused&&stageAllowed(g,3)){
    const s=current(g);
    if(s.swarm<maxTurns){s.swarm++;offer(g,spawned.id,true);logFx(g,'swarm',dataOf(spawned).name,idx);
      if(g.lv1Saga)g.lv1SagaProgress={...(g.lv1SagaProgress||{}),swarm:(g.lv1SagaProgress?.swarm||0)+1};}
    if(has(g))grantGhost(g);
   }
   syncSwarm(g);
  }
  return result;
 };
 const previousCan=canAttack;
 canAttack=function(g,c){
  if(enabled(g)&&g.active===0&&c?.lv1LockedUntil>g.turn)return false;
  if(enabled(g)&&c&&keyOf(c)==='attacker'&&g.active===0)
   return g.winner===null&&!g.pending&&c.mode==='atk'&&g.turn!==1&&(c.lv1Attacks||0)<2;
  return previousCan(g,c);
 };
 const previousAttack=attack;
 attack=function(g,ai,di){
  if(!enabled(g))return previousAttack(g,ai,di);
  // Aegurion's attack redirection remains active inside a ghost slot.
  if(g.active===1&&!g.lv1GhostDefenseRouting){
   const slots=state(g).ghostSlots;
   const guardIndex=slots.findIndex(x=>x?.kind==='card'&&keyOf(x.card)==='protector');
   if(guardIndex>=0){
    const defender=slots[guardIndex].card,field=g.players[0].field;
    const free=field.findIndex(x=>!x),ix=free>=0?free:4,saved=field[ix];
    slots[guardIndex]=null;field[ix]=defender;
    let resolved=null,remaining=null;
    g.lv1GhostDefenseRouting=true;
    try{resolved=attack(g,ai,ix);remaining=field[ix];}
    finally{
     g.lv1GhostDefenseRouting=false;field[ix]=saved;
     if(remaining===defender||!resolved)slots[guardIndex]={kind:'card',card:defender};
     syncSwarm(g);
    }
    return resolved;
   }
  }
  if(g.active===1&&di===null&&!g.players[0].field.some(Boolean)){
   const ghost=state(g).ghostSlots.findIndex(x=>x?.kind==='card');
   if(ghost>=0){
    const c=state(g).ghostSlots[ghost].card;
    state(g).ghostSlots[ghost]=null;g.players[0].field[4]=c;
    let result,remaining=null;
    try{result=attack(g,ai,4);remaining=g.players[0].field[4];}
    finally{g.players[0].field[4]=null;if(remaining===c||!result)state(g).ghostSlots[ghost]={kind:'card',card:c};syncSwarm(g);}
    return result;
   }
  }
  const p=g.players[g.active],enemy=g.players[1-g.active],a=p.field[ai];
  let target=di===null?null:enemy.field[di];
  if(!a)return previousAttack(g,ai,di);
  const beforeField=g.players.map(p=>[...p.field]);
  const oldLP=[g.players[0].lp,g.players[1].lp];
  const oldDef=target?.card?.def||0;
  const oldAtk=a.card?.atk||0;
  if(g.active===1&&owned(g).some(x=>keyOf(x)==='protector')){
   const protect=g.players[0].field.findIndex(x=>keyOf(x)==='protector');
   if(protect>=0){di=protect;target=enemy.field[protect];}
  }
  // Level-1 DEF behaves as health in both modes while protected; ACE always has a DEF life bar.
  const custom=g.active===1&&di!==null&&target&&
    (isLv1(target)&&owned(g).some(c=>keyOf(c)==='protector')||['ace','protector','hive'].includes(keyOf(target)));
  let result;
  if(custom){
   if(!canAttack(g,a))return null;
   const hit=Math.max(0,Math.floor(effectiveAttack(g,a,target)));
   let remains=hit,shield=target.lv1Shield||0;
   if(shield){const block=Math.min(shield,remains);target.lv1Shield-=block;remains-=block;}
   if(remains>0)target.card.def=Math.max(0,target.card.def-remains);
   const dead=target.card.def<=0,deadUid=target.uid;
   if(dead){enemy.field[di]=null;enemy.graveyard.push(target);}
   if(p.field[ai]===a){a.attacked=true;a.card.atk=Math.max(0,a.card.atk-30);}
   result={damage:hit,damaged:null,destroyed:dead?['0:'+di]:[],ai,di};
   if(dead&&keyOf(target)==='ace'&&!target.lv1AceSaved){target.lv1AceSaved=true;target.card.def=1;enemy.graveyard.pop();enemy.field[di]=target;result.destroyed=[];logFx(g,'revive','ace',di);}
   if(dead&&keyOf(target)==='hive'){const s=state(g),j=s.ghostSlots.findIndex(x=>x);if(j>=0){
    const sacrifice=s.ghostSlots[j];if(sacrifice?.kind==='card')enemy.graveyard.push(sacrifice.card);
    s.ghostSlots[j]=null;target.card={...target.card,atk:target.lv1Full?.atk||CARDS[target.id].atk,def:target.lv1Full?.def||CARDS[target.id].def};
    enemy.graveyard.pop();enemy.field[di]=target;result.destroyed=[];logFx(g,'revive','hive',di);
   }}
   if(target.card.def>0)logFx(g,'hit',hit,di);
  }else result=previousAttack(g,ai,di);
  if(!result)return result;
  // Trigger genuine field exits only once; echoes are terminal and never chain.
  if(stageAllowed(g,2))for(let i=0;i<5;i++){
   const c=beforeField[0][i];
   if(c&&!g.players[0].field.includes(c))exitCard(g,c);
  }
  if(g.active===0&&a.card){
   if(troops(g).some(c=>keyOf(c)==='attacker')&&isLv1(a)&&oldAtk>a.card.atk){
    a.card.atk+=Math.floor((oldAtk-a.card.atk)*.5);
   }
   if(keyOf(a)==='attacker'){
    a.lv1Attacks=(a.lv1Attacks||0)+1;
    if(a.lv1Attacks<2)a.attacked=false;
    if(owned(g).length<5){const pool=RPG_BASE_CARDS.filter(c=>c.level===1&&!c.ace&&!c.fusionOnly&&!c.retired);const source=troops(g).find(isReal)?.id??pool[0]?.id;
     if(source!==undefined)offer(g,source,true);}
    logFx(g,'slash','',ai);
   }
   if(keyOf(a)==='ace'){
    const enemyLost=Math.max(0,oldLP[1]-g.players[1].lp);
    const wasDestroyed=di!==null&&result.destroyed?.includes((1-g.active)+':'+di);
    const monsterLost=wasDestroyed?Math.min(Math.max(0,oldAtk),oldDef):
     Math.max(0,oldDef-(target?.card?.def||0));
    const healed=enemyLost+monsterLost;
    a.lv1MaxDef=Math.max(111,a.lv1MaxDef||0,a.card.def);
    a.card.def=Math.min(a.lv1MaxDef,Math.max(0,a.card.def+healed));
    p.lp=Math.min(g.maxLP,p.lp+healed);if(healed)logFx(g,'drain',healed,ai);
   }
  }
  syncSwarm(g);
  return result;
 };
 function station(g,slot,source,index){
  if(!enabled(g)||g.active!==0||g.winner!==null||g.pending)return false;
  const support=state(g),p=g.players[0];
  if(!Number.isInteger(slot)||slot<0||slot>=support.ghostSlots.length||support.ghostSlots[slot]!==null)return false;
  if(!Number.isInteger(index)||index<0||!['hand','field'].includes(source))return false;
  if(source==='hand'&&g.summoned)return false;
  const cards=source==='hand'?p.hand:p.field,c=cards[index];
  if(!stationable(c))return false;
  if(source==='hand'){cards.splice(index,1);g.summoned=true;c.summonedTurn=g.turn;}
  else{cards[index]=null;g.selection=null;}
  support.ghostSlots[slot]={kind:'card',card:c};support.selectedGhostSlot=null;
  logFx(g,'ghost',CARDS[c.id].name,slot);syncSwarm(g);
  return true;
 }
 function ghostAttack(g,slot,targetIdx=null){
  if(!enabled(g)||g.active!==0||g.winner!==null||g.pending||g.turn<=1)return false;
  const status=state(g),v=status.ghostSlots[slot],c=v?.kind==='card'&&v.card;
  if(!c||c.attacked||c.lv1LockedUntil>g.turn||c.mode!=='atk')return false;
  const enemy=g.players[1].field,valid=Number.isInteger(targetIdx)&&targetIdx>=0&&targetIdx<5&&!!enemy[targetIdx];
  if(enemy.some(Boolean)&&!valid)return false;
  if(!enemy.some(Boolean))targetIdx=null;
  const own=g.players[0].field,free=own.findIndex(x=>!x),ix=free>=0?free:4,saved=own[ix];
  status.ghostSlots[slot]=null;own[ix]=c;
  let result=null,after=null;
  try{result=attack(g,ix,targetIdx);after=own[ix];}
  finally{
   if(after===c||!result)status.ghostSlots[slot]={kind:'card',card:c};
   own[ix]=saved;g.selection=null;syncSwarm(g);
  }
  if(result)logFx(g,'slash','Geisterangriff',slot);
  return !!result;
 }
 const previousAdvance=advanceTurn;
 advanceTurn=function(g){
  if(!enabled(g)||g.winner!==null||g.pending)return previousAdvance(g);
  const ending=g.active,snap=owned(g).filter(isLv1).map(c=>({c,atk:c.card?.atk||0,def:c.card?.def||0}));
  const passed=previousAdvance(g);
  if(passed===false)return passed;
  if(g.winner===null&&stageAllowed(g,2))for(const {c}of snap)if(!owned(g).includes(c))exitCard(g,c);
  if(ending===0&&g.winner===null){
   for(const {c,atk,def}of snap)if(owned(g).includes(c)&&c.card){
    for(const k of ['atk','def']){const old=k==='atk'?atk:def,loss=Math.max(0,old-c.card[k]);c.card[k]+=Math.floor(loss*.30);}
   }
   const s=state(g);for(const c of troops(g)){
    if(c.lv1Mourn&&g.turn>=(c.lv1MournUntil||0)){
     c.card.atk=Math.max(0,c.card.atk-c.lv1Mourn);c.card.def=Math.max(1,c.card.def-c.lv1Mourn);c.lv1Mourn=0;
    }
   }
  }
  if(g.active===0&&g.winner===null){
   const hive=troops(g).find(c=>keyOf(c)==='hive');
   const s=state(g);
   for(const o of s.ghostSlots)if(o?.kind==='card'){o.card.attacked=false;o.card.switched=false;
    if(o.card.card){o.card.card.atk=Math.max(0,o.card.card.atk-21);o.card.card.def=Math.max(1,o.card.card.def-21);}}
   if(hive&&s.ghostSlots.length<5){s.ghostSlots.push(null);logFx(g,'slot',s.ghostSlots.length);}
   if(hive){
    const heal=spirits(g).length*20;
    g.players[0].lp=Math.min(g.maxLP,g.players[0].lp+heal);
    if(heal)logFx(g,'heal',heal);
   }
   const protector=troops(g).find(c=>keyOf(c)==='protector');
   if(protector){
    for(const c of [...owned(g),...spirits(g).filter(x=>x.kind==='card').map(x=>x.card)].filter(isLv1)){
     const max=Math.max(c.lv1MaxDef||0,c.card.def);
     c.lv1MaxDef=max;
     const need=max-c.card.def;
     if(need>0)c.card.def+=Math.ceil(need*.5);
     else c.lv1Shield=Math.min(Math.floor(c.card.def*.5),(c.lv1Shield||0)+Math.floor(c.card.def*.25));
     logFx(g,need>0?'heal':'shield',need>0?Math.ceil(need*.5):c.lv1Shield,g.players[0].field.indexOf(c));
    }
   }
   const attacker=troops(g).find(c=>keyOf(c)==='attacker');
   if(attacker){attacker.lv1Growth=(attacker.lv1Growth||0)+Math.min(5,counts(g))*20;
    attacker.card.atk=Math.min(10000,attacker.card.atk+Math.min(5,counts(g))*20);
    logFx(g,'buff',attacker.lv1Growth,g.players[0].field.indexOf(attacker));
   }
   for(const c of troops(g))if(keyOf(c)==='attacker')c.lv1Attacks=0;
   const ace=troops(g).find(c=>keyOf(c)==='ace');
   if(ace){const amount=Math.floor(ace.card.atk*.30),real=damagePlayer(g,1,amount);
    ace.card.def=Math.min(111,ace.card.def+real);g.players[0].lp=Math.min(g.maxLP,g.players[0].lp+real);
    logFx(g,'drain',real,g.players[0].field.indexOf(ace));
    if(g.players[1].lp===0)conclude(g,0,'Urfunke – Seelenverknüpfung');
   }
  }
  syncSwarm(g);
  return passed;
 };
 const oldRender=render;
 render=function(){
  oldRender();
  if(!game||uiMode!=='duel'||!enabled(game))return;
  const s=state(game),host=$('summonStage');
  if(host&&game.active===0){
   const esc=t=>escapeHtml(String(t));
   let html='<section class="lv1-summonbox"><h3>✦ Ruf des Schwarms</h3><p>Floating, Schwarmkopien und Geistzonen · max. 5 Auslöser je Zug</p>';
   html+=s.choices.map((v,i)=>'<div class="lv1-offer">✧ '+esc(CARDS[v.id].name)+' ist gegangen: <button class="btn tiny" data-lv1-choice="'+i+'" data-kind="echo">Echo erzeugen</button> <button class="btn tiny" data-lv1-choice="'+i+'" data-kind="deck">Echten Lv1 aus Deck rufen</button></div>').join('');
   html+=s.offers.map((o,i)=>'<div class="lv1-offer">'+(o.echo?'◇ Effektlose Kopie':'✦ Echte Kreatur')+' · '+esc(CARDS[o.id].name)+' <button class="btn tiny" data-lv1-offer="'+i+'">Zur Hand / Fusion</button></div>').join('');
   if(s.ghostSlots.length){
    if(Number.isInteger(s.selectedGhostSlot)&&s.ghostSlots[s.selectedGhostSlot]===null){
     const hand=game.players[0].hand.map((c,i)=>({c,i})).filter(o=>stationable(o.c));
     const field=game.players[0].field.map((c,i)=>({c,i})).filter(o=>stationable(o.c));
     html+='<div class="lv1-offer"><b>Geisterslot '+(s.selectedGhostSlot+1)+' besetzen:</b>'+
      (game.summoned?'':hand.map(o=>'<button class="btn tiny" data-lv1-station="hand" data-index="'+o.i+'">Hand: '+esc(CARDS[o.c.id].name)+'</button>').join(' '))+
      field.map(o=>'<button class="btn tiny" data-lv1-station="field" data-index="'+o.i+'">Feld: '+esc(CARDS[o.c.id].name)+'</button>').join(' ')+
      '<button class="btn tiny" data-lv1-cancel>Abbrechen</button></div>';
    }
    html+='<div class="lv1-ghostslots"><b>Geisterslots</b><div class="lv1-ghostgrid">'+s.ghostSlots.map((x,i)=>
     '<button class="lv1-ghostslot" data-lv1-ghost="'+i+'">'+(x?.kind==='card'?'◇ '+esc(CARDS[x.card.id].name):x?'✦ Geist → Lv2-Material':'◇ Frei')+'</button>').join('')+'</div><small>Freier Slot: Level-1-Handkarte stationieren. Geist: als neutralen Stufe-2-Fusionskatalysator in die Hand nehmen. Stationierte Karte: zur Hand zurücknehmen.</small></div>';
    if(game.active===0&&game.turn>1){
      html+='<div class="lv1-ghost-actions">'+s.ghostSlots.map((v,i)=>v?.kind==='card'&&v.card.mode==='atk'&&!v.card.attacked?
       '<button class="btn tiny" data-lv1-ghost-select="'+i+'">⚔ '+esc(CARDS[v.card.id].name)+' angreifen lassen</button>':'').join(' ')+'</div>';
      if(Number.isInteger(s.selectedGhost)){
       const monsters=game.players[1].field.map((c,i)=>c?'<button class="btn tiny" data-lv1-ghost-target="'+i+'">Gegnerfeld '+(i+1)+'</button>':'').filter(Boolean).join(' ');
       html+='<div class="lv1-offer">Geisterangriff – Ziel wählen: '+(monsters||'<button class="btn tiny" data-lv1-ghost-target="-1">Direkter Angriff</button>')+'</div>';
      }
     }
   }
   if(stageAllowed(game,3)){
    html+='<div class="lv1-offer"><b>✦ Locken</b> · Angriff aufgeben, um eine effektlose Kopie zu rufen.</div>';
    html+=game.players[0].field.map((c,i)=>isReal(c)&&c.lv1LockedUntil<=game.turn||isReal(c)&&!c.lv1LockedUntil?'<button class="btn tiny" data-lv1-lock="'+i+'">'+esc(dataOf(c).name)+' locken</button>':'').join(' ');
   }
   html+='</section>';
   host.insertAdjacentHTML('beforeend',html);
  }
  const fx=s.events.splice(0).slice(-5),arena=$('ownRow');
  if(arena&&fx.length){arena.style.position='relative';
   const words={echo:'◇ ECHO',draw:'✦ SEELENWANDERUNG',mourning:'✦ TRAUERSCHWARM',swarm:'✦ SCHWARM',ghost:'✦ GEIST GEBUNDEN',slot:'✧ GEISTZONE',heal:'✦ HEILUNG',shield:'◈ SCHUTZORB',drain:'✦ LEBENSVERKNÜPFUNG',buff:'✦ MACHTZUWACHS',revive:'✦ WIEDERGEBURT',slash:'⚔ DOPPELSCHLAG',fusion:'✧ FUSION'};
   for(const event of fx){const tag=document.createElement('span');tag.className='lv1-arcanefx';tag.textContent=(words[event.type]||'✦ ARKANER EFFEKT')+(typeof event.value==='number'?' +'+event.value:'');arena.append(tag);setTimeout(()=>tag.remove(),1500);}
   const orb=document.createElement('span');orb.className='lv1-trail';arena.append(orb);setTimeout(()=>orb.remove(),1100);
   if(fx.some(e=>e.type==='drain'||e.type==='shield'||e.type==='heal')){
    const enemy=$('enemyRow'),home=$('ownRow'),origin=enemy?.getBoundingClientRect?.(),dest=home?.getBoundingClientRect?.();
    if(origin&&dest){
     const effect=fx.some(e=>e.type==='drain')?'lv1-drain-orb':'lv1-shield-orb';
     const particle=document.createElement('span');particle.className=effect;
     const fromX=origin.left+origin.width*.5,fromY=origin.top+origin.height*.5;
     particle.style.left=fromX+'px';particle.style.top=fromY+'px';
     particle.style.setProperty('--lv1dx',(dest.left+dest.width*.5-fromX)+'px');
     particle.style.setProperty('--lv1dy',(dest.top+dest.height*.5-fromY)+'px');
     document.body.append(particle);setTimeout(()=>particle.remove(),1350);
    }
   }
  }
  for(const [row,key] of [['ownRow','mine']]){
   $(row)?.querySelectorAll('[data-'+key+']').forEach(node=>{
    const c=game.players[0].field[Number(node.dataset[key])];if(!c)return;
    if(c.lv1Echo||c.lv1Shield||keyOf(c)){
     const mark=document.createElement('span');mark.className='lv1-battle-chip';
     mark.textContent=[c.lv1Echo?'◇ ECHO':'',c.lv1Shield?'◈ '+c.lv1Shield:'',keyOf(c)?'✦ '+keyOf(c).toUpperCase():''].filter(Boolean).join(' · ');
     node.append(mark);
    }
    if(keyOf(c))node.classList.add('lv1-legendary-glow','lv1-'+keyOf(c));
   });
  }
 };
 $('summonStage')?.addEventListener('click',event=>{
  const b=event.target.closest('[data-lv1-choice],[data-lv1-offer],[data-lv1-ghost],[data-lv1-lock],[data-lv1-ghost-select],[data-lv1-ghost-target],[data-lv1-station],[data-lv1-cancel]');
  if(!b||!game||game.active!==0||game.winner!==null)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(b.dataset.lv1Cancel!==undefined){
   state(game).selectedGhostSlot=null;
  }else if(b.dataset.lv1Station!==undefined){
   if(!station(game,state(game).selectedGhostSlot,b.dataset.lv1Station,Number(b.dataset.index)))toast('Der Geisterslot kann diese Kreatur derzeit nicht aufnehmen.');
  }else if(b.dataset.lv1GhostSelect!==undefined){
   state(game).selectedGhost=Number(b.dataset.lv1GhostSelect);
  }else if(b.dataset.lv1GhostTarget!==undefined){
   const ix=Number(b.dataset.lv1GhostTarget),s=state(game);
   if(!ghostAttack(game,s.selectedGhost,ix<0?null:ix))toast('Geisterangriff konnte nicht ausgeführt werden.');
   s.selectedGhost=null;
  }else if(b.dataset.lv1Choice!==undefined){
   if(!resolveChoice(game,Number(b.dataset.lv1Choice),b.dataset.kind))toast('Kein freies Angebot oder kein Level-1-Monster mehr im Deck.');
  }else if(b.dataset.lv1Offer!==undefined){
   if(!claimOffer(game,Number(b.dataset.lv1Offer)))toast('Beschwörungsauswahl voll.');
  }else if(b.dataset.lv1Lock!==undefined){
   const c=game.players[0].field[Number(b.dataset.lv1Lock)];
   if(stageAllowed(game,3)&&isReal(c)&&!c.attacked&&!(c.lv1LockedUntil>game.turn)&&state(game).offers.length<5){
    c.lv1LockedUntil=game.turn+2;c.attacked=true;c.switched=true;offer(game,c.id,true);logFx(game,'swarm','Locken');
   }else toast('Locken ist für dieses Monster derzeit nicht verfügbar.');
  }else if(b.dataset.lv1Ghost!==undefined){
   const s=state(game),i=Number(b.dataset.lv1Ghost);
   if(s.ghostSlots[i]===null&&i<s.ghostSlots.length){
    s.selectedGhostSlot=i;
   }else if(s.ghostSlots[i]?.kind==='ghost'&&game.players[0].hand.length<9){
    const id=RPG_BASE_CARDS.find(c=>c.level===2&&c.role==='combatant'&&!c.fusionOnly&&!c.ace)?.id;
    if(id!==undefined){const catalyst=newInstance(game,id,0);catalyst.lv1Ghost=true;catalyst.lv1Effectless=true;catalyst.card.atk=0;catalyst.card.def=1;game.players[0].hand.push(catalyst);s.ghostSlots[i]=null;logFx(game,'fusion','Stufe 2');logEvent(game,'Ein Geist wird als Stufe-2-Fusionsmaterial bereitgestellt.');}
   }else if(s.ghostSlots[i]?.kind==='card'){
    const c=s.ghostSlots[i].card,p=game.players[0];
    if(c.fusion){
     const empty=p.field.findIndex(x=>!x);
     if(empty<0)toast('Für die Rückkehr der Fusion ist ein normales Kampffeld nötig.');
     else{p.field[empty]=c;s.ghostSlots[i]=null;c.switched=true;syncSwarm(game);}
    }else if(p.hand.length<9){p.hand.push(c);s.ghostSlots[i]=null;syncSwarm(game);}
    else toast('Deine Hand ist voll.');
   }
  }
  render();saveDuelSnapshot();
 },true);
 window.ArcaneLv1Swarm=Object.freeze({version:'4.5.0',ids:IDS,enabled,state,counts,isLv1,isReal,
  resolveChoice,claimOffer,ghostAttack,station,offer,exitCard,spirits,syncSwarm,stationable});
})();