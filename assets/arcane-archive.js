/* ARCANE DUEL · The Gilded Archive | purely visual extension after royal-menu.js */
'use strict';
(()=>{
 if(typeof renderMenu!=='function')return;
 const previous=renderMenu;
 const sections={
  play:['DIE ARENA','amber','⚔','DEIN WEG ZUR MEISTERSCHAFT'],
  deck:['DAS BESTIARIUM','silver','▤','KREATUREN · KARTEN · FUSIONEN'],
  missions:['DIE PRÜFUNGEN','violet','✧','LERNE · WAGE · MEISTERE'],
  growth:['DIE AKADEMIE','jade','✦','WISSEN · WACHSTUM · BELOHNUNG'],
  options:['DIE CHRONIK','steel','◈','BEWAHREN · ERINNERN · ANPASSEN']
 };
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const crest='<div class="atlas-arcane-crest" aria-hidden="true"><svg viewBox="0 0 300 300" focusable="false">'+
 '<circle cx="150" cy="150" r="120" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".42"/>'+
 '<circle cx="150" cy="150" r="105" fill="none" stroke="currentColor" stroke-width=".9" stroke-dasharray="4 9" opacity=".7"/>'+
 '<circle cx="150" cy="150" r="84" fill="none" stroke="currentColor" stroke-width="1.7" opacity=".52"/>'+
 '<path d="M150 25 162 56 150 72 138 56Z M150 228 162 244 150 275 138 244Z M25 150 56 138 72 150 56 162Z M228 150 244 138 275 150 244 162Z" fill="none" stroke="currentColor" stroke-width="1.5"/>'+
 '<path d="M150 88 165 135 212 150 165 165 150 212 135 165 88 150 135 135Z M150 109 191 150 150 191 109 150Z M150 65V103 M150 197V235 M65 150H103 M197 150H235" fill="none" stroke="currentColor" stroke-width="1.3"/>'+
 '<circle cx="150" cy="150" r="12" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="150" cy="150" r="3.5" fill="currentColor"/></svg></div>';
 function featureArt(){
  const ids=Array.isArray(profile?.activeDeck)?profile.activeDeck:[];
  // Show the player's most distinctive owned deck cards, not arbitrary first slots.
  const seen=new Set(),cards=[];
  const ordered=[...new Set(ids)].map(id=>CARDS[id]).filter(Boolean)
   .sort((a,b)=>(Number(b.level)||0)-(Number(a.level)||0)||Number(Boolean(b.ace))-Number(Boolean(a.ace)));
  for(const c of ordered){
   if(!c||typeof c.art!=='string'||!/^(assets\/|data:image\/svg\+xml)/.test(c.art)||seen.has(c.art))continue;
   seen.add(c.art);cards.push(c);if(cards.length===3)break;
  }
  return cards;
 }
 function enhanceHero(hero){
  const content=hero.querySelector('.fm-hero-content'),tools=hero.querySelector('.fm-hero-utility');
  if(!content)return;
  if(tools)hero.insertBefore(tools,hero.querySelector('.fm-resume-bar')||content.nextSibling);
  const list=featureArt(),visual=document.createElement('div');
  visual.className='atlas-showcase';visual.setAttribute('aria-hidden','true');
  visual.innerHTML=crest+'<div class="atlas-showcase-cards">'+list.map((c,i)=>
   '<div class="atlas-preview-card atlas-preview-'+i+'"><span class="atlas-preview-corner">✦</span>'+
   '<img src="'+escape(c.art)+'" alt="" loading="lazy" decoding="async">'+
   '<span class="atlas-preview-footer">LV '+(Number(c.level)||1)+'</span></div>').join('')+'</div>'+
   '<span class="atlas-showcase-dust atlas-dust-one"></span><span class="atlas-showcase-dust atlas-dust-two"></span>';
  content.append(visual);
  hero.classList.toggle('atlas-has-art',list.length>0);
 }
 function enhanceNav(nav,section){
  const brand=nav.querySelector('.fm-nav-brand');
  if(brand){brand.classList.add('atlas-brand');brand.insertAdjacentHTML('beforeend','<span class="atlas-brand-seal" aria-hidden="true">✦</span>');}
  nav.querySelectorAll('.fm-menu-group').forEach((g,i)=>{
   g.classList.add('atlas-nav-item');g.style.setProperty('--atlas-index',String(i));
   g.querySelector('.fm-group-button')?.insertAdjacentHTML('beforeend','<span class="atlas-nav-engraving" aria-hidden="true"></span>');
  });
  nav.querySelector('.fm-menu-group.selected')?.setAttribute('data-archive-active',section[0]);
  nav.querySelector('.fm-help')?.insertAdjacentHTML('afterbegin','<span class="atlas-help-caption">HILFE & WISSEN</span>');
 }
 function enhancePanels(panel,section){
  let n=0;
  panel.querySelectorAll('.menu-panel,.opponent-card,.fm-perk-card,.collection-item,.fm-perk-intro').forEach(node=>{
   // Keep the user's approved challenge presentation visually intact.
   if(node.classList.contains('lesson-card')||node.classList.contains('evo-mode')||
      node.classList.contains('evo-quest')||node.classList.contains('lesson-overview'))return;
   node.classList.add('atlas-etched-panel');
   node.style.setProperty('--atlas-card-index',String(Math.min(n++,12)));
  });
  const banner=document.createElement('div');banner.className='atlas-content-banner';
  banner.innerHTML='<div class="atlas-content-kicker"><span class="atlas-kicker-mark">'+section[2]+'</span>'+
   '<div><small>'+section[0]+'</small><strong>'+section[3]+'</strong></div></div>'+
   '<span class="atlas-divider-symbol" aria-hidden="true">✧ ─ ✦ ─ ✧</span>';
  panel.prepend(banner);
  panel.dataset.archiveTab=menuTab;
 }
 function decorate(){
  if(uiMode!=='menu')return;
  const screen=$('menuScreen'),nav=$('menuNav'),hero=$('menuHero'),panel=$('menuContent');
  if(!screen||!nav||!hero||!panel)return;
  const section=sections[screen.dataset.fmSection]||sections.play;
  screen.classList.add('atlas-screen');screen.dataset.atlasTheme=section[1];
  nav.classList.add('atlas-nav');hero.classList.add('atlas-hero');panel.classList.add('atlas-content');
  enhanceNav(nav,section);enhanceHero(hero);enhancePanels(panel,section);
  const marker=hero.querySelector('.fm-eyebrow');if(marker)marker.textContent=section[0]+' · ARCANE DUEL 3.0';
  const subtitle=document.querySelector('.mast .subtitle');
  if(subtitle)subtitle.textContent='DAS BESTIARIUM DER DUELLANTEN';
 }
 renderMenu=function(){previous();decorate();};
 if(uiMode==='menu')renderMenu();
 window.ArcaneArchiveTheme={version:'1.0.0',name:'Gilded Archive'};
})();