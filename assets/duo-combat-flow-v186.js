/* Arcane Duel v18.6 – accessible, compact 2v2 action dock.
 * This layer only moves existing DOM controls. It never changes a game action,
 * server payload, selection, card rule or stored progression.
 */
'use strict';
(()=>{
  const SECTIONS=Object.freeze([
    {key:'summon',icon:'✦',title:'Beschwören',help:'Hole ein Monster aus deiner Hand auf das Feld.'},
    {key:'fusion',icon:'✧',title:'Fusionieren',help:'Wähle deine Materialien und erschaffe ein neues Monster.'},
    {key:'attack',icon:'⚔',title:'Angreifen',help:'Wähle den Angreifer und sein Ziel.'},
    {key:'skills',icon:'◆',title:'Fähigkeiten',help:'Nutze besondere Kräfte oder ändere die Stellung.'}
  ]);
  const remembered=new Map();
  const titleOf=group=>group.querySelector('h3')?.textContent?.trim()||'';
  function classify(title){
    const label=String(title||'').toLocaleLowerCase('de');
    if(label.includes('monster beschwören'))return 'summon';
    if(label.includes('fusion')&&!label.includes('forschung'))return 'fusion';
    if(label.includes('angriff')&&label.includes('⚔'))return 'attack';
    return 'skills';
  }
  function plan(titles,previous){
    const groups=SECTIONS.map(section=>({key:section.key,
      titles:titles.filter(title=>classify(title)===section.key)})).filter(group=>group.titles.length);
    const available=groups.map(group=>group.key);
    const recommended=available.includes('summon')?'summon':available.includes('attack')?'attack':
      available.includes('fusion')?'fusion':available[0]||null;
    const selected=previous===undefined?recommended:previous===null?null:
      available.includes(previous)?previous:recommended;
    return {groups,recommended,selected};
  }

  function node(tag,cls,text){
    const element=document.createElement(tag);
    if(cls)element.className=cls;
    if(text!==undefined)element.textContent=text;
    return element;
  }
  function enhance({dock,roomId,seat,game}={}){
    if(!dock||!game||game.status!=='active'||game.activeSeat!==seat||
       dock.querySelector('.ad186-action-toolbar'))return;
    const originals=[...dock.querySelectorAll(':scope > .duo-action-group')];
    const footer=dock.querySelector(':scope > .duo-actions-footer');
    if(!originals.length&&!footer)return;
    const groupNames=originals.map(titleOf);
    // Keep the selected category within a turn, then start the next own turn
    // with a helpful default again.
    const ownTurn=game.players?.[seat]?.ownTurns??game.round??0;
    const scope=(roomId||game.roomId||'duo')+':'+seat+':'+ownTurn;
    const current=plan(groupNames,remembered.get(scope));
    const byKey=new Map(SECTIONS.map(section=>[section.key,[]]));
    originals.forEach(group=>byKey.get(classify(titleOf(group))).push(group));

    const toolbar=node('section','ad186-action-toolbar');
    toolbar.setAttribute('aria-label','Deine Aktionen in diesem Zug');
    const heading=node('div','ad186-toolbar-heading');
    const headingText=node('div');
    headingText.append(node('span','ad186-kicker','✧ DEIN ZUG'),
      node('h3','ad186-heading','Was möchtest du tun?'));
    heading.append(headingText);
    const collapse=node('button','ad186-collapse-all','Alle schließen');
    collapse.type='button';collapse.hidden=current.groups.length<2;
    heading.append(collapse);toolbar.append(heading);
    const subtitle=node('p','ad186-toolbar-note',originals.length?
      'Wähle einen Bereich. Deine Eingaben bleiben beim Wechsel zwischen den Bereichen erhalten.':
      'Du hast gerade keine weitere Aktion. Du kannst deinen Zug beenden.');
    toolbar.append(subtitle);
    const nav=node('nav','ad186-shortcuts');
    nav.setAttribute('aria-label','Aktionen auswählen');
    nav.hidden=!originals.length;
    toolbar.append(nav);
    const footerSlot=node('div','ad186-toolbar-footer');
    if(footer){
      footer.classList.add('ad186-finish');
      footerSlot.append(footer);toolbar.append(footerSlot);
    }
    const note=dock.querySelector(':scope > .duo-turn-note');
    if(note)note.hidden=true; // The permanent v18.5 turn banner already explains whose turn it is.

    const cards=new Map(),shortcuts=new Map();
    for(const section of SECTIONS){
      const existing=byKey.get(section.key);
      if(!existing.length)continue;
      const details=node('details','ad186-action-card ad186-kind-'+section.key);
      details.dataset.kind=section.key;
      details.id='ad186-'+section.key;
      details.open=current.selected===section.key;
      const summary=node('summary','ad186-action-summary');
      summary.append(node('span','ad186-summary-symbol',section.icon));
      const description=node('span','ad186-summary-text');
      description.append(node('strong',undefined,section.title),
        node('small',undefined,section.help));
      summary.append(description);
      if(section.key==='skills'&&existing.length>1)
        summary.append(node('span','ad186-counter',String(existing.length)));
      summary.append(node('span','ad186-open-marker','⌄'));
      details.append(summary);
      const body=node('div','ad186-action-body'+(section.key==='skills'?' ad186-skills-grid':''));
      // Moving nodes preserves the live event handlers, option values and
      // dynamically updated fusion previews attached by the game renderer.
      existing.forEach(group=>{group.classList.add('ad186-existing-group');body.append(group);});
      details.append(body);cards.set(section.key,details);

      const shortcut=node('button','ad186-shortcut',section.icon+' '+section.title);
      shortcut.type='button';shortcut.setAttribute('aria-controls',details.id);
      nav.append(shortcut);shortcuts.set(section.key,shortcut);
    }

    const sync=()=>{
      for(const [key,card] of cards){
        const open=card.open;
        shortcuts.get(key).setAttribute('aria-expanded',String(open));
        card.classList.toggle('ad186-open',open);
      }
      collapse.disabled=![...cards.values()].some(card=>card.open);
    };
    const setOpen=(key,scroll=false)=>{
      for(const [other,card] of cards)card.open=other===key;
      remembered.set(scope,key);
      sync();
      if(scroll&&key){
        const target=cards.get(key);
        target?.scrollIntoView?.({block:'nearest',behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth'});
      }
    };
    for(const [key,card] of cards){
      const shortcut=shortcuts.get(key);
      shortcut.addEventListener('click',()=>setOpen(key,true));
      card.addEventListener('toggle',()=>{
        if(card.open){
          for(const [other,element] of cards)if(other!==key)element.open=false;
          remembered.set(scope,key);
        }else if(remembered.get(scope)===key){
          remembered.set(scope,null);
        }
        sync();
      });
    }
    collapse.addEventListener('click',()=>setOpen(null));
    dock.classList.add('ad186-enhanced');
    dock.prepend(toolbar);
    for(const section of SECTIONS){const card=cards.get(section.key);if(card)dock.append(card);}
    // Avoid remembering arbitrarily many former rooms.
    if(remembered.size>15)remembered.delete(remembered.keys().next().value);
    sync();
  }
  window.ArcaneDuoCombatFlow186=Object.freeze({version:'18.6.0',classify,plan,enhance});
})();
