/* Arcane Duel – Predator Rudelführer & Überwältigung (solo PvE).
 * Instance-local powers only; saves serialize normally; no inventory mutation.
 * Symmetric AI research, classic PvP and 2v2 retain their current rule sets.
 */
'use strict';
(()=>{
 const POWERS=Object.freeze({
  swarm:{title:'Rudelinstinkt',desc:'Rudelbonus zusätzlich +0,5 Prozentpunkte je Predator.'},
  mark:{title:'Blutspur',desc:'Folgeangriffe auf markierte Ziele +3 % Schaden.'},
  token:{title:'Rudelruf',desc:'Alle 3 eigenen Züge ein schwacher, nicht fusionierbarer Predator-Token bei freiem Feldplatz.'}
 });
 const order=['swarm','mark','token'];
 const enabled=g=>!!g&&g.mode==='pve'&&!g.strategicTraining?.symmetricSides;
 const role=c=>c?.roleOverride||CARDS[c?.id]?.role||'combatant';
 const isPredator=c=>role(c)==='predator';
 const leader=(g,side)=>g?.players?.[side]?.field?.filter(c=>
  c?.fusion&&c.predatorLeader&&isPredator(c))
  .sort((a,b)=>Number(b.predatorLeader?.bornUid||b.uid)-Number(a.predatorLeader?.bornUid||a.uid))[0]||null;
 const has=(c,name)=>!!c?.predatorLeader?.powers?.includes(name);
 const round10=n=>Math.max(10,Math.round(n/10)*10);
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 function eligibleTokenSource(level){
  const cards=CARDS.filter(c=>c&&c.role==='predator'&&!c.fusionOnly&&
   !c.ace&&!c.fateOnly&&!c.essenceMonster&&c.level<=level);
  return cards.sort((a,b)=>b.level-a.level||a.id-b.id)[0]||null;
 }
 const fusion=fusedInstance;
 fusedInstance=function(g,materials,levels){
  if(Array.isArray(materials)&&materials.some(c=>c?.predatorToken)){
   if(g?.mode==='pve')logEvent(g,'Rudelruf-Tokens sind niemals Fusionsmaterial.');
   return null;
  }
  const result=fusion(g,materials,levels);
  if(!enabled(g)||!result?.fusion||!isPredator(result)||!Array.isArray(materials))return result;
  const n=clamp(materials.length,2,5);
  const pick=order.slice();
  for(let i=pick.length-1;i>0;i--){
   const j=randomInt(g,i+1),v=pick[i];pick[i]=pick[j];pick[j]=v;
  }
  const chosen=n===2?[]:n===3?pick.slice(0,1):n===4?pick.slice(0,2):order.slice();
  result.predatorLeader={materials:n,powers:chosen,bornUid:result.uid,ownTurns:0,createdTurn:g.turn};
  logEvent(g,'🐾 Rudelführer geprägt · '+n+' Materialien · '+
   (chosen.length?chosen.map(p=>POWERS[p].title).join(', '):'nur Rudelführer-Basisbonus'));
  return result;
 };
 const fuseChoices=fusionOptions;
 fusionOptions=function(g,levels,materials=[]){
  if(materials?.some(c=>c?.predatorToken))return [];
  return fuseChoices(g,levels,materials);
 };
 const priorEffective=effectiveAttack;
 effectiveAttack=function(g,a,d){
  const actual=priorEffective(g,a,d);
  if(!enabled(g)||!a||!isPredator(a))return actual;
  const owner=g.active,p=g.players[owner];
  if(!p?.field?.includes(a))return actual;
  let value=actual;
  const alpha=leader(g,owner),count=Math.min(5,p.field.filter(c=>c&&isPredator(c)).length);
  if(alpha){
   // The live base engine already applied 2% per active Predator. Replace it,
   // don't ADD a second copy. 2-material leader has 3%, special perk 3.5%.
   const base=1+count*.02, improved=1+count*(has(alpha,'swarm')?.035:.03);
   value=Math.floor(value*improved/base);
  }
  if(d){
   const hunt=g.predatorPursuit;
   if(hunt&&hunt.turn===g.turn&&hunt.owner===owner&&hunt.targetUid===d.uid&&
      !hunt.attackers.includes(a.uid)){
    const followups=Math.min(2,hunt.attackers.length);
    if(followups>0){
     const bonus=followups*.05+(alpha&&has(alpha,'mark')?.03:0);
     value=Math.floor(value*(1+bonus));
    }
   }
  }
  return value;
 };
 function clearStale(g){
  const m=g.predatorPursuit;
  if(!m)return;
  const target=g.players?.[1-m.owner]?.field?.some(c=>c?.uid===m.targetUid);
  if(m.turn!==g.turn||!target)g.predatorPursuit=null;
 }
 function removeTokenGraves(g){
  for(const p of g.players||[])if(p.graveyard)p.graveyard=p.graveyard.filter(c=>!c?.predatorToken);
 }
 const oldAttack=attack;
 attack=function(g,ai,di){
  if(!enabled(g))return oldAttack(g,ai,di);
  clearStale(g);
  const owner=g.active,attacker=g.players[owner]?.field?.[ai];
  const target=Number.isInteger(di)?g.players[1-owner]?.field?.[di]:null;
  const hunt=g.predatorPursuit;
  const same=attacker&&target&&isPredator(attacker)&&hunt&&hunt.turn===g.turn&&
   hunt.owner===owner&&hunt.targetUid===target.uid&&!hunt.attackers.includes(attacker.uid);
  const previous=same?hunt.attackers.length:0,followup=previous>0;
  const targetArt=target?dataOf(target).art:null;
  const result=oldAttack(g,ai,di);
  if(!result)return result;
  if(attacker&&target&&isPredator(attacker)){
   if(same)hunt.attackers.push(attacker.uid);
   else g.predatorPursuit={turn:g.turn,owner,targetUid:target.uid,attackers:[attacker.uid]};
   const dead=!(g.players[1-owner]?.field||[]).some(c=>c?.uid===target.uid);
   if(followup)impact(g,owner,di,dead,targetArt);
   if(dead)g.predatorPursuit=null;
  }
  removeTokenGraves(g);
  return result;
 };
 const previousOwnSlot=onOwnSlot;
 onOwnSlot=async function(idx,...args){
  if(enabled(game)&&game?.pending&&game.players[game.active]?.field?.[idx]?.predatorToken){
   toast('Rudelruf-Tokens dürfen nicht fusioniert werden.');
   return;
  }
  return previousOwnSlot(idx,...args);
 };
 const previousTurn=advanceTurn;
 advanceTurn=function(g){
  const was=g.turn;
  const result=previousTurn(g);
  if(!enabled(g))return result;
  removeTokenGraves(g);
  if(g.turn!==was)g.predatorPursuit=null;
  if(g.winner!==null)return result;
  const side=g.active,alpha=leader(g,side);
  if(!alpha||!has(alpha,'token')||g.turn===alpha.predatorLeader.createdTurn)return result;
  // Trigger every third OWN turn. Full board holds the ready summon without a reset.
  alpha.predatorLeader.ownTurns=Math.min(3,(alpha.predatorLeader.ownTurns||0)+1);
  if(alpha.predatorLeader.ownTurns<3)return result;
  const field=g.players[side].field,slot=field.findIndex(c=>!c);
  if(slot<0)return result;
  const lv=clamp(Math.floor(dataOf(alpha).level||1),1,10);
  const template=eligibleTokenSource(lv);
  if(!template)return result;
  const token=newInstance(g,template.id,side);
  // Use the actual same/nearest-lower-level Predator baseline, then heavily
  // downscale. Never grant it a separate template, drop or owned deck card.
  token.card={...token.card,level:lv,
   atk:round10(Math.max(10,(template.atk||100)*.55)),
   def:round10(Math.max(10,(template.def||100)*.55)),
   name:'Rudelgeist · Lv '+lv,
   desc:'Schwacher Rudelruf-Token. Greift an, markiert und zählt zum Schwarm. Nicht fusionierbar.'};
  token.roleOverride='predator';
  token.predatorToken={leaderUid:alpha.uid,level:lv};
  token.summonedTurn=g.turn;token.mode='atk';
  field[slot]=token;alpha.predatorLeader.ownTurns=0;
  logEvent(g,'🐾 Rudelruf: '+dataOf(token).name+' in Zone '+(slot+1)+'.');
  return result;
 };
 const earlierRender=render;
 render=function(...args){
  const result=earlierRender.apply(this,args);
  if(!enabled(game)||uiMode!=='duel')return result;
  clearStale(game);
  const viewer=game.mode==='pve'?0:game.active;
  for(const side of [0,1]){
   const row=document.getElementById(side===viewer?'ownRow':'enemyRow');
   const attr=side===viewer?'mine':'enemy',alpha=leader(game,side);
   for(let i=0;i<5;i++){
    const c=game.players[side].field[i];
    if(!c)continue;
    const card=row?.querySelector('[data-'+attr+'="'+i+'"] .board-creature');
    if(!card)continue;
    if(c===alpha){
     const crown=document.createElement('span');
     crown.className='ad198-leader-crown';crown.setAttribute('aria-label','Rudelführer');
     crown.title='Rudelführer · '+c.predatorLeader.materials+' Materialien';
     crown.innerHTML='<svg viewBox="0 0 32 28" width="29" height="27" aria-hidden="true" focusable="false">'+
      '<path d="M3 7l6.5 7L16 3l6.5 11L29 7l-3 16H6z" fill="#f4b94e" stroke="#fff2b7" stroke-width="1.5" stroke-linejoin="round"/>'+
      '<path d="M7 19h18M8 23h16" stroke="#9d481d" stroke-width="1.2"/>'+
      '<circle cx="16" cy="13" r="2.2" fill="#fff2b6"/>'+
      '</svg>';card.append(crown);
     card.classList.add('ad198-alpha-card');
    }
    if(c.predatorToken){
     const badge=document.createElement('span');badge.className='ad198-token-badge';
     badge.title='Rudelruf-Token · nicht fusionierbar';badge.textContent='🐾 TOKEN';
     card.append(badge);
    }
    const mark=game.predatorPursuit;
    if(mark&&mark.owner!==side&&mark.targetUid===c.uid&&mark.turn===game.turn){
     const cross=document.createElement('span');cross.className='ad198-crosshair';
     cross.setAttribute('aria-label','Von Predatoren markiert');
     cross.title='Jagdmarkierung · Folgeangriffe verstärkt';
     cross.innerHTML='<span></span>';card.append(cross);
    }
   }
  }
  return result;
 };
 function impact(g,owner,di,killed,art){
  if(game!==g||uiMode!=='duel'||animationSpeed==='instant'||
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)return;
  const row=document.getElementById(owner===0?'enemyRow':'ownRow');
  const attr=owner===0?'enemy':'mine',el=row?.querySelector('[data-'+attr+'="'+di+'"]');
  const r=el?.getBoundingClientRect();if(!r)return;
  const layer=document.getElementById('duelScreen');
  layer?.classList.add('ad198-pack-shake');
  setTimeout(()=>layer?.classList.remove('ad198-pack-shake'),310);
  const burst=document.createElement('span');
  burst.className='ad198-blood-impact';
  burst.style.left=(r.left+r.width/2)+'px';burst.style.top=(r.top+r.height/2)+'px';
  burst.setAttribute('aria-hidden','true');
  for(let i=0;i<19;i++){
   const d=document.createElement('i'),a=i*Math.PI*2/19;
   d.style.setProperty('--dx',Math.round(Math.cos(a)*(32+(i%5)*10))+'px');
   d.style.setProperty('--dy',Math.round(Math.sin(a)*(23+(i%6)*7))+'px');
   burst.append(d);
  }
  document.body.append(burst);setTimeout(()=>burst.remove(),580);
  if(!killed)return;
  const tear=document.createElement('span');tear.className='ad198-claw-finish';
  tear.style.left=(r.left+r.width/2)+'px';tear.style.top=(r.top+r.height/2)+'px';
  tear.style.width=r.width+'px';tear.style.height=r.height+'px';
  tear.setAttribute('aria-hidden','true');
  for(const side of ['left','right']){
   const half=document.createElement('img');half.className='ad198-torn-'+side;
   half.alt='';half.src=art||'';tear.append(half);
  }
  const claws=document.createElement('span');claws.className='ad198-claw-lines';
  claws.innerHTML='<i></i><i></i><i></i>';tear.append(claws);
  document.body.append(tear);setTimeout(()=>tear.remove(),860);
 }
 function howl(){
  if(animationSpeed==='instant'||document.hidden)return;
  const audio=window.ArcaneSoundscape?.getSettings?.();
  if(audio&&(!audio.enabled||audio.volume<=0))return;
  try{
   const Ctx=window.AudioContext||window.webkitAudioContext;
   if(!Ctx)return;
   const ctx=new Ctx(),t=ctx.currentTime;
   const master=ctx.createGain();master.gain.setValueAtTime(.0001,t);
   master.gain.exponentialRampToValueAtTime(.09*(audio?audio.volume/.35:1),t+.14);
   master.gain.exponentialRampToValueAtTime(.0001,t+1.4);
   master.connect(ctx.destination);
   for(const [base,detune,volume] of [[175,0,.7],[233,-18,.3]]){
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type='sawtooth';osc.frequency.setValueAtTime(base,t);
    osc.frequency.exponentialRampToValueAtTime(base*1.45,t+.45);
    osc.frequency.exponentialRampToValueAtTime(base*.90,t+1.35);
    osc.detune.value=detune;gain.gain.value=volume;
    osc.connect(gain);gain.connect(master);osc.start(t);osc.stop(t+1.45);
   }
   setTimeout(()=>ctx.close().catch(()=>{}),1650);
  }catch(_){} // Browser autoplay restrictions: never block summoning.
 }
 const esc=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 async function cinemaReveal({overlay,instance,wait}){
  const info=instance?.predatorLeader;
  if(!info||!overlay)return;
  const panel=overlay.querySelector('.evo-popup-panel'),rolls=panel?.querySelector('.evo-rolls');
  if(!panel||!rolls)return;
  overlay.classList.remove('evo-calc-absorb');overlay.classList.add('ad198-leader-reveal');
  rolls.innerHTML='<div class="ad198-pack-paw" aria-hidden="true">🐾</div>'+
   '<div class="ad198-awake-title">RUDELFÜHRER ERWACHT</div>'+
   '<div class="ad198-awake-sub">'+info.materials+' FUSIONSMATERIALIEN</div>'+
   '<div class="ad198-skill"><b>♛ Rudelführer</b><span>Alle Predatoren erhalten +3 % statt +2 % Schwarmbonus je Predator.</span></div>'+
   (info.powers.length?info.powers.map(p=>
    '<div class="ad198-skill"><b>'+esc(POWERS[p].title)+'</b><span>'+esc(POWERS[p].desc)+'</span></div>').join(''):
    '<div class="ad198-skill"><span>2 Materialien: Keine zusätzlichen Fähigkeiten.</span></div>');
  if(info.materials>=4)howl();
  await wait(info.powers.length?1950:1350);
  overlay.classList.remove('ad198-leader-reveal');
 }
 window.ArcanePredatorPack=Object.freeze({version:'19.8.0',POWERS,leader,
  cinemaReveal,isPredator,eligibleTokenSource});
})();