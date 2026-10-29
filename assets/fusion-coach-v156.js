/* Arcane Duel v15.6 – approachable, read-only fusion guidance.
 * Only the player's explicit "Übernehmen" click changes marked materials.
 * No card, template, combat rule, RNG state or opponent behavior is changed.
 */
'use strict';
(()=>{
  const esc=value=>escapeHtml(String(value??''));
  const $id=id=>document.getElementById(id);
  const suggestions=new WeakMap();
  const validGame=g=>g&&g.mode==='pve'&&g.active===0&&g.winner===null;
  const selectedMaterials=g=>(g?.materials||[]).map(uid=>g.players[0].hand.find(c=>c.uid===uid)).filter(Boolean);
  const legalTemplates=(g,materials)=>{
    if(!validGame(g)||!Array.isArray(materials)||materials.length<2||materials.length>5||materials.some(c=>!c||isFateCard(c)))return [];
    const levels=materials.map(c=>dataOf(c).level);
    return fusionOptions(g,levels,materials).filter(c=>canCompleteHandFusion(g,levels,c.id));
  };
  function handRoutes(g){
    if(!validGame(g)||g.pending||g.summoned)return [];
    const hand=g.players[0].hand.filter(c=>!isFateCard(c)).slice(0,8),result=[];
    for(let mask=0;mask<(1<<hand.length);mask++){
      const cards=hand.filter((_,i)=>mask&(1<<i));
      if(cards.length<2||cards.length>5)continue;
      const templates=legalTemplates(g,cards);
      if(!templates.length)continue;
      const levels=cards.map(c=>dataOf(c).level),pattern=window.ArcaneFusionMath?.pattern?.(levels,cards.map(c=>dataOf(c).element));
      result.push({uids:cards.map(c=>c.uid),levels,templateIds:templates.map(c=>c.id),
        highest:Math.max(...templates.map(c=>c.level)),pattern:pattern?.name||'Freie Fusion'});
    }
    return result;
  }
  function guidedRoutes(routes){
    if(!routes.length)return [];
    const selected=[],seen=new Set();
    const add=(label,ordered)=>{
      const route=ordered.find(item=>!seen.has(item.uids.join(',')));
      if(route){seen.add(route.uids.join(','));selected.push({...route,label});}
    };
    add('Höhere Vorlage',[...routes].sort((a,b)=>b.highest-a.highest||a.uids.length-b.uids.length));
    add('Weniger Material',[...routes].sort((a,b)=>a.uids.length-b.uids.length||b.highest-a.highest));
    add('Spezialkombination',[...routes].filter(r=>r.pattern!=='Freie Fusion')
      .sort((a,b)=>b.highest-a.highest||a.uids.length-b.uids.length));
    return selected.slice(0,3);
  }
  function zoneRoutes(g){
    if(!validGame(g)||!g.pending)return [];
    const p=g.players[0],incoming=g.pending.card;
    return p.field.map((old,index)=>{
      if(!old)return {index,kind:'open',label:'Zone '+(index+1)+': frei',attackSpent:!!incoming.attacked};
      if(isFateCard(old)||isFateCard(incoming))return {index,kind:'blocked',label:'Zone '+(index+1)+': Schicksalskarten können nicht fusionieren'};
      const levels=[...g.pending.levels,dataOf(old).level];
      const templates=fusionOptions(g,levels,[incoming,old]);
      if(!templates.length)return {index,kind:'blocked',label:'Zone '+(index+1)+': keine passende Anschlussvorlage'};
      return {index,kind:'fusion',label:'Zone '+(index+1)+': Weiterfusion bis Lv '+Math.max(...templates.map(c=>c.level)),
        templateIds:templates.map(c=>c.id),attackSpent:!!(incoming.attacked||old.attacked)};
    });
  }
  const routeName=(g,r)=>r.uids.map(uid=>{
    const card=g.players[0].hand.find(c=>c.uid===uid);
    return card?dataOf(card).name+' (Lv '+dataOf(card).level+')':'unbekannt';
  }).join(' + ');
  function guideMarkup(g){
    const p=g.players[0];
    if(g.summoned)return '';
    if(g.pending){
      const zones=zoneRoutes(g),open=zones.filter(z=>z.kind==='open'),fusions=zones.filter(z=>z.kind==='fusion');
      const attackSpent=!!g.pending.card.attacked;
      return '<section class="ad156-coach ad156-pending" id="ad156-fusion-coach" aria-label="Hilfe zur Platzierung">'+
        '<div class="ad156-head"><strong>✧ Schritt 2 · Platzierung</strong><span>Es wird erst beim Klick auf die Zone platziert.</span></div>'+ 
        '<p>Eine <b>freie Zone</b> beschwört die vorbereitete Karte. Eine <b>besetzte Zone</b> verbraucht außerdem das Feldmonster und eine weitere Fusionsvorlage.</p>'+ 
        '<div class="ad156-status">'+open.length+' freie Zonen · '+fusions.length+' mögliche Weiterfusionen'+
        (attackSpent?' · Angriff bereits verbraucht':'')+'</div>'+ 
        (fusions.length?'<details><summary>Welche Feldfusion ist möglich?</summary><ul>'+fusions.map(z=>
          '<li>'+esc(z.label)+(z.attackSpent?' · <b>Angriff bleibt verbraucht</b>':' · Angriff im erlaubten Zug möglich')+'</li>').join('')+'</ul></details>':'')+
        (!open.length&&!fusions.length?'<p class="ad156-warning">Keine legale Zone: Prüfe deinen Fusionsvorrat und die markierten Zonen.</p>':'')+
        '</section>';
    }
    const chosen=selectedMaterials(g),options=legalTemplates(g,chosen),routes=handRoutes(g),ideas=guidedRoutes(routes);
    suggestions.set(g,ideas);
    const legal=chosen.length>=2&&options.length>0;
    let status='';
    if(chosen.length===1)status='Noch <b>eine weitere Handkarte</b> markieren, um eine Fusion vorzubereiten.';
    else if(chosen.length>=2){
      const levels=chosen.map(c=>dataOf(c).level),rank=fusionBudget(levels,g,chosen);
      status='<b>'+chosen.length+' Materialien</b> ausgewählt · theoretisches Materialbudget Lv '+rank+
        ' · <b>'+options.length+' tatsächlich verfügbare '+(options.length===1?'Vorlage':'Vorlagen')+'</b>.'+
        (legal?'<br>Mit <b>„Fusionieren“</b> die Vorlage auswählen. Erst danach werden Materialien und eine Fusionskopie verbraucht.':
          '<br><span class="ad156-warning">'+esc(fusionFailureReason(g,levels))+'</span>')+
        (p.field.every(Boolean)?'<br><b>Volles Feld:</b> Es muss anschließend noch eine zweite Fusion auf einer besetzten Zone möglich sein.':'');
    }else status='Zwei bis fünf Handkarten markieren und danach <b>„Fusionieren“</b> wählen. Rechtsklick oder Touch-Fusionsmodus funktioniert auch.';
    const shown=ideas.map((route,i)=>'<li><div><span class="ad156-label">'+esc(route.label)+'</span><b>'+esc(routeName(g,route))+'</b>'+ 
        '<small>'+esc(route.pattern)+' · '+route.templateIds.length+' Vorlagen verfügbar · höchste Lv '+route.highest+'</small></div>'+ 
        '<button class="btn" type="button" data-ad156-apply="'+i+'" aria-label="'+esc(routeName(g,route))+' als Fusionsmaterial markieren">Materialien übernehmen</button></li>').join('');
    return '<section class="ad156-coach" id="ad156-fusion-coach" aria-label="Fusionsassistent">'+
      '<div class="ad156-head"><strong>✧ Fusionsassistent</strong><span>Deine aktuelle Hand · unverbindliche Vorschau</span></div>'+ 
      '<p class="ad156-status" role="status" aria-live="polite">'+status+'</p>'+ 
      (ideas.length?'<details class="ad156-suggestions"'+(!chosen.length?' open':'')+'><summary>✦ '+ideas.length+
        ' mögliche Handkombinationen ansehen</summary><ul>'+shown+'</ul><small>„Übernehmen“ markiert nur Karten. Die Fusion wird erst durch deine Bestätigung ausgeführt. „Höhere Vorlage“ bedeutet nicht automatisch höhere Kampfwerte.</small></details>':
        '<p class="ad156-muted">Mit dieser Hand und deinem verbleibenden Fusionsvorrat ist momentan keine Handfusion verfügbar. Eine normale Beschwörung kann trotzdem möglich sein.</p>')+
      '<small class="ad156-muted">Fusionsvorlage = eine ausgerüstete Karte aus deinem Fusionsdeck. Endgültige ATK und DEF werden erst bei der Beschwörung gewürfelt und aufgedeckt.</small></section>';
  }
  function decorateZones(g){
    if(!g.pending)return;
    for(const z of zoneRoutes(g)){
      const button=document.querySelector('#ownRow [data-mine="'+z.index+'"]');
      if(!button)continue;
      button.classList.add('ad156-zone-'+z.kind);
      const text=z.label+(z.attackSpent?' · Angriff verbraucht':'');
      button.title=text;
      button.setAttribute('aria-label',text);
    }
  }
  function renderGuide(){
    if(uiMode!=='duel'||!validGame(game))return;
    const stage=$id('summonStage'),host=stage?.querySelector('.ad56-cockpit');
    if(!host)return;
    host.insertAdjacentHTML('beforeend',guideMarkup(game));
    decorateZones(game);
  }
  function enhanceChoiceModal(){
    const modal=$id('modal');
    if(!modal?.classList.contains('fusion-choice-modal')||modal.querySelector('.ad156-choice-explain'))return;
    const grid=modal.querySelector('.arcane-sealed-choices, .fusion-choice-grid');
    if(!grid)return;
    grid.insertAdjacentHTML('beforebegin','<section class="ad156-choice-explain">'+
      '<b>So geht es weiter:</b> 1. Fusionsvorlage wählen. 2. Eine Zone anklicken. 3. Auf einer besetzten Zone entsteht eine weitere Fusion und es wird eine zusätzliche Vorlage verbraucht.'+
      '<p>Die Auswahl zeigt nur verfügbare Karten; die endgültigen Kampfwerte bleiben bis zur Enthüllung verborgen. Eine bereits verbrauchte Attacke bleibt auch nach einer Weiterfusion verbraucht.</p></section>');
  }
  const previousRender=render;
  render=function(){const result=previousRender.apply(this,arguments);
    try{renderGuide();}catch(error){console.warn('Fusionsassistent ausgelassen:',error);}
    return result;
  };
  const previousModal=chooseFusionModal;
  chooseFusionModal=function(){const result=previousModal.apply(this,arguments);
    try{enhanceChoiceModal();}catch(error){console.warn('Fusionshilfe im Auswahlfenster ausgelassen:',error);}
    return result;
  };
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-ad156-apply]');
    if(!button||!validGame(game)||game.summoned||game.pending||!inputAllowed())return;
    const idea=suggestions.get(game)?.[Number(button.dataset.ad156Apply)];
    if(!idea||!Number.isInteger(Number(button.dataset.ad156Apply)))return;
    const cards=idea.uids.map(uid=>game.players[0].hand.find(c=>c.uid===uid));
    if(cards.some(c=>!c||isFateCard(c))||!legalTemplates(game,cards).length)return;
    event.preventDefault();event.stopPropagation();
    game.materials=[...idea.uids];game.selection=null;materialMode=true;
    render();toast('Materialien markiert. Wähle „Fusionieren“, um fortzufahren. Noch wurde nichts verbraucht.');
  });
  window.ArcaneFusionCoach156=Object.freeze({version:'15.6.0',legalTemplates,handRoutes,guidedRoutes,zoneRoutes,guideMarkup});
})();
