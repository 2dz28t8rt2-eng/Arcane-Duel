/* Arcane Duel v18.5 – 2v2 team clarity and confirmed, read-only visual feedback.
 * Two humans (seats 0/2) face two computer opponents (seats 1/3).
 * No actions, progression, hidden cards or game state are changed here.
 */
'use strict';
(()=>{
  const numeric=value=>Math.max(0,Number(value)||0);
  const context=new Map();
  let transientTimer=0,turnTimer=0,sequence=0;

  function seatKind(player,viewerSeat){
    if(!player)return 'enemy';
    return player.seat===viewerSeat?'self':player.team===0?'ally':'enemy';
  }
  function turnInfo(game,viewerSeat){
    if(!game)return {kind:'idle',eyebrow:'BÜNDNIS DER VIER',title:'Bereit für euer Abenteuer?',hint:'Erstellt einen Raum und ladet euren Partner ein.'};
    if(game.status==='waiting')return {kind:'waiting',eyebrow:'PARTNER GESUCHT',title:'Gleich geht es los.',hint:'Sobald dein Freund beitritt, kannst du fortsetzen und ein Duell anfragen.'};
    if(game.status==='finished')return game.winner===0?
      {kind:'victory',eyebrow:'GEMEINSAM GESCHAFFT',title:'Euer Team hat gewonnen!',hint:'Das war euer Sieg – jeder Zug hat dazu beigetragen.'}:
      {kind:'defeat',eyebrow:'GEMEINSAM WEITER',title:'Dieses Duell ist verloren.',hint:'Ihr könnt euer Deck verbessern und es noch einmal versuchen.'};
    const active=game.players?.[game.activeSeat];
    const kind=seatKind(active,viewerSeat),name=active?.name||'Duellant';
    if(kind==='self')return {kind,eyebrow:'DU BIST AM ZUG',title:'Jetzt liegt es an dir!',hint:'Wähle unten deine nächste Aktion. Dein Partner kämpft an deiner Seite.',name};
    if(kind==='ally')return {kind,eyebrow:'DEIN PARTNER IST DRAN',title:name+' ist am Zug.',hint:'Schau zu, wie dein Partner euer gemeinsames Feld stärkt.',name};
    return {kind,eyebrow:'DIE GEGNER SIND DRAN',title:name+' ist am Zug.',hint:'Behalte das gegnerische Feld im Blick.',name};
  }

  function changedLines(before,after){
    if(!before||!after||before.roomId!==after.roomId||
       numeric(after.revision)<=numeric(before.revision)||before.chapter!==after.chapter)return [];
    const old=before.log||[],now=after.log||[];
    if(now.length>=old.length&&old.every((v,i)=>v===now[i]))return now.slice(old.length);
    // A long battle may trim older log entries; only count a proven overlap.
    let overlap=0;
    for(let n=Math.min(old.length,now.length);n>0;n--){
      if(old.slice(-n).every((line,i)=>line===now[i])){overlap=n;break;}
    }
    return overlap?now.slice(overlap):[];
  }

  function changes(before,after,viewerSeat){
    if(!before||!after||before.roomId!==after.roomId||
       numeric(after.revision)<=numeric(before.revision)||before.chapter!==after.chapter)return [];
    const events=[],lpBefore=before.teams||[],lpAfter=after.teams||[],lines=changedLines(before,after);
    const partner=after.players?.find(p=>p.team===0&&p.seat!==viewerSeat);
    const partnerName=partner?.name||'';

    const shieldGain=numeric(lpAfter[0]?.shield)-numeric(lpBefore[0]?.shield);
    if(shieldGain>0)events.push({kind:'shield',team:0,text:'Euer Team erhält '+shieldGain+' Schild.',seat:undefined});
    for(const line of lines){
      const text=String(line||'');
      if(partnerName&&text.startsWith(partnerName+' ')){
        if(/\bfusioniert\b/i.test(text))events.push({kind:'fusion',team:0,seat:partner.seat,
          text:'✧ Dein Partner hat eine Fusion beschworen!'});
        else if(/\bgreift\b/i.test(text))events.push({kind:'attack',team:0,seat:partner.seat,
          text:'⚔ Dein Partner greift an!'});
        else if(/\bbeschwört\b/i.test(text))events.push({kind:'summon',team:0,seat:partner.seat,
          text:'✦ Dein Partner hat ein Monster beschworen.'});
      }
      if(text.startsWith('Wächter stärkt ')&&after.players?.[after.activeSeat]?.team===0){
        events.push({kind:'support',team:0,seat:after.activeSeat,
          text:'✧ Ein Wächter stärkt euer Team.'});
      }
    }
    for(let team=0;team<=1;team++){
      const lost=numeric(lpBefore[team]?.lp)-numeric(lpAfter[team]?.lp);
      if(lost<=0)continue;
      if(lost>=numeric(lpAfter[team]?.maxLp||16000)*.14){
        events.push({kind:'impact',team,text:team===0?'Euer Team steckt einen schweren Treffer ein!':
          'Ein schwerer Treffer gegen die Gegner!',amount:lost});
      }
    }
    if(after.status==='finished'&&before.status!=='finished')events.push({kind:after.winner===0?'victory':'defeat',team:after.winner,
      text:after.winner===0?'✦ Gemeinsam gewonnen!':'Das Duell ist entschieden.'});
    return events.slice(-5);
  }

  function snapshot(game,roomId){
    if(!game)return null;
    return {roomId:roomId||game.roomId,revision:game.revision,chapter:game.chapter,
      status:game.status,winner:game.winner,activeSeat:game.activeSeat,
      teams:(game.teams||[]).map(t=>({lp:t.lp,maxLp:t.maxLp,shield:t.shield})),
      players:(game.players||[]).map(p=>({seat:p.seat,team:p.team,name:p.name})),
      log:(game.log||[]).slice(-50)};
  }

  function motion(){return !document.hidden&&!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;}
  function setText(node,text){if(node)node.textContent=String(text);}
  function pulse(node,css,ms=1050){
    if(!node||!motion())return;
    node.classList.remove(css);void node.offsetWidth;node.classList.add(css);
    window.setTimeout(()=>node.classList.remove(css),ms);
  }
  function paintBar(team,g,prior){
    const source=g.teams?.[team];if(!source)return;
    const bar=document.getElementById(team===0?'ad185-allied-bar':'ad185-enemy-bar');
    const fill=document.getElementById(team===0?'ad185-allied-fill':'ad185-enemy-fill');
    const label=document.getElementById(team===0?'ad185-allied-ratio':'ad185-enemy-ratio');
    if(!bar||!fill||!label)return;
    const max=Math.max(1,numeric(source.maxLp)||16000),hp=Math.max(0,Math.min(max,numeric(source.lp)));
    const ratio=Math.min(100,Math.round(hp/max*100));
    fill.style.width=(hp/max*100).toFixed(2)+'%';
    bar.setAttribute('aria-valuemax',String(max));bar.setAttribute('aria-valuenow',String(hp));
    label.textContent=ratio+' %';
    if(prior&&numeric(prior.teams?.[team]?.lp)>hp)pulse(bar,'ad185-lp-hit');
  }
  function markSeats(game,viewerSeat){
    const arena=document.querySelector('.duo-battle'),track=arena?.querySelectorAll('#duoTrack .turn-seat')||[];
    for(const player of game.players||[]){
      const kind=seatKind(player,viewerSeat);
      const seat=document.querySelector('#duoSeats .seat[data-seat="'+player.seat+'"]');
      const tile=track[player.seat];
      const caption=kind==='self'?'DU':kind==='ally'?'DEIN PARTNER':
        player.seat===1?'GEGNER 1':'GEGNER 2';
      for(const element of [seat,tile]){
        if(!element)continue;
        element.classList.add('ad185-seat','ad185-'+kind);
        element.classList.toggle('ad185-taking-turn',game.status==='active'&&game.activeSeat===player.seat);
      }
      if(seat){
        seat.setAttribute('aria-label',caption+' – '+player.name+(game.activeSeat===player.seat&&game.status==='active'?', am Zug':''));
        const subtitle=seat.querySelector('.duo-seat-kind');
        if(subtitle)subtitle.textContent=kind==='self'?'DEINE MONSTER IM TEAMFELD':
          kind==='ally'?'VERBÜNDETER':'GEGNERISCHES FELD';
        const tag=document.createElement('span');tag.className='ad185-seat-badge';tag.textContent=caption;seat.prepend(tag);
      }
      if(tile){
        const badge=document.createElement('span');badge.className='ad185-track-number';
        badge.textContent=String(player.seat+1);
        badge.setAttribute('aria-hidden','true');tile.prepend(badge);
        const role=document.createElement('span');role.className='ad185-track-role';role.textContent=caption;
        tile.append(role);
      }
    }
  }
  function present(event){
    const node=document.getElementById('ad185-team-event');if(!node)return;
    sequence++;const current=sequence;
    node.className='ad185-team-event ad185-event-'+event.kind;
    node.textContent=event.text;node.hidden=false;
    if(event.seat!==undefined){
      const field=document.querySelector('#duoSeats .seat[data-seat="'+event.seat+'"]');
      pulse(field,'ad185-partner-action',1700);
    }
    if(transientTimer)window.clearTimeout(transientTimer);
    transientTimer=window.setTimeout(()=>{if(current===sequence){node.hidden=true;node.textContent='';}},3100);
  }
  function didRender({game,seat,roomId}={}){
    const area=document.getElementById('ad185-turn-banner');if(!area)return;
    const oldTitle=document.getElementById('duoTurnName');
    if(oldTitle)oldTitle.hidden=!!game;
    if(!game){area.hidden=true;document.getElementById('ad185-team-event')?.setAttribute('hidden','');return;}
    const state=snapshot(game,roomId),previous=context.get(state.roomId);
    const info=turnInfo(game,seat);
    area.hidden=false;area.className='ad185-turn-banner ad185-turn-'+info.kind;
    setText(document.getElementById('ad185-turn-eyebrow'),info.eyebrow);
    setText(document.getElementById('ad185-turn-title'),info.title);
    setText(document.getElementById('ad185-turn-hint'),info.hint);
    paintBar(0,game,previous);paintBar(1,game,previous);
    markSeats(game,seat);

    if(!previous||numeric(state.revision)<=numeric(previous.revision))return;
    const latest=changes(previous,state,seat);
    context.set(state.roomId,state);
    if(previous.activeSeat!==state.activeSeat&&game.status==='active'){
      pulse(area,'ad185-turn-arrival',1150);
      if(turnTimer)window.clearTimeout(turnTimer);
      const cue=document.getElementById('ad185-turn-cue');
      if(cue&&motion()){
        cue.textContent=info.eyebrow;cue.hidden=false;
        cue.className='ad185-turn-cue ad185-cue-'+info.kind;
        turnTimer=window.setTimeout(()=>{cue.hidden=true;cue.textContent='';},1250);
      }
    }
    if(latest.length){
      const priority={victory:9,defeat:9,shield:6,support:5,fusion:5,impact:4,attack:4,summon:2};
      present([...latest].sort((a,b)=>(priority[b.kind]||0)-(priority[a.kind]||0))[0]);
    }
    if(context.size>5)context.delete(context.keys().next().value);
  }

  // First encounter is a baseline; never replay old logs or fake earlier effects.
  const originalDidRender=didRender;
  function safeDidRender(args){
    const key=args?.roomId||args?.game?.roomId;
    if(key&&args.game&&!context.has(key))context.set(key,snapshot(args.game,key));
    return originalDidRender(args);
  }
  window.ArcaneDuoExperience185=Object.freeze({version:'18.5.0',seatKind,turnInfo,changedLines,changes,snapshot,didRender:safeDidRender});
})();
