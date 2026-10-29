/* Arcane Duel v12.1 – optional strategy lab, organized challenges and living bestiary.
 * Presentation and isolated practice simulations only. No balance, loot or save mutations.
 */
'use strict';
(()=>{
  const byId=id=>document.getElementById(id);
  const esc=value=>escapeHtml(String(value??''));
  const fmtNumber=n=>Math.round(Number(n)||0).toLocaleString('de-AT');
  let labTicket=0;
  const CATEGORY_DEFS=[
    {id:'deck',name:'Deckbau & Regeln',symbol:'▣',desc:'Siege mit bewusst eingeschränkten Decks.'},
    {id:'attack',name:'Angriff & Tempo',symbol:'⚔',desc:'Gewinne durch Initiative und zielgerichteten Druck.'},
    {id:'defense',name:'Verteidigung & Seelen',symbol:'◆',desc:'Nutze Schutz, Gegenschläge und Ausdauer.'},
    {id:'fusion',name:'Fusionstechniken',symbol:'✧',desc:'Setze begrenzte Ressourcen und Materialien geschickt ein.'},
    {id:'master',name:'Meisterprüfungen',symbol:'♛',desc:'Fortgeschrittene Prüfungen unter besonderen Bedingungen.'}
  ];
  function categoryOf(challenge){
    const id=String(challenge?.id||'');
    if(id.startsWith('evo-defense-'))return 'defense';
    if(id==='blitz'||id.startsWith('evo-burst-'))return 'attack';
    if(id==='singlefusion'||id.startsWith('evo-fusion-'))return 'fusion';
    if(['arsenal','unique','theme','regulars'].includes(id))return 'deck';
    return 'master';
  }

  function organizeChallenges(){
    if(uiMode!=='menu'||menuTab!=='challenges')return;
    const host=byId('menuContent'),grid=host?.querySelector('.menu-grid');
    if(!grid||grid.classList.contains('ad121-challenge-original'))return;
    const cards=[...grid.children].filter(node=>node.matches?.('section.menu-panel'));
    // Move existing bound cards, keeping native eligibility and reward handlers.
    if(cards.length!==CHALLENGES.length)return;
    const groups=new Map(CATEGORY_DEFS.map(d=>[d.id,[]]));
    CHALLENGES.forEach((c,i)=>groups.get(categoryOf(c)).push({card:cards[i],challenge:c}));
    const shell=document.createElement('div');shell.className='ad121-challenges';
    const done=new Set(profile.challenges||[]);
    shell.innerHTML='<div class="ad121-challenge-toolbar"><div><strong>Deine Prüfungsübersicht</strong><small>'+done.size+' von '+CHALLENGES.length+' abgeschlossen · Bestehende Herausforderungen, keine neuen Kämpfe</small></div>'+ 
      '<div class="ad121-filter-buttons" aria-label="Herausforderungen filtern">'+
      '<button type="button" data-ad121-filter="open" aria-pressed="true">Offen</button>'+ 
      '<button type="button" data-ad121-filter="all" aria-pressed="false">Alle</button>'+ 
      '<button type="button" data-ad121-filter="done" aria-pressed="false">Abgeschlossen</button></div></div>';
    for(const def of CATEGORY_DEFS){
      const items=groups.get(def.id);if(!items.length)continue;
      const finished=items.filter(x=>done.has(x.challenge.id)).length;
      const section=document.createElement('details');section.className='ad121-challenge-group';
      if(def.id==='deck'||def.id==='attack')section.open=true;
      section.innerHTML='<summary><span class="ad121-challenge-symbol">'+def.symbol+'</span><span class="ad121-challenge-heading"><strong>'+esc(def.name)+'</strong><small>'+esc(def.desc)+'</small></span>'+ 
        '<span class="ad121-challenge-count">'+finished+' / '+items.length+'</span></summary><div class="ad121-challenge-cards"></div>';
      const container=section.querySelector('.ad121-challenge-cards');
      for(const {card,challenge} of items){
        card.dataset.ad121Completed=done.has(challenge.id)?'yes':'no';
        card.classList.add('ad121-challenge-card');
        container.appendChild(card);
      }
      shell.appendChild(section);
    }
    grid.replaceWith(shell);
    const applyFilter=mode=>{
      shell.querySelectorAll('[data-ad121-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ad121Filter===mode)));
      shell.querySelectorAll('.ad121-challenge-card').forEach(card=>{
        card.hidden=mode==='open'&&card.dataset.ad121Completed==='yes'||mode==='done'&&card.dataset.ad121Completed!=='yes';
      });
      shell.querySelectorAll('.ad121-challenge-group').forEach(section=>{
        const visible=[...section.querySelectorAll('.ad121-challenge-card')].some(card=>!card.hidden);
        section.hidden=!visible;
      });
    };
    shell.querySelectorAll('[data-ad121-filter]').forEach(button=>button.onclick=()=>applyFilter(button.dataset.ad121Filter));
    applyFilter('open');
  }

  const allVisibleCards=()=>CARDS.filter(c=>c&&c.rpg&&!c.retired&&!c.enemyOnly&&!c.fateOnly&&c.level>=1&&c.level<=10&&
    (!c.hard||seenCard(c))&&(!c.questOnly||seenCard(c))&&(!c.lv1Exclusive||seenCard(c)));
  const ownedCard=c=>Number(profile.inventory?.[c.id]||0)>0;
  const seenCard=c=>ownedCard(c)||(profile.unlocked||[]).includes(c.id)||(profile.fusionOwned||[]).includes(c.id);
  const roleName={predator:'Predator',guardian:'Wächter',soul:'Seelenzehrer',combatant:'Allrounder',allrounder:'Allrounder',support:'Support',weaver:'Runenweber'};
  const familyRoot=c=>c.variantOf??c.lineRoot??c.id;
  function families(cards){
    const groups=new Map();
    for(const c of cards){
      if(c.fusionOnly||c.ace||c.essenceMonster||c.questOnly||c.lv1Exclusive)continue;
      const key=familyRoot(c);
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(c);
    }
    return [...groups.values()].filter(group=>group.length>1)
      .map(group=>group.sort((a,b)=>a.level-b.level||a.id-b.id))
      .sort((a,b)=>Number(!a.some(seenCard))-Number(!b.some(seenCard))||a[0].level-b[0].level);
  }
  function collectionBars(cards,mode){
    const list=mode==='level'?Array.from({length:10},(_,i)=>[String(i+1),'Level '+(i+1)]):
      mode==='element'?[...new Set(cards.map(c=>c.element))].sort().map(s=>[s,s]):
      [...new Set(cards.filter(c=>!c.fusionOnly).map(c=>c.role||'combatant'))].sort().map(s=>[s,roleName[s]||s]);
    const pairs=list.map(([key,name])=>{
      const subset=cards.filter(c=>mode==='level'?c.level===Number(key):mode==='element'?c.element===key:!c.fusionOnly&&(c.role||'combatant')===key);
      return {name,total:subset.length,found:subset.filter(seenCard).length};
    }).filter(x=>x.total>0);
    return pairs.map(x=>'<div class="ad121-progress-row"><span>'+esc(x.name)+'</span><div class="ad121-progress-track" role="progressbar" aria-label="'+esc(x.name)+'" aria-valuemin="0" aria-valuemax="'+x.total+'" aria-valuenow="'+x.found+'"><i style="width:'+((100*x.found/x.total).toFixed(1))+'%"></i></div><small>'+x.found+' / '+x.total+'</small></div>').join('');
  }
  function collectionDashboard(){
    if(uiMode!=='menu'||menuTab!=='lexicon')return;
    const root=byId('menuContent')?.querySelector('.ad119-lexicon');
    const intro=root?.querySelector('.ad119-lexicon-intro');
    if(!intro||root.querySelector('.ad121-bestiary'))return;
    const all=allVisibleCards(),found=all.filter(seenCard),owned=all.filter(ownedCard);
    const groups=families(all),completeFamilies=groups.filter(group=>group.every(ownedCard)).length;
    const hidden=all.filter(c=>!seenCard(c)).slice(0,12);
    const newCards=(profile.unseen||[]).map(id=>CARDS[id]).filter(c=>c&&all.includes(c)&&seenCard(c)).slice(0,4);
    const dashboard=document.createElement('section');dashboard.className='ad121-bestiary';
    dashboard.innerHTML='<div class="ad121-bestiary-overview">'+
      '<div><small>Entdeckte Varianten</small><b>'+found.length+' <span>/ '+all.length+'</span></b></div>'+ 
      '<div><small>Im Besitz</small><b>'+owned.length+'</b></div>'+ 
      '<div><small>Vollständige Familien</small><b>'+completeFamilies+' <span>/ '+groups.length+'</span></b></div></div>'+ 
      '<details class="ad121-bestiary-details" open><summary>Sammlungsfortschritt nach Level, Element und Rolle</summary>'+ 
      '<div class="ad121-bestiary-tabs"><button type="button" data-ad121-group="level" aria-pressed="true">Level</button>'+ 
      '<button type="button" data-ad121-group="element" aria-pressed="false">Element</button>'+ 
      '<button type="button" data-ad121-group="role" aria-pressed="false">Rolle</button></div>'+ 
      '<div id="ad121-collection-bars" class="ad121-collection-bars"></div></details>'+ 
      '<details class="ad121-bestiary-details"><summary>Monsterfamilien und ihre eigenständigen Kartenstufen · '+groups.length+' Familien</summary>'+ 
      '<p class="ad121-bestiary-note">Jede Stufe bleibt eine eigene sammelbare Karte. Keine automatische Entwicklung oder Veränderung ihrer Kampfwerte.</p>'+ 
      '<div class="ad121-family-grid">'+groups.map(group=>{
        const first=group.find(seenCard),name=first?.name||'Unentdeckte Monsterfamilie';
        const count=group.filter(ownedCard).length;
        return '<article class="ad121-family"><strong>'+esc(name)+'</strong><small>'+count+' / '+group.length+' im Besitz</small>'+ 
          '<div class="ad121-family-levels">'+group.map(c=>'<span class="'+(ownedCard(c)?'owned':seenCard(c)?'discovered':'unknown')+'" title="'+(ownedCard(c)?'Im Besitz':seenCard(c)?'Bereits entdeckt':'Unbekannte Karte')+'">Lv '+c.level+' '+(ownedCard(c)?'✓':seenCard(c)?'◌':'?')+'</span>').join('')+'</div></article>';
      }).join('')+'</div></details>'+ 
      (newCards.length?'<div class="ad121-new-cards"><strong>✦ Noch nicht angesehene Neuzugänge</strong><div>'+newCards.map(c=>'<span>'+esc(c.name)+' · Lv '+c.level+'</span>').join('')+'</div></div>':'')+
      (hidden.length?'<details class="ad121-bestiary-details"><summary>Unbekannte Kreaturen · '+(all.length-found.length)+' Geheimnisse</summary>'+ 
        '<p class="ad121-bestiary-note">Ihre Namen, Bilder und Questgeheimnisse bleiben verborgen.</p><div class="ad121-hidden-grid">'+hidden.map(c=>'<div class="ad121-hidden-card" aria-label="Unbekannte Karte, Level '+c.level+'"><span>?</span><small>Level '+c.level+'</small></div>').join('')+'</div></details>':'');
    intro.insertAdjacentElement('afterend',dashboard);
    const draw=mode=>{
      dashboard.querySelector('#ad121-collection-bars').innerHTML=collectionBars(all,mode);
      dashboard.querySelectorAll('[data-ad121-group]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ad121Group===mode)));
    };
    dashboard.querySelectorAll('[data-ad121-group]').forEach(b=>b.onclick=()=>draw(b.dataset.ad121Group));
    draw('level');
  }

  function deckRoleDescription(deck){
    const roles=new Map();
    for(const id of deck){const role=CARDS[id]?.role||'combatant';roles.set(role,(roles.get(role)||0)+1);}
    const total=Math.max(1,deck.length);
    return [...roles.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3)
      .map(([role,n])=>esc(roleName[role]||role)+' '+Math.round(100*n/total)+' %').join(' · ');
  }
  function compareDecks(rows){
    const valid=rows.filter(r=>!r.error&&r.completed>0);
    if(valid.length<2)return 'Für einen Vergleich müssen mindestens zwei gültige Decks vollständig simuliert werden.';
    const ordered=[...valid].sort((a,b)=>b.wins/b.completed-a.wins/a.completed||b.damage/b.completed-a.damage/a.completed);
    const best=ordered[0],other=ordered[1];
    const gap=100*(best.wins/best.completed-other.wins/other.completed);
    return gap<8?'Die Siegquoten liegen nah beieinander. Mit weiteren Probeduellen lässt sich prüfen, ob der Unterschied stabil bleibt.':
      best.label+' erzielt im gewählten Szenario '+Math.round(gap)+' Prozentpunkte mehr Siege als '+other.label+'. Das gilt nur für diese KI-Strategie und den getesteten Gegner.';
  }
  function labHtml(){
    const foes=OPPONENTS.map((o,i)=>({id:i,name:i===0?'Training':o?.name||'Gegner '+i})).filter(o=>o.id===0||opponentUnlocked(o.id));
    return '<div class="ad121-lab"><div class="modal-kicker">STRATEGIELABOR · ERWEITERT</div><h2>Welches Deck funktioniert besser?</h2>'+ 
      '<p>Die KI spielt deine gespeicherten Decks mehrfach gegen denselben Gegner. So siehst du, welche Kartenkombinationen in diesen Probeduellen häufiger gewinnen. Dein Spielstand und deine Karten bleiben unverändert.</p>'+ 
      '<div class="ad121-lab-controls"><label>Gegner<select id="ad121-foe">'+foes.map(o=>'<option value="'+o.id+'">'+esc(o.name)+'</option>').join('')+'</select></label>'+ 
      '<label>Spielweise deiner KI<select id="ad121-policy"><option value="balanced">Ausgewogen</option><option value="offensive">Offensiv</option>'+ 
      '<option value="guardian">Defensiv</option><option value="economy">Vorausschauend (Karten &amp; Fusionen sparen)</option></select></label>'+ 
      '<label>Testumfang<select id="ad121-samples"><option value="5">Schnell · 5 je Deck</option><option value="30">Vertieft · 30 je Deck</option>'+ 
      '<option value="50">Umfangreich · 50 je Deck</option></select></label></div>'+ 
      '<p class="ad121-lab-note">Vorausschauend bedeutet: lieber Karten und Fusionsmöglichkeiten für einen passenden Moment aufheben. Gleiche Start-Seeds verbessern die Vergleichbarkeit, garantieren aber bei unterschiedlichen Decks nicht dieselbe Starthand. Siege aus fünf Spielen sind noch keine verlässliche Rangliste.</p>'+ 
      '<div id="ad121-lab-status" role="status" aria-live="polite"></div><div id="ad121-lab-results"></div>'+ 
      '<div class="modal-actions"><button type="button" class="btn primary" id="ad121-lab-run">Strategietest starten</button>'+ 
      '<button type="button" class="btn" id="ad121-lab-cancel">Schließen / abbrechen</button></div></div>';
  }
  function openAdvancedLab(){
    if(game||uiMode!=='menu')return;
    openModal(labHtml());
    byId('ad121-lab-run').onclick=runAdvancedLab;
    byId('ad121-lab-cancel').onclick=()=>{labTicket++;hideModal();};
  }
  async function runAdvancedLab(){
    const ticket=++labTicket,foe=Number(byId('ad121-foe')?.value),policy=byId('ad121-policy')?.value||'balanced';
    const count=Number(byId('ad121-samples')?.value),run=byId('ad121-lab-run'),status=byId('ad121-lab-status'),results=byId('ad121-lab-results');
    if(![5,30,50].includes(count)||!OPPONENTS[foe]||(foe!==0&&!opponentUnlocked(foe)))return;
    run.disabled=true;results.innerHTML='';
    const rows=[];
    for(let slot=0;slot<3;slot++){
      if(ticket!==labTicket||!status.isConnected)return;
      const saved=profile.slots?.[slot],deck=slot===profile.activeSlot?profile.activeDeck:saved?.main;
      const fusion=slot===profile.activeSlot?profile.fusionDeck:saved?.fusion,label=saved?.name||'Deck '+(slot+1);
      if(!Array.isArray(deck)||!Array.isArray(fusion)||mainDeckError(deck)||fusionDeckError(fusion)||
         inventoryError(deck,profile.inventory)||inventoryError(fusion,profile.inventory)){
        rows.push({label,error:'Deck unvollständig oder Karten nicht im Besitz'});continue;
      }
      const stats={label,wins:0,completed:0,turns:0,damage:0,taken:0,fusions:0,fusionMatches:0,remainingLP:0,errors:0,uses:new Map(),roles:deckRoleDescription(deck)};
      for(let sample=0;sample<count;sample++){
        if(ticket!==labTicket||!status.isConnected)return;
        const seed=210012+foe*97+sample*1013;
        try{
          const g=createGame({id:'strategy-v121-'+slot+'-'+sample,seed,mode:'pve',opponentId:foe,context:'free',
            deck:[...deck],fusionDeck:[...fusion],enhancements:{...profile.enhancements},flatBonus:monsterTrainingBonus(profile.upgrades.power)});
          simulateGame(g,policy,OPPONENTS[foe]?.policy||'balanced');
          stats.completed++;stats.wins+=g.winner===0?1:0;stats.turns+=g.turn;stats.damage+=g.damageDealt[0];
          stats.taken+=g.damageDealt[1];stats.fusions+=g.totalFusions[0];stats.fusionMatches+=g.totalFusions[0]>0?1:0;
          stats.remainingLP+=g.players[0].lp;
          // Participation, not an unsupported claim about causal card strength.
          const used=new Set();
          for(const c of [...g.players[0].graveyard,...g.players[0].field.filter(Boolean)]){
            if(!c||!Number.isInteger(c.id)||used.has(c.uid))continue;
            used.add(c.uid);stats.uses.set(c.id,(stats.uses.get(c.id)||0)+1);
          }
        }catch(_){stats.errors++;}
        status.textContent='Deck '+(slot+1)+' von 3 · Probeduell '+(sample+1)+' / '+count+' …';
        await new Promise(resolve=>window.setTimeout(resolve,0));
      }
      rows.push(stats);
    }
    if(ticket!==labTicket||!results.isConnected)return;
    const per=(v,n)=>n?(100*v/n).toFixed(0):'0';
    results.innerHTML='<div class="ad121-lab-cards">'+rows.map(r=>'<article><h3>'+esc(r.label)+'</h3>'+ 
      (r.error?'<p>'+esc(r.error)+'</p>':
      '<strong class="ad121-winrate">'+per(r.wins,r.completed)+' % Siege <small>('+r.wins+'/'+r.completed+')</small></strong>'+ 
      '<div class="ad121-lab-metrics"><span>Ø '+(r.turns/Math.max(1,r.completed)/2).toFixed(1)+' Runden</span>'+ 
      '<span>Ø '+fmtNumber(r.damage/Math.max(1,r.completed))+' LP-Schaden</span>'+ 
      '<span>Ø '+fmtNumber(r.taken/Math.max(1,r.completed))+' erlittener LP-Schaden</span>'+ 
      '<span>Ø '+(r.fusions/Math.max(1,r.completed)).toFixed(1)+' Fusionen</span>'+ 
      '<span>'+per(r.fusionMatches,r.completed)+' % Duelle mit Fusion</span>'+ 
      '<span>Ø '+fmtNumber(r.remainingLP/Math.max(1,r.completed))+' Rest-LP</span></div>'+ 
      '<p class="ad121-lab-roles">'+r.roles+'</p>'+ 
      '<details><summary>Häufig eingesetzte Karten</summary><ol>'+ [...r.uses.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,n])=>'<li>'+esc(CARDS[id]?.name||'Monster')+' · '+n+' Einsätze</li>').join('')+'</ol><small>Nur Einsatzhäufigkeit, kein Nachweis eines Siegesbeitrags.</small></details>'+ 
      (r.errors?'<p class="ad121-lab-warning">'+r.errors+' Simulationen ohne gültiges Endergebnis – nur abgeschlossene Duelle wurden ausgewertet.</p>':''))+'</article>').join('')+'</div>'+ 
      '<p class="ad121-lab-conclusion">'+esc(compareDecks(rows))+'</p>'+ 
      '<p class="ad121-lab-note">Alle Werte stammen aus KI-Simulationen mit regulären Regeln. Die Stichprobe ist kein exakter Wahrscheinlichkeitsnachweis und ersetzt keine manuelle Spielerfahrung.</p>';
    status.textContent='Strategietest abgeschlossen: '+rows.reduce((n,r)=>n+(r.completed||0),0)+' ausgewertete Duelle.';
    if(run.isConnected)run.disabled=false;
  }

  function extendMenu(){
    if(uiMode!=='menu')return;
    const lab=byId('ad120-open-lab');if(lab){lab.onclick=openAdvancedLab;lab.textContent='⚗ Erweitertes Strategielabor';}
    organizeChallenges();collectionDashboard();
  }
  const previousRender=renderMenu;
  renderMenu=function(...args){const result=previousRender.apply(this,args);extendMenu();return result;};
  if(uiMode==='menu')extendMenu();
  window.ArcaneStrategySuite121=Object.freeze({version:'12.1.0',categoryOf,compareDecks,families,openAdvancedLab});
})();
