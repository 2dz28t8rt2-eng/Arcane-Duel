/* Arcane Duel 15.5: portable, validated backup of profile AND bounded local
 * strategy/collection metadata. Legacy profile JSON remains supported.
 */
'use strict';
(()=>{
  const SCHEMA='arcane-duel-complete-backup';
  const VERSION=1;
  const EXTRA_KEYS={
    'arcane-duel-v154-first-discoveries':'first',
    'arcane-duel-v155-monster-records':'records',
    'arcane-duel-v122-strategy':'strategy',
    'arcane-duel-v122-radar':'radar',
    'arcane-duel-tutorial-v152':'tutorial',
    'arcane-duel-v151-display':'display',
    'arcane-duel-v155-effect-prefs':'effects'
  };
  const $id=id=>document.getElementById(id);
  const esc=x=>escapeHtml(String(x??''));
  const stamp=()=>new Date().toISOString().replace(/[:.]/g,'-');
  const isObject=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
  const sizeOf=x=>JSON.stringify(x).length;
  function validateExtras(raw){
    if(!isObject(raw))throw Error('Ungültige Zusatzdaten.');
    const output={};
    for(const [key,value] of Object.entries(raw)){
      if(!Object.hasOwn(EXTRA_KEYS,key))throw Error('Unbekannter Sicherungsbereich: '+key);
      if(sizeOf(value)>150000)throw Error('Zusatzdaten sind zu groß: '+key);
      const label=EXTRA_KEYS[key];
      if(label==='first'){
        if(!isObject(value)||Object.keys(value).length>3000||Object.entries(value).some(([id,date])=>
          !/^\d{1,5}$/.test(id)||!Number.isInteger(date)||date<0||date>Date.now()+86400000))throw Error('Ungültige Erstfund-Chronik.');
      }else if(label==='records'){
        if(!isObject(value)||Object.keys(value).length>3000||Object.entries(value).some(([id,v])=>
          !/^\d{1,5}$/.test(id)||!isObject(v)||!Number.isInteger(v.uses)||v.uses<0||v.uses>1000000||
          !Number.isInteger(v.wins)||v.wins<0||v.wins>v.uses||!Number.isInteger(v.last)||v.last<0||v.last>Date.now()+86400000))
          throw Error('Ungültige Monsterchronik.');
      }else if(label==='strategy'){
        if(!isObject(value)||!Array.isArray(value.wish)||value.wish.length>8||!Array.isArray(value.fusions)||value.fusions.length>80)
          throw Error('Ungültige Decklabor-Daten.');
      }else if(label==='radar'){
        if(!Array.isArray(value)||value.length>8)throw Error('Ungültige Vergleichshistorie.');
      }else if(label==='tutorial'){
        if(!Array.isArray(value)||value.length>3||value.some(n=>![1,2,3].includes(n)))throw Error('Ungültige Tutorialdaten.');
      }else if(label==='display'){
        if(!isObject(value)||typeof value.forecast!=='boolean')throw Error('Ungültige Anzeigeeinstellung.');
      }else if(label==='effects'){
        if(!isObject(value)||!['subtle','normal','epic'].includes(value.intensity))throw Error('Ungültige Effektstufe.');
      }
      output[key]=value;
    }
    if(sizeOf(output)>500000)throw Error('Sicherungszusätze überschreiten das Größenlimit.');
    return output;
  }
  function readExtras(){
    const extras={};
    for(const key of Object.keys(EXTRA_KEYS)){
      let raw;
      try{raw=window.localStorage?.getItem(key);}catch(_){throw Error('Zusatzdaten konnten nicht gelesen werden: '+key);}
      if(raw!==null&&raw!==undefined){
        try{extras[key]=JSON.parse(raw);}catch(_){throw Error('Zusatzdaten sind beschädigt: '+key);}
      }
    }
    return validateExtras(extras);
  }
  function makeBackup(){
    if(typeof refreshEnergy==='function')refreshEnergy();
    if(typeof syncSlot==='function')syncSlot();
    const payload={schema:SCHEMA,version:VERSION,exportedAt:Date.now(),profile:JSON.parse(JSON.stringify(profile)),extras:readExtras()};
    if(sizeOf(payload)>2500000)throw Error('Spielstand ist zu groß für eine Sicherung.');
    return payload;
  }
  function validateBackup(raw){
    if(!isObject(raw))throw Error('Keine gültige JSON-Sicherung.');
    if(raw.schema!==SCHEMA){
      // The existing full JSON validator is the single source of truth.
      const checked=validateProfile(raw);
      return {profile:raw,preview:checked,extras:null,legacy:true};
    }
    if(raw.version!==VERSION||!isObject(raw.profile))throw Error('Nicht unterstützte Komplettsicherung.');
    const checked=validateProfile(raw.profile),extras=validateExtras(raw.extras);
    return {profile:raw.profile,preview:checked,extras,legacy:false};
  }
  function download(value,filename){
    const objectURL=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=objectURL;a.download=filename;document.body.append(a);a.click();a.remove();
    window.setTimeout(()=>URL.revokeObjectURL(objectURL),2000);
  }
  function exportComplete(){
    try{download(makeBackup(),'Arcane_Duel_Komplettsicherung_'+stamp()+'.json');
      toast('Komplettsicherung wurde zum Download bereitgestellt.');}
    catch(error){toast('Sicherung fehlgeschlagen: '+error.message);}
  }
  function restoreExtras(previous){
    for(const [key,value] of Object.entries(previous)){
      try{if(value===null)window.localStorage.removeItem(key);else window.localStorage.setItem(key,value);}catch(_){}
    }
  }
  function applyBackup(parsed){
    if(uiMode!=='menu'||game)throw Error('Import nur im Hauptmenü möglich.');
    // Write optional metadata first. If any write or core validation fails,
    // the original profile remains unchanged and metadata is rolled back.
    const previous={};
    if(parsed.extras){
      for(const key of Object.keys(EXTRA_KEYS))previous[key]=window.localStorage.getItem(key);
      try{
        for(const key of Object.keys(EXTRA_KEYS)){
          if(Object.hasOwn(parsed.extras,key))window.localStorage.setItem(key,JSON.stringify(parsed.extras[key]));
          else window.localStorage.removeItem(key);
        }
      }catch(error){restoreExtras(previous);throw Error('Zusatzdaten konnten nicht gespeichert werden.');}
    }
    try{importProfileText(JSON.stringify(parsed.profile));}
    catch(error){if(parsed.extras)restoreExtras(previous);throw error;}
    deckDraft=[...profile.activeDeck];fusionDraft=[...profile.fusionDeck];
    animationSpeed=profile.settings.animation;soundOn=profile.settings.sound;
    return true;
  }
  async function chooseFile(event){
    const file=event.target.files?.[0];event.target.value='';
    if(!file)return;
    try{
      if(file.size>3000000)throw Error('Sicherungsdatei ist zu groß (max. 3 MB).');
      if(game||uiMode!=='menu')throw Error('Bitte ins Hauptmenü zurückkehren.');
      const parsed=validateBackup(JSON.parse(await file.text()));
      openModal('<section class="ad155-backup-confirm"><div class="modal-kicker">SPIELSTAND WIEDERHERSTELLEN</div>'+ 
        '<h2>Bestehenden Spielstand ersetzen?</h2><p>Die ausgewählte Sicherung enthält Stufe <b>'+playerLevel(parsed.preview)+'</b>, '+
        '<b>'+esc(parsed.preview.wins)+' Siege</b> und <b>'+esc(parsed.preview.coins)+' Essenz</b>.</p>'+ 
        '<p>'+(!parsed.legacy?'Komplettsicherung inklusive '+Object.keys(parsed.extras).length+' Zusatzbereiche.':
          'Klassischer Spielstand: lokale Zusatzdaten werden dabei nicht ersetzt.')+'</p>'+ 
        '<p class="ad155-backup-warning">Deine bisherigen Daten werden überschrieben. Vor dem Import wird automatisch eine Sicherung des aktuellen Stands heruntergeladen.</p>'+ 
        '<div class="modal-actions"><button type="button" class="btn ghost" id="ad155-backup-cancel">Abbrechen</button>'+ 
        '<button type="button" class="btn primary" id="ad155-backup-confirm">Aktuellen Stand sichern & importieren</button></div></section>');
      $id('ad155-backup-cancel').onclick=hideModal;
      $id('ad155-backup-confirm').onclick=()=>{
        try{
          download(makeBackup(),'Arcane_Duel_Vor_Import_'+stamp()+'.json');
          applyBackup(parsed);hideModal();renderMenu();toast('Spielstand und vorhandene Zusatzdaten erfolgreich importiert.');
        }catch(error){toast('Import angehalten: '+error.message);}
      };
    }catch(error){toast('Importprüfung fehlgeschlagen: '+error.message);}
  }
  function extend(){
    if(uiMode!=='menu'||menuTab!=='settings')return;
    const panel=$id('ad154-save-safety');
    if(!panel||$id('ad155-backup-tools'))return;
    const tools=document.createElement('div');tools.id='ad155-backup-tools';
    tools.innerHTML='<hr><h4>Vollständige Spielstandkopie</h4>'+ 
      '<p>Enthält Profil, Monster-Erstfunde, Kampfchronik, Decklabor-Historie und Anzeigeoptionen. '+
      'Der klassische Export darüber bleibt weiterhin verfügbar.</p>'+ 
      '<div class="ad155-backup-actions"><button type="button" class="btn primary" id="ad155-export">Komplett-Export (JSON)</button>'+ 
      '<button type="button" class="btn" id="ad155-import">Komplett-Import</button>'+ 
      '<input type="file" accept=".json,application/json" id="ad155-import-file" hidden></div>'+ 
      '<small>Auch ältere Einzelspielstände lassen sich weiterhin importieren. Angezeigte Daten werden vor der Übernahme geprüft.</small>';
    panel.appendChild(tools);
    $id('ad155-export').onclick=exportComplete;
    $id('ad155-import').onclick=()=>{const file=$id('ad155-import-file');file.value='';file.click();};
    $id('ad155-import-file').addEventListener('change',chooseFile);
  }
  const oldMenu=renderMenu;
  renderMenu=function(){const result=oldMenu.apply(this,arguments);extend();return result;};
  if(uiMode==='menu')extend();
  window.ArcaneCompleteBackup155=Object.freeze({version:'15.5.0',validateExtras,validateBackup,makeBackup,applyBackup,exportComplete});
})();
