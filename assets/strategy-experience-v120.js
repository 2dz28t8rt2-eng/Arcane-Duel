/* Arcane Duel 12.0 · transparent strategy tools; no changes to duel rewards. */
'use strict';
(()=>{
  const esc=value=>escapeHtml(String(value??''));
  const $id=id=>document.getElementById(id);
  const format=n=>Math.round(Number(n)||0).toLocaleString('de-AT');
  let lastReport=null,tutorial=null,labRun=0;
  const TUTORIAL_KEY='arcane-duel-tutorial-v152';
  const completedLessons=()=>{
    try{return JSON.parse(window.localStorage?.getItem(TUTORIAL_KEY)||'[]').filter(n=>[1,2,3].includes(n));}
    catch(_){return [];}
  };
  const lessonNames=['','Grundlagen & Beschwörung','Pokerfusionen','Taktik & Reaktion'];
  function rememberLesson(stage){
    const done=completedLessons();
    if(done.includes(stage))return;
    done.push(stage);
    try{window.localStorage?.setItem(TUTORIAL_KEY,JSON.stringify(done));}catch(_){}
    unlockNotice('Lernduell '+stage+' abgeschlossen',lessonNames[stage]+' verstanden. Du kannst jederzeit weitertrainieren.');
  }
  const unlockQueue=[];
  let unlockBusy=false;

  function unlockNotice(title,description,art=''){
    if(!title||unlockQueue.length>=15)return;
    unlockQueue.push({title,description,art});
    drainUnlocks();
  }
  function drainUnlocks(){
    if(unlockBusy||!unlockQueue.length)return;
    unlockBusy=true;
    const item=unlockQueue.shift();
    const el=document.createElement('aside');
    el.className='ad120-unlock';
    el.setAttribute('role','status');
    el.innerHTML='<span class="ad120-unlock-symbol">✦</span>'+
      (item.art?'<img src="'+esc(item.art)+'" alt="" loading="lazy">':'')+
      '<div><small>NEU FREIGESCHALTET</small><strong>'+esc(item.title)+'</strong><p>'+esc(item.description)+'</p></div>'+
      '<button type="button" aria-label="Hinweis schließen">×</button>';
    document.body.appendChild(el);
    let finished=false;
    const close=()=>{if(finished)return;finished=true;el.classList.add('ad120-leave');
      window.setTimeout(()=>{el.remove();unlockBusy=false;drainUnlocks();},260);};
    // Headless battle/economy tests use a minimal DOM without parsed child
    // nodes. Notifications must never interrupt legitimate game operations.
    const dismiss=el.querySelector?.('button');
    if(!dismiss){el.remove?.();unlockBusy=false;drainUnlocks();return;}
    dismiss.onclick=close;
    window.setTimeout(close,4400);
  }
  function progressSnapshot(){
    return {cleared:new Set(profile.cleared||[]),level:playerLevel(profile),
      owned:new Set(Object.entries(profile.inventory||{}).filter(([,count])=>count>0).map(([id])=>Number(id)))};
  }
  function progressChanges(before){
    if(!before)return;
    for(const id of profile.cleared||[]){
      if(before.cleared.has(id))continue;
      unlockNotice('Turnier '+(id===10?'X':id)+' gemeistert',
        'Neue Prüfungen, Gegner und ACE-Angebote können verfügbar sein.',OPPONENTS[id]?.aceCard!=null?CARDS[OPPONENTS[id].aceCard]?.art:'');
    }
    const level=playerLevel(profile);
    if(level>before.level)unlockNotice('Spielerlevel '+level,'Prüfe deine neuen Fortschritts- und Meilensteinbelohnungen.');
    let newCards=0;
    for(const [key,count] of Object.entries(profile.inventory||{})){
      const id=Number(key);
      if(count>0&&!before.owned.has(id)&&CARDS[id]){
        if(newCards<3)unlockNotice(CARDS[id].name,
          (CARDS[id].fusionOnly?'Neue Fusionsvorlage':'Neue Monsterkarte')+' in deiner Sammlung.',CARDS[id].art);
        newCards++;
      }
    }
    if(newCards>3)unlockNotice('Weitere '+(newCards-3)+' Karten','Zusätzliche neue Karten sind in deiner Sammlung verfügbar.');
  }

  // Only first-time acquisitions are announced; copies do not spam the queue.
  const originalAddCard=addCard;
  addCard=function(id){
    const already=ownsCard(id),result=originalAddCard(id);
    if(!already&&CARDS[id]&&(!game||game.winner===null))
      unlockNotice(CARDS[id].name,'Neue '+(CARDS[id].fusionOnly?'Fusionsvorlage':'Monsterkarte')+' erhalten.',CARDS[id].art);
    return result;
  };

  function summarizeDuel(g){
    const mine=g.players[0],foe=g.players[1];
    const findings=[];
    if(g.totalFusions[0]===0&&g.mode==='pve')findings.push('Keine eigene Fusion eingesetzt. Prüfe vor dem nächsten Kampf deine Vorlagen und Materialkombinationen.');
    if(g.damageDealt[0]<g.damageDealt[1]&&g.winner!==0)
      findings.push('Der Gegner verursachte mehr LP-Schaden. Analysiere frühe Feldkontrolle und defensive Rollen.');
    if(!findings.length)findings.push('Prüfe die entscheidenden Aktionen im Duellprotokoll und vergleiche ihre Materialkosten.');
    // No use of paid HINTS/profile.lastReview: the established hint economy stays intact.
    return {id:g.id,won:g.winner===0,opponent:g.opponentId,turn:g.turn,
      damage:[...g.damageDealt],fusions:[...g.totalFusions],lp:[mine.lp,foe.lp],
      reason:g.winReason,findings,events:g.log.slice(0,10)};
  }
  function reportMarkup(report){
    return '<section class="ad120-report" aria-label="Duell-Nachbericht">'+
      '<h3>✧ Taktischer Duell-Nachbericht</h3>'+
      '<div class="ad120-metrics">'+
      '<div><small>Dein LP-Schaden</small><b>'+format(report.damage[0])+'</b></div>'+
      '<div><small>Gegnerischer LP-Schaden</small><b>'+format(report.damage[1])+'</b></div>'+
      '<div><small>Deine Fusionen</small><b>'+format(report.fusions[0])+'</b></div>'+
      '<div><small>Gegner-Fusionen</small><b>'+format(report.fusions[1])+'</b></div></div>'+
      '<p class="ad120-note">'+esc(report.findings[0])+'</p>'+
      '<details><summary>Letzte 10 protokollierte Aktionen anzeigen</summary><ol>'+report.events.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol></details>'+
      '<small>Die Werte stammen aus diesem tatsächlichen Duell. Die Tipps sind allgemeine Hinweise, keine nachträglich simulierten Alternativen.</small></section>';
  }
  const originalFinished=showFinished;
  showFinished=function(...args){
    const g=game,first=!!g&&g.winner!==null&&!g.finishShown;
    const before=first&&g.mode==='pve'?progressSnapshot():null;
    const result=originalFinished.apply(this,args);
    if(first&&g.finishShown){
      lastReport=summarizeDuel(g);
      const modal=$id('modal');
      if(modal&&modal.querySelector('#modalAgain')){
        const actions=modal.querySelector('.modal-actions');
        actions?.insertAdjacentHTML('beforebegin',reportMarkup(lastReport));
      }
      if(before)progressChanges(before);
      if(tutorial?.gameId===g.id)stopTutorial(false);
    }
    return result;
  };

  function fusionDetails(){
    const host=$id('summonStage');
    if(!host||!game||uiMode!=='duel'||game.pending||game.summoned||game.active!==0)return;
    const p=game.players[0],materials=(game.materials||[]).map(uid=>p.hand.find(c=>c.uid===uid)).filter(Boolean);
    if(materials.length<2)return;
    const levels=materials.map(c=>dataOf(c).level);
    const candidates=fusionOptions(game,levels,materials).filter(c=>canCompleteHandFusion(game,levels,c.id));
    const pattern=window.ArcaneFusionMath?.pattern?.(levels,materials.map(c=>dataOf(c).element));
    const cap=fusionBudget(levels,game,materials);
    const rule=window.ArcaneFusionRework113?.calculate?.(levels,game,materials);
    const rows=[...new Map(candidates.map(c=>[c.id,c])).values()]
      .sort((a,b)=>b.level-a.level||b.atk+b.def-a.atk-a.def).slice(0,3).map(c=>{
        try{
          const preview=fusionPreview(game,c,materials,levels);
          return '<li><b>'+esc(c.name)+' · Lv '+c.level+'</b><span>ATK '+format(preview.atk[0])+'–'+format(preview.atk[1])+
            ' · DEF '+format(preview.def[0])+'–'+format(preview.def[1])+'</span></li>';
        }catch(_){return '<li><b>'+esc(c.name)+' · Lv '+c.level+'</b></li>';}
      }).join('');
    const container=host.querySelector('.ad56-material')||host;
    const panel=document.createElement('div');panel.className='ad120-fusion-preview';
    panel.innerHTML='<div class="ad120-preview-title"><strong>✦ Fusionsvorschau</strong><span>Maximum Lv '+cap+'</span></div>'+
      '<p>'+esc(pattern?.name||'Freie Fusion')+' · '+materials.length+' Materialien'+
      (pattern?.rollBonus?' · +'+pattern.rollBonus+' Pokerwürfe':'')+
      (rule?.street?' · Geschlossene Straße':'')+'</p>'+
      (rows?'<ol>'+rows+'</ol>':'<p>Mit diesen Materialien ist derzeit keine passende Vorlage im Fusionsdeck verfügbar.</p>')+
      '<small>Prognosen, keine garantierten Würfelergebnisse. Alle Materialien werden verbraucht; die gewählte Kernkarte kann das Ergebnis verändern.</small>';
    container.appendChild(panel);
  }

  // Real in-game actions advance the optional teaching overlay; no fabricated battles.
  const lessons=[
    ['1 · Handkarte wählen','Klicke eine beliebige Karte in deiner Hand, um sie auszuwählen.'],
    ['2 · Beschwören','Klicke „Beschwören“ und wähle danach eine freie Monsterzone.'],
    ['3 · Nächster Zug','Beende deinen Zug und warte auf die nächste eigene Aktion.'],
    ['4 · Kampf oder Position','Greife mit einer geeigneten Karte an oder wechsle ihre Kampfposition.'],
    ['Geschafft!','Du hast die grundlegenden Aktionen ausgeführt. Im nächsten Duell kannst du mit 2–5 Handkarten die Pokerfusionen üben.']
  ];
  const fusionLessons=[
    ['1 · Materialien sammeln','Wähle mindestens zwei passende Handkarten als Fusionsmaterialien. Ein geeigneter Platz im Fusionsdeck ist nötig.'],
    ['2 · Fusion durchführen','Bestätige die Fusion, wähle eine verfügbare Fusionsvorlage und setze das neue Monster aufs Feld. Die Vorschau erklärt das Ergebnis.'],
    ['Geschafft!','Du hast eine echte Fusion erfolgreich beschworen. Ihre Kartenstufe ist nicht automatisch ein dauerhaftes Monsterlevel.']
  ];
  const tacticLessons=[
    ['1 · Schutz aufbauen','Wechsle ein Feldmonster in DEF oder nutze bereits eine defensive Stellung. Beachte Wächter, Seelenzehrer und mögliche Gegenschläge.'],
    ['2 · Gegnerische Antwort zulassen','Beende deinen Zug. Beobachte, wie die gegnerische KI auf deine Stellung reagiert.'],
    ['3 · Gegenangriff planen','Führe in einem eigenen Zug einen erlaubten Angriff aus. Prüfe vorher optional die Kampfprognose.'],
    ['Geschafft!','Du hast Schutz, gegnerische Reaktion und einen eigenen Angriff erlebt.']
  ];
  const stageLessons=stage=>stage===2?fusionLessons:stage===3?tacticLessons:lessons;
  function stopTutorial(announce=false){tutorial=null;$id('ad120-coach')?.remove();if(announce)unlockNotice('Lernrunde beendet','Du kannst die interaktive Hilfe jederzeit erneut starten.');}
  function updateTutorial(){
    if(!tutorial)return;
    if(!game||uiMode!=='duel'){stopTutorial();return;}
    if(!tutorial.gameId){tutorial.gameId=game.id;tutorial.startTurn=game.turn;}
    if(tutorial.gameId!==game.id){stopTutorial();return;}
    const g=game;
    if(tutorial.stage===2){
      if(tutorial.step===0&&g.materials.length>=2)tutorial.step=1;
      if(tutorial.step===1&&g.totalFusions[0]>tutorial.startFusions&&g.players[0].field.some(c=>c?.fusion))tutorial.step=2;
    }else if(tutorial.stage===3){
      if(tutorial.step===0&&g.players[0].field.some(c=>c&&(c.switched||c.mode==='def')))tutorial.step=1;
      if(tutorial.step===1&&g.turn>tutorial.startTurn)tutorial.step=2;
      if(tutorial.step===2&&g.active===0&&g.players[0].field.some(c=>c?.attacked))tutorial.step=3;
    }else{
      if(tutorial.step===0&&(g.selection?.type==='hand'||g.materials.length))tutorial.step=1;
      if(tutorial.step===1&&g.summoned)tutorial.step=2;
      if(tutorial.step===2&&g.turn>tutorial.startTurn)tutorial.step=3;
      // Only the human's own executed field actions satisfy the last lesson.
      if(tutorial.step===3&&g.players[0].field.some(c=>c&&(c.attacked||c.switched)))tutorial.step=4;
    }
    const sequence=stageLessons(tutorial.stage),finished=tutorial.step===sequence.length-1;
    if(finished&&!tutorial.celebrated){tutorial.celebrated=true;rememberLesson(tutorial.stage);}
    let panel=$id('ad120-coach');
    if(!panel){panel=document.createElement('aside');panel.id='ad120-coach';panel.className='ad120-coach';document.body.appendChild(panel);}
    const step=sequence[tutorial.step];
    panel.innerHTML='<small>LERNDUELL '+tutorial.stage+' / 3 · '+esc(lessonNames[tutorial.stage])+'</small><b>'+esc(step[0])+'</b><p>'+esc(step[1])+'</p>'+
      '<div class="ad120-coach-actions"><span>'+Math.min(tutorial.step+1,sequence.length)+' / '+sequence.length+'</span><button type="button" id="ad120-coach-close">'+(finished?'Fertig':'Hilfe beenden')+'</button></div>';
    $id('ad120-coach-close').onclick=()=>stopTutorial(false);
  }

  function startTutorial(stage){
    const before=game?.id;
    hideModal();
    if(uiMode!=='menu')return;
    startDuel('pve',0,'free');
    if(!game||uiMode!=='duel'||game.id===before)return;
    tutorial={stage,step:0,gameId:game.id,startTurn:game.turn,startFusions:game.totalFusions[0],celebrated:false};
    updateTutorial();
  }
  function guidedIntro(){
    const done=completedLessons();
    openModal('<div class="modal-kicker">DREI LERNDUELLE</div><h2>Dein interaktiver Spieleinstieg</h2>'+
      '<p>Erlerne die Spielmechaniken in drei separat startbaren Duellen. Jeder Schritt wird erst durch eine echte Aktion bestätigt.</p>'+
      '<div class="ad120-lesson-list">'+[1,2,3].map(n=>'<button type="button" class="btn ad120-lesson" data-ad120-stage="'+n+'">'+
        (done.includes(n)?'✓ ':'✦ ')+n+' · '+esc(lessonNames[n])+(done.includes(n)?' · abgeschlossen':'')+'</button>').join('')+'</div>'+
      '<p class="ad120-lab-caption">Die Duelle verwenden deine regulären Karten und Regeln; es gibt keine zusätzlichen Werte, Käufe oder erfundenen Belohnungen. Die Kapitel können wiederholt werden.</p>'+
      '<div class="modal-actions"><button class="btn" id="ad120-guide-exit">Schließen</button></div>');
    $id('ad120-guide-exit').onclick=hideModal;
    document.querySelectorAll('[data-ad120-stage]').forEach(b=>b.onclick=()=>startTutorial(Number(b.dataset.ad120Stage)));
  }

  function labOpponentOptions(){
    return OPPONENTS.map((o,id)=>({id,name:id===0?'Training':o?.name||'Gegner '+id}))
      .filter(o=>o.id===0||opponentUnlocked(o.id));
  }
  function labMarkup(){
    const available=labOpponentOptions();
    return '<div class="ad120-lab"><div class="modal-kicker">TAKTIKLABOR</div><h2>Deine drei Decks im Vergleich</h2>'+
      '<p>Identische Ausgangs-Seeds, echter Regelkern und KI-Steuerung. Keine Belohnungen, keine Verbrauchsgüter und keine Veränderung deiner Spielstände.</p>'+
      '<div class="ad120-lab-controls"><label>Gegner<select id="ad120-lab-foe">'+available.map(o=>'<option value="'+o.id+'">'+esc(o.name)+'</option>').join('')+'</select></label>'+
      '<label>Eigene KI-Strategie<select id="ad120-lab-policy"><option value="balanced">Ausgewogen</option><option value="offensive">Offensiv</option><option value="guardian">Defensiv</option><option value="economy">Ressourcenorientiert</option></select></label></div>'+
      '<p class="ad120-lab-caption">Je Deck 5 gepaarte Probeduelle. Das ist ein schneller Vergleich, keine belastbare Langzeit-Balanceanalyse.</p>'+
      '<div id="ad120-lab-results" aria-live="polite"></div><div class="modal-actions">'+
      '<button class="btn primary" id="ad120-lab-run">5 Duelle je Deck testen</button><button class="btn" id="ad120-lab-close">Schließen</button></div></div>';
  }
  function openLab(){
    if(game||uiMode!=='menu')return;
    openModal(labMarkup());
    $id('ad120-lab-close').onclick=()=>{labRun++;hideModal();};
    $id('ad120-lab-run').onclick=runLab;
  }
  async function runLab(){
    const ticket=++labRun;
    const foe=Number($id('ad120-lab-foe')?.value);
    const policy=$id('ad120-lab-policy')?.value||'balanced';
    if(!labOpponentOptions().some(x=>x.id===foe))return;
    const runButton=$id('ad120-lab-run');runButton.disabled=true;
    const results=$id('ad120-lab-results');
    const rows=[];
    for(let slot=0;slot<3;slot++){
      if(ticket!==labRun)return;
      const saved=profile.slots?.[slot];
      const deck=slot===profile.activeSlot?profile.activeDeck:saved?.main;
      const fusion=slot===profile.activeSlot?profile.fusionDeck:saved?.fusion;
      const label=saved?.name||'Deck '+(slot+1);
      if(!Array.isArray(deck)||!Array.isArray(fusion)||mainDeckError(deck)||fusionDeckError(fusion)||inventoryError(deck,profile.inventory)||inventoryError(fusion,profile.inventory)){
        rows.push({label,error:'Deck nicht vollständig oder nicht besitzlegal'});continue;
      }
      const stats={label,wins:0,completed:0,turns:0,damage:0,fusions:0,errors:0};
      for(let sample=0;sample<5;sample++){
        if(ticket!==labRun)return;
        const seed=210012+foe*97+sample*1013;
        try{
          const g=createGame({id:'lab-'+slot+'-'+sample,seed,mode:'pve',opponentId:foe,context:'free',
            deck:[...deck],fusionDeck:[...fusion],enhancements:{...profile.enhancements},flatBonus:monsterTrainingBonus(profile.upgrades.power)});
          simulateGame(g,policy,OPPONENTS[foe]?.policy||'balanced');
          stats.completed++;stats.wins+=g.winner===0?1:0;stats.turns+=g.turn;
          stats.damage+=g.damageDealt[0];stats.fusions+=g.totalFusions[0];
        }catch(_){stats.errors++;}
        results.textContent='Simulation läuft: Deck '+(slot+1)+' · Duell '+(sample+1)+' / 5 …';
        await new Promise(resolve=>window.setTimeout(resolve,0));
      }
      rows.push(stats);
    }
    if(ticket!==labRun||!results.isConnected)return;
    results.innerHTML='<div class="ad120-lab-results">'+rows.map(r=>
      '<article><h3>'+esc(r.label)+'</h3>'+
      (r.error?'<p>'+esc(r.error)+'</p>':
      '<strong>'+r.wins+' / '+r.completed+' Siege</strong>'+
      '<small>Ø '+format(r.turns/Math.max(1,r.completed))+' Züge · '+
      format(r.damage/Math.max(1,r.completed))+' Schaden · '+
      (r.fusions/Math.max(1,r.completed)).toFixed(1)+' Fusionen</small>'+
      (r.errors?'<small>'+r.errors+' nicht abgeschlossene Probeduelle</small>':''))+'</article>').join('')+'</div>'+
      '<p class="ad120-lab-caption">Die simulierte KI ersetzt keine menschliche Spielweise. Gleiche Seeds erlauben einen ersten Vergleich, beweisen aber keine Decküberlegenheit.</p>';
    if(runButton.isConnected)runButton.disabled=false;
  }

  function menuExtras(){
    if(uiMode!=='menu')return;
    const host=$id('menuHero');
    if(!host||host.querySelector('#ad120-menu-tools'))return;
    const element=document.createElement('div');element.id='ad120-menu-tools';element.className='ad120-menu-tools';
    element.innerHTML='<button class="btn" id="ad120-open-lab">⚗ Taktisches Decklabor</button>'+
      '<button class="btn" id="ad120-open-tutorial">✧ Interaktiver Spieleinstieg</button>'+
      (lastReport?'<button class="btn" id="ad120-open-report">▤ Letzten Duellbericht lesen</button>':'');
    host.appendChild(element);
    $id('ad120-open-lab').onclick=openLab;
    $id('ad120-open-tutorial').onclick=guidedIntro;
    if(lastReport)$id('ad120-open-report').onclick=()=>{
      openModal('<div class="modal-kicker">LETZTES DUELL</div><h2>Deine Kampfanalyse</h2>'+reportMarkup(lastReport)+
        '<div class="modal-actions"><button class="btn primary" id="ad120-close-report">Schließen</button></div>');
      $id('ad120-close-report').onclick=hideModal;
    };
  }
  const originalMenuRender=renderMenu;
  renderMenu=function(...args){const result=originalMenuRender.apply(this,args);menuExtras();return result;};
  const originalRender=render;
  render=function(...args){const result=originalRender.apply(this,args);fusionDetails();updateTutorial();return result;};
  if(uiMode==='menu')menuExtras();
  window.ArcaneStrategyExperience120=Object.freeze({version:'12.0.0',openLab,guidedIntro,
    summarizeDuel,reportMarkup,progressSnapshot,labOpponentOptions,completedLessons,stageLessons});
})();
