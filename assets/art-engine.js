/* Arcane Duel – Art Engine 2
 * Identitätsstabile SVG-Kartenillustrationen ohne externe Bild-APIs.
 * Jede Kreaturenfamilie besitzt drei verschiedene Anatomien statt nur Farbvarianten.
 * Art, Element, Kartennummer und Seltenheit bestimmen Szene, Ausrüstung und Details.
 */
(function(){
'use strict';
const P=(d,fill='url(#hide)',stroke='url(#edge)',w=3)=>'<path d="'+d+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round"/>';
const O=(cx,cy,rx,ry,fill='url(#hide)',stroke='url(#edge)',w=2)=>'<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+w+'"/>';
const L=(d,w=3,color='url(#edge)')=>P(d,'none',color,w);
const eye=(x,y,r=3)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#fff6ce"/><circle cx="'+(x+1)+'" cy="'+y+'" r="1" fill="#ffffff"/>';
const species={
 bird:[
  P('M111 113 Q69 45 7 64 L52 98 L20 126 L89 126 L116 152 L154 125 L222 125 L188 96 L233 62 Q163 48 130 109 Z')+P('M105 118 L110 67 L133 63 L146 117 L123 143 Z','#18273b')+P('M115 76 L129 77 L123 90 Z','url(#metal)')+eye(131,94)+L('M31 87 L89 112 M213 88 L153 110',3),
  P('M79 165 L97 119 L64 88 L47 41 L91 79 L105 42 L120 12 L136 46 L158 80 L206 39 L182 95 L149 121 L162 168 Z')+P('M94 110 L120 72 L146 109 L134 148 L109 148 Z','#142a3d')+P('M120 84 L142 95 L120 103 Z','url(#metal)')+eye(109,102)+L('M73 112 L40 135 M171 112 L202 136',4),
  P('M40 167 Q51 111 92 105 Q103 75 120 65 Q141 75 154 104 Q195 102 213 169 L166 144 L140 165 L111 140 L72 165 Z')+P('M103 94 L92 58 L112 78 L118 35 L135 79 L151 58 L140 100 Z')+P('M107 112 L138 112 L132 141 L110 144 Z','#1d2837')+eye(111,120)+eye(132,120)+P('M120 134 L130 140 L113 140 Z','url(#metal)')
 ],
 goblin:[
  P('M76 159 L63 122 L73 73 L39 62 L80 58 L99 35 L122 48 L145 35 L166 60 L206 67 L164 81 L176 155 Z')+P('M96 88 L111 99 L95 104 M148 88 L129 99 L148 104','none','#fcde8e',4)+P('M90 120 L124 141 L153 120 L146 150 L100 150 Z','#202537')+L('M65 135 L35 170 M179 132 L206 162',6),
  P('M63 160 Q53 112 90 89 L101 43 L135 34 L157 81 Q192 109 180 159 Z')+P('M82 84 L50 51 L94 69 M158 85 L188 44 L161 66')+O(118,98,29,27,'#18202d')+eye(108,98)+eye(133,98)+P('M104 128 Q127 149 148 127','none','#f3da9c',4),
  P('M64 168 L78 109 L62 80 L89 62 L98 39 L138 39 L151 58 L187 75 L171 103 L184 165 Z')+P('M88 95 Q99 71 113 100 L133 100 Q149 71 158 92','none','#1c2939',8)+L('M105 137 L121 144 L134 137',5)+P('M80 165 L60 135 L41 144 L53 170 M167 165 L181 132 L204 143 L192 170')
 ],
 knight:[
  P('M77 159 L70 96 L84 67 L106 52 L117 28 L130 52 L156 67 L174 97 L163 161 Z')+P('M101 78 L137 78 L141 115 L96 115 Z','#1b2b3a')+L('M103 100 L137 100',4,'#f2d5a0')+P('M174 161 L187 52 L196 34 L206 54 L194 161 Z','url(#metal)')+L('M166 101 L212 101',7),
  P('M59 165 L56 119 L82 72 L103 58 L121 46 L143 62 L162 84 L190 118 L187 164 Z')+P('M83 90 L158 93 L152 135 L91 131 Z','#182537')+eye(106,108)+eye(135,108)+P('M34 89 L69 82 L82 108 L72 149 L40 143 L28 111 Z','url(#metal)')+L('M207 66 L203 164',8),
  P('M90 162 L65 151 L67 99 L94 75 L102 37 L140 37 L151 71 L179 100 L177 150 L146 161 Z')+P('M105 69 L135 69 L138 112 L101 112 Z','#121a2b')+L('M105 96 L135 96',4,'#ddfffa')+P('M98 37 L118 10 L141 36 Z','url(#metal)')+P('M44 124 L71 112 L82 147 L53 164 Z','url(#metal)')+P('M172 154 L204 66 L214 35 L222 72 L191 161 Z','url(#metal)')
 ],
 mage:[
  P('M73 164 Q68 115 84 72 L114 25 L132 25 L165 77 Q183 120 173 164 Z')+P('M94 79 L123 56 L145 82 L139 123 L99 123 Z','#121d2b')+eye(107,95)+eye(134,95)+L('M169 160 L195 48',7,'url(#metal)')+P('M197 45 L172 33 L198 7 L218 34 Z','url(#edge)'),
  P('M42 164 L59 117 L91 102 L87 65 L121 39 L161 60 L149 112 L185 128 L210 164 Z')+P('M96 83 Q117 68 143 85 L135 123 L102 123 Z','#182030')+eye(111,97)+eye(128,97)+P('M45 120 L27 79 L67 69 L71 117 Z','url(#metal)')+O(182,82,18,18,'url(#glow)'),
  P('M67 160 L53 137 L86 89 L99 44 L143 43 L161 89 L189 135 L171 162 Z')+P('M105 59 L122 26 L139 60 Z','url(#metal)')+P('M96 84 L144 85 L134 116 L110 116 Z','#111a26')+L('M108 98 L130 98',3,'#fff0b9')+L('M60 158 L32 108 L14 111 M180 158 L207 102 L228 106',5)
 ],
 dragon:[
  P('M112 87 Q57 18 18 25 L47 67 L16 91 L94 124 L110 145 L158 125 L223 86 L190 72 L226 25 Q171 30 133 83 Z')+P('M105 102 L104 63 L124 38 L150 62 L174 75 L159 117 Z','#172132')+P('M115 54 L100 13 L129 41 L147 13 L150 56')+eye(148,90)+L('M147 134 Q181 144 204 172',9),
  P('M55 147 Q35 94 80 87 L130 74 L146 38 L176 48 L202 74 L170 95 L126 121 Q101 156 57 161 Z')+P('M96 94 L31 37 L75 62 L85 28 L123 82 Z')+P('M170 92 L227 27 L205 83 L230 94 L178 120 Z')+eye(174,70)+L('M75 147 Q32 177 16 146',9),
  P('M85 151 Q41 140 61 101 Q71 78 111 83 Q159 95 171 59 Q176 29 201 36 Q219 52 199 79 Q174 109 134 119 Q106 130 137 152 Q177 162 197 132','none','url(#edge)',34)+L('M83 151 Q45 127 76 103 Q91 87 129 106 Q166 114 182 58',5)+P('M179 43 L195 15 L205 48 M182 77 L211 82 L225 97 L194 101')+eye(191,53)
 ],
 wolf:[
  P('M61 165 L65 87 L51 35 L95 58 L118 36 L147 60 L191 35 L178 90 L195 165 Z')+P('M88 99 L119 111 L149 98 L155 136 L117 152 L83 135 Z','#1e2937')+eye(100,102)+eye(139,102)+L('M111 134 L121 141 L133 132',4),
  P('M25 157 L70 117 L103 101 L115 67 L134 77 L155 99 L179 113 L215 153 L202 171 L42 168 Z')+P('M92 111 L79 58 L112 80 L137 56 L159 101')+P('M162 122 L217 108 L194 140 Z','#203349')+eye(143,105)+L('M54 161 L48 180 M98 158 L101 179 M169 161 L172 178',5),
  P('M50 169 L65 116 L60 51 L94 66 L114 32 L148 65 L184 47 L180 113 L193 169 Z')+P('M88 79 L109 61 L124 86 L144 64 L163 87 Z','url(#metal)')+O(120,129,30,24,'#142335')+eye(102,113)+eye(141,113)+P('M103 146 L119 159 L135 146','none','#f9d7ac',4)
 ],
 golem:[
  P('M56 165 L48 109 L67 53 L108 28 L143 35 L174 67 L192 120 L172 164 Z')+P('M84 63 L157 69 L150 120 L90 120 Z','#152334')+L('M103 92 L140 94',7,'#f9dba0')+P('M48 106 L19 119 L29 153 L65 145 M185 107 L221 126 L204 159 L173 148'),
  P('M54 162 L64 117 L44 80 L82 47 L117 58 L145 26 L184 66 L174 120 L194 157 Z')+P('M91 81 L142 75 L153 119 L102 126 Z','#1f3340')+eye(114,94,5)+eye(139,93,5)+L('M78 139 L156 137',5)+P('M117 23 L118 4 L138 24'),
  P('M71 164 L57 149 L79 103 L76 75 L104 60 L115 23 L149 36 L162 78 L184 125 L171 166 Z')+P('M79 88 L52 78 L28 107 L61 126 M166 92 L192 83 L214 104 L180 125')+P('M104 77 L149 79 L134 119 L113 112 Z','#0d2233')+eye(115,91,4)+eye(135,92,4)+L('M117 133 L131 159',7)
 ],
 insect:[
  P('M112 91 Q71 11 27 50 Q14 111 105 122 Q44 150 82 163 L122 132 L153 168 Q198 157 137 121 Q226 104 214 46 Q163 11 128 88 Z')+O(120,121,16,37,'#1c2838')+L('M116 84 L90 24 M129 85 L153 24',4)+eye(112,105)+eye(130,105),
  P('M108 85 L77 43 L34 52 L54 111 L101 125 L62 159 L103 146 L119 165 L136 146 L174 159 L149 119 L201 111 L216 50 L162 42 L132 86 Z')+P('M103 93 L119 31 L136 94 L129 152 L113 152 Z','#102b37')+L('M94 112 L46 80 M148 112 L196 80 M113 135 L65 164 M132 135 L179 164',4)+eye(116,86),
  O(119,115,27,44)+P('M108 84 L61 64 L26 84 L72 120 L97 114 M132 84 L184 61 L213 83 L171 122 L143 116')+P('M112 72 L110 33 L90 18 M131 74 L136 33 L156 17','none','url(#edge)',5)+L('M109 146 L77 172 M134 146 L165 171 M102 124 L52 133 M140 124 L190 133',4)+eye(112,101)+eye(128,101)
 ],
 serpent:[
  P('M61 161 Q22 119 84 91 Q146 60 110 35 Q97 8 128 18 Q182 27 147 83 Q120 112 92 122 Q68 149 113 152','none','url(#edge)',35)+P('M152 82 L187 58 L208 73 L182 94 L207 105 L181 118 L151 107 Z')+eye(187,84)+L('M50 140 Q70 153 94 147',5),
  P('M44 157 Q31 112 82 120 Q115 128 142 104 Q157 86 142 57 L157 21 L177 52 L187 83 L211 103 L190 124 L160 113 Q124 154 82 157 Z')+P('M162 56 L126 32 L155 42 M187 83 L219 61 L207 92')+eye(187,105)+L('M50 147 Q98 143 111 133',5),
  P('M57 169 Q28 140 55 92 Q85 61 122 69 Q165 89 176 45 Q181 21 203 40 Q228 62 208 91 Q179 117 132 117 Q96 117 103 148 Q123 159 150 158','none','url(#edge)',29)+P('M188 46 L173 15 L203 35 L217 20 L222 62')+eye(201,59)+L('M62 98 Q95 82 128 95',4)
 ],
 stag:[
  P('M83 164 L90 92 L115 70 L141 85 L154 165 Z')+L('M96 88 L93 34 L58 16 M94 54 L59 57 M141 88 L148 34 L186 16 M145 55 L183 60',7)+P('M105 102 L116 112 L135 102 L132 141 L115 150 L101 133 Z','#1d2b3d')+eye(108,117)+eye(129,116),
  P('M66 162 L76 118 L110 92 L131 67 L160 78 L169 111 L191 163 Z')+L('M138 74 L141 25 L178 11 M144 52 L193 41 M157 88 L199 64',6)+P('M132 92 L157 98 L164 131 L131 140 Z','#243142')+eye(153,110)+L('M105 143 L116 169',7),
  P('M86 166 L76 129 L91 79 L120 63 L150 80 L162 124 L151 166 Z')+L('M107 72 L81 30 L47 26 M96 53 L66 57 M137 72 L164 25 L196 24 M149 52 L181 56',7)+P('M108 96 L134 96 L144 136 L118 150 L95 129 Z','#1d2833')+eye(110,110)+eye(132,110)+P('M107 155 L94 172 M142 154 L155 172')
 ],
 ray:[
  P('M119 38 Q80 86 11 87 Q70 112 85 159 L118 139 L159 159 Q171 111 229 88 Q160 80 119 38 Z')+L('M119 137 Q148 167 121 181',5)+eye(110,92)+eye(133,92),
  P('M29 102 Q93 94 123 51 Q165 94 211 97 L186 137 L133 125 L121 175 L103 124 L54 137 Z')+L('M122 171 Q113 180 126 183',3)+eye(113,103)+eye(137,103)+L('M53 105 L104 111 M145 112 L195 104',3),
  P('M20 117 L85 63 L117 36 L160 64 L220 119 L167 113 L144 148 L115 131 L86 151 L57 114 Z')+O(120,87,19,15,'#1a2639')+eye(113,86)+eye(129,86)+L('M120 133 L107 179',5)
 ],
 spirit:[
  P('M120 17 Q178 31 165 91 Q164 116 190 143 L162 131 L148 168 L128 148 L116 179 L98 149 L72 168 L76 127 L51 137 Q73 111 79 86 Q69 32 120 17 Z')+P('M97 76 Q107 63 118 84 Q132 62 147 77 L137 98 L108 99 Z','#e5e9ec')+eye(111,85)+eye(135,85),
  P('M112 19 L148 52 L156 89 L190 119 L175 143 L196 163 L152 157 L124 177 L103 152 L59 158 L79 131 L51 113 L89 81 Z')+O(124,89,28,26,'#152b45')+eye(114,84)+eye(137,84)+L('M105 118 L137 118',3),
  P('M94 172 L66 132 L86 112 L58 82 L81 53 L106 37 L122 9 L143 38 L171 55 L177 82 L153 116 L177 137 L142 175 L117 151 Z')+P('M101 80 L122 55 L147 83 L133 112 L114 113 Z','#1d2439')+eye(115,85)+eye(132,85)+L('M113 137 L135 137',4)
 ]
};
const backgrounds={
 FEUER:(s)=>P('M0 148 L39 110 L67 130 L105 79 L145 141 L200 100 L240 151 L240 184 L0 184 Z','#2b1825','none')+L('M34 173 L57 149 L82 173 M153 164 L181 140 L204 172',5,'#f7a162'),
 ERDE:(s)=>P('M0 164 L35 134 L63 150 L106 103 L153 145 L190 114 L240 157 L240 184 L0 184 Z','#142c2a','none')+L('M20 140 L20 97 M212 138 L212 78',9,'#416954'),
 WASSER:(s)=>P('M0 135 Q30 112 60 136 T120 131 T180 139 T240 133 L240 184 L0 184 Z','#123047','none')+L('M7 148 Q33 138 61 150 T121 149 T185 153 T234 145',3,'#73cee8'),
 WIND:(s)=>L('M-7 65 Q35 44 78 67 M156 39 Q203 18 251 36 M10 153 Q66 133 99 144',7,'#748fae')+P('M0 179 L69 154 L120 164 L200 149 L240 169 L240 184 L0 184 Z','#132838','none'),
 LICHT:(s)=>P('M37 184 L45 57 L60 57 L68 184 M177 184 L185 57 L201 57 L209 184','none','#98866d',10)+L('M12 45 Q120 -9 228 45',6,'#c7ac81')+O(121,75,49,49,'none','#f8d7a2',3),
 DUNKEL:(s)=>O(190,29,21,21,'#baafd8','none')+P('M0 180 L30 142 L57 161 L86 112 L114 162 L178 105 L225 151 L240 142 L240 184 L0 184 Z','#161d36','none')
};
const hash=(id,salt=0)=>{let x=((id+1)*2654435761+salt*2246822519)>>>0;x^=x>>>15;x=Math.imul(x,2246822519);x^=x>>>13;return x>>>0};
function gear(c,variant){
 const choice=hash(c.id,4)%7;
 const palette=c.fusionOnly?'#f5dda4':'#9dcbd5';
 const elements=[
 L('M51 144 L43 87 L29 78 M43 87 L61 73',5,palette),
 P('M176 69 L201 81 L207 114 L191 144 L172 117 Z','url(#metal)')+L('M175 104 L202 103',3),
 P('M108 23 L120 4 L132 23 L144 15 L143 34 L98 34 L96 13 Z','url(#metal)'),
 O(35,82,17,17,'url(#glow)',palette,3)+L('M35 48 L35 25',3,palette),
 P('M184 23 L196 42 L217 43 L201 59 L204 81 L185 69 L166 78 L169 59 L152 45 L174 41 Z','url(#glow)',palette,2),
 L('M42 120 Q24 93 45 77 M196 120 Q217 95 196 70',7,palette),
 P('M115 18 L124 32 L142 34 L131 49 L137 67 L118 58 L101 68 L105 47 L94 35 L113 31 Z','url(#metal)')
 ];
 return elements[choice];
}
function sigil(c){const x=11+(hash(c.id,10)%19),count=3+hash(c.id,13)%5;let a='';for(let i=0;i<count;i++){const ang=(i*6.283/count);const xx=120+Math.cos(ang)*84,yy=89+Math.sin(ang)*65;a+=O(xx.toFixed(1),yy.toFixed(1),2+(i%2),2+(i%2),'#fff0c9','none',0);}return a+L('M'+x+' 168 L'+(x+15)+' 168',2,'#dfb87b');}
/* Das SVG enthält selbst einen Innenrahmen. Er muss die TCG-Kategorie
 * spiegeln, sonst überdeckt sein bisheriger Goldton die Kartenrahmen. */
const cardFrameColors=['#c7cbd1','#cdb58b','#95c887','#70c7b3',
 '#7ebfe6','#729ce4','#868cdb','#b48bdd','#d78cc4',
 '#e4a370','#df8668','#e26c71'];
function artFrameColor(c){
 if(c.id<20)return '#dce4ee';
 if(c.fusionOnly||c.manifestOf!=null)return '#b8a0f3';
 const level=Math.max(1,Math.min(12,Math.trunc(Number(c.level)||1)));
 return cardFrameColors[level-1];
}
function makeArt(c){
 const id=c.id||0,variant=hash(id,0)%3,kind=species[c.kind]?c.kind:'spirit';
 const figure=species[kind][variant],env=backgrounds[c.element]||backgrounds.DUNKEL;
 const flip=hash(id,9)%2?-1:1,scale=.87+(hash(id,11)%8)*.018,dx=(hash(id,12)%17)-8;
 const elite=!!c.fusionOnly||c.manifestOf!=null||c.level>=7,frameTone=artFrameColor(c);
 const ambient=Array.from({length:12},(_,i)=>{const x=hash(id,i)%240,y=hash(id,i+32)%184;return O(x,y,(i%3)+1,(i%3)+1,'#fff2cb','none',0)}).join('');
 const titleMark=elite?O(120,92,80,74,'none','#f5d598',2)+P('M119 9 L133 28 L120 44 L106 27 Z','url(#metal)'):'';
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 184" role="img" aria-label="Kartenillustration">'+
 '<defs><radialGradient id="sky"><stop stop-color="'+c.color+'" stop-opacity=".51"/><stop offset=".7" stop-color="#1b2c45"/><stop offset="1" stop-color="#080d17"/></radialGradient>'+
 '<linearGradient id="hide"><stop stop-color="'+c.color+'"/><stop offset=".38" stop-color="#64738c"/><stop offset="1" stop-color="#16263a"/></linearGradient>'+
 '<linearGradient id="edge"><stop stop-color="#fff0c8"/><stop offset=".6" stop-color="'+c.color+'"/><stop offset="1" stop-color="#62748f"/></linearGradient>'+
 '<linearGradient id="metal"><stop stop-color="#f4e4b5"/><stop offset=".48" stop-color="#7996a6"/><stop offset="1" stop-color="#273a52"/></linearGradient>'+
 '<radialGradient id="glow"><stop stop-color="#fff9d3"/><stop offset=".28" stop-color="'+c.color+'"/><stop offset="1" stop-color="'+c.color+'" stop-opacity=".08"/></radialGradient>'+
 '<filter id="halo" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter></defs>'+
 '<rect width="240" height="184" fill="url(#sky)"/>'+env(id)+
 O(120,88,73+(id%4)*4,69+(id%3)*4,'none',c.color,1)+ambient+titleMark+
 '<g transform="translate('+(120+dx)+' 96) scale('+(flip*scale)+' '+scale+') translate(-120 -96)">'+
 O(123,113,56,40,c.color,'none',0).replace('"/>','" opacity=".14" filter="url(#halo)"/>')+
 figure+gear(c,variant)+
 '</g>'+sigil(c)+
 '<rect x="3" y="3" width="234" height="178" rx="6" fill="none" stroke="'+frameTone+'" stroke-width="'+(elite?3:2)+'" opacity=".94"/>'+
 '<path d="M8 26 V8 H32 M208 8 H232 V26 M8 156 V176 H32 M208 176 H232 V156" fill="none" stroke="'+frameTone+'" stroke-width="2.4"/>'+
 '</svg>';
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
window.ArcaneArt={makeArt,frameColor:artFrameColor,variantForId:id=>hash(id,0)%3,version:'2.1',variantsPerSpecies:3,speciesCount:Object.keys(species).length};
})();