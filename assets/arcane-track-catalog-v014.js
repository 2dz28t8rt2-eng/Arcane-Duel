/* Arcane Duel 0.1.4 · Licensed soundtrack catalog.
 * Each item preserves its author, source and license for in-game credits.
 * The optional audio files live in assets/music-v014/; no network streams.
 */
'use strict';
(()=>{
 const base='assets/music-v014/';
 const by=(id,title,artist,file,source,license,licenseUrl)=>Object.freeze({id,title,artist,file:base+file,source,license,licenseUrl});
 const david='https://davidkbd.itch.io/code-injection-dark-techno-music-pack';
 const cc4='https://creativecommons.org/licenses/by/4.0/';
 const cc3='https://creativecommons.org/licenses/by/3.0/';
 const tracks=Object.freeze({
  title:by('morningstar','Morningstar','Fato Shadow','title/morningstar.mp3','https://opengameart.org/content/morningstar-soundtrack-electronic','CC BY 3.0',cc3),
  menu:by('theres-someone-here','There’s Someone Here','David KBD','menu/theres-someone-here.ogg',david,'CC BY 4.0',cc4),
  boss:by('morning-attack','MorningAttack','Vishwa Jay','boss/morning-attack.mp3','https://opengameart.org/content/doom-in-the-morning','CC0','https://creativecommons.org/publicdomain/zero/1.0/'),
  battle:Object.freeze([
   by('underbeat','Underbeat','David KBD','battle/underbeat.ogg',david,'CC BY 4.0',cc4),
   by('behind-the-darkness','Behind the Darkness','David KBD','battle/behind-the-darkness.ogg',david,'CC BY 4.0',cc4),
   by('synthetic-whisper','Synthetic Whisper','David KBD','battle/synthetic-whisper.ogg',david,'CC BY 4.0',cc4),
   by('secret-dissonance','Secret Dissonance','David KBD','battle/secret-dissonance.ogg',david,'CC BY 4.0',cc4),
   by('into-the-code-abyss','Into the Code Abyss','David KBD','battle/into-the-code-abyss.ogg',david,'CC BY 4.0',cc4),
   by('electric-inferno','Electric Inferno','David KBD','battle/electric-inferno.ogg',david,'CC BY 4.0',cc4),
   by('binary-chaos','Binary Chaos','David KBD','battle/binary-chaos.ogg',david,'CC BY 4.0',cc4),
   by('sentinel-cloud','Sentinel Cloud','David KBD','battle/sentinel-cloud.ogg',david,'CC BY 4.0',cc4),
   by('ghost-steps','Ghost Steps','David KBD','battle/ghost-steps.ogg',david,'CC BY 4.0',cc4),
   by('space-echoes','Space Echoes','David KBD','battle/space-echoes.ogg',david,'CC BY 4.0',cc4),
   by('ias-growl','I.A.’s Growl','David KBD','battle/ias-growl.ogg',david,'CC BY 4.0',cc4),
   by('faceless-crowd','Faceless Crowd','David KBD','battle/faceless-crowd.ogg',david,'CC BY 4.0',cc4),
   by('between-everyone-and-anyone','Between Everyone and Anyone','David KBD','battle/between-everyone-and-anyone.ogg',david,'CC BY 4.0',cc4),
   by('enemy-infiltration','Enemy Infiltration','Eric Matyas','battle/enemy-infiltration.mp3','https://opengameart.org/content/enemy-infiltration-looping','CC BY 3.0',cc3),
   by('dramatic-action','Dramatic Action','HorrorPen','battle/dramatic-action.mp3','https://opengameart.org/content/dramatic-action','CC BY 3.0',cc3),
   by('n-dimensions','Space Dimensions (Retro)','Matthew Pablo','battle/n-dimensions.mp3','https://opengameart.org/content/space-dimensions-8bitretro-version','CC BY 3.0',cc3),
   by('droid-glitch','Droid Glitch','neocrey','battle/droid-glitch.ogg','https://opengameart.org/content/neocrey-droid-glitch','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/')
  ])
 });
 const all=Object.freeze([tracks.title,tracks.menu,tracks.boss,...tracks.battle]);
 window.ArcaneTrackCatalog=Object.freeze({tracks,all});
 function installCredits(){
  if(document.getElementById('ad014-music-credits'))return;
  const dialog=document.createElement('dialog');dialog.id='ad014-music-credits';dialog.className='ad014-credits-dialog';
  const heading=document.createElement('h2');heading.textContent='Musik & Künstler · Arcane Duel';dialog.append(heading);
  const notice=document.createElement('p');notice.textContent='Danke an die Künstler, die ihre Werke unter freien Lizenzen bereitstellen. Die Originale wurden für dieses Spiel ausgewählt; Namensnennung, Quellen und Lizenzen bleiben sichtbar.';dialog.append(notice);
  const list=document.createElement('ul');
  for(const track of all){
   const li=document.createElement('li');
   const title=document.createElement('strong');title.textContent=track.title+' — '+track.artist;li.append(title);
   const source=document.createElement('a');source.href=track.source;source.target='_blank';source.rel='noopener noreferrer';source.textContent='Quelle';li.append(source);
   const license=document.createElement('a');license.href=track.licenseUrl;license.target='_blank';license.rel='noopener noreferrer';license.textContent=track.license;li.append(license);
   list.append(li);
  }
  dialog.append(list);
  const close=document.createElement('button');close.type='button';close.textContent='Schließen';close.addEventListener('click',()=>dialog.close());dialog.append(close);
  dialog.addEventListener('keydown',event=>event.stopPropagation());document.body.append(dialog);
  const button=()=>{const btn=document.createElement('button');btn.type='button';btn.textContent='♫ Musik-Credits';btn.className='btn ghost tiny ad014-credits-button';btn.addEventListener('click',()=>dialog.showModal());return btn;};
  const host=document.querySelector('.mast-actions')||document.querySelector('.ad185-header-nav');
  host?.append(button());
  const titleOptions=document.getElementById('ad196-settings');titleOptions?.insertBefore(button(),titleOptions.lastElementChild);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installCredits,{once:true});else installCredits();
})();
