/* Arcane Duel single-player character creator and NPC profiles v21.5.
 * Player selection is serialized in the existing validated RPG profile.
 */
'use strict';
(()=>{
 const portraits=window.ArcanePortraits215;
 if(!portraits||typeof renderMenu!=='function'||typeof render!=='function')return;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;
  if(text!==undefined)n.textContent=text;return n;};
 let currentChoice=portraits.sanitizeHero(profile?.avatarId);
 const overlay=el('section','ad215-screen');overlay.id='ad215SoloCreator';
 overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
 overlay.setAttribute('aria-labelledby','ad215SoloCreatorTitle');
 const panel=el('div','ad215-panel');overlay.append(panel);
 panel.append(el('h2',null,'✦ Charakter erstellen'));
 panel.lastChild.id='ad215SoloCreatorTitle';
 panel.append(el('p',null,'Wähle ein Portrait und einen Duellantennamen. Artworks erscheinen automatisch, sobald die passenden Dateien hochgeladen wurden.'));
 const nameLabel=el('label',null,'Dein Spielername');nameLabel.htmlFor='ad215SoloName';
 const input=el('input');input.id='ad215SoloName';input.maxLength=32;input.minLength=2;
 input.placeholder='Duellant';input.autocomplete='nickname';
 panel.append(nameLabel,input);
 const grid=el('div','ad215-portrait-grid');panel.append(grid);
 const status=el('p','micro');status.setAttribute('role','status');
 panel.append(status);
 const actions=el('div','ad215-actions');
 const cancel=el('button',null,'Abbrechen'),save=el('button','ad215-primary','Charakter speichern');
 actions.append(cancel,save);panel.append(actions);
 document.body.append(overlay);
 function close(){overlay.hidden=true;document.getElementById('ad215SoloOpen')?.focus();}
 function open(){
  currentChoice=portraits.sanitizeHero(profile?.avatarId);
  input.value=profile?.duelistName||'Duellant';status.textContent='';
  portraits.chooser(grid,{selected:currentChoice,onChange:id=>{currentChoice=id;}});
  overlay.hidden=false;input.focus();
 }
 cancel.onclick=close;
 overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}});
 save.onclick=()=>{
  const name=input.value.trim().replace(/[<>\x00-\x1f]/g,'');
  if(name.length<2||name.length>32){status.textContent='Bitte einen Namen mit 2 bis 32 Zeichen eingeben.';return;}
  const before={duelistName:profile.duelistName,avatarId:profile.avatarId};
  profile.duelistName=name;profile.avatarId=currentChoice;
  if(!saveProfile()){
   profile.duelistName=before.duelistName;profile.avatarId=before.avatarId;
   status.textContent='Das Profil konnte nicht gespeichert werden. Prüfe die Speicherwarnung.';return;
  }
  close();if(typeof renderMenu==='function'&&uiMode==='menu')renderMenu();
  else if(typeof render==='function')render();
 };
 function decorateMenu(){
  if(uiMode!=='menu')return;
  const hero=document.getElementById('menuHero');
  if(hero&&!hero.querySelector('#ad215SoloOpen')){
   const button=el('button','ad215-mini');button.type='button';button.id='ad215SoloOpen';
   button.append(portraits.node(portraits.sanitizeHero(profile.avatarId),profile.duelistName));
   button.append(el('span',null,'🎭 Charakter erstellen · '+(profile.duelistName||'Duellant')));
   button.onclick=open;hero.append(button);
  }
  if(!['tournament','free'].includes(menuTab))return;
  const host=document.getElementById('menuContent');
  if(!host||host.querySelector('#ad215SoloRoster'))return;
  const section=el('section','menu-panel');section.id='ad215SoloRoster';
  section.append(el('h2',null,'✦ Duellantenprofile · Portraitgalerie'));
  section.append(el('p',null,'Gewöhnliche Gegner erhalten zufällig eines der nicht gewählten Spielerportraits. Eiman Huel und die fünf Forschungsstufen besitzen feste Story-Artworks.'));
  const roster=el('div','ad215-roster');
  for(const foe of OPPONENTS){
   const card=el('article','ad215-npc-card');
   card.append(portraits.node(portraits.visualSolo({id:foe.id,selected:profile.avatarId}),foe.name));
   const body=el('div');
   body.append(el('strong',null,foe.name));
   body.append(el('small',null,foe.title||'Gegner '+foe.id));
   if(foe.profileLine)body.append(el('small',null,foe.profileLine));
   card.append(body);roster.append(card);
  }
  // Five artworks represent ONE researcher evolving, never five people.
  // A completed quest reveals the next stage; stage five remains the finale.
  const saga=profile.lv1Saga||{},cleared=Math.max(0,Math.min(5,Number(saga.stage)||0));
  if(saga.met||saga.offered||cleared>0){
   const stage=Math.min(5,Math.max(1,Number(profile.activeDuel?.lv1Saga?.stage)||cleared+1));
   const card=el('article','ad215-npc-card');
   card.append(portraits.node(portraits.storyFanatic(1,stage),'Level-1-Fanatiker'));
   const body=el('div');
   body.append(el('strong',null,'Der Level-1-Fanatiker'));
   body.append(el('small',null,'Fanatiker-Saga · Aktuelle Erscheinung '+stage+' von 5'));
   card.append(body);roster.append(card);
  }
  const discovered=[];
  if(profile.showcase?.seen||profile.showcase?.pending||profile.showcase?.offered)
   discovered.push(['story-eiman','Eiman Huel Stalker','Geheimduellant']);
  if(profile.wanderer)
   discovered.push([portraits.normalSolo(0,profile.avatarId,'wanderer'),'Wandernder Duellant','Zufällige Begegnungen']);
  for(const [id,name,desc] of discovered){
    const card=el('article','ad215-npc-card');
    card.append(portraits.node(id,name));
    const body=el('div');
    body.append(el('strong',null,name));body.append(el('small',null,desc));
    card.append(body);roster.append(card);
  }
  section.append(roster);host.append(section);
 }
 function decorateDuel(){
  if(uiMode!=='duel'||!game)return;
  const own=document.getElementById('myPortrait'),enemy=document.getElementById('enemyPortrait');
  if(game.mode==='pve'){
   portraits.replace(own,portraits.sanitizeHero(profile.avatarId),profile.duelistName,'ad215-duel-pic');
   const opponent=OPPONENTS[game.opponentId];
   portraits.replace(enemy,portraits.visualSolo({id:game.opponentId,secret:!!game.showcase,stage:game.lv1Saga?.stage||0,
     encounter:game.context==='encounter',selected:profile.avatarId,seed:game.context==='encounter'?'wanderer':'solo'}),
    game.showcase?'Geheimduellant':opponent?.name,'ad215-duel-pic');
   const ownName=document.getElementById('myName');
   if(ownName)ownName.textContent=profile.duelistName||'Duellant';
  }else{
   portraits.replace(own,portraits.sanitizeHero(profile.avatarId),'Duellant 1','ad215-duel-pic');
   portraits.replace(enemy,portraits.permutation('solo:local-pvp',[portraits.sanitizeHero(profile.avatarId)])[0]||'hero-02','Duellant 2','ad215-duel-pic');
  }
 }
 const previousMenu=renderMenu;
 renderMenu=function(...args){const result=previousMenu(...args);decorateMenu();return result;};
 const previousDuel=render;
 render=function(...args){const result=previousDuel(...args);decorateDuel();return result;};
 decorateMenu();decorateDuel();
 window.ArcaneSoloPortraits215=Object.freeze({version:'21.6',open,decorateMenu,decorateDuel});
})();
