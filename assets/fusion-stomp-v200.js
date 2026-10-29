/* Arcane Duel v20.0 — material-scaled fusion beam / attack essence cost.
 * Core combat runs synchronously; the scene is strictly presentation-only.
 * No card is removed until the cinematic has completed and attack() commits.
 */
'use strict';
(()=>{
 const STOMP={3:[70],4:[50,50],5:[50,50,30]};
 const ELEMENTS={FEUER:['#ff4c19','#ffb451'],WASSER:['#1ea9ff','#92efff'],ERDE:['#74dc55','#ddff9a'],WIND:['#48e4a7','#dbfff2'],LICHT:['#ffce40','#fff9c8'],DUNKEL:['#a05aff','#f1b5ff']};
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const roleOf=c=>c?.roleOverride||CARDS[c?.id]?.role||'combatant';
 const active=g=>g?.mode==='pve';
 const materialsOf=c=>clamp(Number.isInteger(c?.materialsUsed)?c.materialsUsed:2,2,5);
 function adjacent(field,center,owner,count){
  const found=new Set([center]),list=[],right=owner===0?1:-1;
  function next(direction){for(let gap=1;gap<field.length;gap++){
   const index=center+direction*gap;
   if(index>=0&&index<field.length&&field[index]&&!found.has(index))return index;
  }return -1;}
  const preference=count===3?[[right,-right]]:count===4?[[right,-right],[-right,right]]:
   count===5?[[right,-right],[-right,right],[right,-right]]:[];
  for(const directions of preference){let index=-1;
   for(const direction of directions){index=next(direction);if(index>=0)break;}
   if(index>=0){found.add(index);list.push(index);}
  }
  return list;
 }
 function percentByHit(count,extra,bonus=0){const base=STOMP[count]||[];
  return base.slice(0,extra).map(v=>v+clamp(bonus,0,12));}
 function materialBoost(c){
  const counts=c?.stompMaterials||{},res=counts.resonator||0,all=counts.combatant||0;
  // Roll at the moment of fusion, never during attack. This keeps saves and
  // seeded replay consistent, including a legitimately rolled zero bonus.
  return Number.isInteger(c?.stompBonusPP)?clamp(c.stompBonusPP,0,12):Math.min(12,res*3+all);
 }
 // Each actual target consumes 3% of BOTH bound combat stats. Percentages
 // use the same pre-attack snapshot, so four targets cost 12%, not compounding.
 function fatigue(atk,def,targets){return {atk:Math.ceil(atk*.03*targets),def:Math.ceil(def*.03*targets)};}
 function secondary(g,attacker,target,index,power,pct,owner){
  if(!target)return null;
  const foe=g.players[1-owner],value=dataOf(target),mode=target.mode;
  const original=Math.max(0,Math.floor(power*pct/100));
  const defender=['guardian','soul'].includes(roleOf(target));
  const immune=target.essenceCombat?.guardLeft>0;
  let dealt=original,defLost=0,soulLost=0,condensedLost=0,destroyed=false;
  if(mode==='atk'&&!immune&&original>=value.atk){destroyed=true;}
  else if(!immune){
   // A warded target first expends its bound layers, exactly as a normal DEF
   // attack does. In ATK, failed ATK destruction damages underlying DEF.
   if(mode==='def'&&defender)dealt=Math.floor(original*.65);
   let rest=dealt;
   const layer=target.essenceCombat;
   if(layer){condensedLost=Math.min(rest,Math.max(0,layer.condensed||0));layer.condensed-=condensedLost;rest-=condensedLost;
    soulLost=Math.min(rest,Math.max(0,layer.soul||0));layer.soul-=soulLost;rest-=soulLost;}
   defLost=Math.min(rest,Math.max(0,target.card?.def||0));
   if(target.card)target.card.def=Math.max(0,target.card.def-defLost);
   destroyed=!!target.card&&target.card.def===0;
  }
  if(destroyed){foe.graveyard.push(target);foe.field[index]=null;}
  const hit=dealt;
  logEvent(g,'✦ FUSIONS-STOMP · '+value.name+' ('+pct+' %): '+
   (destroyed?'vernichtet':immune?'Letztes Bollwerk blockiert':
    '−'+defLost+' DEF'+(soulLost?' / −'+soulLost+' Seele':'')+'.'));
  let counter=0;
  if(mode==='def'&&defender&&!immune&&!destroyed&&foe.field[index]===target){
   // A surviving defender may counter at 35% of current ATK. Splash
   // counter damage is only 40% of that normal counter, rounded down.
   const base=Math.floor(Math.max(0,value.atk)*.35);
   counter=Math.floor(base*.4);
   if(counter>0){const actual=damagePlayer(g,owner,counter);counter=actual;
    g.damageDealt[foe.id]=(g.damageDealt[foe.id]||0)+actual;
    logEvent(g,value.name+' · Stomp-Gegenschlag: '+actual+' LP (40 % des 35%-Gegenschlags, nur bei Überleben).');
    window.ArcaneDefenderFX?.record(g,{type:'counter',owner:foe.id,uid:target.uid,index,element:value.element,amount:actual});}
  }
  return {index,uid:target.uid,pct,raw:hit,defLost,destroyed,counter};
 }
 const previousAttack=attack;
 attack=function(g,ai,di){
  const owner=g?.active,p=g?.players?.[owner],foe=g?.players?.[1-owner],a=p?.field?.[ai];
  if(!active(g)||!a||!canAttack(g,a)||di!==null&&!foe?.field?.[di]||di===null&&foe?.field?.some(Boolean))
   return previousAttack(g,ai,di);
  const count=a.fusion?materialsOf(a):2;
  const before={atk:Math.max(0,a.card?.atk||0),def:Math.max(0,a.card?.def||0),fatigue:a.attackFatigue||0};
  // Capture the whole opposing board before the primary attack. Some defender
  // abilities redirect the primary target inside the previous attack reducer;
  // its returned `di` is therefore the only authoritative impact position.
  const board=count>=3&&di!==null?foe.field.slice():null;
  const powers=board?board.map(target=>target?Math.max(0,effectiveAttack(g,a,target)):0):[];
  const boost=materialBoost(a);
  const result=previousAttack(g,ai,di);
  if(!result)return result;
  const hits=[];
  const targetIndex=Number.isInteger(result.di)?result.di:di;
  const n=board&&Number.isInteger(targetIndex)?adjacent(board,targetIndex,owner,count):[];
  const percents=percentByHit(count,n.length,boost);
  if(n.length){for(let i=0;i<n.length;i++){
    const index=n[i],v={index,card:board[index],pct:percents[i],power:powers[index]};
    // The primary attack already committed. A target may have disappeared
    // through another triggered action; never strike a new occupant by index.
    if(foe.field[v.index]!==v.card)continue;
    const hit=secondary(g,a,v.card,v.index,v.power,v.pct,owner);
    if(hit){hits.push(hit);if(hit.destroyed)result.destroyed.push(foe.id+':'+v.index);}
   }}
  // Replace the legacy -30 ATK attack fatigue with a symmetric ATK/DEF
  // essence loss. A dead attacker paid with its entire existence already.
  if(p.field[ai]===a&&a.card){
   const oldPaid=Math.max(0,(a.attackFatigue||0)-before.fatigue);
   a.card.atk=Math.max(0,a.card.atk+oldPaid);
   const cost=fatigue(before.atk,before.def,1+hits.length);
   a.card.atk=Math.max(0,a.card.atk-cost.atk);
   a.card.def=Math.max(0,a.card.def-cost.def);
   a.attackFatigue=before.fatigue+cost.atk;
   a.stompDecayTotal=(a.stompDecayTotal||0)+cost.def;
   logEvent(g,dataOf(a).name+': Magieverschleiß durch '+(1+hits.length)+' Ziel(e) −'+cost.atk+' ATK / −'+cost.def+' DEF.');
  }
  if(hits.length){result.stomp={count,element:dataOf(a).element,bonusPP:boost,hits};
   if(foe.lp===0&&g.winner===null)conclude(g,owner,'Fusions-Stomp hat die gegnerischen LP auf 0 reduziert.');
   if(p.lp===0&&g.winner===null)conclude(g,1-owner,'Stomp-Gegenschläge haben die LP auf 0 reduziert.');}
  return result;
 };
 // Preserve additional material context across saves. New fields are
 // optional: old saved duels keep standard unboosted Stomp behavior.
 const previousFused=fusedInstance;
 fusedInstance=function(g,instances,levels){
  // Absolute rule: ACEs (including enemy signature ACEs), Fate cards and
  // summoned tokens remain whole and can never be consumed by a fusion.
  if(Array.isArray(instances)&&instances.some(c=>isFusionForbidden(c,g)))return null;
  const result=previousFused(g,instances,levels);
  if(!result?.fusion||!active(g)||!Array.isArray(instances))return result;
  const roles={};for(const c of instances){const role=roleOf(c);roles[role]=(roles[role]||0)+1;}
  result.stompMaterials=roles;
  let addition=0;
  for(let i=0;i<(roles.resonator||0);i++)addition+=2+randomInt(g,3);
  for(let i=0;i<(roles.combatant||0);i++)addition+=1+randomInt(g,2);
  result.stompBonusPP=Math.min(12,addition);
  return result;
 };
 const previousValidate=validateDuelSnapshot;
 validateDuelSnapshot=function(raw){
  const restored=previousValidate(raw);
  function reattach(source,card){if(!source||!card||!card.fusion||source.uid!==card.uid)return;
   const parts=source.stompMaterials;
   if(parts&&typeof parts==='object'&&!Array.isArray(parts)&&
     Object.keys(parts).every(k=>['predator','guardian','soul','resonator','combatant'].includes(k))&&
     Object.values(parts).every(v=>Number.isInteger(v)&&v>=0&&v<=5)&&
     Object.values(parts).reduce((s,v)=>s+v,0)<=5){card.stompMaterials={...parts};
     card.stompBonusPP=Number.isInteger(source.stompBonusPP)?clamp(source.stompBonusPP,0,12):
      clamp((parts.resonator||0)*3+(parts.combatant||0),0,12);}
   if(Number.isInteger(source.stompDecayTotal)&&source.stompDecayTotal>=0&&source.stompDecayTotal<=10000)
    card.stompDecayTotal=source.stompDecayTotal;
  }
  for(let i=0;i<2;i++){
   const old=raw.players?.[i],now=restored.players?.[i];if(!old||!now)continue;
   for(const area of ['hand','field','graveyard']){
    const before=old[area]||[],after=now[area]||[];
    for(let j=0;j<Math.min(before.length,after.length);j++)reattach(before[j],after[j]);
   }
  }
  reattach(raw.pending?.card,restored.pending?.card);
  return restored;
 };
 const originalDecayDescription=typeof decayDescription==='function'?decayDescription:null;
 if(originalDecayDescription)decayDescription=function(c){const html=originalDecayDescription(c)
   .replace('Angriff: zusätzlich −30 ATK.','Angriff: −3 % ATK und DEF je tatsächlich getroffenem Ziel.')
   .replace(' ATK durch Angriffe.',' ATK durch Angriffe (DEF sinkt ebenfalls).');
  if(!c?.fusion||materialsOf(c)<3||game?.mode!=='pve')return html;
  const count=materialsOf(c),splash=percentByHit(count,(STOMP[count]||[]).length,materialBoost(c));
  return html+'<p><b>Fusions-Strahl · '+count+' Materialien:</b> Hauptziel 100 %; Nebenziele '+
   splash.map(n=>n+' %').join(' / ')+' (Blickrichtung des Angreifers, keine Doppeltreffer). '+
   'Jeder Treffer verbraucht zusätzlich 3 % eigene ATK und DEF. '+
   'Wächter-Gegenschläge durch Nebentreffer verursachen 40 % ihrer üblichen LP-Wirkung.</p>';
 };
 const originalFX=window.ArcaneAttackFX;
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const reduced=()=>animationSpeed==='instant'||document.body?.classList.contains('ad-motion-disabled')||
  window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const center=node=>{const r=node?.getBoundingClientRect?.();return r&&r.width&&r.height?
  {x:r.left+r.width/2,y:r.top+r.height/2}:null;};
 function boardPoint(owner,index){const id=owner===0?'ownRow':'enemyRow',attr=owner===0?'mine':'enemy';
  return center(document.querySelector('#'+id+' [data-'+attr+'="'+index+'"] .board-creature')||
   document.querySelector('#'+id+' [data-'+attr+'="'+index+'"]'));}
 function scene(g,owner,ai,di){
  const count=materialsOf(g.players[owner]?.field?.[ai]),field=g.players[1-owner].field;
  const indexes=adjacent(field,di,owner,count),from=boardPoint(owner,ai),to=boardPoint(1-owner,di);
  if(!from||!to)return null;
  const targets=indexes.map(index=>boardPoint(1-owner,index)).filter(Boolean);
  const col=ELEMENTS[dataOf(g.players[owner].field[ai]).element]||['#af88ff','#ffffff'];
  const host=document.createElement('div');host.className='ad-stomp-scene';host.setAttribute('aria-hidden','true');
  host.style.setProperty('--stomp-color',col[0]);host.style.setProperty('--stomp-light',col[1]);
  const w=window.innerWidth||1280,h=window.innerHeight||800;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 '+w+' '+h);svg.setAttribute('width',w);svg.setAttribute('height',h);
  function beam(a,b,kind,branch=0){const d='M '+a.x+' '+a.y+' L '+b.x+' '+b.y;
   for(const layer of ['glow','core']){
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d',d);path.setAttribute('class','ad-stomp-ray '+kind+' ad-stomp-'+layer);
    path.setAttribute('pathLength','100');
    if(kind==='ad-stomp-secondary')path.style.setProperty('--stomp-branch-delay',branch*55+'ms');
    svg.append(path);
   }
  }
  beam(from,to,'ad-stomp-primary');
  targets.forEach((t,i)=>beam(to,t,'ad-stomp-secondary',i));
  const core=document.createElement('div');core.className='ad-stomp-impact';core.style.left=to.x+'px';core.style.top=to.y+'px';
  const bursts=[core];targets.forEach((t,i)=>{
   const n=document.createElement('div');n.className='ad-stomp-impact ad-stomp-small';
   n.style.left=t.x+'px';n.style.top=t.y+'px';
   // Match each burst's start to the END of its corresponding 190ms ray.
   n.style.setProperty('--stomp-branch-delay',i*55+'ms');
   bursts.push(n);
  });
  for(const burst of bursts){const amount=burst===core?30:16;
   for(let i=0;i<amount;i++){const spark=document.createElement('i');
    spark.style.setProperty('--stomp-angle',(i*137.508)+'deg');
    spark.style.setProperty('--stomp-distance','-'+(52+(i%7)*13)+'px');
    spark.style.setProperty('--stomp-delay',(i%7)*13+'ms');burst.append(spark);}
  }
  host.append(svg,...bursts);document.body.append(host);
  return host;
 }
 function beamSound(){
  // Original synthesized burst; no external sound assets or extra downloads.
  try{
   const config=window.ArcaneSoundscape?.getSettings?.();
   if(config?.enabled===false||config?.volume===0)return;
   const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
   const ctx=new Audio(),now=ctx.currentTime,level=clamp(config?.volume??.35,0,1);
   const out=ctx.createGain();out.gain.value=Math.min(.16,level*.25);out.connect(ctx.destination);
   const tone=ctx.createOscillator(),envelope=ctx.createGain();
   tone.type='sawtooth';tone.frequency.setValueAtTime(215,now);
   tone.frequency.exponentialRampToValueAtTime(58,now+.48);
   envelope.gain.setValueAtTime(.0001,now);
   envelope.gain.exponentialRampToValueAtTime(.28,now+.035);
   envelope.gain.exponentialRampToValueAtTime(.0001,now+.57);
   tone.connect(envelope);envelope.connect(out);tone.start(now);tone.stop(now+.59);
   const bass=ctx.createOscillator(),impact=ctx.createGain();
   bass.type='sine';bass.frequency.setValueAtTime(110,now+.24);
   bass.frequency.exponentialRampToValueAtTime(35,now+.62);
   impact.gain.setValueAtTime(.0001,now);
   impact.gain.setValueAtTime(.0001,now+.24);
   impact.gain.exponentialRampToValueAtTime(.75,now+.262);
   impact.gain.exponentialRampToValueAtTime(.0001,now+.69);
   bass.connect(impact);impact.connect(out);bass.start(now+.24);bass.stop(now+.7);
   setTimeout(()=>ctx.close().catch(()=>{}),920);
  }catch(_){/* Audio permissions must never cancel a duel. */}
 }
 async function beamFX(g,owner,ai,di){
  if(!g||di===null||reduced()||g!==game||uiMode!=='duel')return false;
  const card=g.players[owner]?.field?.[ai];if(!card?.fusion||materialsOf(card)<3)return false;
  const host=scene(g,owner,ai,di);if(!host)return false;
  const table=document.querySelector('.table-surface');
  try{
   beamSound();host.classList.add('ad-stomp-firing');await delay(260);
   table?.classList.add('ad-stomp-shake');host.classList.add('ad-stomp-splitting');
   // Three branches arrive at 190/245/300ms after the split begins.
   // Keep the scene alive through the last collision, rings and sparks.
   await delay(680);host.classList.add('ad-stomp-afterglow');await delay(200);
   return true;
  }finally{host.remove();table?.classList.remove('ad-stomp-shake');}
 }
 window.ArcaneAttackFX=Object.freeze({...originalFX,version:'20.3-stomp',
  play:async(g,owner,ai,di)=>await beamFX(g,owner,ai,di)||await originalFX?.play?.(g,owner,ai,di)||false});
 window.ArcaneFusionStomp=Object.freeze({version:'20.3',adjacent,percentByHit,fatigue,materialBoost});
})();
