(function arcaneLv1Swarm(){
 'use strict';
 const defs=[
  {key:'hive',name:'Nekro-Hive · Herr der verlorenen Funken',level:3,atk:130,def:610,role:'guardian',desc:'Geisterslots, Reinkarnation, doppelte Floating-Echos und Geisterheilung.',art:'assets/custom-art/lv1-necro-hive.svg'},
  {key:'protector',name:'Violettwacht · Schutz der Kleinen',level:3,atk:60,def:780,role:'guardian',desc:'Lenkt Angriffe um, verwandelt DEF in Leben, heilt und verteilt Schutzorbs.',art:'assets/custom-art/lv1-protector.svg'},
  {key:'attacker',name:'Schwarmklinge · Vielgestaltiger Jäger',level:3,atk:590,def:170,role:'predator',desc:'Wachsende ATK, zwei Angriffe, Kopien nach Angriffen und verringerte Angriffsermüdung.',art:'assets/custom-art/lv1-attacker.svg'},
  {key:'ace',name:'Urfunke · Der erste Geist',level:1,atk:111,def:111,role:'combatant',desc:'30 % ATK Seelenblitz pro Zug; Lebensverknüpfung und eine einmalige Rettung mit 1 DEF.',art:'assets/custom-art/lv1-urfunke.svg'}
 ];
 const IDS={};
 for(const d of defs){
  const id=CARDS.length;IDS[d.key]=id;
  const c={id,level:d.level,name:d.name,kind:'spirit',element:'DUNKEL',color:'#bf79fa',atk:d.atk,def:d.def,
   rpg:true,source:-1,rarity:d.key==='ace'?'legendary':'rare',fusionOnly:d.key!=='ace',ace:d.key==='ace',
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
 const isLv1=c=>!!c&&levelOf(c)===1&&!c.fusion&&!c.fate;
 const isReal=c=>isLv1(c)&&!c.lv1Echo&&!c.lv1Ghost;
 const enabled=g=>!!g&&g.mode==='pve'&&g.active!==undefined&&(profile?.lv1Saga?.perk===true||g.lv1Saga?.stage>=2);
 const has=g=>enabled(g)&&g.players[0].field.some(c=>keyOf(c)==='hive');
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
 function grantGhost(g){const s=state(g),i=s.ghostSlots.findIndex(x=>x===null);if(i<0)return false;s.ghostSlots[i]={kind:'ghost'};logFx(g,'ghost',i);return true;}
 function counts(g){return owned(g).filter(isLv1).length+spirits(g).filter(x=>x.kind==='card').length;}
 function syncSwarm(g){
  if(!stageAllowed(g,3))return;
  const n=counts(g);
  const list=[...owned(g),...spirits(g).filter(x=>x.kind==='card').map(x=>x.card)].filter(isLv1);
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
  if(!stageAllowed(g,2)||!isReal(c))return;
  const s=current(g);if(s.float>=maxTurns)return;
  s.float++;
  s.choices.push({id:c.id});
  for(const other of owned(g).filter(x=>x!==c&&isLv1(x))){
   other.lv1Mourn=(other.lv1Mourn||0)+8;
   other.lv1MournUntil=g.turn+3;
   if(other.card){other.card.atk+=8;other.card.def+=8;}
  }
  logFx(g,'mourning',CARDS[c.id].name);
  if(has(g))grantGhost(g);
  if(has(g)&&s.float<maxTurns){
   s.float++;s.choices.push({id:c.id});
  }
  syncSwarm(g);
 }
 function resolveChoice(g,index,type){
  if(!enabled(g)||g.active!==0)return false;
  const s=state(g),ch=s.choices[index];if(!ch)return false;
  if(type!=='echo'&&type!=='deck')return false;
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
  const s=state(g),p=g.players[0],o=s.offers[index];if(!o||p.hand.length>=9)return false;
  const c=newInstance(g,o.id,0);
  if(o.echo){c.lv1Echo=true;c.lv1Effectless=true;}
  c.lv1FromOffer=true;
  p.hand.push(c);s.offers.splice(index,1);logEvent(g,(o.echo?'Effektloses Echo':'Wandernder Geist')+' zur Beschwörung/Fusion bereit.');
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
   for(const k of ['lv1SwarmApplied','lv1Mourn','lv1MournUntil','lv1Shield','lv1MaxDef','lv1Attacks','lv1Growth']){
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
  const result=previousPlace(g,idx,choice);
  if(result&&enabled(g)&&g.active===0){
   const spawned=result.card;
   if(isReal(spawned)&&!result.fused&&stageAllowed(g,3)){
    const s=current(g);
    if(s.swarm<maxTurns){s.swarm++;offer(g,spawned.id,true);logFx(g,'swarm',dataOf(spawned).name,idx);}
    if(has(g))grantGhost(g);
   }
   syncSwarm(g);
  }
  return result;
 };
 const previousCan=canAttack;
 canAttack=function(g,c){
  if(enabled(g)&&c&&keyOf(c)==='attacker'&&g.active===0)
   return g.winner===null&&!g.pending&&c.mode==='atk'&&g.turn!==1&&(c.lv1Attacks||0)<2;
  return previousCan(g,c);
 };
 const previousAttack=attack;
 attack=function(g,ai,di){
  if(!enabled(g))return previousAttack(g,ai,di);
  const p=g.players[g.active],enemy=g.players[1-g.active],a=p.field[ai],target=di===null?null:enemy.field[di];
  if(!a)return previousAttack(g,ai,di);
  const beforeField=g.players.map(p=>[...p.field]);
  const oldLP=[g.players[0].lp,g.players[1].lp];
  const oldDef=target?.card?.def||0;
  const oldAtk=a.card?.atk||0;
  if(g.active===1&&target&&owned(g).some(x=>keyOf(x)==='protector')){
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
   if(owned(g).some(c=>keyOf(c)==='attacker')&&isLv1(a)&&oldAtk>a.card.atk){
    a.card.atk+=Math.floor((oldAtk-a.card.atk)*.5);
   }
   if(keyOf(a)==='attacker'){
    a.lv1Attacks=(a.lv1Attacks||0)+1;
    if(a.lv1Attacks<2)a.attacked=false;
    if(owned(g).length<5)offer(g,IDS.ace===a.id?IDS.ace:owned(g).find(isLv1)?.id||CARDS.find(c=>c.level===1&&c.rpg&&!c.ace)?.id,true);
    logFx(g,'slash','',ai);
   }
   if(keyOf(a)==='ace'){
    const enemyLost=Math.max(0,oldLP[1]-g.players[1].lp);
    const monsterLost=Math.max(0,oldDef-(target?.card?.def||0));
    const healed=enemyLost+monsterLost;
    a.card.def=Math.min(111,Math.max(0,a.card.def+healed));
    p.lp=Math.min(g.maxLP,p.lp+healed);if(healed)logFx(g,'drain',healed,ai);
   }
  }
  syncSwarm(g);
  return result;
 };
 const previousAdvance=advanceTurn;
 advanceTurn=function(g){
  if(!enabled(g)||g.winner!==null||g.pending)return previousAdvance(g);
  const ending=g.active,snap=owned(g).filter(isLv1).map(c=>({c,atk:c.card?.atk||0,def:c.card?.def||0}));
  const passed=previousAdvance(g);
  if(passed===false)return passed;
  if(ending===0&&g.winner===null){
   for(const {c,atk,def}of snap)if(owned(g).includes(c)&&c.card){
    for(const k of ['atk','def']){const old=k==='atk'?atk:def,loss=Math.max(0,old-c.card[k]);c.card[k]+=Math.floor(loss*.30);}
   }
   const s=state(g);for(const c of owned(g)){
    if(c.lv1Mourn&&g.turn>=(c.lv1MournUntil||0)){
     c.card.atk=Math.max(0,c.card.atk-c.lv1Mourn);c.card.def=Math.max(1,c.card.def-c.lv1Mourn);c.lv1Mourn=0;
    }
   }
  }
  if(g.active===0&&g.winner===null){
   const hive=owned(g).find(c=>keyOf(c)==='hive');
   const s=state(g);
   if(hive&&s.ghostSlots.length<5){s.ghostSlots.push(null);logFx(g,'slot',s.ghostSlots.length);}
   if(hive){
    const heal=spirits(g).length*20;
    g.players[0].lp=Math.min(g.maxLP,g.players[0].lp+heal);
    if(heal)logFx(g,'heal',heal);
   }
   const protector=owned(g).find(c=>keyOf(c)==='protector');
   if(protector){
    for(const c of owned(g).filter(isLv1)){
     const max=Math.max(c.lv1MaxDef||0,c.card.def);
     c.lv1MaxDef=max;
     const need=max-c.card.def;
     if(need>0)c.card.def+=Math.ceil(need*.5);
     else c.lv1Shield=Math.min(Math.floor(c.card.def*.5),(c.lv1Shield||0)+Math.floor(c.card.def*.25));
     logFx(g,need>0?'heal':'shield',need>0?Math.ceil(need*.5):c.lv1Shield,g.players[0].field.indexOf(c));
    }
   }
   const attacker=owned(g).find(c=>keyOf(c)==='attacker');
   if(attacker){attacker.lv1Growth=(attacker.lv1Growth||0)+Math.min(5,counts(g))*20;
    attacker.card.atk=Math.min(10000,attacker.card.atk+Math.min(5,counts(g))*20);
    logFx(g,'buff',attacker.lv1Growth,g.players[0].field.indexOf(attacker));
   }
   for(const c of owned(g))if(keyOf(c)==='attacker')c.lv1Attacks=0;
   const ace=owned(g).find(c=>keyOf(c)==='ace');
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
    html+='<div class="lv1-ghostslots"><b>Geisterslots</b><div class="lv1-ghostgrid">'+s.ghostSlots.map((x,i)=>
     '<button class="lv1-ghostslot" data-lv1-ghost="'+i+'">'+(x?.kind==='card'?'◇ '+esc(CARDS[x.card.id].name):x?'✦ Geist → Lv2-Material':'◇ Frei')+'</button>').join('')+'</div><small>Freier Slot: Level-1-Handkarte stationieren. Geist: als neutralen Stufe-2-Fusionskatalysator in die Hand nehmen. Stationierte Karte: zur Hand zurücknehmen.</small></div>';
   }
   html+='</section>';
   host.insertAdjacentHTML('beforeend',html);
  }
  const fx=s.events.splice(0).slice(-5),arena=$('ownRow');
  if(arena&&fx.length){arena.style.position='relative';
   const words={echo:'◇ ECHO',draw:'✦ SEELENWANDERUNG',mourning:'✦ TRAUERSCHWARM',swarm:'✦ SCHWARM',ghost:'✦ GEIST GEBUNDEN',slot:'✧ GEISTZONE',heal:'✦ HEILUNG',shield:'◈ SCHUTZORB',drain:'✦ LEBENSVERKNÜPFUNG',buff:'✦ MACHTZUWACHS',revive:'✦ WIEDERGEBURT',slash:'⚔ DOPPELSCHLAG',fusion:'✧ FUSION'};
   for(const event of fx){const tag=document.createElement('span');tag.className='lv1-arcanefx';tag.textContent=(words[event.type]||'✦ ARKANER EFFEKT')+(typeof event.value==='number'?' +'+event.value:'');arena.append(tag);setTimeout(()=>tag.remove(),1500);}
   const orb=document.createElement('span');orb.className='lv1-trail';arena.append(orb);setTimeout(()=>orb.remove(),1100);
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
  const b=event.target.closest('[data-lv1-choice],[data-lv1-offer],[data-lv1-ghost]');
  if(!b||!game||game.active!==0||game.winner!==null)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(b.dataset.lv1Choice!==undefined){
   if(!resolveChoice(game,Number(b.dataset.lv1Choice),b.dataset.kind))toast('Kein freies Angebot oder kein Level-1-Monster mehr im Deck.');
  }else if(b.dataset.lv1Offer!==undefined){
   if(!claimOffer(game,Number(b.dataset.lv1Offer)))toast('Beschwörungsauswahl voll.');
  }else if(b.dataset.lv1Ghost!==undefined){
   const s=state(game),i=Number(b.dataset.lv1Ghost);
   if(s.ghostSlots[i]===null&&i<s.ghostSlots.length){
    const p=game.players[0],c=p.hand.find(isReal);
    if(c){p.hand.splice(p.hand.indexOf(c),1);s.ghostSlots[i]={kind:'card',card:c};logFx(game,'ghost',i);logEvent(game,'Level-1-Monster in Geisterslot '+(i+1)+' stationiert.');syncSwarm(game);}
    else toast('Für diesen Geisterslot wird eine echte Level-1-Handkarte benötigt.');
   }else if(s.ghostSlots[i]?.kind==='ghost'&&game.players[0].hand.length<9){
    const id=RPG_BASE_CARDS.find(c=>c.level===2&&c.role==='combatant'&&!c.fusionOnly&&!c.ace)?.id;
    if(id!==undefined){const catalyst=newInstance(game,id,0);catalyst.lv1Ghost=true;catalyst.lv1Effectless=true;catalyst.card.atk=0;catalyst.card.def=1;game.players[0].hand.push(catalyst);s.ghostSlots[i]=null;logFx(game,'fusion','Stufe 2');logEvent(game,'Ein Geist wird als Stufe-2-Fusionsmaterial bereitgestellt.');}
   }else if(s.ghostSlots[i]?.kind==='card'&&game.players[0].hand.length<9){
    game.players[0].hand.push(s.ghostSlots[i].card);s.ghostSlots[i]=null;syncSwarm(game);
   }
  }
  render();saveDuelSnapshot();
 },true);
 window.ArcaneLv1Swarm=Object.freeze({version:'4.3.0',ids:IDS,enabled,state,counts,isLv1,isReal,
  resolveChoice,claimOffer,offer,exitCard,spirits,syncSwarm});
})();