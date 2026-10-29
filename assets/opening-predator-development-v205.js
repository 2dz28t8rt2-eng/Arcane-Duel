/* Arcane Duel v20.5 – opening monster guard + normal Predator development.
 * Values change only in combat calculations (Essence + Predator Pack);
 * this layer manages per-creature turns, save-safe state and clear live UI.
 */
'use strict';
(()=>{
 const isPredator=c=>(c?.roleOverride||CARDS[c?.id]?.role)==='predator';
 const eligible=c=>!!c&&isPredator(c)&&!c.fusion&&!c.predatorToken&&
  !CARDS[c.id]?.essenceMonster;
 const asText=n=>String(Math.round(n*10)/10).replace('.',',');
 function breakdown(g,c,owner){
  if(!g||!c||!isPredator(c))return null;
  const p=g.players?.[owner],active=p?.field?.includes(c);
  const evolution=eligible(c)?predatorDevelopmentPct(c):100;
  const count=active?Math.min(5,p.field.filter(x=>x&&isPredator(x)).length):0;
  const leader=g.mode==='pve'&&!g.strategicTraining?.symmetricSides?
   window.ArcanePredatorPack?.leader?.(g,owner):null;
  const improved=!!leader&&active;
  const per=improved?(leader.predatorLeader?.powers?.includes('swarm')?3.5:3):2;
  const swarm=count*per;
  // Symmetric research can explicitly disable Swarm.
  const research=g.strategicTraining?Number(g.strategicTraining.predatorSwarmPercent||0):null;
  const applied=research===0?0:research!==null?count*research*100:
   swarm;
  return {evolution,swarm:applied,total:evolution+applied,count,
    isDeveloping:eligible(c),leader:improved,per};
 }
 function markGrowth(g,c,owner){
  const bonus=breakdown(g,c,owner);
  if(!bonus)return;
  (g.predatorGrowthEvents205??=[]).push({owner,uid:c.uid,
   step:c.predatorEvolutionAge,total:bonus.total});
 }
 const previousPlace=placePending;
 placePending=function(g,idx,choice){
  const result=previousPlace(g,idx,choice),c=result?.card;
  if(!c)return result;
  if(eligible(c)){
   c.predatorEvolutionAge=0;
   c.predatorDevelopmentBornTurn=g.turn;
  }
  if(g.turn===1&&g.active===g.starter&&!c.fusion&&!c.predatorToken){
   c.openingGuard=true;
   logEvent(g,'✦ Eröffnungsschutz aktiviert: '+dataOf(c).name+' (erster Angriff in Zug 2).');
  }
  return result;
 };
 const previousAdvance=advanceTurn;
 advanceTurn=function(g){
  if(g.winner!==null||g.pending)return previousAdvance(g);
  const ending=g.turn,owner=g.active;
  const result=previousAdvance(g);
  if(g.turn===ending)return result;
  // Growth happens after the NEXT completed own turn, not immediately
  // after summoning. The 4th advancement reaches the 102% cap.
  for(const c of g.players[owner].field.filter(eligible)){
   if(!Number.isInteger(c.predatorEvolutionAge))c.predatorEvolutionAge=0;
   if(!Number.isInteger(c.predatorDevelopmentBornTurn)){
    // Older ongoing saves have no development timestamp; start at 90%.
    c.predatorDevelopmentBornTurn=ending;
   }
   if(ending<=c.predatorDevelopmentBornTurn||c.predatorEvolutionAge>=4)continue;
   c.predatorEvolutionAge++;
   logEvent(g,'Entwicklung: '+dataOf(c).name+' · '+predatorDevelopmentPct(c)+' % ATK-Grundfaktor.');
   markGrowth(g,c,owner);
  }
  if(ending===2)for(const p of g.players)for(const c of p.field)
   if(c?.openingGuard)delete c.openingGuard;
  return result;
 };
 const id=name=>document.getElementById(name);
 function decorate(g){
  if(!g||uiMode!=='duel')return;
  const viewer=g.mode==='pve'?0:g.active;
  for(const owner of [0,1]){
   const row=id(owner===viewer?'ownRow':'enemyRow');
   const side=owner===viewer?'mine':'enemy';
   g.players[owner].field.forEach((c,i)=>{
    if(!c)return;
    const node=row?.querySelector('[data-'+side+'="'+i+'"] .board-creature');
    if(!node)return;
    if(c.openingGuard&&g.turn<=2){
     const shield=document.createElement('span');
     shield.className='ad205-first-guard';shield.textContent='✦ SCHUTZ';
     shield.title='Eröffnungsschutz: der erste gegnerische Angriff in Zug 2 kann dieses normale Monster nicht zerstören.';
     node.append(shield);
    }
    const parts=breakdown(g,c,owner);
    if(!parts)return;
    const label='Gesamt '+asText(parts.total)+' % ATK · Entwicklung '+asText(parts.evolution)+
      ' % · Schwarm +'+asText(parts.swarm)+' %';
    const current=node.querySelector('.ad203-pack-bonus');
    if(current){
     current.textContent=asText(parts.total)+' %';
     current.title=label;current.setAttribute('aria-label',label);
     current.classList.add('ad205-total-bonus');
    }else{
     const badge=document.createElement('span');
     badge.className='ad205-total-bonus ad205-fallback-bonus';
     badge.textContent=asText(parts.total)+' %';badge.title=label;
     node.append(badge);
    }
   });
  }
 }
 function largeInfo(g){
  const preview=id('largeCardPreview');
  if(!preview)return;
  preview.querySelectorAll('.ad205-growth-detail').forEach(x=>x.remove());
  const card=preview.querySelector('.hand-card[data-instance-uid]');
  if(!card||!g||uiMode!=='duel')return;
  const uid=Number(card.dataset.instanceUid);
  if(!Number.isInteger(uid))return;
  for(const owner of [0,1]){
   const c=g.players[owner].field.find(x=>x?.uid===uid);
   if(!c)continue;
   const parts=breakdown(g,c,owner),detail=document.createElement('div');
   detail.className='ad205-growth-detail';
   if(parts){
    detail.innerHTML='<strong>🐾 Predator · Kampfmodifikatoren</strong>'+
      '<div>Entwicklung: <b>'+asText(parts.evolution)+' %</b> ('+
       (parts.evolution>=100?'+':'')+asText(parts.evolution-100)+' % gegenüber Grund-ATK)</div>'+
      '<div>Schwarmbonus: <b>+'+asText(parts.swarm)+' %</b> ('+parts.count+
       ' Predatoren auf dem Feld)</div>'+
      '<div class="ad205-growth-sum">Gesamt: <b>'+asText(parts.total)+' % ATK</b></div>'+
      '<small>Normale Predatoren beginnen bei 90 % ATK und erhalten nach jedem weiteren abgeschlossenen eigenen Zug +3 Prozentpunkte, maximal 102 %. DEF und gespeicherte Grundwerte bleiben unverändert. Schwarm addiert sich zum Entwicklungsfaktor; zusätzliche taktische Angriffsboni werden getrennt berechnet.'+
      (parts.leader?' Rudelführer verstärkt den Schwarmbonus.':'')+'</small>';
   }else if(c.openingGuard){
    detail.innerHTML='<strong>✦ Eröffnungsschutz</strong><small>Dieses normale Monster überlebt einmalig einen sonst tödlichen Angriff im zweiten Gesamtzug. Kein zusätzlicher LP-Schild.</small>';
   }else return;
   if(c.openingGuard&&parts){
    detail.innerHTML+='<div class="ad205-guard-detail">✦ Eröffnungsschutz aktiv: einmalige Rettung in Zug 2.</div>';
   }
   preview.append(detail);
   break;
  }
 }
 function popup(g,evt){
  const viewer=g.mode==='pve'?0:g.active;
  const owner=evt.owner;
  const ix=g.players[owner].field.findIndex(c=>c?.uid===evt.uid);
  if(ix<0)return;
  const side=owner===viewer?'mine':'enemy';
  const slot=id(side==='mine'?'ownRow':'enemyRow')?.
    querySelector('[data-'+side+'="'+ix+'"]');
  if(!slot)return;
  const element=document.createElement('div');
  element.className='ad205-growth-pop';
  element.innerHTML='<strong>ENTWICKLUNG</strong><span>+3 % · Gesamt '+asText(evt.total)+' %</span>';
  slot.append(element);
  setTimeout(()=>element.remove(),1700);
 }
 const oldRender=render;
 render=function(...args){
  const result=oldRender.apply(this,args),g=game;
  if(!g)return result;
  try{
   decorate(g);largeInfo(g);
   const events=g.predatorGrowthEvents205?.splice(0)||[];
   if(uiMode==='duel'&&animationSpeed!=='instant')events.forEach(e=>popup(g,e));
  }catch(err){console.warn('Entwicklungsanzeige konnte nicht gezeichnet werden',err);}
  return result;
 };
 const oldPreview=renderCardPreview;
 renderCardPreview=function(...args){
  const result=oldPreview.apply(this,args);
  if(game)largeInfo(game);
  return result;
 };
 window.ArcanePredatorDevelopment=Object.freeze({version:'20.5',breakdown});
})();
