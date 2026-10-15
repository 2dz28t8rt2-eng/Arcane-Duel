/* ARCANE DUEL · Essence Bonds & Combat Roles · 2026-10-15
 * Load after learning.js; core card IDs and safe snapshot schema are in game.js.
 * Old duels and local PvP retain legacy combat. New PvE uses the new combat model.
 */
'use strict';
(()=>{
 const schools=['predator','fusion','defense'],schoolName={predator:'Predatoren',fusion:'Runenfusion',defense:'Bollwerk'};
 const monsterIds=ESSENCE_MONSTER_IDS;
 const int=(x,max)=>Number.isSafeInteger(x)&&x>=0&&x<=max;
 const safe=x=>escapeHtml(String(x));
 const maxTier=()=>Math.max(0,...profile.cleared);
 const perkRank=(tier=maxTier())=>1+(tier>=5?1:0)+(tier>=7?1:0)+(tier>=8?1:0)+(tier>=10?1:0);
 const evolvedLevel=(tier=maxTier())=>tier>=10?10:tier>=8?7:tier>=5?5:3;
 const rankCap=(tier=maxTier())=>tier>=10?5:tier>=8?4:tier>=5?3:tier>=3?2:0;
 const nextCost=rank=>100+rank*175;
 function defaults(){return {intro:0,chosen:null,school:null,loreRead:false,switchTarget:null,switchStep:0,nourished:0,spent:0,rank:0};}
 function state(raw,p){
  const e=defaults(),v=raw&&typeof raw==='object'?raw:{};
  if(v.chosen!==null&&v.chosen!==undefined){
   if(!Object.values(monsterIds).includes(v.chosen))throw Error('Ungültiges Essenzmonster.');
   if(!p.unlocked.includes(v.chosen)||p.inventory[v.chosen]!==1)throw Error('Essenzmonster fehlt oder wurde vervielfacht.');
   if(p.unlocked.filter(id=>Object.values(monsterIds).includes(id)).length!==1)throw Error('Es darf nur ein Essenzmonster geben.');
   e.chosen=v.chosen;
  }else if(p.unlocked.some(id=>Object.values(monsterIds).includes(id)))throw Error('Ein Essenzmonster ist ohne Bindung vorhanden.');
  for(const k of ['intro','switchStep','nourished','spent','rank'])if(v[k]!==undefined){
   const limits={intro:3,switchStep:5,nourished:1e9,spent:1e9,rank:5};
   if(!int(v[k],limits[k]))throw Error('Ungültiger Essenzfortschritt: '+k);
   e[k]=v[k];
  }
  if(v.school!==undefined&&v.school!==null){
   if(!schools.includes(v.school)||e.chosen===null)throw Error('Ungültige Spezialisierung.');
   e.school=v.school;
  }
  e.loreRead=v.loreRead===true;
  if(v.switchTarget!==undefined&&v.switchTarget!==null){
   if(!schools.includes(v.switchTarget)||!e.school||!e.loreRead||v.switchTarget===e.school)throw Error('Ungültiger Umspezialisierungsauftrag.');
   e.switchTarget=v.switchTarget;
  }
  if(e.chosen!==null&&e.intro!==3)throw Error('Essenzbindung ohne absolvierte Prüfungen.');
  if(e.switchStep&&!e.switchTarget)throw Error('Umspezialisierungsfortschritt ohne Auftrag.');
  if(e.rank>rankCap(Math.max(0,...p.cleared)))throw Error('Essenzverstärkung über dem freigeschalteten Rang.');
  return e;
 }
 const originalFresh=freshProfile,originalValidate=validateProfile;
 freshProfile=function(){const p=originalFresh();p.essence=defaults();return p;};
 validateProfile=function(raw){const p=originalValidate(raw);p.essence=state(raw?.essence,p);return p;};
 let rawSave=null;
 try{const v=window.localStorage.getItem(SAVE_KEY);if(v)rawSave=JSON.parse(v)}catch(e){}
 try{profile.essence=state(rawSave?.essence,profile)}catch(e){
  // Keep other save data and stop further writes rather than overwrite a malformed essence bond.
  storageWritable=false;storageWarning='Essenzbindung im Spielstand ungültig. Bitte exportiere deine Sicherung, bevor du weiterspielst.';
  profile.essence=defaults();
 }
 const essence=()=>profile.essence||(profile.essence=defaults());
 const isOwn=(card)=>!!card&&card.id===essence().chosen;
 const isSoul=c=>CARDS[c?.id]?.role==='soul';
 const isDefender=c=>['soul','guardian'].includes(CARDS[c?.id]?.role);
 const isEssenceDuel=g=>g?.mode==='pve'&&g.essenceRules===true;
 const buffTier=g=>Math.max(0,g?.essenceTier||0);
 const activeSchool=g=>g?.essenceSchool||null;
 const statLayer=c=>{
  if(!c.essenceCombat)c.essenceCombat={soul:0,condensed:0,cooldown:0,condenseLeft:0,condenseSlice:0,guardLeft:0,doubleChoice:1,lastToggle:0,maxDef:Math.max(0,c.card?.def||0),attacksThisTurn:0,lastDischarge:0,guardGrantedTurn:0};
  return c.essenceCombat;
 };
 const roll=(g,n)=>randomInt(g,Math.max(1,n));
 function addBurn(g,owner,amount,desc){
  if(amount<=0||g.winner!==null)return 0;
  const victim=1-owner,actual=damagePlayer(g,victim,amount);
  g.damageDealt[owner]+=actual;logEvent(g,desc+': '+actual+' LP Burn.');
  if(g.players[victim].lp===0)conclude(g,owner,'Seelenessenz hat die Lebenspunkte auf 0 reduziert.');
  return actual;
 }
 function absorb(g,creature,owner){
  const store=statLayer(creature),opponent=g.players[1-owner];
  const lv=dataOf(creature).level,rank=CARDS[creature.id].soulRank||Math.min(5,Math.max(1,Math.ceil(lv/2)));
  let earned=0,drainedDef=0,drainedAtk=0;
  for(const target of opponent.field.filter(Boolean)){
   if(!target.card)continue;
   const lost={atk:0,def:0};
   for(const stat of ['atk','def']){
    const n=Math.min(target.card[stat],10);
    target.card[stat]-=n;lost[stat]+=n;
   }
   for(let i=0;i<lv;i++){
    const bias=rank>=3&&activeSchool(g)==='defense'&&owner===0?0.75:0.5;
    let stat=roll(g,100)<bias*100?'atk':'def';
    if(target.card[stat]===0&&target.card[stat==='atk'?'def':'atk']>0)stat=stat==='atk'?'def':'atk';
    const n=Math.min(target.card[stat],5);target.card[stat]-=n;lost[stat]+=n;
   }
   earned+=lost.atk+lost.def;drainedDef+=lost.def;drainedAtk+=lost.atk;
  }
  if(!earned)return;
  const tier=activeSchool(g)==='defense'&&owner===0?perkRank(buffTier(g)):0;
  const intake=tier>=4?1.22:tier>=2?1.08:1;
  const gain=Math.min(Math.max(0,250+lv*125-store.soul),Math.floor(earned*intake));
  store.soul+=gain;
  if(tier>=3&&rank>=3&&drainedDef){
   const heal=Math.min(g.players[owner].lp+0,g.maxLP)-g.players[owner].lp;
   // Heal only actual DEF drained, at 30%; no overheal.
   g.players[owner].lp=Math.min(g.maxLP,g.players[owner].lp+Math.floor(drainedDef*.3));
  }
  logEvent(g,dataOf(creature).name+' zehrt '+drainedAtk+' ATK / '+drainedDef+' DEF; +'+gain+' Seelenessenz.');
 }
 function soulDecay(g,c,owner){
  const s=statLayer(c);
  if(s.soul>0){
   const amount=Math.min(s.soul,Math.max(10,Math.ceil(s.soul*.45)));
   s.soul-=amount;addBurn(g,owner,amount,dataOf(c).name+' · Seelenzerfall');
  }
  if(s.condenseLeft>0){
   s.condensed=Math.max(0,s.condensed-Math.min(s.condensed,s.condenseSlice));
   s.condenseLeft--;
   if(s.condenseLeft===0)s.condensed=0;
  }
  if(s.cooldown>0)s.cooldown--;
 }
 const originalCreate=createGame;
 let trial=null;
 function trialDeck(role,tier){
  const pool=RPG_BASE_CARDS.filter(c=>!c.essenceMonster&&!c.fusionOnly&&!c.ace&&(c.source===undefined||c.source<0||c.source<=tier)&&c.level<=Math.min(9,tier+3));
  const scoring=c=>role==='predator'?c.atk:role==='defense'?(c.role==='soul'?c.def+400:c.def):c.level*180+c.atk*.6;
  const choice=[...pool].sort((a,b)=>scoring(b)-scoring(a)).slice(0,20);
  if(choice.length<20)throw Error('Zu wenige Übungsmonster.');
  return choice.flatMap(c=>[c.id,c.id]);
 }
 createGame=function(options={}){
  const isTrial=trial&&options.mode==='pve'&&options.context==='challenge';
  if(isTrial){
   const t=trial,main=trialDeck(t.school,Math.max(3,t.stage+2));
   const enemyDeck=trialDeck(t.school==='defense'?'predator':'defense',Math.max(2,t.stage+1));
   options={...options,deck:main,fusionDeck:[...RPG_START_FUSIONS,...RPG_START_FUSIONS],
    enemy:{deck:enemyDeck,fusionDeck:[...RPG_START_FUSIONS],enhancements:{},power:.68+t.stage*.1,flatBonus:0},
    enhancements:{},flatBonus:0};
  }
  const g=originalCreate(options);
  if(g.mode!=='pve')return g;
  g.essenceRules=true;g.essenceSchool=essence().school;g.essenceTier=maxTier();
  g.essenceTrial=isTrial?trial.key:null;
  g.essenceParticipated=!isTrial&&essence().chosen!==null&&profile.activeDeck.includes(essence().chosen)&&options.context!=='auto';
  g.essenceTurns=0;g.essenceKills=0;g.essenceGuardSpent=false;g.essenceTurnAttacks=0;
  return g;
 };
 const oldInstance=newInstance;
 newInstance=function(g,id,owner=g.active){
  const c=oldInstance(g,id,owner);
  if(!isEssenceDuel(g))return c;
  if(!c.card)return c;
  const entry=CARDS[c.id];
  if(entry.essenceMonster&&owner===0&&c.id===essence().chosen&&!g.essenceTrial){
   const lev=evolvedLevel(buffTier(g));c.card.level=lev;
   c.card.atk=Math.min(10000,c.card.atk+lev*45+essence().rank*35);
   c.card.def=Math.min(10000,c.card.def+lev*70+essence().rank*55);
  }
  return c;
 };
 const oldPlace=placePending;
 placePending=function(g,idx,choice){
  const r=oldPlace(g,idx,choice);
  if(r?.card&&isEssenceDuel(g)){
   statLayer(r.card);
   if(r.card.mode==='def'&&isSoul(r.card))logEvent(g,'Seelenzehrer wartet in Verteidigungsposition.');
  }
  return r;
 };
 const oldAttack=attack,oldEffective=effectiveAttack;
 effectiveAttack=function(g,a,d){
  const atk=oldEffective(g,a,d);
  if(isEssenceDuel(g)&&a?.id===essence().chosen&&CARDS[a.id]?.essenceSchool==='predator'&&a.essenceCombat?.doubleChoice===2)return Math.floor(atk*.7);
  return atk;
 };
 attack=function(g,ai,di){
  if(!isEssenceDuel(g))return oldAttack(g,ai,di);
  const p=g.players[g.active],q=g.players[1-g.active],a=p.field[ai],d=di===null?null:q.field[di];
  if(!a||!canAttack(g,a)||di!==null&&!d||di===null&&q.field.some(Boolean))return null;
  const attackerIsCompanion=g.active===0&&isOwn(a);
  const beforeEnemyLP=g.players[1].lp;
  let result;
  if(d?.mode==='def'){
   const s=statLayer(d),strength=effectiveAttack(g,a,d);
   let remaining=s.guardLeft>0?0:strength;
   const condemned=s.condensed?Math.min(s.condensed,remaining):0;
   s.condensed-=condemned;remaining-=condemned;
   const soulLost=Math.min(s.soul,remaining);
   s.soul-=soulLost;remaining-=soulLost;
   const burn=Math.floor(soulLost*.5);if(burn)addBurn(g,q.id,burn,dataOf(d).name+' · erzwungener Seelenverlust');
   const baseLoss=Math.min(d.card?.def||0,remaining);
   if(d.card)d.card.def=Math.max(0,d.card.def-baseLoss);
   let destroyed=[],endDefense=d.card?.def===0;
   if(endDefense&&q.id===0&&activeSchool(g)==='defense'&&perkRank(buffTier(g))>=5&&!g.essenceGuardSpent&&isDefender(d)){
    g.essenceGuardSpent=true;d.card.def=1;s.guardLeft=2;s.guardGrantedTurn=g.turn;endDefense=false;
    logEvent(g,'Letztes Bollwerk: '+dataOf(d).name+' überlebt und ist für zwei weitere gegnerische Züge angriffsimmun.');
   }
   if(endDefense){q.graveyard.push(d);q.field[di]=null;destroyed.push(q.id+':'+di);}
   if(isDefender(d)){
    const counter= Math.floor((CARDS[d.id].atk||0)*.5);
    if(counter>0){const actual=damagePlayer(g,p.id,counter);g.damageDealt[q.id]+=actual;logEvent(g,dataOf(d).name+' · Gegenschlag: '+actual+' LP.');}
   }
   if(p.field[ai]===a){
    const sA=statLayer(a);sA.attacksThisTurn=Math.min(2,sA.attacksThisTurn+1);
    a.attacked=true;
    const fatigue=g.active===0?30-2*(profile?.upgrades?.combatDiscipline||0):30;
    a.card.atk=Math.max(0,a.card.atk-fatigue);a.attackFatigue=(a.attackFatigue||0)+fatigue;
   }
   logEvent(g,dataOf(a).name+' gegen '+dataOf(d).name+': DEF-Schaden '+strength+' (davon Seelenessenz '+soulLost+').');
   if(p.lp===0)conclude(g,q.id,'Gegenschlag hat die Lebenspunkte auf 0 reduziert.');
   else if(q.lp===0)conclude(g,p.id,'Burn hat die Lebenspunkte auf 0 reduziert.');
   g.selection=null;
   result={damage:burn,damaged:burn?p.id:null,destroyed,ai,di};
  }else{
   result=oldAttack(g,ai,di);
   if(result&&p.field[ai]===a)statLayer(a).attacksThisTurn=Math.min(2,(a.essenceCombat?.attacksThisTurn||0)+1);
  }
  if(result&&attackerIsCompanion){
   const destroyedEnemy=result.destroyed?.filter(s=>s.startsWith('1:')).length||0;
   g.essenceKills=Math.min(100,g.essenceKills+destroyedEnemy);
  }
  if(result&&g.active===0&&!a?.fusion)g.evoStats.normalDamage=(g.evoStats.normalDamage||0)+Math.max(0,beforeEnemyLP-g.players[1].lp);
  return result;
 };
 const oldAdvance=advanceTurn;
 advanceTurn=function(g){
  if(!isEssenceDuel(g))return oldAdvance(g);
  const ending=g.active,hand=g.players[ending].field.filter(Boolean);
  const snapshots=hand.map(c=>({c,atk:c.card?.atk||0,def:c.card?.def||0}));
  if(ending===0&&g.essenceParticipated&&hand.some(c=>c.id===essence().chosen))g.essenceTurns=Math.min(60,g.essenceTurns+1);
  const ok=oldAdvance(g);
  if(g.winner!==null)return ok;
  // Bollwerk reduces only the ordinary creature-value decay, not temporary soul burn.
  if(!g.evolutionMode&&ending===0&&activeSchool(g)==='defense'){
   const rank=perkRank(buffTier(g)),save=rank>=3?.25:.15;
   for(const {c,atk,def}of snapshots){
    if(c.mode!=='def'||!isDefender(c)||!c.card||c.summonedTurn===g.turn-1)continue;
    const deltaA=Math.max(0,atk-c.card.atk),deltaD=Math.max(0,def-c.card.def);
    c.card.atk=Math.min(10000,c.card.atk+Math.floor(deltaA*save));
    c.card.def=Math.min(10000,c.card.def+Math.floor(deltaD*save));
   }
  }
  for(const c of hand){
   if(!c.essenceCombat||!c.card)continue;
   if(isSoul(c))soulDecay(g,c,ending);
   else if(c.essenceCombat.cooldown>0)c.essenceCombat.cooldown--;
   if(c.essenceCombat.guardLeft>0&&ending===1&&c.essenceCombat.guardGrantedTurn!==g.turn-1)c.essenceCombat.guardLeft--;
   if(c.essenceCombat.guardLeft>0&&ending===0){} // status is measured in enemy turns
  }
  // Enemy just ended their turn; new current player can now use energy.
  if(g.winner===null)for(const c of g.players[g.active].field.filter(Boolean)){
   if(c.mode==='def'&&isSoul(c))absorb(g,c,g.active);
   if(g.winner!==null)break;
  }
  for(const c of g.players[g.active].field.filter(Boolean)){
   const e=statLayer(c);e.attacksThisTurn=0;e.lastToggle=0;
  }
  return ok;
 };
 const oldSwitch=switchPosition;
 switchPosition=function(g,idx){
  const result=oldSwitch(g,idx);if(result&&isEssenceDuel(g))statLayer(g.players[g.active].field[idx]);return result;
 };
 function condense(idx){
  if(!inputAllowed()||!isEssenceDuel(game)||game.active!==0)return false;
  const c=game.players[0].field[idx];if(!c||!isSoul(c)||c.mode!=='def')return false;
  const e=statLayer(c);if(e.soul<40||e.cooldown>0)return false;
  const amount=Math.floor(e.soul*.75);
  e.soul-=amount;e.condensed=Math.min(9000,e.condensed+amount);
  e.condenseLeft=3;e.condenseSlice=Math.ceil(e.condensed/3);e.cooldown=3;
  logEvent(game,dataOf(c).name+' verdichtet '+amount+' Seelenessenz (3 eigene Züge Cooldown).');
  render();return true;
 }
 function discharge(idx){
  if(!inputAllowed()||!isEssenceDuel(game)||game.active!==0)return false;
  const c=game.players[0].field[idx];if(!c||!isSoul(c)||c.mode!=='def')return false;
  const elite=(CARDS[c.id].soulRank||0)>=5;
  const buffer=game.players[0].field.some(x=>x&&x!==c&&CARDS[x.id].role==='guardian'&&dataOf(x).level>=5);
  const e=statLayer(c);
  if(!elite&&!buffer||e.lastDischarge===game.turn||e.soul<40)return false;
  const amount=e.soul;e.soul=0;e.lastDischarge=game.turn;
  addBurn(game,0,Math.floor(amount*.85),dataOf(c).name+' · aktive Entladung');
  render();if(game.winner!==null)showFinished();return true;
 }
 function predatorMode(idx){
  if(!inputAllowed()||!isEssenceDuel(game)||game.active!==0)return false;
  const c=game.players[0].field[idx];
  if(!c||c.id!==essence().chosen||CARDS[c.id].essenceSchool!=='predator')return false;
  const e=statLayer(c);
  if(e.attacksThisTurn>0||e.lastToggle===game.turn)return false;
  e.doubleChoice=e.doubleChoice===2?1:2;e.lastToggle=game.turn;render();return true;
 }
 function fusionRollBonus(g){
  if(!isEssenceDuel(g)||g.active!==0)return 0;
  const c=g.players[0].field.find(c=>c?.id===essence().chosen&&CARDS[c.id]?.essenceSchool==='fusion');
  return c?1+(activeSchool(g)==='fusion'&&perkRank(buffTier(g))>=3?1:0):0;
 }
 window.ArcaneEssenceCombat={condense,discharge,predatorMode,fusionRollBonus,statLayer,perkRank,evolvedLevel,essence,schools,schoolName,monsterIds};
})();