
const f=document.getElementById('arcane'),report=document.getElementById('report');
report.textContent='Prüfskript gestartet';
let started=false,tries=0;
const run=async()=>{
 if(started||!f.contentWindow?.ArcaneAscensionForge116)return;
 started=true;
 const w=f.contentWindow,d=f.contentDocument,notes=[];let ok=true;
 const check=(v,s)=>{notes.push((v?'OK ':'FAIL ')+s);if(!v)ok=false;report.textContent=notes.join('\n')};
 try{
  w.eval('profile=freshProfile();profile.cleared=[1,2,3,4,5];profile.trainingWins=3;profile.coins=100000;profile.activeDuel=null;game=null;uiMode="menu";menuTab="workshop";const item=CARDS.find(c=>c.rpg&&c.level===8&&!c.ace&&!c.enemyOnly&&!c.fusionOnly&&!c.retired&&!c.essenceMonster&&!c.hard&&!c.questOnly&&!c.trainingReward&&!c.milestoneOnly&&!c.lv1Exclusive&&!c.fateOnly);for(let i=0;i<9;i++)addCard(item.id);renderMenu();');
  const intro=d.getElementById('modal');
  check(intro.textContent.includes('AUFSTIEGSSCHMIEDE')&&intro.textContent.includes('V'),'Popup nach V erscheint');
  check(w.eval('profile.ascensionIntroSeen'), 'Einmalige Einführung als gesehen markiert');
  d.getElementById('ad116IntroClose')?.click();
  const shop=d.getElementById('ascensionForge116');
  check(!!shop&&shop.textContent.includes('60 %')&&shop.textContent.includes('40 %'),'Werkstatt mit 60/40-Wahrscheinlichkeit');
  const select=shop?.querySelector('#ad116Level');
  if(select){select.value='8';select.dispatchEvent(new w.Event('change',{bubbles:true}));}
  const forgeButton=d.querySelector('[data-ad116-forge]');
  check(!!forgeButton&&!forgeButton.disabled,'Schmiedeknopf aktiviert; Inventar gültig: '+w.eval('JSON.stringify({ids:[...document.querySelectorAll("[data-ad116-material]")].map(x=>x.value),choices:window.ArcaneAscensionForge116.inputPool(8).length})')));
  const before=w.eval('profile.coins');
  d.querySelector('[data-ad116-forge]')?.click();
  check(d.getElementById('modal').textContent.includes('Drei Karten dauerhaft verschmelzen'),'Bestätigungsfenster vorhanden');
  d.getElementById('ad116Confirm')?.click();
  const result=w.eval('profile.ascensionHistory[0]');
  check(!!result&&result.level===9,'Echte Lv9-Karte nach Verschmelzung erzeugt');
  check(w.eval('profile.coins')<before,'Ressourcen tatsächlich verbraucht');
  check(d.getElementById('modal').textContent.includes('AUFSTIEG VOLLENDET'),'Neue Karte in sichtbarer Belohnungsansicht');
  w.eval('menuTab="workshop";renderMenu()');
  check(!d.getElementById('modal').textContent.includes('Neue Funktion nach Turniergegner V'),'Freischaltungs-Popup wird nicht erneut angezeigt');
 }catch(e){check(false,String(e.stack||e));}
 document.body.dataset.arcane116=ok?'pass':'fail';
};
f.addEventListener('load',run);
const poll=setInterval(()=>{if(started){clearInterval(poll);return;}run();if(++tries%10===0){let status='unbekannt';try{status='readyState='+f.contentDocument?.readyState+' / module='+!!f.contentWindow?.ArcaneAscensionForge116;}catch(e){status=String(e);}report.textContent='Auf Spiel warten: '+status;}},120);
