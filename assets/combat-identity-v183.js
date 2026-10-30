/* v18.3 – Each combat role feels different. Read-only, bounded visual feedback. */
'use strict';
(()=>{
  const ROLES=Object.freeze({
    predator:{name:'Predator',symbol:'✦'},guardian:{name:'Wächter',symbol:'⬟'},
    soul:{name:'Seelenzehrer',symbol:'◆'},resonator:{name:'Resonator',symbol:'✧'},
    combatant:{name:'Allrounder',symbol:'◇'}
  });
  const soloHistory=new WeakMap();
  const duoHistory=new Map();
  let activeNotice=null;
  let cooldownUntil=0;
  const safeValue=n=>Math.max(0,Math.floor(Number(n)||0));
  const nameFor=r=>ROLES[r]?.name||'Monster';
  const roleFor=c=>ROLES[c?.role]?c.role:'combatant';
  const resonantPct=c=>roleFor(c)==='resonator'?10+10*Math.min(2,safeValue(c.resonance)):
    roleFor(c)==='combatant'&&!c.fusion?4+4*Math.min(3,safeValue(c.resonance)):0;

  function state(c,owner,index,swarm=0){
    const role=roleFor(c);
    return {uid:c.uid,owner,index,role,mode:c.mode,attacked:!!(c.attacked||c.used),
      condensed:safeValue(c.essenceCombat?.condensed??c.condensed),
      resonance:safeValue(c.resonance),guardLeft:safeValue(c.essenceCombat?.guardLeft??c.guardLeft),
      swarm:Math.min(5,swarm),fusion:!!c.fusion};
  }
  function eventFor(previous,current,{duo=false}={}){
    const c=current,role=c.role;
    if(!previous){
      if(role==='predator')return {kind:'predator',label:duo?'Predator · Schwarm +'+c.swarm*2+' %':''};
      if(role==='guardian'&&c.mode==='def')return {kind:'guardian',label:'Wächter · Schutz bereit'};
      if(role==='soul'&&c.mode==='def')return {kind:'soul',label:'Seelenzehrer · Essenz bereit'};
      if(role==='resonator')return {kind:'resonator',label:'Resonator · Fusionsresonanz'};
      return null;
    }
    if(role==='soul'&&c.condensed>previous.condensed){
      return {kind:'soul',label:'Verdichten · ATK +'+Math.floor(c.condensed*.5)+
        ' · DEF +'+c.condensed};
    }
    if(role==='guardian'&&c.guardLeft>previous.guardLeft)
      return {kind:'guardian',label:'Wächter · Bollwerk aktiviert'};
    if(role==='guardian'&&previous.mode!=='def'&&c.mode==='def')
      return {kind:'guardian',label:'Wächter · Schildstellung'};
    if(resonantPct(c)>0&&c.resonance>previous.resonance)
      return {kind:'resonator',label:'Resonanz · +'+resonantPct(c)+' % Fusion'};
    if(role==='predator'&&!previous.attacked&&c.attacked)
      return {kind:'predator',label:''};
    return null;
  }
  function motionEnabled(){
    if(document.hidden||document.body?.classList?.contains('ad-motion-disabled'))return false;
    if(typeof animationSpeed!=='undefined'&&animationSpeed==='instant')return false;
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)return false;
    return true;
  }
  function paint(slot,c){
    const role=roleFor(c),config=ROLES[role];
    slot.classList.add('ad183-role','ad183-role-'+role);
    if((role==='guardian'||role==='soul')&&c.mode==='def')slot.classList.add('ad183-defending');
    if(role==='soul'&&c.condensed>0)slot.classList.add('ad183-condensed');
    if((role==='combatant'||role==='resonator')&&c.resonance>0)slot.classList.add('ad183-charged');
    const crest=document.createElement('span');
    crest.className='ad183-role-crest';crest.textContent=config.symbol;
    crest.title=config.name;crest.setAttribute('aria-hidden','true');
    slot.appendChild(crest);
    // Keep both classes readable in Solo and Duo, independent of aura colors.
    if(role==='guardian'||role==='soul'){
      const tag=document.createElement('span');
      tag.className='ad183-role-name ad183-role-name-'+role;
      tag.textContent=role==='guardian'?'WÄCHTER':'SEELENZEHRER';
      tag.title=role==='guardian'?'Wächter · Schild, Heilung und Gegenschlag':
        'Seelenzehrer · Essenz, Seelenstoß und Seelenbund';
      tag.setAttribute('aria-label',tag.title);
      slot.appendChild(tag);
    }
    if(role==='soul'&&c.condensed>0){
      const badge=document.createElement('span');badge.className='ad183-condense-badge';
      badge.textContent='+'+Math.floor(c.condensed*.5)+' ⚔';
      badge.title='Verdichten: +'+Math.floor(c.condensed*.5)+' ATK und +'+c.condensed+' DEF';
      badge.setAttribute('aria-label',badge.title);slot.appendChild(badge);
    }
  }
  function pulse(slot,event){
    if(!slot||!event||!motionEnabled())return;
    slot.classList.add('ad183-role-pulse','ad183-pulse-'+event.kind);
    window.setTimeout(()=>slot.classList.remove('ad183-role-pulse','ad183-pulse-'+event.kind),1050);
    if(!event.label||!slot.getBoundingClientRect)return;
    const rect=slot.getBoundingClientRect();
    if(rect.bottom<0||rect.top>(window.innerHeight||900))return;
    const now=Date.now();
    if(now<cooldownUntil)return;
    cooldownUntil=now+320;
    activeNotice?.remove();
    const notice=document.createElement('div');
    notice.className='ad183-combat-notice ad183-notice-'+event.kind;
    notice.textContent=event.label;
    notice.style.left=Math.round(Math.max(90,Math.min((window.innerWidth||1200)-90,rect.left+rect.width/2)))+'px';
    notice.style.top=Math.round(Math.max(72,rect.top+rect.height/2))+'px';
    notice.setAttribute('role','status');
    document.body.appendChild(notice);activeNotice=notice;
    window.setTimeout(()=>{notice.remove();if(activeNotice===notice)activeNotice=null;},1350);
  }
  function display(entries,previous,lookup,{duo=false}={}){
    const current=new Map(),animated=new Set();
    for(const {card,owner,index,swarm,slot} of entries){
      if(!card||!slot)continue;
      const info=state(card,owner,index,swarm),key=owner+':'+card.uid;
      current.set(key,info);
      paint(slot,info);
      if(!previous||animated.size>=2)continue;
      const before=previous.get(key);
      const event=eventFor(before,info,{duo});
      if(event){animated.add(key);pulse(slot,event);}
    }
    return current;
  }
  function soloDidRender(){
    if(typeof game==='undefined'||typeof uiMode==='undefined'||uiMode!=='duel'||!game?.players)return;
    const g=game,viewer=g.mode==='pve'?0:g.active,entries=[];
    for(const [player,rowId,key] of [[g.players[viewer],'ownRow','mine'],[g.players[1-viewer],'enemyRow','enemy']]){
      if(!player)continue;
      const count=(player.field||[]).filter(c=>c&&dataOf(c).role==='predator').length;
      player.field.forEach((card,index)=>{
        if(!card)return;
        entries.push({card:{...card,role:dataOf(card).role},owner:player.id,index,swarm:count,
          slot:document.querySelector('#'+rowId+' [data-'+key+'="'+index+'"]')});
      });
    }
    const previous=soloHistory.get(g);
    soloHistory.set(g,display(entries,previous));
  }
  function duoDidRender({game:g,roomId}={}){
    if(!g?.players||!roomId)return;
    try{
      const entries=[];
      for(const player of g.players){
        const panel=document.querySelector('#duoSeats .seat[data-seat="'+player.seat+'"]');
        const field=panel?.querySelector(':scope > .field');
        if(!field)continue;
        const count=player.field.filter(c=>c?.role==='predator').length;
        player.field.forEach((card,index)=>{
          if(!card)return;
          entries.push({card,owner:player.seat,index,swarm:count,slot:field.children[index]});
        });
      }
      const previous=duoHistory.get(roomId);
      duoHistory.set(roomId,display(entries,previous,null,{duo:true}));
      // A player can change rooms without leaving the page; retain at most four.
      if(duoHistory.size>4)duoHistory.delete(duoHistory.keys().next().value);
    }catch(error){console.warn('2v2-Kampfeffekte:',error);}
  }
  if(typeof render==='function'){
    const previousRender=render;
    render=function(...args){
      const result=previousRender.apply(this,args);
      try{soloDidRender();}catch(error){console.warn('Kampfeffekte:',error);}
      return result;
    };
  }
  window.ArcaneCombatIdentity183=Object.freeze({version:'18.3.0',eventFor,resonantPct,state,soloDidRender,duoDidRender});
})();
