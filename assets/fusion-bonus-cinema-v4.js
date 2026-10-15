/* Arcane Duel 4.0 – a visual ceremony for ALREADY AWARDED poker/element quality bonuses.
 * Never rolls, adds buffs, edits a card, or changes the game's random stream.
 */
'use strict';
(()=>{
 const COMBOS={
  'Paar':{title:'ZWILLING',tier:1},
  'Zwei Paare':{title:'ZWEI PAARE',tier:2},
  'Drilling':{title:'DRILLING',tier:3},
  'Kleine Straße':{title:'KLEINE STRASSE',tier:3},
  'Full House':{title:'FULL HOUSE',tier:4},
  'Vierling':{title:'VIERLING',tier:4},
  'Große Straße':{title:'GROSSE STRASSE',tier:4},
  'Fünfling':{title:'FÜNFLING',tier:5}
 };
 const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 function describe(card){
  const combo=card?.rollMath?.combo;
  const original=combo?.name||card?.pattern||'Freie Fusion';
  const type=original.split(' · ')[0];
  const harmonized=original.includes('Elementharmonie');
  const base=COMBOS[type]||null;
  if(!base&&!harmonized)return null;
  const count=Number.isInteger(combo?.materialCount)?combo.materialCount:Number(card?.materialsUsed)||2;
  // 5 materials is unconditionally more extravagant than a 3-card combination.
  const tier=Math.max(base?.tier||1,count===5?5:count===4?Math.min(4,(base?.tier||1)+1):1);
  const percent=typeof combo?.qualityPct==='number'?combo.qualityPct:null;
  const weighted=Math.max(1,Math.min(5,tier+(percent===null?0:percent>=20?1:0)));
  return Object.freeze({
   type, title:base?.title||'ELEMENTHARMONIE',harmonized,materialCount:count,
   percent,tier:weighted,rollBonus:combo?.rollBonus||0
  });
 }
 function makeImpact(root,bonus){
  const node=document.createElement('div');
  node.className='ad-combo-ritual ad-combo-tier-'+bonus.tier;
  node.setAttribute('aria-hidden','true');
  node.style.setProperty('--ad-combo-duration',(1350+bonus.tier*115)+'ms');
  const text=document.createElement('div');text.className='ad-combo-ink';
  const title=document.createElement('strong');title.textContent=bonus.title;
  const subtitle=document.createElement('span');
  subtitle.textContent=bonus.percent===null?
   (bonus.materialCount+' MATERIALIEN · FUSIONSBONUS'):
   ('+'+bonus.percent.toLocaleString('de-AT',{maximumFractionDigits:1})+
    ' % QUALITÄT · '+bonus.materialCount+' MATERIALIEN');
  const flourish=document.createElement('small');
  flourish.textContent=bonus.harmonized&&bonus.type!=='Freie Fusion'?'✧ ELEMENTHARMONIE ✧':
   bonus.rollBonus?'✧ +'+bonus.rollBonus+' BONUSWÜRFE ✧':'✧ PRÄGUNG DER KOMBINATION ✧';
  text.append(title,subtitle,flourish);node.append(text);
  const sparks=document.createElement('div');sparks.className='ad-combo-particles';
  const count=Math.min(118,18+bonus.tier*15+Math.round((bonus.percent||0)*.9));
  for(let i=0;i<count;i++){
   const p=document.createElement('i'),rad=i*2.399963229728653,dist=90+bonus.tier*25+(i%11)*12;
   p.style.setProperty('--px',Math.round(Math.cos(rad)*dist)+'px');
   p.style.setProperty('--py',Math.round(Math.sin(rad)*dist)+'px');
   p.style.setProperty('--delay',(i%13)*23+'ms');
   p.style.setProperty('--spark-scale',(.6+(i%4)*.18).toFixed(2));
   sparks.append(p);
  }
  node.append(sparks);root.append(node);
  return node;
 }
 async function stamp(root,card,wait=ms=>new Promise(r=>setTimeout(r,ms))){
  const bonus=describe(card);
  if(!bonus||reduced())return bonus;
  const node=makeImpact(root,bonus);
  root.classList.add('ad-combo-visible','ritual-screen-shake');
  const duration=1350+bonus.tier*115;
  try{
   await wait(300);
   root.classList.remove('ritual-screen-shake');
   await wait(duration-300);
  }finally{
   root.classList.remove('ad-combo-visible','ritual-screen-shake');
   node.remove();
  }
  return bonus;
 }
 window.ArcaneFusionBonus=Object.freeze({version:'4.0.0',describe,stamp});
})();