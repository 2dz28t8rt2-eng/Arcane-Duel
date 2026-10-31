/* Arcane Duel v17.8 – visual 2v2 opening hand, LP refill, and real card flight.
 * The server state is never delayed or modified; other players' cards stay hidden.
 */
(function(root,factory){
 const api=factory(root);
 if(root)root.ArcaneDuoHand178=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null,function(root){
 'use strict';
 const ID=card=>typeof card==='number'?card:card?.id;
 const reduced=()=>!!root?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||
  root?.document?.body?.classList.contains('ad-motion-disabled');
 // Keep the longest preserved subsequence; only genuinely drawn new positions fly in.
 function drawIndices(before,after,drawn){
  if(!drawn||!after?.length)return [];
  const a=(before||[]).map(ID),b=after.map(ID),m=a.length,n=b.length;
  const dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=m-1;i>=0;i--)for(let j=n-1;j>=0;j--)
   dp[i][j]=a[i]===b[j]?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);
  const kept=new Set();let i=0,j=0;
  while(i<m&&j<n){
   if(a[i]===b[j]){kept.add(j);i++;j++;}
   else if(dp[i+1][j]>=dp[i][j+1])i++;else j++;
  }
  const unmatched=b.map((_,index)=>index).filter(index=>!kept.has(index));
  const needed=Math.min(Math.max(0,drawn),n);
  return (unmatched.length>=needed?unmatched.slice(-needed):
   [...new Set([...unmatched,...b.map((_,index)=>index).reverse()])].slice(0,needed))
   .sort((x,y)=>x-y);
 }
 let session=null;
 function meter(doc,parent){
  let track=parent.querySelector('.duo178-lp-meter');
  if(!track){
   track=doc.createElement('div');track.className='duo178-lp-meter';
   track.setAttribute('aria-hidden','true');
   const fill=doc.createElement('div');fill.className='duo178-lp-fill';track.append(fill);
   parent.append(track);
  }
  return track.firstElementChild;
 }
 function showSeatCounts(battle,g,empty){
  for(const player of g.players||[]){
   const target=battle.querySelector('.seat[data-seat="'+player.seat+'"] .duo-seat-count');
   if(target)target.textContent=(empty?0:player.hand.length)+' Handkarten · '+
    player.deck.length+' im Hauptdeck · '+player.remainingFusion.length+
    ' Fusionen verbleibend';
  }
 }
 function sync({game,seat,roomId,catalog}){
  if(!root?.document||!game||seat!==0&&seat!==2||!roomId)return;
  const doc=root.document,battle=doc.querySelector('.duo-battle'),
   panels=doc.querySelectorAll('.duo-battle .stats > div'),
   own=doc.querySelector('.duo-battle .seat[data-seat="'+seat+'"]'),
   p=game.players?.[seat];
  if(!battle||panels.length!==2||!own||!p)return;
  const key=roomId+'|'+game.chapter+'|'+(game.duelNo||1);
  if(!session||session.key!==key){
   session={key,seen:false,intro:false,lastHand:null,lastDeck:null,stamp:0,
    latestGame:game,progress:0};
  }
  const s=session;
  s.latestGame=game;
  if(s.intro)showSeatCounts(battle,game,true);
  const fills=[meter(doc,panels[0]),meter(doc,panels[1])];
  for(let team=0;team<2;team++){
   const row=game.teams[team],percent=Math.min(100,Math.max(0,100*row.lp/(row.maxLp||16000)));
   fills[team].style.width=percent*(s.intro?s.progress:1)+'%';
   if(s.intro){const label=doc.getElementById(team===0?'duoAlliedLP':'duoEnemyLP');
    if(label)label.textContent=Math.round(row.lp*s.progress).toLocaleString('de-AT')+' LP';}
  }
  let strip=own.querySelector('.duo178-hand');
  if(!strip){
   strip=doc.createElement('div');strip.className='duo178-hand';
   strip.setAttribute('aria-label','Deine Handkarten');
   const heading=doc.createElement('div');heading.className='duo178-hand-title';
   heading.textContent='✦ DEINE HAND';strip.append(heading);
   const cards=doc.createElement('div');cards.className='duo178-hand-cards';strip.append(cards);
   own.append(strip);
  }
  const list=strip.querySelector('.duo178-hand-cards');list.replaceChildren();
  strip.querySelector('.duo178-hand-title').textContent='✦ DEINE HAND ('+p.hand.length+' / 5)';
  for(const [index,item] of p.hand.entries()){
   const id=ID(item),template=catalog[id]||{};
   const node=doc.createElement('div');node.className='duo178-hand-card ad-hand-entry';
   node.dataset.index=String(index);node.title=template.name||'Handkarte';
   const art=doc.createElement('div');art.className='duo178-hand-art';
   if(typeof template.art==='string'&&template.art){
    const img=doc.createElement('img');img.src=template.art;img.alt='';img.loading='lazy';art.append(img);
   }else art.textContent='✧';
   node.append(art);
   const label=doc.createElement('strong');label.textContent=template.name||'Monster';node.append(label);
   const level=doc.createElement('small');level.textContent='LV '+(template.level||'?');node.append(level);
   list.append(node);
  }
  if(!p.hand.length){const empty=doc.createElement('p');empty.className='duo178-empty-hand';
   empty.textContent='Noch keine Handkarten';list.append(empty);}
  if(game.status==='active'&&!s.seen&&game.round===1){
   s.seen=true;s.intro=true;
   s.progress=0;
   showSeatCounts(battle,game,true);
   battle.classList.add('duo178-intro-active');
   strip.setAttribute('aria-hidden','true');
   const stamp=++s.stamp;
   fills.forEach(fill=>fill.style.width='0%');
   const lpLabels=[doc.getElementById('duoAlliedLP'),doc.getElementById('duoEnemyLP')];
   lpLabels.forEach(label=>{if(label)label.textContent='0 LP';});
   const finish=()=>{
    if(session!==s||s.stamp!==stamp||!s.intro)return;
    const latest=s.latestGame,hand=latest.players[seat],
     currentStrip=battle.querySelector('.seat[data-seat="'+seat+'"] .duo178-hand'),
     currentCards=currentStrip?.querySelector('.duo178-hand-cards');
    s.intro=false;s.progress=1;s.lastHand=[...hand.hand];s.lastDeck=hand.deck.length;
    fills.forEach((fill,team)=>{
     const row=latest.teams[team];
     fill.style.width=Math.min(100,100*row.lp/(row.maxLp||16000))+'%';
    });
    lpLabels.forEach((label,team)=>{if(label)label.textContent=
     latest.teams[team].lp.toLocaleString('de-AT')+' LP';});
    currentStrip?.removeAttribute('aria-hidden');battle.classList.remove('duo178-intro-active');
    showSeatCounts(battle,latest,false);
    if(!reduced())for(const [i,node] of (currentCards?.querySelectorAll('.duo178-hand-card')||[]).entries()){
     node.style.setProperty('--duo178-i',i);
     node.classList.add('duo178-arriving');
    }
    root.setTimeout(()=>{
     if(session!==s||s.stamp!==stamp)return;
     battle.classList.remove('duo178-revealing');
    },Math.max(1200,(hand.hand.length-1)*440+920));
    battle.classList.add('duo178-revealing');
   };
   if(reduced())finish();
   else {
    const fillAfterStart=()=>{
    // Hidden tabs can throttle RAF; unlock after the visible LP sequence finishes.
    root.setTimeout(finish,3600);
    root.setTimeout(()=>{
     if(session!==s||s.stamp!==stamp)return;
     const start=root.performance.now(),duration=root.ArcaneDuoSolo221?2600:1800;
     const step=now=>{
      if(session!==s||s.stamp!==stamp||!s.intro)return;
      const fraction=Math.min(1,(now-start)/duration),smooth=fraction*fraction*(3-2*fraction);
      s.progress=smooth;
      fills.forEach((fill,team)=>{
       const row=s.latestGame.teams[team],value=Math.round(row.lp*smooth);
       fill.style.width=100*value/(row.maxLp||16000)+'%';
       if(lpLabels[team])lpLabels[team].textContent=value.toLocaleString('de-AT')+' LP';
      });
      if(fraction<1&&s.intro)root.requestAnimationFrame(step);else finish();
     };
     root.requestAnimationFrame(step);
    },root.ArcaneDuoSolo221?100:600);
    };
    if(root.ArcaneDuoSolo221?.afterStartScreen)root.ArcaneDuoSolo221.afterStartScreen().then(fillAfterStart,fillAfterStart);
    else fillAfterStart();
   }
  }else if(!s.intro&&s.lastHand&&game.status==='active'){
   const count=Math.max(0,(s.lastDeck||0)-p.deck.length);
   const entering=drawIndices(s.lastHand,p.hand,count);
   if(!reduced()&&entering.length){
    const stamp=++s.stamp;
    entering.forEach((index,i)=>{
     const card=list.querySelector('[data-index="'+index+'"]');
     if(card){card.classList.add('duo178-arriving');card.style.setProperty('--duo178-i',i);}
    });
    battle.classList.add('duo178-revealing');
    root.setTimeout(()=>{
     if(session===s&&s.stamp===stamp)battle.classList.remove('duo178-revealing');
    },(entering.length-1)*440+920);
   }
  }
  if(!s.intro){s.lastHand=[...p.hand];s.lastDeck=p.deck.length;}
 }
 return Object.freeze({version:'17.8',drawIndices,sync});
});
