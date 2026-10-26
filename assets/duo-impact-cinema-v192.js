/* Arcane Duel v19.2 – actual confirmed combat losses, armor and counterstrikes.
 * Presentation only: neither combat decisions nor hidden hands are touched.
 */
'use strict';
(()=>{
  const MAX_EVENTS=6,DISPLAY_MS=1500;
  let layer=null,timers=[],generation=0;
  const n=value=>Math.max(0,Number(value)||0);
  const reduced=()=>!!(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||
    document.body?.classList.contains('ad-motion-disabled'));
  const zone=(p,area)=>area==='ghost'?(p.lv1?.ghostSlots||[]):(p.field||[]);
  function newLines(before,after){
    const old=before.log||[],now=after.log||[];
    if(now.length>=old.length&&old.every((line,i)=>line===now[i]))return now.slice(old.length);
    for(let count=Math.min(old.length,now.length);count>0;count--){
      if(old.slice(-count).every((line,i)=>line===now[i]))return now.slice(count);
    }
    return [];
  }
  function defensiveLoss(old,cur){
    if(!old)return 0;
    if(cur&&cur.uid!==old.uid)return 0;
    return ['def','condensed','soul','lv1Shield'].reduce((total,key)=>
      total+Math.max(0,n(old[key])-n(cur?.[key])),0);
  }
  function targetOf(before,after,owner,loss){
    if(!owner)return null;
    const was=(before.players||[]).find(p=>p.seat===owner.seat);
    if(!was)return null;
    const candidates=[];
    for(const area of ['field','ghost']){
      zone(was,area).forEach((old,slot)=>{
        if(!old||old.uid==null)return;
        const now=zone(owner,area)[slot],actual=defensiveLoss(old,now);
        if(loss>0&&actual===0)return;
        if(loss===0&&n(old.guardLeft)===0)return;
        candidates.push({where:{seat:owner.seat,slot,area},card:old,
          actual,rank:loss>0?Math.abs(actual-loss):0});
      });
    }
    candidates.sort((a,b)=>a.rank-b.rank);
    // With several equally plausible targets, use the owner's seat instead
    // of assigning a hit to an arbitrary monster.
    return candidates.length&&(candidates.length===1||candidates[0].rank<candidates[1].rank)?
      candidates[0]:null;
  }
  function attackLine(lines,players){
    for(let i=lines.length-1;i>=0;i--){
      const line=String(lines[i]),attacker=(players||[])
        .filter(p=>line.startsWith(p.name+' greift '))
        .sort((a,b)=>b.name.length-a.name.length)[0];
      if(attacker){
        const rest=line.slice(attacker.name.length+' greift '.length);
        const def=/^(.+?) in DEF an: (\d+) Trefferstärke, [−-](\d+) Verdichtung \/ [−-](\d+) Seele \/ [−-](\d+) Grund-DEF(?: \/ [−-](\d+) Schutzorb)? \((\d+) % Rüstung\)/.exec(rest);
        if(def)return {kind:'def',lineIndex:i,attacker,defenderName:def[1],raw:+def[2],
          condensed:+def[3],soul:+def[4],def:+def[5],orb:+(def[6]||0),
          armor:+def[7],immune:/Letztes Bollwerk immun/.test(rest)};
        const atk=/^(.+?) in ATK an \(Differenz (-?\d+)\)/.exec(rest);
        if(atk)return {kind:'atk',lineIndex:i,attacker,defenderName:atk[1],difference:+atk[2]};
      }
    }
    // Direct attacks contain no 'greift' log line; the scoreboard records
    // their actual LP loss and the exact shield absorption separately.
    for(let i=lines.length-1;i>=0;i--){
      const line=String(lines[i]),actor=(players||[])
        .find(p=>line.startsWith(p.name+' · direkter Angriff:'));
      if(actor)return {kind:'direct',lineIndex:i,attacker:actor};
    }
    return null;
  }
  function counterLine(lines){
    let amount=0,blocked=0,name='';
    for(const line of lines){
      const hit=/^(.+?) · Gegenschlag: (\d+) LP Schaden\./.exec(String(line));
      const ward=/^(.+?) · Gegenschlag: (\d+) Schaden durch Vorhut-Schutz abgefangen\./.exec(String(line));
      if(hit){amount+=+hit[2];name=hit[1];}
      if(ward){blocked+=+ward[2];name=ward[1];}
    }
    return amount||blocked?{name,amount,blocked}:null;
  }
  function analyze(before,after,catalog={}){
    if(!before||!after||before.roomId!==after.roomId||before.chapter!==after.chapter||
       !Number.isSafeInteger(before.revision)||!Number.isSafeInteger(after.revision)||
       after.revision<=before.revision)return [];
    const lines=newLines(before,after),attack=attackLine(lines,before.players);
    if(!attack)return [];
    const priorAttacks=lines.slice(0,attack.lineIndex),lastSummary=priorAttacks
      .findLastIndex(line=>/ greift .* in (?:ATK|DEF) an/.test(line));
    const currentAttackLines=lines.slice(lastSummary+1,attack.lineIndex);
    const events=[],counter=attack.kind==='def'?counterLine(currentAttackLines):null;
    const defender=attack.defenderName?(before.players||[])
      .find(p=>p.name===attack.defenderName&&p.team!==attack.attacker.team):null;
    const currentDefender=defender&&(after.players||[]).find(p=>p.seat===defender.seat);
    let victim=null;
    if(attack.kind==='def'&&currentDefender){
      const taken=attack.condensed+attack.soul+attack.def+attack.orb;
      victim=targetOf(before,after,currentDefender,taken);
      const where=victim?.where||{seat:defender.seat,area:'seat'};
      const label=attack.immune?'LETZTES BOLLWERK':
        taken===0?'ABGEWEHRT':attack.orb||attack.soul||attack.condensed?'Schutz und DEF':'DEF';
      const heavy=taken>0&&taken>=Math.max(250,n(victim?.card?.def)*.38);
      events.push({kind:attack.immune||taken===0?'block':'hit',where,
        amount:taken,armor:attack.armor,orb:attack.orb,label,heavy,delay:360});
    }
    // Vorhut-Schutz is shared per team. Display the server-confirmed shield
    // loss, not the uncapped incoming attack value.
    for(let team=0;team<2;team++){
      const shieldLost=n(before.teams?.[team]?.shield)-n(after.teams?.[team]?.shield);
      if(shieldLost>0)events.push({kind:'ward',team,amount:shieldLost,delay:450});
    }
    let counterTeam=null,counterDamage=0;
    if(counter&&defender){
      const source=victim?.card&&String(catalog[victim.card.id]?.name||'')===counter.name?
        victim.where:null;
      // A counterstrike always returns damage to the attacking team, even
      // when the defender itself is destroyed in the same action.
      counterTeam=attack.attacker.team;
      counterDamage=counter.amount;
      events.push({kind:'counter',team:counterTeam,from:source,
        amount:counter.amount,blocked:counter.blocked,delay:690});
    }
    for(let team=0;team<2;team++){
      const lost=n(before.teams?.[team]?.lp)-n(after.teams?.[team]?.lp);
      // The counter shows its own real LP hit; the remainder, if any, is
      // separately confirmed damage from another concurrent battle effect.
      const other=Math.max(0,lost-(team===counterTeam?counterDamage:0));
      if(other>0)events.push({kind:'lp',team,amount:other,
        heavy:other>=Math.max(600,n(after.teams?.[team]?.maxLp)*.1),delay:520});
    }
    return events.sort((a,b)=>a.delay-b.delay).slice(0,MAX_EVENTS);
  }
  function clear(){
    generation++;
    timers.forEach(clearTimeout);timers=[];
    layer?.remove();layer=null;
  }
  function make(tag,cls,content,parent){
    const el=document.createElement(tag);if(cls)el.className=cls;
    if(content!==undefined)el.textContent=content;
    parent?.append(el);return el;
  }
  function nodeFor(where){
    if(!where)return null;
    const panel='#duoSeats .seat[data-seat="'+where.seat+'"]';
    if(where.area==='seat')return document.querySelector(panel);
    return document.querySelector(where.area==='ghost'?
      panel+' .duo-ghost-reserve .duo-ghost-cell[data-slot="'+where.slot+'"]':
      panel+' > .field > .field-cell[data-slot="'+where.slot+'"]');
  }
  function teamNode(team){return document.getElementById(team===0?'duoAlliedLP':'duoEnemyLP');}
  function center(node){
    const rect=node?.getBoundingClientRect();
    if(!rect||!Number.isFinite(rect.left)||!Number.isFinite(rect.top)||
       rect.width<2||rect.height<2)return null;
    if(rect.right<0||rect.left>window.innerWidth||rect.bottom<0||
       rect.top>window.innerHeight)return null;
    return {x:rect.left+rect.width/2,y:rect.top+rect.height/2};
  }
  function bubble(point,kind,big,sub,heavy=false){
    if(!point||!layer)return;
    const node=make('div','ad192-float ad192-'+kind+(heavy?' ad192-heavy':''),undefined,layer);
    node.style.left=Math.max(55,Math.min(window.innerWidth-55,point.x))+'px';
    node.style.top=Math.max(40,Math.min(window.innerHeight-55,point.y))+'px';
    make('strong','ad192-amount',big,node);
    if(sub)make('small','ad192-caption',sub,node);
    if(heavy){
      for(let i=0;i<10;i++){
        const spark=make('i','ad192-spark',undefined,node);
        spark.style.setProperty('--ad192-angle',(i*36)+'deg');
      }
    }
  }
  function counterTravel(event,stamp){
    const to=center(teamNode(event.team)),from=center(nodeFor(event.from));
    const complete=()=>{
      if(generation!==stamp)return;
      if(event.amount>0)bubble(to,'counter','−'+event.amount+' LP','⚔ GEGENSCHLAG',
        event.amount>=600);
      else bubble(to,'ward','🛡 ABGEFANGEN','Gegenschlag geblockt');
    };
    if(!to||!from){complete();return;}
    const streak=make('div','ad192-counter-streak','✦',layer);
    streak.style.left=from.x+'px';streak.style.top=from.y+'px';
    streak.style.setProperty('--ad192-dx',(to.x-from.x)+'px');
    streak.style.setProperty('--ad192-dy',(to.y-from.y)+'px');
    timers.push(setTimeout(complete,310));
  }
  function play(event,stamp){
    if(generation!==stamp||document.hidden||document.visibilityState==='hidden'||reduced())return;
    if(!layer){layer=make('div','ad192-impact-stage',undefined,document.body);
      layer.setAttribute('aria-hidden','true');}
    if(event.kind==='counter'){counterTravel(event,stamp);return;}
    if(event.kind==='hit'||event.kind==='block'){
      const pos=center(nodeFor(event.where));
      if(event.kind==='block')bubble(pos,'ward','🛡 BLOCKIERT',event.label);
      else bubble(pos,'hit','−'+event.amount,
        (event.armor?'Rüstung '+event.armor+' % · ':'')+event.label+
        (event.orb?' · Schutzorb −'+event.orb:''),event.heavy);
      return;
    }
    const pos=center(teamNode(event.team));
    if(event.kind==='ward')bubble(pos,'ward','−'+event.amount+' Schild','🛡 Vorhut-Schutz');
    else if(event.kind==='lp')bubble(pos,'hit','−'+event.amount+' LP',
      event.team===0?'Euer Team':'Gegner',event.heavy);
  }
  function onState(before,after,catalog={}){
    const events=analyze(before,after,catalog);
    if(!events.length){
      if(before&&after&&(before.roomId!==after.roomId||before.chapter!==after.chapter||
         after.revision>before.revision))clear();
      return [];
    }
    clear();const stamp=generation;
    for(const event of events){
      timers.push(setTimeout(()=>play(event,stamp),event.delay));
    }
    timers.push(setTimeout(()=>{if(stamp===generation)clear();},
      Math.max(...events.map(e=>e.delay))+DISPLAY_MS));
    return events;
  }
  window.ArcaneDuoImpactCinema192=Object.freeze({version:'19.2.0',newLines,defensiveLoss,
    analyze,onState,clear});
})();
