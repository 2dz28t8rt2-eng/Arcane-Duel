/* Arcane Duel 5.6: semantic summoning cockpit.
 * Presentation-only; retains legal summoning, fusion and zone handling.
 */
'use strict';
(()=>{
 const previousRender=render;
 let stageMode='fusion';
 const esc=value=>escapeHtml(String(value??''));
 function currentPlayer(g){return g.players[g.mode==='pve'?0:g.active];}
 function summarizeCard(c,showStats=true){
  if(!c)return '';
  const info=dataOf(c);
  return '<div class="ad56-card-detail"><img src="'+esc(info.art)+'" alt="" loading="lazy">'+
   '<div class="ad56-card-meta"><strong>'+esc(info.name)+'</strong>'+
   '<span>Stufe '+info.level+(info.ace?' · ACE':'')+'</span>'+
   (showStats?'<div class="ad56-stats"><b>⚔ '+Math.round(info.atk)+'</b><b>◆ '+Math.round(info.def)+'</b></div>':
    '<small>Fusionswerte werden nach der Platzierung aufgedeckt</small>')+
   '</div></div>';
 }
 function renderStage(){
  const host=document.getElementById('summonStage');
  if(!host||!game||uiMode!=='duel')return;
  const oldViewport=host.querySelector('.ad117-mat-viewport');
  const previousScroll=oldViewport?.scrollTop||0;
  const previousCount=Number(host.dataset.ad117MaterialCount||0);
  const g=game,human=g.mode==='pvp'||g.active===0,
        me=currentPlayer(g),isReady=human&&!g.summoned&&!g.pending,
        pending=human?g.pending:null,
        chosen=human&&g.selection?.type==='hand'?me.hand.find(c=>c.uid===g.selection.uid):null,
        material=human?(g.materials||[]).map(uid=>me.hand.find(c=>c.uid===uid)).filter(Boolean):[],
        levels=material.map(c=>dataOf(c).level),
        cost=levels.length>=2?qualityRolls(levels):null,
        poker=levels.length>=2?window.ArcaneFusionMath?.pattern?.(levels,material.map(c=>dataOf(c).element)):null,
        current=pending?.card||chosen||material[material.length-1];
  const phase=!human?'Gegnerzug':pending?'Feldplatz wählen':g.summoned?'Beschwörung verbraucht':material.length>=2?'Fusion vorbereiten':chosen?'Normale Beschwörung':'Karte wählen';
  const phaseId=!human?'opponent':pending?'placement':g.summoned?'spent':material.length>=2?'fusion':chosen?'summon':'select';
  const label=pending?.kind==='fusion'?'Fusionskarte':pending?'Ausgewählte Beschwörung':chosen?'Deine Handkarte':material.length?'Zuletzt markierte Karte':'Kartenvorschau';
  const fusionReady=pending?.kind==='fusion'&&pending.revealed===true;
  const showStats=pending?.kind!=='fusion'||fusionReady;
  const actualBonus=pending?.kind==='fusion'?window.ArcaneFusionBonus?.describe?.(pending.card):null;
  const bonusHtml=actualBonus?'<div class="ad112-special-bonus" role="status">✦ SPEZIALBONUS · <strong>'+esc(actualBonus.title)+'</strong>'+(actualBonus.percent===null?'':' · +'+esc(actualBonus.percent)+' % Qualität')+'</div>':'';
  const selectedHtml=current?(
   pending?.kind==='normal'?
    '<div class="stage-card ad56-stage-card" title="Karte erneut anklicken, um die Beschwörung zurückzunehmen">'+fullCardHtml(current)+'</div>':
   pending?.kind==='fusion'?
    '<div class="stage-card ad56-stage-card'+(fusionReady?' arcane-fusion-ready-card ad56-revealed-card':'')+'" title="Klicken: Fusion rückgängig machen">'+
     (fusionReady?fullCardHtml(current):summarizeCard(current,false))+'</div>':
   summarizeCard(current,showStats)
  ):'<p class="ad56-empty">Wähle eine Handkarte oder markiere bis zu fünf Fusionsmaterialien.</p>';
  const materialHtml=material.length?
   '<ol class="ad56-mat-list">'+material.map((c,i)=>{
    const t=dataOf(c);
    return '<li><button type="button" class="ad56-mat-chip'+(g.discardKeepUid===c.uid?' ad207-keep':'')+'" data-ad56-remove="'+c.uid+'" '+(!isReady?'disabled':'')+
     ' title="'+(stageMode==='discard'?'Rechtsklick: Diese Karte behalten':'Rechtsklick: Kartenreihenfolge neu bestimmen')+'">'+
     '<span class="ad56-mat-order">'+(i+1)+'</span><span>'+esc(t.name)+'</span><small>Lv '+t.level+'</small><span aria-hidden="true">'+(g.discardKeepUid===c.uid?'✓':'×')+'</span></button></li>';
   }).join('')+'</ol>':
   '<p class="ad56-empty">Noch keine Materialien ausgewählt. Rechtsklick auf die Handkarte oder Touch-Fusion aktivieren.</p>';
  let limits='';
  if(levels.length>=2){
   const options=fusionOptions(g,levels,material).filter(c=>canCompleteHandFusion(g,levels,c.id));
   limits='<div class="ad56-material-status"><strong>'+levels.length+' / 5 Materialien</strong>'+
    '<span>Qualitätswürfe: '+cost+(poker?.rollBonus?' · Spezial +'+poker.rollBonus:'')+'</span><span>'+esc(poker?.name||'Freie Fusion')+'</span><span>Mögliche Stufe: bis Lv '+fusionBudget(levels,g)+'</span><span>'+options.length+' passende Vorlagen</span>'+
    (options.length?'<span>Höchste verfügbare Vorlage: Lv '+Math.max(...options.map(c=>c.level))+'</span>':
     '<span class="ad56-warning">Derzeit keine legale Fusionsvorlage</span>')+'</div>';
  }else if(material.length){
   limits='<div class="ad56-material-status"><span>1 / 5 Materialien · mindestens 2 wählen</span></div>';
  }
  const actions=human&&!g.summoned&&!pending&&(material.length||chosen)?
   '<div class="ad207-stage-actions">'+
   (material.length>=2?'<button type="button" data-ad207-mode="fusion" class="btn '+(stageMode==='fusion'?'primary':'ghost')+'">✧ Fusionieren</button>'+
    '<button type="button" data-ad207-mode="discard" class="btn '+(stageMode==='discard'?'primary':'ghost')+'">↘ Wegwerfen</button>':'')+
   (material.length>=2&&stageMode==='discard'?'<button type="button" class="btn primary" data-ad207-commit-discard>Bestätigen: alle außer der markierten Karte abwerfen</button>':'')+
   '<button type="button" class="btn ghost" data-ad207-clear>✕ Alles abwählen</button></div>':
   pending?'<button type="button" class="btn ghost" data-ad207-clear>↶ Beschwörung zurücknehmen</button>':'';
  host.innerHTML='<div class="ad56-cockpit" data-stage-phase="'+phaseId+'">'+
   '<div class="ad56-topline"><span class="ad56-kicker">✦ BESCHWÖRUNGSZENTRALE</span><strong>'+esc(phase)+'</strong></div>'+
   '<div class="ad56-steps" aria-label="Beschwörungsablauf">'+
    '<span class="'+(!pending&&!g.summoned?'active':'')+'">1 · Karte / Material</span>'+
    '<span class="'+(pending?'active':'')+'">2 · Vorbereiten</span>'+
    '<span class="'+(pending?'active':'')+'">3 · Zone auf dem Feld</span></div>'+
   '<div class="ad56-columns">'+
    '<section class="ad56-block ad56-selection"><h3>'+esc(label)+'</h3>'+selectedHtml+bonusHtml+
      '<p class="ad56-hint">'+(pending?'Jetzt auf eine der fünf Zonen deines Feldes klicken.':
       chosen?'„Beschwören“ wählen oder eine andere Handkarte anklicken.':
       material.length?'Weitere Materialien markieren oder „Fusionieren“ drücken.':
       'Du darfst pro Zug eine Karte beschwören oder eine Fusion ausführen.')+'</p></section>'+
    '<section class="ad56-block ad56-material"><h3>Beschwörungszone · '+(stageMode==='discard'?'Abwerfen':'Materialreihenfolge')+'</h3><p class="ad207-guide">'+
    (stageMode==='discard'?'Rechtsklick auf die Karte, die du behalten möchtest. Alle anderen wandern erst nach der endgültigen Beschwörung auf den Friedhof.':'Rechtsklick auf eine Materialkarte setzt sie an das Ende der Fusionsreihenfolge. Ein Klick entfernt sie einzeln.')+'</p>'+
    '<div class="ad117-mat-viewport">'+materialHtml+'</div>'+limits+actions+'</section></div>'+
   '</div>';
  // Do not send the page or material list back to the top on every pick.
  host.dataset.ad117MaterialCount=String(material.length);
  const viewport=host.querySelector('.ad117-mat-viewport');
  if(viewport)viewport.scrollTop=material.length>previousCount&&material.length>=4?
   viewport.scrollHeight:previousScroll;
 }
 render=function(){const result=previousRender();renderStage();return result;};
 document.getElementById('summonStage')?.addEventListener('click',event=>{
  if(!game||!inputAllowed()||game.summoned)return;
  const clear=event.target.closest?.('[data-ad207-clear]');
  if(clear){clearSelection();stageMode='fusion';return;}
  const mode=event.target.closest?.('[data-ad207-mode]');
  if(mode&&!game.pending){stageMode=mode.dataset.ad207Mode;render();return;}
  if(event.target.closest?.('[data-ad207-commit-discard]')){
   if(game.pending||game.materials.length<2)return;
   const ordered=[...game.materials],keep=ordered.includes(game.discardKeepUid)?game.discardKeepUid:ordered[0];
   if(!prepareNormal(game,keep))return;
   game.pending.discardUids=ordered.filter(uid=>uid!==keep);
   delete game.discardKeepUid;stageMode='fusion';render();return;
  }
  const control=event.target.closest?.('[data-ad56-remove]');
  if(control&&!game.pending)markMaterial(Number(control.dataset.ad56Remove));
  else if(event.target.closest?.('.stage-card')&&game.pending?.kind==='fusion')clearSelection();
 });
 document.getElementById('summonStage')?.addEventListener('contextmenu',event=>{
  const chip=event.target.closest?.('[data-ad56-remove]');
  if(!chip||!game||!inputAllowed()||game.pending)return;
  event.preventDefault();
  const uid=Number(chip.dataset.ad56Remove),i=game.materials.indexOf(uid);
  if(i<0)return;
  if(stageMode==='discard')game.discardKeepUid=uid;
  else game.materials.push(...game.materials.splice(i,1));
  render();
 });
 window.ArcaneSummonStage56=Object.freeze({version:'20.7',renderStage});
 if(game&&uiMode==='duel')renderStage();
})();
