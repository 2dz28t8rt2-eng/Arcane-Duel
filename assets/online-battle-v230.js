/* Project authenticated online state into the ORIGINAL singleplayer duel.
 * Inputs become server commands; only confirmed snapshots enter the renderer.
 * Card UIDs belong to the view, while every command is tied to its revision.
 */
'use strict';
(()=>{
 if(!window.ArcaneDuoSelfHost229)return;
 const rules=window.ArcaneDuoRules,id=x=>document.getElementById(x),copy=x=>JSON.parse(JSON.stringify(x));
 const solo={render,saveDuelSnapshot,roundNumber,canAttack,effectiveAttack,onHand,markMaterial,clearSelection,prepareFusion,
  onOwnSlot,performAttack,switchMode,endTurn,runAi,askSurrender,rewardMatch,returnToMenu,fusionOptions,canCompleteHandFusion};
 let network=null,viewer=0,roomId='',lastRevision=-1,playing=false,serial=0,fusionContext=null,finishedKey=null;
 const online=()=>!!game?.online230;
 const client=()=>window.ArcaneOnline230;
 const mine=()=>network?.players[viewer];
 const motion=()=>animationSpeed!=='instant'&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
 const owner=(team,index)=>network.players.find(p=>p.team===team&&p.field[index]);
 const fieldSource=index=>({from:owner(0,index)?.seat===viewer?'field':'allyField',index});
 const handIndex=uid=>game.players[0].hand.findIndex(c=>c.uid===uid);
 const cardId=c=>typeof c==='number'?c:c?.id;
 function instance(c,ownerSeat){
  if(c==null)return null;const original=typeof c==='number'?{id:c}:c,t=CARDS[original.id];
  if(!t)throw Error('Diese Karte fehlt in der gemeinsamen Spielversion. Bitte neu laden.');
  const live=copy(original);
  return {...live,uid:live.uid||1000000+(++serial),onlineSeat:ownerSeat,owner:ownerSeat%2,
   mode:live.mode||'atk',attacked:!!live.used,roleOverride:live.role||t.role,
   card:{...t,atk:live.atk??t.atk,def:live.def??t.def,level:live.level??t.level,role:live.role||t.role},
   essenceCombat:{soul:live.soul||0,condensed:live.condensed||0,maxDef:live.maxDef??live.def??t.def,
    cooldown:live.soulCooldown||0,raidCooldown:live.raidCooldown||0,lastSoulAction:live.lastSoulAction===network.players[ownerSeat].ownTurns?network.turn+1:-1,
    lastDischarge:-1,drainPreference:live.drainPreference||0,lastDrainSwitch:live.lastDrainSwitch===network.players[ownerSeat].ownTurns?network.turn+1:-1,doubleChoice:live.essenceChoice||1,attacksThisTurn:live.essenceAttacks||0,lastToggle:live.essenceLastToggle===network.players[ownerSeat].ownTurns?network.turn+1:-1}};
 }
 function project(next,frame){
  const prior=network,old=online()?game:null,oldHand=old?.players[0]?.hand||[];
  network=next;
  if(!old||old.onlineDuelNo!==next.duelNo){
   game=createGame({mode:'pve',opponentId:Math.min(10,next.chapter),context:'tournament',deck:profile.activeDeck,fusionDeck:profile.fusionDeck});
   game.online230=true;game.onlineDuelNo=next.duelNo;game.id='online-'+roomId+'-'+next.duelNo;
   game.finishShown=false;game.rewardClaimed=false;game.findings={};game.essenceRules=true;
  }
  const g=game,own=next.players[viewer],enemySeat=next.activeSeat%2===1?next.activeSeat:1;
  g.turn=next.turn+1;g.onlineRound=next.round;g.active=next.activeSeat===viewer?0:1;
  g.maxLP=next.maxLP||next.teams[0].maxLP||rules.duoStartingLp(next.chapter);g.winner=next.winner;
  g.winReason=next.reason||next.log.at(-1)||'';g.summoned=own.summoned;g.surrendered=next.surrenderedBy!=null;
  g.selection=null;g.pending=null;g.materials=[];materialMode=false;
  g.log=[...next.log];g.totalFusions=[own.fusionsPerformed||0,0];g.essenceSchool=own.essence?.school||null;
  if(next.chapter>=11)g.lv1Saga={stage:next.chapter-10};else delete g.lv1Saga;
  const consumed=new Set(frame?.actor===viewer?frame.action.type==='fusion'?(frame.action.materials||[]).filter(x=>x.from==='hand').map(x=>x.index):['summon','replace'].includes(frame.action.type)?[frame.action.handIndex,...frame.action.discardIndices||[]]:[]:[]);
  const available=oldHand.filter((_,i)=>!consumed.has(i));
  const hand=own.hand.map((c,index)=>{const i=available.findIndex(old=>old.id===cardId(c));
   const result=instance(own.handFaces?.[index]||c,viewer);if(i>=0)result.uid=available.splice(i,1)[0].uid;return result;});
  for(const team of [0,1]){
   const p=next.players[team===0?viewer:enemySeat],target=g.players[team];
   Object.assign(target,{id:team,lp:next.teams[team].lp,shield:next.teams[team].shield||0,hand:team===0?hand:[],
    deck:p.deck.map(()=>null),originalDeck:team===0?[...(p.originalDeck||profile.activeDeck)]:[],fusionDeck:team===0?[...p.fusionDeck]:[],
    remainingFusion:team===0?[...p.remainingFusion]:[],field:rules.teamField(next,p).map((c,index)=>instance(c,owner(team,index)?.seat??p.seat)),
    graveyard:next.players.filter(x=>x.team===team).flatMap(x=>x.graveyard.map(c=>instance(c,x.seat))),
    enhancements:{},flatBonus:0,power:1});
  }
  const lv=own.lv1||{};
  g.lv1State={choices:(lv.choices||[]).map(id=>({id})),offers:(lv.offers||[]).map(o=>Number.isInteger(o)?{id:o,echo:true}:o),
   ghostSlots:(lv.ghostSlots||[]).map(c=>c?{kind:'card',card:instance(c,viewer)}:null),spiritCharges:lv.charges||0,
   tick:g.turn,float:lv.floatUsed||0,swarm:lv.swarmUsed||0,events:[]};
  g.onlineRevision=next.revision;lastRevision=next.revision;enemyPreviewIndex=null;
  uiMode='duel';id('menuScreen').hidden=true;id('menuNav').hidden=true;id('duelScreen').hidden=false;
  document.body.classList.add('online-duel-230');
  return {prior,g};
 }
 saveDuelSnapshot=function(...args){if(online())return;return solo.saveDuelSnapshot(...args);};
 roundNumber=function(g){return g?.online230?g.onlineRound||Math.ceil(g.turn/4):solo.roundNumber(g);};
 effectiveAttack=function(g,c,...rest){return g?.online230&&c?rules.attackValue(c):solo.effectiveAttack(g,c,...rest);};
  canAttack=function(g,c){return g?.online230?!!c&&g.winner===null&&!g.pending&&g.active===0&&c.mode==='atk'&&g.turn>1&&!c.attacked&&!(c.lv1LockedUntil>network.players[c.onlineSeat].ownTurns):solo.canAttack(g,c);};
 render=function(...args){
  const result=solo.render(...args);if(!online()||!network)return result;
  id('myName').textContent=network.players[0].name+' & '+network.players[2].name;
  id('enemyName').textContent=network.players[1].name+' & '+network.players[3].name;
  id('turnName').textContent=network.players[network.activeSeat].name+' ist am Zug';
  id('turnSeal').textContent=String(network.activeSeat+1);
  for(const label of document.querySelectorAll('.lane-caption span'))if(label.textContent==='5 MONSTERZONEN')label.textContent='7 MONSTERZONEN PRO TEAM';
  id('endTurnBtn').textContent='Zug beenden [Leertaste]';id('retryAiBtn').hidden=true;
  id('turnAdvice').firstChild&&(id('turnAdvice').firstChild.textContent=game.active===0?'Du bist am Zug.':'Warte auf '+network.players[network.activeSeat].name+'.');
  for(const button of document.querySelectorAll('#ownRow [data-mine]')){
   const c=game.players[0].field[Number(button.dataset.mine)];if(c){button.dataset.owner=String(c.onlineSeat);button.title=network.players[c.onlineSeat].name+' · '+dataOf(c).name;}
  }
  id('surrenderBtn').disabled=playing||game.winner!==null;
  if(game.active===0&&mine().lv1?.charges>0){
   const box=id('summonStage').querySelector('.lv1-summonbox');
   if(box&&!box.querySelector('[data-online-charge]'))box.insertAdjacentHTML('beforeend','<button class="btn tiny" data-online-charge>✧ Geist als Stufe-2-Fusionsmaterial · '+mine().lv1.charges+' verfügbar</button>');
  }
  for(const button of document.querySelectorAll('[data-lv1-station],[data-lv1-lock]')){
   const i=Number(button.dataset.index??button.dataset.lv1Lock);if(game.players[0].field[i]?.onlineSeat!==viewer)button.disabled=true;
  }
  id('restartBtn').hidden=true;id('homeBtn').hidden=true;
  return result;
 };
 async function command(action){
  if(!online()||playing||busy)return;
  busy=true;id('duelScreen').inert=true;
  try{await client().send(action);}
  catch(e){client().report(e);}
  finally{busy=false;id('duelScreen').inert=false;if(online())render();}
 }
 clearSelection=function(...args){if(!online())return solo.clearSelection(...args);if(!inputAllowed())return;
  game.pending=null;game.selection=null;game.materials=[];materialMode=false;delete game.discardKeepUid;render();};
 onHand=function(uid){const c=online()&&game.players[0].hand.find(c=>c.uid===uid);
  if(c?.lv1FromOffer&&inputAllowed()&&game.summoned){game.pending={kind:'normal',card:c,levels:[1],lv1Effect:true};game.selection=null;render();return;}
  return solo.onHand(uid);
 };
 fusionOptions=function(g,levels,materials,...args){
  if(g?.online230&&fusionContext)return rules.fusionOptions(network,viewer,fusionContext,catalog()).templates.map(id=>CARDS[id]);
  return solo.fusionOptions(g,levels,materials,...args);
 };
 canCompleteHandFusion=function(g,...args){return g?.online230?true:solo.canCompleteHandFusion(g,...args);};
 const catalog=()=>window.ArcaneOnlineCatalog230;
 function choose(materials,callback){
  try{const options=rules.fusionOptions(network,viewer,materials,catalog());
   if(!options.templates.length){toast('Keine passende Fusionskarte verfügbar.');return;}
   const objects=materials.map(m=>m.from==='hand'?game.players[0].hand[m.index]:game.players[0].field[m.index]);
   fusionContext=materials;chooseFusionModal(objects.map(c=>dataOf(c).level),objects,callback);fusionContext=null;
  }catch(e){fusionContext=null;client().report(e);}
 }
 prepareFusion=function(...args){if(!online())return solo.prepareFusion(...args);if(!inputAllowed()||game.summoned||game.pending)return;
  const materials=game.materials.map(uid=>({from:'hand',index:handIndex(uid)}));
  if(materials.length<2)return toast('Markiere mindestens zwei Handkarten.');
  choose(materials,templateId=>{game.pending={kind:'fusion',card:instance(templateId,viewer),levels:materials.map(m=>dataOf(game.players[0].hand[m.index]).level),onlineMaterials:materials,onlineTemplate:templateId};game.selection=null;render();});
 };
 onOwnSlot=function(index,choice){
  if(!online())return solo.onOwnSlot(index,choice);if(!inputAllowed())return;
  const pending=game.pending,old=game.players[0].field[index];
  if(!pending){if(old){game.selection={type:'field',idx:index};game.materials=[];render();}return;}
  const materials=pending.onlineMaterials||[{from:'hand',index:handIndex(pending.card.uid)}];
  if(old&&choice===undefined){
   openModal(modalHtml('BESETZTE ZONE','Ersetzen oder fusionieren?','✦','Beide Aktionen sind möglich. Die Beschwörung ist erst nach deiner Bestätigung endgültig.',
    '<p>Feld: '+escapeHtml(dataOf(old).name)+' · Hand: '+escapeHtml(dataOf(pending.card).name)+'</p>',
    '<button class="btn" id="ad207-back">ABBRECHEN</button><button class="btn primary" id="ad207-replace">↻ ERSETZEN</button><button class="btn" id="ad207-fuse">✧ FUSION</button>'));
   id('ad207-back').onclick=hideModal;id('ad207-replace').disabled=pending.kind!=='normal'||old.onlineSeat!==viewer;
   id('ad207-replace').onclick=()=>{hideModal();onOwnSlot(index,'replace');};id('ad207-fuse').onclick=()=>{hideModal();onOwnSlot(index,'fusion');};return;
  }
  if(old&&choice==='fusion'){choose([...materials,fieldSource(index)],templateId=>command({type:'fusion',materials:[...materials,fieldSource(index)],slot:index,templateId}));return;}
  if(pending.kind==='fusion')return command({type:'fusion',materials,slot:index,templateId:pending.onlineTemplate});
  const discardIndices=(pending.discardUids||[]).map(handIndex).filter(i=>i>=0);
  return command({type:old?'replace':'summon',handIndex:handIndex(pending.card.uid),slot:index,discardIndices});
 };
 performAttack=function(index,target){if(!online())return solo.performAttack(index,target);if(!inputAllowed())return;
  const c=game.players[0].field[index];if(!c)return;
  return command({type:'attack',slot:index,sourceSeat:c.onlineSeat,targetSeat:target==null?null:owner(1,target)?.seat,targetSlot:target});
 };
 switchMode=function(...args){if(!online())return solo.switchMode(...args);const index=game.selection?.idx,c=game.players[0].field[index];
  if(inputAllowed()&&c)return command({type:'switch',slot:index,sourceSeat:c.onlineSeat});};
 endTurn=function(...args){return online()?(inputAllowed()&&!game.pending?command({type:'end'}):undefined):solo.endTurn(...args);};
 runAi=function(...args){if(!online())return solo.runAi(...args);};
 askSurrender=function(...args){if(!online())return solo.askSurrender(...args);if(playing||game.winner!==null)return;
  openModal(modalHtml('AUFGEBEN','Dieses Duell aufgeben?','⚑','Das Duell zählt für dein Team als Niederlage. Aufgeben gibt keine Essenz, XP, Splitter, Dropladung oder Pack-Fortschritt. Eure Karten bleiben erhalten.','',
   '<button class="btn" id="surrenderCancel">WEITERSPIELEN</button><button class="btn primary" id="surrenderConfirm">AUFGEBEN</button>'));
  id('surrenderCancel').onclick=hideModal;id('surrenderConfirm').onclick=()=>{hideModal();command({type:'surrender'});};
 };
 rewardMatch=function(g){if(!g?.online230)return solo.rewardMatch(g);const outcome=client().getOutcome();
  if(!outcome||g.rewardClaimed)return null;g.rewardClaimed=true;client().install(outcome,{render:false});return outcome.outcome?.reward||null;};
 returnToMenu=function(...args){if(online()&&game.winner===null)return;const result=solo.returnToMenu(...args);if(uiMode==='menu'){document.body.classList.remove('online-duel-230');finishedKey=roomId+'-'+network?.duelNo;}return result;};
 id('fusionBtn').onclick=()=>prepareFusion();id('clearBtn').onclick=()=>clearSelection();id('switchBtn').onclick=()=>switchMode();
 id('directBtn').onclick=()=>{if(game?.selection?.type==='field')performAttack(game.selection.idx,null);};
 id('endTurnBtn').onclick=()=>endTurn();id('surrenderBtn').onclick=()=>askSurrender();id('retryAiBtn').onclick=()=>runAi();
 document.addEventListener('click',e=>{
  if(!online())return;
  const lvButton=e.target.closest?.('[data-lv1-choice],[data-lv1-offer],[data-lv1-ghost],[data-lv1-lock],[data-lv1-ghost-select],[data-lv1-ghost-target],[data-lv1-ghost-mode],[data-lv1-ghost-return-target],[data-lv1-station],[data-lv1-cancel],[data-online-charge]');
  if(lvButton){
   e.preventDefault();e.stopImmediatePropagation();if(!inputAllowed()||lvButton.disabled)return;
   const d=lvButton.dataset,s=game.lv1State;
   if(d.lv1Cancel!==undefined){s.selectedGhostSlot=null;s.selectedGhostReturn=null;s.selectedGhost=null;render();}
   else if(d.lv1Choice!==undefined)void command({type:'lv1Choose',index:Number(d.lv1Choice),kind:d.kind});
   else if(d.lv1Offer!==undefined)void command({type:'lv1ClaimOffer',index:Number(d.lv1Offer)});
   else if(d.lv1Lock!==undefined)void command({type:'lv1Lock',slot:Number(d.lv1Lock)});
   else if(d.onlineCharge!==undefined)void command({type:'lv1Charge'});
   else if(d.lv1Station!==undefined)void command({type:'lv1Station',slot:Number(d.index),ghostSlot:s.selectedGhostSlot});
   else if(d.lv1GhostReturnTarget!==undefined)void command({type:'lv1Return',slot:Number(d.lv1GhostReturnTarget),ghostSlot:s.selectedGhostReturn});
   else if(d.lv1GhostMode!==undefined)void command({type:'lv1GhostSwitch',ghostSlot:Number(d.lv1GhostMode)});
   else if(d.lv1GhostSelect!==undefined){s.selectedGhost=Number(d.lv1GhostSelect);render();}
   else if(d.lv1GhostTarget!==undefined){const target=Number(d.lv1GhostTarget);void command({type:'attack',area:'ghost',slot:s.selectedGhost,targetSeat:target<0?null:owner(1,target)?.seat,targetSlot:target<0?null:target});}
   else if(d.lv1Ghost!==undefined){const i=Number(d.lv1Ghost);if(s.ghostSlots[i]){s.selectedGhostReturn=i;s.selectedGhostSlot=null;}else s.selectedGhostSlot=i;render();}
   return;
  }
  const button=e.target.closest?.('[data-essence-combat],[data-essence-drain],[data-essence-target]');if(!button)return;
  e.preventDefault();e.stopImmediatePropagation();if(!inputAllowed()||button.disabled)return;
  const slot=game.selection?.idx,c=game.players[0].field[slot];if(!c)return;
  const action={slot,sourceSeat:c.onlineSeat};
  if(button.dataset.essenceTarget!==undefined){const target=Number(button.dataset.essenceTarget);Object.assign(action,{type:'soulRaid',targetSlot:target,targetSeat:owner(1,target)?.seat});}
  else if(button.dataset.essenceDrain)Object.assign(action,{type:'soulFocus',stat:button.dataset.essenceDrain});
  else Object.assign(action,{type:{condense:'soulCondense',discharge:'soulDischarge',predator:'essencePredatorMode'}[button.dataset.essenceCombat],mode:c.essenceChoice===2?1:2});
  void command(action);
 },true);
 async function animateFrame(frame){
  const before=network,action=frame.action,actor=frame.actor,team=actor%2;
  const previousHand=new Set(game.players[0].hand.map(c=>c.uid));
  if(before&&motion()&&action.type==='attack'){
   const strike=frame.state.lastStrike||action;
   await window.ArcaneAttackFX?.play(game,team,action.slot,strike.targetSlot??null);sound('attack');
  }
  if(before&&motion()&&action.type==='soulDischarge'){
   const node=document.querySelector('#'+(team===0?'ownRow':'enemyRow')+' [data-'+(team===0?'mine':'enemy')+'="'+action.slot+'"]');
   await window.ArcaneSoulBurst207?.playBetween(node,id(team===0?'enemyBanner':'myBanner'),Math.max(0,before.teams[1-team].lp-frame.state.teams[1-team].lp));
  }
  project(frame.state,frame);render();
  if(!before||!motion())return;
  const next=frame.state;
  if(next.predatorImpact?.followups&&next.predatorImpact.revision!==before.predatorImpact?.revision){
   const hit=next.predatorImpact;
   const target=before.players[hit.targetSeat].field[hit.targetSlot];
   window.ArcanePredatorPack?.impact(game,hit.ownerSeat%2,hit.targetSlot,hit.broken,CARDS[target?.id]?.art);
  }
  const arrivals=game.players[0].hand.filter(c=>!previousHand.has(c.uid)).length;
  if(arrivals)await new Promise(resolve=>setTimeout(resolve,450+(arrivals-1)*440));
  if(next.fateEvent?.ownerSeat===viewer&&next.fateEvent.cardIds&&JSON.stringify(next.fateEvent)!==JSON.stringify(before.fateEvent)){
   game.fateEvent={owner:0,cards:next.fateEvent.cardIds,score:next.fateEvent.score};await fateAnimation(game);
  }
  for(const side of [0,1]){const damage=before.teams[side].lp-next.teams[side].lp;
   if(damage>0)await window.ArcaneDamageFX?.play(side,damage);}
  for(const p of next.players){
   const old=before.players[p.seat],side=p.team;
   for(let index=0;index<p.field.length;index++){
    const c=p.field[index],prior=old.field.find(x=>x&&x.uid===c?.uid);if(!c||!prior)continue;
    if(c.soul>prior.soul){
     const targets=before.players.filter(x=>x.team!==side).flatMap(o=>o.field.flatMap((target,i)=>{
      if(!target)return [];const after=next.players[o.seat].field.find(x=>x?.uid===target.uid);
      return !after||after.atk<target.atk||after.def<target.def?[{uid:target.uid,index:i}]:[];
     }));
     window.ArcaneDefenderFX?.record(game,{type:'absorb',owner:side,uid:c.uid,index,targets,gain:c.soul-prior.soul,activeRaid:action.type==='soulRaid',element:CARDS[c.id]?.element});
    }
    if(action.type==='end'&&c.def>prior.def){
     const guardian=next.players.filter(x=>x.team===side).flatMap(x=>x.field.map((c,i)=>({c,i}))).find(x=>x.c?.role==='guardian'&&x.c.mode==='def'&&x.c.uid!==c.uid);
     if(guardian)window.ArcaneDefenderFX?.record(game,{type:'heal',owner:side,uid:c.uid,index,fromUid:guardian.c.uid,fromIndex:guardian.i,amount:c.def-prior.def});
    }
   }
  }
  if(action.type==='attack'&&next.lastStrike?.targetSeat!=null){
   const strike=next.lastStrike,old=before.players[strike.targetSeat].field[strike.targetSlot],now=next.players[strike.targetSeat].field[strike.targetSlot];
   if(old?.mode==='def'&&['guardian','soul'].includes(old.role)){
    const amount=Math.max(0,before.teams[team].lp-next.teams[team].lp),lostSoul=Math.max(0,(old.soul||0)-(now?.uid===old.uid?now.soul||0:0)),burn=Math.min(amount,Math.floor(lostSoul*.5));
    if(burn)window.ArcaneDefenderFX?.record(game,{type:'soulBurn',owner:1-team,uid:old.uid,index:strike.targetSlot,amount:burn,soulLost:lostSoul});
    if(amount>burn)window.ArcaneDefenderFX?.record(game,{type:'counter',owner:1-team,uid:old.uid,index:strike.targetSlot,amount:amount-burn});
   }
  }
  await window.ArcaneDefenderFX?.flush(game);
  if(['summon','replace','fusion'].includes(action.type)){
   const c=game.players[team].field[action.slot];if(!c)return;
   if(action.type==='fusion'){
    game.cinemaActive=true;
    const materials=[];for(const source of [actor,actor^2])for(const card of next.players[source].graveyard.slice(before.players[source].graveyard.length))if(card.from==='fusion')materials.push({...CARDS[card.id]});
    try{await window.ArcaneFusionCinema?.play({instance:c,materials,battle:game,card:CARDS[c.id],level:c.card.level,target:document.querySelector('#'+(team===0?'ownRow':'enemyRow')+' [data-'+(team===0?'mine':'enemy')+'="'+action.slot+'"]'),variant:'full',wait:ms=>new Promise(r=>setTimeout(r,ms)),playSound:sound});}
    finally{game.cinemaActive=false;}
   }else{sound('summon');await window.ArcaneSummonFX?.land(game,c);}
  }
  if(next.predatorShowdown&&next.predatorShowdown.newUid!==before.predatorShowdown?.newUid){
   const event=copy(next.predatorShowdown);event.old={...CARDS[event.old.id],...event.old};event.new={...CARDS[event.new.id],...event.new};
   await window.ArcanePredatorShowdown199?.play(event);
  }
 }
 async function accept(payload,context){
  if(playing)return;viewer=context.seat;roomId=context.room;
  const next=payload.state;if(next.status==='finished'&&!online()&&finishedKey===roomId+'-'+next.duelNo)return;
  if(online()&&next.revision<=lastRevision)return;
  playing=true;busy=true;id('duelScreen').inert=true;
  try{
   if(!window.ArcaneOnlineCatalog230){const response=await fetch('assets/duo-card-catalog-v160.json');const data=await response.json();window.ArcaneOnlineCatalog230=Object.fromEntries(data.cards.map(c=>[c.id,c]));}
   const frames=(payload.presentation||[]).filter(f=>f.state.revision>lastRevision&&['active','finished'].includes(f.state.status));
   if(!online()||!frames.length){
    const opening=!online()&&next.status==='active';hideModal();project(next);render();
    if(opening){id('duelScreen').classList.add('ad-opening-hand-wait');id('hand').setAttribute('aria-hidden','true');await window.ArcaneBattleFX?.beginCinema();busy=true;}
   }
   else for(const frame of frames)await animateFrame(frame);
   if(lastRevision<next.revision){project(next);render();}
   if(next.status==='finished'&&!game.finishShown){
    client().setOutcome(await client().loadOutcome());busy=false;showFinished();
    const again=id('modalAgain');if(again){again.textContent='ERNEUT EINLADEN';again.disabled=viewer!==0;again.onclick=()=>{returnToMenu();client().duelMenu().catch(client().report);};}
   }
  }finally{playing=false;busy=false;id('duelScreen').inert=false;if(online())render();}
 }
 window.ArcaneOnlineBattle230=Object.freeze({accept,playing:()=>playing,revision:()=>lastRevision});
})();
