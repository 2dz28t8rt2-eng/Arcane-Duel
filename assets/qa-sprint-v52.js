/* Arcane Duel 5.2 — tactical QA, saga safety, clear previews.
 * PvE-specific changes; no inventory/card ID migration.
 */
'use strict';
(()=>{
 const role=c=>c?.roleOverride||CARDS[c?.id]?.role||'combatant';
 const saga=()=>window.ArcaneLv1Saga;
 const lumiraId=()=>window.ArcaneLv1Swarm?.ids?.ace;
 const isResearch=g=>!!g?.lv1Saga&&g.mode==='pve';
 const levelBudget=window.ArcaneLevelBudget?.budget;
 // Keep ACE cards superior to ordinary creatures of the same stage.
 // Existing Lumira (exact 111/111) and school summons are deliberately exempt.
 const improved=[];
 for(const c of CARDS){
  if(!c?.rpg||!c.ace||c.lv1Special||c.essenceMonster||c.retired||
     c.level<1||c.level>10||typeof levelBudget!=='function')continue;
  const target=Math.round(levelBudget(c.level)*1.90/10)*10;
  const current=Math.max(1,c.atk+c.def);
  if(current>=target)continue;
  const atk=Math.max(50,Math.round(target*(c.atk/current)/10)*10);
  c.atk=atk;c.def=Math.max(50,target-atk);improved.push(c.id);
 }
 // Never allow fate rescue to replace a research duel's intended deck/hand.
 const priorFate=maybeFate;
 maybeFate=function(g,id){
  if(isResearch(g))return false;
  return priorFate(g,id);
 };
 // In the research story, Lumira must remain a genuine card. Never use her as
 // a fusion ingredient, including the old Chapter V "Lumira's Fall" recipe.
 const priorChoice=chooseAiAction;
 chooseAiAction=function(g,policy='balanced'){
  if(!isResearch(g)||g.active!==1||g.winner!==null)return priorChoice(g,policy);
  const foe=g.players[1],ace=lumiraId(),lumira=foe.hand.find(c=>c.id===ace);
  if(!g.pending&&!g.summoned&&lumira&&foe.field.some(c=>!c))
   return {type:'normal',uid:lumira.uid};
  let a=priorChoice(g,policy);
  if(a?.type==='fusion'&&lumira&&a.uids?.includes(lumira.uid)){
   const replacements=foe.hand.filter(c=>c.uid!==lumira.uid&&!a.uids.includes(c.uid)&&!c.fate);
   const ids=a.uids.filter(uid=>uid!==lumira.uid);
   for(const c of replacements){if(ids.length>=2)break;ids.push(c.uid);}
   if(ids.length>=2)a={...a,uids:ids};
   else{g.aiPhase='positions';a=priorChoice(g,policy);}
  }
  if(a?.type==='place'&&foe.field[a.idx]?.id===ace){
   const pending=g.pending;
   const legal=foe.field.findIndex(c=>!c);
   if(legal>=0){a={...a,idx:legal};}
   else{
    const other=foe.field.findIndex((c,i)=>
      i!==a.idx&&c?.id!==ace&&pending?.levels?.length&&
      fusionOptions(g,[...pending.levels,dataOf(c).level],[pending.card,c])
       .some(template=>foe.remainingFusion.includes(template.id)));
    if(other>=0)a={...a,idx:other};
    else a={type:'arcane-recover-pending'};
   }
  }
  // Old Chapter-V logic may have raised the scripted fusion intent while
  // evaluating a candidate. Clear it after protecting Lumira.
  g.lv1FanaticCorruptIntent=false;
  return a;
 };
 // The AI must be able to complete its turn even with a field full of
 // cards it cannot legally fuse. Cleanly abandon only the unplaceable
 // pending action; never overwrite the protected Lumira.
 const applyBeforeRecovery=applyAiAction;
 applyAiAction=function(g,a){
  if(a?.type!=='arcane-recover-pending')return applyBeforeRecovery(g,a);
  if(!isResearch(g)||g.active!==1||!g.pending)return false;
  if(g.pending.kind==='fusion'&&g.pending.card)
   g.players[1].graveyard.push(g.pending.card);
  logEvent(g,'Der Forscher zieht seine nicht ausführbare Beschwörung zurück: Lumira bleibt geschützt.');
  g.pending=null;g.summoned=true;g.aiPhase='positions';
  return true;
 };
 // Extra guard for old/saved pending fusions: chosen Lumira is never consumed.
 const priorPlace=placePending;
 placePending=function(g,idx,...args){
  if(isResearch(g)&&g.active===1&&g.players[1].field[idx]?.id===lumiraId())return null;
  const result=priorPlace(g,idx,...args);
  if(result?.card&&dataOf(result.card)?.ace)
   requestAnimationFrame(()=>requestAnimationFrame(()=>aceAwakening(g,result.card)));
  return result;
 };
 // Counter the special case where old NPC logic still tries a scripted final fusion.
 const priorPrepare=prepareHandFusion;
 prepareHandFusion=function(g,uids,...args){
  if(isResearch(g)&&g.active===1&&uids?.some(uid=>
    g.players[1].hand.some(c=>c.uid===uid&&c.id===lumiraId())))return false;
  return priorPrepare(g,uids,...args);
 };
 const priorAttack=attack;
 attack=function(g,ai,di){
  const victim=isResearch(g)&&g.active===0&&Number.isInteger(di)?
    g.players[1].field[di]:null;
  const result=priorAttack(g,ai,di);
  if(result&&victim?.id===lumiraId()&&!g.players[1].field.includes(victim)){
   const sc=saga()?.state?.();
   const count=Math.min(99,(sc?.lumiraDeaths||0)+1);
   if(sc)sc.lumiraDeaths=count;
   const lines=[
    'Lumira ...? Nein. Das war nur ein Zufall. Sie wird beim nächsten Mal antworten!',
    'Du hast sie schon wieder besiegt? Ich ... ich muss etwas übersehen haben.',
    'Warum wehrst du dich nicht, Lumira? Habe ich dir all die Jahre das Falsche beigebracht?',
    'Du behandelst mein größtes Wunder wie eine gewöhnliche Karte. Vielleicht ... vielleicht bist nicht du das Problem.',
    'Ich habe alles für dich gegeben, Lumira. Warum fühle ich mich jetzt wie ein Narr?'
   ];
   g.lv1FanaticDeathDialoguePending=lines[Math.min(lines.length-1,count-1)];
   logEvent(g,'Der Fanatiker verzweifelt: '+g.lv1FanaticDeathDialoguePending);
   saveProfile();
  }
  return result;
 };
 // Block the natural (and level-dependent) ATK/DEF decay ONLY on the own turn
 // in which an active Seelenraub took place. Ordinary attack wear remains.
 const previousRaid=window.ArcaneEssenceCombat?.soulRaid;
 if(previousRaid){
  const api=window.ArcaneEssenceCombat;
  // Frozen bindings are not mutated; later combat button dispatch is captured
  // by a delegated listener and the marker is set from the successful action.
  document.getElementById('duelScreen')?.addEventListener('click',event=>{
   const button=event.target.closest('button[data-essence-target]');
   if(!button||!game||game.mode!=='pve'||game.active!==0)return;
   const selected=game.selection?.type==='field'?game.players[0].field[game.selection.idx]:null;
   if(!selected||role(selected)!=='soul'||selected.mode!=='def'||button.disabled)return;
   const old=selected.essenceCombat?.lastSoulAction;
   queueMicrotask(()=>{
    if(game&&selected.essenceCombat?.lastSoulAction===game.turn&&old!==game.turn)
      selected.arcaneDecaySkipTurn=game.turn;
   });
  },true); 
 }
 const previousEnd=advanceTurn;
 advanceTurn=function(g,...args){
  if(!g||g.mode!=='pve'||g.pending||g.winner!==null)return previousEnd(g,...args);
  const turn=g.turn,owner=g.active;
  const paused=g.players[owner].field.filter(c=>c?.card&&c.arcaneDecaySkipTurn===turn)
    .map(c=>({c,atk:c.card.atk,def:c.card.def,age:c.decayAge||0,total:c.decayTotal||0}));
  const ok=previousEnd(g,...args);
  if(ok===false||g.turn===turn)return ok;
  for(const x of paused){
   if(!g.players[owner].field.includes(x.c))continue;
   x.c.card.atk=Math.max(x.c.card.atk,x.atk);
   x.c.card.def=Math.max(x.c.card.def,x.def);
   x.c.decayAge=x.age;x.c.decayTotal=x.total;
   delete x.c.arcaneDecaySkipTurn;
   logEvent(g,dataOf(x.c).name+': aktiver Seelenraub schützt in diesem Zug vor Zerfall.');
  }
  return ok;
 };
 // A 30% shield jab gives Guardians active tactical pressure without
 // bypassing protection through direct LP attacks.
 function canBash(g,c){
  return g?.mode==='pve'&&g.active===0&&g.turn>1&&g.winner===null&&
   !g.pending&&!busy&&!aiRunning&&role(c)==='guardian'&&c.mode==='def'&&!c.attacked&&!c.switched;
 }
 function shieldBash(idx,targetIdx){
  const g=game,attacker=g?.players[0]?.field[idx],target=g?.players[1]?.field[targetIdx];
  if(!attacker||!target||!canBash(g,attacker))return false;
  const amount=Math.max(1,Math.floor(dataOf(attacker).atk*.30));
  const stat=target.mode==='def'?'def':'atk';
  const done=Math.min(Math.max(0,target.card?.[stat]||0),amount);
  if(!done)return false;
  target.card[stat]=Math.max(0,target.card[stat]-done);
  attacker.attacked=true;attacker.arcaneAttackTurn=g.turn;
  attacker.card.atk=Math.max(0,attacker.card.atk-30);
  attacker.attackFatigue=(attacker.attackFatigue||0)+30;
  if(stat==='def'&&target.card.def===0){
   g.players[1].field[targetIdx]=null;g.players[1].graveyard.push(target);
  }
  logEvent(g,dataOf(attacker).name+' · Schildstoß: −'+done+' '+stat.toUpperCase()+
   ' gegen '+dataOf(target).name+' (30 % ATK, kein direkter LP-Schaden).');
  saveDuelSnapshot();render();return true;
 }
 const previousRender=render;
 render=function(...args){
  const result=previousRender(...args);
  if(uiMode!=='duel'||!game)return result;
  const ctrl=document.querySelector('#duelScreen .control-stack');
  ctrl?.querySelector('.ad-shield-actions')?.remove();
  const c=game.selection?.type==='field'?game.players[0].field[game.selection.idx]:null;
  if(ctrl&&canBash(game,c)&&game.players[1].field.some(Boolean)){
   const idx=game.selection.idx;
   const list=game.players[1].field.map((t,i)=>t?
    '<button type="button" class="btn" data-shield-bash="'+idx+':'+i+'">⚔ '+
     escapeHtml(dataOf(t).name)+' · 30 % ATK</button>':'').join('');
   ctrl.insertAdjacentHTML('afterbegin','<section class="ad-shield-actions"><strong>🛡 Schildstoß · DEF-Angriff</strong>'+
    '<p>Einmal pro Zug: 30 % aktueller ATK als gezielter ATK-/DEF-Schaden. Kein direkter LP-Treffer; verbraucht die Angriffsaktion.</p>'+list+'</section>');
  }
  return result;
 };
 document.getElementById('duelScreen')?.addEventListener('click',event=>{
  const btn=event.target.closest('[data-shield-bash]');if(!btn)return;
  const parts=btn.dataset.shieldBash.split(':').map(Number);
  shieldBash(parts[0],parts[1]);
 });
 // Clear, role-correct labels for newly rolled unbound fusion templates.
 const previousFull=fullCardHtml,previousBoard=cardHtml;
 const relabel=html=>html.replace(/>(?:ALLROUNDER|Allrounder)</g,'>RESONATOR<');
 fullCardHtml=function(c,...args){
  const html=previousFull(c,...args);
  return c?.fusion&&c.roleOverride==='resonator'?relabel(html):html;
 };
 cardHtml=function(c,...args){
  let html=previousBoard(c,...args);
  if(c?.fusion&&c.roleOverride==='resonator')html=relabel(html);
  if(isResearch(game)&&c?.id===lumiraId()){
   html=html.replace('class="board-creature','class="board-creature ad-lumira-field');
  }
  return html;
 };
 // A true ACE arrival: element-tinted halo, pulsing runes and impact burst.
 function aceAwakening(g,card){
  if(g!==game||uiMode!=='duel'||animationSpeed==='instant'||
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)return;
  const owner=g.players.findIndex(p=>p.field.includes(card));
  const idx=g.players[owner]?.field.indexOf(card);
  if(idx<0)return;
  const side=owner===(g.mode==='pve'?0:g.active)?'mine':'enemy';
  const cell=document.querySelector('#'+(side==='mine'?'ownRow':'enemyRow')+
   ' [data-'+side+'="'+idx+'"] .board-creature');
  if(!cell)return;
  const r=cell.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  const hue={FEUER:'#ff784b',WASSER:'#72daff',ERDE:'#c1a968',WIND:'#b3ffe8',LICHT:'#ffe1a2',DUNKEL:'#cda8ff'}[dataOf(card).element]||'#ffe2a1';
  const host=document.createElement('div');
  host.className='ad-ace-awakening';host.style.left=cx+'px';host.style.top=cy+'px';
  host.style.setProperty('--ad-ace-awake',hue);host.setAttribute('aria-hidden','true');
  host.innerHTML='<div class="ad-ace-halo"></div><div class="ad-ace-rune">✧ ✦ ✧</div>'+
   Array.from({length:20},(_,i)=>'<i style="--i:'+i+';--a:'+(i*18)+'deg"></i>').join('');
  document.body.append(host);cell.classList.add('ad-ace-landing');
  setTimeout(()=>{host.remove();cell.classList.remove('ad-ace-landing');},1600);
 }
 // Fate ritual waits up to 15 seconds, but a deliberate click dismisses it.
 fateAnimation=async function(g){
  const evt=g?.fateEvent;if(!evt)return;
  const layer=document.createElement('div');layer.className='fate-cinema ad-fate-persistent';
  layer.setAttribute('role','dialog');layer.setAttribute('aria-label','Schicksalszug');
  layer.tabIndex=0;
  layer.innerHTML='<div class="fate-cinema-aura"></div>'+
   '<div class="fate-cinema-title">✦ DAS SCHICKSAL ERWACHT ✦</div>'+
   '<div class="fate-cinema-sub">Duellant '+(evt.owner+1)+' · Eine letzte Chance</div>'+
   '<div class="fate-cinema-cards">'+evt.cards.map((id,i)=>{
    const fid=FATE_CARD_IDS.indexOf(id),art=window.ArcaneFateVisuals?.artFor?.(fid);
    if(fid<0||!art)throw new Error('Fehlendes Schicksalsmonster-Artwork für '+id);
    return '<div class="fate-reveal" style="--fate-i:'+i+'"><div class="fate-reveal-inner">'+
     '<div class="fate-reveal-back">✧</div><div class="fate-reveal-front"><img src="'+
      art+'" alt=""><b>✦ '+escapeHtml(FATE_NAMES[fid])+'</b><span>✦ SCHICKSAL ✦</span></div></div></div>';
   }).join('')+'</div>'+
   '<div class="fate-cinema-foot">Fünf Karten · Unverschmelzbar · Klicken zum Fortfahren</div>'+
   '<button type="button" class="ad-fate-close">FORTFAHREN ✦</button>';
  document.body.append(layer);
  sound('summon');
  await new Promise(resolve=>{
   let done=false;
   const finish=()=>{if(done)return;done=true;clearTimeout(timer);layer.removeEventListener('click',finish);document.removeEventListener('keydown',keys);resolve();};
   const keys=e=>{if(e.key==='Escape'||e.key==='Enter')finish();};
   const timer=setTimeout(finish,15000);
   layer.addEventListener('click',finish);
   document.addEventListener('keydown',keys);
  });
  layer.remove();if(g.fateEvent===evt)g.fateEvent=null;
 };
 // Force enemy card inspection to stay in the LEFT battlefield inspector.
 // Capture phase runs before legacy click handlers that opened full-screen modals.
 document.getElementById('enemyRow')?.addEventListener('click',event=>{
  const node=event.target.closest('[data-enemy]');
  if(!node||!game||uiMode!=='duel')return;
  if(game.selection?.type==='field'&&inputAllowed())return; // genuine attack
  const idx=Number(node.dataset.enemy);
  const owner=game.mode==='pve'?1:1-game.active;
  if(!game.players[owner]?.field[idx])return;
  event.preventDefault();event.stopImmediatePropagation();
  enemyPreviewIndex=idx;game.selection=null;
  renderCardPreview();
  document.getElementById('largeCardPreview')?.classList.add('ad-inspected');
 },true);
 // Full House takes precedence over Drilling (3 + 2 materials).
 // Verify and normalize the roll's displayed combination, never invent a bonus.
 const previousFuse=fusedInstance;
 fusedInstance=function(g,materials,levels){
  const result=previousFuse(g,materials,levels);
  if(!result||g?.mode!=='pve'||g.active!==0||levels?.length!==5)return result;
  const frequencies=[...new Set(levels)].map(l=>levels.filter(x=>x===l).length).sort((a,b)=>b-a);
  if(frequencies[0]!==3||frequencies[1]!==2)return result;
  const suffix=result.pattern?.includes('Elementharmonie')?' · Elementharmonie':'';
  result.pattern='Full House'+suffix;
  if(result.rollMath?.combo)result.rollMath.combo.name=result.pattern;
  return result;
 };
  window.ArcaneQaSprint52=Object.freeze({version:'5.2',improvedAces:improved,shieldBash});
 if(uiMode==='menu')renderMenu();else if(uiMode==='duel')render();
})();