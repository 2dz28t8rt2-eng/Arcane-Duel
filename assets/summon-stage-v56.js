/* Arcane Duel 5.6: semantic summoning cockpit.
 * Presentation-only; retains legal summoning, fusion and zone handling.
 */
'use strict';
(()=>{
 const previousRender=render;
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
  const g=game,human=g.mode==='pvp'||g.active===0,
        me=currentPlayer(g),isReady=human&&!g.summoned&&!g.pending,
        pending=human?g.pending:null,
        chosen=human&&g.selection?.type==='hand'?me.hand.find(c=>c.uid===g.selection.uid):null,
        material=human?(g.materials||[]).map(uid=>me.hand.find(c=>c.uid===uid)).filter(Boolean):[],
        levels=material.map(c=>dataOf(c).level),
        cost=levels.length>=2?qualityRolls(levels):null,
        current=pending?.card||chosen;
  const phase=!human?'Gegnerzug':pending?'Feldplatz wählen':g.summoned?'Beschwörung verbraucht':material.length>=2?'Fusion vorbereiten':chosen?'Normale Beschwörung':'Karte wählen';
  const phaseId=!human?'opponent':pending?'placement':g.summoned?'spent':material.length>=2?'fusion':chosen?'summon':'select';
  const label=pending?.kind==='fusion'?'Fusionskarte':pending?'Ausgewählte Beschwörung':chosen?'Ausgewählte Handkarte':'Kartenvorschau';
  const showStats=pending?.kind!=='fusion';
  const selectedHtml=current?(
   pending?.kind==='normal'?
    '<div class="stage-card ad56-stage-card" title="Karte erneut anklicken, um die Beschwörung zurückzunehmen">'+fullCardHtml(current)+'</div>':
   summarizeCard(current,showStats)
  ):'<p class="ad56-empty">Wähle eine Handkarte oder markiere bis zu fünf Fusionsmaterialien.</p>';
  const materialHtml=material.length?
   '<ol class="ad56-mat-list">'+material.map((c,i)=>{
    const t=dataOf(c);
    return '<li><button type="button" class="ad56-mat-chip" data-ad56-remove="'+c.uid+'" '+(!isReady?'disabled':'')+
     ' aria-label="'+esc(t.name)+' aus den Fusionsmaterialien entfernen">'+
     '<span class="ad56-mat-order">'+(i+1)+'</span><span>'+esc(t.name)+'</span><small>Lv '+t.level+'</small><span aria-hidden="true">×</span></button></li>';
   }).join('')+'</ol>':
   '<p class="ad56-empty">Noch keine Materialien ausgewählt. Rechtsklick auf die Handkarte oder Touch-Fusion aktivieren.</p>';
  let limits='';
  if(levels.length>=2){
   const options=fusionOptions(g,levels,material).filter(c=>canCompleteHandFusion(g,levels,c.id));
   limits='<div class="ad56-material-status"><strong>'+levels.length+' / 5 Materialien</strong>'+
    '<span>Qualität: '+cost+' Würfe</span><span>'+options.length+' mögliche Vorlagen</span>'+
    (options.length?'<span>Maximale Stufe: '+Math.max(...options.map(c=>c.level))+'</span>':
     '<span class="ad56-warning">Derzeit keine legale Fusionsvorlage</span>')+'</div>';
  }else if(material.length){
   limits='<div class="ad56-material-status"><span>1 / 5 Materialien · mindestens 2 wählen</span></div>';
  }
  const zones=me.field.map((c,index)=>{
   let status='frei',title='Freie Monsterzone';
   if(c){
    status='occupied';title=dataOf(c).name;
   }
   const eligible=!!pending&&(!c||(!isFateCard(c)&&!isFateCard(pending.card)));
   return '<div class="ad56-zone '+status+(eligible?' eligible':'')+'">'+
    '<strong>'+String(index+1).padStart(2,'0')+'</strong><span>'+esc(title)+'</span>'+
    '<small>'+(!c?'Frei':pending&&eligible?'Feldfusion prüfen':'Besetzt')+'</small></div>';
  }).join('');
  host.innerHTML='<div class="ad56-cockpit" data-stage-phase="'+phaseId+'">'+
   '<div class="ad56-topline"><span class="ad56-kicker">✦ BESCHWÖRUNGSZENTRALE</span><strong>'+esc(phase)+'</strong></div>'+
   '<div class="ad56-steps" aria-label="Beschwörungsablauf">'+
    '<span class="'+(!pending&&!g.summoned?'active':'')+'">1 · Karte / Material</span>'+
    '<span class="'+(pending?'active':'')+'">2 · Vorbereiten</span>'+
    '<span class="'+(pending?'active':'')+'">3 · Zone auf dem Feld</span></div>'+
   '<div class="ad56-columns">'+
    '<section class="ad56-block ad56-selection"><h3>'+esc(label)+'</h3>'+selectedHtml+
      '<p class="ad56-hint">'+(pending?'Jetzt auf eine der fünf Zonen deines Feldes klicken.':
       chosen?'„Beschwören“ wählen oder eine andere Handkarte anklicken.':
       material.length?'Weitere Materialien markieren oder „Fusionieren“ drücken.':
       'Du darfst pro Zug eine Karte beschwören oder eine Fusion ausführen.')+'</p></section>'+
    '<section class="ad56-block ad56-material"><h3>Fusionsmaterial</h3>'+materialHtml+limits+'</section></div>'+
   '<section class="ad56-block ad56-placement"><h3>Monsterzonen <small>Feldzone anklicken – kein zweites Pop-up</small></h3>'+
    '<div class="ad56-zones">'+zones+'</div>'+
    '<p class="ad56-hint">'+(pending?
       'Freier Platz = Beschwörung. Besetzte Zone = mögliche Feldfusion; Kartenstufen und verfügbare Vorlagen gelten weiterhin.':
       'Die Feldzone wählst du nach „Beschwören“ oder „Fusionieren“. Ein besetzter Platz ist kein garantierter Fusionsplatz.')+
     '</p></section></div>';
 }
 render=function(){const result=previousRender();renderStage();return result;};
 document.getElementById('summonStage')?.addEventListener('click',event=>{
  const control=event.target.closest?.('[data-ad56-remove]');
  if(!control||!game||!inputAllowed()||game.summoned||game.pending)return;
  markMaterial(Number(control.dataset.ad56Remove));
 });
 window.ArcaneSummonStage56=Object.freeze({version:'5.6.0',renderStage});
 if(game&&uiMode==='duel')renderStage();
})();