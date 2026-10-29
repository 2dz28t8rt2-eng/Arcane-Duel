/* Arcane Duel 15.4 – visible field-value deltas, derived from actual rendered stats.
 * This display observes only; it never alters card state, battles or AI logic.
 */
'use strict';
(()=>{
  const history=new WeakMap();
  const previousRender=render;
  const signed=value=>(value>0?'+':'')+Math.round(value).toLocaleString('de-AT');
  function reason(before,after){
    if(Number(after.decay)>Number(before.decay))return 'Zerfall registriert';
    if(Number(after.fatigue)>Number(before.fatigue))return 'Angriffserschöpfung registriert';
    if(after.surge&&!before.surge)return 'Vorstoß aktiv';
    if(after.role==='predator'&&after.factor!==before.factor)return
     'Entwicklung/Schwarm: '+before.factor+' % → '+after.factor+' % Gesamt-ATK (kein Grundwertverlust)';
    return 'Kampfwertänderung';
  }
  function extract(g){
    const output=new Map();
    if(!g?.players)return output;
    const viewer=g.mode==='pve'?0:g.active;
    for(const [side,person]of [['mine',g.players[viewer]],['enemy',g.players[1-viewer]]]){
      person.field.forEach((card,index)=>{
        if(!card)return;
        const data=dataOf(card);
        output.set(side+':'+card.uid,{side,index,uid:card.uid,id:card.id,name:data.name,role:card.roleOverride||(typeof CARDS!=='undefined'?CARDS[card.id]?.role:undefined),
          factor:window.ArcanePredatorDevelopment?.breakdown?.(g,card,person.id)?.total??100,
          atk:Math.round(Number(effectiveAttack(g,card,null))||0),def:Math.round(Number(data.def)||0),
          decay:Math.max(0,Number(card.decayTotal)||0),fatigue:Math.max(0,Number(card.attackFatigue)||0),
          surge:card.surgeTurn===g.turn});
      });
    }
    return output;
  }
  function decorate(g){
    if(uiMode!=='duel'||!g||!g.players||g.winner!==null)return;
    const now=extract(g),last=history.get(g);
    history.set(g,now);
    if(!last)return;
    for(const [key,item]of now){
      const old=last.get(key);
      if(!old)continue;
      const atk=item.atk-old.atk,def=item.def-old.def;
      if(!atk&&!def)continue;
      // Guardian healing already has its own single FX message; don't echo it here.
      if(!atk&&def>0&&['guardian','soul'].includes(item.role)&&item.decay===old.decay&&item.fatigue===old.fatigue)continue;
      const label=[atk?'ATK '+signed(atk):'',def?'DEF '+signed(def):''].filter(Boolean).join(' · ');
      const cause=reason(old,item);
      const slot=document.querySelector((item.side==='mine'?'#ownRow [data-mine="':'#enemyRow [data-enemy="')+item.index+'"]');
      if(!slot)continue;
      const marker=document.createElement('span');
      marker.className='ad154-value-change'+(atk+def<0?' ad154-value-down':' ad154-value-up');
      // Body-level markers survive the successive renders during player
      // attacks, where the old in-slot label vanished almost immediately.
      const rect=slot.getBoundingClientRect();
      marker.style.left=rect.left+rect.width/2+'px';
      marker.style.top=rect.top+rect.height*.45+'px';
      marker.textContent=(cause==='Zerfall registriert'?'Zerfall · ':cause==='Angriffserschöpfung registriert'?'Erschöpfung · ':'')+label;
      marker.setAttribute('aria-label',item.name+': '+label+'. '+cause);
      marker.title=cause+' · Tatsächlich sichtbare Werteänderung';
      document.body.appendChild(marker);
      setTimeout(()=>marker.remove(),2550);
      const feed=document.getElementById('ad154-value-feed');
      if(feed){
        const line=document.createElement('div');line.textContent=item.name+': '+label+' · '+cause;
        feed.prepend(line);
        while(feed.children.length>3)feed.lastElementChild.remove();
      }
    }
  }
  render=function(){
    const result=previousRender.apply(this,arguments);
    try{decorate(game);}catch(error){console.warn('Arcane Duel: Wertanzeige ausgelassen',error);}
    return result;
  };
  // The duel log remains the source of truth for exact mechanics and timings.
  // This smaller feed reports only measured differences between two renders.
  function mount(){
    const container=document.getElementById('turnAdvice')?.parentElement;
    if(!container||document.getElementById('ad154-value-panel'))return;
    const panel=document.createElement('section');panel.id='ad154-value-panel';
    panel.innerHTML='<strong>✧ Kampfwert-Veränderungen</strong><div id="ad154-value-feed" aria-live="polite"></div>'+ 
      '<small>ATK/DEF-Differenzen vom Feld; Ursachen bei Zerfall und Erschöpfung direkt erkennbar. Weitere Details stehen im Duelllog.</small>';
    container.appendChild(panel);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
  window.ArcaneDuelFeedback154=Object.freeze({version:'15.4.0',signed,reason,extract});
})();
