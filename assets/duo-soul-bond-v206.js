/* Arcane Duel v20.6 – 2v2 Soul Bond presentation, never writes game state. */
'use strict';
((root,doc)=>{
 const rules=()=>root.ArcaneDuoRules;
 const role=c=>c?.role,kind=c=>role(c)==='guardian'?'guard':role(c)==='soul'?'soul':null;
 const cell=(seat,slot)=>doc.querySelector('#duoSeats .seat[data-seat="'+seat+'"] > .field > .field-cell[data-slot="'+slot+'"]');
 const add=(parent,cls,text)=>{const n=doc.createElement('span');n.className=cls;if(text!==undefined)n.textContent=text;parent.append(n);return n;};
 const pairs=p=>rules()?.soulBonds?.(p)||[];
 function decorate({game}={}){
  if(!game?.players)return;
  for(const p of game.players){
   const bonded=new Set(),links=pairs(p);
   for(let i=0;i<p.field.length;i++){
    const c=cell(p.seat,i);if(!c)continue;
    c.classList.remove('ad206-guard','ad206-soul','ad206-linked','ad206-invite-guardian','ad206-invite-soul');
    c.querySelectorAll('.ad206-mark,.ad206-bridge,.ad206-soul-particle,.ad206-guardian-particle').forEach(e=>e.remove());
   }
   for(const pair of links){
    for(const [i,k] of [[pair.guardianIndex,'guard'],[pair.soulIndex,'soul']]){
     bonded.add(i);const el=cell(p.seat,i);if(!el)continue;
     el.classList.add('ad206-linked','ad206-'+k);
     const badge=add(el,'ad206-mark','🛡 35 %');badge.title='Aktiver Seelenbund: 35 % DEF-Rüstung';badge.setAttribute('aria-label',badge.title);
     for(let n=0;n<2;n++){const part=add(el,k==='soul'?'ad206-soul-particle':'ad206-guardian-particle',k==='soul'?'☠':'✦');part.style.setProperty('--ad206-i',String(n));part.setAttribute('aria-hidden','true');}
    }
    const left=cell(p.seat,Math.min(pair.guardianIndex,pair.soulIndex));
    if(left)add(left,'ad206-bridge').setAttribute('aria-hidden','true');
   }
   p.field.forEach((c,i)=>{
    if(!kind(c)||bonded.has(i))return;
    for(const next of [i-1,i+1])if(next>=0&&next<p.field.length&&!p.field[next]){
     const target=cell(p.seat,next);if(!target)continue;
     target.classList.add(kind(c)==='guard'?'ad206-invite-guardian':'ad206-invite-soul');
     target.title='Seelenbund: benachbarte '+(kind(c)==='guard'?'Seelenzehrer':'Wächter')+'-Karte platzieren';
    }
   });
  }
 }
 function inspect(card,player,panel,catalog){
  if(!card||!player||!panel||!kind(card))return;
  const link=pairs(player).find(x=>x.guardianUid===card.uid||x.soulUid===card.uid);
  const el=doc.createElement('p');el.className='ad206-inspect';
  if(link){
   const partner=player.field[link.guardianUid===card.uid?link.soulIndex:link.guardianIndex];
   const name=catalog?.[partner?.id]?.name||'Partnerkarte';
   el.textContent='🛡 SEELENBUND · 35 % DEF-Rüstung (20 % Basis + 15 % Bindung) · Gebunden mit '+name+'. 25 % des zusätzlich abgewehrten Schadens werden zu Seelenessenz, maximal 50 pro Runde.';
  }else el.textContent='🛡 DEF-Rüstung 20 %. Setze die jeweils andere Rolle direkt daneben: mit Seelenbund 35 %.';
  panel.append(el);
 }
 function onState(before,after){
  if(!before||!after||before.roomId!==after.roomId||before.revision===after.revision)return;
  for(const p of after.players||[]){
   const old=before.players?.[p.seat],prior=new Set(pairs(old).map(x=>x.guardianUid+':'+x.soulUid));
   for(const link of pairs(p))if(!prior.has(link.guardianUid+':'+link.soulUid)){
    const target=cell(p.seat,link.soulIndex);if(!target)continue;
    const popup=add(target,'ad206-activated','✦ SEELENBUND');
    root.setTimeout(()=>popup.remove(),1700);
   }
  }
 }
 root.ArcaneDuoSoulBond206=Object.freeze({version:'20.6',pairs,decorate,inspect,onState});
})(window,document);