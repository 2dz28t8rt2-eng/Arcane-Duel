/* Arcane Duel v20.8 · Künstlerdanksagung, Audio-, Musik- und Bildnachweise.
 * Die Quellenlinks bleiben auch ohne spielbare Audiodateien sichtbar.
 */
'use strict';
(()=>{
 const sound=[
  ['Little Robot Sound Factory','Sci-Fi Sound Effects Library · Fusion, Beschwörung, Zerstörung, Spielerschaden, Menü, Sieg & Niederlage','CC BY 3.0','https://opengameart.org/content/sci-fi-sound-effects-library','https://www.littlerobotsoundfactory.com'],
  ['The Berklee College of Music','Shimmer glitter magic · Kartenziehen','CC BY 3.0','https://opengameart.org/content/shimmer-glitter-magic'],
  ['Darsycho','Big scary troll sounds · Rudelführer-Auftritt & -Umgebung','CC0 1.0','https://opengameart.org/content/big-scary-troll-sounds'],
  ['IgnisForge','Free SFX Sampler · Zerfall, Buff & Fusionsberechnung','Lizenz siehe Quellseite','https://opengameart.org/content/ignisforge-free-sfx-sampler-43-synthesized-retro-sound-effects']
 ];
 const music=[
  ['Fato Shadow','Morningstar · Titelmusik','CC BY 3.0','https://opengameart.org/content/morningstar-soundtrack-electronic'],
  ['David KBD','Code Injection · 13 Kampftitel und „There’s Someone Here“','CC BY 4.0','https://davidkbd.itch.io/code-injection-dark-techno-music-pack'],
  ['Vishwa Jay','MorningAttack · Bossmusik','CC0 1.0','https://opengameart.org/content/doom-in-the-morning'],
  ['Eric Matyas','Enemy Infiltration','CC BY 3.0','https://opengameart.org/content/enemy-infiltration-looping'],
  ['HorrorPen','Dramatic Action','CC BY 3.0','https://opengameart.org/content/dramatic-action'],
  ['Matthew Pablo','Space Dimensions (8bit/Retro Version)','CC BY 3.0','https://opengameart.org/content/space-dimensions-8bitretro-version'],
  ['neocrey','Droid Glitch','CC BY-SA 3.0','https://opengameart.org/content/neocrey-droid-glitch']
 ];
 function element(tag,css,text,at){const el=document.createElement(tag);if(css)el.className=css;
  if(text!==undefined)el.textContent=text;if(at)at.append(el);return el;}
 function link(label,url,at){const a=element('a','',label,at);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
 function section(root,title,items){const block=element('section','ad208-credit-section',undefined,root);element('h3','',title,block);
  for(const [artist,work,license,url,extra] of items){
   const item=element('div','ad208-credit-item',undefined,block);
   element('strong','',artist,item);element('span','',work,item);
   const foot=element('small','',license+' · ',item);link('Quelle',url,foot);if(extra){element('span','', ' · ',foot);link('Website',extra,foot);}
  }
 }
 const title=document.getElementById('ad196-title');
 const host=title?.querySelector('.ad196-panel');if(!host||document.getElementById('ad208-credits'))return;
 const panel=element('section','ad208-credits',undefined,host);panel.id='ad208-credits';
 panel.hidden=true;panel.setAttribute('aria-label','Credits und Quellen');panel.tabIndex=-1;
 element('div','ad208-eyebrow','DAS VERMÄCHTNIS DER KÜNSTLER',panel);
 element('h2','','Credits',panel);
 element('p','ad208-thanks','Ein großes Dankeschön an alle Künstlerinnen und Künstler, deren Musik, Geräusche und Illustrationen Arcane Duel eine eigene Atmosphäre verleihen. Eure Arbeit macht diese Spielwelt lebendig.',panel);
 section(panel,'Soundeffekte',sound);section(panel,'Musik',music);
 const art=window.ArcaneArtAttribution||{};
 const unique=new Map();
 for(const entry of Object.values(art))if(entry?.author&&entry?.sourcePage){
  const key=entry.author+'|'+entry.sourcePage;
  if(!unique.has(key))unique.set(key,[entry.author,'Kartenillustration · bearbeiteter Zuschnitt',entry.license||'Lizenz siehe Quelle',entry.sourcePage]);
 }
 const artworks=Array.from(unique.values()).sort((a,b)=>a[0].localeCompare(b[0],'de'));
 if(artworks.length)section(panel,'Illustrationen',artworks);
 element('p','ad208-credit-note','Namensnennung und Quelle gelten für die jeweiligen Werke. Die vollständigen Lizenznachweise stehen ergänzend in den Projektdateien unter assets/music-v014/SOURCE_AND_LICENSES.md und docs/ART_LICENSES_OPENART.md.',panel);
 const back=element('button','ad208-back','Zurück zum Hauptmenü',panel);back.type='button';back.dataset.ad196Action='back';
})();
