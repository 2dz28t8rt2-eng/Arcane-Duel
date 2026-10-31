/* Shared solo/online menu structure. Data, routes and persistence stay with the caller. */
'use strict';
((root)=>{
 const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const headings=Object.freeze({
  tournament:['Die zehn Prüfungen','Fordere den nächsten Turnierduellanten heraus und erschließe neue Karten.'],
  fusions:['Deine Fusionen','Verwalte die Vorlagen für mächtige Verschmelzungen.'],
  decks:['Deckplätze','Organisiere deine drei Deckvarianten.'],
  lexicon:['Wissen & Monsterlexikon','Lerne die Regeln kennen und entdecke neue Monster.'],
  shop:['Booster-Shop','Entdecke neue Kreaturen und Sonderangebote.'],
  upgrades:['Verbesserungen','Mach deine Lieblingsmonster stärker.'],
  xp:['Levelbelohnungen','Sieh deine nächsten Fortschrittsmeilensteine.'],
  stats:['Deine Chronik','Erinnere dich an deine Duelle und Siege.'],
  collection:['Dein Hauptdeck','Wähle und verstärke genau 40 Hauptkarten.'],
  workshop:['Monsterwerkstatt','Verbinde und zerlege freie Monster derselben Familie.'],
  challenges:['Lernpfad & Herausforderungen','Übe Kombinationen mit Leihdecks und erfülle Spezialmissionen.'],
  settings:['Einstellungen und Spielstandoptionen','Speichern, Import, Export und Einstellungen.']
 });
 function navigation({nav,groups,tabs,activeTab,collapsed=new Set(),brand='4.1 · BESTIARIUM'}){
  const doc=nav.ownerDocument||root.document;
  const activeGroup=groups.find(g=>g.tabs.includes(activeTab))||groups[0];
  nav.replaceChildren();nav.className='fm-navigation';
  nav.innerHTML='<div class="fm-nav-brand"><span>✧</span><div><strong>ARCANE DUEL</strong><small>'+safe(brand)+'</small></div></div>';
  for(const group of groups){
   const active=group.id===activeGroup.id,section=doc.createElement('section');
   section.className='fm-menu-group'+(active?' selected':'');
   const expanded=active&&!collapsed.has(group.id);
   section.innerHTML='<button type="button" class="fm-group-button" data-fm-group="'+safe(group.id)+'" aria-expanded="'+expanded+'"><span class="fm-group-icon">'+safe(group.icon)+'</span><span class="fm-group-copy"><strong>'+safe(group.title)+'</strong><small>'+safe(group.subtitle)+'</small></span><span class="fm-arrow">'+(expanded?'⌄':'›')+'</span></button>';
   if(active){
    const sub=doc.createElement('div');sub.className='fm-submenu';sub.hidden=!expanded;
    for(const id of group.tabs){const button=tabs.get(id);if(button)sub.append(button);}
    section.append(sub);
   }
   nav.append(section);
  }
  const hidden=doc.createElement('div');hidden.hidden=true;hidden.className='fm-tab-storage';
  for(const [,button] of tabs)if(!(nav.contains?nav.contains(button):button.isConnected))hidden.append(button);
  nav.append(hidden);
  return activeGroup;
 }
 // Use the same group expansion and navigation behavior for both clients.
 function activateGroup({button,groups,activeTab,collapsed,select}){
  const group=groups.find(g=>g.id===button?.dataset.fmGroup);if(!group)return;
  const submenu=button.closest('.fm-menu-group')?.querySelector('.fm-submenu');
  if(group.tabs.includes(activeTab)&&submenu){
   submenu.hidden=!submenu.hidden;
   if(submenu.hidden)collapsed.add(group.id);else collapsed.delete(group.id);
   button.setAttribute('aria-expanded',String(!submenu.hidden));
   const arrow=button.querySelector('.fm-arrow');if(arrow)arrow.textContent=submenu.hidden?'›':'⌄';
   return;
  }
  collapsed.delete(group.id);select(group.tabs[0]);
 }
 function hero({group,title,description,titleId='',descriptionId='',utility='',showcase=''}={}){
  return '<div class="fm-hero-content"><div><span class="fm-eyebrow">✦ ARCANE DUEL 4.1 · '+safe(group)+'</span><h1'+(titleId?' id="'+safe(titleId)+'"':'')+'>'+safe(title)+'</h1><p'+(descriptionId?' id="'+safe(descriptionId)+'"':'')+'>'+safe(description)+'</p></div>'+(utility?'<div class="fm-hero-utility">'+utility+'</div>':'')+showcase+'</div>';
 }
 function perk({name,description,rank,max,button}={}){
  return '<article class="fm-perk-card"><div class="fm-perk-head"><strong>'+safe(name)+'</strong><span>'+Number(rank)+' / '+Number(max)+'</span></div><p>'+safe(description)+'</p><div class="fm-perk-ranks">'+Array.from({length:Math.max(0,Math.min(20,max))},(_,i)=>'<i class="'+(i<rank?'filled':'')+'"></i>').join('')+'</div>'+button+'</article>';
 }
 root.ArcaneMenuShell221=Object.freeze({navigation,activateGroup,headings,hero,perk,safe});
})(typeof window==='undefined'?globalThis:window);
