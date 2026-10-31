/* Canonical card face shared by solo and the server-profile online adapter. */
'use strict';
((root)=>{
 const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function face(t,{classes='',attrs='',badge='',frame='',fate=false,element=t.element,tag='button'}={}){
  const role=t.ace?' tc-ace':'',lv=Number(t.level)||1;
  return '<'+tag+' class="hand-card tc-card '+frame+role+(fate?' fate-sparkle':'')+' '+classes+'" data-element="'+safe(t.element)+'" data-level="'+lv+'" '+attrs+' aria-label="'+safe(t.name)+', Level '+lv+', Angriff '+safe(t.atk)+', Verteidigung '+safe(t.def)+'">'+badge+(t.ace?'<span class="ace-stamp">✦ ACE</span>':'')+'<div class="hand-title"><span class="card-name">'+safe(t.name)+'</span><span class="card-level-badge" aria-label="Stufe '+lv+'" title="Stufe '+lv+'">LV '+lv+'</span></div><div class="hand-art"><img class="'+(String(t.art).startsWith('data:image/svg+xml')?'legacy-art':'curated-art')+'" src="'+safe(t.art)+'" alt="'+safe(t.name)+'" loading="lazy"></div><div class="hand-type">'+safe(element)+'</div><div class="hand-stats" aria-label="Angriff '+safe(t.atk)+', Level '+lv+', Verteidigung '+safe(t.def)+'"><span class="stat atk" title="Angriff '+safe(t.atk)+'"><strong class="stat-value">'+safe(t.atk)+'</strong></span>'+(lv<=10&&!fate?'<span class="ad-level-medallion" aria-hidden="true" title="Level '+lv+'">'+lv+'</span>':'')+'<span class="stat def" title="Verteidigung '+safe(t.def)+'"><strong class="stat-value">'+safe(t.def)+'</strong></span></div></'+tag+'>';
 }
 root.ArcaneCardView221=Object.freeze({face,safe});
})(typeof window==='undefined'?globalThis:window);
