/* Canonical card face shared by solo and the server-profile online adapter. */
'use strict';
((root)=>{
 const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 // Same frame vocabulary as the single-player renderer, including special
 // identities and the optional template / level layers.
 function baseFrame(card,instance={},fateIndex=0){
  if(instance?.fate)return 'tc-fate fate-identity-'+Math.max(0,fateIndex);
  const level=Math.max(1,Math.min(12,Math.trunc(Number(card.level)||1)));
  return card.id<20?'tc-starter':
   card.fusionOnly||instance.fusion||instance.fused?'tc-fusion tc-lv-'+level+' tc-special':
   card.manifestOf!=null?'tc-lv-'+level+' tc-manifest':'tc-lv-'+level;
 }
 function frame(card,instance={},fateIndex=0){
  let base=baseFrame(card,instance,fateIndex);
  if(instance?.fate)return base;
  const level=Math.max(1,Math.min(12,Math.trunc(Number(card.level)||1)));
  if(card.ace)base+=' evo-ace-tier-'+card.source;
  else if(card.essenceMonster)base+=' tc-essence tc-essence-'+(card.frameEssenceSchool||'fusion');
  const family=card.ace?'ace':card.essenceMonster?'essence':
   card.fusionOnly||instance.fusion||instance.fused?'fusion':'normal';
  const tier=Math.min(5,Math.ceil(level/2));
  base+=' ad-template ad-template-family-'+family+' ad-template-tier-'+tier+' ad-template-'+family+'-0'+tier;
  if(level<=10)base+=' ad-level-frame ad-level-'+family+'-'+String(level).padStart(2,'0');
  return base;
 }
 function face(t,{classes='',attrs='',badge='',frame='',fate=false,element=t.element,tag='button'}={}){
  const role=t.ace?' tc-ace':'',lv=Number(t.level)||1;
  return '<'+tag+' class="hand-card tc-card '+frame+role+(fate?' fate-sparkle':'')+' '+classes+'" data-element="'+safe(t.element)+'" data-level="'+lv+'" '+attrs+' aria-label="'+safe(t.name)+', Level '+lv+', Angriff '+safe(t.atk)+', Verteidigung '+safe(t.def)+'">'+badge+(t.ace?'<span class="ace-stamp">✦ ACE</span>':'')+'<div class="hand-title"><span class="card-name">'+safe(t.name)+'</span><span class="card-level-badge" aria-label="Stufe '+lv+'" title="Stufe '+lv+'">LV '+lv+'</span></div><div class="hand-art"><img class="'+(String(t.art).startsWith('data:image/svg+xml')?'legacy-art':'curated-art')+'" src="'+safe(t.art)+'" alt="'+safe(t.name)+'" loading="lazy"></div><div class="hand-type">'+safe(element)+'</div><div class="hand-stats" aria-label="Angriff '+safe(t.atk)+', Level '+lv+', Verteidigung '+safe(t.def)+'"><span class="stat atk" title="Angriff '+safe(t.atk)+'"><strong class="stat-value">'+safe(t.atk)+'</strong></span>'+(lv<=10&&!fate?'<span class="ad-level-medallion" aria-hidden="true" title="Level '+lv+'">'+lv+'</span>':'')+'<span class="stat def" title="Verteidigung '+safe(t.def)+'"><strong class="stat-value">'+safe(t.def)+'</strong></span></div></'+tag+'>';
 }
 function board(t,{frame='',fate=false,mode='atk',used=false,summoned=false,attack=t.atk,surge=false,overcharge=0}={}){
  const lv=Number(t.level)||1;
  let html='<div class="board-creature tc-card '+frame+(t.ace?' tc-ace':'')+(fate?' fate-sparkle':'')+(mode==='def'?' defense':'')+(used?' exhausted':'')+(summoned?' summon-anim':'')+(overcharge>0?' ad-overcharged':'')+'"'+(t.ace?' data-element="'+safe(t.element)+'"':'')+' data-level="'+lv+'" aria-label="'+safe(t.name)+', '+mode.toUpperCase()+', Angriff '+safe(attack)+', Verteidigung '+safe(t.def)+'"><img class="board-art '+(String(t.art).startsWith('data:image/svg+xml')?'legacy-art':'curated-art')+'" src="'+safe(t.art)+'" alt=""><span class="board-level">Lv '+lv+'</span>'+(t.ace?'<span class="board-ace-stamp">ACE</span>':'')+'<span class="state-badge">'+(mode==='def'?'DEF':'ATK')+'</span><div class="board-name">'+safe(t.name)+'</div><div class="board-stats"><b>⚔'+safe(attack)+(surge?' ↑':'')+'</b>'+(lv<=10&&!fate?'<span class="ad-level-medallion" aria-hidden="true" title="Level '+lv+'">'+lv+'</span>':'')+'<b>◆'+safe(t.def)+'</b></div></div>';
  if(Math.max(attack,t.def)>=10000)html=html.replace('class="board-creature','class="board-creature ad-compact-values').replace('<b>⚔','<b title="ATK '+safe(attack)+'" aria-label="Angriff '+safe(attack)+'">').replace('<b>◆','<b title="DEF '+safe(t.def)+'" aria-label="Verteidigung '+safe(t.def)+'">');
  if(overcharge>0)html=html.replace('class="board-creature','data-overcharge="'+safe(overcharge)+'" title="Überladen: '+safe(overcharge)+' temporäre DEF über dem regulären Maximum" class="board-creature');
  return html;
 }
 function defenderAbility(role,state=null){
  if(!['guardian','soul'].includes(role))return '';
  return '<section class="ad-defender-ability"><strong>✦ Gegenschlag</strong><p>Im PvE verursacht dieses Monster in Verteidigungsposition nach einem gültigen Angriff 35 % seiner aktuellen ATK als Schaden an den LP des Angreifers – aber nur, wenn es den Angriff überlebt und danach noch auf dem Feld steht. Ein Schutzschild kann den Schaden abfangen. Während „Letztes Bollwerk“ angriffsimmun macht, wird kein Gegenschlag ausgelöst.</p>'+(state?'<p class="ad-charge-note"><strong>Überladen · +'+safe(state.extra)+' DEF</strong><br>Aktuell '+safe(state.current)+' / reguläres Maximum '+safe(state.max)+'. Die gespeicherte Seelenessenz und verdichtete Essenz bilden temporäre DEF. Das Leuchten endet, sobald kein Überschuss mehr besteht.</p>':'')+'</section>';
 }
 function bondInfo(partner){
  return '<div class="ad206-preview"><strong>🛡 Schutz in DEF: '+(partner?'35 % des Schadens werden abgewehrt · Seelenbund aktiv':'20 % des Schadens werden abgewehrt')+'</strong>'+(partner?'<p>Verbunden mit '+safe(partner)+'. Wenn Wächter und Seelenzehrer direkt nebeneinander in DEF stehen, halten sie 35 % statt 20 % des eingehenden Schadens ab.</p><small>25 % des zusätzlich verhinderten Schadens werden als Seelenessenz gespeichert (maximal 50 pro Runde und Bindung).</small>':'<small>Tipp: Setze einen Wächter direkt links oder rechts neben einen Seelenzehrer – beide können dann mehr Schaden abwehren.</small>')+'</div>';
 }
 root.ArcaneCardView221=Object.freeze({face,board,baseFrame,frame,safe,defenderAbility,bondInfo});
})(typeof window==='undefined'?globalThis:window);
