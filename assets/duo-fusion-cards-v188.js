/* Arcane Duel v18.8 – click-to-pick fusion materials in 2v2.
 * Reuses the original multi-select, preview and confirmation callbacks.
 * Does not change recipes, send server commands or reveal hidden hands.
 */
'use strict';
(()=>{
  const saved=new Map();
  const validKey=key=>/^(hand|field|ghost|charge):\d+$/.test(key||'');
  const selectedKeys=select=>[...(select?.options||[])].filter(o=>o.selected).map(o=>o.value);
  function toggleMaterial(keys,key,max=5){
    if(!validKey(key))return {keys:[...keys],error:'invalid'};
    if(keys.includes(key))return {keys:keys.filter(value=>value!==key),error:null};
    if(keys.length>=max)return {keys:[...keys],error:'limit'};
    return {keys:[...keys,key],error:null};
  }
  const idOf=value=>typeof value==='number'?value:value?.id;
  function materialIdentity(player,key){
    const [area,indexRaw]=String(key||'').split(':');const index=Number(indexRaw);
    if(!Number.isInteger(index)||index<0)return null;
    if(area==='charge')return 'charge:'+index;
    const item=area==='hand'?player?.hand?.[index]:
      area==='field'?player?.field?.[index]:area==='ghost'?player?.lv1?.ghostSlots?.[index]:null;
    return item==null?null:String(idOf(item));
  }
  function remember(scope,select,player){
    saved.set(scope,selectedKeys(select).map(key=>({key,id:materialIdentity(player,key)})));
    if(saved.size>16)saved.delete(saved.keys().next().value);
  }
  function materialCell(panel,key){
    const [area,index]=key.split(':');
    if(area==='hand')return panel?.querySelector('.duo178-hand-card[data-index="'+index+'"]')||null;
    if(area==='field')return panel?.querySelector(':scope > .field > .field-cell[data-slot="'+index+'"]')||null;
    if(area==='ghost')return panel?.querySelector('.duo-ghost-cell[data-slot="'+index+'"]')||null;
    return null;
  }
  function element(tag,cls,text){
    const result=document.createElement(tag);
    if(cls)result.className=cls;
    if(text!==undefined)result.textContent=text;
    return result;
  }
  function enhance({game,seat,roomId,dock,send,busy=false,syncError=''}={}){
    const helper=document.getElementById('ad188-fusion-guide');
    if(!helper)return;
    helper.hidden=true;helper.replaceChildren();
    if(!game||game.status!=='active'||game.activeSeat!==seat||busy||syncError||!dock)return;
    const player=game.players?.[seat],panel=document.querySelector('#duoSeats .seat[data-seat="'+seat+'"]');
    const select=dock.querySelector('.duo-fusion-list');
    const fusionPanel=dock.querySelector('#ad186-fusion');
    const commit=dock.querySelector('[data-ad188-commit]');
    if(!player||!panel||!select||!fusionPanel||!commit)return;
    const native=select.closest('.duo-action-group');
    const hint=native?.querySelector('.duo-action-status');
    const template=native?.querySelector('[data-ad188-template]');
    const resultSlot=native?.querySelector('[data-ad188-slot]');
    const optionByKey=new Map([...select.options].map(o=>[o.value,o]));
    const scope=(roomId||game.roomId||'duo')+':'+seat+':'+(player.ownTurns??game.round);
    const previous=saved.get(scope);
    let stageMode='fusion',keepKey=null;
    if(previous?.length){
      for(const entry of previous){
        const option=optionByKey.get(entry.key);
        if(option&&entry.id!==null&&entry.id===materialIdentity(player,entry.key)){option.selected=true;select.append(option);}
      }
      // The original on-change callback recalculates every legal template and slot.
      select.dispatchEvent(new Event('change',{bubbles:true}));
    }

    // Keep the original multi-select accessible, but no longer use its height
    // as the default way to select cards.
    const fold=element('details','ad188-list-fold');
    fold.append(element('summary',undefined,'Materialliste verwenden (optional)'));
    select.parentNode.insertBefore(fold,select);fold.append(select);
    const instruction=element('p','ad188-material-instruction',
      'Klicke 2–5 eigene Karten auf dem Feld, in der Hand oder in der Geisterzone an. '+
      'Ein zweiter Klick entfernt die Karte wieder.');
    fold.parentNode.insertBefore(instruction,fold);
    const selectionBox=element('div','ad188-selected-materials');
    // The selected cards are displayed inside the shared summon workspace.
    const sparks=[...optionByKey.keys()].filter(key=>key.startsWith('charge:'));
    const sparkBox=element('div','ad188-spark-options');
    if(sparks.length){
      fold.parentNode.insertBefore(sparkBox,fold);
      sparkBox.append(element('strong',undefined,'Geisterfunken als Material: '));
    }

    const heading=element('strong','ad188-floating-heading');
    const message=element('p','ad188-floating-message');
    message.setAttribute('role','status');message.setAttribute('aria-live','polite');
    const notice=element('span','ad188-floating-notice');
    notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
    const actions=element('div','ad188-floating-actions');
    const confirm=element('button','ad188-confirm','✦ Jetzt fusionieren');confirm.type='button';
    const details=element('button','ad188-details','Vorlage / Feld ändern');details.type='button';
    const clear=element('button','ad188-clear','Auswahl leeren');clear.type='button';
    const stageModes=element('div','ad207-duo-stage-modes');
    const fusionMode=element('button','ad207-mode-fusion','✧ Fusionieren');fusionMode.type='button';
    const discardMode=element('button','ad207-mode-discard','↘ Wegwerfen');discardMode.type='button';
    const discardHelp=element('p','ad207-duo-discard-help','Rechtsklick: eine Handkarte zum Behalten auswählen.');
    const discardSlot=element('select','ad207-discard-zone');
    discardSlot.setAttribute('aria-label','Monsterzone nach dem Wegwerfen');
    for(const [i,c] of player.field.entries()){
      const option=element('option','', 'Zone '+(i+1)+(c?' · '+(catalog?.[c.id]?.name||'Monster')+' ersetzen':' · frei'),discardSlot);
      option.value=String(i);
    }
    const empty=player.field.findIndex(c=>!c);discardSlot.value=String(empty<0?0:empty);
    const discardCommit=element('button','ad207-discard-commit','Nur markierte Karte behalten und beschwören');
    discardCommit.type='button';
    stageModes.append(fusionMode,discardMode);
    actions.append(confirm,discardSlot,discardCommit,details,clear);
    helper.append(heading,message,notice,stageModes,selectionBox,discardHelp,actions);

    const attackGuide=document.getElementById('ad187-attack-guide');
    let attackGuideWasVisible=false;
    const cellEntries=new Map();
    for(const [key,option] of optionByKey){
      const cell=materialCell(panel,key);if(!cell)continue;
      const original={role:cell.getAttribute('role'),label:cell.getAttribute('aria-label'),
        tabindex:cell.getAttribute('tabindex')};
      cellEntries.set(key,{cell,option,original});
      const activate=event=>{
        if(event.target?.closest?.('.ad204-card-info'))return;
        if(!fusionPanel.open)return;
        if(event.type==='keydown'&&event.key!=='Enter'&&event.key!==' ')return;
        event.preventDefault();event.stopImmediatePropagation();
        toggle(key);
      };
      // Capture is intentional: a field monster may also be a valid attacker
      // in v18.7. Only the currently expanded Fusion panel gets priority.
      cell.addEventListener('click',activate,true);
      cell.addEventListener('keydown',activate,true);
    }
    function restoreAttribute(cell,name,value){
      if(value===null)cell.removeAttribute(name);else cell.setAttribute(name,value);
    }
    function paint(){
      const keys=selectedKeys(select),count=keys.length,active=fusionPanel.open;
      selectionBox.replaceChildren();
      for(const [index,key] of keys.entries()){
        const option=optionByKey.get(key);if(!option)continue;
        const chip=element('button','ad188-chip'+(stageMode==='discard'&&keepKey===key?' ad207-keep':''),(index+1)+' · '+option.textContent+' ×');
        chip.type='button';chip.setAttribute('aria-label','Material entfernen: '+option.textContent);
        chip.title=stageMode==='discard'?'Rechtsklick: Diese Handkarte behalten':'Rechtsklick: Karte ans Ende der Fusionsreihenfolge';
        chip.addEventListener('click',()=>toggle(key));
        chip.addEventListener('contextmenu',event=>{
          event.preventDefault();event.stopPropagation();
          if(stageMode==='discard'){
            if(!key.startsWith('hand:')){notice.textContent='Im Wegwerfen-Modus sind nur Handkarten zulässig.';return;}
            keepKey=key;paint();return;
          }
          const selected=optionByKey.get(key);if(selected){select.append(selected);select.dispatchEvent(new Event('change',{bubbles:true}));}
        });
        selectionBox.append(chip);
      }
      if(!keys.length)selectionBox.append(element('span','ad188-empty','Noch keine Materialien gewählt.'));
      for(const [key,{cell,option,original}] of cellEntries){
        cell.classList.toggle('ad188-material-selected',!!option.selected);
        cell.classList.toggle('ad188-material-eligible',active);
        if(active){
          cell.setAttribute('role','button');cell.tabIndex=0;
          cell.setAttribute('aria-label',(option.selected?'Fusionsmaterial entfernen: ':'Für Fusion wählen: ')+option.textContent);
        }else{
          restoreAttribute(cell,'role',original.role);
          restoreAttribute(cell,'aria-label',original.label);
          restoreAttribute(cell,'tabindex',original.tabindex);
        }
      }
      sparkBox.querySelectorAll('button').forEach(button=>button.remove());
      for(const key of sparks){
        const opt=optionByKey.get(key),button=element('button','ad188-spark'+(opt.selected?' selected':''),
          '✧ Funke '+(Number(key.split(':')[1])+1));
        button.type='button';button.setAttribute('aria-pressed',String(!!opt.selected));
        button.addEventListener('click',()=>toggle(key));sparkBox.append(button);
      }
      helper.hidden=!active;
      heading.textContent='✧ Beschwörungszone · '+count+'/5 Karten';
      const ready=count>=2&&!commit.disabled;
      const templateText=template?.selectedOptions?.[0]?.textContent||'–';
      const slotText=resultSlot?.selectedOptions?.[0]?.textContent||'–';
      message.textContent=count<2?'Wähle noch '+(2-count)+' Material'+(2-count===1?'':'ien')+
        ' aus der Hand oder deinem Spielfeld.':ready?
        (hint?.textContent||'Fusion möglich')+' · '+templateText+' → '+slotText:
        (hint?.textContent||'Diese Kombination ist noch nicht möglich.');
      confirm.disabled=!ready||stageMode==='discard';
      const handOnly=keys.length>=2&&keys.length<=5&&keys.every(x=>x.startsWith('hand:'));
      if(keepKey&&!keys.includes(keepKey))keepKey=null;
      if(stageMode==='discard'&&!keepKey&&handOnly)keepKey=keys[0];
      discardHelp.hidden=stageMode!=='discard';
      discardSlot.hidden=stageMode!=='discard';
      discardCommit.hidden=stageMode!=='discard';
      discardCommit.disabled=!handOnly||!keepKey||!Number.isInteger(Number(discardSlot.value))||
       typeof send!=='function'||busy||!!syncError;
      fusionMode.classList.toggle('selected',stageMode==='fusion');
      discardMode.classList.toggle('selected',stageMode==='discard');
      if(stageMode==='discard')message.textContent=handOnly?
       'Rechtsklick bestimmt die zu behaltende Karte. Die übrigen '+(keys.length-1)+
       ' Handkarten gehen erst bei Bestätigung auf den Friedhof.':
       'Wegwerfen benötigt 2–5 ausgewählte Handkarten; Feld- und Geisterkarten sind nicht erlaubt.';
      clear.disabled=!count;
      if(active&&attackGuide&&!attackGuide.hidden){
        attackGuide.hidden=true;attackGuideWasVisible=true;
      }else if(!active&&attackGuideWasVisible&&attackGuide){
        attackGuide.hidden=false;attackGuideWasVisible=false;
      }
    }
    function setKeys(keys){
      const selected=new Set(keys);
      for(const option of optionByKey.values())option.selected=selected.has(option.value);
      select.dispatchEvent(new Event('change',{bubbles:true}));
    }
    function toggle(key){
      if(!optionByKey.has(key))return;
      const change=toggleMaterial(selectedKeys(select),key);
      notice.textContent=change.error==='limit'?
        'Höchstens fünf Materialien. Entferne zuerst eines.':'';
      if(!change.error)setKeys(change.keys);
    }
    select.addEventListener('change',()=>{remember(scope,select,player);paint();});
    fusionPanel.addEventListener('toggle',paint);
    fusionMode.addEventListener('click',()=>{stageMode='fusion';paint();});
    discardMode.addEventListener('click',()=>{stageMode='discard';paint();});
    discardCommit.addEventListener('click',()=>{
      const keys=selectedKeys(select);
      if(stageMode!=='discard'||discardCommit.disabled||!keys.every(k=>k.startsWith('hand:'))||
         !keepKey||!keys.includes(keepKey)||typeof send!=='function')return;
      const slot=Number(discardSlot.value),handIndex=Number(keepKey.split(':')[1]);
      const occupied=!!player.field[slot];
      if(occupied&&!window.confirm('Monster in Zone '+(slot+1)+' wirklich ersetzen?'))return;
      send({type:occupied?'replace':'summon',slot,handIndex,
       discardIndices:keys.filter(key=>key!==keepKey).map(key=>Number(key.split(':')[1]))});
    });
    confirm.addEventListener('click',()=>{if(stageMode==='fusion'&&!confirm.disabled&&!commit.disabled)commit.click();});
    details.addEventListener('click',()=>{
      fusionPanel.open=true;
      native?.scrollIntoView?.({behavior:'smooth',block:'nearest'});
    });
    clear.textContent='✕ Alles abwählen';
    clear.addEventListener('click',()=>{notice.textContent='';keepKey=null;stageMode='fusion';setKeys([]);});
    if(!previous)remember(scope,select,player);
    paint();
  }
  window.ArcaneDuoFusion188=Object.freeze({version:'18.8.0',selectedKeys,toggleMaterial,materialIdentity,enhance});
})();
