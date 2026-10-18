/* Entry point for the isolated 2v2 campaign lab. Does not modify 1v1 game state. */
'use strict';
(()=>{
 const renderEarlier=renderMenu;
 renderMenu=function(...args){
  const result=renderEarlier(...args);
  if(uiMode!=='menu')return result;
  const hero=document.getElementById('menuHero');
  if(hero&&!hero.querySelector('#duoCampaignLab')){
   const a=document.createElement('a');
   a.id='duoCampaignLab';a.className='btn tiny';
   a.href='duo-campaign.html';
   a.textContent='⚔ 2v2-Kampagne · Vorschau';
   a.title='Lokales 2v2-Regellabor – Online-Einladungen folgen nach Serveranbindung';
   hero.append(a);
  }
  return result;
 };
 if(uiMode==='menu')renderMenu();
})();
