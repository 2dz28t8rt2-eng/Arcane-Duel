/* Arcane Duel v19.1 – confirmed ATK/DEF position changes in 2v2.
 * Purely visual: uses only public field/ghost states and never sends actions.
 */
'use strict';
(()=>{
  const FLIP_MS=640,LINGER_MS=620,MAX_EVENTS=3,STAGGER_MS=1380;
  let active=null,activeTimers=[],queueTimers=[],sequence=0;
  const reduced=()=>!!(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||
    document.body?.classList.contains('ad-motion-disabled'));
  const isMode=mode=>mode==='atk'||mode==='def';
  const finiteRect=r=>!!r&&[r.left,r.top,r.width,r.height].every(Number.isFinite)&&
    r.width>=26&&r.height>=26;
  function zone(p,area){return area==='ghost'?(p.lv1?.ghostSlots||[]):(p.field||[]);}
  function changes(previous,current,catalog={}){
    if(!previous||!current||previous.roomId!==current.roomId||
       previous.chapter!==current.chapter||
       !Number.isSafeInteger(previous.revision)||
       !Number.isSafeInteger(current.revision)||
       current.revision<=previous.revision)return [];
    const events=[];
    for(const after of current.players||[]){
      const before=(previous.players||[]).find(p=>p.seat===after.seat);
      if(!before)continue;
      for(const area of ['field','ghost']){
        const earlier=zone(before,area);
        zone(after,area).forEach((now,slot)=>{
          const old=earlier[slot];
          // A newly summoned Soul Eater in DEF receives the same brief
          // arrival feedback as the solo mode. No combat values are changed.
          if(area==='field'&&now?.role==='soul'&&now.mode==='def'&&
             (!old||old.uid!==now.uid)){
           events.push({seat:after.seat,slot,area,cardId:now.id,uid:now.uid,
             from:'atk',to:'def',soul:true,arrival:true,
             name:String(catalog[now.id]?.name||'Seelenzehrer').slice(0,80)});
           return;
          }
          if(!old||!now||old.id!==now.id||old.uid==null||now.uid!==old.uid||
             !isMode(old.mode)||!isMode(now.mode)||old.mode===now.mode||
             now.switched!==true)return;
          events.push({seat:after.seat,slot,area,cardId:now.id,uid:now.uid,
            from:old.mode,to:now.mode,soul:now.role==='soul',
            name:String(catalog[now.id]?.name||'Monster').slice(0,80)});
        });
      }
    }
    return events.slice(0,MAX_EVENTS);
  }
  function clearActive(){
    activeTimers.forEach(clearTimeout);activeTimers=[];
    if(!active)return;
    active.cell?.classList.remove('ad191-position-transition','ad191-position-arrived',
      'ad191-position-atk','ad191-position-def');
    active.overlay?.remove();active=null;
  }
  function clear(){
    sequence++;
    queueTimers.forEach(clearTimeout);queueTimers=[];
    clearActive();
  }
  function make(tag,cls,content,parent){
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(content!==undefined)el.textContent=content;
    parent?.append(el);
    return el;
  }
  function cellFor({seat,slot,area}){
    const panel='#duoSeats .seat[data-seat="'+seat+'"]';
    return document.querySelector(area==='ghost'?
      panel+' .duo-ghost-reserve .duo-ghost-cell[data-slot="'+slot+'"]':
      panel+' > .field > .field-cell[data-slot="'+slot+'"]');
  }
  function face(parent,mode,event,illustration,symbol){
    const css='ad191-flip-face ad191-face-'+mode;
    const node=make('div',css,undefined,parent);
    const icon=mode==='def'?'🛡':'⚔';
    const portrait=make('div','ad191-face-art',undefined,node);
    if(illustration){const img=make('img','',undefined,portrait);img.src=illustration;img.alt='';}
    else portrait.textContent=symbol||'✧';
    make('strong','ad191-face-name',event.name,node);
    make('span','ad191-face-mode',icon+' '+(mode==='def'?
      (event.soul?'SEELENFOKUS':'SCHILDSTELLUNG'):'ANGRIFF'),node);
  }
  function play(event){
    if(!event||reduced()||document.hidden||document.visibilityState==='hidden')return false;
    const cell=cellFor(event),rect=cell?.getBoundingClientRect();
    if(!finiteRect(rect))return false;
    if(rect.right<0||rect.left>window.innerWidth||rect.bottom<0||
       rect.top>window.innerHeight)return false;
    clearActive();
    const illustration=cell.querySelector('.duo-field-art')?.getAttribute('src')||'';
    const symbol=cell.querySelector('.art')?.textContent||'✧';
    const overlay=make('div','ad191-position-stage'+(event.soul?' ad191-soul-focus':''),undefined,document.body);
    overlay.setAttribute('aria-hidden','true');
    const card=make('div','ad191-position-card',undefined,overlay);
    card.style.left=rect.left+'px';card.style.top=rect.top+'px';
    card.style.width=rect.width+'px';card.style.height=rect.height+'px';
    const inner=make('div','ad191-flip-inner',undefined,card);
    face(inner,event.from,event,illustration,symbol);
    face(inner,event.to,event,illustration,symbol);
    cell.classList.add('ad191-position-transition');
    active={overlay,cell,event};
    const show=setTimeout(()=>{
      if(active?.overlay!==overlay)return;
      cell.classList.remove('ad191-position-transition');
      cell.classList.add('ad191-position-arrived','ad191-position-'+event.to);
      card.classList.add('ad191-position-landed');
      const centerX=rect.left+rect.width/2,centerY=rect.top+rect.height/2;
      const shine=make('div','ad191-position-shine ad191-shine-'+event.to,undefined,overlay);
      shine.style.left=centerX+'px';shine.style.top=centerY+'px';
      make('span','ad191-shine-ring',undefined,shine);
      make('span','ad191-shine-icon',event.to==='def'?'🛡':'⚔',shine);
      for(let i=0;i<8;i++){
        const spark=make('i','ad191-shine-spark',undefined,shine);
        spark.style.setProperty('--ad191-angle',(45*i)+'deg');
      }
    },FLIP_MS);
    activeTimers.push(show);
    activeTimers.push(setTimeout(()=>{
      if(active?.overlay===overlay)clearActive();
    },FLIP_MS+LINGER_MS));
    return true;
  }
  function onState(previous,current,catalog={}){
    const events=changes(previous,current,catalog);
    if(!events.length){
      // A newer server state invalidates any unfinished visual tied to a
      // previous render; unchanged polling revisions should leave it alone.
      if(previous&&current&&(previous.roomId!==current.roomId||
         previous.chapter!==current.chapter||current.revision>previous.revision))clear();
      return [];
    }
    clear();
    const stamp=sequence;
    // Deferred to the next task: the action handler renders again after load().
    // The animation must attach to the final, server-confirmed field cells.
    events.forEach((event,index)=>{
      queueTimers.push(setTimeout(()=>{
        if(stamp===sequence)play(event);
      },index*STAGGER_MS+(event.arrival?950:0)));
    });
    return events;
  }
  window.ArcaneDuoStanceCinema191=Object.freeze({version:'19.1.0',changes,onState,
    play,clear,timings:Object.freeze({flip:FLIP_MS,linger:LINGER_MS})});
})();
