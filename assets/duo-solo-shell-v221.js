/* Online adapter for the same menu/card components as the solo client.
 * Local route, inspection and deck drafts never enter the shared room state.
 * All mutations go through the existing authenticated, revision-checked API.
 */
'use strict';
(()=>{
 const $=id=>document.getElementById(id),api=window.ArcaneDuoParty218;
 const safe=window.ArcaneMenuShell221.safe;
 const make=(tag,cls,parent,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!=null)n.textContent=text;parent?.append(n);return n;};
 const groups=[
  {id:'play',icon:'⚔',title:'Duellieren',subtitle:'Gemeinsam in die Arena',tabs:['menu','quests']},
  {id:'deck',icon:'▤',title:'Deck & Sammlung',subtitle:'Karten und Deckbau',tabs:['deck','fusions','bestiary']},
  {id:'growth',icon:'✦',title:'Fortschritt',subtitle:'Verbesserungen, Belohnungen & Kartenpakete',tabs:['collection','upgrades','shop','progress']},
  {id:'options',icon:'⚙',title:'Spielstand & Extras',subtitle:'Chronik und Optionen',tabs:['profile','settings','rules']}
 ];
 const titles={menu:['Die zehn Prüfungen','Fordert gemeinsam die Duellanten der Arena heraus. Jeder bereitet sein eigenes Deck vor.'],quests:['Aufgaben & Abenteuer','Die fünf Prüfungen des Level-1-Fanatikers. Beide Duellanten müssen die gewählte Prüfung freigeschaltet haben.'],deck:['Dein Hauptdeck','Wähle einen Deckplatz und ein eigenes Monster. Dein Hauptdeck enthält genau 40 Karten, mit höchstens drei Kopien je Monster.'],fusions:['Deine Fusionen','Wähle deine Vorlagen für mächtige Verschmelzungen. Gemeinsame Feldmaterialien bleiben im Duell möglich.'],collection:['Monsterwerkstatt','Sieh dir deinen Vorrat an, verstärke deine Monster und zerlege freie Exemplare.'],upgrades:['Duellanten-Akademie','Dauerhafte Verbesserungen und Forschung für deinen eigenen Duellanten.'],shop:['Booster-Shop','Entdecke neue Kreaturen und Fusionsvorlagen für deine Sammlung.'],progress:['Levelbelohnungen & Kapitel','Verfolge deine Kapitel und hole verdiente Karten ab.'],profile:['Deine Chronik','Deine Identität, Siege und gesammelten Karten.'],settings:['Einstellungen & Spielstand','Sichere deinen persönlichen Zugang und passe Musik und Animationen an.'],rules:['Regelhandbuch','Karten, Rollen und gemeinsame Spielzüge verständlich erklärt.'],bestiary:['Monsterlexikon','Entdecke die Monsterfamilien und ihre Elemente.']};
 const roleNames={predator:'Predator',guardian:'Wächter',soul:'Seelenzehrer',resonator:'Resonator',combatant:'Allrounder',allrounder:'Allrounder'};
 const descriptions={predator:'Predatoren werden mit jedem eigenen Zug stärker und verstärken sich im Rudel. Predator-Fusionen können als Rudelführer besondere Fähigkeiten erhalten.',guardian:'Wächter heilen verbündete Verteidiger. In DEF schützt ihre Rüstung; überlebt das Monster den Treffer, löst es einen Gegenschlag aus.',soul:'Seelenzehrer sammeln Seelenkraft und ergänzen die Heilung der Wächter. In DEF stehen Verdichten, Seelenstoß und weitere freigeschaltete Fähigkeiten bereit.',resonator:'Resonatoren steigern die Kraft ihrer nächsten Fusion. Ihre gespeicherte Resonanz wird bei der Verschmelzung berücksichtigt.',combatant:'Allrounder verbinden Angriff und Verteidigung. Ihre Resonanz unterstützt passende Fusionen.'};
 let route='',profileStamp='',draftSlot=0,draftCandidate=null,search='',inspectSelection=null,inspectStamp='',pendingOperation=false;
 let uiState=null,noticeKey='',noticeFocus=null,noticeDismissed='',lastDuelKey='';
 const screen=make('section','fm-screen atlas-screen');screen.id='duoMenuScreen';screen.dataset.atlasTheme='amber';
 const workspace=$('duoSoloWorkspace'),profile=$('duoProfilePanel');workspace.before(screen);screen.append(workspace,profile);
 const nav=$('duoSoloMenuNav'),hero=$('duoSoloMenuHero');
 workspace.append($('duoReturnMenu'));
 $('duoReturnMenu').classList.add('ad221-legacy-return');
 const tabs=new Map();
 for(const key of Object.keys(titles)){
  const id='duoSoloTab'+key[0].toUpperCase()+key.slice(1);
  const button=$(id)||make('button','menu-tab',null,titles[key][0]);button.id=id;button.type='button';
  button.dataset.tab=key;button.onclick=()=>window.ArcaneDuoPartyUI218.select(key);tabs.set(key,button);
 }
 nav.addEventListener('click',event=>{const group=event.target.closest('[data-fm-group]');if(group)window.ArcaneDuoPartyUI218.select(groups.find(g=>g.id===group.dataset.fmGroup).tabs[0]);});
 const duels=make('section','duo-panel menu-panel atlas-etched-panel',screen);duels.id='duoDuelPanel';
 duels.innerHTML='<h2>Wählt eure nächste Prüfung</h2><p id="duoDuelMembers"></p><label>Duellziel<select id="duoDuelChapter"></select></label><div id="duoDuelEncounter" class="ad221-encounter"></div><div id="duoDuelStartActions" class="actions"></div><p id="duoRequestError" role="status" aria-live="polite"></p>';
 $('duoDuelStartActions').append($('duoMenuStart'),$('duoMenuParty'));
 duels.append($('duoMenuTeam'),$('duoMenuStatus'));
 $('duoMenuParty').textContent='Gruppe & Einladung';
 $('duoMenuStart').onclick=()=>requestDuel();
 $('duoDuelChapter').onchange=()=>renderEncounter();
 const builder=make('section','ad221-deck-builder',profile);builder.id='duoDeckBuilder';
 builder.innerHTML='<div class="ad221-deck-heading"><h2 id="duoDeckTitle"></h2><p>Wähle links den Platz, den du ersetzen möchtest. Rechts siehst du deine verfügbaren Karten.</p></div><div class="ad221-deck-columns"><section><h3>Dein Deck <span id="duoDeckCount"></span></h3><div id="duoDeckSlots" class="ad221-deck-slots"></div></section><section><label for="duoDeckSearch">Sammlung durchsuchen</label><input id="duoDeckSearch" type="search" autocomplete="off" placeholder="Monstername, Rolle oder Level"><p id="duoDeckSelection" role="status"></p><button id="duoDeckCommit" type="button" class="btn primary" disabled>Monster einsetzen</button><div id="duoDeckOwned" class="ad221-owned-grid"></div></section></div>';
 builder.addEventListener('click',event=>{
  const slot=event.target.closest('[data-deck-slot]'),candidate=event.target.closest('[data-candidate]');
  if(slot){draftSlot=Number(slot.dataset.deckSlot);draftCandidate=null;renderDeck();}
  if(candidate){draftCandidate=Number(candidate.dataset.candidate);renderDeckSelection();for(const b of $('duoDeckOwned').querySelectorAll('[data-candidate]'))b.classList.toggle('selected',Number(b.dataset.candidate)===draftCandidate);}
 });
 $('duoDeckSearch').oninput=event=>{search=event.target.value;renderOwned();};
 $('duoDeckCommit').onclick=async()=>{
  if(draftCandidate==null||pendingOperation)return;
  await operation('deckReplace',{zone:route==='fusions'?'fusion':'main',slot:draftSlot,cardId:draftCandidate});
  draftCandidate=null;renderDeck();
 };
 const offers=make('section','ad221-offers',profile);offers.id='duoVisualOffers';
 offers.addEventListener('click',async event=>{
  const button=event.target.closest('[data-offer]');if(!button||button.disabled)return;
  const kind=button.dataset.offer;
  await operation(kind,kind==='pack'?{pack:button.dataset.key}:{key:button.dataset.key});
 });
 const settings=make('section','menu-panel ad221-settings',profile);settings.id='duoPersonalSettings';
 settings.innerHTML='<h2>Dein persönlicher Spielstand</h2><p>Dein Online-Profil wird nach jeder bestätigten Änderung gespeichert. Sichere den privaten Zugangslink, um auf einem anderen Gerät weiterzuspielen.</p><div class="actions" id="duoPersonalSaveActions"></div><label><input type="checkbox" id="duoReduceMotion"> Animationen reduzieren</label>';
 for(const id of ['duoProfileBackup','duoProfileReload','duoProfileContinue'])$('duoPersonalSaveActions').append($(id));
 settings.append($('duoProfileBackupBox'));
 try{$('duoReduceMotion').checked=localStorage.getItem('arcane-duo-motion-v221')==='reduced';}catch{}
 function applyMotion(){document.body.classList.toggle('ad-motion-disabled',$('duoReduceMotion').checked);try{localStorage.setItem('arcane-duo-motion-v221',$('duoReduceMotion').checked?'reduced':'full');}catch{}}
 $('duoReduceMotion').onchange=applyMotion;applyMotion();
 const rules=make('section','menu-panel ad221-rules',profile);rules.id='duoPersonalRules';
 const guide=document.querySelector('#duoSetupPanel .duo-guide');if(guide){guide.open=true;rules.append(guide);}
 const bestiary=make('section','menu-panel',profile);bestiary.id='duoPersonalBestiary';
 bestiary.innerHTML='<h2>Das Bestiarium der Duellanten</h2><p>Entdecke die Illustrationen und Monsterfamilien im Lexikon.</p><a class="btn" href="collection-v3.html" target="_blank" rel="noopener">Monsterlexikon öffnen ↗</a>';
 // Native research/workshop controls keep their server validation and handlers.
 const native={perk:$('duoProfilePerk').parentElement,pack:$('duoProfilePack').parentElement,research:document.querySelector('#duoProfilePanel .duo-research'),deck:$('duoProfileDeckZone').closest('.duo-profile-shop > div'),collection:document.querySelector('#duoProfilePanel .duo-collection'),progress:document.querySelector('#duoProfilePanel .duo-balance-panel')};
 native.deck.hidden=true;native.perk.hidden=true;native.pack.hidden=true;
 const arena=$('duoBattleArena');arena.classList.add('ad221-duel');
 const battleGrid=make('div','ad221-battle-grid',arena),left=make('aside','card-preview-panel ad221-inspector',battleGrid),center=make('main','ad221-battle-center',battleGrid),right=make('aside','sidebar ad221-battle-sidebar',battleGrid);
 left.id='duoBattleInspector';left.setAttribute('aria-label','Karten und Fusionen');
 left.innerHTML='<details open class="ad182-inspector"><summary>▤ Kartenansicht</summary><div id="duoLargeCardPreview"><p>Wähle eine Karte auf dem Feld oder in deiner Hand.</p></div></details><details open class="ad182-fusion-workspace"><summary>✧ Beschwörung & Fusionen</summary><div id="duoFusionWorkspace"></div></details>';
 center.classList.add('table-surface');
 for(const node of [...arena.children])if(node!==battleGrid){
  if(node.matches('.stats,#ad185-turn-banner,#ad185-team-event,#duoTrack,#duoTurnName,#duoSeats'))center.append(node);
  else if(node.id==='duoActions'||node.matches('.duo-log'))right.append(node);
  else if(node.matches('#ad187-attack-guide,#ad188-fusion-guide,#ad189-summon-guide'))$('duoFusionWorkspace').append(node);
  else if(node.id==='ad194-sound-controls')settings.append(node);
  else left.append(node);
 }
 const battleFooter=make('div','actions ad221-battle-footer',right);
 const back=make('button','btn',battleFooter,'Zum Menü & Deckbau');back.id='duoBattleToMenu';back.onclick=()=>window.ArcaneDuoPartyUI218.returnToMenu();
 const status=make('p','duo-save-state',right);status.id='duoBattleSaveState';status.setAttribute('role','status');
 arena.addEventListener('click',event=>{
  if(event.target.closest('.ad204-card-info,button:not(.hand-card)'))return;
  const cell=event.target.closest('.field-cell.filled'),hand=event.target.closest('.duo178-hand-card');
  const s=api.state();
  if(cell){const panel=cell.closest('.seat');inspectSelection={seat:Number(panel.dataset.seat),slot:Number(cell.dataset.slot),area:cell.classList.contains('duo-ghost-cell')?'ghost':'field'};}
  else if(hand)inspectSelection={seat:s.seat,index:Number(hand.dataset.index),area:'hand'};
  else return;
  renderInspector();
 });
 function face(card,{instance=null,owner=null,small=false,tag='div'}={}){
  const t={...card,...(instance?{atk:owner&&window.ArcaneDuoUX204?.effectiveAttack?window.ArcaneDuoUX204.effectiveAttack(instance,owner,window.ArcaneDuoRules):window.ArcaneDuoRules.attackValue(instance),def:instance.def+(instance.soul||0)+(instance.condensed||0),level:instance.level||card.level}:{})};
  const family=card.ace?'ace':card.essenceMonster?'essence':instance?.fusion||card.fusionOnly?'fusion':'normal';
  const tier=Math.min(5,Math.ceil((t.level||1)/2)),lv=String(Math.min(10,t.level||1)).padStart(2,'0');
  return window.ArcaneCardView221.face(t,{tag,classes:small?'ad221-mini-face':'',frame:'tc-'+family+' ad-template ad-template-family-'+family+' ad-template-tier-'+tier+' ad-template-'+family+'-0'+tier+' ad-level-frame ad-level-'+family+'-'+lv});
 }
 async function operation(kind,extra){
  if(pendingOperation)return;pendingOperation=true;renderOffers();renderDeckSelection();
  try{await api.profileOperation(kind,extra);}finally{pendingOperation=false;profileStamp='';sync(uiState);}
 }
 function renderDeckSelection(){
  const s=api.state(),deck=route==='fusions'?s.profile?.fusions:s.profile?.deck;
  if(!deck)return;
  const t=s.catalog[draftCandidate];$('duoDeckSelection').textContent='Platz '+(draftSlot+1)+': '+(s.catalog[deck[draftSlot]]?.name||'')+(t?' → '+t.name:' · Wähle eine Karte aus deiner Sammlung.');
  $('duoDeckCommit').disabled=pendingOperation||s.profileSaving||!t||deck[draftSlot]===draftCandidate;
  $('duoDeckCommit').textContent=t?'In Platz '+(draftSlot+1)+' einsetzen':'Monster einsetzen';
 }
 function renderOwned(){
  const s=api.state(),fusion=route==='fusions',p=s.profile;if(!p)return;
  const owned=fusion?p.ownedFusions:p.ownedMain,deck=fusion?p.fusions:p.deck;
  const counts=new Map();for(const id of owned)counts.set(id,(counts.get(id)||0)+1);
  const query=search.trim().toLocaleLowerCase('de');
  $('duoDeckOwned').innerHTML=[...counts].filter(([id])=>{const c=s.catalog[id];return c&&(!query||(c.name+' '+(roleNames[c.role]||'')+' '+c.level).toLocaleLowerCase('de').includes(query));}).sort(([a],[b])=>s.catalog[a].level-s.catalog[b].level||s.catalog[a].name.localeCompare(s.catalog[b].name,'de')).map(([id,count])=>{
   const used=deck.filter(x=>x===id).length,available=count-used+(deck[draftSlot]===id?1:0),disabled=available<1||!fusion&&used-(deck[draftSlot]===id?1:0)>=3;
   return '<button type="button" class="ad221-card-choice'+(id===draftCandidate?' selected':'')+'" data-candidate="'+id+'" '+(disabled?'disabled':'')+'>'+face(s.catalog[id],{small:true})+'<small>'+count+' im Besitz · '+used+' im Deck</small></button>';
  }).join('')||'<p>Keine passenden Karten in deiner Sammlung.</p>';
 }
 function renderDeck(){
  const s=api.state(),fusion=route==='fusions',deck=fusion?s.profile?.fusions:s.profile?.deck;if(!deck)return;
  if(draftSlot>=deck.length)draftSlot=0;
  $('duoDeckTitle').textContent=fusion?'Deine Fusionsvorlagen':'Dein Hauptdeck';$('duoDeckCount').textContent='('+deck.length+')';
  $('duoDeckSlots').innerHTML=deck.map((id,index)=>'<button type="button" class="ad221-card-choice'+(index===draftSlot?' selected':'')+'" data-deck-slot="'+index+'" aria-pressed="'+(index===draftSlot)+'"><span class="ad221-deck-number">'+(index+1)+'</span>'+face(s.catalog[id],{small:true})+'</button>').join('');
  renderOwned();renderDeckSelection();
 }
 function renderOffers(){
  const s=api.state(),p=s.profile;if(!p||!['upgrades','shop'].includes(route))return;
  const source=route==='shop'?$('duoProfilePack'):$('duoProfilePerk');
  offers.innerHTML=[...source.options].map(o=>{
   const key=o.value,kind=route==='shop'?'pack':'upgrade',max=window.ArcaneDuoRules.PERK_LIMITS[key],rank=p.upgrades[key]||0,cost=100+rank*70;
   const disabled=pendingOperation||s.profileSaving||o.disabled||(kind==='upgrade'&&(rank>=max||p.essence<cost));
   return '<article class="fm-perk-card atlas-etched-panel"><h3>'+safe(kind==='pack'?o.textContent.split(' · ')[0]:o.textContent.split(' '+rank+'/')[0])+'</h3><p>'+safe(o.textContent)+'</p><button type="button" class="btn" data-offer="'+kind+'" data-key="'+safe(key)+'" '+(disabled?'disabled':'')+'>'+(kind==='pack'?'Paket öffnen':rank>=max?'✓ Maximal':'Verbessern · '+cost+' Essenz')+'</button></article>';
  }).join('');
 }
 function renderEncounter(){
  const s=api.state(),chapter=Number($('duoDuelChapter').value),c=window.ArcaneDuoRules.ENCOUNTERS.find(c=>c.id===chapter);
  if(!c)return;
  $('duoDuelEncounter').innerHTML='<strong>'+safe(c.name)+'</strong><p>'+safe(c.dialogue||'Stellt euch zu zweit den Gegnern dieser Turnierstufe.')+'</p><div class="info-pills"><span>7 Zonen je Duellant</span><span>'+window.ArcaneDuoRules.duoStartingLp(chapter).toLocaleString('de-AT')+' LP je Team</span><span>2 Menschen · 2 Gegner</span></div>';
  $('duoMenuStart').disabled=s.busy||$('duoDuelChapter').disabled||!s.game||s.game.status==='waiting'||s.game.status==='active'||s.game.status==='inviting_next'||s.game.status==='party_ready'&&!(s.game.partyStartInvite?.expiresAt<=Date.now());
  $('duoMenuStart').textContent=s.game?.status==='waiting'?'Partner wird erwartet':'Duell anfragen';
  $('duoDuelMembers').textContent=s.game?.status==='waiting'?'Du kannst dein Deck bereits vorbereiten. Der gemeinsame Start wird verfügbar, sobald dein Partner beigetreten ist.':'Eine Anfrage startet erst dann ein Duell, wenn dein Partner ausdrücklich beitritt.';
 }
 function chapterOptions(){
  const s=api.state(),prior=$('duoDuelChapter').value,quest=route==='quests';
  $('duoDuelChapter').innerHTML=window.ArcaneDuoRules.ENCOUNTERS.filter(c=>(c.id>=11)===quest).map(c=>'<option value="'+c.id+'" '+(c.id>(quest?(s.economy?.maxSagaStage||0):(s.economy?.maxChapter||1))?'disabled':'')+'>'+(quest?'Prüfung '+(c.id-10):'Kapitel '+c.id)+' · '+safe(c.name)+'</option>').join('');
  const options=[...$('duoDuelChapter').options];
  const selected=options.find(o=>o.value===prior&&!o.disabled)||options.find(o=>Number(o.value)===s.game?.chapter&&!o.disabled)||options.find(o=>!o.disabled);
  if(selected)$('duoDuelChapter').value=selected.value;
  $('duoDuelChapter').disabled=!selected;
  renderEncounter();if(!selected){$('duoMenuStart').disabled=true;$('duoDuelEncounter').textContent='Schließe zuerst Kapitel II ab, um die Fanatiker-Saga freizuschalten.';}
 }
 async function requestDuel(){
  const s=api.state();if($('duoMenuStart').disabled||s.busy)return;
  $('duoRequestError').textContent='Anfrage wird verschickt …';
  await api.send({type:'requestDuel',chapter:Number($('duoDuelChapter').value)});
  $('duoRequestError').textContent=api.state().game?.status==='party_ready'?'Deine Anfrage wurde verschickt.':$('duoStatus').textContent;
 }
 function renderInspector(){
  if(!inspectSelection)return;
  const s=api.state(),p=s.game?.players[inspectSelection.seat];if(!p)return;
  const raw=inspectSelection.area==='hand'?p.hand[inspectSelection.index]:(inspectSelection.area==='ghost'?p.lv1?.ghostSlots:p.field)?.[inspectSelection.slot];
  const c=typeof raw==='number'?{id:raw}:raw,t=s.catalog[c?.id];
  if(!c||!t){$('duoLargeCardPreview').innerHTML='<p>Dieses Monster befindet sich nicht mehr an diesem Platz.</p>';inspectSelection=null;inspectStamp='';return;}
  const stamp=JSON.stringify([inspectSelection,c]);if(stamp===inspectStamp)return;inspectStamp=stamp;
  const field=inspectSelection.area!=='hand',role=c.role||t.role,over=field&&c.def+(c.soul||0)+(c.condensed||0)>(c.maxDef??c.def);
  $('duoLargeCardPreview').innerHTML=face(t,{instance:field?c:null,owner:p})+'<div class="ad221-card-explanation"><strong>'+safe(roleNames[role]||'Monster')+'</strong><p>'+safe(descriptions[role]||'')+'</p>'+(over?'<p class="ad221-overcharge-text">✦ Überladen: DEF über dem normalen Maximalwert</p>':'')+(field&&role==='soul'?'<p>Grund-DEF '+c.def+' · Seelenkraft '+(c.soul||0)+' · Verdichtung '+(c.condensed||0)+'</p>':'')+(t.ability?'<p>'+safe(t.ability)+'</p>':'')+'</div>';
 }
 function decorateBattle({game,seat,catalog}){
  $('duoBattleToMenu').hidden=!['finished','inviting_next'].includes(game.status);
  $('duoBattleSaveState').textContent=$('duoSaveState')?.textContent||'';
  for(const p of game.players){
   const panel=document.querySelector('#duoSeats .seat[data-seat="'+p.seat+'"]');if(!panel)continue;
   panel.style.order=String(p.seat===seat?4:p.team===0?3:p.seat===1?0:1);
   for(const [slot,c] of p.field.entries()){
    const cell=panel.querySelector(':scope > .field > [data-slot="'+slot+'"]');if(!cell||!c)continue;
    cell.dataset.mode=c.mode;cell.classList.add('ad221-zone');
    cell.classList.toggle('ad221-overcharged',c.def+(c.soul||0)+(c.condensed||0)>(c.maxDef??c.def));
    const visual=make('div','ad221-board-face');visual.innerHTML=face(catalog[c.id],{instance:c,owner:p,small:true});
    // Preserve the zone, ownership and listeners used by all combat/cinema modules.
    for(const child of [...cell.children])if(child.matches('img.duo-field-art,span:not([class]),small.duo-field-meta,small.duo-card-level'))child.hidden=true;
    cell.prepend(visual);
    const role=make('span','ad221-role-label',cell,roleNames[c.role]||'Monster');role.dataset.role=c.role||'combatant';
   }
   if(p.seat===seat){
    for(const [i,id] of p.hand.entries()){
     const c=typeof id==='number'?{id}:id,t=catalog[c.id],node=panel.querySelector('.duo178-hand-card[data-index="'+i+'"]');if(!node||!t)continue;
     for(const child of [...node.children])if(!child.matches('.ad204-card-info'))child.hidden=true;
     const visual=make('div','ad221-hand-face',node);visual.innerHTML=face(t,{small:true});
    }
   }
  }
  const duelKey=game.roomId+':'+(game.duelNo||1);
  if(duelKey!==lastDuelKey){lastDuelKey=duelKey;inspectSelection=null;inspectStamp='';$('duoLargeCardPreview').innerHTML='<p>Wähle eine Karte auf dem Feld oder in deiner Hand.</p>';}
  if(game.fieldLayout==='team7')composeTeamFields(game,seat);
  renderInspector();
 }
 function composeTeamFields(game,seat){
  const root=$('duoSeats');
  for(const team of [1,0]){
   const group=make('section','ad221-team-field',root);group.dataset.team=team;
   const members=game.players.filter(p=>p.team===team),base=team===0?seat:(game.activeSeat%2===1?game.activeSeat:1);
   const heading=make('h3','ad221-team-heading',group,members.map(p=>p.name).join(' & ')+' · 7 gemeinsame Zonen');
   for(const p of members){
    const panel=root.querySelector('.seat[data-seat="'+p.seat+'"]');if(!panel)continue;
    group.append(panel);
    for(const cell of panel.querySelectorAll(':scope > .field > .field-cell')){
     const slot=Number(cell.dataset.slot),card=p.field[slot],other=members.find(x=>x.seat!==p.seat);
     cell.classList.toggle('ad221-shared-hidden',!card&&(p.seat!==base||!!other.field[slot]));
     cell.style.gridColumn=String(slot+1);cell.style.gridRow='2';
     if(card){const owner=make('small','ad221-card-owner',cell,p.seat===seat?'Dein Monster':p.name);owner.title='Kontrolle: '+p.name;}
    }
   }
  }
 }
 function updatePresence(){
  const s=api.state();let node=$('duoPresenceNotice');
  if(!node){node=make('div','ad221-presence',document.body);node.id='duoPresenceNotice';node.setAttribute('role','status');}
  const offline=s.presence&&(s.seat===2?!s.presence.hostOnline:!s.presence.guestOnline);
  node.hidden=!offline||!s.game||s.game.status==='waiting';
  if(!node.hidden){const who=s.seat===2?'Der ursprüngliche Host':'Dein Partner';
   node.textContent=who+' ist derzeit nicht erreichbar. Wir warten auf die Wiederverbindung. Spielstand und Sitz bleiben erhalten; es gibt keine automatische Host-Übernahme.';
   if(s.game.status==='active'&&s.game.activeSeat!==s.seat)node.textContent+=' Der Zug bleibt beim abwesenden Spieler.';
  }
 }
 function afterStartScreen(){
  return new Promise(resolve=>{
   const wait=()=>{
    if(document.querySelector('.ad216-dialog-overlay')){setTimeout(wait,150);return;}
    if($('duoReduceMotion').checked||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){resolve();return;}
    const overlay=make('div','ad221-duel-start',document.body);overlay.setAttribute('role','status');
    overlay.innerHTML='<span>✧ DAS BÜNDNIS DER VIER ✧</span><strong>DUELL START</strong><small>Gemeinsam in die Arena</small>';
    let done=false;const finish=()=>{if(done)return;done=true;overlay.remove();resolve();};
    overlay.addEventListener('click',finish);setTimeout(finish,1800);
   };setTimeout(wait,0);
  });
 }
 function sync(state=uiState){
  if(!state)return;uiState=state;
  const s=api.state(),show=state.entered&&state.inMenu;
  screen.hidden=!show;
  if(show){
   $('duoMainMenuGate').hidden=true;$('duoPage').hidden=false;$('duoPage').inert=false;
   $('duoPage').dataset.lobbyView='true';$('duoSoloWorkspace').hidden=false;
   const next=state.lobbySection||'menu',changed=next!==route;route=next;
   const details=titles[route]||titles.menu,group=groups.find(g=>g.tabs.includes(route))||groups[0];
   const stamp=(s.profile?.id||'')+':'+s.profile?.revision+':'+route;
   if(changed){
    const active=window.ArcaneMenuShell221.navigation({nav,groups,tabs,activeTab:route,brand:'4.1 · GEMEINSAME KAMPAGNE'});
    nav.classList.add('atlas-nav');screen.dataset.fmSection=active.id;screen.dataset.atlasTheme={play:'amber',deck:'silver',growth:'jade',options:'steel'}[group.id];
    for(const b of tabs.values())b.classList.toggle('active',b.dataset.tab===route);
    for(const g of nav.querySelectorAll('.fm-menu-group'))g.classList.add('atlas-nav-item');
    const showcase=[...new Set([...(s.profile?.deck||[]),...(s.profile?.fusions||[])])].slice(0,3).map(id=>s.catalog[id]).filter(Boolean);
    hero.classList.add('atlas-hero','atlas-has-art');hero.innerHTML='<div class="fm-hero-content"><div><span class="fm-eyebrow">'+safe(group.title)+' · ARCANE DUEL 4.1</span><h1 id="duoSoloMenuTitle">'+safe(details[0])+'</h1><p id="duoSoloMenuSubtitle">'+safe(details[1])+'</p></div><div class="atlas-showcase" aria-hidden="true"><div class="atlas-showcase-cards">'+showcase.map((c,i)=>'<div class="atlas-preview-card atlas-preview-'+i+'" data-card-id="'+c.id+'" data-card-level="'+c.level+'" inert>'+face(c).replace('hand-card tc-card','hand-card tc-card atlas-showcase-face')+'</div>').join('')+'</div></div></div>';
   }
   $('duoSoloMenuTitle').textContent=details[0];$('duoSoloMenuSubtitle').textContent=details[1];
   duels.hidden=!['menu','quests'].includes(route);profile.hidden=!duels.hidden;
   builder.hidden=!['deck','fusions'].includes(route);offers.hidden=!['shop','upgrades'].includes(route);
   settings.hidden=route!=='settings';rules.hidden=route!=='rules';bestiary.hidden=route!=='bestiary';
   native.research.hidden=route!=='upgrades';native.collection.hidden=route!=='collection';native.progress.hidden=route!=='progress';
   const profileOnly=['duoProfileStats','duoAvatarSummary','duoProfileCleared','duoProfileUnlockInfo'];
   for(const id of profileOnly)$(id).hidden=!['profile','progress'].includes(route);
   $('duoProfilePanel').dataset.route=route;
   if(stamp!==profileStamp){profileStamp=stamp;if(!builder.hidden){draftCandidate=null;renderDeck();}if(!offers.hidden)renderOffers();if(!duels.hidden)chapterOptions();}
   else if(!duels.hidden)renderEncounter();
  }
  if(!show&&s.game?.status==='active')profile.hidden=true;
  syncInvitation();
 }
 function syncInvitation(){
  const s=api.state(),invite=s.game?.partyStartInvite,node=$('duoStartNotice');
  const key=s.game?.status==='party_ready'?(s.roomId+':'+(invite?.id||s.game.revision)):'';
  const expired=invite?.expiresAt<=Date.now();
  node.classList.toggle('ad221-invite-modal',!!key&&s.seat===invite?.toSeat&&noticeDismissed!==key&&!expired);
  node.hidden=!key||noticeDismissed===key||expired;
  node.setAttribute('role',node.classList.contains('ad221-invite-modal')?'dialog':'status');
  node.setAttribute('aria-modal',String(node.classList.contains('ad221-invite-modal')));
  node.setAttribute('aria-labelledby','duoStartNoticeTitle');
  $('duoPage').inert=node.classList.contains('ad221-invite-modal')||$('duoPage').hidden;
  $('duoPartyGate').inert=node.classList.contains('ad221-invite-modal');
  const own=s.seat===invite?.fromSeat,who=s.game?.players[invite?.fromSeat]?.name||'Dein Partner';
  $('duoStartNoticeTitle').textContent=own?'Warte auf die Zustimmung deines Partners':who+' lädt dich zu einem Duell ein.';
  const target=window.ArcaneDuoRules.ENCOUNTERS.find(c=>c.id===(invite?.chapter||s.game?.chapter));
  $('duoStartNoticeText').textContent=(target?target.name+' · ':'')+'Ihr startet erst nach der Bestätigung. Du kannst vorher dein Deck fertigstellen.';
  $('duoStartAccept').textContent='Beitreten';$('duoStartDecline').textContent='Ablehnen';
  for(const id of ['duoStartAccept','duoStartDecline','duoStartCancel'])$(id).disabled=s.busy||expired;
  let later=$('duoStartLater');if(!later){later=make('button','',node.querySelector('.duo-start-actions'),'Erst vorbereiten');later.id='duoStartLater';later.type='button';later.onclick=()=>{noticeDismissed=noticeKey;syncInvitation();};}
  later.hidden=own;
  let reopen=$('duoPendingInvite');if(!reopen){reopen=make('button','btn ad221-pending-invite',document.body,'⚔ Duelleinladung ansehen');reopen.id='duoPendingInvite';reopen.onclick=()=>{noticeDismissed='';syncInvitation();};}
  reopen.hidden=!key||own||expired||noticeDismissed!==key;
  if(key!==noticeKey){
   const was=noticeKey;noticeKey=key;
   if(key){noticeFocus=document.activeElement;if(!own&&!expired)$('duoStartAccept').focus({preventScroll:true});}
   else if(was&&noticeFocus?.isConnected&&s.game?.status!=='active')noticeFocus.focus({preventScroll:true});
  }
 }
 document.addEventListener('keydown',event=>{
  const node=$('duoStartNotice');if(node.hidden||!node.classList.contains('ad221-invite-modal'))return;
  if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();noticeDismissed=noticeKey;syncInvitation();noticeFocus?.focus?.({preventScroll:true});}
  if(event.key==='Tab'){
   const buttons=[...node.querySelectorAll('button')].filter(b=>!b.hidden&&!b.disabled),first=buttons[0],last=buttons.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
 },true);
 window.ArcaneDuoSolo221=Object.freeze({sync,decorateBattle,updatePresence,afterStartScreen,profileChanged:()=>{profileStamp='';sync(uiState);},face});
 window.ArcaneDuoPartyUI218.sync();
 setInterval(()=>{if(noticeKey){syncInvitation();if(uiState?.inMenu)renderEncounter();}},1000);
})();
