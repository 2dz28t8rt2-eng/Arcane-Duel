/* Arcane Duel 15.5: cosmetic monster history for real, observed manual PvE.
 * Counters are written only once AFTER a finished human duel. No stat growth.
 */
'use strict';
(()=>{
  const KEY='arcane-duel-v155-monster-records';
  const sessions=new WeakMap(),counted=new WeakSet();
  const $id=id=>document.getElementById(id);
  const esc=x=>escapeHtml(String(x??''));
  function sanitize(raw){
    const out={};if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
    for(const [key,item] of Object.entries(raw).slice(0,3000)){
      const id=Number(key);
      if(!Number.isInteger(id)||id<0||!CARDS[id]||!item||!Number.isInteger(item.uses)||
        !Number.isInteger(item.wins)||!Number.isInteger(item.last)||item.uses<0||item.wins<0||
        item.wins>item.uses||item.last<0)continue;
      out[id]={uses:Math.min(1000000,item.uses),wins:Math.min(1000000,item.wins),last:item.last};
    }
    return out;
  }
  let memory={};
  function read(){
    try{return sanitize(JSON.parse(window.localStorage?.getItem(KEY)||'{}'));}catch(_){return sanitize(memory);}
  }
  function write(value){memory=sanitize(value);
    try{window.localStorage?.setItem(KEY,JSON.stringify(memory));}catch(_){}
  }
  function observe(g,c){
    if(!g||g!==game||uiMode!=='duel'||g.mode!=='pve'||!c||!Number.isInteger(c.uid)||!CARDS[c.id])return;
    let cards=sessions.get(g);
    if(!cards){cards=new Map();sessions.set(g,cards);}
    if(!cards.has(c.uid))cards.set(c.uid,c.id);
  }
  function capture(g){
    if(!g||g!==game||uiMode!=='duel'||g.mode!=='pve')return;
    g.players?.[0]?.field?.forEach(c=>observe(g,c));
  }
  function aggregate(previous,observations,win,at){
    const next={...previous};
    for(const cardId of observations){
      const current=next[cardId]||{uses:0,wins:0,last:0};
      next[cardId]={uses:Math.min(1000000,current.uses+1),
        wins:Math.min(1000000,current.wins+(win?1:0)),last:at};
    }
    return next;
  }
  function commit(g){
    if(!g||g!==game||uiMode!=='duel'||g.mode!=='pve'||g.winner===null||counted.has(g))return;
    counted.add(g);
    const cards=sessions.get(g);
    if(!cards?.size)return;
    write(aggregate(read(),cards.values(),g.winner===0,Date.now()));
  }
  const previousRender=render;
  render=function(){
    if(typeof game!=='undefined')capture(game);
    const result=previousRender.apply(this,arguments);
    if(typeof game!=='undefined')capture(game);
    return result;
  };
  const previousPlace=placePending;
  placePending=function(g){
    const value=previousPlace.apply(this,arguments);
    if(value?.card)observe(g,value.card);
    return value;
  };
  const previousFinish=showFinished;
  showFinished=function(){
    const g=game;
    capture(g);const result=previousFinish.apply(this,arguments);commit(g);return result;
  };
  function addChronicle(){
    if(uiMode!=='menu'||menuTab!=='lexicon'||$id('ad155-monster-records'))return;
    const parent=$id('menuContent')?.querySelector('.ad119-lexicon');
    if(!parent)return;
    const stats=read(),rows=Object.entries(stats).filter(([cardId,row])=>
      CARDS[Number(cardId)]&&Number(profile.inventory?.[cardId])>0&&row.uses>0)
      .sort((a,b)=>b[1].uses-a[1].uses||b[1].last-a[1].last).slice(0,10);
    const section=document.createElement('section');section.id='ad155-monster-records';
    section.innerHTML='<h3>✦ Veteranenchronik</h3>'+ 
      '<p>Deine häufig eingesetzten Monster aus abgeschlossenen manuellen Duellen seit v15.5. '+
      'Die Einsätze sind Erinnerungen, keine zusätzlichen Level oder Werteboni.</p>'+ 
      (rows.length?'<div class="ad155-record-grid">'+rows.map(([id,row])=>'<article><b>'+esc(CARDS[id].name)+' · Lv '+CARDS[id].level+'</b>'+ 
        '<span>'+row.uses+' beobachtete Feldeinsätze · '+row.wins+' davon in gewonnenen Duellen</span>'+ 
        '<small>Zuletzt am '+esc(new Date(row.last).toLocaleDateString('de-AT'))+'</small></article>').join('')+'</div>':
        '<p class="ad155-muted">Noch keine abgeschlossenen Einsätze mit dieser Version dokumentiert.</p>')+
      '<small class="ad155-muted">Ein Einsatz zählt pro beobachteter beschworener Karteninstanz. Automatische Simulationen, Leihdecks und Duelle vor diesem Update werden nicht nachträglich gezählt.</small>';
    const anchor=$id('ad154-chronicle')||$id('ad122-wishlist');
    if(anchor)anchor.insertAdjacentElement('afterend',section);else parent.prepend(section);
  }
  const previousMenu=renderMenu;
  renderMenu=function(){const result=previousMenu.apply(this,arguments);addChronicle();return result;};
  if(uiMode==='menu')addChronicle();
  window.ArcaneMonsterRecords155=Object.freeze({version:'15.5.0',sanitize,aggregate,read,capture,commit});
})();
