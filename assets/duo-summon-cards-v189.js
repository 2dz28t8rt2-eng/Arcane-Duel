/* Arcane Duel v18.9 – direct 2v2 hand-to-field summoning.
 * Reads only the existing legal choices, selects the original controls and
 * delegates confirmation to the original server-authoritative button.
 */
'use strict';
(()=>{
  const key=value=>Number.isInteger(value)?String(value):'';
  const remembered=new Map();
  function selectionReady({hand,slot,hands=[],slots=[]}={}){
    return hands.some(x=>x.index===hand)&&slots.includes(slot);
  }
  function element(tag,cls,content){
    const n=document.createElement(tag);
    if(cls)n.className=cls;
    if(content!==undefined)n.textContent=content;
    return n;
  }
  function enhance({game,seat,legal,dock,catalog={},busy=false,syncError=''}={}){
    const helper=document.getElementById('ad189-summon-guide');
    if(!helper)return;
    helper.hidden=true;helper.replaceChildren();
    if(!game||game.status!=='active'||game.activeSeat!==seat||busy||syncError||!dock||
       !legal?.hand?.length)return;
    const panel=document.querySelector('#duoSeats .seat[data-seat="'+seat+'"]');
    const summonPanel=dock.querySelector('#ad186-summon');
    const handSelect=dock.querySelector('[data-ad189-hand]');
    const slotSelect=dock.querySelector('[data-ad189-slot]');
    const commit=dock.querySelector('[data-ad189-commit]');
    if(!panel||!summonPanel||!handSelect||!slotSelect||!commit)return;

    const handChoices=new Map(legal.hand.map(x=>[x.index,x]));
    const freeSlots=new Set((game.players?.[seat]?.field||[]).map((_,i)=>i));
    const handNodes=new Map(),slotNodes=new Map();
    const chosen={hand:null,slot:null};
    const scope=(game.roomId||'duo')+':'+(game.chapter||0)+':'+seat+':'+
      (game.players?.[seat]?.ownTurns??game.round??0);
    const originalCommitDisabled=commit.disabled;
    const battle=document.querySelector('.duo-battle');
    const attackGuide=document.getElementById('ad187-attack-guide');
    const fusionGuide=document.getElementById('ad188-fusion-guide');
    const attackPanel=dock.querySelector('#ad186-attack');
    const fusionPanel=dock.querySelector('#ad186-fusion');
    let hiddenAttackGuide=false,hiddenFusionGuide=false;
    const cardName=item=>{
      const entry=catalog[item?.id]||{};
      return entry.name||item?.name||'Handkarte';
    };

    const description=element('p','ad189-guide-description');
    description.setAttribute('role','status');description.setAttribute('aria-live','polite');
    const actions=element('div','ad189-guide-actions');
    const confirm=element('button','ad189-guide-confirm','✦ Beschwören / Ersetzen');
    confirm.type='button';confirm.disabled=true;
    const cancel=element('button','ad189-guide-cancel','Abbrechen');cancel.type='button';
    actions.append(confirm,cancel);helper.append(description,actions);

    function ready(){return selectionReady({hand:chosen.hand,slot:chosen.slot,
      hands:legal.hand,slots:[...freeSlots]});}
    function remember(){
      remembered.set(scope,{...chosen,id:chosen.hand===null?null:handChoices.get(chosen.hand)?.id});
      if(remembered.size>16)remembered.delete(remembered.keys().next().value);
    }
    function paint(){
      const active=summonPanel.open;
      battle?.classList.toggle('ad189-summon-mode',active);
      for(const [index,{cell,original}] of handNodes){
        cell.classList.toggle('ad189-eligible-hand',active);
        cell.classList.toggle('ad189-selected-hand',active&&chosen.hand===index);
        if(active){
          cell.tabIndex=0;cell.setAttribute('role','button');
          cell.setAttribute('aria-label',(chosen.hand===index?'Handkarte abwählen: ':'Beschwören: ')+
            cardName(handChoices.get(index)));
        }else{
          if(original.role===null)cell.removeAttribute('role');else cell.setAttribute('role',original.role);
          if(original.label===null)cell.removeAttribute('aria-label');else cell.setAttribute('aria-label',original.label);
          if(original.tabindex===null)cell.removeAttribute('tabindex');
          else cell.setAttribute('tabindex',original.tabindex);
        }
      }
      for(const [index,{cell,original}] of slotNodes){
        cell.classList.toggle('ad189-eligible-slot',active);
        cell.classList.toggle('ad189-selected-slot',active&&chosen.slot===index);
        if(active){
          cell.tabIndex=0;cell.setAttribute('role','button');
          cell.setAttribute('aria-label','Beschwörungsplatz '+(index+1)+' wählen');
        }else{
          if(original.role===null)cell.removeAttribute('role');else cell.setAttribute('role',original.role);
          if(original.label===null)cell.removeAttribute('aria-label');else cell.setAttribute('aria-label',original.label);
          if(original.tabindex===null)cell.removeAttribute('tabindex');
          else cell.setAttribute('tabindex',original.tabindex);
        }
      }
      helper.hidden=!active||(chosen.hand===null&&chosen.slot===null);
      const complete=ready();
      confirm.disabled=!complete||commit.disabled;
      description.textContent=complete?
        '✦ '+cardName(handChoices.get(chosen.hand))+' auf Feld '+(chosen.slot+1)+
          (game.players[seat].field[chosen.slot]?' ersetzen? Die alte Karte geht auf den Friedhof.':' beschwören?')+' Erst nach Bestätigung wird die Aktion ausgeführt.':
        chosen.hand!==null?'✦ '+cardName(handChoices.get(chosen.hand))+
          ' ist bereit. Wähle einen freien oder besetzten Platz auf deinem Feld.':
        chosen.slot!==null?'✦ Feld '+(chosen.slot+1)+
          ' ist gewählt. Wähle jetzt eine Handkarte.':'';
      if(active){
        if(attackGuide&&!attackGuide.hidden){hiddenAttackGuide=true;attackGuide.hidden=true;}
        if(fusionGuide&&!fusionGuide.hidden){hiddenFusionGuide=true;fusionGuide.hidden=true;}
      }else{
        if(attackPanel?.open&&hiddenAttackGuide&&attackGuide){
          attackGuide.hidden=false;hiddenAttackGuide=false;
        }
        if(fusionPanel?.open&&hiddenFusionGuide&&fusionGuide){
          fusionGuide.hidden=false;hiddenFusionGuide=false;
        }
      }
    }
    function updateControls(){
      if(chosen.hand===null&&chosen.slot===null){
        handSelect.selectedIndex=0;slotSelect.selectedIndex=0;
        commit.disabled=originalCommitDisabled;paint();return;
      }
      if(chosen.hand!==null)handSelect.value=key(chosen.hand);
      else if(chosen.slot!==null)handSelect.selectedIndex=-1;
      if(chosen.slot!==null)slotSelect.value=key(chosen.slot);
      else if(chosen.hand!==null)slotSelect.selectedIndex=-1;
      commit.disabled=originalCommitDisabled||!ready();
      paint();
    }
    function chooseHand(index,toggle=false){
      if(!handChoices.has(index))return;
      chosen.hand=toggle&&chosen.hand===index?null:index;
      remember();updateControls();
    }
    function chooseSlot(index,toggle=false){
      if(!freeSlots.has(index))return;
      chosen.slot=toggle&&chosen.slot===index?null:index;
      remember();updateControls();
    }
    function handle(cell,fn){
      const original={role:cell.getAttribute('role'),label:cell.getAttribute('aria-label'),
        tabindex:cell.getAttribute('tabindex')};
      cell.addEventListener('click',event=>{
        if(!summonPanel.open)return;
        // A hand card can also be a Fusion material. v18.8 handles it only
        // when the Fusion panel is expanded.
        event.preventDefault();fn();
      });
      cell.addEventListener('keydown',event=>{
        if(!summonPanel.open||event.key!=='Enter'&&event.key!==' ')return;
        event.preventDefault();event.stopImmediatePropagation();fn();
      });
      return original;
    }
    for(const item of legal.hand){
      const cell=panel.querySelector('.duo178-hand-card[data-index="'+item.index+'"]');
      if(!cell)continue;
      handNodes.set(item.index,{cell,original:handle(cell,()=>chooseHand(item.index,true))});
    }
    for(const index of freeSlots){
      const cell=panel.querySelector(':scope > .field > .field-cell[data-slot="'+index+'"]');
      if(!cell)continue;
      slotNodes.set(index,{cell,original:handle(cell,()=>chooseSlot(index,true))});
    }
    const syncNative=()=>{
      const hand=handSelect.value!==''?Number(handSelect.value):null;
      const slot=slotSelect.value!==''?Number(slotSelect.value):null;
      chosen.hand=handChoices.has(hand)?hand:null;
      chosen.slot=freeSlots.has(slot)?slot:null;
      remember();updateControls();
    };
    // A player who prefers dropdowns keeps their existing default choice.
    // Only direct card clicks ask explicitly for both halves of the action.
    handSelect.addEventListener('change',syncNative);
    slotSelect.addEventListener('change',syncNative);
    confirm.addEventListener('click',()=>{if(!confirm.disabled&&!commit.disabled)commit.click();});
    cancel.addEventListener('click',()=>{
      chosen.hand=null;chosen.slot=null;
      handSelect.selectedIndex=0;slotSelect.selectedIndex=0;
      commit.disabled=originalCommitDisabled;remember();paint();
      handSelect.focus?.();
    });
    // The accordion's events may be batched; a final scheduled paint keeps
    // keyboard roles correct after the Fusion panel restores its own labels.
    summonPanel.addEventListener('toggle',()=>{paint();setTimeout(paint,0);});
    fusionPanel?.addEventListener('toggle',()=>setTimeout(paint,0));
    attackPanel?.addEventListener('toggle',()=>setTimeout(paint,0));
    const previous=remembered.get(scope);
    if(previous){
      if(handChoices.get(previous.hand)?.id===previous.id)chosen.hand=previous.hand;
      if(freeSlots.has(previous.slot))chosen.slot=previous.slot;
    }
    if(chosen.hand!==null||chosen.slot!==null)updateControls();else paint();
  }
  window.ArcaneDuoSummon189=Object.freeze({version:'18.9.0',selectionReady,enhance});
})();
