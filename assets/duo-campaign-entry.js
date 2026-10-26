/* Entry point for the 2v2 online test, plus a prominent 1v1 backup shortcut.
 * Neither shortcut changes the existing battle rules or save format.
 */
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
   a.textContent='⚔ 2v2-Kampagne · Online-Test';
   a.title='Gemeinsam mit einem eingeladenen Partner im privaten Online-Raum spielen (Testphase)';
   hero.append(a);
   const backup=document.createElement('button');
   backup.type='button';backup.className='btn tiny';backup.id='arcaneQuickBackup158';
   backup.textContent='⇩ Spielstand als Datei sichern';
   backup.title='Vollständige JSON-Sicherung herunterladen – inklusive Sammlung und Zusatzdaten';
   backup.onclick=()=>{
    if(typeof manualSave==='function')manualSave();
    if(window.ArcaneCompleteBackup155?.exportComplete)window.ArcaneCompleteBackup155.exportComplete();
    else if(typeof exportProfile==='function')exportProfile();
   };
   hero.append(backup);
   const hint=document.createElement('small');
   hint.id='arcaneSaveHint158';hint.className='duo-menu-save-hint';
   hint.textContent='Dein 1v1-Fortschritt wird im Browser automatisch gespeichert. Über „Spielstand als Datei sichern“ kannst du ein Backup herunterladen; 2v2-Räume werden separat online gespeichert.';
   hint.style.cssText='display:block;max-width:760px;margin-top:10px;line-height:1.6;opacity:.86';
   hero.append(hint);
  }
  return result;
 };
 if(uiMode==='menu')renderMenu();
})();
