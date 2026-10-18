/* Small duel cards keep the artwork and numbers free of role overlays. */
'use strict';
(()=>{
 const names={guardian:'Wächter',defender:'Verteidiger',allrounder:'Allrounder',soul:'Seelenzehrer',predator:'Predator',combatant:'Allrounder',resonator:'Resonator',hunter:'Jäger',support:'Unterstützer',weaver:'Runenweber'};
 const oldCard=fullCardHtml,oldBoard=cardHtml;
 // Visual metadata is authoritative in the catalog; an optional combat API cannot crash the hand.
 const roleOf=c=>c?.roleOverride||CARDS[c?.id]?.role||'combatant'; // defender is a group/style, not a separate combat role
 const strip=html=>html.replace(/<span class="(?:essence-role-chip|arcane-card-role|arcane-board-role)[^"]*"[^>]*>[^<]*<\/span>/g,'');
 fullCardHtml=function(c,attrs='',classes='',badge=''){
  let html=oldCard(c,attrs,classes,badge);
  if(Number.isSafeInteger(c?.uid))html=html.replace('<button ','<button data-instance-uid="'+c.uid+'" ');
  if(!/\bdata-hand=/.test(attrs))return html;
  const role=roleOf(c),label=names[role]||role;
  return '<div class="ad-hand-entry">'+strip(html)+'<span class="ad-hand-role ad-role-'+escapeHtml(role)+'">'+escapeHtml(label)+'</span></div>';
 };
 cardHtml=function(...args){return strip(oldBoard(...args));};
 const oldRender=render;
 render=function(...args){
  const result=oldRender(...args);if(!game||uiMode!=='duel')return result;
  const p=game.players[game.mode==='pve'?0:game.active],s=game.selection;
  const c=s?.type==='field'?p.field[s.idx]:s?.type==='hand'?p.hand.find(c=>c.uid===s.uid):null;
  const info=$('selectedInfo');
  if(c&&info&&!info.querySelector('.ad-action-role')){
   const role=roleOf(c);
   info.insertAdjacentHTML('afterbegin','<div class="ad-action-role">Rolle · '+escapeHtml(names[role]||role)+'</div>');
  }
  return result;
 };
})();
