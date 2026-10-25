/* Arcane Duel v12.2 – strategic coaching without changes to rules, rewards or card power.
 * Local player-facing metadata is intentionally independent of the strict profile schema.
 */
'use strict';
(()=>{
  const $id=id=>document.getElementById(id);
  const esc=value=>escapeHtml(String(value??''));
  const fmt=value=>Math.round(Number(value)||0).toLocaleString('de-AT');
  const DATA_KEY='arcane-duel-v122-strategy';
  const ROLE_LABELS={predator:'Predator',guardian:'Wächter',soul:'Seelenzehrer',resonator:'Resonator',combatant:'Allrounder',allrounder:'Allrounder',support:'Support',weaver:'Runenweber'};
  const POLICIES=[['balanced','Ausgewogen'],['offensive','Offensiv'],['guardian','Defensiv'],['economy','Ressourcenorientiert']];
  let ticket=0,lastHighlights='',activeTip='',lastTipGame='';
  let memory=null;
  const eventsByGame=new WeakMap(),handByGame=new WeakMap();

  function safeState(source){
    const state=source&&typeof source==='object'&&!Array.isArray(source)?source:{};
    return {
      wish:Array.isArray(state.wish)?[...new Set(state.wish.filter(id=>Number.isInteger(id)&&id>=0))].slice(0,8):[],
      fusions:Array.isArray(state.fusions)?state.fusions.filter(f=>f&&Number.isInteger(f.result)&&Array.isArray(f.materials)).slice(0,80):[],
      tips:Array.isArray(state.tips)?[...new Set(state.tips.filter(x=>typeof x==='string'))].slice(0,12):[],
      dangers:state.dangers===true
    };
  }
  function readState(){
    try{const raw=window.localStorage?.getItem(DATA_KEY);return raw?safeState(JSON.parse(raw)):safeState(memory);}catch(_){return safeState(memory);}
  }
  function writeState(value){
    memory=safeState(value);
    try{window.localStorage?.setItem(DATA_KEY,JSON.stringify(memory));}catch(_){}
    return memory;
  }
  const owned=id=>Number(profile.inventory?.[id]||0)>0;
  const known=id=>owned(id)||(profile.unlocked||[]).includes(id)||(profile.fusionOwned||[]).includes(id);
  const roleOf=id=>CARDS[id]?.role||(typeof rpgRole==='function'?rpgRole(id)?.role:null)||'combatant';
  const roleLabel=role=>ROLE_LABELS[role]||role;
  const activeDeckFor=slot=>slot===profile.activeSlot?profile.activeDeck:profile.slots?.[slot]?.main;
  const fusionDeckFor=slot=>slot===profile.activeSlot?profile.fusionDeck:profile.slots?.[slot]?.fusion;
  const deckLegal=(main,fusion)=>Array.isArray(main)&&Array.isArray(fusion)&&!mainDeckError(main)&&!fusionDeckError(fusion)&&
    !inventoryError(main,profile.inventory)&&!inventoryError(fusion,profile.inventory);
  const slots=()=>[0,1,2].map(id=>({id,name:profile.slots?.[id]?.name||'Deck '+(id+1)}));
  const foes=()=>OPPONENTS.map((o,id)=>({id,name:id===0?'Training':o?.name||'Gegner '+id})).filter(o=>o.id===0||opponentUnlocked(o.id));
  const options=(values,selected)=>values.map(([id,label])=>'<option value="'+esc(id)+'"'+(String(id)===String(selected)?' selected':'')+'>'+esc(label)+'</option>').join('');
  const modalEnd='<button type="button" class="btn" id="ad122-close">Schließen / abbrechen</button>';
  function bindClose(){const b=$id('ad122-close');if(b)b.onclick=()=>{ticket++;hideModal();};}
  const yieldUI=()=>new Promise(resolve=>window.setTimeout(resolve,0));

  // A proposal is a testable hypothesis, not an unearned card-strength ranking.
  function proposeSwap(deck,inventory=profile.inventory){
    if(!Array.isArray(deck)||deck.length!==40)return null;
    const counts=new Map(),roles=new Map();
    for(const id of deck){counts.set(id,(counts.get(id)||0)+1);const role=roleOf(id);roles.set(role,(roles.get(role)||0)+1);}
    let best=null;
    const available=(typeof RPG_BASE_CARDS!=='undefined'?RPG_BASE_CARDS:CARDS).filter(c=>c&&!c.fusionOnly&&
      known(c.id)&&Number(inventory[c.id]||0)>(counts.get(c.id)||0));
    // Favour a less represented role and avoid a hand clogged by higher-level copies.
    for(const before of [...new Set(deck)]){
      const from=CARDS[before],fromRole=roleOf(before);
      if(!from)continue;
      for(const to of available){
        if(to.id===before)continue;
        const toRole=roleOf(to.id);
        const diff=(roles.get(fromRole)||0)-(roles.get(toRole)||0);
        const levelRelief=Math.max(0,from.level-4)-Math.max(0,to.level-4);
        const score=diff*2.2+levelRelief*3+(counts.get(before)===3?2:0)-Math.max(0,to.level-from.level)*2;
        if(score<=0||(best&&score<=best.score))continue;
        const trial=[...deck];trial[trial.indexOf(before)]=to.id;
        if(mainDeckError(trial)||inventoryError(trial,inventory))continue;
        best={before,after:to.id,trial,score,fromRole,toRole,fromLevel:from.level,toLevel:to.level};
      }
    }
    return best;
  }
  function simulateOnce(deck,fusion,foe,policy,seed,starter){
    const g=createGame({id:'ad122-strategy-'+seed+'-'+starter,seed,starter,mode:'pve',opponentId:foe,context:'free',
      deck:[...deck],fusionDeck:[...fusion],enhancements:{...profile.enhancements},flatBonus:monsterTrainingBonus(profile.upgrades.power)});
    simulateGame(g,policy,OPPONENTS[foe]?.policy||'balanced');
    return {win:g.winner===0,fusions:Number(g.totalFusions[0]||0),damage:Number(g.damageDealt[0]||0),starter:g.starter};
  }
  const pct=(v,n)=>n?Math.round(100*v/n):0;
  function comparisonText(base,proposal){
    if(!base?.n||!proposal?.n)return 'Zu wenige vollständig simulierte Duelle für einen Vergleich.';
    const gap=pct(proposal.wins,proposal.n)-pct(base.wins,base.n);
    return 'Original: '+pct(base.wins,base.n)+' % Siege ('+base.wins+'/'+base.n+') · Vorschlag: '+
      pct(proposal.wins,proposal.n)+' % ('+proposal.wins+'/'+proposal.n+') · Unterschied '+(gap>0?'+':'')+gap+
      ' Prozentpunkte. '+(Math.abs(gap)<10?'Der Unterschied ist klein und kann durch Zufall entstehen.':
        'Das ist nur ein Hinweis für dieses Testszenario, kein Beweis für einen allgemeinen Vorteil.');
  }
  function openOptimizer(){
    if(game||uiMode!=='menu')return;
    openModal('<section class="ad122-panel"><div class="modal-kicker">DECKLABOR · KARTENWECHSEL</div><h2>Deck-Optimierer</h2>'+ 
      '<p>Ein überprüfbarer Vorschlag auf Grundlage von Rollenverteilung, Duplikaten und Stufenmix. Das System kann die Spielstärke nicht allein aus Kartenwerten beweisen.</p>'+ 
      '<div class="ad122-controls"><label>Deckplatz<select id="ad122-opt-slot">'+options(slots().map(x=>[x.id,x.name]),profile.activeSlot)+'</select></label>'+ 
      '<label>Gegner<select id="ad122-opt-foe">'+options(foes().map(x=>[x.id,x.name]),0)+'</select></label>'+ 
      '<label>KI-Stil<select id="ad122-opt-policy">'+options(POLICIES,'balanced')+'</select></label>'+ 
      '<label>Umfang<select id="ad122-opt-n">'+options([[10,'10 je Deck'],[30,'30 je Deck']],30)+'</select></label></div>'+ 
      '<div id="ad122-opt-suggestion" class="ad122-suggestion" aria-live="polite"></div>'+ 
      '<div id="ad122-opt-result" aria-live="polite"></div><div class="modal-actions">'+
      '<button class="btn primary" id="ad122-opt-run">Original und Vorschlag testen</button>'+modalEnd+'</div></section>');
    bindClose();
    const refresh=()=>{
      const slot=Number($id('ad122-opt-slot')?.value),deck=activeDeckFor(slot),fusion=fusionDeckFor(slot);
      const suggestion=deckLegal(deck,fusion)?proposeSwap(deck):null;
      const host=$id('ad122-opt-suggestion');if(!host)return;
      host.innerHTML=suggestion?'<b>Hypothese für '+esc(slots()[slot].name)+'</b><p><strong>'+esc(CARDS[suggestion.before].name)+
        ' · Lv '+suggestion.fromLevel+'</strong> ersetzen durch <strong>'+esc(CARDS[suggestion.after].name)+
        ' · Lv '+suggestion.toLevel+'</strong>.</p><small>'+esc(roleLabel(suggestion.fromRole))+' → '+esc(roleLabel(suggestion.toRole))+
        ' · Mehr Ausgewogenheit oder leichter einsetzbares Material. Der Test muss zeigen, ob das hilft.</small>':
        '<p>Für dieses Deck ist kein besitzlegaler, regelkonformer Austausch nach den gewählten Kriterien verfügbar.</p>';
      $id('ad122-opt-run').disabled=!suggestion;
      $id('ad122-opt-result').innerHTML='';return suggestion;
    };
    $id('ad122-opt-slot').onchange=refresh;
    refresh();
    $id('ad122-opt-run').onclick=async()=>{
      const local=++ticket,slot=Number($id('ad122-opt-slot').value),foe=Number($id('ad122-opt-foe').value),
        policy=$id('ad122-opt-policy').value,n=Number($id('ad122-opt-n').value),deck=activeDeckFor(slot),fusion=fusionDeckFor(slot);
      const plan=deckLegal(deck,fusion)?proposeSwap(deck):null;
      if(!plan||![10,30].includes(n)||!foes().some(o=>o.id===foe))return;
      const button=$id('ad122-opt-run'),host=$id('ad122-opt-result');button.disabled=true;
      const base={n:0,wins:0,fusions:0},proposal={n:0,wins:0,fusions:0};let errors=0;
      for(let i=0;i<n;i++){
        if(ticket!==local||!host.isConnected)return;
        const seed=122000+foe*811+i*1973;
        for(const [cards,stats] of [[deck,base],[plan.trial,proposal]]){
          try{const result=simulateOnce(cards,fusion,foe,policy,seed,0);
            stats.n++;stats.wins+=result.win?1:0;stats.fusions+=result.fusions;}catch(_){errors++;}
        }
        host.textContent='Gepaarter Test '+(i+1)+' / '+n+' …';await yieldUI();
      }
      if(ticket!==local||!host.isConnected)return;
      host.innerHTML='<div class="ad122-metrics"><span>Original<b>'+pct(base.wins,base.n)+' %</b></span>'+ 
        '<span>Vorschlag<b>'+pct(proposal.wins,proposal.n)+' %</b></span>'+ 
        '<span>Ø Fusionen Original<b>'+(base.fusions/Math.max(1,base.n)).toFixed(1)+'</b></span>'+ 
        '<span>Ø Fusionen Vorschlag<b>'+(proposal.fusions/Math.max(1,proposal.n)).toFixed(1)+'</b></span></div>'+ 
        '<p>'+esc(comparisonText(base,proposal))+'</p>'+ 
        (errors?'<p class="ad122-warning">'+errors+' Simulationen scheiterten und wurden nicht als Siege gezählt.</p>':'')+
        '<p class="ad122-muted">Beide Decks nutzen dieselben Seeds, nicht notwendigerweise dieselben Handkarten. Kein tatsächlicher Spielstand wurde während der Tests verändert.</p>'+ 
        '<button type="button" class="btn" id="ad122-opt-apply">Geprüften Austausch übernehmen</button>';
      button.disabled=false;
      $id('ad122-opt-apply').onclick=()=>confirmSwap(slot,deck,plan);
    };
  }
  function confirmSwap(slot,source,plan){
    if(game||uiMode!=='menu')return;
    openModal('<section class="ad122-panel"><div class="modal-kicker">BEWUSSTE DECKÄNDERUNG</div><h2>Eine Karte austauschen?</h2>'+ 
      '<p>In <b>'+esc(slots()[slot].name)+'</b> wird genau ein Exemplar von <b>'+esc(CARDS[plan.before].name)+
      '</b> durch <b>'+esc(CARDS[plan.after].name)+'</b> ersetzt.</p>'+ 
      '<p class="ad122-muted">Die KI-Prognose ist nicht garantiert. Deine Sammlung und dein Fusionsdeck bleiben unverändert.</p>'+ 
      '<div class="modal-actions"><button type="button" class="btn primary" id="ad122-confirm-apply">Änderung bestätigen</button>'+modalEnd+'</div></section>');
    bindClose();
    $id('ad122-confirm-apply').onclick=()=>{
      if(game||uiMode!=='menu'||JSON.stringify(activeDeckFor(slot))!==JSON.stringify(source)||
        mainDeckError(plan.trial)||inventoryError(plan.trial,profile.inventory)){
        toast('Deck wurde zwischenzeitlich geändert oder die Karte ist nicht mehr verfügbar.');return;
      }
      if(slot===profile.activeSlot){if(!setActiveDeck(plan.trial)){toast('Speichern nicht möglich. Deck blieb unverändert.');return;}}
      else{
        const prior=[...profile.slots[slot].main];profile.slots[slot].main=[...plan.trial];
        if(!saveProfile()){profile.slots[slot].main=prior;toast('Speichern nicht möglich. Deck blieb unverändert.');return;}
      }
      hideModal();renderMenu();toast('Ein Kartenwechsel wurde in '+slots()[slot].name+' gespeichert.');
    };
  }

  // Public board information only: no concealed opponent hand, random roll, or invented move.
  function dangerMarkers(g){
    if(!g||g.mode!=='pve')return [];
    const foe=g.players?.[1]?.field||[];
    const attackerValues=foe.filter(c=>c&&c.mode==='atk').map(c=>Math.max(0,Number(dataOf(c).atk)||0));
    return (g.players?.[0]?.field||[]).map(c=>{
      if(!c||!attackerValues.length)return false;
      const value=Number(c.mode==='def'?dataOf(c).def:dataOf(c).atk)||0;
      return attackerValues.some(attack=>attack>=value);
    });
  }
  function decorateDuel(){
    if(uiMode!=='duel'||!game||game.mode!=='pve')return;
    const anchor=$id('turnAdvice')?.parentElement;if(!anchor)return;
    let panel=$id('ad122-danger-tools');if(!panel){panel=document.createElement('div');panel.id='ad122-danger-tools';anchor.appendChild(panel);}
    const enabled=readState().dangers;
    panel.innerHTML='<button type="button" class="ad122-danger-toggle" aria-pressed="'+enabled+'">⚔ Taktische Hinweise '+(enabled?'AN':'AUS')+'</button>'+ 
      (enabled?'<small>Nur sichtbare Feldwerte. Kein sicherer Angriffsausgang und keine Vorhersage verdeckter Karten.</small>':'');
    panel.querySelector('button').onclick=()=>{const s=readState();s.dangers=!s.dangers;writeState(s);decorateDuel();};
    $id('ownRow')?.querySelectorAll('[data-mine]').forEach(x=>{x.classList.remove('ad122-threat');x.removeAttribute('data-ad122-hint');});
    $id('enemyRow')?.querySelectorAll('[data-enemy]').forEach(x=>{x.classList.remove('ad122-opportunity');x.removeAttribute('data-ad122-hint');});
    if(!enabled)return;
    const threats=dangerMarkers(game);
    threats.forEach((threat,i)=>{
      const el=$id('ownRow')?.querySelector('[data-mine="'+i+'"]');if(!el||!threat)return;
      el.classList.add('ad122-threat');el.dataset.ad122Hint='Nach sichtbaren ATK-Werten gefährdet';
      el.title='Mindestens ein gegnerisches ATK-Monster erreicht den aktuellen Kampfwert. Fähigkeiten und mögliche Aktionen können das Ergebnis ändern.';
    });
    if(game.active!==0||game.selection?.type!=='field')return;
    const chosen=game.players[0].field[game.selection.idx];if(!chosen||chosen.mode!=='atk'||chosen.attacked)return;
    game.players[1].field.forEach((target,i)=>{
      if(!target)return;
      const atk=Math.max(0,Number(dataOf(chosen).atk)||0),def=Number(target.mode==='def'?dataOf(target).def:dataOf(target).atk)||0;
      if(atk<def)return;
      const el=$id('enemyRow')?.querySelector('[data-enemy="'+i+'"]');if(!el)return;
      el.classList.add('ad122-opportunity');el.dataset.ad122Hint='Wertevergleich günstig';
      el.title='Der sichtbare ATK/DEF-Vergleich ist günstig. Rollen, Effekte und Kampflogik können davon abweichen.';
    });
  }

  // Stable, purely instructional micro-lessons; never pause or control a duel.
  const TIPS={
    guardian:{name:'Wächter verstehen',text:'Ein Wächter in DEF ist oft ein schlechter Angriffskandidat: Prüfe seine DEF und rechne mit einem Gegenschlag. Die Karte kann vor einem Angriff betrachtet werden.'},
    soul:{name:'Seelenzehrer begegnen',text:'Bei Seelenzehrern ist die DEF-Stellung besonders wichtig. Verfolge Seelenwerte und mögliche aktive Fähigkeiten, bevor du eine Angriffsserie beginnst.'},
    fusion:{name:'Fusionsmaterial bewusst wählen',text:'Die gleichen Karten sind nicht immer das beste Material. Vergleiche Fusionsmuster, Rollenvererbung und verbleibende Vorlagenkopien in der Fusionsvorschau.'}
  };
  function tipCandidate(g){
    if(!g||g.mode!=='pve'||g.active!==0||g.winner!==null)return null;
    const seen=new Set(readState().tips),foe=g.players[1].field.filter(Boolean);
    if(!seen.has('guardian')&&foe.some(c=>c.mode==='def'&&roleOf(c.id)==='guardian'))return 'guardian';
    if(!seen.has('soul')&&foe.some(c=>roleOf(c.id)==='soul'))return 'soul';
    if(!seen.has('fusion')&&g.players[0].hand.length>=3&&g.turn>=3)return 'fusion';
    return null;
  }
  function decorateTip(){
    if(uiMode!=='duel'||!game||game.mode!=='pve'){activeTip='';$id('ad122-lesson')?.remove();return;}
    if($id('ad120-coach')){$id('ad122-lesson')?.remove();return;}
    if(lastTipGame!==game.id){lastTipGame=game.id;activeTip='';}
    const tip=activeTip||tipCandidate(game),anchor=$id('turnAdvice')?.parentElement;
    if(!tip||!anchor){$id('ad122-lesson')?.remove();return;}
    activeTip=tip;
    let panel=$id('ad122-lesson');if(!panel){panel=document.createElement('div');panel.id='ad122-lesson';anchor.appendChild(panel);}
    panel.innerHTML='<div class="ad122-lesson-title">✧ KURZE TAKTIKLEKTION</div><b>'+esc(TIPS[tip].name)+'</b>'+ 
      '<p>'+esc(TIPS[tip].text)+'</p><button type="button" class="btn tiny" id="ad122-lesson-dismiss">Verstanden</button>';
    $id('ad122-lesson-dismiss').onclick=()=>{
      const s=readState();s.tips=[...new Set([...s.tips,tip])];writeState(s);
      activeTip='';panel.remove();
    };
  }

  // Record only the real player's committed fusions, never simulated AI experiments.
  const oldPrepare=prepareHandFusion;
  prepareHandFusion=function(g,uids,choice){
    const real=typeof game!=='undefined'&&g===game&&uiMode==='duel'&&g.mode==='pve'&&g.active===0;
    const mats=real?uids.map(uid=>g.players[0].hand.find(c=>c.uid===uid)?.id).filter(Number.isInteger):[];
    const ok=oldPrepare.apply(this,arguments);
    if(real&&ok&&g.pending?.card?.fusion)handByGame.set(g,{materials:mats,turn:g.turn});
    return ok;
  };
  const oldPlace=placePending;
  placePending=function(g,idx,choice){
    const real=typeof game!=='undefined'&&g===game&&uiMode==='duel'&&g.mode==='pve'&&g.active===0;
    const pending=real?g.pending:null,old=real?g.players[0].field[idx]:null;
    const hand=real?handByGame.get(g):null;
    const materials=pending?.kind==='fusion'?hand?.materials||[]:pending?.card?.id!=null?[pending.card.id]:[];
    if(old)materials.push(old.id);
    const result=oldPlace.apply(this,arguments);
    if(real&&result?.card?.fusion&&materials.length>=2){
      const t=dataOf(result.card),state=readState();
      state.fusions.unshift({result:result.card.id,materials,turn:g.turn,at:Date.now(),
        atk:Math.round(Number(t.atk)||0),def:Math.round(Number(t.def)||0),
        role:result.card.roleOverride||roleOf(result.card.id)});
      state.fusions=state.fusions.slice(0,80);writeState(state);
    }
    if(real&&result)handByGame.delete(g);
    return result;
  };
  function archiveRows(records){
    const groups=new Map();
    for(const f of records){
      const key=f.result+':'+[...f.materials].sort((a,b)=>a-b).join('-');
      if(!groups.has(key))groups.set(key,{...f,count:0,maxAtk:0,maxDef:0});
      const row=groups.get(key);row.count++;row.maxAtk=Math.max(row.maxAtk,Number(f.atk)||0);
      row.maxDef=Math.max(row.maxDef,Number(f.def)||0);
    }
    return [...groups.values()].sort((a,b)=>b.count-a.count||b.at-a.at);
  }
  function openArchive(){
    if(game||uiMode!=='menu')return;
    const history=archiveRows(readState().fusions);
    openModal('<section class="ad122-panel"><div class="modal-kicker">FUSIONSDATENBANK · DEINE ENTDECKUNGEN</div><h2>Dein Fusionsarchiv</h2>'+ 
      '<p>Dokumentiert echte, seit diesem Update erfolgreich ausgespielte Fusionen. Die Werte sind historische Momentaufnahmen und verändern keine Karten.</p>'+ 
      (history.length?'<div class="ad122-archive">'+history.map(f=>'<article><strong>'+esc(CARDS[f.result]?.name||'Fusionskarte')+'</strong>'+ 
        '<small>'+f.materials.map(id=>esc(CARDS[id]?.name||'Material')).join(' + ')+'</small>'+ 
        '<span>'+f.count+'× gespielt · Höchste beobachtete ATK '+fmt(f.maxAtk)+' · DEF '+fmt(f.maxDef)+'</span>'+ 
        '<small>Vererbte Rolle beim letzten Versuch: '+esc(roleLabel(f.role))+'</small></article>').join('')+'</div>':
        '<p class="ad122-empty">Noch keine persönliche Fusion archiviert. Spiele eine Hand- oder Feldfusion im Duell.</p>')+
      '<div class="modal-actions">'+modalEnd+'</div></section>');bindClose();
  }

  // Compact bestiary wishlist. Secret cards never reveal their names or artwork.
  function wishlistCatalog(){return CARDS.filter(c=>c&&c.rpg&&!c.retired&&!c.enemyOnly&&!c.fateOnly&&
    c.level>=1&&c.level<=10&&known(c.id)&&(!c.questOnly||known(c.id))&&(!c.lv1Exclusive||known(c.id)));}
  function drawWishPanel(panel){
    if(!panel?.isConnected)return;
    const state=readState(),candidates=wishlistCatalog().filter(c=>!state.wish.includes(c.id)),selected=state.wish.map(id=>CARDS[id]).filter(Boolean);
    panel.innerHTML='<div class="ad122-wish-head"><div><strong>✦ Sammlungs-Wunschliste</strong><small>Bis zu acht bereits entdeckte Karten vormerken. Keine unbekannten Monster werden enthüllt.</small></div>'+ 
      '<span>'+selected.length+' / 8</span></div>'+ 
      '<div class="ad122-wish-add"><select id="ad122-wish-choice" aria-label="Entdeckte Karte wählen">'+
      (candidates.length?candidates.map(c=>'<option value="'+c.id+'">'+esc(c.name)+' · Lv '+c.level+'</option>').join(''):
        '<option value="">Keine weiteren entdeckten Karten</option>')+'</select>'+ 
      '<button type="button" class="btn" id="ad122-wish-add"'+(selected.length>=8||!candidates.length?' disabled':'')+'>Vormerken</button></div>'+ 
      (selected.length?'<div class="ad122-wish-items">'+selected.map(c=>'<div><span>'+esc(c.name)+' · Lv '+c.level+
        (owned(c.id)?' <em>✓ Erhalten</em>':' <em>Noch nicht im Besitz</em>')+'</span><button type="button" data-ad122-wish-remove="'+c.id+'">Entfernen</button></div>').join('')+'</div>':
        '<p class="ad122-muted">Noch keine Wünsche eingetragen.</p>')+
      '<small class="ad122-muted">Ein Fundort wird nur angezeigt, wenn er in den bestehenden Kartendaten eindeutig bekannt ist. Deine Wunschliste erhöht keine Dropraten.</small>';
    $id('ad122-wish-add').onclick=()=>{
      const id=Number($id('ad122-wish-choice')?.value),s=readState();
      if(s.wish.length>=8||!wishlistCatalog().some(c=>c.id===id)||s.wish.includes(id))return;
      s.wish.push(id);writeState(s);drawWishPanel(panel);
    };
    panel.querySelectorAll('[data-ad122-wish-remove]').forEach(btn=>btn.onclick=()=>{
      const id=Number(btn.dataset.ad122WishRemove),s=readState();s.wish=s.wish.filter(x=>x!==id);writeState(s);drawWishPanel(panel);
    });
  }
  function addWishPanel(){
    if(uiMode!=='menu'||menuTab!=='lexicon')return;
    const lex=$id('menuContent')?.querySelector('.ad119-lexicon');
    if(!lex||lex.querySelector('#ad122-wishlist'))return;
    const el=document.createElement('section');el.id='ad122-wishlist';
    const dashboard=lex.querySelector('.ad121-bestiary');
    if(dashboard)dashboard.insertAdjacentElement('afterend',el);
    else lex.querySelector('.ad119-lexicon-intro')?.insertAdjacentElement('afterend',el);
    drawWishPanel(el);
  }

  // This is a local diagnosis. It does NOT claim to aggregate GitHub training histories.
  function startSplit(stats,starter,win,fusions){const s=stats[starter];s.n++;s.wins+=win?1:0;s.fusions+=fusions;}
  function openRadar(){
    if(game||uiMode!=='menu')return;
    openModal('<section class="ad122-panel"><div class="modal-kicker">LOKALER BALANCE-RADAR</div><h2>Strategie- und Startspielercheck</h2>'+ 
      '<p>Ein wiederholbarer Diagnosetest für dein gewähltes Deck. Wir vergleichen drei KI-Stile und beide Startpositionen bei gleichen Seeds. Keine Änderung am Balancing.</p>'+ 
      '<div class="ad122-controls"><label>Deck<select id="ad122-radar-slot">'+options(slots().map(x=>[x.id,x.name]),profile.activeSlot)+'</select></label>'+ 
      '<label>Gegner<select id="ad122-radar-foe">'+options(foes().map(x=>[x.id,x.name]),0)+'</select></label></div>'+ 
      '<div id="ad122-radar-result" aria-live="polite"><p class="ad122-muted">36 gepaarte Tests (72 simulierte Duelle). Die Startposition ist eine feste Testvariable.</p></div>'+ 
      '<div class="modal-actions"><button type="button" class="btn primary" id="ad122-radar-run">Radar starten</button>'+modalEnd+'</div></section>');
    bindClose();
    $id('ad122-radar-run').onclick=async()=>{
      const local=++ticket,slot=Number($id('ad122-radar-slot').value),foe=Number($id('ad122-radar-foe').value),
        deck=activeDeckFor(slot),fusion=fusionDeckFor(slot),host=$id('ad122-radar-result'),button=$id('ad122-radar-run');
      if(!deckLegal(deck,fusion)||!foes().some(f=>f.id===foe)){host.textContent='Deck oder Gegner derzeit nicht für einen Test verfügbar.';return;}
      button.disabled=true;let errors=0;
      const reports=[];
      for(const policy of ['balanced','offensive','guardian']){
        const stats=[{n:0,wins:0,fusions:0},{n:0,wins:0,fusions:0}];
        for(let i=0;i<12;i++){
          if(local!==ticket||!host.isConnected)return;
          const seed=122500+foe*577+i*547;
          for(let starter=0;starter<=1;starter++){
            try{const result=simulateOnce(deck,fusion,foe,policy,seed,starter);
              startSplit(stats,starter,result.win,result.fusions);}catch(_){errors++;}
          }
          host.textContent='Radar: '+roleLabel(policy)+' · Paar '+(i+1)+' / 12';
          await yieldUI();
        }
        reports.push({policy,stats});
      }
      if(local!==ticket||!host.isConnected)return;
      host.innerHTML='<div class="ad122-radar-grid">'+reports.map(r=>{
        const label=POLICIES.find(x=>x[0]===r.policy)?.[1]||r.policy;
        const a=r.stats[0],b=r.stats[1];
        return '<article><strong>'+esc(label)+'</strong>'+ 
          '<span>Du beginnst: <b>'+pct(a.wins,a.n)+' %</b> · '+a.wins+'/'+a.n+'</span>'+ 
          '<span>Gegner beginnt: <b>'+pct(b.wins,b.n)+' %</b> · '+b.wins+'/'+b.n+'</span>'+ 
          '<small>Ø Fusionen: '+((a.fusions+b.fusions)/Math.max(1,a.n+b.n)).toFixed(1)+'</small></article>';
      }).join('')+'</div>'+ 
      (errors?'<p class="ad122-warning">'+errors+' Simulationen hatten keinen gültigen Abschluss und fehlen in der Quote.</p>':'')+
      '<p class="ad122-muted">Wichtig: Je Stil nur 12 Spiele pro Startposition. Große Unterschiede sind Hinweise für weitere Tests, keine belastbaren Beweise für ein globales Startspieler- oder Rollenproblem. GitHub-Trainingsberichte sind hier nicht einbezogen.</p>';
      button.disabled=false;
    };
  }

  // Timestamp real player game events before the engine truncates its 80-line log.
  const beforeLog=logEvent;
  logEvent=function(g,entry){
    if(typeof game!=='undefined'&&g===game&&uiMode==='duel'&&g.mode==='pve'){
      const history=eventsByGame.get(g)||[];
      history.push({turn:g.turn,entry:String(entry)});
      if(history.length>240)history.shift();eventsByGame.set(g,history);
    }
    return beforeLog.apply(this,arguments);
  };
  function pivotalMoments(events){
    if(!Array.isArray(events))return [];
    const normalized=events.filter(e=>e&&typeof e.entry==='string'&&Number.isFinite(e.turn));
    const unique=[];
    const labels=[
      [/Fusionsmaterialien|Feldfusion|Fusionskopie|fusioniert|Fusion/i,'Fusion'],
      [/durchbricht|gegen .*Schaden|direkter Angriff|Gegenschlag/i,'Kampf'],
      [/hält stand|Schutzschild|Seelenentzug|Verdichtet/i,'Verteidigung'],
      [/gewinnt:|Lebenspunkte des|Deck erschöpft/i,'Entscheidung']
    ];
    for(const [re,label] of labels){
      const found=normalized.filter(e=>re.test(e.entry));
      if(!found.length)continue;
      const chosen=label==='Kampf'?found.reduce((a,b)=>{
        const damage=x=>Number(x.entry.match(/(\d{1,7})\s+(?:LP\s+)?Schaden/i)?.[1]||0);
        return damage(b)>damage(a)?b:a;
      }):label==='Entscheidung'?found[found.length-1]:found[0];
      if(!unique.some(x=>x.turn===chosen.turn&&x.entry===chosen.entry))unique.push({...chosen,label});
    }
    return unique.sort((a,b)=>a.turn-b.turn).slice(0,5);
  }
  function highlightsMarkup(items){
    return '<section class="ad122-moments"><h3>✧ Entscheidende Duellmomente</h3>'+ 
      (items.length?'<ol>'+items.map(x=>'<li><small>Runde '+Math.ceil(x.turn/2)+' · '+esc(x.label)+'</small><span>'+esc(x.entry)+'</span></li>').join('')+'</ol>':
        '<p>Für dieses Duell liegen keine ausreichend eindeutigen Ereignisse vor.</p>')+
      '<p class="ad122-muted">Aus tatsächlich protokollierten Aktionen ausgewählt. Das sind keine nachträglich berechneten alternativen Spielzüge.</p></section>';
  }
  function attachHighlights(html){
    const report=$id('modal')?.querySelector('.ad120-report');
    if(report&&!report.querySelector('.ad122-moments'))report.insertAdjacentHTML('beforeend',html);
  }
  const previousFinished=showFinished;
  showFinished=function(){
    const g=game,first=!!g&&g.mode==='pve'&&g.winner!==null&&!g.finishShown;
    const result=previousFinished.apply(this,arguments);
    if(first&&g?.finishShown){
      const stream=eventsByGame.get(g)||g.log.map(entry=>({entry,turn:g.turn})).reverse();
      lastHighlights=highlightsMarkup(pivotalMoments(stream));attachHighlights(lastHighlights);
    }
    return result;
  };

  function extendMenu(){
    if(uiMode==='menu'){
      const tools=$id('ad120-menu-tools');
      if(tools&&!tools.querySelector('#ad122-open-opt')){
        tools.insertAdjacentHTML('beforeend','<button type="button" class="btn" id="ad122-open-opt">⚗ Deck-Optimierer</button>'+ 
          '<button type="button" class="btn" id="ad122-open-archive">✧ Fusionsarchiv</button>'+ 
          '<button type="button" class="btn" id="ad122-open-radar">◇ Balance-Radar</button>');
        $id('ad122-open-opt').onclick=openOptimizer;
        $id('ad122-open-archive').onclick=openArchive;
        $id('ad122-open-radar').onclick=openRadar;
      }
      const report=$id('ad120-open-report');
      if(report&&lastHighlights)report.addEventListener('click',()=>attachHighlights(lastHighlights));
      addWishPanel();
    }
  }
  const earlierMenu=renderMenu;
  renderMenu=function(){
    const result=earlierMenu.apply(this,arguments);
    extendMenu();
    return result;
  };
  const earlierRender=render;
  render=function(){const result=earlierRender.apply(this,arguments);decorateDuel();decorateTip();return result;};
  if(uiMode==='menu')extendMenu();

  window.ArcaneStrategyEvolution122=Object.freeze({version:'12.2.0',safeState,proposeSwap,comparisonText,
    dangerMarkers,pivotalMoments,archiveRows,openOptimizer,openArchive,openRadar});
})();
