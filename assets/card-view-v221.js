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
 root.ArcaneCardView221=Object.freeze({face,baseFrame,frame,safe});
})(typeof window==='undefined'?globalThis:window);
