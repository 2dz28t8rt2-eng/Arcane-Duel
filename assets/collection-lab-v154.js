/* Arcane Duel 15.4 – read-only fusion paths and personal monster chronicle.
 * This module never modifies templates, combat rules, loot or the opponent AI.
 */
'use strict';
(()=>{
  const KEY='arcane-duel-v154-first-discoveries';
  const id=id=>document.getElementById(id);
  const esc=value=>escapeHtml(String(value??''));
  const numeric=value=>Number.isFinite(Number(value))?Number(value):0;
  let fallback={};
  function readFirst(){
    try{const value=JSON.parse(window.localStorage?.getItem(KEY)||'{}');
      return value&&typeof value==='object'&&!Array.isArray(value)?value:{};
    }catch(_){return {...fallback};}
  }
  function writeFirst(value){
    fallback={...value};
    try{window.localStorage?.setItem(KEY,JSON.stringify(value));}catch(_){}
  }
  // Only new, real collection additions from v15.4 onward receive a first-found date.
  // Historical timestamps were never recorded; we deliberately do not invent them.
  const originalAddCard=addCard;
  addCard=function(cardId){
    const previouslyOwned=!!profile?.inventory?.[cardId];
    const result=originalAddCard.apply(this,arguments);
    if(!previouslyOwned&&numeric(profile?.inventory?.[cardId])>0){
      const first=readFirst();
      if(!first[cardId]){first[cardId]=Date.now();writeFirst(first);}
    }
    return result;
  };

  // The actual game's v11.3 formula is authoritative for its rank preview.
  // A preview is not a promise: drawing materials, quest permission and fusion
  // timing still apply in the duel.
  const calc=levels=>window.ArcaneFusionRework113?.calculate?.(levels,null,[])||{level:0};
  function cardCopies(main,levels){
    const available=[...main],found=[];
    for(const level of levels){
      const at=available.findIndex(c=>CARDS[c]?.level===level&&!CARDS[c]?.fusionOnly);
      if(at<0)return null;
      found.push(available.splice(at,1)[0]);
    }
    return found;
  }
  function samplePatterns(main){
    if(!Array.isArray(main))return [];
    const levels=[...new Set(main.map(x=>CARDS[x]?.level).filter(x=>Number.isInteger(x)&&x>=1&&x<=10))].sort((a,b)=>a-b);
    const combos=[];
    for(let i=0;i<levels.length;i++)for(let j=i;j<levels.length;j++){
      const pair=[levels[i],levels[j]];
      if(cardCopies(main,pair))combos.push(pair);
      for(let k=j;k<levels.length;k++){
        const triple=[...pair,levels[k]];
        if(cardCopies(main,triple)&&!triple.every(n=>n===1))combos.push(triple);
      }
    }
    // Explicitly sample high-impact 4-/5-card streets as well.
    for(const length of [4,5])for(let start=1;start<=11-length;start++){
      const street=Array.from({length},(_,i)=>start+i);
      if(cardCopies(main,street))combos.push(street);
    }
    return combos;
  }
  function fusionRoutes(main,targetId){
    const target=CARDS[targetId];
    if(!target?.fusionOnly)return [];
    const output=[];
    for(const levels of samplePatterns(main)){
      const rank=calc(levels).level;
      if(!rank||rank<target.level)continue;
      const materials=cardCopies(main,levels);
      if(!materials)continue;
      const gap=rank-target.level;
      output.push({target:targetId,materials,levels,rank,gap,
        score:gap*10+levels.length*3+levels.reduce((sum,x)=>sum+x,0)/10});
    }
    return output.sort((a,b)=>a.score-b.score||a.rank-b.rank).slice(0,4);
  }
  function deckFor(slot,kind){
    if(slot===profile.activeSlot){
      if(menuTab==='collection'&&kind==='main')return deckDraft;
      if(menuTab==='fusions'&&kind==='fusion')return fusionDraft;
      return kind==='main'?profile.activeDeck:profile.fusionDeck;
    }
    return profile.slots?.[slot]?.[kind]||[];
  }
  function openPlanner(){
    if(game||uiMode!=='menu')return;
    const slotOptions=[0,1,2].map(n=>'<option value="'+n+'"'+(n===profile.activeSlot?' selected':'')+'>Deckplatz '+(n+1)+'</option>').join('');
    openModal('<section class="ad154-modal"><div class="modal-kicker">DECKLABOR · FUSIONSPFADE</div><h2>Fusionsplaner</h2>'+ 
      '<p>Zeigt mögliche Materialwege mit der tatsächlich geltenden Level-Berechnung. Das ist eine Vorschau auf Deckkarten, keine Garantie für Starthand, Wurfqualität oder Freischaltungen.</p>'+ 
      '<div class="ad154-form"><label>Deckplatz<select id="ad154-slot">'+slotOptions+'</select></label>'+ 
      '<label>Fusionsvorlage<select id="ad154-target" aria-label="Fusionsvorlage wählen"></select></label></div>'+ 
      '<div id="ad154-route-results" aria-live="polite"></div>'+ 
      '<p class="ad154-muted">Schnellplaner: prüft alle vorhandenen 2er- und 3er-Levelkombinationen sowie 4er- und 5er-Straßen. Feldfusionen, Rollenvererbung, Sonderquests und Handzieh-Wahrscheinlichkeiten werden nicht vorausgesagt.</p>'+ 
      '<div class="modal-actions"><button type="button" class="btn" id="ad154-planner-close">Schließen</button></div></section>');
    id('ad154-planner-close').onclick=()=>hideModal();
    const refreshTargets=()=>{
      const slot=Number(id('ad154-slot').value),targets=[...new Set(deckFor(slot,'fusion'))].filter(x=>CARDS[x]?.fusionOnly);
      id('ad154-target').innerHTML=targets.map(x=>'<option value="'+x+'">'+esc(CARDS[x].name)+' · Lv '+CARDS[x].level+'</option>').join('');
      id('ad154-target').disabled=!targets.length;
      showRoutes();
    };
    const showRoutes=()=>{
      const slot=Number(id('ad154-slot').value),targetId=Number(id('ad154-target').value),main=deckFor(slot,'main'),fusion=deckFor(slot,'fusion');
      const output=id('ad154-route-results');
      if(!fusion.includes(targetId)||!CARDS[targetId]){
        output.innerHTML='<p>Keine Fusionsvorlage in diesem Deckplatz ausgerüstet.</p>';return;
      }
      const routes=fusionRoutes(main,targetId);
      output.innerHTML='<h3>'+esc(CARDS[targetId].name)+' · Ziel Lv '+CARDS[targetId].level+'</h3>'+ 
        (routes.length?'<ol class="ad154-routes">'+routes.map(route=>'<li><b>'+route.materials.map(x=>esc(CARDS[x]?.name||'Karte')).join(' + ')+'</b>'+ 
          '<span>'+route.levels.map(x=>'Lv '+x).join(' · ')+' → berechnete Obergrenze Lv '+route.rank+'</span></li>').join('')+'</ol>':
          '<p>Unter den geprüften Materialmustern liegt derzeit keine passende Route für diese ausgerüstete Vorlage. Höhere Kartenstufen oder andere Materialien im Hauptdeck können neue Wege eröffnen.</p>')+
        '<small class="ad154-muted">'+main.length+' Hauptdeckkarten · '+fusion.length+' Fusionskopien. '+
        (slot===profile.activeSlot&&['collection','fusions'].includes(menuTab)?'Offener Deckentwurf wird berücksichtigt; Änderungen werden nicht automatisch gespeichert.':'Gespeicherter Deckstand.')+'</small>';
    };
    id('ad154-slot').onchange=refreshTargets;
    id('ad154-target').onchange=showRoutes;
    refreshTargets();
  }

  const isKnown=c=>!!(c&&c.rpg&&!c.retired&&!c.enemyOnly&&!c.fateOnly&&
    (numeric(profile.inventory?.[c.id])>0||profile.unlocked?.includes(c.id)||profile.fusionOwned?.includes(c.id)));
  function familyProgress(){
    const result=new Map();
    for(const card of CARDS){
      if(!card?.rpg||card.retired||card.enemyOnly||card.fateOnly||card.fusionOnly)continue;
      const family=card.lineRoot??card.variantOf;
      if(family==null)continue;
      const entry=result.get(family)||{all:[],known:[]};
      entry.all.push(card);if(isKnown(card))entry.known.push(card);
      result.set(family,entry);
    }
    return [...result.values()].filter(x=>x.known.length&&x.all.length>=2)
      .sort((a,b)=>b.known.length/b.all.length-a.known.length/a.all.length);
  }
  function chronicleMarkup(){
    const known=CARDS.filter(isKnown),first=readFirst();
    const histories=known.filter(c=>Number.isFinite(Number(first[c.id]))&&Number(first[c.id])>0)
      .sort((a,b)=>Number(first[b.id])-Number(first[a.id])).slice(0,6);
    const families=familyProgress().slice(0,8);
    return '<div class="ad154-journal-head"><h3>✧ Monsterchronik</h3><span>'+known.length+' bekannte Kartenarten</span></div>'+ 
      '<p>Deine gesammelten Monster, ihre Stufenfamilien und nachgewiesene Erstfunde. Unentdeckte Namen und Artworks bleiben geheim.</p>'+ 
      '<div class="ad154-journal-grid"><section><h4>Letzte Erstfunde</h4>'+ 
      (histories.length?histories.map(c=>'<article><b>'+esc(c.name)+' · Lv '+c.level+'</b><small>'+ 
        esc(new Date(first[c.id]).toLocaleDateString('de-AT'))+' · '+esc(c.element||'')+'</small>'+ 
        (c.desc?'<small>'+esc(c.desc)+'</small>':'')+'</article>').join(''):
        '<p class="ad154-muted">Frühere Funddaten sind nicht gespeichert. Neue Erstfunde werden ab diesem Update erfasst.</p>')+
      '</section><section><h4>Bekannte Stufenfamilien</h4>'+ 
      (families.length?families.map(f=>'<article><b>'+esc(f.known[0].name)+' · '+f.known.length+'/'+f.all.length+'</b>'+ 
        '<small>'+f.all.sort((a,b)=>a.level-b.level).map(c=>'Lv '+c.level+(isKnown(c)?' ✓':' ◇')).join(' · ')+'</small></article>').join(''):
        '<p class="ad154-muted">Noch keine mehrstufige Kartenfamilie bekannt.</p>')+
      '</section></div><small class="ad154-muted">Ein Erstfund ist lokal im Browser dokumentiert. Er wird nicht rückwirkend datiert und ist nicht Teil des klassischen Spielstandexports.</small>';
  }
  function wishlistGoals(){
    let selected=[];
    try{
      const saved=JSON.parse(window.localStorage?.getItem('arcane-duel-v122-strategy')||'{}');
      if(Array.isArray(saved.wish))selected=[...new Set(saved.wish)].filter(x=>Number.isInteger(x)&&isKnown(CARDS[x])).slice(0,8);
    }catch(_){}
    if(!selected.length)return '';
    const shards=typeof sharedShards==='function'?numeric(sharedShards()):0;
    const coins=numeric(profile.coins);
    return '<h4>✧ Ressourcen für deine Sammelziele</h4><p>Stand: '+shards+' Splitter · '+coins+' Essenz. '+
      'Die Anzeige betrachtet nur direkt freigeschaltete Herstellungswege.</p><div class="ad154-goal-list">'+ 
      selected.map(cardId=>{
        const c=CARDS[cardId];
        const craft=typeof cardAvailable==='function'&&cardAvailable(cardId)&&
          typeof cardCraftShardCost==='function';
        if(!craft)return '<div><b>'+esc(c.name)+'</b><span>Keine aktuell belegte direkte Herstellung.</span></div>';
        const shardCost=numeric(cardCraftShardCost(cardId));
        const essenceCost=c.fusionOnly&&typeof cardCost==='function'?numeric(cardCost(cardId)):0;
        return '<div><b>'+esc(c.name)+'</b><span>'+Math.max(0,shardCost-shards)+' Splitter fehlen · '+ 
          Math.max(0,essenceCost-coins)+' Essenz fehlen'+(shardCost<=shards&&essenceCost<=coins?' · Materialien ausreichend':'')+'</span></div>';
      }).join('')+'</div><small class="ad154-muted">Dies ist kein Dropversprechen und keine automatische Kauf- oder Herstellungsaktion.</small>';
  }
  function extendMenu(){
    if(uiMode!=='menu')return;
    const tools=id('ad120-menu-tools');
    if(tools&&!id('ad154-planner-open')){
      const button=document.createElement('button');button.className='btn';button.type='button';
      button.id='ad154-planner-open';button.textContent='✦ Fusionsplaner';button.onclick=openPlanner;tools.appendChild(button);
    }
    const lex=id('menuContent')?.querySelector('.ad119-lexicon');
    if(menuTab==='lexicon'&&lex&&!id('ad154-chronicle')){
      const journal=document.createElement('section');journal.id='ad154-chronicle';
      journal.innerHTML=chronicleMarkup();
      const anchor=id('ad122-wishlist')||lex.querySelector('.ad121-bestiary')||lex.querySelector('.ad119-lexicon-intro');
      if(anchor)anchor.insertAdjacentElement('afterend',journal);else lex.prepend(journal);
    }
    if(menuTab==='lexicon'&&lex&&!id('ad154-wish-goals')){
      const wishlist=id('ad122-wishlist');
      if(wishlist){
        const goals=document.createElement('section');goals.id='ad154-wish-goals';
        goals.innerHTML=wishlistGoals();
        goals.hidden=!goals.innerHTML;
        wishlist.insertAdjacentElement('afterend',goals);
        wishlist.addEventListener('click',()=>window.setTimeout(()=>{
          goals.innerHTML=wishlistGoals();goals.hidden=!goals.innerHTML;
        },0));
      }
    }
    if(menuTab==='settings'&&!id('ad154-save-safety')){
      const panel=document.createElement('section');panel.id='ad154-save-safety';panel.className='menu-panel';
      const date=numeric(profile.savedAt)>0?new Date(profile.savedAt).toLocaleString('de-AT'):'Noch kein Zeitpunkt verfügbar';
      panel.innerHTML='<h3>✧ Spielstand-Sicherung</h3><p>Letzter gespeicherter Profilstand: <b>'+esc(date)+'</b>. '+
        'Lade vor größeren Änderungen eine lokale JSON-Sicherung herunter. Die bestehende Importfunktion stellt den Spielstand bei Bedarf wieder her.</p>'+ 
        '<button type="button" class="btn" id="ad154-safe-export">Sicherungskopie herunterladen</button>'+ 
        '<small class="ad154-muted">Der Download enthält den offiziellen Spielstand. Zusätzliche lokale Komfortdaten (z. B. Fundtage) sind nicht enthalten.</small>';
      id('menuContent')?.prepend(panel);
      id('ad154-safe-export').onclick=()=>exportProfile();
    }
  }
  const earlierMenu=renderMenu;
  renderMenu=function(){const result=earlierMenu.apply(this,arguments);extendMenu();return result;};
  if(uiMode==='menu')extendMenu();
  window.ArcaneCollectionLab154=Object.freeze({version:'15.4.0',samplePatterns,fusionRoutes,cardCopies,familyProgress,readFirst,openPlanner});
})();
