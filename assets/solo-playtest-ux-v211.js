/* Arcane Duel 21.1 - beginner-friendly duel presentation.
 * No changes to RNG, combat stats, inventory validation or save schema.
 */
'use strict';
(()=>{
 const byId=id=>document.getElementById(id);
 const reduce=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const esc=v=>escapeHtml(String(v??''));
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const own=c=>window.ArcaneEssenceCombat?.roleOf?.(c)||c?.roleOverride||CARDS[c?.id]?.role;
 const soulLoss=new WeakMap(),fieldPops=new WeakMap(),leaderSeen=new WeakMap(),postRewards=new WeakMap();
 const profileStore=key=>{try{return window.localStorage?.getItem(key);}catch{return null;}};
 const saveFlag=key=>{try{window.localStorage?.setItem(key,'yes');}catch{}};
 const onboardingKey='arcane-duel-leader-help-v211';
 let delayAI=null,zoom=100;

 try{const saved=Number(profileStore('arcane-duel-board-zoom-v211'));if(saved>=70&&saved<=115)zoom=saved;}catch{}
 const format=n=>Number(n||0).toLocaleString('de-AT');
 function zoomBar(){
  const host=document.querySelector('#duelScreen .table-surface');
  if(!host)return;
  host.style.setProperty('--ad211-board-zoom',String(zoom/100));
  let bar=byId('ad211-board-tools');
  if(!bar){
   bar=document.createElement('div');bar.id='ad211-board-tools';
   bar.innerHTML='<span class="ad211-lp-meter">♥ Du <b id="ad211-my-lp"></b> <span>·</span> Gegner <b id="ad211-enemy-lp"></b></span>'+
    '<label>Feldgröße <input id="ad211-board-zoom" aria-label="Duellfeld verkleinern oder vergrößern" type="range" min="70" max="115" step="5"></label>'+
    '<output id="ad211-zoom-output"></output>';
   host.prepend(bar);
   byId('ad211-board-zoom').addEventListener('input',event=>{
    const next=Number(event.target.value);if(!Number.isFinite(next))return;
    zoom=Math.max(70,Math.min(115,next));host.style.setProperty('--ad211-board-zoom',String(zoom/100));
    byId('ad211-zoom-output').textContent=zoom+' %';
    try{window.localStorage?.setItem('arcane-duel-board-zoom-v211',String(zoom));}catch{}
   });
  }
  byId('ad211-board-zoom').value=String(zoom);
  byId('ad211-zoom-output').textContent=zoom+' %';
  if(game?.players?.length===2){
   byId('ad211-my-lp').textContent=format(game.players[0].lp);
   byId('ad211-enemy-lp').textContent=format(game.players[1].lp);
  }
  bar.hidden=uiMode!=='duel';
 }
 function pop(g,owner,index,message,kind='soul'){
  if(game!==g||uiMode!=='duel')return;
  const selector='#'+(owner===0?'ownRow':'enemyRow')+' [data-'+(owner===0?'mine':'enemy')+'="'+index+'"]';
  const cell=document.querySelector(selector);if(!cell)return;
  const tag=document.createElement('span');tag.className='ad211-field-pop ad211-'+kind;
  tag.textContent=message;tag.setAttribute('role','status');cell.append(tag);
  setTimeout(()=>tag.remove(),reduce()?1400:1950);
 }
 function queuePop(g,entry){if(!g)return;const q=fieldPops.get(g)||[];q.push(entry);fieldPops.set(g,q);}
 function showPops(g){
  const q=fieldPops.get(g)||[];fieldPops.delete(g);
  for(const e of q)pop(g,e.owner,e.index,e.text,e.kind);
 }
 function startLeaderIntro(g){
  if(!g||g.mode!=='pve'||uiMode!=='duel'||profileStore(onboardingKey))return;
  const leaders=g.players?.[0]?.field?.filter(c=>c?.predatorLeader)||[];
  if(!leaders.length)return;
  const seen=leaderSeen.get(g)||new Set();
  const fresh=leaders.find(c=>!seen.has(c.uid));leaders.forEach(c=>seen.add(c.uid));leaderSeen.set(g,seen);
  if(!fresh)return;
  const powers=(fresh.predatorLeader?.powers||[]).map(key=>window.ArcanePredatorPack?.POWERS?.[key]).filter(Boolean);
  let tries=0;
  const attempt=()=>{
   if(game!==g||uiMode!=='duel'||profileStore(onboardingKey)||g.winner!==null)return;
   if(busy||g.cinemaActive||!byId('overlay')?.classList.contains('hidden')){
    if(++tries<50)setTimeout(attempt,750);return;
   }
   const perks=powers.length?'<p><b>Deine neuen Fähigkeiten:</b></p><ul>'+
    powers.map(p=>'<li><b>'+esc(p.title)+'</b>: '+esc(p.desc)+'</li>').join('')+'</ul>':
    '<p>Je nach Fusion kann dein Rudelführer zusätzliche Fähigkeiten erhalten. Du findest sie direkt an der Karte.</p>';
   saveFlag(onboardingKey);
   openModal(modalHtml('✦ DEIN ERSTER RUDELFÜHRER','Dein Rudel hat jetzt einen Anführer','♛',
    'Stark! Ein Rudelführer hilft deinen Predatoren, als Team mehr auszurichten.',
    '<p><b>So geht\'s:</b> Mit jedem weiteren Predator auf deinem Feld wird dein Rudel stärker. Ein Rudelführer erhöht den gemeinsamen Bonus von 2 % auf 3 % je Predator.</p>'+perks+
    '<p>Du musst nichts aktivieren: Die Rudelboni wirken automatisch. Die besonderen Fähigkeiten siehst du auf deiner Karte.</p>',
    '<button class="btn primary" id="ad211-leader-ok">VERSTANDEN</button>'));
   byId('ad211-leader-ok').onclick=hideModal;
  };
  setTimeout(attempt,1850);
 }
 function abilities(){
  const g=game,bar=byId('largeCardPreview'),essence=window.ArcaneEssenceCombat;
  if(!g||g.mode!=='pve'||!g.essenceRules||uiMode!=='duel'||!bar||!essence)return;
  if(bar.querySelector('.essence-actions'))return; // Native actions were already rendered.
  const uid=Number(bar.querySelector('.hand-card[data-instance-uid]')?.dataset.instanceUid);
  let index=g.selection?.type==='field'?g.selection.idx:-1;
  if(index<0||!g.players[0].field[index]||
    (Number.isFinite(uid)&&g.players[0].field[index].uid!==uid))
   index=g.players[0].field.findIndex(c=>c?.uid===uid);
  const c=g.players[0].field[index];
  if(!c||own(c)!=='soul'||c.mode!=='def')return;
  const e=essence.statLayer(c),spent=e.lastSoulAction===g.turn;
  const inactive=g.active!==0||g.winner!==null||busy||aiRunning;
  const disabled=(condition)=>condition||inactive?' disabled':'';
  let html='<div class="essence-actions ad211-soul-actions" data-ad211-index="'+index+'"><strong>✦ Deine Seelenzehrer-Fähigkeiten</strong>'+
    '<small>Gesammelte Seelenessenz: '+format(e.soul)+'. Ab 40 Essenz kannst du eine Fähigkeit einsetzen. Jede Fähigkeit benötigt DEF-Stellung.</small>'+
    '<button class="btn" data-essence-combat="condense"'+disabled(spent||e.cooldown>0||e.soul<40)+'>◇ Essenz als Schutz speichern'+(e.cooldown?' · noch '+e.cooldown+' Züge':'')+'</button>'+
    '<button class="btn" data-essence-combat="discharge"'+disabled(spent||e.soul<40||e.lastDischarge===g.turn)+'>✦ Seelenstoß · Essenz als Schaden entladen</button>';
  if(e.raidCooldown===0){
   g.players[1].field.forEach((target,j)=>{
    if(target?.card&&target.card.atk+target.card.def>0)
     html+='<button class="btn" data-essence-target="'+j+'"'+disabled(spent)+'>◇ Seelenraub: '+esc(dataOf(target).name)+'</button>';
   });
  }else html+='<small>Seelenraub in '+e.raidCooldown+' Zügen wieder bereit.</small>';
  bar.insertAdjacentHTML('beforeend',html+'</div>');
 }
 const duel=byId('duelScreen');
 duel?.addEventListener('click',event=>{
  const button=event.target.closest('[data-essence-combat],[data-essence-target],[data-essence-drain]');
  if(!button||!game||button.disabled)return;
  const preview=byId('largeCardPreview');
  const index=Number(preview?.querySelector('.ad211-soul-actions')?.dataset.ad211Index);
  if(Number.isInteger(index)&&index>=0&&game.players[0].field[index])
   game.selection={type:'field',idx:index};
 },true);
 const oldRender=render;
 render=function(...args){
  const result=oldRender.apply(this,args);
  if(uiMode==='duel'&&game){zoomBar();showPops(game);abilities();startLeaderIntro(game);}
  return result;
 };
 const oldPreview=renderCardPreview;
 renderCardPreview=function(...args){
  const result=oldPreview.apply(this,args);
  if(uiMode==='duel')abilities();
  return result;
 };
 const oldPlace=placePending;
 placePending=function(g,idx,...other){
  const result=oldPlace.call(this,g,idx,...other);
  if(result?.card&&own(result.card)==='soul'&&result.card.mode==='def')
   queuePop(g,{owner:g.active,index:idx,text:'✦ SEELENSCHUTZ',kind:'stance'});
  if(result?.card&&own(result.card)==='resonator')
   queuePop(g,{owner:g.active,index:idx,text:'✧ RESONANZ AKTIV',kind:'resonance'});
  return result;
 };
 const oldSwitch=switchPosition;
 switchPosition=function(g,idx,...other){
  const result=oldSwitch.call(this,g,idx,...other);
  const c=g.players[g.active]?.field?.[idx];
  if(result&&c&&own(c)==='soul'&&c.mode==='def')
   queuePop(g,{owner:g.active,index:idx,text:'✦ SEELENSCHUTZ',kind:'stance'});
  return result;
 };
 const oldAdvance=advanceTurn;
 advanceTurn=function(g,...args){
  const ending=g?.active;
  const before=g?.players?.[ending]?.field?.map(c=>c&&own(c)==='soul'?
   {uid:c.uid,soul:c.essenceCombat?.soul||0}:null)||[];
  const result=oldAdvance.call(this,g,...args);
  if(game===g&&g.winner===null){
   const after=g.players[ending]?.field||[];
   before.forEach((prev,i)=>{
    const c=after[i],lost=prev&&c?.uid===prev.uid?prev.soul-(c.essenceCombat?.soul||0):0;
    if(lost>0)queuePop(g,{owner:ending,index:i,text:'Seelenessenz −'+format(lost)+' · natürlicher Zerfall',kind:'decay'});
   });
  }
  return result;
 };
 const oldRunAi=runAi;
 runAi=async function(...args){
  const g=game;
  if(!g||g.mode!=='pve'||g.active!==1)return oldRunAi.apply(this,args);
  if(delayAI&&delayAI.g===g)return delayAI.promise;
  const pending={g,promise:null};
  pending.promise=(async()=>{
   await sleep(reduce()?800:1500);
   if(game===g&&g.active===1&&g.winner===null)return oldRunAi.apply(this,args);
  })().finally(()=>{if(delayAI===pending)delayAI=null;});
  delayAI=pending;return pending.promise;
 };
 const oldFinished=showFinished;
 showFinished=function(...args){
  const g=game;
  if(!g||g.finishShown||g.winner===null)return oldFinished.apply(this,args);
  const previousLevel=playerLevel(profile),priorTraining=profile.trainingWins,
   priorLoot=profile.lastLoot;
  const result=oldFinished.apply(this,args);
  if(game!==g||!g.finishShown)return result;
  if(g.winner===0&&g.mode==='pve'){
   const cards=[];
   if(profile.lastLoot!==priorLoot&&Number.isInteger(profile.lastLoot?.card))cards.push(profile.lastLoot.card);
   if(priorTraining<3&&profile.trainingWins===3&&typeof TRAINING_FUSION!=='undefined')cards.push(TRAINING_FUSION);
   if(Number.isInteger(g.roleChallengeCard))cards.push(g.roleChallengeCard);
   const level=playerLevel(profile);
   if(level>previousLevel||cards.length){
    postRewards.set(g,{level:level>previousLevel?level:null,cards:[...new Set(cards)]});
    document.body.classList.add('ad211-deferring-rewards');
   }
  }
  return result;
 };
 const oldMenu=returnToMenu;
 returnToMenu=function(...args){
  const g=game,post=g&&postRewards.get(g);
  const result=oldMenu.apply(this,args);
  if(g&&uiMode==='menu'){
   document.body.classList.remove('ad211-deferring-rewards');
   postRewards.delete(g);
   if(post){
    let attempts=0;
    const show=()=>{
     if(uiMode!=='menu'||game)return;
     if(!byId('overlay')?.classList.contains('hidden')){
      if(++attempts<8)setTimeout(show,600);return;
     }
     const content=(post.level?'<p class="ad211-reward-level">✦ Du hast Spielerlevel '+post.level+' erreicht!</p>':'')+
      post.cards.map(id=>'<div class="ad211-earned-card"><b>✦ Neue Karte erhalten: '+esc(CARDS[id]?.name||'Monster')+'</b>'+fullCardHtml({id})+'</div>').join('');
     openModal(modalHtml('DEIN FORTSCHRITT','Das hast du freigeschaltet','✦',
      'Dein letztes Duell hat sich gelohnt. Das ist neu in deiner Sammlung:',content,
      '<button class="btn primary" id="ad211-earn-close">WEITER ZUM MENÜ</button>'));
     byId('ad211-earn-close').onclick=hideModal;
    };
    setTimeout(show,reduce()?450:2150);
   }
  }
  return result;
 };
 zoomBar();
 window.ArcaneSoloPlaytestUX211=Object.freeze({version:'21.1',zoomBar});
})();
