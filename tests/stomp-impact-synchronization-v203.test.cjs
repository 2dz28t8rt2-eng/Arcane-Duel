'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=relative=>fs.readFileSync(path.resolve(__dirname,'..',relative),'utf8');

test('solo branches fan out only after primary collision; bursts start at end of each ray',()=>{
 const js=read('assets/fusion-stomp-v200.js');
 const css=read('assets/fusion-stomp-v200.css');
 assert.match(js,/host\.classList\.add\('ad-stomp-firing'\);await delay\(260\)/);
 assert.match(js,/host\.classList\.add\('ad-stomp-splitting'\)/);
 assert.match(js,/branch\*55\+'ms'/);
 assert.match(js,/i\*55\+'ms'/);
 assert.match(js,/await delay\(680\);host\.classList\.add\('ad-stomp-afterglow'\);await delay\(200\)/);
 assert.match(css,/\.ad-stomp-splitting \.ad-stomp-secondary\{animation:ad-stomp-branch \.19s[\s\S]*?animation-delay:var\(--stomp-branch-delay,0ms\)/);
 assert.match(css,/\.ad-stomp-splitting \.ad-stomp-impact\.ad-stomp-small\{[\s\S]*?animation-delay:calc\(190ms \+ var\(--stomp-branch-delay,0ms\)\)/);
 assert.match(css,/\.ad-stomp-splitting \.ad-stomp-impact\.ad-stomp-small::before\{[\s\S]*?animation-delay:calc\(190ms/);
 assert.match(css,/\.ad-stomp-splitting \.ad-stomp-impact\.ad-stomp-small::after\{[\s\S]*?animation-delay:calc\(190ms/);
 assert.match(css,/\.ad-stomp-splitting \.ad-stomp-impact\.ad-stomp-small i\{[\s\S]*?animation-delay:calc\(190ms \+ var\(--stomp-branch-delay,0ms\) \+ var\(--stomp-delay,0ms\)\)/);
 assert.match(js,/!destroyed&&foe\.field\[index\]===target/);
 assert.match(js,/Math\.floor\(Math\.max\(0,value\.atk\)\*\.35\)/);
 assert.match(js,/counter=Math\.floor\(base\*\.4\)/);
});

test('Duo staged secondary impacts are delayed consistently across SVG, rings and sparks',()=>{
 const js=read('assets/duo-stomp-cinema-v202.js');
 const css=read('assets/duo-stomp-cinema-v202.css');
 assert.match(js,/branch\*45\+'ms'/);
 assert.match(js,/schedule\(270,\(\)=>stage\.classList\.add\('ad202-splitting'\)\)/);
 assert.match(js,/schedule\(1250,/);
 assert.match(css,/\.ad202-splitting \.ad202-secondary\{animation:ad202-lightning \.24s[\s\S]*?animation-delay:var\(--ad202-branch-delay,0ms\)/);
 assert.match(css,/\.ad202-splitting \.ad202-burst-splash\{[\s\S]*?animation-delay:calc\(240ms \+ var\(--ad202-branch-delay,0ms\)\)/);
 assert.match(css,/\.ad202-splitting \.ad202-burst-splash i\{[\s\S]*?animation-delay:calc\(240ms \+ var\(--ad202-branch-delay,0ms\) \+ var\(--delay,0ms\)\)/);
 assert.doesNotMatch(css,/\.ad202-splitting \.ad202-secondary\{opacity:1;/);
});

test('Solo and Edge Duo Stomp rules share survivor-only 35%-base 40%-splash counter',()=>{
 const solo=read('assets/fusion-stomp-v200.js');
 const duo=read('assets/duo-shared-rules-v160.js');
 const edge=read('supabase/functions/arcane-duo-v2/duo-rules.js');
 assert.equal(duo,edge,'authoritative Edge reducer and local rules must match exactly');
 assert.match(solo,/mode==='def'&&defender&&!immune&&!destroyed&&foe\.field\[index\]===target/);
 assert.match(duo,/mode==='def'&&defender&&!immune&&!destroyed&&enemy\.field\[candidate\.slot\]===target/);
 assert.match(duo,/Math\.floor\(Math\.floor\(oldAttack\*\.35\)\*\.4\)/);
 const guide=read('assets/fusion-stomp-guide-v201.js');
 assert.match(guide,/14 % der aktuellen ATK/);
 assert.doesNotMatch(guide,/selbst nach\s+seiner Zerstörung noch einen Gegenschlag/);
});
