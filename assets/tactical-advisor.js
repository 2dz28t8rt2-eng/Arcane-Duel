/* Arcane Duel – Tactical Assistant UI.
 * Read-only advisor and fusion explanation; leaves profile, decks and duel rules untouched.
 * Loaded AFTER arcane-archive.js; no global combat monkey-patches except wrapping
 * the existing fusion preview presenter without changing its callbacks.
 */
'use strict';
(()=>{
 const engine=window.ArcaneStrategy;
 if(!engine||typeof renderMenu!=='function')return;
 const fmtPercent=n=>(n*100).toFixed(1).replace('.',',')+' %';
 const escape=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const keys=[['pair','Paar'],['lowPair','Stufe-1-Paar'],['twoPairs','Zwei Paare'],['three','Drilling'],['smallStraight','Kleine Straße'],['fullHouse','Full House'],['four','Vierling'],['bigStraight','Große Straße'],['five','Fünfling']];
 let expanded=false;
 function activeAnalysis(){
  const ids=Array.isArray(deckDraft)?deckDraft:profile.activeDeck;
  const fusions=Array.isArray(fusionDraft)?fusionDraft:profile.fusionDeck;
  return engine.evaluate(ids,id=>CARDS[id],fusions);
 }
 function miniStatistic(label,value,desc){
  return '<div class="tactic-mini-stat"><strong>'+value+'</strong><span>'+label+'</span>'+
   (desc?'<small>'+desc+'</small>':'')+'</div>';
 }
 function renderAdvice(){
  if(uiMode!=='menu'||!['collection','fusions','decks'].includes(menuTab))return;
  const target=$('menuContent');if(!target||target.querySelector('#arcaneTacticPanel'))return;
  let data;
  try{data=activeAnalysis();}catch(e){return;}
  const node=document.createElement('section');
  node.id='arcaneTacticPanel';node.className='menu-panel tactic-advisor';
  const bestOdds=keys.filter(([key])=>data.opening.probabilities[key]>.05)
    .sort((a,b)=>data.opening.probabilities[b[0]]-data.opening.probabilities[a[0]]);
  const strengths=bestOdds.slice(0,3).map(([key,label])=>miniStatistic(label,fmtPercent(data.opening.probabilities[key]))).join('');
  const frequency=keys.map(([key,label])=>{
   const probability=data.opening.probabilities[key];
   return '<div class="tactic-prob-row"><span>'+label+'</span><div class="tactic-prob-track" role="img" aria-label="'+escape(label)+': '+fmtPercent(probability)+'">'+
   '<i style="width:'+Math.min(100,Math.max(0,probability*100)).toFixed(2)+'%"></i></div><strong>'+fmtPercent(probability)+'</strong></div>';
  }).join('');
  const distribution=Object.entries(data.levelCounts).sort((a,b)=>Number(a[0])-Number(b[0])).map(([lv,n])=>
   '<div class="tactic-level"><span>LV '+lv+'</span><i style="height:'+Math.max(8,Math.min(100,n/40*290))+'%"></i><strong>'+n+'</strong></div>').join('');
  node.innerHTML='<div class="tactic-advisor-head"><div><span class="tactic-eyebrow">✧ TAKTISCHES ARCHIV</span>'+
   '<h2>Dein Deck verstehen</h2><p>Analyse statt automatischem Deckbau – du behältst jede Entscheidung.</p></div>'+
   '<div class="tactic-advisor-pills"><span>'+data.count+' / 40 Karten</span><span>'+data.distinct+' Arten</span><span>'+data.fusionCount+' Fusionen</span></div></div>'+
   '<div class="tactic-spotlight">'+
   miniStatistic('ATK-betonte Karten',String(data.atkHigher))+
   miniStatistic('DEF-betonte Karten',String(data.defHigher))+
   miniStatistic('Ø ATK / DEF',data.averageAtk+' / '+data.averageDef)+
   '</div>'+
   '<button type="button" class="btn tactic-expand" id="arcaneTacticExpand" aria-expanded="'+String(expanded)+'">'+
   (expanded?'Analyse einklappen':'Fusionschancen & Deckhinweise anzeigen')+' ↓</button>'+
   '<div class="tactic-details" '+(expanded?'':'hidden')+'>'+
   '<div class="tactic-insights">'+data.hints.map(h=>'<article class="tactic-insight tactic-'+h.type+'"><strong>'+escape(h.title)+'</strong><p>'+escape(h.details)+'</p></article>').join('')+'</div>'+
   '<div class="tactic-analysis-columns"><section><h3>5-Karten-Starthand: vorhandene Muster</h3><p>Exakte Kombinatorik ohne Zurücklegen. Ein vorhandenes Muster garantiert keine sofort spielbare Fusion und berücksichtigt keine Feldaktionen oder Fusionsvorlagen.</p>'+
   frequency+'</section><section><h3>Stufenverteilung</h3><p>Mehr Gleichheit begünstigt Paare, aufeinanderfolgende Stufen begünstigen Straßen.</p>'+
   '<div class="tactic-levels">'+distribution+'</div><p><strong>Mögliche Starthände:</strong> '+data.opening.total.toLocaleString('de-AT')+'</p></section></div>'+
   '<p class="tactic-disclaimer">Hinweis: Die Analyse untersucht ausschließlich die gewählten Karten. Sie berücksichtigt weder individuelle Gegnerzüge noch die Zufallswerte einer konkreten Fusionsbeschwörung.</p></div>';
  const banner=target.querySelector('.atlas-content-banner');
  if(banner)banner.insertAdjacentElement('afterend',node);else target.prepend(node);
  node.querySelector('#arcaneTacticExpand').onclick=()=>{
   expanded=!expanded;
   const button=node.querySelector('#arcaneTacticExpand');
   const details=node.querySelector('.tactic-details');
   details.hidden=!expanded;
   button.setAttribute('aria-expanded',String(expanded));
   button.textContent=expanded?'Analyse einklappen ↑':'Fusionschancen & Deckhinweise anzeigen ↓';
  };
 }
 const oldMenu=renderMenu;
 renderMenu=function(){oldMenu();renderAdvice();};
 if(uiMode==='menu')renderAdvice();
 const previousChoose=chooseFusionModal;
 chooseFusionModal=function(levels,materials,callback,extra=''){
  const result=previousChoose(levels,materials,callback,extra);
  const modal=$('modal'),zone=modal?.querySelector('.fusion-choice-grid');
  if(!zone||modal.querySelector('.tactic-fusion-explainer')||!game||!Array.isArray(materials)||materials.length<2)return result;
  const strongestAtk=Math.max(...materials.map(m=>Number(dataOf(m).atk)||0));
  const strongestDef=Math.max(...materials.map(m=>Number(dataOf(m).def)||0));
  const pool=fusionOptions(game,levels).filter(c=>game.pending||canCompleteHandFusion(game,levels,c.id)).sort((a,b)=>b.level-a.level||b.atk-a.atk);
  const patternName=fusionPreview(game,pool[0],materials,levels)?.pattern||'Fusion';
  if(!pool.length)return result;
  const examples=pool.slice(0,3).map(c=>{
   const v=fusionPreview(game,c,materials,levels);
   const atkDiff=[v.atk[0]-strongestAtk,v.atk[1]-strongestAtk];
   const defDiff=[v.def[0]-strongestDef,v.def[1]-strongestDef];
   const signed=n=>(n>=0?'+':'')+Math.round(n);
   return '<tr><th scope="row">'+escape(c.name)+'</th><td>'+signed(atkDiff[0])+' bis '+signed(atkDiff[1])+'</td><td>'+signed(defDiff[0])+' bis '+signed(defDiff[1])+'</td><td>'+v.rolls+'</td></tr>';
  }).join('');
  const wrap=document.createElement('details');
  wrap.className='tactic-fusion-explainer';
  wrap.innerHTML='<summary>✧ Fusion genauer verstehen · Materialvergleich</summary>'+
   '<div><p><strong>'+escape(patternName)+'</strong>'+
   ' · '+levels.length+' Materialien. <strong>Vergleichsbasis</strong>: stärkstes eingesetztes Material mit ATK '+strongestAtk+' / DEF '+strongestDef+'.</p>'+
   '<div class="table-scroll"><table><thead><tr><th>Fusionsvorlage</th><th>ATK gegenüber Material</th><th>DEF gegenüber Material</th><th>Würfe</th></tr></thead>'+
   '<tbody>'+examples+'</tbody></table></div>'+
   '<p>Die Differenzen sind <strong>mögliche Bereiche, keine garantierten Zuwächse</strong>. Die Fusionsauswahl selbst bleibt unverändert.</p></div>';
  zone.insertAdjacentElement('beforebegin',wrap);
  return result;
 };
 window.ArcaneTacticalAdvisor={version:'1.0.0',analyzeCurrentDeck:activeAnalysis};
})();