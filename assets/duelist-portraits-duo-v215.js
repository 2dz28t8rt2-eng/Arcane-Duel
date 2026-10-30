/* All Duo opponents have a dedicated art slot, even before art exists.
 * This gallery lives in the independent 2v2 campaign menu and does not touch rules.
 */
'use strict';
(()=>{
 const P=window.ArcanePortraits215,R=window.ArcaneDuoRules;
 const panel=document.getElementById('duoProfilePanel');
 if(!P||!R||!panel)return;
 const el=(tag,cls,text)=>{const d=document.createElement(tag);
  if(cls)d.className=cls;if(text!==undefined)d.textContent=text;return d;};
 const section=el('details','duo-panel ad215-duo-opponents');
 section.id='ad215DuoOpponents';
 section.append(el('summary',null,'✧ Gegnerprofile und Artworks · alle 15 Kapitel'));
 section.append(el('p',null,'Jeder der beiden Gegner pro Kapitel hat einen eigenen Portraitplatz. Artworks werden beim Hochladen automatisch angezeigt.'));
 const grid=el('div','ad215-roster');section.append(grid);
 panel.insertAdjacentElement('afterend',section);
 function getNames(data,chapter){
  if(chapter===10)return ['Eiman Huel Stalker','Hans Ess Kirk'];
  if(chapter>=11)return ['Der Level-1-Fanatiker','Fanatikers Adept'];
  const base=data?.roster?.[chapter-1]?.name||'Gegner des Kapitels '+chapter;
  return [base,'Verbündeter von '+base];
 }
 function fill(data){
  grid.replaceChildren();
  for(const entry of R.ENCOUNTERS){
   const names=getNames(data,entry.id);
   for(const [index,name] of names.entries()){
    const seat=index===0?1:3,card=el('article','ad215-npc-card');
    card.append(P.node(P.duoOpponent(entry.id,seat),name));
    const body=el('div');
    body.append(el('strong',null,name));
    body.append(el('small',null,(entry.id>10?'Fanatiker-Saga '+(entry.id-10):
     'Kapitel '+entry.id)+' · '+(index?'Gegner B':'Gegner A')));
    body.append(el('small',null,entry.name||''));
    card.append(body);grid.append(card);
   }
  }
 }
 fill(null);
 fetch('assets/duo-opponent-catalog-v201.json?v=201').then(r=>{
  if(!r.ok)throw Error('Gegnerliste offline');
  return r.json();
 }).then(data=>{if(data?.schema===1&&Array.isArray(data.roster))fill(data);})
  .catch(()=>{}); // NPC names can be loaded from the existing battle even offline.
 window.ArcaneDuoPortraits215=Object.freeze({version:'21.5',section,fill});
})();
