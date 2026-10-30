/* Arcane Duel v21.6 – Duo portrait gallery with non-interchangeable story cast.
 * Normal NPCs take only portraits not selected by either human. No unused
 * portrait is rendered as a fake playable character.
 */
'use strict';
(()=>{
 const P=window.ArcanePortraits215,R=window.ArcaneDuoRules;
 const panel=document.getElementById('duoProfilePanel');
 if(!P||!R||!panel)return;
 const el=(tag,cls,label)=>{const d=document.createElement(tag);
  if(cls)d.className=cls;if(label!==undefined)d.textContent=label;return d;};
 const section=el('details','duo-panel ad215-duo-opponents');
 section.id='ad215DuoOpponents';
 section.append(el('summary',null,'✧ Gegnerprofile · Freigeschaltete Kapitel'));
 section.append(el('p',null,'Gewöhnliche Duellanten erhalten zufällig eines der nicht gewählten Spielerportraits. Eiman Huel, Hans Ess und die beiden Fanatiker haben unveränderliche Story-Artworks.'));
 const grid=el('div','ad215-roster');section.append(grid);
 panel.insertAdjacentElement('afterend',section);
 let latest=null,roster=null,clearedChapters=[];
 function visibleChapters(){
  const main=clearedChapters.filter(n=>Number.isInteger(n)&&n>=1&&n<=10);
  const currentMain=latest?.entry==='quest'?1:Number(latest?.chapter)||1;
  const maxMain=Math.min(10,Math.max(1,currentMain,...main));
  const visible=R.CHAPTERS.filter(ch=>ch.id<=maxMain);
  const researchClears=clearedChapters.filter(n=>Number.isInteger(n)&&n>=11&&n<=15);
  let stage=Math.min(5,researchClears.length?Math.max(...researchClears)-9:1);
  if(latest?.entry==='quest'&&latest.chapter>=11&&latest.chapter<=15){
   stage=latest.chapter-10;
   if(latest.status==='finished'&&latest.winner===0&&latest.questPassed===true)
    stage=Math.min(5,stage+1);
  }
  if(main.includes(2)||researchClears.length||latest?.entry==='quest'){
   const current=R.QUESTS.find(ch=>ch.id===10+stage);
   if(current)visible.push(current);
  }
  return visible;
 }
 function names(chapter){
  if(chapter===10)return ['Eiman Huel Stalker','Hans Ess Kirk'];
  if(chapter>=11)return ['Der Level-1-Fanatiker','Fanatikers Adept'];
  const base=roster?.roster?.[chapter-1]?.name||'Gegner von Kapitel '+chapter;
  return [base,'Verbündeter von '+base];
 }
 function fill(){
  grid.replaceChildren();
  const selected=latest?.players?[latest.players[0]?.portraitId,latest.players[2]?.portraitId]:
    [document.querySelector('#duoAvatarView [data-portrait]')?.dataset?.portrait||'hero-01'];
  for(const chapter of visibleChapters()){
   const label=names(chapter.id);
   for(const [index,baseName]of label.entries()){
    const seat=index?3:1;
    const name=latest?.chapter===chapter.id?
     (latest.players[seat]?.name||baseName):baseName;
    const avatar=P.visualDuo({chapter:chapter.id,seat,selected});
    const card=el('article','ad215-npc-card');
    if(avatar)card.append(P.node(avatar,name));
    const body=el('div');body.append(el('strong',null,name));
    body.append(el('small',null,(chapter.id>10?'Forschung '+(chapter.id-10)+'/5':
     'Kapitel '+chapter.id)+' · '+(index?'Gegner B':'Gegner A')));
    body.append(el('small',null,chapter.name||''));
    if(chapter.id===10)body.append(el('small',null,index?'Der blonde Magier in Rot · Eimans treuer Tag-Team-Partner':
     'Der finstere Magier · Herr über seine versklavten Kreaturen'));
    if(chapter.id>=11)body.append(el('small',null,index?
      'Besessener Forschungsgehilfe · kein eigenes ACE-Monster':
      'Der Level-1-Forscher · Lumiras ungeduldiger Beschwörer'));
    card.append(body);grid.append(card);
   }
  }
 }
 fill();
 fetch('assets/duo-opponent-catalog-v201.json?v=201').then(r=>r.ok?r.json():null)
  .then(data=>{if(data?.schema===1){roster=data;fill();}}).catch(()=>{});
 window.ArcaneDuoPortraits215=Object.freeze({version:'21.7',section,fill,
  update(game){latest=game;fill();},
  updateProfile(profile){
   clearedChapters=Array.isArray(profile?.clearedChapters)?profile.clearedChapters.filter(Number.isInteger):[];
   fill();
  }});
})();
