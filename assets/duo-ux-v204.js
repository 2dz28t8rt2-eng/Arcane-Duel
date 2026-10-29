/* Arcane Duel 20.4 – 2v2 comfort and truthful, server-confirmed feedback.
 * No client-side combat calculation is ever written into the room state.
 * Rival hands remain private; a card inspector opens only public field cards
 * or the viewing human's own hand cards.
 */
'use strict';
((root)=>{
 const doc=root?.document;
 if(!doc)return;
 const el=(tag,cls,text,parent)=>{
  const node=doc.createElement(tag);if(cls)node.className=cls;
  if(text!==undefined)node.textContent=String(text);
  parent?.append(node);return node;
 };
 const reduced=()=>!!(root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||
  doc.body?.classList.contains('ad-motion-disabled'));
 const number=v=>Math.max(0,Number(v)||0);
 const formatted=v=>Math.round(number(v)).toLocaleString('de-AT');
 const percentLabel=v=>String(Math.round(v*10)/10).replace('.',',');
 const sameRoom=(a,b)=>!!a&&!!b&&a.roomId===b.roomId&&a.chapter===b.chapter;
 const isPredator=c=>c?.role==='predator';
 const leaderOf=p=>(p?.field||[]).filter(c=>c?.fusion&&isPredator(c)&&c.predatorLeader)
  .sort((a,b)=>(b.predatorLeader.bornUid||b.uid)-(a.predatorLeader.bornUid||a.uid))[0]||null;
 function packState(player){
  const count=(player?.field||[]).filter(isPredator).length;
  const leader=leaderOf(player);
  const rate=leader?(leader.predatorLeader.powers?.includes('swarm')?3.5:3):2;
  return {leader,percentage:Math.min(5,count)*rate};
 }
 function growthPct(card){
  return isPredator(card)&&!card.fusion&&!card.predatorToken&&!card.fate?
   90+3*Math.max(0,Math.min(4,card.predatorEvolutionAge||0)):100;
 }
 function effectiveAttack(card,player,rules){
  const base=rules?.attackValue?rules.attackValue(card):number(card?.atk)+
   (card?.role==='soul'?Math.floor(number(card?.condensed)*.5):0);
  return isPredator(card)?
   Math.floor(base*(growthPct(card)+packState(player).percentage)/100):base;
 }
 const powers={swarm:'Rudelinstinkt',mark:'Blutspur',token:'Rudelruf'};
 let context=null,details=null,outcome=null,outcomeTimers=[],soulTimer=null;
 const notices=new Set();
 function flash(target,text,positive=true){
  const rect=target?.getBoundingClientRect?.();
  if(!rect||rect.width<2||reduced())return;
  const node=el('span','ad204-stat-flash'+(positive?'':' ad204-stat-loss'),text,doc.body);
  node.style.left=(rect.left+rect.width/2)+'px';node.style.top=(rect.top+rect.height/2)+'px';
  root.setTimeout(()=>{node.remove();notices.delete(node);},1900);notices.add(node);
 }
 function dismissInspector(){details?.remove();details=null;}
 function inspectCard(card,player,catalog,{hand=false}={}){
  dismissInspector();if(!card)return;
  const template=catalog?.[card.id]||{};
  const alpha=!hand&&card.predatorLeader;
  const pack=hand?null:packState(player);
  const scrim=el('div','ad204-inspect-screen',undefined,doc.body);details=scrim;
  const panel=el('section','ad204-inspect',undefined,scrim);
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
  panel.setAttribute('aria-label','Große Kartenansicht');
  const close=el('button','ad204-inspect-close','✕ Schließen',panel);
  close.type='button';close.addEventListener('click',dismissInspector);
  scrim.addEventListener('click',e=>{if(e.target===scrim)dismissInspector();});
  const visual=el('div','ad204-inspect-art',undefined,panel);
  if(template.art){const img=el('img','',undefined,visual);img.src=template.art;img.alt='';}
  else el('span','',card.predatorToken?'🐾':'✧',visual);
  if(alpha)el('strong','ad204-inspect-leader','♛ RUDELFÜHRER',panel);
  el('h2','',card.predatorToken?'Rudelgeist':template.name||'Monster',panel);
  el('p','ad204-inspect-level','Lv '+(card.level||template.level||'?')+' · '+
   ({predator:'Predator',soul:'Seelenzehrer',guardian:'Wächter',combatant:'Allrounder',
    resonator:'Resonator'}[card.role||template.role]||'Monster')+(hand?' · Handkarte':' · Feldkarte'),panel);
  const base=hand?number(template.atk):number(root.ArcaneDuoRules?.attackValue?.(card)??card.atk);
  const actual=hand?number(template.atk):effectiveAttack(card,player,root.ArcaneDuoRules);
  el('p','ad204-inspect-stats',formatted(base)+' ATK / '+
   formatted(hand?template.def:card.def)+' DEF',panel);
  if(pack&&isPredator(card)){
   const pct=percentLabel(pack.percentage);
   const growth=percentLabel(growthPct(card));
   const total=percentLabel(growthPct(card)+pack.percentage);
   el('p','ad204-inspect-bonus','🐾 Entwicklung '+growth+
    ' % + Schwarm +'+pct+' % = Gesamt '+total+
    ' % Angriffskraft · effektiv '+formatted(actual)+' ATK',panel);
   el('p','ad204-inspect-hint','Normale Predatoren starten bei 90 % ATK, erhalten nach jedem weiteren eigenen abgeschlossenen Zug +3 Prozentpunkte und erreichen höchstens 102 %. DEF und gespeicherte Grundwerte bleiben gleich. Fusionspredatoren behalten 100 % Entwicklung und ihren Schwarmbonus.',panel);
   if(pack.leader)el('p','ad204-inspect-hint','Rudelführer aktiv: '+
    (pack.leader.predatorLeader.powers||[]).map(k=>powers[k]||k).join(', ')+' · '+
    'Der Bonus gilt beim Angriff, nicht als dauerhafter ATK-Wertzuwachs.',panel);
  }
  if(alpha)el('p','ad204-inspect-hint','♛ '+
   card.predatorLeader.materials+' Fusionsmaterialien · '+
   ((card.predatorLeader.powers||[]).map(k=>powers[k]||k).join(' · ')||'Rudelführer-Basisbonus'),panel);
  if(template.ace)el('p','ad204-inspect-hint','✦ ACE-Monster · darf nicht fusioniert werden.',panel);
  close.focus?.();
 }
 function fieldCell(seat,slot){return doc.querySelector('#duoSeats .seat[data-seat="'+seat+
  '"] > .field > .field-cell[data-slot="'+slot+'"]');}
 function handCard(seat,index){return doc.querySelector('#duoSeats .seat[data-seat="'+seat+
  '"] .duo178-hand-card[data-index="'+index+'"]');}
 function infoButton(container,onClick){
  if(!container||container.querySelector('.ad204-card-info'))return;
  const b=el('button','ad204-card-info','⌕',container);
  b.type='button';b.title='Karte groß ansehen';b.setAttribute('aria-label','Karte groß ansehen');
  b.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();onClick();});
  b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')e.stopPropagation();});
 }
 function toggleHand(){
  const battle=doc.querySelector('.duo-battle');
  if(!battle)return false;
  battle.classList.toggle('ad204-hand-collapsed');
  const hidden=battle.classList.contains('ad204-hand-collapsed');
  const b=doc.getElementById('ad204-hand-toggle');
  if(b){b.textContent=hidden?'▴ Hand zeigen [H]':'▾ Hand minimieren [H]';
   b.setAttribute('aria-expanded',String(!hidden));}
  return hidden;
 }
 function decorate({game,seat,catalog,roomId}={}){
  if(!game||![0,2].includes(seat))return;
  context={game,seat,catalog,roomId};
  for(const player of game.players||[]){
   const pct=packState(player).percentage;
   (player.field||[]).forEach((card,slot)=>{
    if(!card)return;
    const cell=fieldCell(player.seat,slot);if(!cell)return;
    if(isPredator(card)){
     const badge=cell.querySelector('.ad204-swarm-badge')||
      el('span','ad204-swarm-badge','+'+percentLabel(pct)+' %',cell);
     const total=growthPct(card)+pct;
     badge.textContent=percentLabel(total)+' %';
     badge.title='Gesamt-Angriffskraft: Entwicklung '+percentLabel(growthPct(card))+
      ' % + Schwarm +'+percentLabel(pct)+' %';
     badge.setAttribute('aria-label','Gesamt-Angriffskraft '+percentLabel(total)+' Prozent');
    }
    if(!cell.querySelector('.ad204-card-info'))infoButton(cell,()=>inspectCard(card,player,catalog));
   });
  }
  const own=game.players[seat],strip=doc.querySelector(
   '#duoSeats .seat[data-seat="'+seat+'"] .duo178-hand');
  if(strip){
   const title=strip.querySelector('.duo178-hand-title');
   if(title&&!title.querySelector('#ad204-hand-toggle')){
    const b=el('button','ad204-hand-toggle','',title);b.id='ad204-hand-toggle';
    b.type='button';b.addEventListener('click',toggleHand);
   }
   const b=doc.getElementById('ad204-hand-toggle');
   if(b){const hidden=doc.querySelector('.duo-battle')?.classList.contains('ad204-hand-collapsed');
    b.textContent=hidden?'▴ Hand zeigen [H]':'▾ Hand minimieren [H]';
    b.setAttribute('aria-expanded',String(!hidden));}
   own.hand.forEach((id,index)=>{
    const item=typeof id==='number'?{id}:id;
    infoButton(handCard(seat,index),()=>inspectCard(item,own,catalog,{hand:true}));
   });
  }
 }
 function clearOutcome(){
  outcomeTimers.forEach(root.clearTimeout);outcomeTimers=[];outcome?.remove();outcome=null;
 }
 function showOutcome(game){
  clearOutcome();dismissInspector();
  const won=game.winner===0,stage=el('div','ad204-result-stage',undefined,doc.body);
  stage.setAttribute('aria-live','polite');stage.setAttribute('role','status');
  outcome=stage;
  const title=el('strong','ad204-result-title'+(won?' ad204-win':' ad204-loss'),
   won?'SIEG':'NIEDERLAGE',stage);
  const panel=el('section','ad204-result-dialog',undefined,stage);
  el('h2','',won?'Gemeinsam gewonnen!':'Gemeinsam verloren',panel);
  el('p','',won?'Ihr habt das Kapitel gemeinsam gemeistert.':
   'Eure Gegner haben dieses Duell gewonnen. Ihr könnt es erneut versuchen.',panel);
  const close=el('button','ad204-result-close','Zum Spielfeld',panel);
  close.type='button';close.addEventListener('click',clearOutcome);
  const duration=reduced()?0:1500;
  outcomeTimers.push(root.setTimeout(()=>{
   if(outcome===stage)title.classList.add('ad204-visible');
  },duration));
  outcomeTimers.push(root.setTimeout(()=>{
   if(outcome===stage){panel.classList.add('ad204-visible');close.focus?.();}
  },duration+(reduced()?0:800)));
 }
 function confirmed(before,after){return sameRoom(before,after)&&
  Number.isSafeInteger(before.revision)&&Number.isSafeInteger(after.revision)&&
  after.revision>before.revision;}
 function hasOwnAttack(before,after,seat){
  const name=before.players?.[seat]?.name;
  if(!name)return false;
  const lines=after.log||[],old=before.log||[];
  const added=lines.length>=old.length&&old.every((v,i)=>v===lines[i])?
   lines.slice(old.length):lines.slice(-8);
  return added.some(line=>String(line).startsWith(name+' greift ')||
   String(line).startsWith(name+' · direkter Angriff'));
 }
 function onState(before,after,{seat,catalog}={}){
  if(!after)return;
  if(!sameRoom(before,after)){clearOutcome();return;}
  if(!confirmed(before,after))return;
  for(const player of after.players||[]){
   const prior=before.players?.[player.seat];if(!prior)continue;
   const old=packState(prior).percentage,newPct=packState(player).percentage;
   (player.field||[]).forEach((card,slot)=>{
    if(!isPredator(card))return;
    const older=prior.field?.find(x=>x?.uid===card.uid);
    const existed=!!older;
    if(older&&growthPct(card)>growthPct(older))
     flash(fieldCell(player.seat,slot),'ENTWICKLUNG +'+
      percentLabel(growthPct(card)-growthPct(older))+
      ' % · Gesamt '+percentLabel(growthPct(card)+newPct)+' %',true);
    if(!existed&&newPct>0)flash(fieldCell(player.seat,slot),
     'Rudel +'+percentLabel(newPct)+' %',true);
    else if(existed&&newPct!==old)flash(fieldCell(player.seat,slot),
     'Rudel '+(newPct>old?'+':'')+percentLabel(newPct-old)+' %',newPct>old);
   });
  }
  // Attack fatigue is server-owned. Report confirmed ATK/DEF losses on the
  // attacking human's surviving card, and keep the message legible.
  if([0,2].includes(seat)&&hasOwnAttack(before,after,seat)){
   const older=before.players?.[seat],newer=after.players?.[seat];
   (newer?.field||[]).forEach((card,slot)=>{
    const old=older?.field?.find(c=>c?.uid===card?.uid);
    if(!card||!old||old.used||!card.used)return;
    const atk=Math.max(0,number(old.atk)-number(card.atk));
    const def=Math.max(0,number(old.def)-number(card.def));
    if(atk||def)flash(fieldCell(seat,slot),'ZERFALL −'+atk+' ATK / −'+def+' DEF',false);
   });
  }
  if(before.status!=='finished'&&after.status==='finished')showOutcome(after);
  else if(after.status!=='finished')clearOutcome();
 }
 function onActionStart(action){
  if(!['soulCondense','soulDischarge','soulRaid','soulFocus'].includes(action?.type))return;
  const battle=doc.querySelector('.duo-battle');if(!battle)return;
  root.clearTimeout(soulTimer);battle.classList.remove('ad204-soul-reveal');
  battle.classList.add('ad204-soul-hide');
  soulTimer=root.setTimeout(()=>{
   battle.classList.remove('ad204-soul-hide');battle.classList.add('ad204-soul-reveal');
   root.setTimeout(()=>battle.classList.remove('ad204-soul-reveal'),600);
  },reduced()?0:1750);
 }
 function onActionError(){
  root.clearTimeout(soulTimer);
  doc.querySelector('.duo-battle')?.classList.remove('ad204-soul-hide','ad204-soul-reveal');
 }
 function usePositionShortcut(){
  const {game,seat}=context||{};
  if(!game||game.status!=='active'||game.activeSeat!==seat)return false;
  const group=[...doc.querySelectorAll('#duoActions .duo-action-group')]
   .find(node=>/Position wechseln/.test(node.querySelector('h3')?.textContent||''));
  const select=group?.querySelector('select'),button=group?.querySelector('button');
  if(!select||!button||button.disabled)return false;
  const eligible=(game.players[seat].field||[]).flatMap((c,i)=>
   c&&c.mode==='atk'&&!c.used&&!c.switched&&!(c.essenceAttacks>0)?[i]:[]);
  if(!eligible.length)return false;
  const current=Number(select.value),slot=eligible.includes(current)?current:eligible[0];
  if(![...select.options].some(o=>Number(o.value)===slot))return false;
  select.value=String(slot);button.click();return true;
 }
 function useDirectShortcut(){
  const {game,seat}=context||{};
  if(!game||game.status!=='active'||game.activeSeat!==seat)return false;
  const target=doc.querySelector('#duoActions [data-ad187-target]');
  const source=doc.querySelector('#duoActions [data-ad187-source]');
  const commit=doc.querySelector('#duoActions [data-ad187-commit]');
  if(!target||!source||!commit||![...target.options].some(o=>o.value==='direct'))return false;
  const src=source.value.split(':'),area=src[0],slot=Number(src[1]);
  if(!Number.isInteger(slot))return false;
  const panel=doc.querySelector('#duoSeats .seat[data-seat="'+seat+'"]');
  const cell=area==='ghost'?panel?.querySelector('.duo-ghost-cell[data-slot="'+slot+'"]'):
   fieldCell(seat,slot);
  if(!cell)return false;
  cell.click();
  if(commit.disabled)return false;
  target.value='direct';commit.click();return true;
 }
 doc.addEventListener('keydown',event=>{
  if(event.repeat||event.ctrlKey||event.metaKey||event.altKey||
   event.target?.closest?.('input,textarea,select,[contenteditable]'))return;
  const key=String(event.key||'').toLowerCase();
  if(key==='escape'){if(details){dismissInspector();event.preventDefault();}
   else if(outcome){clearOutcome();event.preventDefault();}return;}
  if(!context||details||outcome)return;
  if(key==='h'){event.preventDefault();toggleHand();}
  else if(key==='d'&&usePositionShortcut())event.preventDefault();
  else if(key==='a'&&useDirectShortcut())event.preventDefault();
 });
 const api=Object.freeze({version:'20.4',packState,effectiveAttack,sameRoom,
  decorate,onState,onActionStart,onActionError,toggleHand,usePositionShortcut,useDirectShortcut});
 root.ArcaneDuoUX204=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
