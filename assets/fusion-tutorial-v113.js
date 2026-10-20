/* Arcane Duel v11.3 - contextual fusion teaching and core card selection.
 * Preview and help are side-effect-free; only the existing game actions
 * can consume materials or spend fusion templates.
 */
'use strict';
(()=>{
 const math=window.ArcaneFusionRework113;
 if(!math)return;
 const esc=x=>escapeHtml(String(x??''));
 const roleLabels={predator:'Predator',guardian:'Wächter',soul:'Seelenzehrer',
  resonator:'Resonator',combatant:'Allrounder'};
 const examples=[
  {levels:[1,1],summary:'Einsteiger: Zwei Level-1-Karten können eine Level-2-Fusionsvorlage bilden.'},
  {levels:[2,2],summary:'Level 2 + 2 bleibt in der frühen Entwicklung. Kein kostenloser Level-6-Sprung.'},
  {levels:[6,5],summary:'Ein Level-6-Kernmonster und Level 5 passen sehr gut zusammen.'},
  {levels:[6,5,1,1,1],summary:'Drei schwache Füllkarten geben keinen zusätzlichen Levelaufstieg und verschlechtern die Qualität.'},
  {levels:[3,4,5],summary:'Eine Kleine Straße schützt die Qualität vor Abstandsabzügen und gibt Pokerwürfe.'},
  {levels:[3,4,5,6],summary:'Große Straße: vier aufeinanderfolgende Level in beliebiger Reihenfolge.'},
  {levels:[2,3,4,5,6],summary:'Gigantische Straße: fünf aufeinanderfolgende Level. Extra Rang, starke Pokerwürfe.'}
 ];
 function selected(){
  if(!game||game.mode!=='pve')return null;
  const g=game,p=g.players[g.active];
  if(g.pending){
   if(g.pending.kind==='fusion')return {g,levels:g.pending.levels,materials:[],pending:true};
   return null;
  }
  const materials=(g.materials||[]).map(uid=>p.hand.find(c=>c.uid===uid)).filter(Boolean);
  if(materials.length<2)return null;
  return {g,levels:materials.map(c=>dataOf(c).level),materials,pending:false};
 }
 function explanation(set){
  if(!set)return null;
  const {g,levels,materials,pending}=set;
  let rule=math.calculate(levels,g,materials);
  let budget=pending?fusionBudget(levels,g):fusionBudget(levels,g,materials);
  const available=game.players[g.active].remainingFusion.map(id=>CARDS[id]).filter(Boolean);
  const templates=available.filter(c=>c.level<=budget);
  const best=templates.length?Math.max(...templates.map(c=>c.level)):0;
  const pattern=window.ArcaneFusionMath.pattern(levels,materials.map(m=>dataOf(m).element));
  const quality=window.ArcaneFusionMath.tuned(g,levels,materials.map(m=>dataOf(m).element),materials);
  const coreName=materials[rule.coreIndex]?dataOf(materials[rule.coreIndex]).name:'Kernkarte';
  let suggestion='';
  if(best<budget&&budget>0){
   suggestion='Dein Materialbudget reicht bereits weiter. Für Level '+budget+
    ' brauchst du eine passende, noch verfügbare Fusionsvorlage in deinem Fusionsdeck.';
  }else if(!pending){
   let next=null;
   const target=Math.min(10,budget+1);
   for(let i=0;i<levels.length&&!next;i++){
    if(i===rule.coreIndex)continue;
    for(let lv=levels[i]+1;lv<=10;lv++){
     const test=levels.slice();test[i]=lv;
     if(math.calculate(test,g,materials).level>=target){next={
      text:'Ersetze Material '+(i+1)+' (Lv '+levels[i]+') durch mindestens Lv '+lv+
       '. Dadurch wäre theoretisch Lv '+target+' erreichbar.'};break;}
    }
   }
   if(!next&&levels.length<5){
    for(let lv=1;lv<=10;lv++){
     const test=levels.concat(lv);
     if(math.calculate(test,g,materials).level>=target){next={text:'Ein zusätzliches Material auf Lv '+
      lv+' oder höher könnte theoretisch Lv '+target+' ermöglichen.'};break;}
    }
   }
   suggestion=next?.text||'Für die nächste Stufe brauchst du eine höherstufige Kernkarte oder eine stärkere passende Kombination.';
  }
  const role=materials.length>=2?window.ArcaneRoleFusion?.inheritance?.(materials):null;
  const detail=rule.others?.map((level,i)=>'Material '+(i+2)+': Lv '+level+
   ' · Gewicht '+Math.round((rule.weights[i]||0)*100)+' %').join(' · ')||'';
  return {g,rule,budget,best,pattern,quality,coreName,role,suggestion,detail,pending,
   inherited:quality.heritagePct||0,resonance:quality.resonancePct||0};
 }
 function openHelp(){
  const set=selected();if(!set){toast('Wähle zuerst zwei bis fünf Fusionsmaterialien.');return;}
  const info=explanation(set),q=info.rule;
  const title=info.pattern.name.replace('Große Straße','Gigantische Straße');
  const screen=
   '<div class="ad113-help-results"><span>Materialbudget bis <b>Lv '+info.budget+'</b></span>'+
   '<span>Höchste verfügbare Vorlage: <b>'+(info.best?'Lv '+info.best:'keine')+'</b></span>'+
   '<span>Qualität: <b>'+Math.round(info.quality.factor*100)+' %</b></span></div>'+
   '<p><b>Kernkarte:</b> '+esc(info.coreName)+' · Level '+(q.core||'?')+'. '+
   'Dein Basisschutz beträgt Level '+(q.floor||'?')+'. Das nächste Material '+
   'beeinflusst den Grundrang. Die weiteren Materialien wirken mit geringeren, aber echten Gewichten.</p>'+
   '<p><b>Alle Materialien:</b> '+esc(info.detail)+'</p>'+
   (q.street?'<p class="ad113-positive"><b>✦ '+esc(q.streetName)+
    '!</b> Die Materiallevel bilden eine geschlossene Folge. Der normale Qualitätsabzug für Levelabstände entfällt. '+
    'Die Reihenfolge des Anklickens ist egal.</p>':
    '<p>Unterschiedliche Materiallevel beeinflussen die Qualität. Schwache Füllkarten zählen mit, '+
    'geben aber keinen kostenlosen Levelaufstieg.</p>')+
   '<p><b>Kombination:</b> '+esc(info.pattern.name)+' · '+
    (info.quality.rollBonus||0)+' zusätzliche Pokerwürfe. '+
    (info.role?'Kampfrolle: '+esc(roleLabels[info.role]||info.role)+'. ':'')+
    (info.resonance?'Resonanz: +'+info.resonance+' %. ':'')+
    (info.inherited?'Geerbte Qualität: +'+info.inherited.toFixed(1)+' %.':'')+'</p>'+
   '<div class="ad113-next"><b>Was fehlt für eine stärkere Fusion?</b><p>'+esc(info.suggestion||
    'Wähle nach der Vorbereitung die passende Monsterzone aus.')+'</p></div>'+
   '<p class="ad113-subtle">Es wird nichts verbraucht. Die Vorschau beschreibt das maximal zulässige Level, '+
    'nicht einen garantierten Kartenfund. Für höhere Stufen muss eine passende Fusionsvorlage ausgerüstet sein.</p>';
  openModal(modalHtml('✧ WARUM DIESE FUSIONSSTUFE?','Deine aktuelle Materialkombination','?','So kommt die Vorschau zustande.',screen,
   '<button class="btn primary" id="ad113ExplainClose">VERSTANDEN</button>'));
  $('ad113ExplainClose').onclick=hideModal;
 }
 function decorateStage(){
  if(!game||uiMode!=='duel'||game.mode!=='pve'||game.active!==0)return;
  const stage=$('summonStage');if(!stage)return;
  const set=selected();
  if(!set)return;
  const info=explanation(set);
  if(!set.pending){
   const core=info.rule.coreIndex;
   stage.querySelectorAll('[data-ad56-remove]').forEach((el,i)=>{
    const row=el.parentElement||el;
    row.querySelector?.('[data-ad113-core]')?.remove();
    const button=document.createElement('button');
    button.type='button';button.className='btn tiny ad113-core'+(core===i?' active':'');
    button.dataset.ad113Core=String(set.materials[i].uid);
    button.textContent=core===i?'✦ KERNKARTE':'Als Kernkarte';
    button.setAttribute('aria-label',dataOf(set.materials[i]).name+' als Fusionskern wählen');
    row.appendChild(button);
   });
  }
  const bar=document.createElement('div');bar.className='ad113-prediction';
  bar.innerHTML='<span>✦ FUSION: bis <b>LV '+info.budget+'</b> · '+
   esc(info.rule.streetName||info.pattern.name)+'</span>'+
   '<button class="btn tiny" type="button" data-ad113-explain> ? Warum dieses Level? </button>';
  stage.appendChild(bar);
 }
 const prevRender=render;
 render=function(...args){const res=prevRender(...args);decorateStage();return res;};
 $('summonStage')?.addEventListener('click',ev=>{
  const c=ev.target.closest?.('[data-ad113-core]');
  if(c&&game&&!game.pending&&inputAllowed()){
   ev.stopImmediatePropagation();ev.preventDefault();
   game.arcaneFusionCoreUid=Number(c.dataset.ad113Core);
   render();return;
  }
  if(ev.target.closest?.('[data-ad113-explain]')){
   ev.stopImmediatePropagation();ev.preventDefault();openHelp();
  }
 });
 const oldRules=showRules;
 function handbook(){
  return '<details class="ad113-handbook" open><summary>✧ Fusionen meistern – Stufe, Qualität & Kernkarte</summary>'+
   '<div class="arcane-rule-body"><p><b>1. Kernkarte wählen:</b> Markiere mindestens zwei Handkarten. '+
   'Unter den Materialien kannst du „Als Kernkarte“ drücken. Sie legt den Ausgangspunkt deiner Fusion fest. '+
   'Bei Straßen zählt automatisch die höchste Stufe, damit die Reihenfolge keinen Vorteil verschafft.</p>'+
   '<p><b>2. Materialien ergänzen:</b> Alle zwei bis fünf Karten zählen. Gute Levelabstände helfen. '+
   'Das dritte, vierte und fünfte Material wirken mit 75 %, 55 % und 40 % Gewichtung auf die Zusatzqualität. '+
   'Drei bis fünf gut passende Materialien können einmal +1 Level ermöglichen. '+
   'Schwache Füllkarten bringen keinen freien Rang.</p>'+
   '<p><b>3. Das Fusionslevel ist nicht alles:</b> Das Level bestimmt die erlaubte Vorlage. '+
   'Die Qualität verbessert ATK/DEF vor den echten Wertewürfen, Rollenzugehörigkeit verschiebt ATK/DEF '+
   'vor dem Würfeln und die Resonanz von Allroundern/Resonatoren addiert einen eigenen Bonus. '+
   'Materialboni kommen anschließend hinzu.</p>'+
   '<p><b>4. Pokerstraßen:</b> 3 Karten = Kleine Straße, 4 = Große Straße, '+
   '5 = <b>Gigantische Straße</b>. Die Level müssen ohne Lücke aufeinanderfolgen; '+
   'die Reihenfolge ist egal. Straßen haben eigene Qualitäts- und Würfelboni, '+
   'statt für notwendige Levelunterschiede abgestraft zu werden.</p>'+
   '<p><b>5. Kettenfusionen:</b> Eine vorhandene Fusion ist eine eigene Kernkarte. '+
   'Ihre Stufe bleibt mindestens erhalten. Von ihrer neu erarbeiteten Qualität werden 35 % '+
   '(maximal 15 % pro Weiterfusion) übernommen. Alte, schon vererbte Qualität wird nicht erneut vervielfacht. '+
   'Jede neue Fusion verbraucht weiterhin eine echte Vorlage aus deinem Fusionsdeck.</p>'+
   '<p><b>6. Die speziellen Level-1-Quests</b> besitzen ihre eigenen Regeln '+
   'und werden nicht durch Standardfusionen ersetzt.</p>'+
   '<h4>Praktische Beispiele</h4><div class="ad113-example-grid">'+examples.map(x=>{
    const rule=math.calculate(x.levels,{mode:'pve',active:0},[]);
    return '<article class="ad113-example"><strong>'+x.levels.map(x=>'Lv '+x).join(' + ')+
     ' → maximal Lv '+rule.level+'</strong><p>'+esc(x.summary)+'</p></article>';
   }).join('')+'</div>'+
   '<p><b>Direkt im Duell lernen:</b> Wähle zwei bis fünf Materialien und klicke auf '+
   '„? Warum dieses Level?“. Das Spiel erklärt deine konkrete Auswahl und '+
   'welches zusätzliche Material die nächste Stufe ermöglichen könnte.</p></div></details>';
 }
 showRules=function(...args){
  const result=oldRules(...args);
  const host=$('modal')?.querySelector?.('.arcane-handbook')||$('modal');
  if(host&&!host.querySelector?.('.ad113-handbook'))host.insertAdjacentHTML('beforeend',handbook());
  return result;
 };
 window.ArcaneFusionTutorial113=Object.freeze({version:'11.3.0',explanation,handbook});
})();
