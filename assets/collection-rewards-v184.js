/* Arcane Duel 18.4 – collection presentation only. No reward or inventory changes. */
'use strict';
(()=>{
  const number=value=>Math.max(0,Number(value)||0);
  const html=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const special=card=>!!(card?.ace||card?.fusionOnly&&card?.rarity==='rare'||number(card?.level)>=9);
  const available=card=>!!(card?.rpg&&!card?.retired&&!card?.enemyOnly&&!card?.fateOnly);

  function soloSummary(cards,player){
    const owned=(cards||[]).filter(card=>available(card)&&number(player?.inventory?.[card.id])>0);
    return {
      cards:owned,
      varieties:owned.length,
      copies:owned.reduce((sum,card)=>sum+number(player.inventory[card.id]),0),
      fusions:owned.filter(card=>card.fusionOnly).length,
      highlights:owned.filter(special).length,
      newCards:owned.filter(card=>player.unseen?.includes(card.id)).length,
      highest:Math.max(0,...owned.map(card=>number(card.level)))
    };
  }

  function duoSummary(rows){
    const owned=(rows||[]).filter(row=>number(row.quantity)>0);
    return {
      varieties:owned.length,
      copies:owned.reduce((sum,row)=>sum+number(row.quantity),0),
      fusions:owned.filter(row=>row.fusion).length,
      enhanced:owned.filter(row=>number(row.enhancement)>0).length,
      highest:Math.max(0,...owned.map(row=>number(row.level)))
    };
  }

  function stat(label,value){
    return '<div class="ad184-stat"><b>'+html(value)+'</b><span>'+html(label)+'</span></div>';
  }

  function soloCollection(){
    if(!['collection','fusions','lexicon'].includes(menuTab))return;
    const host=document.getElementById('menuContent');
    if(!host||!profile||!Array.isArray(CARDS))return;
    const summary=soloSummary(CARDS,profile);
    const panel=document.createElement('section');
    panel.className='ad184-collection-banner';
    const histories=window.ArcaneCollectionLab154?.readFirst?.()||{};
    const recent=summary.cards.filter(card=>Number(histories[card.id])>0)
      .sort((a,b)=>Number(histories[b.id])-Number(histories[a.id])).slice(0,3);
    panel.innerHTML='<div class="ad184-banner-head"><div><span class="ad184-eyebrow">✦ DEIN BESTIARIUM</span><h2>Jedes Monster erzählt deine Geschichte.</h2><p>Hier zählen nur Karten, die du wirklich besitzt. Die Galerie zeigt dagegen alle Kartenvorlagen.</p></div></div>'+
      '<div class="ad184-stats">'+stat('Verschiedene Karten',summary.varieties)+stat('Exemplare',summary.copies)+
      stat('Fusionen',summary.fusions)+stat('Besondere Funde',summary.highlights)+
      stat('Noch neu',summary.newCards)+stat('Höchste Stufe',summary.highest||'–')+'</div>'+
      (recent.length?'<p class="ad184-recent">Zuletzt entdeckt: '+recent.map(c=>'<strong>'+html(c.name)+'</strong>').join(' · ')+'</p>':'');
    host.prepend(panel);

    if(!['collection','fusions'].includes(menuTab))return;
    const grid=host.querySelector('.deck-editor-grid');
    if(!grid)return;
    const cards=[...grid.querySelectorAll('.collection-item')];
    let fresh=0,distinct=0;
    for(const item of cards){
      const id=Number(item.querySelector('[data-preview-card]')?.dataset.previewCard);
      const card=CARDS[id];
      if(!card)continue;
      const isNew=!!profile.unseen?.includes(id),isSpecial=special(card);
      item.classList.toggle('ad184-new',isNew);
      item.classList.toggle('ad184-special',isSpecial);
      item.classList.toggle('ad184-fusion',!!card.fusionOnly);
      item.dataset.ad184New=String(isNew);
      item.dataset.ad184Special=String(isSpecial);
      if(isNew)fresh++;
      if(isSpecial)distinct++;
      if(isNew||isSpecial){
        const ribbon=document.createElement('span');
        ribbon.className='ad184-card-ribbon';
        ribbon.textContent=isNew?'✦ Neu entdeckt':card.ace?'✧ ACE':card.rarity==='rare'?'✧ Seltene Fusion':'✧ Besonders';
        item.prepend(ribbon);
      }
    }

    const filter=document.createElement('div');
    filter.className='ad184-quick-filters';
    filter.setAttribute('aria-label','Eigene Karten filtern');
    const modes=[['all','Alle ('+cards.length+')'],['new','Neu ('+fresh+')'],['special','Besonders ('+distinct+')']];
    const key=menuTab,mode=activeSoloFilter[key]||'all';
    for(const [value,label] of modes){
      const button=document.createElement('button');
      button.type='button';button.className='ad184-filter';button.textContent=label;
      button.setAttribute('aria-pressed',String(mode===value));
      button.addEventListener('click',()=>{
        activeSoloFilter[key]=value;
        filter.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
        applyFilter();
      });
      filter.append(button);
    }
    function applyFilter(){
      const selected=activeSoloFilter[key]||'all';
      let shown=0;
      for(const item of cards){
        const match=selected==='all'||selected==='new'&&item.dataset.ad184New==='true'||
          selected==='special'&&item.dataset.ad184Special==='true';
        item.hidden=!match;if(match)shown++;
      }
      empty.hidden=shown>0;
      empty.textContent=selected==='new'?'Alle neuen Karten sind bereits angesehen.':'Hier gibt es noch keine besonderen Funde.';
    }
    const empty=document.createElement('p');empty.className='ad184-filter-empty';empty.hidden=true;
    const layout=grid.closest('.deck-editor-layout');
    if(layout){layout.before(filter);layout.after(empty);}
    else{grid.before(filter);grid.after(empty);}
    applyFilter();
  }
  const activeSoloFilter={collection:'all',fusions:'all'};

  function duoCollection({rows}={}){
    const host=document.getElementById('ad184-duo-collection-showcase');
    if(!host)return;
    const sum=duoSummary(rows),owned=(rows||[]).filter(row=>number(row.quantity)>0);
    const best=[...owned].sort((a,b)=>number(b.level)-number(a.level)||
      number(b.enhancement)-number(a.enhancement)||Number(!!b.fusion)-Number(!!a.fusion)||
      String(a.name).localeCompare(String(b.name),'de')).slice(0,3);
    host.innerHTML='<div class="ad184-duo-head"><span class="ad184-eyebrow">✦ EUER EIGENES ABENTEUER</span><p>Diese Karten gehören zu deinem 2v2-Spielstand und sind unabhängig von deiner Einzelspieler-Sammlung.</p></div>'+
      '<div class="ad184-stats">'+stat('Verschiedene',sum.varieties)+stat('Exemplare',sum.copies)+
      stat('Fusionen',sum.fusions)+stat('Verstärkt',sum.enhanced)+stat('Höchste Stufe',sum.highest||'–')+'</div>'+
      (best.length?'<h4>Deine stärksten Funde</h4><div class="ad184-duo-highlights">'+
        best.map(row=>'<div class="ad184-duo-trophy"><span class="ad184-trophy-star">✧</span><strong>'+html(row.name)+'</strong><small>Lv '+html(row.level)+(row.fusion?' · Fusion':'')+
          (number(row.enhancement)?' · Verstärkt +'+html(row.enhancement):'')+'</small></div>').join('')+'</div>':
        '<p class="ad184-duo-empty">Hier erscheinen deine ersten Kartenfunde.</p>');
  }

  if(typeof renderMenu==='function'){
    const previous=renderMenu;
    renderMenu=function(){const value=previous.apply(this,arguments);soloCollection();return value;};
  }
  window.ArcaneCollectionRewards184=Object.freeze({soloSummary,duoSummary,duoCollection});
})();
