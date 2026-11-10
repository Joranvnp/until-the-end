/* eslint-disable */
// Généré par scripts/sync-game.mjs depuis www/index.html : ne pas modifier à la main.
export default function createGame(env) {
  const { window, document, navigator, localStorage, performance, addEventListener, Image, fetch, innerWidth, innerHeight, location, ResizeObserver, visualViewport, requestAnimationFrame, setTimeout, atob, btoa } = env;
  return (function () {

'use strict';
// =====================================================================
//  UNTIL THE END — reconstruction web (Terraria-like stratégique)
// =====================================================================
const cv=document.getElementById('c'), ctx=cv.getContext('2d');
const T=16, WW=440, WH=150, GRAV=900, JUMP=300;
const UIF='"Pixelify Sans", ui-monospace, monospace', TITF='"Press Start 2P", ui-monospace, monospace';
let S=4, VW=480, VH=270;
const wc=document.createElement('canvas'), w=wc.getContext('2d');
function resize(){
  const d=window.devicePixelRatio||1;
  const r=cv.getBoundingClientRect(),cw=r.width||innerWidth,ch=r.height||innerHeight;
  cv.width=Math.floor(cw*d); cv.height=Math.floor(ch*d);
  S=Math.max(1,Math.floor(Math.min(cv.width,cv.height)/250));
  // Tablette tactile : au moins ~360 px logiques de haut pour loger HUD + commandes sans chevauchement.
  if((('ontouchstart' in window)||navigator.maxTouchPoints>0)&&Math.min(cw,ch)>=600)S=Math.max(1,Math.min(S,Math.floor(cv.height/360)));
  // Fenêtre PC étroite (presque carrée) : garder ~400 px logiques de large pour le HUD complet, sans descendre sous 1,5 px écran par pixel.
  else if(!(('ontouchstart' in window)||navigator.maxTouchPoints>0))S=Math.min(S,Math.max(Math.ceil(1.5*d),Math.floor(cv.width/400)));
  VW=Math.ceil(cv.width/S); VH=Math.ceil(cv.height/S);
  wc.width=VW; wc.height=VH;
}
addEventListener('resize',resize); addEventListener('orientationchange',()=>setTimeout(resize,250)); resize();
// La toile peut changer de taille sans événement resize (zone sûre appliquée après le démarrage dans l'app, rotation sur iOS) :
// sans ça, l'image est étirée et les touches tombent à côté des boutons.
if(window.ResizeObserver)new ResizeObserver(()=>{const r=cv.getBoundingClientRect(),d=window.devicePixelRatio||1;if(Math.abs(cv.width-Math.floor(r.width*d))>1||Math.abs(cv.height-Math.floor(r.height*d))>1)resize()}).observe(cv);
if(window.visualViewport)visualViewport.addEventListener('resize',resize);

// ---------- utilitaires ----------
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let SEED=1337, rnd=mulberry(SEED);
const R=(a,b)=>a+rnd()*(b-a), RI=(a,b)=>Math.floor(a+rnd()*(b-a+1));
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
function hash2(x,y){let h=(x*374761393+y*668265263+SEED*1442695)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296}
function vn1(x,s=0){const i=Math.floor(x),f=x-i,u=f*f*(3-2*f);return hash2(i,s)*(1-u)+hash2(i+1,s)*u}
function fbm1(x,s=0){let v=0,a=.5,f=1;for(let i=0;i<4;i++){v+=a*vn1(x*f,s+i*31);a*=.5;f*=2}return v/.9375}
function vn2(x,y,s){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);
  const a=hash2(ix+s*7919,iy),b=hash2(ix+1+s*7919,iy),c=hash2(ix+s*7919,iy+1),d=hash2(ix+1+s*7919,iy+1);
  return (a*(1-ux)+b*ux)*(1-uy)+(c*(1-ux)+d*ux)*uy}
function fbm2(x,y,s,o=4){let v=0,a=.5,f=1,t=0;for(let i=0;i<o;i++){v+=a*vn2(x*f,y*f,s+i*13);t+=a;a*=.5;f*=2}return v/t}
function mk(wd,ht){const c=document.createElement('canvas');c.width=wd;c.height=ht;return c}
function hex(h){h=h.replace('#','');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
function rgb(a){return`rgb(${a[0]|0},${a[1]|0},${a[2]|0})`}
function shade(h,f){const c=hex(h);return rgb(c.map(v=>clamp(f>0?v+(255-v)*f:v*(1+f),0,255)))}
function mixc(a,b,t){const A=hex(a),B=hex(b);return rgb(A.map((v,i)=>lerp(v,B[i],t)))}
// contour sombre autour des pixels opaques (lisibilité pixel art)
function outline(c,col='#120e1c'){
  const g=c.getContext('2d'),id=g.getImageData(0,0,c.width,c.height),d=id.data,W=c.width,H=c.height,o=new Uint8ClampedArray(d);
  const oc=hex(col);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(d[i+3]>0)continue;
    let n=false;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<W&&Y<H&&d[(Y*W+X)*4+3]>128){n=true;break}}
    if(n){o[i]=oc[0];o[i+1]=oc[1];o[i+2]=oc[2];o[i+3]=255}}
  id.data.set(o);g.putImageData(id,0,0);return c}
function flipC(c){const f=mk(c.width,c.height),g=f.getContext('2d');g.translate(c.width,0);g.scale(-1,1);g.drawImage(c,0,0);return f}

// ---------- tuiles ----------
const VINE=21,MUSH=22,CPLANT=23,WATER=24,CHEST=25;
const AIR=0,GRASS=1,DIRT=2,STONE=3,COAL=4,COPPER=5,IRON=6,SILVER=7,GOLD=8,DIAMOND=9,DEEP=10,BEDROCK=11,LOG=12,LEAF=13,PLANK=14,BRICK=15,SNOW=16,CASTLE=17,TORCH=18,PLANT=19,CRYSTAL=20;
const TD=[];
function def(id,o){TD[id]=Object.assign({solid:true,hard:1,tier:0,drop:null,n:'',mm:'#070914',light:0},o)}
def(AIR,{solid:false,hard:0,mm:null});
def(GRASS,{n:'Herbe',hard:.5,drop:'dirt',mm:'#63ebca'});
def(DIRT,{n:'Terre',hard:.5,drop:'dirt',mm:'#1f6f78'});
def(STONE,{n:'Pierre',hard:1.4,tier:1,drop:'stone',mm:'#2b3a8a'});
def(COAL,{n:'Charbon',hard:1.6,tier:1,drop:'coal',mm:'#5147ad'});
def(COPPER,{n:'Cuivre',hard:2,tier:1,drop:'copper',mm:'#ff874c'});
def(IRON,{n:'Fer',hard:2.8,tier:2,drop:'iron',mm:'#718bff'});
def(SILVER,{n:'Argent',hard:3.2,tier:2,drop:'silver',mm:'#55caff'});
def(GOLD,{n:'Or',hard:4,tier:3,drop:'gold',mm:'#ffcf47'});
def(DIAMOND,{n:'Diamant',hard:5.5,tier:3,drop:'diamond',mm:'#38ebff'});
def(DEEP,{n:'Roche profonde',hard:2.4,tier:2,drop:'stone',mm:'#7042ae'});
def(BEDROCK,{n:'Socle',hard:Infinity,mm:'#100c29'});
def(LOG,{n:'Bois',solid:false,hard:.9,drop:'wood',mm:'#20536d'});
def(LEAF,{n:'Feuilles',solid:false,hard:.15,mm:'#29b79f'});
def(PLANK,{n:'Planches',hard:1,drop:'plank',mm:'#6054b8'});
def(BRICK,{n:'Briques',hard:4.5,tier:1,drop:'brick',mm:'#3d5bd9'});
def(SNOW,{n:'Neige',hard:.5,drop:'dirt',mm:'#88e5ec'});
def(CASTLE,{n:'Rempart',hard:Infinity,mm:'#798aff'});
def(TORCH,{n:'Torche',solid:false,hard:.05,drop:'torch',light:1,mm:'#ffcc55'});
def(PLANT,{n:'Plante',solid:false,hard:.02,mm:null});
def(CRYSTAL,{n:'Cristal',hard:3,tier:2,drop:'crystal',light:.8,lc:1,mm:'#ee63ed'});
def(VINE,{n:'Lianes',solid:false,hard:.05,mm:null});
def(MUSH,{n:'Champignon',solid:false,hard:.05,light:.85,lc:5,mm:'#5ff5d0'});
def(CPLANT,{n:'Fougère',solid:false,hard:.02,mm:null});
def(WATER,{n:'Eau',solid:false,hard:Infinity,mm:'#1a3fa8'});
def(CHEST,{n:'Coffre',solid:false,hard:.6,light:.35,mm:'#ffcf47'});
TD[DIAMOND].light=.45;TD[DIAMOND].lc=2;

// ---------- objets ----------
const IT={
  dirt:{n:'Terre',place:DIRT},stone:{n:'Pierre',place:STONE},plank:{n:'Planches',place:PLANK},brick:{n:'Briques',place:BRICK},torch:{n:'Torche',place:TORCH},
  wood:{n:'Bois'},coal:{n:'Charbon'},copper:{n:'Cuivre'},iron:{n:'Fer'},silver:{n:'Argent'},gold:{n:'Or'},diamond:{n:'Diamant'},crystal:{n:'Cristal de vie'},
  pick1:{n:'Pioche en bois',tool:'pick',tier:1,pow:1},pick2:{n:'Pioche en cuivre',tool:'pick',tier:2,pow:1.6},
  pick3:{n:'Pioche en fer',tool:'pick',tier:3,pow:2.5},pick4:{n:'Pioche en diamant',tool:'pick',tier:3,pow:4.2},
  sword1:{n:'Épée en bois',tool:'sword',dmg:9},sword2:{n:'Épée en cuivre',tool:'sword',dmg:15},
  sword3:{n:'Épée en fer',tool:'sword',dmg:24},sword4:{n:'Épée en diamant',tool:'sword',dmg:40},
  bow:{n:'Arc',tool:'bow',dmg:11},potion:{n:'Potion de soin',use:'heal'},bomb:{n:'Bombe',use:'bomb'},
};
const RES=['wood','stone','coal','copper','iron','silver','gold','diamond'];
const RECIPES=[
  {out:'plank',n:4,inp:{wood:1}},{out:'torch',n:4,inp:{wood:1,coal:1}},{out:'brick',n:4,inp:{stone:4}},
  {out:'pick2',n:1,inp:{copper:6,wood:3}},{out:'sword2',n:1,inp:{copper:7,wood:2}},{out:'bow',n:1,inp:{wood:8,copper:2}},
  {out:'pick3',n:1,inp:{iron:8,wood:3}},{out:'sword3',n:1,inp:{iron:9,wood:2}},
  {out:'potion',n:2,inp:{silver:2,crystal:1}},{out:'bomb',n:3,inp:{coal:2,copper:1}},
  {out:'pick4',n:1,inp:{diamond:5,gold:4}},{out:'sword4',n:1,inp:{diamond:6,gold:5}},
];
const UNITS={
  miner:{n:'Mineur',hp:60,dmg:4,spd:40,cost:{wood:8,stone:6},range:12,cd:1,d:'Rapporte du minerai'},
  warrior:{n:'Guerrier',hp:120,dmg:12,spd:42,cost:{stone:10,copper:4},range:12,cd:.8,d:'Mêlée solide'},
  archer:{n:'Archer',hp:70,dmg:10,spd:40,cost:{wood:12,iron:3},range:120,cd:1.4,ranged:true,d:'Tire à distance'},
  healer:{n:'Guérisseur',hp:65,dmg:0,spd:40,cost:{wood:10,coal:5,silver:2},range:70,cd:1.3,heal:16,d:'Soigne les alliés proches'},
  golem:{n:'Golem',hp:460,dmg:34,spd:24,cost:{stone:25,silver:4,gold:2},range:14,cd:1.6,big:true,d:'Colosse qui brise tout'},
  champion:{n:'Champion rouge',hp:320,dmg:18,spd:48,cost:{},range:12,cd:.7,hero:true,d:''},
};
const UPG=[
  {id:'core',n:'Cœur renforcé',d:'+300 PV max au cœur',s:'+300 PV',cost:{stone:20,iron:4}},
  {id:'speed',n:'Entraînement',d:'+12% vitesse des unités',s:'vitesse +',cost:{copper:8,coal:6}},
  {id:'dmg',n:'Forge de guerre',d:'+25% dégâts des unités',s:'dégâts +',cost:{iron:6,gold:2}},
  {id:'tower',n:'Tour de guet',d:'Tour plus puissante',s:'tir +',cost:{stone:15,silver:3}},
];
const upgCost=(u,l)=>Object.fromEntries(Object.entries(u.cost).map(([k,v])=>[k,Math.ceil(v*(1+.6*l))]));

// =====================================================================
//  GÉNÉRATION DES TEXTURES PIXEL ART
// =====================================================================
const TEX={}, WALLTEX={}, ICON={}, SPR={};
function pixTile(fn,seed){const c=mk(16,16),g=c.getContext('2d'),id=g.createImageData(16,16),r=mulberry(seed);
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){const col=fn(x,y,r);if(!col)continue;const i=(y*16+x)*4,cc=typeof col==='string'?hex(col):col;id.data[i]=cc[0];id.data[i+1]=cc[1];id.data[i+2]=cc[2];id.data[i+3]=cc[3]??255}
  g.putImageData(id,0,0);return c}
const PAL={dirt:['#06060f','#233f50','#345e70','#4b577b'],grass:['#071623','#18515c','#35cbb1','#85ffe1','#85ffe1'],stone:['#06060f','#1e2a6e','#3d5bd9','#5a7cff'],deep:['#06060f','#211942','#493489','#7960ce'],snow:['#06060f','#172945','#467caa','#88e5ec']};
const ORE={
  [COAL]:['#111328','#39466c','#6d7ca5'],[COPPER]:['#582341','#ff874c','#ffd18a'],
  [IRON]:['#343e71','#b5c7ee','#e2edff'],[SILVER]:['#2a467e','#9ccfff','#e9f9ff'],
  [GOLD]:['#66401f','#ffcf47','#fff6ad'],[DIAMOND]:['#12536e','#38ebff','#c3ffff'],[CRYSTAL]:['#561c72','#ee63ed','#ffd0ff']};
const INK='#06060f';
function pen(g){return(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(Math.round(x),Math.round(y),w,h)}}
// Each material is a one-pixel engraving on the same black substrate.
function rockFn(p,seed){return(x,y)=>{
  if(y===0||y===15||x===0||x===15)return p[2];
  if(seed%2===0&&(x===y||x===15-y))return p[1];
  if(seed%2===1&&(y===7||x===(y<7?7:11)))return p[1];
  return p[0]}}
function earthPixel(x,y,v){const wave=[0,1,1,0,-1,-1,0,0][(x+v*2)%8];
  return (y+wave+16)%6===0?PAL.dirt[2]:(y+wave+16)%6===1&&x%5===0?PAL.dirt[1]:INK}

function orePixel(id,x,y,v){const p=ORE[id],shift=v%2,sites=[[5+shift,5],[11-shift,11]];
  for(const[cx,cy]of sites){const dx=x-cx,dy=y-cy;
    const inside=id===DIAMOND||id===CRYSTAL?Math.abs(dx)*2+Math.abs(dy)<=5:
      id===IRON?Math.abs(dx)<=3&&Math.abs(dy)<=1:
      id===SILVER?Math.abs(dx)<=1&&Math.abs(dy)<=3:
      id===COPPER?Math.abs(dx+dy)<=2&&Math.abs(dx-dy)<=4:
      id===GOLD?Math.abs(dx)+Math.abs(dy)<=3:Math.max(Math.abs(dx),Math.abs(dy))<=2;
    if(inside)return dx+dy<-1?p[2]:dx>0||dy>1?p[0]:p[1];
    if(id!==COAL&&Math.abs(dx)+Math.abs(dy)===4)return p[0];
  }return null}
function makeTex(id,v){const s=id*97+v*13+3,stone=rockFn(PAL.stone,v),deep=rockFn(PAL.deep,v);
  switch(id){
    case DIRT:return pixTile((x,y)=>earthPixel(x,y,v),s);
    case GRASS:return pixTile((x,y)=>y===0?'#63ebca':y===1&&x%4===0?'#236f72':earthPixel(x,y,v),s);
    case SNOW:return pixTile((x,y)=>y===0?'#88e5ec':stone(x,y),s);
    case STONE:return pixTile(stone,s);
    case DEEP:return pixTile((x,y)=>y===0||x===0?'#493489':(x+y+v*3)%12===0?'#30225c':INK,s);
    case BEDROCK:return pixTile((x,y)=>(x+y)%9===0?'#19152f':INK,s);
    case CASTLE:return pixTile((x,y)=>{const bx=(x+(y<8?0:8))%16,by=y%8; // blocs taillés : joint encre, biseau clair en haut à gauche
      if(by===7||bx===15)return INK;if(by===0||bx===0)return '#2a3a8a';if(by===6||bx===14)return '#0b1034';
      return (x*5+y*3+v*7)%67===0?'#1c2766':'#121a48'},s);
    case BRICK:return pixTile((x,y)=>{const bx=(x+(y<8?0:8))%8,by=y%8;if(by===7||bx===7)return INK;if(by===0||bx===0)return '#33479e';return by===6?'#0d1440':'#16205c'},s);
    case PLANK:return pixTile((x,y)=>y%8===0?'#3e4886':(x+y)%16===0?'#1e1a3a':INK,s);
    case LOG:return pixTile((x,y)=>{if(x<3||x>12)return null; // écorce : rainures, reflet à gauche, lichen
      if(x===3||x===12)return INK;if((x===6||x===10)&&(y+v*5)%11<7)return '#141633';if(x===4)return (y+v)%5===0?'#5a5f9e':'#3a3d72';
      if((x*3+y*7+v*11)%23===0)return '#2a8070';if(x===8&&(y+v*3)%16===4)return '#141633';return x>9?'#1d2046':'#282c5c'},s);
    case LEAF:return pixTile((x,y)=>{if((x<2||x>13)&&(y<4||y>11)||y===0&&(x<5||x>11)||y===15&&(x<3||x>8))return null;return y<4&&x<11?PAL.grass[2]:y>11||x>12?PAL.grass[0]:PAL.grass[1]},s);
    case TORCH:return outline(pixTile((x,y)=>{// lanterne : anneau, chapeau, cadre de verre, flamme en dégradé
      if(y===0)return x>=7&&x<=9?(x===8?null:'#5a6bb0'):null;if((y===1||y===2)&&x===8)return '#445479';
      if(y===3&&x>=7&&x<=9)return x===7?'#7a8bd0':'#3a4380';if(y===4&&x>=6&&x<=10)return x===6?'#5a6bb0':x===10?'#262c5c':'#3a4380';
      if((y===5||y===11)&&x>=5&&x<=11)return x===5?'#7a8bd0':x===11?'#3a4380':'#5a6bb0';
      if(y>5&&y<11&&x>=5&&x<=11){if(x===5)return '#4a5a9e';if(x===11)return '#262c5c';
        const d=Math.abs(x-8)+Math.abs(y-8.5)*.7;return d<1.2?'#fff3bb':d<2.2?'#ffd27a':y===6?'#ff874c':'#ffb653'}
      if(y===12&&x>=6&&x<=10)return x===6?'#5a6bb0':'#3a4380';if(y===13&&x===8)return '#262c5c';return null},s),INK);
    case PLANT:return outline(pixTile((x,y)=>{const k=v%4;
      if(k===0||k===3){for(const[b,h]of(k===0?[[4,5],[8,9],[11,6]]:[[3,4],[6,6],[10,4],[13,5]])){if(y>=16-h&&x===b+Math.floor((15-y)/4)*(b<8?-1:1))return y<18-h?PAL.grass[3]:PAL.grass[2]}return null}
      if(k===2){const dx=x-8,dy=y-12,r=dx*dx/1.6+dy*dy;if(y<16&&r<14){if((x*5+y*3)%11===0&&r<10)return '#ff9bd0';return r<4&&dx<0?PAL.grass[3]:dy<0&&dx<1?PAL.grass[2]:PAL.grass[1]}return null}
      const cx=8,cy=6;if(x===cx&&y>cy)return PAL.grass[1];if(y===12&&Math.abs(x-cx)===1)return PAL.grass[2];
      if((Math.abs(x-cx)===1&&y===cy||Math.abs(y-cy)===1&&x===cx||x===cx&&y===cy))return x===cx&&y===cy?'#ffdf8e':'#ff6fae';return null},s),INK);
    case VINE:return pixTile((x,y)=>{const sx=7+(y>3&&y<12?1:0);if(x===sx)return PAL.grass[1];if(y%8>=2&&y%8<=4&&x>=sx-3&&x<sx)return y%8===2?PAL.grass[2]:PAL.grass[0];if(y%8>=5&&y%8<=6&&x>sx&&x<=sx+2)return PAL.grass[2];if(v%2&&y===14&&x===sx)return '#9ff3ff';if(y%8===4&&x===sx-3)return PAL.grass[3];return null},s);
    case MUSH:return outline(pixTile((x,y)=>{for(const[cx,cy,r]of [[5,8+v%2,4],[12,11,2]]){if(x===cx&&y>cy&&y<16)return '#69b9b4';if(y===cy&&Math.abs(x-cx)<=r)return '#163e4a';if(y<cy&&y>=cy-3&&Math.abs(x-cx)<=r-(cy-y===3?2:0))return y===cy-3?'#c9fff3':(x+cy)%5===0?'#e9b4ff':x<cx-1?(v%2?'#de78db':'#75e8eb'):(v%2?'#8046a5':'#319d9e')}return null},s),INK);
    case CPLANT:{// fougère de grotte : frondes arquées qui retombent, folioles claires sur le dessus
      const c=mk(16,16),P=pen(c.getContext('2d')),m=v%2?-1:1,lean=v>>1;
      const fronds=[[[8,15],[8,13],[8+lean,11],[8+lean,9],[9+lean,7],[9+lean,5]],
        [[7,14],[6,13],[5,11],[4,10],[3,9],[2,9],[1,10]],[[9,14],[10,13],[11,12],[12,11],[13,11],[14,12]]];
      for(const f of fronds)f.forEach(([x,y],k)=>{const X=m>0?x:15-x;P(X,y,1,1,k<2?'#1d4f57':'#2a8681');
        if(k>0&&k<f.length-1){P(X,y-1,1,1,k%2?'#4fd1b2':'#31998f');if(k%2)P(X+(X<8?-1:1),y-1,1,1,'#2a8681')}});
      P(m>0?9+lean:6-lean,4,1,1,'#7ff0d0');return outline(c,INK)}
    case WATER:return pixTile(()=>null,s);
    case CHEST:return outline(pixTile((x,y)=>{if(x<2||x>13||y<5)return null;if(y===5&&(x===2||x===13))return null;
      // coffre : couvercle bombé, planches veinées, sangles et coins dorés, serrure
      if(y===5||y===15||x===2||x===13)return '#141a3e';
      if(x>=7&&x<=8&&y>=8&&y<=11)return y===10?'#05050c':y===8?'#fffbe0':'#fff6ad';
      if(y===9)return x%3===0?'#e0a83a':'#ffcf47';
      if((x===3||x===12)&&(y===6||y===14))return '#ffcf47';
      if(x===4||x===11)return y===6?'#ffe08a':y<9?'#b8862e':'#9a6e24';
      if(y<9)return y===6?'#4a5bb4':(x*7+y*3+v)%9===0?'#22307a':'#2c3a82';
      if(y===12)return '#161d4a';return (x*5+y*3+v)%7===0?'#1a2256':y===10||y===13?'#2b3678':'#25306e'},s),INK);
    case CRYSTAL:return pixTile((x,y)=>orePixel(id,x,y,v)||deep(x,y),s);
    default:return pixTile((x,y)=>orePixel(id,x,y,v)||(id===GOLD||id===DIAMOND?deep(x,y):stone(x,y)),s);
  }
}
function makeCanopy(r,seed){const R0=r*14+14,W=R0*2+12,H=Math.round(R0*1.6)+16,c=mk(W,H),g=c.getContext('2d'),P=pen(g),rr=mulberry(seed);
  // feuillage en grappes arrondies, éclairées du haut à gauche, branches et mousse pendante ; contour sombre pour rester lisible
  const cx=W/2,cy=H*.46,RX=R0,RY=R0*.62,B=[],sh=['#06101c','#0c2a3a','#114350','#1a6a6c','#2fa294','#72e6cc'];
  for(let i=0;i<3;i++){const a=-Math.PI/2+(i-1)*.75+(rr()-.5)*.3,L=R0*(.45+rr()*.2);let x=cx,y=H*.5+18;
    for(let j=0;j<L;j++){x+=Math.cos(a)*.8;y+=Math.sin(a)*.8-(j<L*.4?0:.15);P(x-1,y,j<L*.5?3:2,1,'#141633');P(x-1,y,1,1,'#3a3d72')}}
  B.push([cx,cy+RY*.35,R0*.42]);
  for(let i=0;i<7+r*4;i++){const a=rr()*Math.PI*2,d=Math.sqrt(rr())*.78;B.push([cx+Math.cos(a)*RX*d,cy+Math.sin(a)*RY*d,8+rr()*6+r*1.5])}
  // aucune grappe isolée : on rapproche du centre celles qui ne touchent aucune autre
  for(let it=0;it<6;it++)for(const b of B){if(B.some(o=>o!==b&&Math.hypot(o[0]-b[0],o[1]-b[1])<(o[2]+b[2])*.75))continue;b[0]=cx+(b[0]-cx)*.7;b[1]=cy+(b[1]-cy)*.7}
  B.sort((p,q)=>p[1]-q[1]);
  const id=g.getImageData(0,0,W,H),D=id.data,hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)],SH=sh.map(hex),BY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5],hash=(x,y)=>((x*73856093^y*19349663^seed)>>>0)%97;
  const lay=new Int8Array(W*H).fill(-1);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){let best=-1,lit=0;
    for(let k=B.length-1;k>=0;k--){const[bx,by,br]=B[k],dx=x-bx,dy=y-by,d=Math.hypot(dx,dy*1.15)/br;if(d>1)continue;if(d>.82&&hash(x,y)%3===0)continue;
      best=k;lit=(-dx*.6-dy*.8)/br*.9+(1-d)*.35+(y<cy?.15:-.1);break}
    if(best<0)continue;const t=Math.max(0,Math.min(4.99,1.6+lit*2.6+(BY[(y&3)*4+(x&3)]/16-.5)*.9)),col=SH[1+Math.floor(t)>5?5:1+Math.floor(t)],o=(y*W+x)*4;
    D[o]=col[0];D[o+1]=col[1];D[o+2]=col[2];D[o+3]=255;lay[y*W+x]=best}
  // contour : un pixel sombre autour de la silhouette, et ombre portée sous chaque grappe (frontière entre grappes)
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x,o=i*4;
    if(lay[i]<0){if(lay[i-1]>=0||lay[i+1]>=0||lay[i-W]>=0||lay[i+W]>=0){D[o]=SH[0][0];D[o+1]=SH[0][1];D[o+2]=SH[0][2];D[o+3]=255}}
    else if(lay[i-W]>=0&&lay[i-W]>lay[i]&&lay[i-W]!==lay[i]){D[o]=SH[1][0];D[o+1]=SH[1][1];D[o+2]=SH[1][2]}}
  g.putImageData(id,0,0);
  // mousse pendante sous le feuillage
  for(let x=4;x<W-4;x+=2+Math.floor(rr()*4)){let y=H-1;while(y>0&&lay[y*W+x]<0)y--;if(y<cy||rr()<.35)continue;const L=2+Math.floor(rr()*(5+r*2));for(let j=1;j<=L;j++)P(x,y+j,1,1,j===L?'#2a8070':'#123848')}
  // petites lueurs (fruits/lucioles) dans le feuillage
  for(let i=0;i<2+r*2;i++){const x=Math.floor(cx+(rr()-.5)*RX*1.4),y=Math.floor(cy+(rr()-.5)*RY*1.2);if(lay[y*W+x]<0)continue;const col=rr()<.5?'#a6f0ff':'#ff9bd2';P(x,y,1,1,col);if(rr()<.5)P(x+1,y,1,1,'#fff6ad')}
  return c}
function makeWall(kind,v){return pixTile((x,y)=>{
  if(y%8===0||(x+(y<8?0:8))%16===0)return kind===1?'#10162c':'#111938';
  if(v===0&&(x===4||x===11))return '#151b3c';
  return '#0b0f26'},kind*31+v)}

// tuiles peintes (www/art/tiles-hd.png, Higgsfield) : une rangée de 64x64 par matière (terre, pierre, roche profonde,
// brique, château, planche, écorce), découpée en 16 carreaux de 16 px posés selon la position dans le monde pour
// que la matière reste continue ; tant que l'image manque, les tuiles dessinées par code servent
const HD_TILES={im:new Image(),ok:false,row:{dirt:0,stone:1,deep:2,brick:3,castle:4,plank:5,bark:6}};
// canopées HD (art/trees-hd.png) : rondes petite/grande, saules petit/grand ; repli procédural makeCanopy
const TREE_ART={im:new Image(),ok:false,r:[[0,0,111,72],[112,0,148,96],[261,0,42,84],[304,0,52,104]],c:[]};
function treeImg(r,x,seed){if(!TREE_ART.ok)return makeCanopy(r,seed);const h=(x*2654435761>>>0)%5,i=(h<2?2:0)+(r>2?1:0);
  if(!TREE_ART.c[i]){const[sx,sy,w,hh]=TREE_ART.r[i],c=mk(w,hh);c.getContext('2d').drawImage(TREE_ART.im,sx,sy,w,hh,0,0,w,hh);TREE_ART.c[i]=c}return TREE_ART.c[i]}
TREE_ART.im.onload=()=>{try{TREE_ART.ok=true;for(const tr of trees)tr.img=treeImg(tr.r,tr.x,0)}catch(e){TREE_ART.ok=false}};
function hdSub(row,i){const c=mk(16,16);c.getContext('2d').drawImage(HD_TILES.im,(i&3)*16,row*64+(i>>2)*16,16,16,0,0,16,16);return c}
HD_TILES.im.onload=()=>{try{HD_TILES.ok=true;buildTextures();for(const t of[0,1])SPR['castle'+t]=castleSprite(t);tileIcons();lightDirty=true}catch(e){HD_TILES.ok=false;console.warn('tiles-hd.png',e)}};
function buildTextures(){
  for(let id=1;id<TD.length;id++){TEX[id]=[];for(let v=0;v<4;v++)TEX[id].push(makeTex(id,v))}
  const HD=HD_TILES.ok,R=HD_TILES.row;
  if(HD){for(const[id,row]of[[BRICK,R.brick],[CASTLE,R.castle],[PLANK,R.plank]])TEX[id]=[...Array(16)].map((_,i)=>hdSub(row,i));
    // tronc : l'écorce peinte gardée sur 10 px de large, contour encre
    TEX[LOG]=[...Array(16)].map((_,i)=>{const c=mk(16,16),q=c.getContext('2d');q.drawImage(hdSub(R.bark,i),3,0,10,16,3,0,10,16);q.fillStyle=INK;q.fillRect(3,0,1,16);q.fillRect(12,0,1,16);return c})}
  // Cache exposed/buried terrain separately: bury the host rock, not its ore.
  SPR.buried={};SPR.oreGlint={};
  const minerals=[COAL,COPPER,IRON,SILVER,GOLD,DIAMOND];
  const terrain=[DIRT,GRASS,STONE,DEEP,...minerals];
  for(const id of terrain){SPR.buried[id]=[];
    for(let v=0;v<4;v++){
      const earthy=id===DIRT||id===GRASS,deep=id===DEEP||id===GOLD||id===DIAMOND;
      const host=pixTile((x,y)=>{
        if(earthy){
          // terre froide : strates bleu-vert sourdes, quelques grains, peu de bruit
          const seam=(y+((x+v*3)>>2)%3)%8;
          if(seam===0&&((x+v*5)%11)<7)return '#152a35';
          if((x*7+y*11+v*13)%89===0)return '#24474e';
          return seam===1?'#080e16':'#0d1721';
        }
        // Broken, offset facets instead of a luminous square around every tile.
        const fault=(x+Math.floor(y/3)+v*5)%13;
        if(fault===0&&y>2&&y<14)return deep?'#0a0819':'#090c22';
        if((y+v*3)%11===3&&x>2&&x<12)return deep?'#261d4a':'#19224f';
        if((x*3+y*7+v*11)%97===0)return deep?'#4a3a85':'#30449a';
        return deep?'#120e26':'#0f1430';
      },id*97+v);
      for(let buried=0;buried<2;buried++){
        const c=mk(16,16),q=c.getContext('2d'),P=pen(q);q.drawImage(host,0,0);
        if(buried){q.fillStyle='rgba(6,6,15,.48)';q.fillRect(0,0,16,16)}
        if(id===GRASS){P(0,0,16,1,'#63ebca');for(let x=v;x<16;x+=4)P(x,1,1,1,'#236f72')}
        if(minerals.includes(id)){
          const p=id===COAL?['#0c0f22','#3a4670','#8090c8']:ORE[id];
          // Two irregular three-tone nuggets with a one-pixel ink contour, large enough to read at native scale.
          const inside=(dx,dy)=>Math.abs(dx)<=3&&Math.abs(dy)<=3&&(id===DIAMOND?Math.abs(dx)*2+Math.abs(dy)<=5:
                id===SILVER?Math.abs(dx)<=2&&(Math.abs(dx)+Math.abs(dy)<5):
                id===IRON?Math.abs(dy)<=2&&Math.abs(dx)+Math.abs(dy)<5:
                Math.abs(dx)+Math.abs(dy)<=4&&!(dx===-3&&dy===1));
          for(const [cx,cy] of [[5+v%2,5],[11-v%2,11]]){
            for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
              if(inside(dx,dy))P(cx+dx,cy+dy,1,1,dx+dy<-1?p[2]:dx>1||dy>1?p[0]:p[1]);
              else if(inside(dx-1,dy)||inside(dx+1,dy)||inside(dx,dy-1)||inside(dx,dy+1))P(cx+dx,cy+dy,1,1,INK);
            }
          }
        }
        if(buried)SPR.buried[id].push(c);else TEX[id][v]=c;
      }
    }
  }
  // touffes d'herbe posées sur la surface : brins de hauteurs variées, penchés au vent
  SPR.tuft=[0,1,2,3].map(v=>{const c=mk(16,16),P=pen(c.getContext('2d')),r=mulberry(500+v*31);
    for(let x=1+v%2;x<15;x+=2+Math.floor(r()*2)){const h=2+Math.floor(r()*(v===3?6:4)),d=r()<.5?-1:1;
      for(let k=0;k<h;k++)P(x+(k>h*.6?d:0),15-k,1,1,k===h-1?PAL.grass[3]:k>1?PAL.grass[2]:PAL.grass[1])}
    return c});
  SPR.torch=[];SPR.slash=[];SPR.chestOpen=[];
  for(let f=0;f<4;f++){
    const c=mk(16,16),q=c.getContext('2d'),P=pen(q);q.drawImage(TEX[TORCH][0],0,0);
    P(6,6,5,5,'#8a3a1c');P(6,8,5,3,'#ff874c');P(7,7+(f&1),3,4-(f&1),'#ffb653');P(7+(f>>1),6+(f===1?1:0),1,2,'#ffd27a');P(8,8,1,2,'#fff3bb');P(8,10,1,1,'#ffd27a');SPR.torch.push(c);
    const lid=mk(16,20),l=lid.getContext('2d');l.drawImage(TEX[CHEST][0],0,9,16,7,0,13,16,7);
    l.fillStyle='#0b0e26';l.fillRect(3,10,10,3);l.fillStyle='#ffcf4766';l.fillRect(5,11,6,1);l.drawImage(TEX[CHEST][0],0,4,16,6,0,8-f*2,16,6-f);SPR.chestOpen.push(lid);
  }
  // Pixel arcs are rasterized once, then blitted without paths in the hot loop.
  for(let f=0;f<6;f++){const c=mk(40,40),P=pen(c.getContext('2d'));
    for(let j=0;j<16;j++){const a=-3.05+f*.43-j*.035,r=15+(j<5?1:0);P(20+Math.cos(a)*r,20+Math.sin(a)*r,1,1,j<5?'#e9fbff':j<10?'#83cbd5':'#48658b')}
    SPR.slash.push(c);
  }
  // Tiny cached glints; sparse phases animate without blur, gradients or allocations.
  for(const id of [SILVER,GOLD,DIAMOND]){
    SPR.oreGlint[id]=[];
    for(let v=0;v<4;v++){
      const c=mk(16,16),P=pen(c.getContext('2d')),x=4+v%2;
      P(x,3,1,3,ORE[id][1]);P(x-1,4,3,1,ORE[id][1]);P(x,4,1,1,ORE[id][2]);
      SPR.oreGlint[id].push(c);
    }
  }
  for(let k=1;k<=3;k++){WALLTEX[k]=[];for(let v=0;v<4;v++)WALLTEX[k].push(makeWall(k,v))}
  const paths=[[[8,3],[8,4],[7,5],[7,6],[8,7],[8,8]],[[8,8],[9,9],[10,9],[11,10],[11,11],[12,12]],[[8,8],[6,9],[5,9],[4,10],[3,10],[2,11]],[[7,6],[10,5],[11,4],[12,4],[13,3]],[[5,9],[5,12],[4,13],[4,14]],[[10,9],[13,8],[14,7]]];
  SPR.crack=[];for(let st=0;st<4;st++){const c=mk(16,16),P=pen(c.getContext('2d'));for(const path of paths.slice(0,st+3))for(const[x,y]of path)P(x,y,1,1,INK);SPR.crack.push(c)}
}

// Personnages et monstres façon Animal Well : petits corps ronds éclairés d'en haut à gauche (rampe de 5 tons
// décalés en teinte, bandes nettes et fine trame à leur jonction), liseré de lumière sur le bord éclairé,
// contour sombre du côté de l'ombre. c.emi garde les pixels qui brillent dans le noir (yeux, lampe, fantômes),
// dessinés après l'éclairage par drawEmissive.
function hsl2hex(h,s,l){h=((h%360)+360)%360;const f=n=>{const k=(n+h/30)%12,a=s*Math.min(l,1-l);return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))))};return'#'+[f(0),f(8),f(4)].map(v=>v.toString(16).padStart(2,'0')).join('')}
function hex2hsl(hx){const[r,g,b]=hex(hx).map(v=>v/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;if(!d)return[0,0,l];
  const s=d/(1-Math.abs(2*l-1)),h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;return[h*60,s,l]}
// rampe de 5 tons : les ombres glissent vers le bleu-violet, les clairs vers le jaune
function hueRamp(base){const[h,s,l]=hex2hsl(base),toward=(h0,t,d)=>{let dd=((t-h0+540)%360)-180;return h0+Math.sign(dd)*Math.min(Math.abs(dd),d)};
  return[hsl2hex(toward(h,255,34),Math.min(1,s*.9),l*.38),hsl2hex(toward(h,250,18),s,l*.66),base,hsl2hex(toward(h,55,12),s*.9,l+(1-l)*.14),hsl2hex(toward(h,55,24),s*.7,l+(1-l)*.3)]}
const LIGHT=[-.55,-.62,.56];
// corps rond (super-ellipse un peu aplatie en bas) ombré par bandes ; renvoie le masque pour placer les détails
function roundBody(P,x0,y0,w,h,R,o={}){const cx=x0+w/2,cy=y0+h/2,m=[];
  for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const nx=(x+.5-cx)/(w/2),ny=(y+.5-cy)/(h/2),e=o.square?2.8:2.3;
    const d=Math.pow(Math.abs(nx),e)+Math.pow(Math.abs(ny),ny>0?e+.8:e);if(d>1)continue;
    const nz=Math.sqrt(Math.max(0,1-nx*nx-ny*ny)),v=nx*LIGHT[0]+ny*LIGHT[1]+nz*LIGHT[2],q=clamp((v+.35)/1.25,0,.999)*4,i=Math.floor(q),f=q-i;
    const k=clamp(i+(f>.82&&((x+y)&1)?1:0),0,4);m.push([x,y]);P(x,y,1,1,R[Math.max(1,k)])}
  // liseré : bord haut-gauche au ton le plus clair, bord bas au ton le plus sombre
  const has=(x,y)=>m.some(p=>p[0]===x&&p[1]===y);
  for(const[x,y]of m){if(!has(x-1,y-1)&&(!has(x,y-1)||!has(x-1,y)))P(x,y,1,1,R[4]);else if(!has(x,y+1))P(x,y,1,1,R[0])}
  return m}
// contour en deux tons : côté lumière un ton sombre de la rampe, côté ombre l'encre
function selout(c,lit,ink='#05050c'){const g=c.getContext('2d'),W=c.width,H=c.height,id=g.getImageData(0,0,W,H),d=id.data,o=new Uint8ClampedArray(d),L=hex(lit),K=hex(ink);
  const op=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&d[(y*W+x)*4+3]>128;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(d[i+3]>0)continue;
    if(!(op(x+1,y)||op(x-1,y)||op(x,y+1)||op(x,y-1)))continue;const col=(op(x+1,y)||op(x,y+1))&&!op(x-1,y)&&!op(x,y-1)?L:K;
    o[i]=col[0];o[i+1]=col[1];o[i+2]=col[2];o[i+3]=255}
  id.data.set(o);g.putImageData(id,0,0);return c}
function flipE(c){const f=flipC(c);if(c.emi)f.emi=flipC(c.emi);return f}
function mkE(w,h){const c=mk(w,h);c.emi=mk(w,h);return c}
const CW=24,CH=32;
function humanoid(o,p){const c=mkE(CW,CH),P=pen(c.getContext('2d')),E=pen(c.emi.getContext('2d')),ink='#05050c';
  const role=o.role,hero=role==='hero',boss=role==='champion',zombie=role==='zombie';
  const R=hueRamp(hero?'#e9c19c':zombie?'#8fa294':o.tunic);
  const ph=p.ph,walk=ph!==undefined,ang=walk?ph/6*Math.PI*2:0,bob=walk?(Math.cos(ang*2)>.3?1:0):(p.bob||0);
  const w=(boss?17:hero?15:14)+(p.jump?-1:0),h=(boss?16:hero?15:14)-bob+(p.jump?2:0)-(zombie?1:0);
  const lean=p.atk?1:p.wind?-1:zombie?1:0,x=Math.floor((CW-w)/2)+lean,feetY=p.jump?CH-5:CH-2,y=feetY-2-h;
  // pieds : deux appuis qui alternent (contact, passage, appui)
  const fA=walk?Math.round(Math.cos(ang)*2.2):0,fB=-fA,lA=walk&&Math.sin(ang)>.35?1:0,lB=walk&&Math.sin(ang)<-.35?1:0;
  const foot=(fx,lift,col)=>P(fx,feetY-2-lift,4,3,col);
  foot(x+2+fB,lB,R[0]);
  // main arrière (dans l'ombre), cape du héros
  const sw=walk?Math.round(-Math.cos(ang)*1.8):0;
  if(hero){const flap=walk?(ph%3===0?1:0):p.jump?-2:0;for(let j=0;j<h-3;j++){const ww=1+Math.floor(j/3);P(x-ww+2-(j>h-7?flap:0),y+3+j,ww+1,1,j===0?'#c2688a':j>h-7?'#5e2e52':'#8a4268')}}
  P(x-1+(p.wind?-1:0),y+h-7+sw+(p.wind?-3:0),3,3,R[0]);
  roundBody(P,x,y,w,h,R,{square:boss});
  foot(x+w-6+fA,lA,R[1]);P(x+w-6+fA,feetY-2-lA,2,1,R[2]);
  // yeux : sombres avec reflet pour les nôtres, lumineux pour les monstres (ils brillent dans le noir)
  const ey=y+Math.floor(h*.34),ex=x+w-8;
  if(zombie){for(const xx of[ex,ex+4]){P(xx,ey,3,2,'#c9ff7a');P(xx+1,ey+2,1,1,'#7fae4a');E(xx,ey,3,2,'#d8ff9a')}P(ex+1,ey+4,5,1,R[0]);P(ex+2,ey+5,1,1,R[0]);P(ex+4,ey+5,1,1,R[0])}
  else if(boss){for(const xx of[ex,ex+4]){P(xx-1,ey-1,4,1,R[0]);P(xx,ey,3,2,'#ff5a4a');P(xx,ey,1,1,'#ffd0a0');E(xx,ey,3,2,'#ff6a50')}P(ex+1,ey+4,6,1,R[0])}
  else{for(const xx of[ex,ex+4]){P(xx,ey,3,4,ink);P(xx,ey,1,1,'#ffffff');P(xx+1,ey+1,1,1,'#2a2a44')}if(hero)P(ex+7,ey+4,2,1,'#ff9a9a')}
  // main avant
  const hx=x+w-1+(p.atk?3:0),hy=y+h-7-sw+(p.atk?-2:0);P(hx,hy,3,3,R[2]);P(hx,hy,2,1,R[3]);P(hx+2,hy+2,1,1,R[1]);
  if(zombie){P(x+w-1,y+h-8,4,3,R[2]);P(x+w+2,y+h-8,1,1,R[3])}
  if(hero){P(x+5,y-1,5,1,o.hair);P(x+6,y-2,3,1,o.hair);P(x+7,y-3,1,1,o.hair);P(x+1,y+h-6,w-2,1,'#4f9df5');P(x+w-5,y+h-6,2,1,'#a0caff')}
  if(role==='warrior'){const H=hueRamp('#7c8ca8');for(let j=0;j<6;j++){const ins=j===0?3:j===1?1:0;P(x+ins,y+j-1,w-ins*2,1,j===0?H[4]:j===1?H[3]:j===5?H[1]:H[2])}
    P(x+1,y+4,w-2,1,H[0]);P(x+w-8,y+3,7,1,ink);P(x+3,y+1,1,2,H[4]);const PL=hueRamp(o.plume);P(x+5,y-4,4,3,PL[2]);P(x+4,y-3,2,1,PL[3]);P(x+8,y-6,3,3,PL[1]);P(x+9,y-7,2,1,PL[2])}
  if(role==='archer'){const Hd=hueRamp(o.hood);for(let j=0;j<7;j++){const span=Math.min(w+1,3+j*2);P(x+Math.floor((w-span)/2)-1,y-4+j,span,1,j===0?Hd[3]:j<3?Hd[2]:Hd[1])}
    P(x-1,y+2,3,h-6,Hd[0]);P(x+w-9,y+2,9,1,Hd[1]);P(x+3,y+h-4,w-5,1,Hd[1])}
  if(role==='miner'){const Hh=hueRamp('#bb904f');P(x+2,y-3,w-4,1,Hh[3]);P(x+1,y-2,w-2,3,Hh[2]);P(x+1,y-2,w-2,1,Hh[3]);P(x-1,y+1,w+2,1,Hh[1]);P(x+w-4,y-2,3,3,'#fff3a0');P(x+w-3,y-1,1,1,'#ffffff');E(x+w-4,y-2,3,3,'#ffe58a');
    const B=hueRamp(o.beard||'#9a6a4a');P(x+w-7,y+h-6,6,3,B[3]);P(x+w-6,y+h-3,4,1,B[2]);P(x+w-7,y+h-6,1,2,B[2])}
  // guérisseur : capuche claire, bâton à gemme verte qui luit dans le noir et se lève quand il soigne
  if(role==='healer'){const Hd=hueRamp('#cfd6ff');for(let j=0;j<6;j++){const ins=j===0?3:j===1?1:0;P(x+ins,y+j-2,w-ins*2,1,j===0?Hd[4]:j<3?Hd[3]:Hd[2])}P(x-1,y+3,2,h-8,Hd[1]);P(x+w-9,y+3,9,1,Hd[1]);
    const sx=x+w+2,sy=y-3-(p.atk?3:0);P(sx,sy+3,1,feetY-sy-3,'#c9a56a');P(sx-1,sy,3,3,'#7dffb0');P(sx,sy+1,1,1,'#ffffff');E(sx-1,sy,3,3,'#7dffb0')}
  if(boss){const Hb=hueRamp('#e8dcc0');// cornes recourbées vers l'extérieur, couronne au milieu
    for(const s of[-1,1]){const bx=s<0?x+1:x+w-2,pts=[[0,1,3],[s,0,3],[2*s,-1,2],[3*s,-2,2],[3*s,-3,2],[4*s,-4,1],[4*s,-5,1],[4*s,-6,1]];
      pts.forEach(([dx,dy,ww],i)=>P(s<0?bx+dx-ww+1:bx+dx,y+dy,ww,1,Hb[[1,2,2,3,3,3,4,4][i]]))}
    const G=hueRamp('#ffce47'),cw=w-10,cx0=x+5;P(cx0,y-2,cw,3,G[2]);P(cx0,y-2,cw,1,G[3]);for(let dx=0;dx<cw;dx+=2)P(cx0+dx,y-4,1,2,G[3]);P(cx0+(cw>>1),y-1,2,1,'#ff6868');E(cx0+(cw>>1),y-1,2,1,'#ff8a70')}
  return selout(c,R[0],ink)}
function charSet(o){const fr={walk:[],idle:[],jump:null,atk:null};
  for(let i=0;i<6;i++)fr.walk.push(humanoid(o,{ph:i}));
  fr.idle=[0,1].map(b=>humanoid(o,{bob:b}));fr.jump=humanoid(o,{jump:true});fr.wind=humanoid(o,{wind:true});fr.atk=humanoid(o,{atk:true,bob:1});
  return{R:fr,L:{walk:fr.walk.map(flipE),idle:fr.idle.map(flipE),jump:flipE(fr.jump),atk:flipE(fr.atk),wind:flipE(fr.wind)}}}
// golem : animal fantôme translucide, contour lumineux qui brille dans le noir
function golemSet(eye){const R=hueRamp('#7a68d0'),RIM=hueRamp('#b9a8ff')[3];
  const mkF=(f,attack=false,jump=false)=>{const c=mkE(28,32),g=c.getContext('2d'),P=pen(g),E=pen(c.emi.getContext('2d'));
    const x=5+(attack?1:0),y=jump?11:15+Math.abs(f),w=19,h=29-y,m=roundBody(P,x,y,w,h,R,{square:true}),has=(a,b)=>m.some(q=>q[0]===a&&q[1]===b);
    for(const[a,b]of m)if(!has(a,b-1)||!has(a-1,b)||!has(a+1,b)){P(a,b,1,1,RIM);E(a,b,1,1,'#8f7dff')}
    for(const ex of[x+1,x+14]){P(ex,y-4,1,4,RIM);P(ex+1,y-3,1,3,R[2]);P(ex+2,y-2,1,2,R[2]);P(ex+3,y-1,1,1,R[2]);E(ex,y-4,1,2,'#8f7dff')}
    // queue en crochet qui ondule
    const tq=[[3,y+3],[2,y+4],[1,y+5],[1,y+6],[1,y+7],[2,y+8],[3,y+9]];for(const[a,b]of tq)P(a,b+(f>0?-1:0),1,1,RIM);P(4,y+10,2,1,R[2]);
    for(const dx of[2,6,12,15])P(x+dx,30-((dx+f)%3===0?1:0),2,1,RIM);
    for(const ex of[x+9,x+14]){P(ex,y+5,3,4,'#05050c');P(ex,y+5,3,3,eye);P(ex,y+5,1,1,'#f1edff');E(ex,y+5,3,3,eye)}
    P(x+12,y+11,3,1,RIM);
    if(attack){P(23,26,3,2,R[2]);P(24,25,2,1,RIM)}
    g.globalCompositeOperation='destination-in';g.globalAlpha=.74;g.fillRect(0,0,28,32);g.globalAlpha=1;g.globalCompositeOperation='source-over';
    return c};
  const fr={walk:[mkF(0),mkF(1),mkF(0),mkF(-1)],idle:[mkF(0),mkF(1)],jump:mkF(0,false,true),wind:mkF(2),atk:mkF(0,true)};
  return{R:fr,L:{walk:fr.walk.map(flipE),idle:fr.idle.map(flipE),jump:flipE(fr.jump),atk:flipE(fr.atk),wind:flipE(fr.wind)}}}
// ogre de sang (boss de la lune de sang), repli procédural à sa taille réelle : corps centré dans un cadre 46x54,
// massue sur l'épaule, levée (wind) puis abattue devant lui (atk) ; yeux de braise dans le calque émissif
function ogreSet(){const R=hueRamp('#b03a52'),Bn=hueRamp('#e8dcc0'),Wd=hueRamp('#7a5a4a'),ink='#05050c';
  const mkF=o=>{const c=mkE(46,54),P=pen(c.getContext('2d')),E=pen(c.emi.getContext('2d')),st=o.step||0,up=o.jump?3:0,x=11+(o.atk?2:0),w=24,h=30-(o.bob||0),y=47-h-up,a=o.arm||0;
    // bras arrière, puis jambes (une levée sur deux en marche)
    P(x-2,y+12+a,4,9,R[0]);P(x-3,y+20+a,5,4,R[0]);
    P(x+4,47-up,7,5-(st>0?2:0),R[0]);P(x+3,51-up-(st>0?2:0),9,1,R[1]);P(x+w-11,47-up,7,5-(st<0?2:0),R[1]);P(x+w-12,51-up-(st<0?2:0),9,1,R[2]);
    roundBody(P,x,y,w,h,R,{square:true});
    for(let j=0;j<8;j++){const ins=j===0||j===7?2:j===1||j===6?1:0;P(x+6+ins,y+h-14+j,w-13-ins*2,1,R[3])} // ventre plus clair
    for(const[hx,d]of[[x+3,-1],[x+w-4,1]]){P(hx-1,y-2,3,3,Bn[1]);P(hx+d-1,y-5,2,4,Bn[2]);P(hx+d*2,y-7,1,3,Bn[3])} // cornes
    // yeux de braise sous des sourcils froncés, gueule à crocs
    const ey=y+9;for(const ex of[x+9,x+17]){P(ex,ey,4,3,'#ffe066');P(ex+2,ey+1,1,1,ink);P(ex-1,ey-2,6,1,ink);E(ex,ey,4,3,'#ffb040')}P(x+8,ey-3,2,1,ink);P(x+21,ey-3,2,1,ink);P(x+13,ey-1,4,1,ink);
    P(x+15,ey+4,2,1,R[0]);P(x+9,ey+7,14,2,ink);P(x+10,ey+5,2,3,Bn[3]);P(x+20,ey+5,2,3,Bn[3]);P(x+14,ey+7,1,1,Bn[2]);P(x+17,ey+7,1,1,Bn[2]);
    // massue cloutée : tête en haut au repos et à l'armé, tête en bas quand elle s'abat
    const club=(cx,cy,len,down)=>{const hy=down?cy+len-1:cy-8;P(cx,cy,3,len,Wd[1]);P(cx,cy,1,len,Wd[3]);P(cx-1,hy,5,9,Wd[2]);P(cx-1,hy,1,9,Wd[4]);P(cx-2,hy+2,1,1,Bn[3]);P(cx+4,hy+4,1,1,Bn[3]);P(cx+4,hy+1,1,1,Bn[3]);P(cx+1,down?hy+9:hy-1,1,1,Bn[3])};
    if(o.wind){club(x+w-1,y-4,11);P(x+w-3,y+5,5,9,R[2]);P(x+w-3,y+4,5,3,R[3])}
    else if(o.atk){P(x+w-2,y+12,6,5,R[2]);club(x+w+4,y+15,26-y,true);P(x+w+2,y+13,6,4,R[3])}
    else{club(x+w+1,y+8-a,13);P(x+w-2,y+13-a,4,8,R[2]);P(x+w-1,y+19-a,5,4,R[3])}
    return selout(c,R[0],ink)};
  const stp=[1,1,0,-1,-1,0],bob=[0,1,0,0,1,0],arm=[1,0,-1,-1,0,1];
  const fr={walk:stp.map((s,i)=>mkF({step:s,bob:bob[i],arm:arm[i]})),idle:[mkF({}),mkF({bob:1})],jump:mkF({jump:true,step:1}),wind:mkF({wind:true}),atk:mkF({atk:true,bob:1})};
  return{R:fr,L:{walk:fr.walk.map(flipE),idle:fr.idle.map(flipE),jump:flipE(fr.jump),atk:flipE(fr.atk),wind:flipE(fr.wind)}}}
// slime : gelée brillante, cœur plus sombre, reflet, yeux qui luisent un peu
function slimeFrames(col){const R=hueRamp(col);return[0,1,2].map(f=>{const c=mkE(20,17),g=c.getContext('2d'),P=pen(g),E=pen(c.emi.getContext('2d')),w=[15,17,12][f],h=[11,8,14][f],x=Math.floor((20-w)/2),y=15-h;
  roundBody(P,x,y,w,h,R);P(x+3,y+1,3,1,R[4]);P(x+2,y+2,2,1,R[4]);P(x+2,y+3,1,1,R[4]);P(x+Math.floor(w/2)-2,y+h-4,4,2,R[1]);
  for(const ex of[x+w-8,x+w-4]){P(ex,y+3,2,3,'#05050c');P(ex,y+3,1,1,'#ffffff');E(ex,y+3,1,1,'#d8e4ff')}
  return selout(c,R[0])})}
// noyau : cristal taillé qui flotte au-dessus d'un socle à runes, cœur et runes lumineux (couche emi), éclats en orbite
function coreSprite(col){const R=hueRamp(col),S=['#0b0d24','#1b2148','#2c3570','#46539a','#6d7cc0'];
  return[0,1,2,3].map(f=>{const c=mkE(26,38),P=pen(c.getContext('2d')),E=pen(c.emi.getContext('2d')),dy=[0,-1,0,1][f],cx=13,y0=3+dy;
    // socle : dalle large, plateau gravé de runes, griffes qui tiennent le cristal
    P(3,34,20,3,S[2]);P(3,34,20,1,S[4]);P(3,35,1,2,S[3]);P(22,35,1,2,S[1]);P(2,37,22,1,S[1]);
    P(6,30,14,4,S[2]);P(6,30,14,1,S[4]);P(6,31,1,3,S[3]);P(19,31,1,3,S[1]);P(7,33,12,1,S[1]);
    [8,12,16].forEach((x,k)=>{P(x,31,2,2,R[0]);P(x+(k%2),31,1,1,R[1]);E(x,31,2,2,(f+k)%3===0?R[4]:R[1])});
    for(const s of[-1,1]){for(const[dx,yy]of[[6,29],[7,28],[8,27],[8,26],[8,25],[8,24],[7,23],[7,22]])P(cx+s*dx-(s<0?0:0),yy,1,1,s<0?S[4]:S[2]);
      P(cx+s*6,21,1,1,R[3]);E(cx+s*6,21,1,1,R[2])}
    // cristal facetté : haut clair, bas sombre, arête centrale, ceinture lumineuse
    for(let y=0;y<21;y++){const h=y<7?y:Math.floor((20-y)*.5),Y=y0+y;
      for(let x=cx-h;x<=cx+h;x++){let k;
        if(y===7)k=x<cx?4:x===cx?4:3;
        else if(y<7)k=x<cx?(x<cx-h+1?3:4):x===cx?3:(x>cx+h-2?1:2);
        else k=x<cx?(x<cx-h+2?2:3):x===cx?2:(x>cx+h-2?0:1);
        P(x,Y,1,1,R[k]);if(y>2&&y<17)E(x,Y,1,1,k>=3?R[1]:R[0])}}
    // cœur qui pulse et reflet
    P(cx-1,y0+8,3,4,R[4]);P(cx,y0+9,1,2,'#ffffff');E(cx-1,y0+8,3,4,R[3]);E(cx,y0+9,1,2,'#ffffff');
    if(f%2===0)E(cx-2,y0+10,5,1,R[2]);
    P(cx-3,y0+5,1,2,'#ffffff');P(cx-2,y0+4,1,1,'#ffffff');
    outline(c,INK);
    // lumière posée sur le plateau et éclats en orbite (après le contour pour rester fins)
    E(cx-3,30,7,1,R[2]);
    const a=f*Math.PI/2;for(const o of[0,Math.PI]){const sx=Math.round(cx+Math.cos(a+o)*11),sy=Math.round(y0+10+Math.sin(a+o)*4);
      P(sx,sy,1,1,R[4]);E(sx,sy,1,1,'#ffffff');if(o===0){E(sx-1,sy,3,1,R[2]);E(sx,sy-1,1,3,R[2])}}
    return c})}
// château : donjon à rosace, tours coiffées de toits pointus aux couleurs de l'équipe, rempart crénelé,
// porte voûtée à herse éclairée de l'intérieur, bannières, mousse et lierre ; volumes ombrés (lumière en haut à gauche)
function castleSprite(team){const c=mk(176,150),g=c.getContext('2d'),P=pen(g),col=team?'#e5534b':'#4f9df5',R=hueRamp(col),rr=mulberry(41+team);
  const masonry=(x,y,wd,ht)=>{P(x,y,wd,ht,INK);g.save();g.beginPath();g.rect(x,y,wd,ht);g.clip();
    for(let j=0;j<ht;j+=16)for(let i=0;i<wd;i+=16)g.drawImage(TEX[CASTLE][(i+j)&3],x+i,y+j);g.restore()};
  const dark=(x,y,w,h,a)=>{g.fillStyle=`rgba(3,4,16,${a})`;g.fillRect(x,y,w,h)},lite=(x,y,w,h,a)=>{g.fillStyle=`rgba(120,150,255,${a})`;g.fillRect(x,y,w,h)};
  const volume=(x,y,w,h)=>{lite(x,y,2,h,.18);dark(x+w-Math.round(w*.3),y,Math.round(w*.3),h,.22);dark(x+w-3,y,3,h,.25)};
  const merlons=(x0,x1,y,w,gap)=>{for(let x=x0;x+w<=x1;x+=w+gap){masonry(x,y,w,8);P(x,y,w,1,'#3a4fae');lite(x,y,1,8,.2);dark(x+w-2,y,2,8,.3)}};
  const win=(x,y)=>{P(x-2,y-2,12,16,'#22306e');P(x-1,y-3,10,1,'#22306e');P(x,y,8,12,INK);P(x+1,y-1,6,1,INK);
    P(x+1,y+1,6,10,'#7a3f1c');P(x+2,y+2,4,8,'#ffb653');P(x+3,y+3,2,5,'#fff0b8');P(x,y+6,8,1,INK);P(x+4,y,1,12,INK);P(x-2,y+12,12,2,'#3a4fae');P(x-2,y+13,12,1,'#141c4c')};
  const moss=(x0,x1,y,n)=>{for(let i=0;i<n;i++){const x=Math.round(x0+rr()*(x1-x0)),L=1+Math.floor(rr()*7);
    P(x-1,y,3,1,PAL.grass[1]);for(let k=0;k<L;k++)P(x+(k>3&&i%2?1:0),y+k,1,1,k===L-1&&L>4?PAL.grass[3]:PAL.grass[k%3?1:2])}};
  // socle de fondation et marches devant la porte
  masonry(0,138,176,12);P(0,138,176,1,'#3a4fae');dark(0,146,176,4,.35);
  // rempart
  masonry(30,92,116,46);volume(30,92,116,46);merlons(32,146,84,10,6);dark(30,92,116,3,.5);P(30,91,116,1,'#2a3a8a');
  // donjon et sa rosace
  masonry(62,50,52,42);volume(62,50,52,88);merlons(62,114,42,9,5);dark(62,50,52,3,.5);P(60,49,56,2,'#3a4fae');P(60,51,56,1,'#141c4c');
  {const cx=88,cy=70;for(let y=-9;y<=9;y++)for(let x=-9;x<=9;x++){const d=Math.hypot(x,y);
    if(d<=9.4&&d>7.4)P(cx+x,cy+y,1,1,x+y<0?'#3a4fae':'#1a2560');else if(d<=7.4)P(cx+x,cy+y,1,1,d>6.4?INK:d<2.2?'#fff0b8':(Math.abs(x)<1||Math.abs(y)<1||Math.abs(Math.abs(x)-Math.abs(y))<1)?INK:d<4.6?'#ffb653':'#c46a2a')}}
  // tours : contrefort, corps, mâchicoulis, toit pointu en ardoises de l'équipe, fanion
  for(const x of[6,140]){masonry(x-3,122,36,16);P(x-3,122,36,1,'#3a4fae');volume(x-3,122,36,16);
    masonry(x,40,30,82);volume(x,40,30,82);
    P(x-3,34,36,6,'#26357a');P(x-3,34,36,1,'#4a5cb0');for(let i=0;i<9;i++)P(x-2+i*4,38,2,3,INK);dark(x,40,30,4,.5);
    for(let y=0;y<30;y++){const half=Math.round(1+y*17/29),Y=4+y;for(let i=-half;i<=half;i++){const t=(i+half)/(2*half+1);
      let k=t<.2?3:t<.55?2:t<.85?1:0;if(y%4===3)k=Math.max(0,k-1);if(y%4===0&&((i+y)&3)===0)k=Math.max(0,k-1);P(x+15+i,Y,1,1,R[k])}}
    P(x-3,33,37,1,R[0]);P(x+15,0,1,5,'#d9c27a');P(x+15,0,1,1,'#fff3bb');
    const d=x<88?-1:1;for(let k=0;k<7;k++){const h=Math.max(1,3-Math.floor(k/2.5));P(x+15+d*(k+1),0+(3-h>>1),1,h,k<2?R[4]:R[3])}}
  // porte voûtée, herse, lumière chaude au fond
  {const cx=88,top=104,bot=138,r=14;
    for(let y=top-3;y<bot;y++){const yy=y-(top+r),half=yy<0?Math.sqrt(Math.max(0,(r+3)**2-yy*yy)):r+3;P(Math.round(cx-half),y,Math.round(half*2),1,'#2f40a0')}
    for(let y=top;y<bot;y++){const yy=y-(top+r),half=yy<0?Math.sqrt(Math.max(0,r*r-yy*yy)):r;P(Math.round(cx-half),y,Math.round(half*2),1,y>bot-12?'#5a2e14':y>bot-20?'#2a160c':INK)}
    for(let a=0;a<9;a++){const t=Math.PI+a*Math.PI/8;P(Math.round(cx+Math.cos(t)*(r+1.5)),Math.round(top+r+Math.sin(t)*(r+1.5)),1,2,INK)}
    P(cx-8,bot-6,16,6,'#ffb653');P(cx-5,bot-4,10,4,'#fff0b8');
    for(let x=cx-r+2;x<cx+r-1;x+=4)P(x,top+4,1,bot-top-10,'#3a4380');for(const y of[top+10,top+18])P(cx-r+1,y,2*r-2,1,'#3a4380');
    for(let x=cx-r+2;x<cx+r-1;x+=4)P(x,bot-7,1,2,'#d9c27a');
    P(cx-16,bot,32,1,'#4a5cb0');P(cx-19,bot+1,38,1,'#3a4fae')}
  const wins=[[16,62],[16,100],[150,62],[150,100],[47,108],[121,108],[84,64]];
  for(const[x,y]of wins.slice(0,6))win(x,y);
  // bannières aux couleurs de l'équipe, emblème du noyau
  for(const x of[64,104]){P(x-1,94,10,1,'#d9c27a');P(x-1,94,1,1,'#fff3bb');
    for(let y=0;y<22;y++){for(let i=0;i<8;i++){if(y>17&&Math.abs(i-3.5)<(y-17)*.9)continue;P(x+i,95+y,1,1,i<2?R[3]:i>5?R[0]:R[2])}}
    P(x+3,100,2,1,R[4]);P(x+2,101,4,3,R[4]);P(x+3,104,2,2,R[4]);P(x+3,102,1,1,'#ffffff');dark(x,95,8,1,.4)}
  // mousse et lierre qui pendent des créneaux et des corniches
  moss(32,146,92,14);moss(62,114,50,6);moss(4,36,40,4);moss(138,170,40,4);moss(2,172,138,10);
  P(2,149,172,1,'#3a4a96');c.wins=wins;return c}
function weaponSprite(kind,colA='#6c5baf',colB='#a8adff'){const c=mk(16,16),P=pen(c.getContext('2d'));
  if(kind==='sword'){for(let i=0;i<8;i++){P(6+i,9-i,1,2,colA);P(7+i,9-i,1,1,colB)}for(let i=0;i<4;i++)P(3+i,8+i,1,1,'#8c85ce');P(3,12,2,2,'#45396e');P(2,14,2,1,'#8c85ce')}
  else if(kind==='pick'){for(let i=0;i<10;i++)P(3+i,13-i,1,2,'#4e4e8b');for(const[x,y]of[[3,5],[4,4],[5,3],[6,2],[7,2],[8,2],[9,3],[10,3],[11,4],[12,5],[13,6],[13,7]])P(x,y,1,2,colA);P(6,2,3,1,colB);P(10,3,2,1,colB)}
  else{for(let y=2;y<14;y++){const x=6+(y>3&&y<12?2:0)+(y>5&&y<10?1:0);P(x,y,2,1,colA)}P(5,3,1,10,'#9eb0bd');P(7,7,3,2,'#d4ae74')}
  return outline(c,INK)}
function nugget(cols,big){return outline(pixTile((x,y)=>{const dx=x-8,dy=y-8;if(big?Math.abs(dx)*2+Math.abs(dy)<9:Math.abs(dx)<=4&&Math.abs(dy)<=3&&Math.abs(dx)+Math.abs(dy)<7)return dx+dy<-2?cols[2]:dx>1||dy>1?cols[0]:cols[1];return null},5),INK)}
function buildSprites(){
  SPR.player=heroSet(PROF.outfit);
  for(const t of[0,1]){const tc=t?'#e5534b':'#4f9df5',base={skin:'#caa58f',tunic:tc,pants:'#30334b',boots:'#1a1c2e',eye:t?'#ffb36b':'#9ff3ff'};
    SPR['warrior'+t]=charSet({...base,role:'warrior',helm:'#52647c',plume:tc,trim:'#a6bcc9'});
    SPR['archer'+t]=charSet({...base,role:'archer',hood:t?'#783e52':'#35587b'});
    SPR['miner'+t]=charSet({...base,role:'miner',hard:'#bb904f',beard:'#684b55'});
    SPR['healer'+t]=charSet({...base,role:'healer'});
    SPR['golem'+t]=golemSet(tc);SPR['core'+t]=coreSprite(tc);SPR['castle'+t]=castleSprite(t)}
  SPR.champion0=charSet({role:'champion',tunic:'#4f9df5',eye:'#9ff3ff'});
  SPR.champion1=charSet({role:'champion',skin:'#ae8e93',tunic:'#e5534b',pants:'#302238',boots:'#161626',helm:'#43394f',plume:'#ff8666',cape:'#942f4c',belt:'#ceaa6b',eye:'#ffe066'});
  SPR.zombie=charSet({role:'zombie',skin:'#87a18b',hair:'#303d46',tunic:'#665575',pants:'#303047',boots:'#1b2130'});
  SPR.ogre=ogreSet();
  SPR.slime=slimeFrames('#8273d9');SPR.slimeB=slimeFrames('#628ee7');
  SPR.arrow=(()=>{const c=mk(10,3),P=pen(c.getContext('2d'));P(0,0,3,1,'#2e6f9a');P(0,2,3,1,'#2e6f9a');P(1,0,1,1,'#5fd0f0');P(1,2,1,1,'#5fd0f0');P(0,1,8,1,'#c9d2ef');P(3,1,4,1,'#8f97c8');P(7,0,1,3,'#06060f');P(8,0,1,3,'#5fd0f0');P(8,1,2,1,'#e8fbff');return c})();
  const met={1:['#4e4e8b','#8f9bcf'],2:ORE[COPPER].slice(1),3:ORE[IRON].slice(1),4:ORE[DIAMOND].slice(1)};
  for(let i=1;i<=4;i++){ICON['pick'+i]=weaponSprite('pick',...met[i]);ICON['sword'+i]=weaponSprite('sword',...met[i])}ICON.bow=weaponSprite('bow');
  for(const[k,id]of Object.entries({coal:COAL,copper:COPPER,iron:IRON,silver:SILVER,gold:GOLD,diamond:DIAMOND,crystal:CRYSTAL}))ICON[k]=nugget(ORE[id],id===DIAMOND||id===CRYSTAL);
  ICON.wood=outline(pixTile((x,y)=>{if(x<3||x>12||y<5||y>11)return null;if(x>9)return y===5||y===11?'#29294f':x===11&&y>6&&y<10?'#29294f':'#8788ca';return y===5?'#6b6ab4':y===10||x===4?'#202040':'#454579'},1),INK);
  ICON.potion=outline(pixTile((x,y)=>{if(y>=2&&y<=5&&x>=6&&x<=9)return y===2?'#7d609d':'#85a9bc';if(y>=6&&y<=12&&x>=4&&x<=11&&!(y===6&&(x===4||x===11)))return x===4||x===11||y===12?'#54758b':y<8?'#a6ccd5':x===5?'#ffacb6':'#dc5c84';return null},1),INK);
  tileIcons();
  ICON.bomb=outline(pixTile((x,y)=>{const dx=x-7.5,dy=y-9.5,r=dx*dx+dy*dy;if(r<20)return r<3&&dx<0&&dy<0?(r<1.5?'#e8fbff':'#9ff3ff'):dy>=-.5&&dy<=.5?'#4f5aa0':dx+dy>2?'#12142c':'#2c3166';
    if(x>=7&&x<=8&&y===5)return '#4f5aa0';if(x>=7&&x<=8&&y>=3&&y<=4)return '#6a7390';if(y===2&&x===9)return '#ff6a3a';if(y===1&&x===10)return '#ffb653';if(y===0&&x===11)return '#fff3bb';return null},3),INK);
  ICON.torch=(()=>{const c=mk(16,16);c.getContext('2d').drawImage(TEX[TORCH][0],0,0);return c})();
}
function tileIcons(){for(const[k,id]of[['dirt',DIRT],['stone',STONE],['plank',PLANK],['brick',BRICK]]){const c=mk(16,16),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(TEX[id][0],2,2,12,12);ICON[k]=outline(c,INK)}}
// personnages peints (www/art/units-hd.png, Higgsfield façon Animal Well, ~34 px de haut : silhouettes, yeux lumineux) ;
// tant que l'image n'est pas chargée (ou si elle manque), les sprites dessinés par code ci-dessus servent
// <hd-art> généré par tools/gen-hd-art.py, ne pas modifier à la main (images intégrées : getImageData marche aussi en file://)
const UNITS_HD='data:image/png;base64,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';
const TILES_HD='data:image/png;base64,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';
const TREES_HD='data:image/png;base64,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';
// </hd-art>
const UNIT_ART={im:new Image(),ok:false,r:{hero:[0,0,29,34],warrior0:[30,0,37,34],warrior1:[68,0,26,34],archer0:[95,0,27,34],archer1:[123,0,30,34],miner0:[154,0,29,34],miner1:[184,0,27,34],
  champion0:[212,0,31,36],champion1:[244,0,37,36],zombie:[282,0,25,34],golem0:[308,0,42,40],golem1:[351,0,47,40],slime:[399,0,20,16],core0:[420,0,25,38],core1:[446,0,22,38],slimeB:[469,0,20,16]}};
UNIT_ART.im.onload=()=>{try{artSprites()}catch(e){UNIT_ART.ok=false;console.warn('units-hd',e)}};UNIT_ART.im.src=UNITS_HD;
function artCrop(n){const[x,y,w,h]=UNIT_ART.r[n],c=mk(w,h);c.getContext('2d').drawImage(UNIT_ART.im,x,y,w,h,0,0,w,h);return c}
// yeux lumineux isolés (pixels très clairs et saturés de la tête) pour la traînée de mouvement
function eyeMask(c){const o=mk(c.width,c.height),g=o.getContext('2d');g.drawImage(c,0,0);const im=g.getImageData(0,0,c.width,c.height),d=im.data,lim=c.height*.45;let n=0;
  for(let i=0;i<d.length;i+=4){const y=(i>>2)/c.width|0,mx=Math.max(d[i],d[i+1],d[i+2]),mn=Math.min(d[i],d[i+1],d[i+2]);if(d[i+3]>10&&y<lim&&mx>225&&(mx-mn)/mx>.5)n++;else d[i+3]=0}
  g.putImageData(im,0,0);return n>0&&n<30?o:null}
const setLR=fr=>{const R={...fr,eyes:eyeMask(fr.idle[0])},L={walk:fr.walk.map(flipC),idle:fr.idle.map(flipC),jump:flipC(fr.jump),atk:flipC(fr.atk),wind:flipC(fr.wind)};L.eyes=eyeMask(L.idle[0]);return{R,L}};
// une image fixe devient 11 poses : buste qui respire, jambes qui s'écartent, saut jambes repliées, élan, frappe
// marche en 8 temps : chaque jambe avance puis recule, celle qui passe devant se lève, le corps descend au contact
// découpe proportionnelle : tête 0-40 %, buste 40-76 %, jambes 76-100 % (gauche/droite au milieu)
function artChar(src){const W=src.width,H=src.height,hh=Math.round(H*.4),tt=Math.round(H*.76),lh=H-tt,hw=W>>1,P=3;
  const fr=(s,bob,dx=0,jump=false,lean=0)=>{const c=mk(W+P*2,H+1),g=c.getContext('2d');g.imageSmoothingEnabled=false;const x0=P+dx;
    g.drawImage(src,0,0,W,hh,x0+lean,bob,W,hh);g.drawImage(src,0,hh,W,tt-hh,x0,hh+bob,W,tt-hh);
    if(jump){const j=Math.round(lh*.75);g.drawImage(src,0,tt,hw,lh,x0+1,tt-2,hw,j);g.drawImage(src,hw,tt,W-hw,lh,x0+hw-1,tt-1,W-hw,j)}
    else{const la=s<0?1:0,ra=s>0?1:0;g.drawImage(src,0,tt,hw,lh,x0-s,tt-la,hw,lh);g.drawImage(src,hw,tt,W-hw,lh,x0+hw+s,tt-ra,W-hw,lh)}return c};
  const lf=[0,1,2,1,0,-1,-2,-1];
  return setLR({walk:lf.map(s=>fr(s,Math.abs(s)===2?1:0,0,false,s===0?1:0)),idle:[fr(0,0),fr(0,1)],jump:fr(0,-1,0,true),wind:fr(0,0,-1,false,-1),atk:fr(0,1,2,false,1)})}
function artGolem(src){const W=src.width,H=src.height,fr=(bob,dx=0,dy=0)=>{const c=mk(W+4,H+4),g=c.getContext('2d');g.globalAlpha=.9;g.drawImage(src,2+dx,3+bob+dy);return c};
  return setLR({walk:[fr(0),fr(1),fr(0),fr(1)],idle:[fr(0),fr(1)],jump:fr(0,0,-2),wind:fr(0,-1),atk:fr(0,2)})}
function artSlime(src){const W=src.width,H=src.height,CW=W+6,CH=H+5;
  return[[W,H],[W+4,H-3],[W-3,H+4]].map(([w,h])=>{const c=mk(CW,CH),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(src,0,0,W,H,(CW-w)>>1,CH-1-h,w,h);return c})}
function artCore(src){const W=26,H=src.height+3;return[0,-1,0,1].map(dy=>{const c=mk(W,H),g=c.getContext('2d');g.drawImage(src,(W-src.width)>>1,2+dy);return c})}
// ==================== HÉROS MODULAIRE (poupée de papier) ====================
// Le héros est le sprite HD Higgsfield (units-hd.png, 'hero'), découpé en calques et animé par code (heroHDDoll) ;
// heroFrame ne sert plus que de repli procédural quand l'atlas HD n'est pas chargé.
// Chaque emplacement (tête, cape, tunique, accessoire, yeux) a ses pièces et sa couleur, pour la boutique de personnalisation.
// Une tenue (OUTFITS[].look) est un préréglage d'emplacements ; PROF.look peut surcharger pièce par pièce.
// Calques HD : cape, jambe arrière, jambe avant, bas de cape, buste (+ceinture d'étoffe), tête, coiffe, yeux, écharpe, épée.
const HERO_PARTS={head:{hood:'Capuche',pointed:'Capuche pointue',horns:'Capuche à cornes',helm:'Heaume',hat:'Chapeau'},
  cape:{none:'Sans cape',short:'Cape courte',long:'Grande cape',scarf:'Écharpe'},acc:{belt:'Ceinture',sash:'Ceinture d\'étoffe',none:'Aucun'},
  eyes:['#ffd84a','#7ff0ff','#ff6a50','#c08cff','#a8ff7a','#ffffff']};
const HERO_BASE={head:'hood',headCol:'#daa84a',tunic:'#2f3a5b',cape:'none',capeCol:'#a95572',pants:'#2b3048',boots:'#5b4a3c',acc:'belt',accCol:'#7a5a3a',eyes:'#ffd84a'};
// une pose : bob (buste qui descend), lean (tête), la/lb et ua/ub (pas et levée des jambes avant/arrière), tuck (jambes repliées),
// afx/afy et abx/aby (bras avant/arrière), cape (flottement, négatif = soulevée), blink, hurt, dead
function heroFrame(k,q={}){const W=26,H=36,c=mkE(W,H),P=pen(c.getContext('2d')),E=pen(c.emi.getContext('2d')),ink='#05050c',VOID='#0b0b18';
  const RH=hueRamp(k.headCol),RT=hueRamp(k.tunic),RP=hueRamp(k.pants),RB=hueRamp(k.boots),RC=hueRamp(k.capeCol),RA=hueRamp(k.accCol);
  const b=q.bob||0,f=q.cape||0,hooded=k.head==='hood'||k.head==='pointed'||k.head==='horns';
  const leg=(x,lift,front)=>{const y0=26+b,y1=Math.min(35,(q.tuck?31:34)+(q.tuck?b:0))-lift;
    if(y1-3>y0)P(x,y0,3,y1-3-y0,front?RP[2]:RP[1]);if(front)P(x,y0,1,Math.max(0,y1-3-y0),RP[3]);
    P(x,y1-3,3,3,front?RB[2]:RB[1]);P(x,y1-3,3,1,front?RB[3]:RB[2]);P(x+1,y1-1,front?3:2,1,front?RB[1]:RB[0])};
  // cape dans le dos : s'évase vers l'arrière, flotte selon la vitesse
  if(k.cape==='short'||k.cape==='long'){const len=(k.cape==='long'?15:9)-(f<0?-f*2:0),fl=f<0?2:f;
    for(let j=0;j<len;j++){const w=3+Math.floor(j*.45),dx=Math.round(fl*j/len*2.2),x0=10-w-dx;
      P(x0,16+b+j,16-x0,1,j===0?RC[3]:j===len-1?RC[0]:RC[2]);P(x0,16+b+j,1,1,RC[1])}}
  leg(10+(q.lb||0),q.ub||0,false);
  P(7+(q.abx||0),18+b+(q.aby||0),3,5,RT[0]);P(7+(q.abx||0),22+b+(q.aby||0),3,2,RB[0]);
  roundBody(P,8,15+b,11,12,RT,{square:true});
  if(k.acc==='belt'){P(8,23+b,11,2,RA[1]);P(8,23+b,11,1,RA[2]);P(15,23+b,2,2,'#e9d48a');P(15,23+b,1,1,'#fff3c0')}
  else if(k.acc==='sash'){P(8,22+b,11,2,RA[2]);P(9,22+b,9,1,RA[3]);P(9,24+b,2,3,RA[1]);P(9,24+b,1,1,RA[2])}
  leg(14+(q.la||0),q.ua||0,true);
  // mantelet de la capuche sur les épaules, ou gorgerin sous le heaume
  if(hooded)roundBody(P,6,13+b,14,8,RH);else if(k.head==='helm')roundBody(P,8,14+b,11,4,RH);
  const x0=6+(q.lean||0),y0=2+b;let ey=y0+7,ex=x0+7;
  if(hooded){roundBody(P,x0,y0,15,14,RH);
    if(k.head==='hood'){P(x0,y0+1,2,2,RH[2]);P(x0-1,y0,2,1,RH[3])}
    if(k.head==='pointed')[[1,0],[0,-1],[-1,-1],[-2,0],[-3,1]].forEach(([dx,dy],i)=>P(x0+dx,y0+dy,2,2,RH[i<2?3:i<4?2:1]));
    if(k.head==='horns'){const I=hueRamp('#e8dcc0');for(const[hx,s]of[[x0+3,-1],[x0+11,1]]){P(hx,y0,2,1,I[2]);P(hx+s,y0-1,2,1,I[3]);P(hx+s*2,y0-2,1,1,I[4])}}
    // ouverture du visage : ovale noir où brillent les yeux
    [4,6,8,8,8,7,5].forEach((w,i)=>P(x0+13-w,y0+4+i,w,1,i===0?'#1d1e38':VOID));P(x0+5,y0+6,1,3,RH[0])}
  else if(k.head==='helm'){const M=RH;roundBody(P,x0+1,y0+1,13,13,M);P(x0+5,y0+6,9,3,VOID);P(x0+9,y0+9,2,3,VOID);P(x0+5,y0+5,9,1,M[4]);
    P(x0+5,y0-1,5,2,RC[2]);P(x0+3,y0,3,2,RC[1]);P(x0+6,y0-1,3,1,RC[3]);ey=y0+6;ex=x0+7}
  else if(k.head==='hat'){roundBody(P,x0+2,y0+3,12,11,hueRamp('#2a2840'));[6,8,8,8,6].forEach((w,i)=>P(x0+13-w,y0+6+i,w,1,VOID));
    P(x0-1,y0+4,18,2,RH[1]);P(x0-1,y0+4,18,1,RH[3]);roundBody(P,x0+3,y0-1,10,6,RH);P(x0+3,y0+3,10,1,RC[2]);ey=y0+8;ex=x0+7}
  if(k.cape==='scarf'){P(9,14+b,10,2,RC[2]);P(9,14+b,10,1,RC[3]);const up=f<0?-1:0;
    for(let j=0;j<5;j++)P(8-j-Math.max(0,f-1),15+b+(j>>1)+up*j,2,1,RC[j<2?2:1])}
  // yeux lumineux (calque émissif, dessiné après l'éclairage)
  const EC=q.dead?'#3a3a55':q.hurt?'#ffffff':k.eyes,ER=hueRamp(EC);
  for(const xx of[ex,ex+3]){if(q.blink||q.dead){P(xx,ey+1,2,1,ER[1]);if(!q.dead)E(xx,ey+1,2,1,ER[2])}
    else if(q.hurt){P(xx,ey,2,1,'#ffffff');P(xx+1,ey+1,1,1,'#ffd0d0');E(xx,ey,2,2,'#ffe0e0')}
    else{P(xx,ey,2,2,EC);P(xx,ey,1,1,ER[4]);E(xx,ey,2,2,EC)}}
  const ax=17+(q.afx||0),ay=18+b+(q.afy||0);P(ax,ay,3,5,RT[2]);P(ax,ay,3,1,RT[3]);P(ax,ay+4,3,2,RB[2]);P(ax,ay+4,1,1,RB[3]);
  return selout(c,RT[0],ink)}
// rotation d'une pose (chute), pivot à la taille, pieds au sol
function heroRot(img,a){const c=mkE(44,36);for(const[s,d]of[[img,c],[img.emi,c.emi]]){const g=d.getContext('2d');g.imageSmoothingEnabled=false;g.translate(26,27);g.rotate(a);g.drawImage(s,-13,-24)}return c}
function heroDollProc(k){const F=q=>heroFrame(k,q),lf=[0,1,2,1,0,-1,-2,-1],kneel=F({tuck:1,bob:3,lean:-1,dead:1,afy:2,aby:2});
  const R={walk:lf.map((s,i)=>F({la:s,lb:-s,ua:i===5||i===6?1:0,ub:i===1||i===2?1:0,bob:Math.abs(s)===2?1:0,afx:Math.round(-s*.6),abx:Math.round(s*.6),cape:1+(i%4<2?0:1)})),
    idle:[F({}),F({cape:1}),F({bob:1,cape:1}),F({bob:1})],blink:F({blink:1}),
    jump:F({tuck:1,bob:-1,afx:1,afy:-2,abx:-1,aby:-2,cape:-1}),fall:F({la:1,lb:-1,afy:-4,aby:-4,cape:-2}),
    wind:F({lean:-1,afx:-4,afy:-4,abx:-1,la:1,lb:-1}),atk:F({lean:1,afx:3,afy:-1,la:2,lb:-1,bob:1,cape:2}),atk2:F({lean:1,afx:2,afy:2,la:2,lb:-1,bob:1,cape:1}),
    mine:[F({lean:-1,afx:-1,afy:-5}),F({lean:1,afx:3,afy:1,bob:1})],hurt:F({lean:-1,hurt:1,afx:-2,afy:-2,lb:-1,cape:2}),
    death:[F({hurt:1,lean:-1,bob:1}),kneel,heroRot(kneel,-Math.PI/4),heroRot(F({dead:1}),-Math.PI/2)]};
  const L={};for(const n in R)L[n]=Array.isArray(R[n])?R[n].map(flipE):flipE(R[n]);R.eyes=R.idle[0].emi;L.eyes=L.idle[0].emi;return{R,L}}
// --- héros HD : le sprite Higgsfield (UNIT_ART hero) découpé en pièces puis animé et recolorié ---
// Pièces lues pixel par pixel dans le sprite 29x34 (tourné vers la droite) : tête (lignes 0-12), jambes (30+, arrière x<12, avant x>=12),
// bas de cape (x<=4, rejoué décalé pour flotter), épée (x>=20/y>=22, pivote autour de la main 19.5,23.5), yeux (pixels clairs du visage).
// Couleurs : la capuche/mantelet (jaunes) suit headCol, la tunique (bleus) suit tunic, les yeux suivent eyes (calque émissif).
const HERO_REF={headCol:'#daa84a',tunic:'#2f3a5b'};
function heroRGBHsl(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;if(!d)return[0,0,l];
  const s=d/(1-Math.abs(2*l-1));let h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;return[(h*60+360)%360,s,l]}
function heroTint(h,s,l,ref,to){if(ref===to)return null;const[rh,rs,rl]=hex2hsl(ref),[th,ts,tl]=hex2hsl(to);
  return hsl2hex(th+(h-rh)*.5,Math.min(1,ts*Math.min(1.3,s/Math.max(.05,rs))),Math.min(.94,l*tl/Math.max(.05,rl)))}
function heroHDParts(k){const S=artCrop('hero'),w=S.width,h=S.height,D=S.getContext('2d').getImageData(0,0,w,h).data,PAD=4;
  const part=()=>{const c=mk(w+PAD*2,h+PAD*2);return{c,P:pen(c.getContext('2d'))}};
  const H={head:part(),body:part(),legB:part(),legF:part(),hem:part(),sword:part(),over:part(),cape:null,eyes:[],PAD};
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(D[i+3]<128)continue;
    const r=D[i],g=D[i+1],b=D[i+2],[hh,ss,ll]=heroRGBHsl(r,g,b);let col='#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
    const sword=(x>=20&&y>=22)||(x>=19&&y>=24),eye=x>=10&&x<=17&&y>=6&&y<=10&&ll>.45;
    if(eye){H.eyes.push([x,y,ll>.6?1:0]);continue}
    if(!sword&&y<30&&hh>=18&&hh<=52&&ss>.28&&ll>.16){const t=heroTint(hh,ss,ll,HERO_REF.headCol,k.headCol);if(t)col=t}
    else if(!sword&&hh>=205&&hh<=255&&ss>.25){const t=heroTint(hh,ss,ll,HERO_REF.tunic,k.tunic);if(t)col=t}
    const p=sword?H.sword:y<=12?H.head:y>=30&&x>=5?(x<12?H.legB:H.legF):H.body;p.P(x+PAD,y+PAD,1,1,col);
    if(!sword&&x<=4&&y>=17&&y<=31)H.hem.P(x+PAD,y+PAD,1,1,col)}
  const RH=hueRamp(k.headCol),RC=hueRamp(k.capeCol),RA=hueRamp(k.accCol),O=(x,y,ww,hh,c)=>H.over.P(x+PAD,y+PAD,ww,hh,c),ink='#05050c';
  if(k.head==='pointed')[[5,0],[4,-1],[3,-1],[2,-2],[1,-2],[0,-3]].forEach(([x,y],i)=>{O(x,y-1,2,1,ink);O(x,y,2,2,RH[i<2?3:i<4?2:1])});
  if(k.head==='horns'){const I=hueRamp('#e8dcc0');for(const[hx,s]of[[7,-1],[14,1]]){O(hx,0,2,1,I[2]);O(hx+s,-1,2,1,I[3]);O(hx+s*2,-2,1,1,I[4]);O(hx+s*2,-3,1,1,ink)}}
  if(k.head==='helm'){O(8,-3,6,4,ink);O(9,-2,4,3,RC[2]);O(9,-2,4,1,RC[3]);O(10,5,8,1,RH[4])}
  if(k.head==='hat'){O(2,2,21,4,ink);O(3,3,19,2,RH[1]);O(3,3,19,1,RH[3]);O(6,-4,13,7,ink);O(7,-3,11,6,RH[2]);O(7,-3,11,1,RH[4]);O(7,1,11,1,RC[2])}
  if(k.cape==='scarf'){O(6,11,13,4,ink);O(7,12,11,2,RC[2]);O(7,12,11,1,RC[3])}
  if(k.acc==='sash')for(let i=0;i<7;i++){H.body.P(11+i+PAD,16+i+PAD,2,1,RA[2]);H.body.P(11+i+PAD,17+i+PAD,1,1,RA[1])}
  H.RC=RC;H.ER=hueRamp(k.eyes);return H}
// une pose : bob (buste qui descend), lean (tête), la/lb ua/ub (pas et levée des jambes), tuck (jambes repliées), cape (flottement),
// sw (rotation de l'épée, 0 = au repos), sx/sy (déplacement de la main), blink, hurt, dead
function heroHDFrame(H,k,q={},armed=true){const W=48,HT=38,OX=12-H.PAD,OY=3-H.PAD,c=mkE(W,HT),g=c.getContext('2d'),E=pen(c.emi.getContext('2d')),P=pen(g),ink='#05050c';
  g.imageSmoothingEnabled=false;const b=q.bob||0,f=Math.max(0,q.cape||0),ln=q.lean||0,lt=q.tuck?2:0,d=(p,x,y)=>g.drawImage(p.c,OX+x,OY+y);
  if(k.cape==='short'||k.cape==='long'){const len=k.cape==='long'?18:10,RC=H.RC;
    for(let j=0;j<len;j++){const ww=3+Math.floor(j*.4),dx=Math.round(f*j/len*2),x0=12+6-ww-dx;
      P(x0-1,3+13+b+j,ww+5,1,ink);P(x0,3+13+b+j,ww+4,1,j===0?RC[3]:j===len-1?RC[0]:RC[2]);P(x0,3+13+b+j,1,1,RC[1])}
    P(12+6-3-Math.floor(len*.4)-Math.round(f*2)-1,3+13+b+len,Math.floor(len*.4)+8,1,ink)}
  d(H.legB,q.lb||0,-(q.ub||0)-lt);d(H.legF,q.la||0,-(q.ua||0)-lt);
  if(f)d(H.hem,-f,b);d(H.body,0,b);d(H.head,ln,b);d(H.over,ln,b);
  if(k.cape==='scarf'){const RC=H.RC;for(let j=0;j<5;j++){const x=12+5-j-Math.max(0,f-1),y=3+13+b+(j>>1);P(x,y-1,2,1,ink);P(x,y,2,1,RC[j<2?2:1])}}
  const EC=q.dead?'#3a3a55':q.hurt?'#ffffff':k.eyes;
  for(const[x,y,hi]of H.eyes){const X=12+x+ln,Y=3+y+b;
    if(q.dead)P(X,Y,1,1,EC);else if(q.blink){if(y===8){P(X,Y,1,1,H.ER[1]);E(X,Y,1,1,H.ER[2])}else P(X,Y,1,1,'#292837')}
    else{const cc=hi&&!q.hurt?H.ER[3]:EC;P(X,Y,1,1,cc);E(X,Y,1,1,cc)}}
  if(armed){g.save();g.translate(12+19.5+(q.sx||0),3+23.5+b+(q.sy||0));g.rotate(q.sw||0);g.drawImage(H.sword.c,-19.5-H.PAD,-23.5-H.PAD);g.restore()}
  return c}
// rotation d'une pose HD (chute), pivot aux hanches
// rotation d'une pose HD (chute), pivot aux pieds, puis reposée au sol (dernière ligne opaque sur la ligne 36)
function heroRotHD(img,a){const T=[img,img.emi].map(s=>{const t=mk(96,96),g=t.getContext('2d');g.imageSmoothingEnabled=false;g.translate(48,60);g.rotate(a);g.drawImage(s,-24,-36);return t});
  const D=T[0].getContext('2d').getImageData(0,0,96,96).data;let by=60;for(let i=D.length-1;i>=0;i-=4)if(D[i]>100){by=Math.floor((i>>2)/96);break}
  const c=mkE(64,38);c.getContext('2d').drawImage(T[0],-16,36-by);c.emi.getContext('2d').drawImage(T[1],-16,36-by);return c}
function heroHDDoll(k){const H=heroHDParts(k),mkSet=armed=>{const F=q=>heroHDFrame(H,k,q,armed),lf=[0,1,2,1,0,-1,-2,-1],kneel=F({tuck:1,bob:3,lean:-1,dead:1,sw:.6});
  const R={walk:lf.map((s,i)=>F({la:s,lb:-s,ua:i===5||i===6?1:0,ub:i===1||i===2?1:0,bob:Math.abs(s)===2?0:i%4===0?1:0,cape:1+(i%4<2?0:1),sw:s*.06})),
    idle:[F({}),F({cape:1}),F({bob:1,cape:1}),F({bob:1})],blink:F({blink:1}),
    jump:F({tuck:1,cape:2,sw:-.35,sy:-1}),fall:F({la:1,lb:-1,cape:1,sw:-.6,sy:-2}),
    wind:F({lean:-1,sw:-2.5,sx:-3,sy:-4,la:1,lb:-1}),atk:F({lean:1,sw:-.75,sx:2,sy:-2,la:2,lb:-1,bob:1,cape:2}),atk2:F({lean:1,sw:.55,sx:2,la:2,lb:-1,bob:1,cape:1}),
    mine:[F({lean:-1}),F({lean:1,bob:1})],hurt:F({lean:-1,hurt:1,lb:-1,cape:2,sw:-.4}),
    death:[F({hurt:1,lean:-1,bob:1}),kneel,heroRotHD(kneel,-Math.PI/4),heroRotHD(F({dead:1,sw:.3}),-Math.PI/2)]};
  const L={};for(const n in R)L[n]=Array.isArray(R[n])?R[n].map(flipE):flipE(R[n]);R.eyes=R.idle[0].emi;L.eyes=L.idle[0].emi;return{R,L}};
  const A=mkSet(true);A.U=mkSet(false);return A}
function heroDoll(k){return UNIT_ART.ok?heroHDDoll(k):heroDollProc(k)}
const heroLookOf=(id,extra)=>{const o=OUTFITS.find(o=>o.id===id)||OUTFITS[0];return Object.assign({},HERO_BASE,o.look,extra)};
function heroSet(id,extra=id===PROF.outfit?PROF.look:null){return heroDoll(heroLookOf(id,extra))}
// pose du joueur : blessé, minage, coup d'épée en 3 temps, saut/chute, marche, respiration et clignement
// armed=false : jeu de poses sans l'épée du sprite (pioche ou autre objet en main)
function heroPick(set,p,armed=true){const s=(armed||!set.U?set:set.U)[p.dir<0?'L':'R'];
  if(p.iframes>.12)return s.hurt;if(mining)return(time*5)%1<.45?s.mine[0]:s.mine[1];
  if(p.swing>0){const t=1-p.swing/.32;return t<.22?s.wind:t<.6?s.atk:s.atk2}
  if(!p.onGround)return p.vy<-20?s.jump:s.fall;if(Math.abs(p.vx)>4)return s.walk[Math.floor(p.anim)%s.walk.length];
  return time%3.4<.13?s.blink:s.idle[Math.floor(time*2.4)%4]}
function artSprites(){UNIT_ART.ok=true;
  for(const n of['warrior0','warrior1','archer0','archer1','miner0','miner1','champion0','champion1','zombie'])SPR[n]=artChar(artCrop(n));
  for(const t of[0,1])SPR['golem'+t]=artGolem(artCrop('golem'+t))
  SPR.slime=artSlime(artCrop('slime'));SPR.slimeB=artSlime(artCrop('slimeB'));
  SPR.player=heroSet(PROF.outfit);for(const k in OUTFIT_SPR)delete OUTFIT_SPR[k]}

// =====================================================================
//  MONDE
// =====================================================================
let visualDebris=[];
let trees=[],fg,bg,surf,lightSky,lightTorch,lightDirty=true,lastLight=0,mmC,mmG;
const BASE_GY=64;
const idx=(x,y)=>y*WW+x;
const getT=(x,y)=>(x<0||x>=WW||y<0||y>=WH)?(y<0?AIR:BEDROCK):fg[idx(x,y)];
function solidAt(tx,ty){if(tx<0||tx>=WW)return true;if(ty<0)return false;if(ty>=WH)return true;return TD[fg[ty*WW+tx]].solid}
function genWorld(seed){
  SEED=seed;rnd=mulberry(seed);mmG=null;
  fg=new Uint8Array(WW*WH);bg=new Uint8Array(WW*WH);surf=new Int16Array(WW);
  const C=WW/2;
  for(let x=0;x<WW;x++){
    let h=63+(fbm1(x*.025,3)-.5)*16+(vn1(x*.11,9)-.5)*3;
    const d=Math.abs(x-C)/70;if(d<1){const m=Math.pow(1-d,1.6);h-=m*46+(vn1(x*.18,21)-.5)*7*m}
    const be=Math.min(x,WW-1-x);if(be<38){const k=be<28?1:1-(be-28)/10;const kk=k*k*(3-2*k);h=lerp(h,BASE_GY,kk)}
    surf[x]=Math.round(h)}
  for(let i=0;i<2;i++)for(let x=1;x<WW-1;x++){const a=surf[x-1],b=surf[x+1];if(surf[x]<a&&surf[x]<b)surf[x]=Math.min(a,b);if(surf[x]>a&&surf[x]>b)surf[x]=Math.max(a,b)}
  for(let x=0;x<WW;x++){const s=surf[x],dd=3+Math.floor(vn1(x*.2,5)*4)-(s<40?2:0);const deepY=108+Math.floor((vn1(x*.05,8)-.5)*10);
    for(let y=0;y<WH;y++){let t=AIR;
      if(y===s)t=s<36?SNOW:GRASS;else if(y>s&&y<=s+dd)t=s<36?STONE:DIRT;else if(y>s)t=y>deepY?DEEP:STONE;
      if(y>=WH-2-Math.floor(hash2(x,999)*2))t=BEDROCK;
      fg[idx(x,y)]=t;bg[idx(x,y)]=y>s+1?(y<s+dd+3?1:2):0}}
  // grottes (bruit + vers)
  for(let x=0;x<WW;x++)for(let y=0;y<WH-3;y++){const s=surf[x];if(y<s+7)continue;const be=Math.min(x,WW-1-x);if(be<36&&y<BASE_GY+16)continue;
    const n=fbm2(x*.055,y*.085,4,4),m=fbm2(x*.03,y*.03,11,3);if(n>.64||(m>.68&&n>.5))fg[idx(x,y)]=AIR}
  for(let k=0;k<26;k++){let x=R(40,WW-40),y=R(surf[x|0]+3,WH-12),a=R(0,6.28),len=RI(40,120),rad=R(1,2.4);
    for(let i=0;i<len;i++){a+=R(-.35,.35);x+=Math.cos(a);y+=Math.sin(a)*.7;const be=Math.min(x,WW-1-x);if(be<38)break;
      for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++){if(dx*dx+dy*dy>rad*rad)continue;const X=Math.round(x+dx),Y=Math.round(y+dy);if(X>1&&X<WW-2&&Y>surf[X]+2&&Y<WH-3)fg[idx(X,Y)]=AIR}}}
  // salle au trésor dans la montagne
  {const cx=C,cy=surf[C]+26;for(let dy=-5;dy<=4;dy++)for(let dx=-11;dx<=11;dx++){if((dx*dx)/121+(dy*dy)/25<1)fg[idx(cx+dx,cy+dy)]=AIR}
   for(let dx=-9;dx<=9;dx++)if(rnd()<.45){const y=cy+4;for(let k=0;k<2;k++)if(fg[idx(cx+dx,y+k)]!==AIR)fg[idx(cx+dx,y+k)]=rnd()<.5?GOLD:CRYSTAL}}
  // filons
  const vein=(id,n,ok,sz)=>{if(daily&&daily.mod.id==='rich')n*=2;for(let i=0;i<n;i++){let x=RI(4,WW-5),y=RI(10,WH-4);if(!ok(x,y))continue;const L=RI(sz[0],sz[1]);
    for(let j=0;j<L;j++){const t=fg[idx(x,y)];if(t===STONE||t===DEEP)fg[idx(x,y)]=id;x=clamp(x+RI(-1,1),1,WW-2);y=clamp(y+RI(-1,1),1,WH-4)}}};
  const depth=(x,y)=>y-surf[x], mount=x=>Math.abs(x-C)<60;
  vein(COAL,420,(x,y)=>depth(x,y)>3,[3,9]);
  vein(COPPER,330,(x,y)=>depth(x,y)>3,[3,8]);
  vein(IRON,260,(x,y)=>depth(x,y)>12||(mount(x)&&depth(x,y)>4),[3,7]);
  vein(SILVER,200,(x,y)=>depth(x,y)>26||(mount(x)&&depth(x,y)>6),[2,6]);
  vein(GOLD,160,(x,y)=>depth(x,y)>42||(mount(x)&&depth(x,y)>9),[2,6]);
  vein(DIAMOND,90,(x,y)=>y>100||(Math.abs(x-C)<34&&depth(x,y)>16),[1,4]);
  vein(CRYSTAL,60,(x,y)=>depth(x,y)>30,[1,3]);
  // arbres et plantes
  let last=-10;trees=[];
  for(let x=6;x<WW-6;x++){const s=surf[x],be=Math.min(x,WW-1-x);if(fg[idx(x,s)]!==GRASS)continue;
    if(be>36&&x-last>4&&rnd()<.22&&s>40){const h=RI(4,8);for(let k=1;k<=h;k++)fg[idx(x,s-k)]=LOG;const top=s-h,r=RI(2,3);
      for(let dy=-r-1;dy<=r-1;dy++)for(let dx=-r;dx<=r;dx++){if(dx*dx+(dy+.5)*(dy+.5)>r*r+1)continue;const X=x+dx,Y=top+dy;if(fg[idx(X,Y)]===AIR)fg[idx(X,Y)]=LEAF}
      trees.push({x,top,r,img:treeImg(r,x,seed+x)});last=x}
    else if(fg[idx(x,s-1)]===AIR&&rnd()<.45)fg[idx(x,s-1)]=PLANT}
  // bassins d'eau souterrains
  for(let k=0;k<55;k++){let x=RI(40,WW-40),y=RI(surf[x]+10,WH-12);if(fg[idx(x,y)]!==AIR)continue;while(y<WH-4&&fg[idx(x,y+1)]===AIR)y++;
    const wd=RI(4,11),ht=RI(2,4);for(let dy=0;dy<ht;dy++)for(let dx=-wd;dx<=wd;dx++){const X=x+dx,Y=y-dy;if(X>1&&X<WW-2&&fg[idx(X,Y)]===AIR)fg[idx(X,Y)]=WATER}}
  wActive=new Set();for(let i=0;i<fg.length;i++)if(fg[i]===WATER)wActive.add(i);for(let k=0;k<500&&wActive.size;k++)waterStep();
  // décor des grottes : lianes, champignons luminescents, fougères
  for(let x=2;x<WW-2;x++)for(let y=1;y<WH-3;y++){const i=idx(x,y);if(fg[i]!==AIR||y<surf[x]+5)continue;const up=fg[idx(x,y-1)],dn=fg[idx(x,y+1)];
    if(TD[up].solid&&up!==BEDROCK&&rnd()<.17){const L=RI(1,5);for(let k=0;k<L&&fg[idx(x,y+k)]===AIR&&!TD[fg[idx(x,y+k+1)]].solid;k++)fg[idx(x,y+k)]=VINE}
    else if(TD[dn].solid&&dn!==BEDROCK){const r=rnd();if(r<.08)fg[i]=MUSH;else if(r<.22)fg[i]=CPLANT}}
  // coffres au trésor posés au sol des grottes, loin des bases
  for(let k=0,n=0;k<4000&&n<16;k++){const x=RI(50,WW-51),y=RI(surf[x]+14,WH-6);if(fg[idx(x,y)]!==AIR&&fg[idx(x,y)]!==CPLANT)continue;const dn=fg[idx(x,y+1)];if(!TD[dn].solid||dn===BEDROCK)continue;fg[idx(x,y)]=CHEST;n++}
  // fondations des bases
  for(const side of[0,1]){for(let i=0;i<30;i++){const x=side?WW-1-i:i;for(let y=0;y<BASE_GY;y++){fg[idx(x,y)]=AIR}
      if(i>=13&&i<=25){fg[idx(x,BASE_GY)]=CASTLE;fg[idx(x,BASE_GY+1)]=CASTLE;}}}
  for(let x=0;x<WW;x++){let s=0;while(s<WH&&!TD[fg[idx(x,s)]].solid)s++;surf[x]=s}
  lightSky=new Float32Array(WW*WH);lightTorch=new Float32Array(WW*WH);lightDirty=true;
  wActive=new Set();mmC=mk(WW,WH);mmG=mmC.getContext('2d');for(let y=0;y<WH;y++)for(let x=0;x<WW;x++)mmPix(x,y);
}
function mmPix(x,y){if(!mmG)return;const t=fg[idx(x,y)],c=TD[t].mm;if(c){mmG.fillStyle=c;mmG.fillRect(x,y,1,1)}else{mmG.clearRect(x,y,1,1);if(bg[idx(x,y)]){mmG.fillStyle='#070914';mmG.fillRect(x,y,1,1)}}}
function setT(x,y,t){if(x<0||y<0||x>=WW||y>=WH)return;fg[idx(x,y)]=t;mmPix(x,y);lightDirty=true;wakeWater(x,y)}
// ---------- eau (automate cellulaire : chute, puis étalement sous pression ou vers un vide) ----------
let wActive=new Set(),wT=0;
const flowable=t=>t===AIR||t===PLANT||t===VINE||t===CPLANT;
function wakeWater(x,y){for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<WW&&Y<WH&&fg[idx(X,Y)]===WATER)wActive.add(idx(X,Y))}}
function wMove(a,b){fg[b]=WATER;fg[a]=AIR;const ax=a%WW,ay=(a/WW)|0,bx=b%WW,by=(b/WW)|0;mmPix(ax,ay);mmPix(bx,by);wakeWater(ax,ay);wakeWater(bx,by)}
function waterStep(){if(!wActive.size)return;const list=[...wActive].sort((a,b)=>b-a);wActive.clear();
  for(const i of list){if(fg[i]!==WATER)continue;const x=i%WW,y=(i/WW)|0;if(y>=WH-1)continue;
    if(flowable(fg[i+WW])){wMove(i,i+WW);continue}
    const press=y>0&&fg[i-WW]===WATER;const ds=rnd()<.5?[-1,1]:[1,-1];
    for(const d of ds){const sx=x+d;if(sx<1||sx>=WW-1)continue;const j=i+d;if(!flowable(fg[j]))continue;if(press||flowable(fg[j+WW])){wMove(i,j);break}}}}

// ---------- éclairage (propagation BFS, lissé au rendu) ----------
const LQ=new Int32Array(WW*WH*2),LCI=new Uint8Array(WW*WH);
// couleurs des sources : torche, cristal, diamant, cœur bleu, cœur rouge, champignon
const LCOLS=[[255,160,70],[190,110,255],[90,220,255],[90,160,255],[255,90,70],[70,255,200]];
function propagate(L,decAir,decSolid,C){let h=0,t=0;
  for(let i=0;i<L.length;i++)if(L[i]>0)LQ[t++]=i;
  while(h<t){const i=LQ[h++],v=L[i];if(v<=.02)continue;const x=i%WW,y=(i/WW)|0;const dec=TD[fg[i]].solid?decSolid:decAir;const nv=v-dec;if(nv<=0)continue;
    const c=C?C[i]:0;
    if(x>0&&L[i-1]<nv){L[i-1]=nv;if(C)C[i-1]=c;LQ[t++]=i-1}if(x<WW-1&&L[i+1]<nv){L[i+1]=nv;if(C)C[i+1]=c;LQ[t++]=i+1}
    if(y>0&&L[i-WW]<nv){L[i-WW]=nv;if(C)C[i-WW]=c;LQ[t++]=i-WW}if(y<WH-1&&L[i+WW]<nv){L[i+WW]=nv;if(C)C[i+WW]=c;LQ[t++]=i+WW}
    if(t>LQ.length-8)break}}
function computeLight(){
  lightSky.fill(0);lightTorch.fill(0);
  for(let x=0;x<WW;x++)for(let y=0;y<WH;y++){const i=idx(x,y);if(TD[fg[i]].solid||bg[i])break;lightSky[i]=1}
  propagate(lightSky,.07,.17);
  LCI.fill(0);for(let i=0;i<fg.length;i++){const d=TD[fg[i]];if(d.light){lightTorch[i]=d.light;LCI[i]=d.lc||0}}
  for(const b of bases)if(b&&!b.core.dead){const tx=Math.floor((b.core.x+11)/T),ty=Math.floor((b.core.y+12)/T);for(const k of[idx(tx,ty),idx(tx,ty+1)]){lightTorch[k]=1;LCI[k]=b.team===0?3:4}}
  propagate(lightTorch,.075,.24,LCI);
  lightDirty=false}

// =====================================================================
//  ÉTAT DU JEU
// =====================================================================
let trickT=3, state='title', diff=1, time=0, dayLen=300, ents=[], parts=[], arrows=[], floats=[], msgs=[], bases=[], player, cam={x:0,y:0}, camOff={x:0,y:0}, shake=0;
let newAskT=-1e9,lastEndChange=0,confetti=[],panelT=1,craftFx=0,endInfo={},fade=0,bloodNight=-1,weather={rain:0,target:0,t:20,flash:0},corpses=[],pops=[],bombs=[],hurtFx=0,hitStop=0,shownState='title';
let paused=false,pauseHelp=false,endT=0,endState=null,panel=null, cursorItem=null, stats, ai, titleCam=0, hoverTile=null, mining=null;
// Cinq niveaux : chacun règle l'économie rouge, le rythme des vagues et surtout ce que le commandant sait faire (iq).
//  inc revenu rouge · ecore/pcore PV des cœurs · first délai avant la 1re vague · wave/grow/wmax taille des vagues · cap effectif rouge max
//  rest pause après une vague repoussée · champ PV du champion · mon monstres la nuit · hurt dégâts subis par le héros · resp délai de retour
//  rec délai entre deux recrues rouges · coreUp niveau max de l'amélioration « cœur » rouge · think cadence du commandant · surge onde de choc de secours de ton cœur · iq : 0 passif, 1 contre et pille, 2 champion en tête et tir concentré,
//  3 commandos et repli tactique, 4 vétérans (chaque vague lancée renforce les suivantes)
const DIFFS=[
  {id:'p',n:'Paisible',d:'Ennemi lent et prudent. Idéal pour découvrir.',ach:'win0',inc:.6,ecore:.75,pcore:1.25,first:330,wave:5,grow:2,wmax:18,cap:20,rest:150,champ:250,mon:4,hurt:.7,resp:4,think:2.4,miners:0,strike:0,surge:90,rec:8,coreUp:1,iq:0},
  {id:'n',n:'Normal',d:'Le rouge contre tes troupes et pille tes mineurs.',ach:'win1',inc:1,ecore:.9,pcore:1,first:210,wave:7,grow:3,wmax:28,cap:30,rest:45,champ:336,mon:8,hurt:1,resp:6,think:2,miners:0,strike:3,surge:60,rec:4.5,coreUp:2,iq:1},
  {id:'h',n:'Difficile',d:'Vagues rapprochées, le champion mène l\'assaut.',ach:'winh',inc:1.3,ecore:.95,pcore:1,first:170,wave:8,grow:3,wmax:30,cap:34,rest:35,champ:380,mon:10,hurt:1.1,resp:7,think:1.7,miners:0,strike:3,surge:40,rec:3.2,coreUp:2,iq:2},
  {id:'b',n:'Brutal',d:'Commandos sur ton cœur, monstres en nombre.',ach:'win2',inc:1.6,ecore:1,pcore:1,first:120,wave:8,grow:4,wmax:32,cap:38,rest:25,champ:416,mon:11,hurt:1.2,resp:8,think:1.4,miners:1,strike:4,surge:0,rec:2,coreUp:3,iq:3},
  {id:'c',n:'Cauchemar',d:'L\'ennemi se renforce à chaque vague. Sans pitié.',ach:'winc',inc:2.2,ecore:1.15,pcore:.9,first:80,wave:9,grow:5,wmax:40,cap:48,rest:12,champ:520,mon:14,hurt:1.35,resp:10,think:1.1,miners:1,strike:5,surge:0,rec:1.4,coreUp:3,iq:4,lock:true}];
const DF=()=>DIFFS[diff];
// Cauchemar s'ouvre après une victoire en Difficile ou en Brutal
const diffOpen=i=>!DIFFS[i].lock||!!(PROF.ach.winh||PROF.ach.win2||PROF.ach.winc);
function newGame(d,dly=null,sv=false){
  daily=dly;diff=d;surv=sv&&!dly;genWorld(dly?dly.seed:(Math.random()*1e9)|0);fade=1;bloodNight=-1;weather={rain:0,target:0,t:20,flash:0};corpses=[];pops=[];bombs=[];visualDebris.length=0;PROF.games++;saveProf();
  ents=[];parts=[];arrows=[];floats=[];msgs=[];time=dayLen*.08;panel=null;cursorItem=null;
  stats={mined:0,recruited:0,kills:0,start:time,obj:0,rk:{},chests:0,waves:0,ogres:0,coreHit:0};
  bases=[0,1].map(t=>{const coreTx=t===0?19:WW-20;const core={type:'core',team:t,x:coreTx*T-3,y:BASE_GY*T-34,w:22,h:34,hp:0,maxhp:0,flash:0,anim:0};
    core.maxhp=core.hp=Math.round(1600*(t===1?DIFFS[d].ecore:DIFFS[d].pcore)*(dly&&dly.mod.id==='glass'?.5:1));
    const b={team:t,order:t===0?'attack':'defend',holdX:null,core,storage:{wood:20,stone:20,coal:0,copper:6,iron:0,silver:0,gold:0,diamond:0},upg:{core:0,speed:0,dmg:0,tower:0},
      castleX:coreTx*T-80,tower:{x:coreTx*T-80+(t===0?155:21),y:BASE_GY*T-128,cd:2}};
    ents.push(core);return b});
  player={type:'player',team:0,x:22*T,y:BASE_GY*T-24,w:10,h:22,vx:0,vy:0,hp:100,maxhp:100,dir:1,onGround:false,anim:0,flash:0,
    inv:new Array(36).fill(null),sel:0,swing:0,swingDir:1,useCd:0,dead:false,respawn:0,iframes:0,stepOff:0,coyote:0,jumpBuf:0,recall:0,recallCd:0};
  addItem('pick1',1);addItem('sword1',1);addItem('torch',12);addItem('plank',20);
  ents.push(player);
  REL=relicsFor(dly);applyRelics();if(!dly&&!resuming)applyBoosts();
  if(dly&&dly.mod.id==='gold')Object.assign(bases[0].storage,{wood:80,stone:80,coal:20,copper:30,iron:16,silver:8,gold:6,diamond:2});
  ai=newAI();endT=0;
  cam.x=player.x-VW/2;cam.y=player.y-VH*camFY();
  firstRun=!dly&&!sv&&!PROF.tutDone;tut=firstRun?0:-1;
  computeLight();state='play';if(!dly)grantRewards();
  if(dly){toast('Défi du jour : '+dly.mod.n+' — '+dly.mod.d,6,COL.gold);const D=PROF.daily;if(D.last!==dly.key){D.streak=D.last===dayKey(new Date(Date.now()-864e5))?(D.streak||0)+1:1;D.last=dly.key;saveProf()}if(D.streak>=3)unlock('streak3')}
  if(surv)toast('Mode Siège : le cœur rouge est indestructible. Repousse autant de vagues que possible !',6,COL.gold);
  else toast('Protège ton cœur bleu. Détruis le cœur rouge, à l\'autre bout du monde.',6);
  if(!firstRun)toast('Mine du minerai, rapporte-le à ta base et recrute des troupes '+(isTouch?'(bouton Base).':'(touche B).'),8);
}
// ---------- sauvegarde ----------
const SAVE_KEY='ute-save-v1';
const u8b64=a=>{let s='';for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode.apply(null,a.subarray(i,i+8192));return btoa(s)};
const b64u8=s=>{const b=atob(s),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a};
function hasSave(){try{return!!localStorage.getItem(SAVE_KEY)}catch(e){return false}}
function saveGame(){if(state!=='play'||endT>0)return;try{
  const units=ents.filter(e=>e.type==='unit'&&!e.dead).map(e=>({k:e.kind,t:e.team,x:e.x,y:e.y,hp:e.hp,mh:e.maxhp,c:e.carry,n:e.carryN,s:e.state}));
  const data={v:1,dv:2,seed:SEED,diff,time,stats,fg:u8b64(fg),bg:u8b64(bg),surf:Array.from(surf),trees:trees.map(t=>[t.x,t.top,t.r]),
    player:{x:player.x,y:player.y,hp:player.hp,inv:player.inv,sel:player.sel},
    bases:bases.map(b=>({st:b.storage,up:b.upg,o:b.order,hx:b.holdX,sg:b.core.surged?1:0,hp:b.core.hp,mh:b.core.maxhp})),units,ai:{style:ai.style,wave:ai.wave,sent:ai.sent,champT:ai.champT,stand:ai.stand?1:0,vet:ai.vet||0,waveNo:ai.waveNo||0},daily,surv,rel:REL};
  localStorage.setItem(SAVE_KEY,JSON.stringify(data))}catch(e){}}
function loadGame(){let d;try{d=JSON.parse(localStorage.getItem(SAVE_KEY))}catch(e){return false}if(!d||d.v!==1)return false;
  // dv absent : sauvegarde d'avant les 5 difficultés (l'ancien Brutal, indice 2, est devenu l'indice 3)
  resuming=true;try{newGame(clamp(d.dv?d.diff:d.diff===2?3:d.diff,0,DIFFS.length-1),d.daily||null,!!d.surv)}finally{resuming=false}PROF.games--;tut=-1;firstRun=false;REL=d.rel||{};msgs=[];SEED=d.seed;fg=b64u8(d.fg);bg=b64u8(d.bg);surf=Int16Array.from(d.surf);trees=d.trees.map(([x,top,r])=>({x,top,r,img:treeImg(r,x,SEED+x)}));
  for(let y=0;y<WH;y++)for(let x=0;x<WW;x++)mmPix(x,y);
  time=d.time;stats=Object.assign({obj:0,rk:{},ogres:0,coreHit:0},d.stats);Object.assign(player,{x:d.player.x,y:d.player.y,hp:d.player.hp,maxhp:100+relV('life'),inv:d.player.inv,sel:d.player.sel});
  d.bases.forEach((s,i)=>{const b=bases[i];b.storage=s.st;b.upg=s.up;b.order=s.o;b.holdX=s.hx??null;b.core.surged=!!s.sg;b.core.hp=s.hp;b.core.maxhp=s.mh});
  ents=ents.filter(e=>e.type!=='unit');ai.style=d.ai.style;ai.wave=d.ai.wave;ai.sent=d.ai.sent;ai.champT=d.ai.champT;ai.stand=!!d.ai.stand;ai.vet=d.ai.vet||0;ai.waveNo=d.ai.waveNo||0;ai.champ=null;
  for(const u of d.units){const e=recruit(u.t,u.k,true);Object.assign(e,{x:u.x,y:u.y,hp:u.hp,maxhp:u.mh,carry:u.c||{},carryN:u.n||0,state:u.s||'seek'});if(u.k==='champion')ai.champ=e}
  cam.x=player.x-VW/2;cam.y=player.y-VH*camFY();computeLight();toast('Partie reprise.',2.5,COL.gold);return true}
let saveT=20;
addEventListener('pagehide',saveGame);document.addEventListener('visibilitychange',()=>{if(document.hidden)saveGame()});
// ---------- profil : réglages, succès, records, défi du jour (localStorage, clé ute-profile-v1) ----------
const PROF_KEY='ute-profile-v1';
const PROF=(()=>{let d=null;try{d=JSON.parse(localStorage.getItem(PROF_KEY))}catch(e){}
  d=d||{};d.set=Object.assign({en:!/^fr/i.test(navigator.language||'fr'),sound:true,music:true,vib:true,shake:true,crt:true,lefty:false},d.set);
  d.ach=d.ach||{};d.rec=d.rec||{};d.games=d.games||0;d.wins=d.wins||0;d.daily=d.daily||{};d.tot=Object.assign({mined:0,kills:0,recruited:0},d.tot);d.relics=d.relics||{};if(d.tutDone==null)d.tutDone=d.games>0;d.relEq=d.relEq||[];
  // dv 2 : records rangés par identifiant de difficulté (kp, kn, kh, kb, kc) au lieu de l'indice 0-2 d'avant
  if(!d.dv){for(const[o,n]of[['0','kp'],['1','kn'],['2','kb']])if(d.rec[o]){d.rec[n]=d.rec[o];delete d.rec[o]}if(d.lastDiff===2)d.lastDiff=3;d.dv=2}return d})();
function saveProf(){try{localStorage.setItem(PROF_KEY,JSON.stringify(PROF))}catch(e){}}
// ---------- boutique : éclats gagnés en fin de partie, tenues du héros, bonus de départ ----------
PROF.coins=PROF.coins||0;PROF.outfits=Object.assign({blue:1},PROF.outfits);PROF.boosts=PROF.boosts||{};
const OUTFITS=[{id:'blue',n:'Garde bleue',tunic:'#4f9df5',cape:'#a95572',p:0,look:{}},{id:'forest',n:'Rôdeur',tunic:'#4fae6a',cape:'#6b4a2e',hair:'#3b2a22',p:60,look:{head:'pointed',headCol:'#4fae6a',tunic:'#6b4a2e',cape:'short',capeCol:'#3d6b3a',acc:'sash',accCol:'#c9a46a',eyes:'#a8ff7a'}},
  {id:'ember',n:'Braise',tunic:'#e0703a',cape:'#3a2a4a',hair:'#2a1f2e',p:90,look:{headCol:'#e0703a',tunic:'#3a2a4a',cape:'scarf',capeCol:'#ffb347',eyes:'#ff6a50'}},{id:'royal',n:'Monarque',tunic:'#8a5cf5',cape:'#ffd25a',belt:'#ffe066',p:120,look:{head:'helm',headCol:'#aeb8cc',tunic:'#8a5cf5',cape:'long',capeCol:'#b03a5a',accCol:'#ffe066',eyes:'#7ff0ff'}},{id:'shadow',n:'Ombre',tunic:'#3a3f58',cape:'#16182a',hair:'#e4e9ff',boots:'#0e0f1c',p:150,look:{head:'horns',headCol:'#3a3f58',tunic:'#16182a',cape:'long',capeCol:'#2a2440',boots:'#0e0f1c',eyes:'#c08cff'}}];
if(!OUTFITS.some(o=>o.id===PROF.outfit))PROF.outfit='blue';
const BOOSTS=[{id:'cache',n:'Réserve de départ',d:'+40 cuivre, +12 fer, +20 charbon',p:30},{id:'archers',n:'Deux archers',d:'Commence avec 2 archers',p:40},{id:'core',n:'Cœur blindé',d:'Ton cœur +300 PV',p:50}],BOOST_MAX=3;
const OUTFIT_SPR={};const outfitImg=id=>OUTFIT_SPR[id]||(OUTFIT_SPR[id]=heroSet(id).R.idle[0]);
// bonus achetés : un de chaque sorte par partie, jamais en défi du jour ni à la reprise d'une sauvegarde
let resuming=false;
function applyBoosts(){const b=bases[0],used=[];
  for(const o of BOOSTS){if(!(PROF.boosts[o.id]>0))continue;PROF.boosts[o.id]--;used.push(tr(o.n));
    if(o.id==='cache'){b.storage.copper+=40;b.storage.iron+=12;b.storage.coal+=20}
    else if(o.id==='archers'){recruit(0,'archer',true);recruit(0,'archer',true)}
    else{b.core.maxhp+=300;b.core.hp+=300}}
  if(used.length){saveProf();toast(tr('Bonus de boutique : ')+used.join(', '),5,COL.gold)}}
// gains : victoire selon la difficulté (+ défi du jour), défaite selon le temps tenu, Siège selon les vagues
function earnCoins(win,dur){return surv?4+3*stats.waves:win?[20,35,45,55,75][diff]+(daily?25:0):4+Math.min(20,Math.floor(dur/120))}
// niveau du joueur : de l'XP à chaque partie (même perdue), des éclats à chaque niveau, un gros bonus tous les 5
PROF.xp=PROF.xp||0;
const lvlNeed=l=>80+40*l,lvlReward=l=>l%5?20+5*l:100+10*l;
function lvlOf(xp){let l=1;while(xp>=lvlNeed(l)){xp-=lvlNeed(l);l++}return{l,cur:xp,need:lvlNeed(l)}}
function earnXp(win,dur){return Math.round(Math.min(60,dur/20)+stats.kills*2+stats.recruited*3+Math.min(40,stats.mined/5)+(win?60+40*diff:0)+(surv?15*stats.waves:0))}
function coinTag(n,x,y,col=COL.gold,size=7,align='center'){const s=''+n,w=10+uiWidth(s,size),x0=Math.round(align==='center'?x-w/2:align==='right'?x-w:x);
  ctx.drawImage(ICON.crystal,x0,Math.round(y)-2,8,8);txt(s,x0+10,y,col,size);return w}
// ---------- traduction : le texte est écrit en français, l'anglais est appliqué à l'affichage (txt/uiWidth/uiFit) ----------
const EN={"Touche ◀ ▶ pour marcher": "Tap ◀ ▶ to walk", "Marche avec Q / D ou ← →": "Walk with A / D or ← →", "Touche ▲ pour sauter": "Tap ▲ to jump", "Saute avec Espace": "Jump with Space", "Gros bouton : mine le bloc visé": "Big button: mine the targeted block", "Clic droit sur un bloc pour le miner": "Right-click a block to mine it", "Bien joué ! Suis maintenant les objectifs en bas de l'écran.": "Well done! Now follow the objectives at the bottom of the screen.","Gant du mineur": "Miner's glove", "Mine {v} % plus vite": "Mine {v}% faster", "Lame ancienne": "Ancient blade", "Tes coups +{v} % de dégâts": "Your hits +{v}% damage", "Cœur de cristal": "Crystal heart", "Ton cœur +{v} PV": "Your core +{v} HP", "Bourse du roi": "King's purse", "Réserve de départ +{v} cuivre": "Starting stock +{v} copper", "Tambour de guerre": "War drum", "Tes unités +{v} % de vitesse": "Your units +{v}% speed", "Œil du veilleur": "Watcher's eye", "Tour de guet +{v} % de dégâts": "Watchtower +{v}% damage", "Sceau de vie": "Seal of life", "+{v} PV max pour toi": "+{v} max HP for you", "Bannière de la garde": "Guard banner", "Commence avec {v} guerrier": "Start with {v} warrior", "Relique renforcée : ": "Relic upgraded: ", "Nouvelle relique : ": "New relic: ", "niv.": "lv.", "équipe-la depuis le menu": "equip it from the menu", "Reliques": "Relics", "Équipées ": "Equipped ", "touche pour équiper": "tap to equip", "pas en défi du jour": "not in daily challenge", "Coffres, champion rouge, Siège": "Chests, red champion, Siege", "3e emplacement après 10 victoires (": "3rd slot after 10 wins (","VICTOIRE":"VICTORY","Copié !":"Copied!","J'ai repoussé ":"I repelled "," vagues en mode Siège":" waves in Siege mode","J'ai détruit le cœur rouge en ":"I destroyed the red core in ","Mon cœur est tombé après ":"My core fell after ","ennemis abattus":"enemies slain","Fais mieux sur le défi du jour !":"Beat me on the daily challenge!","Bats mon record !":"Beat my record!","Partager":"Share","Résultat copié, colle-le où tu veux !":"Result copied, paste it anywhere!","Partage impossible sur cet appareil.":"Sharing is not available on this device.","Quêtes du jour": "Daily quests", "récompense à prendre": "reward waiting", "blocs": "blocks", "Abats": "Defeat", "ennemis": "enemies", "Recrute": "Recruit", "Ouvre": "Open", "coffres": "chests", "coffre": "chest", "Trouve": "Find", "diamant": "diamond", "diamants": "diamonds", "Gagne": "Win", "partie": "game", "parties": "games", "Repousse": "Repel", "vagues en Siège": "waves in Siege mode", "Abats le champion rouge": "Defeat the red champion", "Quête accomplie": "Quest complete", "à la prochaine partie": "next game", "Les 3 quêtes du jour sont faites !": "All 3 daily quests done!", "Bonus": "Bonus", "Récompense du jour": "Daily reward", "série": "streak", "Butin de quêtes": "Quest loot", "Récompense du jour reçue": "Daily reward claimed", "Lance une partie pour la récompense du jour": "Start a game to claim the daily reward","Manette connectée":"Controller connected","Marcher": "Walk", "Espace": "Space", "Sauter": "Jump", "Ordre": "Order", "oui": "yes", "non": "no", "droitier": "right-handed", "gaucher": "left-handed", "Parties": "Games", "Victoires": "Wins", "Nuit": "Night", "Jour": "Day", "CASES": "TILES", "cases": "tiles", "Ton cœur s'est éteint.": "Your core has fallen.", "Blocs": "Blocks", "Recrues": "Recruits", "Coffres": "Chests", "Toi": "You", "TOI": "YOU", "Ennemi": "Enemy", "ENNEMI": "ENEMY", "VAGUE ROUGE": "RED WAVE", "Vague rouge": "Red wave", "dans": "in", "DANS": "IN", "unités": "units", "unité": "unit", " : ": ": ", "Q D / ← →": "A D / ← →","Herbe":"Grass","Terre":"Dirt","Pierre":"Stone","Charbon":"Coal","Cuivre":"Copper","Fer":"Iron","Argent":"Silver","Diamant":"Diamond","Roche profonde":"Deep rock","Socle":"Bedrock","Bois":"Wood","Feuilles":"Leaves","Planches":"Planks","Briques":"Bricks","Neige":"Snow","Rempart":"Rampart","Torche":"Torch","Plante":"Plant","Cristal":"Crystal","Lianes":"Vines","Champignon":"Mushroom","Fougère":"Fern","Eau":"Water","Coffre":"Chest","Cristal de vie":"Life crystal","Pioche en bois":"Wood pickaxe","Pioche en cuivre":"Copper pickaxe","Pioche en fer":"Iron pickaxe","Pioche en diamant":"Diamond pickaxe","Épée en bois":"Wood sword","Épée en cuivre":"Copper sword","Épée en fer":"Iron sword","Épée en diamant":"Diamond sword","Arc":"Bow","Potion de soin":"Health potion","Bombe":"Bomb","Mineur":"Miner","Rapporte du minerai":"Brings back ore","Guerrier":"Warrior","Mêlée solide":"Solid melee","Tire à distance":"Ranged shooter","Colosse qui brise tout":"Colossus that smashes all","Champion rouge":"Red champion","Cœur renforcé":"Reinforced core","+300 PV max au cœur":"+300 max core HP","Entraînement":"Training","+12% vitesse des unités":"+12% unit speed","Forge de guerre":"War forge","+25% dégâts des unités":"+25% unit damage","dégâts +":"damage +","Tour de guet":"Watchtower","Tour plus puissante":"Stronger tower","Paisible":"Peaceful","Défi du jour : ":"Daily challenge: ","Mode Siège : le cœur rouge est indestructible. Repousse autant de vagues que possible !":"Siege mode: the red core is invincible. Survive as many waves as you can!","Protège ton cœur bleu. Détruis le cœur rouge, à l'autre bout du monde.":"Protect your blue core. Destroy the red core at the far end of the world.","Mine du minerai, rapporte-le à ta base et recrute des troupes ":"Mine ore, bring it to your base and recruit troops ","Partie reprise.":"Game resumed.","Premier coup de pioche":"First swing","Mine ton premier bloc":"Mine your first block","Inébranlable":"Unshakable","Repousse 10 vagues en mode Siège":"Survive 10 waves in Siege mode","Taupe":"Mole","Mine 100 blocs dans une partie":"Mine 100 blocks in one game","Général":"General","Aie 10 unités en même temps":"Have 10 units at once","Colosse":"Colossus","Recrute un golem":"Recruit a golem","Éclat bleu":"Blue shard","Trouve un diamant":"Find a diamond","Pioche ultime":"Ultimate pickaxe","Forge la pioche en diamant":"Forge the diamond pickaxe","Pilleur de grottes":"Cave raider","Ouvre un coffre au trésor":"Open a treasure chest","Artificier":"Bomber","Fais exploser une bombe":"Blow up a bomb","Tueur de champion":"Champion slayer","Abats le champion rouge":"Defeat the red champion","Lune de sang":"Blood moon","Survis à une lune de sang":"Survive a blood moon","Victoire paisible":"Peaceful victory","Gagne en Paisible":"Win on Peaceful","Victoire":"Victory","Gagne en Normal":"Win on Normal","Gagne en Brutal":"Win on Brutal","Éclair":"Lightning","Gagne en moins de 20 minutes":"Win in under 20 minutes","Défi relevé":"Challenge done","Gagne un défi du jour":"Win a daily challenge","Assidu":"Dedicated","Joue le défi 3 jours de suite":"Play the challenge 3 days in a row","Filons généreux":"Rich veins","Deux fois plus de minerai":"Twice the ore","Nuits rouges":"Red nights","Chaque nuit est une lune de sang":"Every night is a blood moon","Rouge enragé":"Raging red","L'ennemi recrute 40 % plus vite":"Enemy recruits 40% faster","Trésor royal":"Royal treasure","Ta base démarre avec une réserve pleine":"Your base starts with full stock","Cœurs de verre":"Glass cores","Les deux cœurs ont moitié moins de PV":"Both cores have half HP","Mine 10 blocs avec ta pioche":"Mine 10 blocks with your pickaxe","Recrute un mineur à ta base":"Recruit a miner at your base","Rapporte du cuivre : 12 en réserve à ta base":"Bring back copper: 12 in stock at your base","Fabrique une pioche en cuivre à la forge":"Craft a copper pickaxe at the forge","Achète une amélioration de base":"Buy a base upgrade","Abats 5 ennemis rouges":"Defeat 5 red enemies","Détruis le cœur rouge, à l'autre bout du monde":"Destroy the red core at the far end of the world","Objectif accompli !":"Objective complete!"," Récompense : ":" Reward: ","Coffre au trésor !":"Treasure chest!","Tu es de retour à la base.":"You're back at base.","Dépôt à la base : ":"Base deposit: ","Il faut une meilleure pioche pour : ":"Better pickaxe needed for: ","Ton cœur est attaqué !":"Your core is under attack!","Tu es tombé… retour à la base dans 6 s.":"You fell... back to base in 6s.","Le champion rouge est tombé !":"The red champion has fallen!","Ton cœur est attaqué ! Tes défenseurs accourent.":"Your core is under attack! Defenders rush in.","Des pillards attaquent tes mineurs : 3 défenseurs partent les intercepter.":"Raiders attack your miners: 3 defenders go to intercept.","Le champion rouge bat en retraite pour se soigner !":"The red champion retreats to heal!","Un mineur rapporte : ":"A miner brings back: ","Le champion rouge reprend les armes.":"The red champion fights again.","L'armée rouge se rassemble : attaque dans moins de 30 s !":"The red army is gathering: attack in under 30s!","La vague rouge (":"The red wave ("," unités) dépasse ta défense : recrute des troupes ou améliore la tour (Base).":" units) overwhelms your defense: recruit troops or upgrade the tower (Base).","Contre-attaque ! Des unités rouges foncent vers ton cœur dégarni.":"Counter-attack! Red units rush your exposed core.","Des pillards rouges traquent tes mineurs !":"Red raiders are hunting your miners!","L'armée rouge hésite devant ta défense et se renforce.":"The red army hesitates at your defense and reinforces.","L'armée rouge marche sur ta base (":"The red army marches on your base ("," unités) !":" units)!"," repoussée ! La suivante sera plus forte.":" repelled! The next one is stronger.","L'ennemi bat en retraite.":"The enemy retreats.","Lune de sang ! Les monstres sont deux fois plus nombreux cette nuit.":"Blood moon! Twice as many monsters tonight.","Tu as survécu à la lune de sang !":"You survived the blood moon!","SUCCÈS : ":"ACHIEVEMENT: ","Succès : ":"Achievement: ","Retour dans ":"Back in "," unités":" units"," unité":" unit","ARMÉE ROUGE EN MARCHE · ":"RED ARMY MARCHING · "," en réserve":" in stock","Flèches à l'écran : marcher. ▲ : sauter, nager vers le haut.":"On-screen arrows: walk. ▲: jump, swim up.","Gros bouton : utiliser l'objet, vise tout seul. ▼ + bouton : creuser dessous.":"Big button: use item, auto-aims. ▼ + button: dig down.","Toucher le monde : utiliser l'objet à cet endroit précis.":"Tap the world: use item at that spot.","Barre du bas : choisir un objet. Base : recruter et améliorer.":"Bottom bar: pick an item. Base: recruit and upgrade.","Forge : fabriquer outils et armes. Ordre : Assaut, Défense ou Suivre.":"Forge: craft tools and weapons. Order: Assault, Defend or Follow.","Q D ou ← → : marcher. Z, Espace ou ↑ : sauter, nager.":"A D or ← →: walk. W, Space or ↑: jump, swim.","Clic gauche : utiliser l'objet. Clic droit : miner. Molette : objet.":"Left click: use item. Right click: mine. Wheel: item.","B : base · C : forge · E : sac · R : ordre · M : son · Échap : menu.":"B: base · C: forge · E: bag · R: order · M: sound · Esc: menu.","But : détruire le cœur rouge à l'autre bout du monde.":"Goal: destroy the red core at the far end of the world.","Ton minerai est déposé tout seul à ta base. Les mineurs en rapportent aussi.":"Your ore is deposited at your base automatically. Miners bring some too.","La nuit, slimes et zombies sortent. Le champion rouge pille la montagne.":"At night, slimes and zombies come out. The red champion raids the mountain.","Mineur : creuse et rapporte le minerai. Fuit les pillards vers la tour.":"Miner: digs and brings back ore. Flees raiders toward the tower.","Guerrier : mêlée solide. Archer : tire de loin, recule au contact.":"Warrior: solid melee. Archer: shoots from afar, backs off in melee.","Golem : colosse lent qui brise tout, idéal contre le cœur.":"Golem: slow colossus that smashes all, great against the core.","Tour de guet : tire sur les ennemis proches de ton cœur. Améliore-la à la base.":"Watchtower: shoots enemies near your core. Upgrade it at the base.","Défense : tes troupes tiennent une ligne devant le cœur, sous la tour. 3 d'entre elles chassent les pillards.":"Defend: your troops hold a line before the core, under the tower. 3 of them chase raiders.","Assaut : l'armée marche groupée vers le cœur rouge.":"Assault: the army marches together to the red core.","Suivre : tes troupes t'escortent partout.":"Follow: your troops escort you everywhere.","Blessées, les unités rentrent se soigner à la base.":"When hurt, units go heal at the base.","Unités et ordres":"Units and orders","Aide":"Help","Unités →":"Units →","Retour":"Back","Reprendre":"Resume","Réglages":"Settings","Aide et commandes":"Help and controls","Succès ":"Achievements ","Succès":"Trophies","Sauvegarder et quitter":"Save and quit","Siège · vague ":"Siege · wave ","Difficulté ":"Difficulty ","Partie sauvegardée toutes les 20 s":"Game saved every 20s","Assaut":"Assault","Défense":"Defend","Suivre":"Follow","Tes troupes partent à l'assaut du cœur rouge.":"Your troops charge the red core.","Tes troupes se regroupent devant ta base.":"Your troops gather before your base.","Tes troupes t'escortent.":"Your troops escort you.","Ta base":"Your base","Recruter":"Recruit"," recruté !":" recruited!","Améliorations":"Upgrades","Déposer pierre/bois":"Deposit stone/wood","Déposé : ":"Deposited: ","Rien à déposer.":"Nothing to deposit.","sac puis réserve de la base":"bag, then base stock","Créer":"Craft","Fabriqué : ":"Crafted: ","Sac":"Bag","clique pour déplacer":"click to move","touche pour déplacer":"tap to move","Or":"Gold","+300 PV":"+300 HP","vitesse +":"speed +","tir +":"firepower +","Brutal !":"Brutal!","Mine. Forge. Détruis leur cœur.":"Mine. Forge. Destroy their core.","Continuer la partie":"Continue game","Sauvegarde illisible.":"Save unreadable.","Mode Siège : vagues infinies":"Siege mode: endless waves"," · Série : ":" · Streak: ","Gros bouton : miner, frapper, lancer":"Big button: mine, strike, throw","Base · Forge · Sac : commandes du bas":"Base · Forge · Bag: bottom controls","Clic gauche Utiliser   Clic droit Miner":"Left click Use   Right click Mine","Son":"Sound","Musique":"Music","Vibrations":"Vibration","Secousses de l'écran":"Screen shake","Effet rétro (lignes)":"Retro effect (lines)","Commandes":"Controls","Astuce : améliore la tour et garde l'ordre Défense, les vagues viennent à toi.":"Tip: upgrade the tower and keep the Defend order, waves come to you.","Chaque vague repoussée renforce la suivante : investis vite dans les améliorations.":"Each repelled wave makes the next stronger: invest in upgrades fast.","Prêt pour plus dur ? Essaie la difficulté ":"Ready for harder? Try difficulty ","Victoire en ":"Victory in ","Astuce : rapporte du minerai à ta base et recrute des mineurs, puis des guerriers (bouton Base).":"Tip: bring ore to your base and recruit miners, then warriors (Base button).","Astuce : des mineurs remplissent la réserve tout seuls, recrute-les en premier.":"Tip: miners fill the stock on their own, recruit them first.","Astuce : recrute aussi des guerriers et des archers pour protéger ton cœur.":"Tip: also recruit warriors and archers to protect your core.","Astuce : garde l'ordre Défense tant que ton armée est petite, la tour couvre la ligne.":"Tip: keep the Defend order while your army is small, the tower covers the line.","Astuce : regroupe une dizaine de combattants avant de lancer l'Assaut.":"Tip: gather about ten fighters before launching the Assault.","DÉFAITE":"DEFEAT","Le cœur ennemi a volé en éclats.":"The enemy core shattered.","Vagues repoussées : ":"Waves repelled: ","Défi du jour · ":"Daily challenge · ","Siège · ":"Siege · "," · Durée ":" · Time ","Nouveau record ! (avant : ":"New record! (was: ","Premier record établi !":"First record set!","Record à battre : ":"Record to beat: "," · Ennemis abattus ":" · Enemies slain ","Rejouer":"Retry","Abattus":"Slain","Niveau ":"Level ","NIVEAU ":"LEVEL ","Niv. ":"Lv. ","Total ":"Total ","Disponible : ":"Available: "," : encore ":": "," éclats":" shards","Choisir":"Pick"," jour":" day"," jours":" days","Son coupé":"Sound off","Son activé":"Sound on","Langue / Language":"Langue / Language","English":"English","français":"français"};
Object.assign(EN,{"Nouvelle partie":"New game","Abandonner cette partie ?":"Abandon this game?","Boutique":"Shop","Tenues":"Outfits","Garde bleue":"Blue guard","Rôdeur":"Ranger","Braise":"Ember","Monarque":"Monarch","Ombre":"Shadow","Réserve de départ":"Starting cache","+40 cuivre, +12 fer, +20 charbon":"+40 copper, +12 iron, +20 coal","Deux archers":"Two archers","Commence avec 2 archers":"Start with 2 archers","Cœur blindé":"Armored core","Ton cœur +300 PV":"Your core +300 HP","Bonus de boutique : ":"Shop bonus: ","Gagne des éclats à chaque partie, encore plus en gagnant":"Earn shards every game, more when you win","Portée : ":"Wearing: ","Bonus · prochaine partie (pas en défi)":"Boosts · next game (not daily)","Il te manque ":"You need "," éclats.":" more shards.","Tenue achetée : ":"Outfit bought: ","Maximum en réserve : 3":"Max in stock: 3"," : prêt pour la prochaine partie":": ready for next game"," éclats · total ":" shards · total ","éclats":"shards","Jouer":"Play","Défi du jour":"Daily challenge","Mode Siège":"Siege mode","Vagues infinies":"Endless waves","Quêtes":"Quests","Record : ":"Record: ","Fait !":"Done!","Difficulté":"Difficulty"});
// 1.2 : difficultés, guérisseur, ordre Tenir, rappel, ogre de sang
Object.assign(EN,{"Guérisseur":"Healer","Soigne les alliés proches":"Heals nearby allies","Difficile":"Hard","Cauchemar":"Nightmare","Ennemi lent et prudent. Idéal pour découvrir.":"Slow, cautious enemy. Great to learn.","Le rouge contre tes troupes et pille tes mineurs.":"Red counters your troops and raids your miners.","Vagues rapprochées, le champion mène l'assaut.":"Frequent waves, the champion leads the assault.","Commandos sur ton cœur, monstres en nombre.":"Commandos on your core, monsters in numbers.","L'ennemi se renforce à chaque vague. Sans pitié.":"The enemy grows stronger each wave. No mercy.","Gagne en Difficile ou en Brutal pour l'ouvrir":"Win on Hard or Brutal to unlock","Stratège":"Strategist","Gagne en Difficile":"Win on Hard","Fin du cauchemar":"End of the nightmare","Gagne en Cauchemar":"Win on Nightmare","Tueur d'ogre":"Ogre slayer","Abats un ogre de sang":"Defeat a blood ogre","Forteresse":"Fortress","Gagne en perdant moins de 10 % de ton cœur":"Win while losing less than 10% of your core","Ton cœur libère une onde de choc ! Profites-en pour le défendre.":"Your core unleashes a shockwave! Use it to defend.","Tu es tombé… retour à la base dans ":"You fell... back to base in ","L'ogre de sang est tombé ! Ramasse son trésor.":"The blood ogre has fallen! Grab its treasure.","L'ogre de sang est tombé sous les coups rouges.":"The blood ogre fell to the red army.","Un ogre de sang marche sur ta base ! Abats-le avant l'aube pour son trésor.":"A blood ogre marches on your base! Slay it before dawn for its treasure.","L'ogre de sang s'évapore à l'aube.":"The blood ogre vanishes at dawn.","Ogre de sang":"Blood ogre","Le cœur rouge vacille : sa garde d'élite sort du château !":"The red core falters: its elite guard storms out!","Le champion rouge mène l'assaut : ses voisins frappent plus fort !":"The red champion leads the assault: nearby troops hit harder!","L'armée rouge se replie pour se regrouper.":"The red army falls back to regroup.","Rappel annulé.":"Recall cancelled.","Rappel prêt dans ":"Recall ready in ","Tu es déjà à la base.":"You are already at base.","Rappel à la base dans 3 s : ne bouge pas.":"Recalling to base in 3s: hold still.","Rappel dans ":"Recall in ","Rappel":"Recall","Tenir":"Hold","Fanion planté : tes troupes tiennent cette position.":"Banner planted: your troops hold this position.","F : boire une potion · H : rappel à la base (3 s sans bouger).":"F: drink a potion · H: recall to base (3s standing still).","Barre du bas : choisir un objet. Base : recruter, améliorer, rappel à la base.":"Bottom bar: pick an item. Base: recruit, upgrade, recall to base.","Forge : fabriquer outils et armes. Ordre : Assaut, Défense, Tenir ou Suivre.":"Forge: craft tools and weapons. Order: Assault, Defend, Hold or Follow.","Blessé : le bouton Potion apparaît sous tes cœurs.":"When hurt: the Potion button appears under your hearts.","Lune de sang : un ogre marche sur ta base. Abats-le avant l'aube pour son trésor.":"Blood moon: an ogre marches on your base. Slay it before dawn for its treasure.","Guérisseur : soigne les alliés proches et reste derrière la ligne.":"Healer: heals nearby allies and stays behind the line.","Assaut : l'armée marche groupée vers le cœur rouge, la mêlée devant.":"Assault: the army marches together to the red core, melee in front.","Tenir : plante un fanion où tu te tiens, tes troupes gardent cette position.":"Hold: plant a banner where you stand, your troops guard that spot.","B Base  C Forge  E Sac  R Ordre  F Potion  H Rappel":"B Base  C Forge  E Bag  R Order  F Potion  H Recall","(touche B).":"(B key).","(bouton Base).":"(Base button).","Recrute 3 guerriers":"Recruit 3 warriors","niveau":"level","guerriers":"warriors","Astuce : la difficulté Paisible laisse bien plus de temps pour bâtir ton armée.":"Tip: Peaceful difficulty gives you far more time to build your army.","L'ENNEMI SE DÉFEND":"THE ENEMY IS DEFENDING"});
let EN_RE=null;const TR=new Map(),TRM=new Set(); // TRM : textes restés sans traduction (tests)
// phrase exacte, sinon remplacement des morceaux connus (textes assemblés avec des nombres)
function tr(s){if(!PROF.set.en||s==null)return s;s=String(s);let r=TR.get(s);if(r!==undefined)return r;
  r=EN[s];if(r===undefined){if(!EN_RE)EN_RE=new RegExp(Object.keys(EN).sort((a,b)=>b.length-a.length).map(k=>(/^\p{L}/u.test(k)?'(?<!\\p{L})':'')+k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+(/\p{L}$/u.test(k)?'(?!\\p{L})':'')).join('|'),'gu');
    r=s.replace(EN_RE,m=>EN[m]??m)}
  if(TR.size>3000)TR.clear();TR.set(s,r);if(r===s)TRM.add(s);return r}
// vibrations : plugin natif Capacitor si présent (Android), sinon API web
function buzz(ms){if(!PROF.set.vib)return;try{const H=window.Capacitor?.Plugins?.Haptics;if(H&&window.Capacitor.isNativePlatform?.()){if(window.Capacitor.getPlatform()==='ios')H.impact({style:ms>80?'HEAVY':ms>40?'MEDIUM':'LIGHT'});else H.vibrate({duration:ms});return}navigator.vibrate&&navigator.vibrate(ms)}catch(e){}}
const ACH=[
  {id:'first_block',n:'Premier coup de pioche',d:'Mine ton premier bloc'},
  {id:'siege10',n:'Inébranlable',d:'Repousse 10 vagues en mode Siège'},
  {id:'miner100',n:'Taupe',d:'Mine 100 blocs dans une partie'},
  {id:'army10',n:'Général',d:'Aie 10 unités en même temps'},
  {id:'golem',n:'Colosse',d:'Recrute un golem'},
  {id:'diamond',n:'Éclat bleu',d:'Trouve un diamant'},
  {id:'pick4',n:'Pioche ultime',d:'Forge la pioche en diamant'},
  {id:'chest',n:'Pilleur de grottes',d:'Ouvre un coffre au trésor'},
  {id:'bomb',n:'Artificier',d:'Fais exploser une bombe'},
  {id:'champion',n:'Tueur de champion',d:'Abats le champion rouge'},
  {id:'bloodmoon',n:'Lune de sang',d:'Survis à une lune de sang'},
  {id:'win0',n:'Victoire paisible',d:'Gagne en Paisible'},
  {id:'win1',n:'Victoire',d:'Gagne en Normal'},
  {id:'winh',n:'Stratège',d:'Gagne en Difficile'},
  {id:'win2',n:'Brutal !',d:'Gagne en Brutal'},
  {id:'winc',n:'Fin du cauchemar',d:'Gagne en Cauchemar'},
  {id:'ogre',n:'Tueur d\'ogre',d:'Abats un ogre de sang'},
  {id:'fort',n:'Forteresse',d:'Gagne en perdant moins de 10 % de ton cœur'},
  {id:'speed',n:'Éclair',d:'Gagne en moins de 20 minutes'},
  {id:'daily',n:'Défi relevé',d:'Gagne un défi du jour'},
  {id:'streak3',n:'Assidu',d:'Joue le défi 3 jours de suite'},
];
let achPop=[];
function unlock(id){if(PROF.ach[id])return;const a=ACH.find(a=>a.id===id);if(!a)return;PROF.ach[id]=Date.now();saveProf();achPop.push({a,t:0});sfx.ach();buzz(60)}
// ---------- quêtes du jour (3 par jour, progression cumulée sur toutes les parties) et récompense de connexion ----------
// le butin s'ajoute à la réserve de la base au début de la partie suivante (pas en défi du jour, pour rester équitable)
const QPOOL=[
  {id:'mine',n:'Mine {g} blocs',g:[120,200,300]},{id:'kill',n:'Abats {g} ennemis',g:[15,25,40]},{id:'recruit',n:'Recrute {g} unités',g:[6,10,15]},
  {id:'chest',n:'Ouvre {g} coffres',g:[1,2,3]},{id:'diamond',n:'Trouve {g} diamant',g:[1,1,2]},{id:'win',n:'Gagne {g} partie',g:[1,1,1]},
  {id:'wave',n:'Repousse {g} vagues en Siège',g:[3,5,8]},{id:'champ',n:'Abats le champion rouge',g:[1,1,1]}];
const QLOOT=[{copper:12,iron:4},{copper:16,iron:8,silver:2},{iron:10,silver:4,gold:3}];
function questsToday(){const k=dayKey();let q=PROF.q;
  if(!q||q.key!==k){let h=(k*2246822519>>>0)^0x9e3779b9;const pick=[],ids=QPOOL.map((_,i)=>i);
    for(let i=0;i<3;i++){h=Math.imul(h^h>>>13,1274126177)>>>0;const j=ids.splice(h%ids.length,1)[0],t=QPOOL[j];pick.push({id:t.id,g:t.g[i],p:0,done:false,tier:i})}
    q=PROF.q={key:k,list:pick,login:q&&q.login||0,streak:q&&q.streak||0,bonus:q&&q.bonus||{},all:false};saveProf()}
  return q}
const qName=e=>{const t=QPOOL.find(t=>t.id===e.id);let n=t.n.replace('{g}',e.g);if(e.g>1)n=n.replace(/(diamant|partie|coffres)$/,m=>m.endsWith('s')?m:m+'s');if(e.g===1)n=n.replace(/coffres$/,'coffre');return n};
function addLoot(dst,l){for(const k in l)dst[k]=(dst[k]||0)+l[k]}
const lootTxt=l=>Object.entries(l).map(([k,n])=>'+'+n+' '+tr(IT[k].n).toLowerCase()).join(', ');
function qAdd(id,n=1){const q=questsToday();let ch=false;for(const e of q.list){if(e.id!==id||e.done)continue;e.p=Math.min(e.g,e.p+n);ch=true;
    if(e.p>=e.g){e.done=true;const l=QLOOT[e.tier];addLoot(q.bonus,l);toast('Quête accomplie : '+qName(e)+' ('+lootTxt(l)+' à la prochaine partie)',4,COL.gold);sfx.ach();buzz(40)}}
  if(!ch)return;
  if(!q.all&&q.list.every(e=>e.done)){q.all=true;const l={gold:4,diamond:1};addLoot(q.bonus,l);toast('Les 3 quêtes du jour sont faites ! Bonus : '+lootTxt(l),5,COL.gold)}
  saveProf()}
// au début de chaque partie libre : récompense du premier jeu de la journée (série de jours) + butin des quêtes
function grantRewards(){const q=questsToday(),k=dayKey(),st=bases[0].storage,msg=[];
  if(q.login!==k){q.streak=q.login===dayKey(new Date(Date.now()-864e5))?Math.min(7,(q.streak||0)+1):1;q.login=k;
    const s=q.streak,l={copper:6+4*s};if(s>=2)l.iron=2*s;if(s>=4)l.silver=s-2;if(s>=7)l.diamond=1;addLoot(st,l);msg.push('Récompense du jour (série '+s+') : '+lootTxt(l))}
  if(Object.keys(q.bonus).length){addLoot(st,q.bonus);msg.push('Butin de quêtes : '+lootTxt(q.bonus));q.bonus={}}
  saveProf();for(const m of msg)toast(m,5,COL.ok)}
// ---------- reliques : bonus permanents trouvés en jeu (coffres, champion, Siège), niveau 1 à 3 par doublon, 2 équipées par partie ----------
// pas de relique en défi du jour pour que tout le monde parte à égalité ; REL est figé au début de la partie et sauvegardé avec elle
const RELICS=[
  {id:'pick',n:'Gant du mineur',d:'Mine {v} % plus vite',v:15},{id:'blade',n:'Lame ancienne',d:'Tes coups +{v} % de dégâts',v:15},
  {id:'core',n:'Cœur de cristal',d:'Ton cœur +{v} PV',v:150},{id:'purse',n:'Bourse du roi',d:'Réserve de départ +{v} cuivre',v:8},
  {id:'drum',n:'Tambour de guerre',d:'Tes unités +{v} % de vitesse',v:6},{id:'eye',n:'Œil du veilleur',d:'Tour de guet +{v} % de dégâts',v:20},
  {id:'life',n:'Sceau de vie',d:'+{v} PV max pour toi',v:20},{id:'guard',n:'Bannière de la garde',d:'Commence avec {v} guerrier',v:1}];
let REL={};
const relLv=id=>REL[id]||0,relV=(id,lv=relLv(id))=>(RELICS.find(r=>r.id===id).v)*lv;
const relSlots=()=>PROF.wins>=10?3:2;
const relDesc=(r,lv)=>{let d=tr(r.d).replace('{v}',r.v*Math.max(1,lv));if(r.id==='guard'&&lv>1)d=d.replace(/guerrier$/,'guerriers').replace(/warrior$/,'warriors');return d};
function relicsFor(dly){if(dly)return{};const o={};for(const id of PROF.relEq.slice(0,relSlots()))if(PROF.relics[id])o[id]=Math.min(3,PROF.relics[id]);return o}
function applyRelics(){const b=bases[0];if(relLv('core')){b.core.maxhp+=relV('core');b.core.hp=b.core.maxhp}
  if(relLv('purse'))b.storage.copper+=relV('purse');if(relLv('life')){player.maxhp+=relV('life');player.hp=player.maxhp}
  for(let i=0;i<relV('guard');i++)recruit(0,'warrior',true)}
// trouve une relique : privilégie celles qu'on n'a pas encore, puis celles qui ne sont pas au niveau max
function findRelic(x,y){if(daily)return;const lvl=id=>PROF.relics[id]||0,pool=RELICS.filter(r=>lvl(r.id)<3);if(!pool.length)return;
  const fresh=pool.filter(r=>!lvl(r.id)),from=fresh.length&&rnd()<.7?fresh:pool,r=from[RI(0,from.length-1)];
  const was=lvl(r.id);PROF.relics[r.id]=was+1;if(!was&&PROF.relEq.length<relSlots())PROF.relEq.push(r.id);saveProf();
  toast((was?'Relique renforcée : ':'Nouvelle relique : ')+tr(r.n)+(was?' niv. '+(was+1):'')+' ('+relDesc(r,was+1)+')'+(was||PROF.relEq.includes(r.id)?'':' · équipe-la depuis le menu'),5,'#c9a7ff');
  sfx.ach();buzz(60);if(x!=null){burst(x,y,'#c9a7ff',30,100,200,1.2,1);pops.push({ring:1,x,y,t:.6,max:.6,col:'#c9a7ff',r:34})}}
// défi du jour : même monde et même règle spéciale pour tout le monde ce jour-là
const MODS=[
  {id:'rich',n:'Filons généreux',d:'Deux fois plus de minerai'},
  {id:'blood',n:'Nuits rouges',d:'Chaque nuit est une lune de sang'},
  {id:'fury',n:'Rouge enragé',d:'L\'ennemi recrute 40 % plus vite'},
  {id:'gold',n:'Trésor royal',d:'Ta base démarre avec une réserve pleine'},
  {id:'glass',n:'Cœurs de verre',d:'Les deux cœurs ont moitié moins de PV'},
];
const dayKey=(d=new Date())=>d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();
function dailyInfo(){const k=dayKey();let h=k*2654435761>>>0;h^=h>>>15;return{key:k,seed:(h%1e9)|0,mod:MODS[k%MODS.length]}}
let daily=null; // défi en cours (null en partie libre)
let surv=false; // mode Siège : vagues infinies, le cœur rouge ne tombe pas
// Siège : chaque vague repoussée renforce la suivante (revenu, effectif max, délai réduit)
const survCap=()=>DF().cap+(surv?Math.min(24,stats.waves*3):0),firstWave=()=>surv?Math.max(60,150-stats.waves*10):DF().first+(firstRun?120:0);
// ---------- prise en main de la toute première partie : marcher, sauter, miner (avant les objectifs) ----------
// firstRun : vraie pendant la première partie libre du profil ; repousse la première vague de 2 min et met en avant le bouton Base
let tut=-1,firstRun=false;
const TUT=[
  {t:()=>isTouch?'Touche ◀ ▶ pour marcher':'Marche avec Q / D ou ← →',hl:['l','r'],ok:()=>Math.abs(player.x-22*T)>3*T},
  {t:()=>isTouch?'Touche ▲ pour sauter':'Saute avec Espace',hl:['j'],ok:()=>!player.onGround&&player.vy<-60},
  {t:()=>isTouch?'Gros bouton : mine le bloc visé':'Clic droit sur un bloc pour le miner',hl:['a'],ok:()=>stats.mined>=1}];
function checkTut(){if(tut<0||player.dead)return;if(!TUT[tut].ok())return;tut++;sfx.place();buzz(20);
  if(tut>=TUT.length){tut=-1;PROF.tutDone=true;saveProf();toast('Bien joué ! Suis maintenant les objectifs en bas de l\'écran.',5,COL.ok)}}
const tutHL=k=>tut>=0&&TUT[tut].hl.includes(k)||k==='base'&&firstRun&&stats.obj===1&&panel!=='base';
function drawTutRing(x,y,w,h){const a=.55+.45*Math.sin(time*6),o=1+Math.round(1.5+1.5*Math.sin(time*6));ctx.globalAlpha=a;ctx.strokeStyle=COL.gold;ctx.lineWidth=2;ctx.strokeRect(x-o,y-o,w+2*o,h+2*o);ctx.globalAlpha=1;ctx.lineWidth=1}
// ---------- objectifs (guide pas à pas) ----------
const hasItem=id=>player.inv.some(s=>s&&s.id===id);
const OBJ=[
  {t:'Mine 10 blocs avec ta pioche',ok:()=>stats.mined>=10,rw:{wood:10}},
  {t:'Recrute un mineur à ta base',ok:()=>(stats.rk.miner||0)>=1,rw:{stone:10}},
  {t:'Rapporte du cuivre : 12 en réserve à ta base',ok:()=>bases[0].storage.copper>=12,rw:{wood:10}},
  {t:'Fabrique une pioche en cuivre à la forge',ok:()=>hasItem('pick2')||hasItem('pick3')||hasItem('pick4'),rw:{coal:4}},
  {t:'Recrute 3 guerriers',ok:()=>(stats.rk.warrior||0)>=3,rw:{iron:3}},
  {t:'Achète une amélioration de base',ok:()=>Object.values(bases[0].upg).some(v=>v>0),rw:{copper:6}},
  {t:'Abats 5 ennemis rouges',ok:()=>stats.kills>=5,rw:{gold:2}},
  {t:'Détruis le cœur rouge, à l\'autre bout du monde',ok:()=>false,rw:{}},
];
function checkObjectives(){const o=OBJ[stats.obj];if(!o||!o.ok())return;const b=bases[0];for(const[k,v]of Object.entries(o.rw))b.storage[k]+=v;
  const rw=Object.entries(o.rw).map(([k,v])=>'+'+v+' '+IT[k].n.toLowerCase()).join(', ');stats.obj++;toast('Objectif accompli !'+(rw?' Récompense : '+rw:''),4,COL.gold);sfx.buy()}
// cible de l'objectif en cours, pour la flèche du guide : {x,y,kind} en pixels monde, ou null si rien à montrer
let objTgt=null,objTgtT=0;
function nearestOre(id,r=40){const px=Math.floor((player.x+player.w/2)/T),py=Math.floor((player.y+player.h/2)/T);let best=null,bd=1e9;
  for(let y=Math.max(1,py-r);y<=Math.min(WH-2,py+r);y++)for(let x=Math.max(1,px-r);x<=Math.min(WW-2,px+r);x++){if(getT(x,y)!==id)continue;const d=(x-px)**2+(y-py)**2;if(d<bd){bd=d;best={x:x*T+T/2,y:y*T+T/2}}}
  return best}
function objTarget(){const b=bases[0].core,home={x:b.x+b.w/2,y:b.y+b.h/2,kind:'base'},near=t=>Math.hypot(t.x-player.x,t.y-player.y)<5*T;
  switch(stats.obj){
    case 0:return null; // n'importe quel bloc fait l'affaire
    case 2:{if(countItem('copper')+bases[0].storage.copper>=12)return near(home)?null:home;const o=nearestOre(COPPER);return o&&{...o,kind:'ore'}}
    case 6:{let best=null,bd=1e9;for(const e of ents)if(e.team===1&&e.type==='unit'&&!e.dead){const d=Math.abs(e.x-player.x)+Math.abs(e.y-player.y);if(d<bd){bd=d;best=e}}
      return best?{x:best.x+best.w/2,y:best.y,kind:'enemy'}:null}
    case 7:{const c=bases[1].core;return{x:c.x+c.w/2,y:c.y+c.h/2,kind:'enemy'}}
    default:return stats.obj<OBJ.length&&!near(home)?home:null}}
function updateObjTarget(dt){if(daily||surv||stats.obj>=OBJ.length||player.dead){objTgt=null;return}objTgtT-=dt;
  if(objTgtT<=0||stats.obj===6){objTgtT=.5;objTgt=objTarget()}}
// ---------- inventaire ----------
const maxStack=id=>IT[id].tool?1:99;
function addItem(id,n){
  for(let i=0;i<36&&n>0;i++){const s=player.inv[i];if(s&&s.id===id&&s.n<maxStack(id)){const k=Math.min(n,maxStack(id)-s.n);s.n+=k;n-=k}}
  for(let i=0;i<36&&n>0;i++){if(!player.inv[i]){const k=Math.min(n,maxStack(id));player.inv[i]={id,n:k};n-=k}}
  return n}
function countItem(id){let c=0;for(const s of player.inv)if(s&&s.id===id)c+=s.n;return c}
function takeItem(id,n){for(let i=35;i>=0&&n>0;i--){const s=player.inv[i];if(s&&s.id===id){const k=Math.min(n,s.n);s.n-=k;n-=k;if(s.n<=0)player.inv[i]=null}}}
function bestPick(){let b=null;for(const s of player.inv)if(s&&IT[s.id].tool==='pick'&&(!b||IT[s.id].pow>IT[b].pow))b=s.id;return b}
const canPay=(st,c)=>Object.entries(c).every(([k,v])=>(st[k]||0)>=v);
const pay=(st,c)=>{for(const[k,v]of Object.entries(c))st[k]-=v};

// ---------- messages ----------
function toast(s,d=3.5,col='#efe6d8'){msgs.push({s,t:d,d,col});if(msgs.length>4)msgs.shift()}
function floatText(x,y,s,col,big=false){floats.push({x,y,s,col,t:1,big,dx:R(-.6,.6)})}

// ---------- particules ----------
function burst(x,y,col,n=8,sp=60,g=300,life=.6,size=1){for(let i=0;i<n;i++)parts.push({x,y,vx:R(-sp,sp),vy:R(-sp*1.3,sp*.3),g,life:R(life*.5,life),max:life,col,size})}
function visualPuff(x,y,col,n=5){if(x<cam.x-24||x>cam.x+VW+24||y<cam.y-24||y>cam.y+VH+24||parts.length>700)return;
  for(let i=0;i<n;i++)parts.push({x,y,vx:(i-(n-1)/2)*13,vy:-18-(i%3)*12,g:180,life:.3,max:.3,col,size:1});
}
function tileBurst(tx,ty,id){const c=TD[id].mm||'#999';for(let i=0;i<10;i++)parts.push({x:tx*T+R(2,14),y:ty*T+R(2,14),vx:R(-60,60),vy:R(-110,-10),g:500,life:R(.3,.7),max:.7,col:i%3?c:shade(c,-.35),size:RI(1,2)})}

// =====================================================================
//  AUDIO (synthé minimaliste)
// =====================================================================
let AC=null,muted=!PROF.set.sound,musicT=0;
// iOS : le son démarre suspendu et peut être interrompu (appel, verrouillage) -> on le relance à chaque geste
function audioInit(){if(AC){if(AC.state!=='running')AC.resume().catch(()=>{});return}try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}loadSounds()}
// iOS ne débloque le son que sur un geste terminé (touchend, clic), jamais sur touchstart : on relance là et on joue un tampon muet
function audioUnlock(){audioInit();if(!AC||AC.state==='running')return;try{const s=AC.createBufferSource();s.buffer=AC.createBuffer(1,1,22050);s.connect(AC.destination);s.start(0)}catch(e){}}
addEventListener('touchend',audioUnlock,{capture:true,passive:true});addEventListener('click',audioUnlock,true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&AC&&AC.state!=='running')AC.resume().catch(()=>{})});
function tone(f,d,type='square',vol=.06,slide=0,delay=0){if(!AC||muted)return;const t=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d+.02)}
function noise(d,vol=.08,f=1200){if(!AC||muted)return;const t=AC.currentTime,b=AC.createBuffer(1,AC.sampleRate*d,AC.sampleRate),da=b.getChannelData(0);for(let i=0;i<da.length;i++)da[i]=(Math.random()*2-1)*(1-i/da.length);
  const s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();fl.type='lowpass';fl.frequency.value=f;s.buffer=b;g.gain.value=vol;s.connect(fl);fl.connect(g);g.connect(AC.destination);s.start(t)}
// synthé de repli (fichiers absents, page ouverte en file://, chargement en cours)
const synth={hit:()=>noise(.06,.05,1800),brk:()=>{noise(.12,.09,900);tone(140,.08,'triangle',.05,-60)},place:()=>tone(220,.05,'triangle',.06,-80),
  jump:()=>tone(330,.09,'square',.03,220),pick:()=>{tone(880,.05,'square',.03);tone(1320,.06,'square',.025,0,.04)},
  sword:()=>noise(.08,.05,3000),hurt:()=>tone(160,.15,'sawtooth',.05,-90),buy:()=>{tone(523,.08,'square',.04);tone(659,.08,'square',.04,0,.07);tone(784,.12,'square',.04,0,.14)},
  bow:()=>tone(600,.08,'triangle',.04,-300),ach:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,.14,'square',.035,0,i*.08))},horn:()=>{tone(98,1.2,'sawtooth',.06,-20);tone(147,1.2,'sawtooth',.04,-30,.1)},click:()=>tone(660,.03,'square',.025),boom:()=>{noise(.6,.2,500);tone(80,.5,'sawtooth',.08,-50)},deny:()=>tone(110,.12,'square',.04),coin:()=>{[1047,1319,1568,2093].forEach((f,i)=>tone(f,.1,'triangle',.03,0,i*.06))}};
const SCALE=[0,3,5,7,10,12,15];
function synthMusic(dt){musicT-=dt;if(musicT>0)return;const night=daylight()<.35;const base=night?110:146.8;musicT=night?.75:.5;
  const n=SCALE[Math.floor(Math.random()*SCALE.length)];if(Math.random()<.8)tone(base*2*Math.pow(2,n/12),musicT*1.6,'triangle',.018);
  if(Math.random()<.3)tone(base*Math.pow(2,SCALE[Math.floor(Math.random()*3)]/12)/2,musicT*3,'sine',.03)}
// échantillons (www/audio, générés par npm run audio) : chargés au premier geste, décodés une fois
const SND={},SND_FX=Object.keys(synth),SND_MUS=['menu','day','night','combat','blood','aube','village','grotte','raid','victoire','defaite'];let sndReq=false,sfxBus=null,musBus=null;
function loadSounds(){if(sndReq||!AC)return;sndReq=true;sfxBus=AC.createGain();sfxBus.gain.value=.8;sfxBus.connect(AC.destination);musBus=AC.createGain();musBus.gain.value=.55;musBus.connect(AC.destination);
  for(const n of[...SND_FX,...SND_MUS.map(m=>'music-'+m)])fetch('audio/'+n+'.mp3').then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(b=>new Promise((ok,ko)=>AC.decodeAudioData(b,ok,ko))).then(buf=>{SND[n]=buf}).catch(e=>console.warn('son '+n+' non chargé, synthé de repli',e))}
// petite variation de hauteur sur les sons répétitifs, et pas deux fois le même son dans la même trame
const SND_VOL={horn:.6,deny:.6,boom:.85},SND_VAR={hit:.12,brk:.1,sword:.1,place:.08,jump:.06,bow:.06,pick:.04,hurt:.06},sndLast={};
function playSnd(n,vol=1){if(!AC||muted)return true;const b=SND[n];if(!b)return false;const now=AC.currentTime;if(sndLast[n]>now-.035)return true;sndLast[n]=now;
  const s=AC.createBufferSource(),g=AC.createGain();s.buffer=b;const v=SND_VAR[n]||0;if(v)s.playbackRate.value=1+(Math.random()*2-1)*v;g.gain.value=vol*(SND_VOL[n]||1);s.connect(g);g.connect(sfxBus);s.start();return true}
const sfx={};for(const k of SND_FX)sfx[k]=()=>{if(!playSnd(k))synth[k]()};
// musique : menu à l'écran titre et de fin, jour / nuit en partie, fondu enchaîné de 2 s ; synthé de repli si le fichier manque
let musCur=null;
// Morceau voulu en partie : lune de sang > raid (3 rouges près de ton cœur, tenu 10 s) > combat (2 ennemis à moins de 13 tuiles, tenu 8 s)
// > grotte (10 tuiles sous la surface) > nuit > aube (début du jour) > village (près de ta base) > jour ; repli si le fichier manque.
let musFight=0,musRaid=0,musHold=0;
function playMusic(dt){const night=daylight()<.35,base=night?'night':'day';if(!player)return base;
  const core=bases[0]&&bases[0].core;let near=0,siege=0;
  for(const e of ents){if(e.dead||!(e.team===1||e.type==='monster'))continue;if(Math.hypot(e.x-player.x,e.y-player.y)<13*T)near++;if(e.team===1&&core&&Math.hypot(e.x-core.x,e.y-core.y)<22*T)siege++}
  musFight=near>=2?8:Math.max(0,musFight-dt);musRaid=siege>=3?10:Math.max(0,musRaid-dt);
  const tx=clamp(Math.floor(player.x/T),0,WW-1),cur=musCur&&musCur.n,deep=player.y/T>surf[tx]+(cur==='grotte'?6:10),ph=(time%dayLen)/dayLen;
  const k=isBlood()?'blood':musRaid>0?'raid':musFight>0?'combat':deep?'grotte':night?'night':ph<.16?'aube':player.x<(cur==='village'?40:34)*T?'village':'day';return SND['music-'+k]?k:base}
// jingle de fin (victoire/défaite) joué une fois, puis la musique du menu reprend
function musicJingle(win){if(!AC||muted||!PROF.set.music)return;const b=SND['music-'+(win?'victoire':'defaite')];if(!b)return;const t=AC.currentTime;
  if(musCur){const o=musCur;o.g.gain.cancelScheduledValues(t);o.g.gain.setValueAtTime(o.g.gain.value,t);o.g.gain.linearRampToValueAtTime(0,t+.4);o.s.stop(t+.5);musCur=null}
  const s=AC.createBufferSource();s.buffer=b;s.connect(musBus);s.start(t+.3);musHold=b.duration+.8}
function music(dt){if(!AC)return;if(musHold>0){musHold-=dt;return}const want=muted||!PROF.set.music?null:state==='play'?playMusic(dt):'menu';
  if(want&&!SND['music-'+want]){if(state==='play'&&!paused)synthMusic(dt);if(!musCur)return}
  if((musCur&&musCur.n)===want)return;const t=AC.currentTime;
  if(musCur){const o=musCur;o.g.gain.cancelScheduledValues(t);o.g.gain.setValueAtTime(o.g.gain.value,t);o.g.gain.linearRampToValueAtTime(0,t+2);o.s.stop(t+2.1);musCur=null}
  if(!want||!SND['music-'+want])return;const s=AC.createBufferSource(),g=AC.createGain();s.buffer=SND['music-'+want];s.loop=true;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(1,t+2);s.connect(g);g.connect(musBus);s.start(t);musCur={n:want,s,g}}

// =====================================================================
//  PHYSIQUE
// =====================================================================
function rectSolid(x,y,wd,ht){const x0=Math.floor(x/T),x1=Math.floor((x+wd-.01)/T),y0=Math.floor(y/T),y1=Math.floor((y+ht-.01)/T);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)if(solidAt(tx,ty))return true;return false}
function moveEnt(e,dt,canStep=true){
  const wat=getT(Math.floor((e.x+e.w/2)/T),Math.floor((e.y+e.h*.55)/T))===WATER;
  if(wat&&!e.inWater&&e.vy>90&&onScreen(e)){burst(e.x+e.w/2,e.y+e.h*.55,'#8fd0ff',8,50,400,.5);if(e.type==='player')noise(.15,.05,600)}
  e.inWater=wat;
  if(wat){e.vy=Math.min(e.vy+GRAV*dt*.22,65);e.vx*=Math.pow(.25,dt);if(rnd()<dt*1.5)parts.push({x:e.x+e.w/2,y:e.y+4,vx:R(-5,5),vy:-25,g:-30,life:.8,max:.8,col:'#bfe8ff',size:1})}
  else e.vy=Math.min(e.vy+GRAV*dt*(e.grav??1),560);
  e.blocked=false;
  let dx=e.vx*dt;const nx=Math.max(1,Math.ceil(Math.abs(dx)/4));
  for(let i=0;i<nx;i++){const sx=dx/nx;
    if(!rectSolid(e.x+sx,e.y,e.w,e.h)){e.x+=sx;continue}
    if(canStep&&e.onGround&&!rectSolid(e.x+sx,e.y-T-.5,e.w,e.h)&&!rectSolid(e.x,e.y-T-.5,e.w,e.h)){
      // marche automatique d'un bloc
      const ny=Math.floor((e.y+e.h)/T)*T-T-e.h;if(!rectSolid(e.x+sx,ny,e.w,e.h)){e.stepOff=(e.stepOff||0)+(e.y-ny);e.y=ny;e.x+=sx;continue}}
    const sg=Math.sign(sx);for(let k=0;k<4&&!rectSolid(e.x+sg,e.y,e.w,e.h);k++)e.x+=sg;e.blocked=true;e.vx=0;break}
  let dy=e.vy*dt;const ny=Math.max(1,Math.ceil(Math.abs(dy)/4));const wasG=e.onGround;e.onGround=false;
  for(let i=0;i<ny;i++){const sy=dy/ny;if(!rectSolid(e.x,e.y+sy,e.w,e.h)){e.y+=sy;continue}
    const sg=Math.sign(sy);for(let k=0;k<4&&!rectSolid(e.x,e.y+sg,e.w,e.h);k++)e.y+=sg;if(sy>0){e.onGround=true;if(!wasG&&e.type!=='item'&&e.vy>160){e.squash=Math.min(1,e.vy/420);if(e.type==='player'&&e.vy>300)burst(e.x+e.w/2,e.y+e.h,'#c9b8a0',8,45,200,.4)}}e.vy=0;break}
  if(e.stepOff)e.stepOff=Math.max(0,e.stepOff-dt*120);
  if(e.squash&&e.type!=='player'){e.squash*=Math.pow(.0005,dt);if(Math.abs(e.squash)<.02)e.squash=0}
  e.x=clamp(e.x,0,WW*T-e.w)}

// ---------- destruction de tuiles ----------
function breakTile(tx,ty,by){
  const id=getT(tx,ty);if(id===AIR)return;
  if(id===LOG){ // abattre l'arbre entier
    const tree=trees.find(t=>t.x===tx);
    if(tree&&visualDebris.length<12&&Math.abs(tx*T-cam.x-VW/2)<VW){
      const top=(tree.top-1)*T+8-tree.img.height/2,bottom=(ty+1)*T,c=mk(tree.img.width,Math.ceil(bottom-top)),q=c.getContext('2d');
      for(let y=tree.top;y<=ty;y++)if(getT(tx,y)===LOG)q.drawImage(TEX[LOG][(tx*7+y*13)&3],Math.round(c.width/2-8),Math.round(y*T-top));
      q.drawImage(tree.img,0,0);visualDebris.push({img:c,x:tx*T+8,y:bottom,t:0,tree:true,dir:player.x<tx*T?1:-1});
    }
    trees=trees.filter(t=>t.x!==tx);
    let n=0;const st=[[tx,ty]];const seen=new Set();while(st.length){const[x,y]=st.pop();const k=x+','+y;if(seen.has(k))continue;seen.add(k);const t=getT(x,y);
      if(t===LOG||(t===LEAF&&Math.abs(x-tx)<5)){if(t===LOG)n++;setT(x,y,AIR);if(t===LEAF&&rnd()<.3)parts.push({x:x*T+8,y:y*T+8,vx:R(-30,30),vy:R(-30,10),g:60,life:1.6,max:1.6,col:PAL.grass[RI(2,4)],size:2,leaf:1});
        if(y<=ty)for(const[dx,dy]of[[0,-1],[1,0],[-1,0],[1,-1],[-1,-1]])st.push([x+dx,y+dy])}}
    tileBurst(tx,ty,LOG);if(by==='player')dropItem(tx*T+8,ty*T,'wood',n+RI(0,2));else if(by&&by.carry){by.carry.wood=(by.carry.wood||0)+n;by.junk=(by.junk||0)+n}
    sfx.brk();return}
  setT(tx,ty,AIR);tileBurst(tx,ty,id);
  if(id===CHEST){if(by==='player'){if(visualDebris.length<12)visualDebris.push({x:tx*T,y:ty*T,t:0,tree:false});const L=[['potion',RI(1,2)],['bomb',RI(2,4)],[['iron','silver','gold'][RI(0,2)],RI(3,6)],['crystal',1]];if(rnd()<.35)L.push(['diamond',RI(1,2)]);
      for(const[k,n]of L)if(rnd()<.8)dropItem(tx*T+8,ty*T+4,k,n);stats.chests++;qAdd('chest');unlock('chest');if(rnd()<.3)findRelic(tx*T+8,ty*T);burst(tx*T+8,ty*T+8,'#ffe066',24,90,200,1,1);pops.push({ring:1,x:tx*T+8,y:ty*T+8,t:.5,max:.5,col:'#ffe066',r:28});toast('Coffre au trésor !',2,COL.gold);sfx.buy();buzz(30)}else setT(tx,ty,CHEST);return}
  const d=TD[id].drop;
  if(d){if(by==='player'){dropItem(tx*T+8,ty*T+6,d,1);stats.mined++;qAdd('mine');unlock('first_block');if(stats.mined>=100)unlock('miner100');if(id===DIAMOND){unlock('diamond');qAdd('diamond')}}else if(by&&by.carry&&RES.includes(d)){by.carry[d]=(by.carry[d]||0)+1;if(d==='stone')by.junk=(by.junk||0)+1;else by.carryN++}}
  if(id===GRASS||id===DIRT)if(rnd()<.03&&by==='player')dropItem(tx*T+8,ty*T+6,'crystal',0);
  // ce qui reposait dessus tombe
  const up=getT(tx,ty-1);if(up===PLANT||up===TORCH){setT(tx,ty-1,AIR);if(up===TORCH&&by==='player')dropItem(tx*T+8,(ty-1)*T+6,'torch',1)}
  if(up===LOG)breakTile(tx,ty-1,by);
  // la base enterrée : l'herbe repousse à la surface
  if(tx>=0&&tx<WW&&surf[tx]===ty){let s=ty;while(s<WH&&!TD[fg[idx(tx,s)]].solid)s++;surf[tx]=s}
}
function dropItem(x,y,id,n){if(n<=0)return;ents.push({type:'item',id,n,x:x-4,y,w:8,h:8,vx:R(-40,40),vy:R(-140,-80),onGround:false,age:0,grav:1})}

// =====================================================================
//  JOUEUR
// =====================================================================
const keys={};const mouse={x:0,y:0,l:false,r:false,wx:0,wy:0,inside:false};
function hostile(a,b){return a.team!==b.team}
function updatePlayer(dt){
  const p=player;
  if(p.dead){p.respawn-=dt;if(p.respawn<=0){p.dead=false;p.hp=p.maxhp;p.x=bases[0].core.x+30;p.y=BASE_GY*T-24;p.vx=p.vy=0;toast('Tu es de retour à la base.')}return}
  const L=keys.ArrowLeft||keys.KeyA||touch.l,Rr=keys.ArrowRight||keys.KeyD||touch.r,J=keys.Space||keys.KeyW||keys.ArrowUp||touch.j;
  // rappel à la base : 3 s d'incantation immobile (bouger ou être touché l'annule), puis 45 s de recharge
  if(p.recallCd>0)p.recallCd-=dt;
  if(p.recall>0){if(L||Rr||J){p.recall=0;toast('Rappel annulé.',1.5,'#ffb0a0')}else{p.recall-=dt;if(rnd()<dt*40)parts.push({x:p.x+R(-4,p.w+4),y:p.y+p.h,vx:0,vy:R(-70,-30),g:-30,life:.6,max:.6,col:'#9fd0ff',size:1,glow:1});
      if(p.recall<=0){burst(p.x+p.w/2,p.y+p.h/2,'#9fd0ff',20,90,100,.8);p.x=bases[0].core.x+30;p.y=BASE_GY*T-24;p.vx=p.vy=0;p.recallCd=45;cam.x=p.x-VW/2;cam.y=p.y-VH*camFY();
        pops.push({ring:1,x:p.x+p.w/2,y:p.y+p.h/2,t:.5,max:.5,col:'#9fd0ff',r:30});burst(p.x+p.w/2,p.y+p.h/2,'#9fd0ff',20,90,100,.8);sfx.ach();buzz(40);toast('Tu es de retour à la base.',2.5,'#9fd0ff')}}}
  const acc=p.onGround?1400:900,max=92;
  if(L&&!Rr){p.vx=Math.max(-max,p.vx-acc*dt);p.dir=-1}else if(Rr&&!L){p.vx=Math.min(max,p.vx+acc*dt);p.dir=1}else{p.vx*=p.onGround?Math.pow(.0005,dt):Math.pow(.2,dt);if(Math.abs(p.vx)<4)p.vx=0}
  if(p.inWater&&J){p.vy=Math.max(p.vy-900*dt,-125)}
  p.coyote=p.onGround||p.inWater?.1:p.coyote-dt;p.jumpBuf=J&&!p.jHeld?.12:p.jumpBuf-dt;p.jHeld=J;
  if(p.jumpBuf>0&&p.coyote>0){p.vy=-JUMP;p.coyote=0;p.jumpBuf=0;sfx.jump();p.squash=-.8;burst(p.x+p.w/2,p.y+p.h,'#b9a98f',4,25,100,.3)}
  if(p.squash)p.squash*=Math.pow(.0005,dt);
  if(!J&&p.vy<-120)p.vy=-120;
  moveEnt(p,dt);
  p.anim+=Math.abs(p.vx)*dt*.16;if(p.onGround&&Math.abs(p.vx)>70&&rnd()<dt*8)parts.push({x:p.x+p.w/2-p.dir*4,y:p.y+p.h-1,vx:-p.dir*R(10,30),vy:R(-25,-8),g:60,life:.4,max:.4,col:'#b9a98f',size:1});if(p.flash>0)p.flash-=dt;if(p.iframes>0)p.iframes-=dt;if(p.swing>0)p.swing-=dt;if(p.useCd>0)p.useCd-=dt;
  if(p.y>WH*T)hurt(p,999,null);
  // régénération lente près de la base
  p.lastHurt=(p.lastHurt||0)+dt;if(p.lastHurt>5&&Math.abs(p.x-bases[0].core.x)<120&&p.hp<p.maxhp)p.hp=Math.min(p.maxhp,p.hp+dt*6);
  // ramassage des objets
  for(const e of ents){if(e.type!=='item'||e.age<.35)continue;const dx=p.x+p.w/2-(e.x+4),dy=p.y+p.h/2-(e.y+4),d=Math.hypot(dx,dy);
    if(d<56){e.vx+=dx/d*600*dt;e.vy+=dy/d*600*dt;e.magnet=true}
    if(d<12){const left=addItem(e.id,e.n);if(left<e.n){sfx.pick();floatText(p.x+5,p.y-4,'+'+(e.n-left)+' '+IT[e.id].n,'#ffe9a8');for(let i=0;i<5;i++)parts.push({x:e.x+4,y:e.y+4,vx:R(-30,30),vy:R(-50,-10),g:0,life:.4,max:.4,col:'#fff3bb',size:1,glow:1})}e.n=left;if(left<=0)e.dead=true}}
  // dépôt automatique du minerai à la base
  const b=bases[0];if(Math.abs(p.x-b.core.x)<70&&Math.abs(p.y-b.core.y)<80){let got=0;for(const k of['coal','copper','iron','silver','gold','diamond']){const c=countItem(k);if(c>0){takeItem(k,c);b.storage[k]+=c;got+=c}}
    if(got){toast('Dépôt à la base : '+got+' minerais.',2.5,'#9fd0ff');sfx.buy()}}
  // utilisation de l'objet
  const sel0=p.inv[p.sel];if(touch.a&&!mouse.l){const a=autoAim(sel0&&IT[sel0.id]);mouse.wx=a.x;mouse.wy=a.y}const useL=mouse.l||touch.a,blocked=mouse.l?panelBlocks():paused;
  const wx=mouse.wx,wy=mouse.wy,tx=Math.floor(wx/T),ty=Math.floor(wy/T),pcx=p.x+p.w/2,pcy=p.y+6;
  const inReach=Math.hypot(tx*T+8-pcx,ty*T+8-pcy)<T*5.5;hoverTile=inReach&&(mouse.inside||touch.a)?{tx,ty}:null;
  const sel=p.inv[p.sel],it=sel&&IT[sel.id];
  let mineWith=null;
  // tactile : un seul gros bouton -> si un ennemi est au contact alors qu'on tient la pioche ou un bloc,
  // on frappe avec la meilleure épée du sac (ou à mains nues) au lieu de creuser
  let melee=it&&it.tool==='sword'?it:null,foeX=null;
  if(touch.a&&!mouse.l&&!melee&&!(it&&(it.tool==='bow'||it.use==='heal'||it.use==='bomb'))){
    const foe=ents.find(e=>e.hp&&e!==p&&e.type!=='item'&&hostile(p,e)&&Math.abs(e.y+e.h/2-pcy)<26&&Math.abs(e.x+e.w/2-pcx)<30);
    if(foe){foeX=foe.x+foe.w/2;melee={dmg:6};for(const s of p.inv){const d=s&&IT[s.id];if(d&&d.tool==='sword'&&d.dmg>melee.dmg)melee=d}}}
  if(useL&&!blocked){
    if(melee){const it=melee;if(p.swing<=0){p.swing=.32;p.swingDir=(foeX??wx)<pcx?-1:1;p.dir=p.swingDir;sfx.sword();
        for(const e of ents){if(!e.hp||e===p||!hostile(p,e)||e.type==='item')continue;const ex=e.x+e.w/2,ey=e.y+e.h/2;if(Math.abs(ey-pcy)<26&&(ex-pcx)*p.swingDir>-8&&Math.abs(ex-pcx)<30)hurt(e,it.dmg*(1+(p.critBuff||0))*(1+relV('blade')/100),p)}}}
    else if(it&&it.tool==='bow'){if(p.useCd<=0){p.useCd=.45;const a=Math.atan2(wy-pcy,wx-pcx);arrows.push({x:pcx,y:pcy,vx:Math.cos(a)*340,vy:Math.sin(a)*340,team:0,dmg:it.dmg*(1+relV('blade')/100),life:3,src:p});sfx.bow();p.dir=wx<pcx?-1:1}}
    else if(it&&it.use==='heal')drinkPotion();
    else if(it&&it.use==='bomb'){if(p.useCd<=0){p.useCd=.55;throwBomb(pcx,pcy,wx,wy);takeItem('bomb',1);p.dir=wx<pcx?-1:1;p.swing=.2}}
    else if(it&&it.place!==undefined)tryPlace(tx,ty,it.place,sel.id);
    else mineWith=bestPick();
  }
  if(mouse.r&&!panelBlocks()){if(it&&it.place!==undefined&&!useL)tryPlace(tx,ty,it.place,sel.id);else mineWith=bestPick()}
  if(mineWith&&inReach){const id=getT(tx,ty),d=TD[id];
    if(id!==AIR&&d.hard!==Infinity){const pk=IT[mineWith];
      if(d.tier>pk.tier){if(!mining||mining.warn!==id){toast('Il faut une meilleure pioche pour : '+d.n,2.5,'#ffb0a0');sfx.deny()}mining={tx,ty,p:0,warn:id}}
      else{if(!mining||mining.tx!==tx||mining.ty!==ty)mining={tx,ty,p:0};mining.p+=dt*pk.pow/Math.max(.05,d.hard)*1.9*(1+relV('pick')/100);p.swing=Math.max(p.swing,.01);p.swingDir=tx*T+8<pcx?-1:1;p.dir=p.swingDir;
        mining.hitT=(mining.hitT||0)-dt;if(mining.hitT<=0){mining.hitT=.22;sfx.hit();parts.push({x:tx*T+8+R(-4,4),y:ty*T+8+R(-4,4),vx:R(-40,40),vy:R(-80,-20),g:400,life:.3,max:.3,col:d.mm||'#aaa',size:1})}
        if(mining.p>=1){breakTile(tx,ty,'player');mining=null}}}
    else mining=null}else mining=null;
}
// potion : depuis la barre d'objets, la touche F ou le bouton qui apparaît sous les cœurs quand on est blessé
function drinkPotion(){const p=player;if(p.dead||p.useCd>0||p.hp>=p.maxhp||!countItem('potion'))return;p.useCd=.6;p.hp=Math.min(p.maxhp,p.hp+50);takeItem('potion',1);
  const x=p.x+p.w/2;floatText(x,p.y-6,'+50','#7dff9a');sfx.buy();burst(x,p.y+6,'#ff7d9a',12,50,-50,.8)}
function startRecall(){const p=player;if(p.dead||p.recall>0)return;if(p.recallCd>0){toast('Rappel prêt dans '+Math.ceil(p.recallCd)+' s.',2,'#ffb0a0');sfx.deny();return}
  if(Math.abs(p.x-bases[0].core.x)<12*T){toast('Tu es déjà à la base.',2,'#9fd0ff');return}p.recall=3;panel=null;cursorItem=null;toast('Rappel à la base dans 3 s : ne bouge pas.',3,'#9fd0ff');sfx.place()}
function tryPlace(tx,ty,tid,itemId){
  const p=player;if(p.useCd>0)return;const cur=getT(tx,ty);if(cur!==AIR&&cur!==PLANT&&cur!==WATER)return;
  if(Math.hypot(tx*T+8-(p.x+p.w/2),ty*T+8-(p.y+6))>T*5.5)return;
  const r={x:tx*T,y:ty*T,w:T,h:T};if(TD[tid].solid)for(const e of ents){if(e.type==='item'||e.type==='core')continue;if(e.x<r.x+r.w&&e.x+e.w>r.x&&e.y<r.y+r.h&&e.y+e.h>r.y)return}
  const near=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>TD[getT(tx+dx,ty+dy)].solid)||bg[idx(tx,ty)];if(!near)return;
  if(tid===TORCH&&!TD[getT(tx,ty+1)].solid&&!bg[idx(tx,ty)])return;
  setT(tx,ty,tid);takeItem(itemId,1);p.useCd=.12;sfx.place();pops.push({tile:1,tx,ty,t:.2,max:.2});if(tx>=0&&tx<WW&&ty<surf[tx]&&TD[tid].solid)surf[tx]=ty}

// ---------- bombes : lancer en cloche, rebonds, explosion qui creuse et blesse ----------
function throwBomb(x,y,tx,ty){const dx=tx-x,dy=ty-y,tt=clamp(Math.abs(dx)/160,.3,.9);bombs.push({x,y,vx:dx/tt,vy:dy/tt-GRAV*.5*tt,t:1.4});sfx.jump()}
function updateBombs(dt){for(const b of bombs){b.t-=dt;b.vy+=GRAV*dt;
    const nx=b.x+b.vx*dt;if(solidAt(Math.floor(nx/T),Math.floor(b.y/T))){b.vx*=-.4}else b.x=nx;
    const ny=b.y+b.vy*dt;if(solidAt(Math.floor(b.x/T),Math.floor(ny/T))){if(Math.abs(b.vy)>60)sfx.place();b.vy*=-.35;b.vx*=.7}else b.y=ny;
    if(rnd()<dt*30)parts.push({x:b.x,y:b.y-5,vx:R(-10,10),vy:R(-30,-10),g:0,life:.3,max:.3,col:rnd()<.5?'#ffb653':'#fff3bb',size:1,glow:1});
    if(b.t<=0)explode(b.x,b.y)}
  bombs=bombs.filter(b=>b.t>0)}
function explode(x,y){const tx0=Math.floor(x/T),ty0=Math.floor(y/T),R2=2.6;
  for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){if(dx*dx+dy*dy>R2*R2)continue;const X=tx0+dx,Y=ty0+dy,id=getT(X,Y);if(id===AIR||id===WATER||TD[id].hard===Infinity||id===CHEST&&false)continue;if(Y<0||Y>=WH)continue;breakTile(X,Y,'player')}
  for(const e of ents){if(e.dead||!e.hp||e.type==='item'||e===player)continue;const d=Math.hypot(e.x+e.w/2-x,e.y+e.h/2-y);if(d>46)continue;
    if(hostile(player,e))hurt(e,e.type==='core'?40:75*(1-d/80),player);}
  {const d=Math.hypot(player.x+5-x,player.y+11-y);if(d<46&&!player.dead){player.vx+=Math.sign(player.x+5-x)*160;player.vy=Math.min(player.vy,-200)}}
  for(let i=0;i<3;i++)burst(x,y,['#fff3bb','#ffb653','#ff6a3a'][i],18,140,250,.9,2);burst(x,y,'#3a3550',14,60,-20,1.4,2);
  pops.push({ring:1,x,y,t:.4,max:.4,col:'#ffe0a0',r:54});pops.push({flash:1,x,y,t:.15,max:.15});
  shake=Math.max(shake,PROF.set.shake?9:0);sfx.boom();buzz(90);unlock('bomb');lightDirty=true}

// =====================================================================
//  COMBAT
// =====================================================================
function hurt(e,dmg,src){
  if(e.hp<=0||e.dead)return;if(surv&&e.type==='core'&&e.team===1){e.flash=.08;return}if(e.type==='player'){if(e.iframes>0||e.dead)return;if(src)dmg*=DF().hurt;e.recall=0;e.iframes=.35;e.lastHurt=0;sfx.hurt();shake=Math.max(shake,4);hurtFx=1;buzz(40)}
  // le cœur résiste aux troupes (siège ~20 s au lieu de 8) : le temps de revenir le défendre
  if(e.type==='core'&&src&&src.type!=='player')dmg*=.45;e.hitT=time;
  dmg=Math.round(dmg);e.hp-=dmg;e.flash=.12;if(e.type==='core'&&e.team===0)stats.coreHit=(stats.coreHit||0)+dmg;e.hitVisualDir=src?(Math.sign(e.x-src.x)||1):0;floatText(e.x+e.w/2,e.y-2,'-'+dmg,e.team===0?'#ff8a7a':'#ffe08a',dmg>=30);if(src===player&&e.type!=='core')hitStop=Math.max(hitStop,dmg>=30?.07:.035);
  if(src&&e.type!=='core'){const dir=Math.sign((e.x+e.w/2)-(src.x+(src.w||0)/2))||1;const kb=(src.type==='player'?120:src.kind==='golem'?150:30)*(e.kind==='golem'?.3:1);e.vx+=dir*kb;if(kb>60)e.vy=Math.min(e.vy,-110)}
  burst(e.x+e.w/2,e.y+e.h/2,e.type==='core'?(e.team?'#ff8a7a':'#8ac4ff'):'#e8364b',4,50,300,.4);
  if(e.type!=='core'&&pops.length<40&&onScreen(e))pops.push({ring:1,x:e.x+e.w/2-e.hitVisualDir*e.w/2,y:e.y+e.h/2,t:.16,max:.16,col:dmg>=30?'#ffe066':'#ffffff',r:dmg>=30?16:10}); // éclat d'impact
  if(e.type==='core'){shake=Math.max(shake,2);if(e.team===0&&(!e.alertT||e.alertT<time)){e.alertT=time+12;toast('Ton cœur est attaqué !',3,'#ff8a7a');buzz(120)}
    if(e.team===0&&!e.surged&&e.hp>0&&e.hp<e.maxhp*.25&&DF().surge>0)coreSurge(e)}
  if(e.hp<=0)kill(e,src)}
// sursaut du cœur bleu (une fois par partie, jusqu'en Difficile) : une onde de choc blesse et repousse les assaillants, le temps de réagir
function coreSurge(c){c.surged=true;const cx=c.x+11,cy=c.y+17,dm=DF().surge;
  for(const o of ents){if(o.dead||!o.hp||o.team===0||o.type==='item'||o.type==='core')continue;const dx=o.x+o.w/2-cx;if(Math.abs(dx)>170||Math.abs(o.y+o.h/2-cy)>90)continue;
    hurt(o,dm,null);if(!o.dead){o.vx=(Math.sign(dx)||1)*240;o.vy=-190;o.atk=Math.max(o.atk||0,1.2)}}
  pops.push({ring:1,x:cx,y:cy,t:.7,max:.7,col:'#9fd0ff',r:170});pops.push({flash:1,x:cx,y:cy,t:.2,max:.2});burst(cx,cy,'#9fd0ff',40,200,150,1.2,2);
  shake=Math.max(shake,PROF.set.shake?8:0);sfx.boom();buzz(200);toast('Ton cœur libère une onde de choc ! Profites-en pour le défendre.',5,COL.gold)}
function kill(e,src){
  if(e.type==='player'){e.dead=true;e.respawn=DF().resp;e.recall=0;e.hp=0;toast('Tu es tombé… retour à la base dans '+DF().resp+' s.',4,'#ff8a7a');burst(e.x+5,e.y+10,'#e8364b',20,90,300,1);return}
  if(e.type==='core'){e.dead=true;sfx.boom();shake=14;for(let i=0;i<5;i++)burst(e.x+11,e.y+15,i%2?'#fff':(e.team?'#e5534b':'#4f9df5'),30,180,200,1.6,2);
    endT=1.8;endState=e.team===1?'win':'lose';hitStop=.25;buzz(300);try{localStorage.removeItem(SAVE_KEY)}catch(_){}endGame(endState==='win');return}
  e.dead=true;burst(e.x+e.w/2,e.y+e.h/2,e.type==='monster'?'#5ad16a':'#c9c0d8',14,80,300,.8);
  if(onScreen(e)){const set=e.type==='unit'?SPR[e.kind+e.team]:e.kind==='zombie'?SPR.zombie:null;const img=set?(e.dir<0?set.L:set.R).idle[0]:e.kind==='slime'?(e.blue?SPR.slimeB:SPR.slime)[0]:null;
    if(img)corpses.push({img,x:e.x+e.w/2,y:e.y+e.h,t:0,team:e.team,dir:e.type==='monster'&&e.kind==='slime'?0:(e.hitVisualDir||e.dir||1)})}
  if(src===player&&e.team===1){stats.kills++;qAdd('kill')}
  if(e.type==='monster'&&src&&src.type==='player'){if(rnd()<.5)dropItem(e.x+e.w/2,e.y,'crystal',1);if(rnd()<.35)dropItem(e.x+e.w/2,e.y,'silver',RI(1,2))}
  if(e.kind==='ogre'){const ours=src===player||!!src&&src.team===0,x=e.x+e.w/2;for(let i=0;i<3;i++)burst(x,e.y+e.h/2,['#ff5a5a','#b03a52','#ffe066'][i],22,130,250,1.1,2);pops.push({ring:1,x,y:e.y+e.h/2,t:.6,max:.6,col:'#ff5a5a',r:60});
    hitStop=.15;sfx.boom();shake=Math.max(shake,PROF.set.shake?8:0);toast(ours?'L\'ogre de sang est tombé ! Ramasse son trésor.':'L\'ogre de sang est tombé sous les coups rouges.',4,COL.gold);
    if(ours){unlock('ogre');dropItem(x,e.y+10,'diamond',RI(2,3));dropItem(x,e.y+10,'gold',RI(4,6));dropItem(x,e.y+10,'crystal',2);findRelic(x,e.y+10)}}
  if(e.kind==='champion'){qAdd('champ');if(src===player||src&&src.team===0)findRelic(e.x+e.w/2,e.y);toast('Le champion rouge est tombé !',3,COL.gold);if(src===player||src&&src.team===0)unlock('champion');hitStop=.12;dropItem(e.x+e.w/2,e.y,'gold',RI(3,6));dropItem(e.x+e.w/2,e.y,'iron',RI(4,8))}
  if(e.type==='unit'&&e.team===1&&src&&src.type==='player'&&rnd()<.5)dropItem(e.x+e.w/2,e.y,['copper','iron','coal'][RI(0,2)],RI(1,3))}

// =====================================================================
//  UNITÉS (mineurs, guerriers, archers, golems, champion)
// =====================================================================
function recruit(team,kind,free){const b=bases[team],u=UNITS[kind];if(!free&&!canPay(b.storage,u.cost))return null;if(!free)pay(b.storage,u.cost);
  const sx=b.core.x+(team===0?28:-12)+R(-6,6);
  const hp=Math.round(u.hp*(1+vet(team)));
  const e={type:'unit',kind,team,x:sx,y:BASE_GY*T-(u.big?26:22),w:u.big?16:8,h:u.big?24:20,vx:0,vy:0,hp,maxhp:hp,dir:team===0?1:-1,onGround:false,atk:0,flash:0,anim:0,digT:0,stepOff:0,
    carry:{},carryN:0,state:'seek',tgt:null,offs:R(-1,1),progX:sx,progY:0,progT:0,stuck:0,swing:0,ignore:null,ignoreT:0,wantMove:false};
  e.spawnT=.6;if(onScreen(e)){pops.push({ring:1,x:sx+e.w/2,y:e.y+e.h/2,t:.45,max:.45,col:team?'#ff8a7a':'#9fd0ff',r:22});burst(sx+e.w/2,e.y+e.h,team?'#ff9a8a':'#9fd0ff',10,30,-60,.9)}
  ents.push(e);if(team===0&&!free){stats.recruited++;qAdd('recruit');if(kind==='golem')unlock('golem');if(ents.filter(o=>o.type==='unit'&&o.team===0&&!o.dead).length>=10)unlock('army10');stats.rk=stats.rk||{};stats.rk[kind]=(stats.rk[kind]||0)+1;sfx.buy()}return e}
const uspd=e=>UNITS[e.kind].spd*(1+.12*bases[e.team].upg.speed+(e.team===0?relV('drum')/100:0))*(e.boost||1);
const udmg=e=>UNITS[e.kind].dmg*(1+.25*bases[e.team].upg.dmg)*(1+vet(e.team))*(e.aura>time?1.2:1);
const rallyX=t=>bases[t].core.x+11+(t===0?1:-1)*8*T;
const POW={miner:.3,warrior:1,archer:.9,healer:.8,golem:3.2,champion:2.5};
// combattant de ligne : ni mineur ni champion ; les soigneurs suivent l'armée mais ne partent ni en raid ni en commando
const isFighter=e=>e.kind!=='miner'&&e.kind!=='champion',canStrike=e=>isFighter(e)&&!UNITS[e.kind].heal;
// vétérans (Cauchemar) : chaque vague rouge lancée renforce les recrues suivantes
const vet=t=>t===1&&ai?ai.vet||0:0;
// cibles potentielles triées par x, reconstruites à chaque image : les recherches ne parcourent que la tranche utile (perfs à 400 unités)
let tgtList=[];
function buildTargets(){tgtList=ents.filter(o=>!o.dead&&o.hp&&o.type!=='item');tgtList.sort((a,b)=>a.x-b.x);
  // intrus : l'ennemi le plus proche de chaque cœur (rayon 26 blocs), même s'il arrive par un tunnel en contrebas
  for(const t of[0,1]){const c=bases[t].core,cx=c.x+11;let best=null,bd=26*T;for(const o of tgtNear(cx,26*T)){if(o.type!=='unit'&&o.type!=='monster'||o.team===t)continue;const d=Math.abs(o.x+o.w/2-cx),dy=o.y-c.y;
    // pas de chasse au fond des grottes : seulement ce qui menace vraiment le cœur (à sa hauteur, monstres tout proches)
    if(dy>10*T||dy<-8*T||o.type==='monster'&&d>10*T)continue;if(d<bd){bd=d;best=o}}
    if(best&&!intruder[t]&&t===0&&time-(intruderT||0)>20){intruderT=time;toast('Ton cœur est attaqué ! Tes défenseurs accourent.',3,'#ff9a8a')}intruder[t]=best;
    // pillards qui chassent nos mineurs (à moins de 90 blocs du cœur) : les 3 défenseurs les plus proches partent les intercepter
    const rd=ents.filter(o=>!o.dead&&o.raid&&o.team!==t&&Math.abs(o.x-cx)<90*T).sort((a,c)=>Math.abs(a.x-cx)-Math.abs(c.x-cx))[0];
    if(rd&&(!raider[t]||raider[t].dead)){if(t===0)toast('Des pillards attaquent tes mineurs : 3 défenseurs partent les intercepter.',3,'#ff9a8a');
      ents.filter(o=>!o.dead&&o.type==='unit'&&o.team===t&&canStrike(o)&&!o.retreat&&!o.raid&&!o.strike).sort((a,c)=>Math.abs(a.x-rd.x)-Math.abs(c.x-rd.x)).slice(0,3).forEach(o=>o.hunt=rd)}
    raider[t]=rd||null}}
let intruder=[null,null],intruderT=0,raider=[null,null];
function* tgtNear(x,r){let lo=0,hi=tgtList.length;const a=x-r-32;while(lo<hi){const m=(lo+hi)>>1;if(tgtList[m].x<a)lo=m+1;else hi=m}
  for(let i=lo;i<tgtList.length;i++){const o=tgtList[i];if(o.x>x+r+8)break;yield o}}
function nearestHostile(e,range){let best=null,bd=range;for(const o of tgtNear(e.x,range)){if(o.dead||!o.hp||!hostile(e,o))continue;
    const d=Math.hypot(o.x+o.w/2-(e.x+e.w/2),(o.y+o.h/2-(e.y+e.h/2))*1.6);if(d<bd){bd=d;best=o}}return best}
// cible atteignable : on ignore ce qui est trop haut/bas pour la mêlée, et ce qu'on a renoncé à poursuivre
// cible gardée ~0,2 s (balayage des voisins coûteux au-delà de 300 unités) ; on rebalaye si elle meurt ou si le rayon change
function pickTarget(e,u,aggro){const c=e.ptc;if(c&&c.a===aggro&&time<c.t&&(!c.o||!c.o.dead&&c.o.hp>0))return c.o;
  const o=scanTarget(e,u,aggro);e.ptc={a:aggro,t:time+.15+rnd()*.1,o};return o}
function scanTarget(e,u,aggro){let best=null,bd=1e9;const smart=e.team===0||DF().iq>=2;
  for(const o of tgtNear(e.x,aggro)){if(o.dead||!o.hp||!hostile(e,o))continue;if(o===e.ignore&&time<e.ignoreT)continue;
    if(time<(e.blindT||0)&&o.type!=='core'&&Math.hypot(o.x-e.x,o.y-e.y)>40)continue;
    const dx=o.x+o.w/2-(e.x+e.w/2),dy=o.y+o.h/2-(e.y+e.h/2);if(Math.abs(dx)>aggro)continue;
    // le cœur se tire presque à niveau : depuis une grotte en dessous, la flèche finit dans le sol du château
    if(o.type==='core'?vgap(e,o)>(u.ranged?40:52):Math.abs(dy)>(u.ranged?130:52))continue;
    let d=Math.abs(dx)+Math.abs(dy)*1.5;if(o.type==='core')d-=(Math.abs(dx)<110?400:60);if(o.type==='monster')d+=40;
    // tir concentré : on achève les blessés, on vise d'abord les soigneurs, les tireurs se répondent
    if(smart&&o.type!=='core'){d-=(1-o.hp/o.maxhp)*26;if(o.type==='unit'){const k=UNITS[o.kind];if(k.heal)d-=28;else if(u.ranged&&k.ranged)d-=12}}
    if(d<bd){bd=d;best=o}}return best}
function digStep(e,tx,ty,dt,collect){const id=getT(tx,ty),d=TD[id];if(!d.solid&&id!==LOG)return 1;if(d.hard===Infinity)return -1;
  e.digVisualUntil=time+.08;e.digVisualPhase=(e.digVisualPhase||0)+dt*5;
  e.digT+=dt*(UNITS[e.kind].big?2.4:1)*(e.kind==='miner'||e.kind==='champion'?1.7:1);e.swing=.2;e.wantMove=false;
  if(e.digT>=d.hard*.55){e.digT=0;breakTile(tx,ty,collect?e:null)}
  else if(rnd()<dt*6)parts.push({x:tx*T+8,y:ty*T+8,vx:R(-40,40),vy:R(-60,-10),g:400,life:.25,max:.25,col:d.mm||'#999',size:1});return 0}
// Déplacement horizontal vers tx. Saute les murs de 1-2 blocs, sinon creuse.
// mode : 'auto' (saut puis creusage, escalier si sous terre), 'climb' (escalier vers le haut), 'flat' (tunnel horizontal)
function navigate(e,tx,dt,mode='auto'){
  const cx=e.x+e.w/2;if(Math.abs(tx-cx)<3){e.vx*=.5;moveEnt(e,dt);return true}
  const dir=Math.sign(tx-cx);e.dir=dir;e.wantMove=true;e.vx=dir*uspd(e);moveEnt(e,dt);
  if(!e.blocked||!e.onGround)return false;
  const ax=Math.floor((dir>0?e.x+e.w+1:e.x-1)/T),y0=Math.floor(e.y/T),y1=Math.floor((e.y+e.h-.01)/T),o0=Math.floor(e.x/T),o1=Math.floor((e.x+e.w-.01)/T),rows=y1-y0+1;
  if(mode!=='flat'){let h=0;while(h<3&&solidAt(ax,y1-h))h++;
    if(h>0&&h<=2){let free=true;for(let k=1;k<=h;k++)for(let x=o0;x<=o1;x++)if(solidAt(x,y0-k))free=false;for(let r=0;r<rows;r++)if(solidAt(ax,y1-h-r))free=false;
      if(free){e.vy=-JUMP*(h>1?1.1:.85);return false}}}
  const under=y1>surf[clamp(ax,0,WW-1)]+1;const list=[];
  if(mode==='climb'||(mode==='auto'&&under)){for(let y=y0-1;y<y1;y++)list.push([ax,y]);for(let x=o0;x<=o1;x++)list.push([x,y0-1])}
  else for(let y=y0;y<=y1;y++)list.push([ax,y]);
  for(const[x,y]of list){const r=digStep(e,x,y,dt,e.kind==='miner'||e.kind==='champion');if(r===0)return false;if(r<0){e.vy=-JUMP;return false}}
  e.vy=-JUMP*.95;return false}
// monter à la verticale : creuser au-dessus de la tête, sauter, poser un bloc sous ses pieds (pilier)
function climbUp(e,dt,cxT){const cx=e.x+e.w/2;e.vx=clamp((cxT-cx)*4,-uspd(e),uspd(e));e.dir=Math.sign(e.vx)||e.dir;moveEnt(e,dt);e.wantMove=true;
  if(!e.onGround)return;const o0=Math.floor(e.x/T),o1=Math.floor((e.x+e.w-.01)/T),y0=Math.floor(e.y/T),fy=Math.floor((e.y+e.h-.01)/T);
  for(let x=o0;x<=o1;x++)for(const y of[y0-1,y0-2]){const r=digStep(e,x,y,dt,e.kind==='miner'||e.kind==='champion');if(r===0)return;if(r<0){e.vy=-JUMP;return}}
  e.vy=-JUMP*.85;e.pillarY=fy;e.pillarX=Math.floor((e.x+e.w/2)/T)}
function updatePillar(e){if(e.pillarY==null)return;
  if(e.y+e.h<=e.pillarY*T-.5){const t=getT(e.pillarX,e.pillarY);if(flowable(t)||t===WATER){setT(e.pillarX,e.pillarY,DIRT);
      // les unités qui se trouvaient dans la case sont hissées dessus (sinon elles restent emmurées dans le pilier)
      const px=e.pillarX*T,py=e.pillarY*T;for(const o of ents)if(o!==e&&(o.type==='unit'||o.type==='monster')&&!o.dead&&o.x<px+T&&o.x+o.w>px&&o.y<py+T&&o.y+o.h>py){const ny=py-o.h-.01;if(!rectSolid(o.x,ny,o.w,o.h)){o.y=ny;o.vy=Math.min(o.vy,0)}}}e.pillarY=null}
  else if(e.onGround&&e.vy===0)e.pillarY=null}
function trackProgress(e,dt){e.progT+=dt;if(e.progT<2)return;const mv=Math.hypot(e.x-e.progX,e.y-e.progY);
  if(e.wantMove&&mv<10)e.stuck=Math.min(3,e.stuck+1);else if(mv>28)e.stuck=0;e.progX=e.x;e.progY=e.y;e.progT=0;e.wantMove=false}
function meleeOrShoot(e,u,tgt){e.vx=0;e.dir=Math.sign(tgt.x+tgt.w/2-(e.x+e.w/2))||e.dir;if(e.atk>0)return;e.atk=u.cd;e.swing=.25;
  // archer qui tire dans la roche (cibles derrière un mur, ex. armée coincée sous le cœur adverse) : 12 s sans viser au loin, il reprend sa marche
  if(u.ranged&&(e.miss||0)>=4&&tgt.type!=='core'){e.miss=0;e.atk=0;e.blindT=time+12;e.ptc=null;return}
  if(u.ranged){const sx=e.x+e.w/2,sy=e.y+6,tx=tgt.x+tgt.w/2,ty=tgt.y+tgt.h/2,dd=Math.abs(tx-sx),v=250,tt=dd/v;// cœur derrière les murs du château (archer posé sur le toit, au ras d'un créneau) : tir en cloche qui passe par-dessus la maçonnerie
    const lob=tgt.type==='core'&&(e.miss||0)>=2;arrows.push({x:sx,y:sy,vx:Math.sign(tx-sx)*v,vy:(ty-sy)/Math.max(tt,.1)-150*tt,team:e.team,dmg:udmg(e),life:3,src:e,lob:lob?tgt:null});if(onScreen(e))sfx.bow()}
  else{hurt(tgt,udmg(e),e);if(e.kind==='golem')shake=Math.max(shake,onScreen(e)?2:0)}}
// écran en hauteur (portrait) : HUD en haut, commandes tactiles en bas, le ciel au-dessus est vide
// -> le joueur est placé à 36 % de la hauteur, on voit plus de sous-sol
const camFY=()=>VH>VW*1.2?.36:.5;
const onScreen=e=>e.x>cam.x-20&&e.x<cam.x+VW+20&&e.y>cam.y-20&&e.y<cam.y+VH+20;
// écart vertical entre deux boîtes (0 si elles se chevauchent en hauteur) : le cœur est grand, le centre ne suffit pas
const vgap=(a,b)=>Math.max(0,b.y-(a.y+a.h),a.y-(b.y+b.h));
function engage(e,u,tgt,dt){const dx=tgt.x+tgt.w/2-(e.x+e.w/2),gap=Math.abs(dx)-tgt.w/2-e.w/2,dy=tgt.type==='core'?vgap(e,tgt)+10:Math.abs(tgt.y+tgt.h/2-(e.y+e.h/2));
  if(gap<=u.range&&dy<(u.ranged?(tgt.type==='core'?50:130):30)){meleeOrShoot(e,u,tgt);
    // mêlée : chacun garde sa place dans la portée (offs), pour qu'une troupe ne s'empile pas sur un seul pixel
    if(!u.ranged){const g=(e.offs+1)/2*(u.range-2)-gap;if(Math.abs(g)>1.5)e.vx=-Math.sign(dx)*Math.sign(g)*uspd(e)*.5}
    moveEnt(e,dt);return}
  // cible juste en dessous ou au-dessus : creuser vers le bas ou monter en pilier
  if(Math.abs(dx)<T*1.2&&!u.ranged){const vy=tgt.y+tgt.h-(e.y+e.h);
    if(vy>T*.8){
      // pas de spirale vers les profondeurs : au-delà de 3 blocs sous la surface, on lâche une cible non vitale
      if(tgt.type!=='core'&&(e.y+e.h)/T>surf[clamp(Math.floor((e.x+e.w/2)/T),0,WW-1)]+3){e.ignore=tgt;e.ignoreT=time+15;return}
      e.vx=(tgt.x+tgt.w/2-(e.x+e.w/2))*3;moveEnt(e,dt);e.wantMove=true;if(e.onGround){const o0=Math.floor(e.x/T),o1=Math.floor((e.x+e.w-.01)/T),fy=Math.floor((e.y+e.h-.01)/T);for(let x=o0;x<=o1;x++){const r=digStep(e,x,fy+1,dt,false);if(r!==1)break}}if(e.stuck>=3){e.ignore=tgt;e.ignoreT=time+10;e.stuck=1}return}
    if(vy<-T*.8)return climbUp(e,dt,tgt.x+tgt.w/2)}
  navigate(e,tgt.x+tgt.w/2,dt,e.stuck>=2?(tgt.y<e.y-20?'climb':'flat'):'auto');
  if(e.stuck>=3){e.ignore=tgt;e.ignoreT=time+10;e.stuck=1}}
// armyMid : arrière-garde de l'armée en marche (on l'attend) ; armyFront : première ligne de mêlée (tireurs et soigneurs restent derrière)
let armyMid=[null,null],armyFront=[null,null],armyRef=[null,null]; // armyRef : la première ligne, ou à défaut le centre de la troupe (repère des soigneurs)
function computeArmies(){for(const t of[0,1]){const fwd=t===0?1:-1,main=ents.filter(e=>e.type==='unit'&&e.team===t&&!e.dead&&canStrike(e)&&!e.retreat&&!e.raid&&!e.strike&&e.stuck<1),xs=main.map(e=>e.x).sort((a,b)=>a-b);
    const med=xs.length?xs[Math.floor(xs.length/2)]:0;let front=null;for(const e of main)if(!UNITS[e.kind].ranged&&Math.abs(e.x-med)<40*T&&(front==null||(e.x-front)*fwd>0))front=e.x;armyFront[t]=front;armyRef[t]=front!=null?front:xs.length?med:null;
    if(xs.length<3){armyMid[t]=null;continue}
    // arrière-garde : l'unité la plus en retard, sans compter celles restées très loin derrière (renforts tout juste recrutés)
    let rear=med;for(const x of xs)if((med-x)*fwd>0&&(med-x)*fwd<40*T&&(x-rear)*fwd<0)rear=x;armyMid[t]=rear}}
// soin : le guérisseur rend des PV à l'allié le plus mal en point à portée (unités, champion, héros), jamais à lui-même ni au cœur
function healStep(e,u){if(e.atk>0)return;let best=null,bs=.96;
  for(const o of tgtNear(e.x,u.range)){if(o.dead||o.team!==e.team||o===e||o.type==='core')continue;const f=o.hp/o.maxhp;if(f>=bs||Math.abs(o.y+o.h-(e.y+e.h))>70||Math.abs(o.x-e.x)>u.range)continue;bs=f;best=o}
  if(!best)return;e.atk=u.cd;e.swing=.25;e.dir=Math.sign(best.x-e.x)||e.dir;best.hp=Math.min(best.maxhp,best.hp+u.heal*(1+vet(e.team)));
  if(onScreen(best)){for(let i=0;i<5;i++)parts.push({x:best.x+R(0,best.w),y:best.y+R(4,best.h),vx:R(-6,6),vy:R(-34,-14),g:-20,life:.7,max:.7,col:'#7dffb0',size:1,glow:1});
    if(best===player)floatText(best.x+5,best.y-4,'+'+u.heal,'#7dff9a')}}
function retreatSpot(e,home){const hx=home.x+11+(e.team===0?24:-24),cx=e.x+e.w/2,d=hx-cx;
  return Math.abs(d)<=18*T?hx:clamp(cx+Math.sign(d)*18*T,T,(WW-1)*T)}
function updateUnit(e,dt){
  const u=UNITS[e.kind];e.boost=1;e.anim+=Math.abs(e.vx)*dt*(e.kind==='golem'?.12:.16);if(e.flash>0)e.flash-=dt;if(e.atk>0)e.atk-=dt;if(e.swing>0)e.swing-=dt;
  if(e.y>WH*T){e.dead=true;return}
  trackProgress(e,dt);updatePillar(e);
  // emmurée (bloc posé sur elle) : on la remonte jusqu'à la première place libre
  if(rectSolid(e.x,e.y,e.w,e.h)){for(let k=1;k<=3*T;k++)if(!rectSolid(e.x,e.y-k,e.w,e.h)){e.y-=k;e.vy=0;break}}
  // unité perdue dans les grottes depuis trop longtemps : elle déserte (libère le combat et les perfs)
  if(e.stuck>=3)e.lostT=(e.lostT||0)+dt;else e.lostT=Math.max(0,(e.lostT||0)-dt*2);
  if(e.lostT>45&&e.kind!=='champion'&&(e.y+e.h)/T>surf[clamp(Math.floor((e.x+e.w/2)/T),0,WW-1)]+4){e.dead=true;burst(e.x+e.w/2,e.y+e.h/2,'#c9c0d8',8,50,200,.6);return}
  // le champion mine et rôde, sauf quand il mène une vague (war) : il marche alors avec l'armée et galvanise ses voisins (+20 % de dégâts)
  if(e.kind==='miner'||e.kind==='champion'&&!e.war)return updateGatherer(e,u,dt);
  if(e.war&&time>(e.auraT||0)){e.auraT=time+.3;for(const o of tgtNear(e.x,80))if(o.type==='unit'&&o.team===e.team&&o!==e)o.aura=time+.8}
  const b=bases[e.team],home=b.core;
  // soin près de son cœur hors combat (4 s sans coup), sinon les défenseurs deviennent invulnérables pendant un siège
  if(Math.abs(e.x-home.x)<130){if(time-(e.hitT||0)>4)e.hp=Math.min(e.maxhp,e.hp+dt*4)}
  // hors combat depuis 8 s : on récupère lentement où qu'on soit (sinon les blessés traversent toute la carte en boucle)
  else if(time-(e.hitT||0)>8)e.hp=Math.min(e.maxhp,e.hp+dt*2.5);
  // blessé : il recule ~18 cases vers chez lui pour souffler (pas jusqu'au cœur, sinon il traverse toute la carte et l'assaut le perd)
  if(e.hp<e.maxhp*.28&&!e.retreat&&e.kind!=='golem'){e.retreat=true;e.retX=retreatSpot(e,home)}
  if(e.retreat){if(e.hp>e.maxhp*.85){e.retreat=false;e.retX=null}else{const near=nearestHostile(e,26);if(near&&e.atk<=0)meleeOrShoot(e,u,near);if(e.retX==null)e.retX=retreatSpot(e,home);
    // encore talonné à son point de repli : on recule d'un cran
    if(near&&Math.abs(e.retX-(e.x+e.w/2))<=8)e.retX=retreatSpot(e,home);
    if(time-(e.hitT||0)>4)e.hp=Math.min(e.maxhp,e.hp+dt*1.5);
    const hx=e.retX;if(Math.abs(hx-(e.x+e.w/2))>8)navigate(e,hx,dt,'auto');else{e.vx=0;moveEnt(e,dt)}return}}
  // l'archer recule si un combattant au corps à corps est trop près
  if(u.ranged){const th=nearestHostile(e,34);if(th&&th.kind!=='archer'&&th.type!=='core'&&e.atk>.3){e.dir=Math.sign(th.x-e.x)||e.dir;e.vx=-e.dir*uspd(e)*.9;moveEnt(e,dt);e.dir=Math.sign(th.x-e.x)||e.dir;return}}
  // guérisseur : soigne le plus blessé à portée et s'écarte de la mêlée
  if(u.heal){healStep(e,u);const th=nearestHostile(e,36);if(th&&th.type!=='core'){e.dir=Math.sign(th.x-e.x)||e.dir;e.vx=-e.dir*uspd(e)*.9;moveEnt(e,dt);e.dir=-e.dir;return}}
  // raid : chasser les mineurs adverses
  if(e.raid){const prey=ents.filter(o=>o.type==='unit'&&o.team!==e.team&&o.kind==='miner'&&!o.dead).sort((a,c)=>Math.abs(a.x-e.x)-Math.abs(c.x-e.x))[0];
    if(prey){const dx=prey.x-e.x,dy=prey.y-e.y;if(Math.abs(dx)<u.range+8&&Math.abs(dy)<30){meleeOrShoot(e,u,prey);moveEnt(e,dt);return}
      if(Math.abs(dx)<T*1.5&&dy>T*2){e.vx=0;moveEnt(e,dt);if(e.onGround){const o0=Math.floor(e.x/T),fy=Math.floor((e.y+e.h-.01)/T);digStep(e,o0,fy+1,dt,false)}return}
      if(Math.abs(dx)<T*1.5&&dy<-T*2)return climbUp(e,dt,prey.x+prey.w/2);
      navigate(e,prey.x+prey.w/2,dt,e.stuck>=2?'climb':'auto');return}
    e.raid=false}
  if(e.strike){const ec=bases[1-e.team].core;const near=pickTarget(e,u,u.ranged?90:34);const tg=Math.abs(ec.x-e.x)<110?ec:near;if(tg)return engage(e,u,tg,dt);
    const dtx2=clamp(Math.floor((ec.x+11)/T),0,WW-1);if(Math.abs(ec.x+11-(e.x+e.w/2))<T*1.5&&(e.y+e.h)/T>surf[dtx2]+1.5)return climbUp(e,dt,ec.x+11);navigate(e,ec.x+11,dt,e.stuck>=2?'climb':'auto');return}
  const follow=b.order==='follow'&&e.team===0&&!player.dead,hold=b.order==='hold'&&b.holdX!=null,fw=e.team===0?1:-1;
  const tgt=u.heal?null:pickTarget(e,u,u.ranged?160:(b.order==='attack'?100:follow?110:150));
  if(tgt)return engage(e,u,tgt,dt);
  // escorte distancée : elle sprinte pour rattraper le joueur (il court 2× plus vite qu'une unité)
  e.boost=follow?clamp(1+(Math.abs(player.x-e.x)/T-6)/10,1,2.2):1;
  // en défense, on court intercepter tout intrus qui approche du cœur
  if(e.hunt){if(e.hunt.dead||!e.hunt.raid||b.order!=='defend'||Math.abs(e.x-home.x)>95*T)e.hunt=null;else return engage(e,u,e.hunt,dt)}
  const intr=intruder[e.team];if(b.order==='defend'&&!u.heal&&intr&&!intr.dead&&!(intr===e.ignore&&time<e.ignoreT))return engage(e,u,intr,dt);
  // formation : tireurs et soigneurs un rang derrière, golems en avant ; ordre Tenir = ligne autour du fanion
  const rank=(u.ranged||u.heal?-1:u.big?.7:0)*fw;
  let dest=follow?player.x+player.w/2-player.dir*20+e.offs*36:hold?b.holdX+e.offs*22+rank*26:b.order==='defend'?rallyX(e.team)+e.offs*24+rank*24:bases[1-e.team].core.x+11+e.offs*6;
  // guérisseur en assaut : deux pas derrière la première ligne ; plus de ligne, il rentre
  if(u.heal&&b.order==='attack'&&!follow)dest=armyRef[e.team]!=null?armyRef[e.team]-fw*26:rallyX(e.team);
  if(follow){if(Math.abs(dest-(e.x+e.w/2))<10){e.vx=0;moveEnt(e,dt);return}if(player.y<e.y-3*T&&Math.abs(dest-(e.x+e.w/2))<T*2)return climbUp(e,dt,dest)}
  const dtx=clamp(Math.floor(dest/T),0,WW-1);
  if(Math.abs(dest-(e.x+e.w/2))<T*1.5&&(e.y+e.h)/T>surf[dtx]+1.5)return climbUp(e,dt,dest);
  // armée en marche tombée dans une grotte : elle remonte vers la surface au lieu de traverser la carte sous terre
  // (sinon les deux armées se croisent à 50 blocs d'écart sans jamais se battre et chacune rase un cœur sans défense)
  if(b.order==='attack'&&!follow){const col=clamp(Math.floor((e.x+e.w/2)/T),0,WW-1),fwd=e.team===0?1:-1;
    if((e.y+e.h)/T>surf[col]+6&&Math.abs(bases[1-e.team].core.x-e.x)>30*T)return climbUp(e,dt,e.x+e.w/2+fwd*T*1.5)}
  if(b.order==='attack'&&!follow&&armyMid[e.team]!=null){const fwd=e.team===0?1:-1,ahead=(e.x-armyMid[e.team])*fwd,toCore=Math.abs(bases[1-e.team].core.x-e.x);
    // on attend l'arrière-garde 12 s au plus, puis on repart sans se ré-arrêter avant 25 s (sinon l'armée piétine indéfiniment)
    // les tireurs ne dépassent pas la première ligne de mêlée
    const lead=u.ranged&&armyFront[e.team]!=null&&(e.x-armyFront[e.team])*fwd>-14;
    if((ahead>7*T||lead)&&toCore>28*T&&time>(e.waitCool||0)){e.waitT=(e.waitT||0)+dt;if(e.waitT<12){e.vx=0;e.dir=fwd;moveEnt(e,dt);e.wantMove=false;return}e.waitCool=time+25}
    e.waitT=0}
  if(navigate(e,dest,dt,e.stuck>=2?'climb':'auto')){e.wantMove=false;
    // arrivée au pied du cœur adverse mais en contrebas (fosse creusée dessous) : on remonte en pilier
    const ec=bases[1-e.team].core;if(!follow&&b.order==='attack'&&e.y>ec.y+ec.h-4&&Math.abs(ec.x+11-(e.x+e.w/2))<3*T)climbUp(e,dt,dest)}}
const ORE_VAL={[COAL]:2,[COPPER]:3,[IRON]:5,[SILVER]:7,[GOLD]:10,[DIAMOND]:14};
// minerai inaccessible par le haut : une tuile indestructible (sol du château, socle) bouche la colonne
function sealedFromAbove(x,y){for(let yy=Math.max(0,surf[x]-1);yy<y;yy++)if(TD[getT(x,yy)].hard===Infinity)return true;return false}
function findOre(e,far){const b=bases[e.team],home=Math.floor((b.core.x+11)/T),dir=e.team===0?1:-1,champ=e.kind==='champion';let best=null,bs=-1;
  // le champion vide d'abord le filon où il se trouve (balayage local) au lieu de traverser la carte à chaque cible perdue
  if(champ){const ex=Math.floor((e.x+e.w/2)/T),ey=Math.floor((e.y+e.h/2)/T);
    for(let y=Math.max(1,ey-14);y<=Math.min(WH-4,ey+14);y++)for(let x=Math.max(2,ex-22);x<=Math.min(WW-3,ex+22);x++){const v=ORE_VAL[getT(x,y)];if(!v)continue;
      if(y<surf[x]||sealedFromAbove(x,y)||e.bad?.has(x+','+y))continue;const sc=v/(Math.abs(x-ex)+Math.abs(y-ey)*1.3+4);if(sc>bs){bs=sc;best={tx:x,ty:y}}}
    if(best)return best}
  // suivre le filon : un minerai à portée de pioche (rayon 4 blocs) passe avant tout, il ne coûte presque aucun creusage
  if(!far&&!champ){const ex=Math.floor((e.x+e.w/2)/T),ey=Math.floor((e.y+e.h/2)/T);for(let y=ey-3;y<=ey+4;y++)for(let x=ex-4;x<=ex+4;x++){const t=getT(x,y),v=ORE_VAL[t];if(!v||TD[t].tier>2||y<surf[x]||e.bad?.has(x+','+y))continue;
    const sc=v/(Math.abs(x-ex)+Math.abs(y-ey)*1.3+2);if(sc>bs){bs=sc;best={tx:x,ty:y}}}if(best)return best}
  for(let i=0;i<700;i++){const x=clamp(home+dir*RI(5,champ||far?150:70),2,WW-3),y=RI(surf[x]+1,Math.min(WH-4,surf[x]+(champ||far?34:20)));const t=getT(x,y),v=ORE_VAL[t];if(!v)continue;
    if(!champ&&TD[t].tier>2)continue;if(sealedFromAbove(x,y)||e.bad?.has(x+','+y))continue;
    // coût depuis la position du mineur : un minerai à pic sous lui demande un long escalier (on descend d'un bloc par bloc de côté)
    const mx=Math.floor((e.x+e.w/2)/T),my=Math.floor((e.y+e.h-1)/T),steep=Math.max(0,(y-my)-Math.abs(x-mx));
    const d=Math.abs(x-home)*(champ?.35:1)*.6+Math.abs(x-mx)*.4+Math.abs(y-surf[clamp(x,0,WW-1)])*1.6+steep*3;const sc=v/(d+12);if(sc>bs){bs=sc;best={tx:x,ty:y}}}
  return best}
// descendre d'une marche : creuser la colonne devant (hauteur du corps + une case dessous), avancer, tomber d'un bloc
function stairDown(e,dt,dir){e.dir=dir;e.wantMove=true;e.vx=dir*uspd(e)*.8;moveEnt(e,dt);if(!e.onGround)return 1;
  // colonne VOISINE de celles qu'occupe le corps (sinon on creuserait sous ses propres pieds)
  const ax=dir>0?Math.floor((e.x+e.w-.01)/T)+1:Math.floor(e.x/T)-1,y0=Math.floor(e.y/T),y1=Math.floor((e.y+e.h-.01)/T);
  for(let y=y0;y<=y1+1;y++){const r=digStep(e,ax,y,dt,true);if(r<=0)return r}return 1}
function updateGatherer(e,u,dt){
  const b=bases[e.team],core=b.core,cap=e.kind==='champion'?12:6;
  // le champion chasse ce qui s'approche, le mineur se défend au contact
  if(e.kind==='champion'){if(Math.abs(e.x-core.x)<130)e.hp=Math.min(e.maxhp,e.hp+dt*8);
    if(e.hp<e.maxhp*.25&&e.state!=='heal'){e.state='heal';if(onScreen(e)||Math.abs(player.x-e.x)<400)toast('Le champion rouge bat en retraite pour se soigner !',2.5,'#ffd27a')}
    if(e.state==='heal'){if(e.hp>e.maxhp*.9){e.state='seek'}else{const hx=core.x+11-24;if(Math.abs(hx-(e.x+e.w/2))<T*1.5&&e.y>core.y+40)climbUp(e,dt,hx);else navigate(e,hx,dt,'climb');return}}}
  const thr=e.kind==='champion'?pickTarget(e,u,e.state==='home'?60:120):nearestHostile(e,18);
  // mineur menacé par un combattant : il lâche le filon et file se mettre à l'abri sous la tour, puis attend que ça se calme
  if(e.kind==='miner'){const foe=nearestHostile(e,7*T);if(foe&&(foe.type==='monster'||foe.kind!=='miner')&&(foe.raid||foe.type==='monster'||e.hp<e.maxhp*.7)){if(time>(e.fleeT||0)&&e.team===0&&onScreen(e))floatText(e.x+e.w/2,e.y-6,'!','#ff9a8a');e.fleeT=time+6;e.state='home';e.tgt=null}}
  const fleeing=e.kind==='miner'&&time<(e.fleeT||0);
  if(thr&&!fleeing){if(e.kind==='champion')return engage(e,u,thr,dt);if(e.atk<=0)meleeOrShoot(e,u,thr)}
  if(e.state==='seek'&&fleeing){const hx=core.x+11+(e.team===0?16:-16);if(Math.abs(hx-(e.x+e.w/2))>10)navigate(e,hx,dt,'climb');else{e.vx=0;moveEnt(e,dt)}return}
  if(e.state==='seek'){
    // cible bloquée ou poursuivie plus de 20 s : on la met de côté pour ne pas y revenir en boucle
    if(e.tgt&&(e.stuck>=3||time-(e.tgtT||0)>20)){(e.bad=e.bad||new Set()).add(e.tgt.tx+','+e.tgt.ty);if(e.bad.size>40)e.bad=new Set();e.tgt=null}
    if(!e.tgt||!ORE_VAL[getT(e.tgt.tx,e.tgt.ty)]){e.tgt=findOre(e)||findOre(e,true);e.stuck=0;if(!e.tgt){e.state='home';return}
      // le chrono suit la tuile visée : reprendre la même cible ne le remet pas à zéro
      const key=e.tgt.tx+','+e.tgt.ty;if(key!==e.tgtKey){e.tgtKey=key;e.tgtT=time}}
    const{tx,ty}=e.tgt,cx=e.x+e.w/2,cy=e.y+e.h/2,ex=Math.floor(cx/T),fy=Math.floor((e.y+e.h-1)/T);
    if(Math.abs(tx-ex)<=1&&ty<fy-1&&Math.hypot(tx*T+8-cx,ty*T+8-cy)>=T*2.2)return climbUp(e,dt,tx*T+8);
    if(Math.hypot(tx*T+8-cx,ty*T+8-cy)<T*2.2){e.vx=0;moveEnt(e,dt);e.dir=tx*T+8>cx?1:-1;const r=digStep(e,tx,ty,dt,true);if(r!==0)e.tgt=null;if(e.carryN>=cap||(e.junk||0)>=40)e.state='home';return}
    // minerai plus bas : descendre en escalier (une marche par bloc), jamais un puits vertical sous ses pieds.
    // Trop à pic : on s'écarte d'abord pour avoir autant de recul horizontal que de profondeur.
    const h=Math.abs(tx-ex),v=ty-fy;
    if(v>=1&&h<=v+1){const key=tx*4096+ty;if(e.stairT!==e.tgt&&h>=Math.max(1,v-1)){e.stairT=e.tgt;e.stairD=Math.sign(tx-ex)}
      // arrivé à l'aplomb du minerai sans l'atteindre (pente naturelle plus douce que l'escalier) : on note l'échec pour ne pas repartir en boucle
      if(e.stairT===e.tgt&&Math.sign(tx-ex)!==e.stairD){e.stairT=null;e.stairFail=key}
      if(e.stairT===e.tgt){if(stairDown(e,dt,e.stairD)<0){(e.bad=e.bad||new Set()).add(e.tgtKey);e.tgt=null}}
      // escalier raté : lacet, on redescend en s'éloignant jusqu'à avoir le recul, puis l'escalier repart vers le minerai
      else if(e.stairFail===key&&v>3){if(stairDown(e,dt,Math.sign(ex-tx)||-e.stairD)<0)e.tgt=null}
      // presque dessus et peu profond : un seul bloc à creuser sous soi
      else if(v<=3&&h<=1){e.vx=(tx*T+8-cx)*3;moveEnt(e,dt);e.wantMove=true;if(e.onGround){const o0=Math.floor(e.x/T),o1=Math.floor((e.x+e.w-.01)/T);for(let x=o0;x<=o1;x++){const r=digStep(e,x,fy+1,dt,true);if(r<0){e.tgt=null;break}if(r===0)break}}}
      else{const side=Math.sign(ex-tx)||(e.offs<0?-1:1);navigate(e,(tx+side*(v+1))*T+8,dt,'flat')}
      if(e.carryN>=cap||(e.junk||0)>=40)e.state='home';return}
    navigate(e,tx*T+8,dt,ty<fy-1||e.stuck>=2?'climb':'flat');if(e.carryN>=cap||(e.junk||0)>=40)e.state='home';return}
  const hx=core.x+11+(e.team===0?16:-16);if(Math.abs(hx-(e.x+e.w/2))<T*1.5&&e.y>core.y+40)climbUp(e,dt,hx);else navigate(e,hx,dt,'climb');
  if(Math.abs(e.x+e.w/2-hx)<22&&Math.abs(e.y-core.y)<60){for(const k in e.carry)if(b.storage[k]!==undefined)b.storage[k]+=e.carry[k];
    if(e.team===0){const parts2=Object.entries(e.carry).filter(([,v])=>v>0).map(([k,v])=>v+' '+tr(IT[k].n).toLowerCase());if(parts2.length){toast('Un mineur rapporte : '+parts2.join(', '),3,'#9fd0ff');floatText(core.x+11,core.y-4,'+'+(e.carryN+(e.junk||0)),'#9fd0ff');if(onScreen(e))sfx.pick()}}
    e.carry={};e.carryN=0;e.junk=0;e.state='seek';e.tgt=null}}

// =====================================================================
//  MONSTRES DE LA NUIT
// =====================================================================
function daylight(){const ph=(time%dayLen)/dayLen;return clamp(.5+.85*Math.sin(ph*Math.PI*2-.3),0,1)}
function spawnMonsters(dt){const night=daylight()<.25,bm=isBlood()?2:1;const n=ents.filter(e=>e.type==='monster').length;
  if(night&&n<DF().mon*bm&&rnd()<dt*.5*bm*bm){const x=RI(70,WW-70);if(Math.abs(x*T-player.x)<VW*.6)return;const s=surf[x];if(s<2)return;
    const zom=rnd()<.4;ents.push({type:'monster',kind:zom?'zombie':'slime',team:2,x:x*T,y:(s-2)*T,w:zom?8:12,h:zom?20:10,vx:0,vy:0,hp:zom?55:35,maxhp:zom?55:35,dir:1,onGround:false,atk:0,flash:0,anim:0,hop:R(0,1),blue:rnd()<.3,stepOff:0})}}
// ---------- ogre de sang : boss de la lune de sang ----------
// Il naît au pied de la montagne (une bonne minute de marche), avance vers ton cœur en brisant ce qui le bloque et frappe en zone. Abattu par les bleus : diamants, or et une relique.
// S'il tient jusqu'à l'aube, il s'évapore sans rien laisser.
function spawnOgre(){if(ents.some(e=>e.kind==='ogre'&&!e.dead))return;const x=clamp(Math.floor(WW*R(.27,.36)),40,WW-60),n=stats.ogres=(stats.ogres||0)+1,hp=Math.round((520+diff*150)*(1+.35*(n-1)));
  ents.push({type:'monster',kind:'ogre',boss:true,team:2,x:x*T,y:surf[x]*T-41,w:16,h:40,vx:0,vy:0,hp,maxhp:hp,dir:-1,onGround:false,atk:0,flash:0,anim:0,stepOff:0,digT:0});
  toast('Un ogre de sang marche sur ta base ! Abats-le avant l\'aube pour son trésor.',6,'#ff5a5a')}
function updateOgre(e,dt){
  if(daylight()>.5){e.dead=true;burst(e.x+e.w/2,e.y+e.h/2,'#ffb43a',26,70,-80,1.2,2);toast('L\'ogre de sang s\'évapore à l\'aube.',3,'#9fd0ff');return}
  // cible à sa hauteur seulement : il ne s'arrête pas au-dessus d'un mineur enfoui
  const cx=e.x+e.w/2;let tgt=null,bd=110;for(const o of tgtNear(e.x,110)){if(o.dead||!o.hp||o.team===2)continue;if(Math.abs(o.y+o.h-(e.y+e.h))>30)continue;const d=Math.abs(o.x+o.w/2-cx);if(d<bd){bd=d;tgt=o}}
  const goal=tgt?tgt.x+tgt.w/2:bases[0].core.x+11,gap=tgt?bd-tgt.w/2-e.w/2:1e9;e.dir=Math.sign(goal-cx)||e.dir;
  e.pose=gap<8&&e.atk<.4?'wind':null; // il arme sa massue juste avant de frapper
  if(gap<8){e.vx=0;
    // coup de massue : tout ce qui se tient devant lui encaisse
    if(e.atk<=0){e.atk=1.5;const dm=26+diff*4;for(const o of tgtNear(e.x,60)){if(o.dead||!o.hp||o.team===2)continue;const ox=o.x+o.w/2-cx;if(ox*e.dir>-6&&Math.abs(ox)<o.w/2+e.w/2+16&&Math.abs(o.y+o.h-(e.y+e.h))<34)hurt(o,o.type==='core'?dm*.5:dm,e)}
      if(onScreen(e)){shake=Math.max(shake,PROF.set.shake?4:0);burst(cx+e.dir*14,e.y+e.h,'#c9b8a0',10,70,200,.5)}}}
  else e.vx=e.dir*(e.atk>.9?0:30);
  moveEnt(e,dt);e.anim+=Math.abs(e.vx)*dt*.1;
  // mur de 2 blocs ou plus : il le fracasse (sous terre, il remonte en escalier) ; indestructible : il saute
  if(e.blocked&&e.onGround){e.digT+=dt;if(e.digT>.45){e.digT=0;const ax=Math.floor((e.dir>0?e.x+e.w+1:e.x-1)/T),y0=Math.floor(e.y/T),y1=Math.floor((e.y+e.h-.01)/T),o0=Math.floor(e.x/T),o1=Math.floor((e.x+e.w-.01)/T);
      const up=y1>surf[clamp(ax,0,WW-1)]+2,list=[];if(up){for(let y=y0-1;y<y1;y++)list.push([ax,y]);for(let x=o0;x<=o1;x++)list.push([x,y0-1])}else for(let y=y0;y<=y1;y++)list.push([ax,y]);
      let hit=false;for(const[x,y]of list){const id=getT(x,y);if(id!==AIR&&id!==WATER&&(TD[id].solid||id===LOG)&&TD[id].hard!==Infinity){breakTile(x,y,null);hit=true}}
      if(up||!hit)e.vy=-JUMP*.9;if(hit&&onScreen(e)){shake=Math.max(shake,PROF.set.shake?2:0);sfx.brk()}}}
  if(e.y>WH*T)e.dead=true}
function updateMonster(e,dt){if(e.flash>0)e.flash-=dt;if(e.atk>0)e.atk-=dt;e.anim+=dt;
  if(e.kind==='ogre')return updateOgre(e,dt);
  if(daylight()>.55&&rnd()<dt*.25){e.dead=true;burst(e.x+e.w/2,e.y+e.h/2,'#ffb43a',10,40,-80,.8);return}
  const tgt=nearestHostile(e,170);
  if(e.kind==='slime'){e.hop-=dt;if(e.onGround){e.vx*=Math.pow(.01,dt);if(e.hop<=0){e.hop=R(.8,1.8);const d=tgt?Math.sign(tgt.x-e.x):(rnd()<.5?-1:1);e.dir=d;e.vy=-R(180,260);e.vx=d*R(50,90)}}moveEnt(e,dt,false)}
  else{const tx=tgt?tgt.x:e.x+e.dir*40;e.vx=Math.sign(tx-e.x)*30;e.dir=Math.sign(e.vx)||e.dir;moveEnt(e,dt);if(e.blocked&&e.onGround)e.vy=-JUMP*.9;e.anim+=Math.abs(e.vx)*dt*.1}
  if(tgt&&e.atk<=0){const ov=tgt.x<e.x+e.w+2&&tgt.x+tgt.w>e.x-2&&tgt.y<e.y+e.h&&tgt.y+tgt.h>e.y;if(ov){e.atk=1;hurt(tgt,e.kind==='zombie'?10:7,e)}}
  if(e.y>WH*T)e.dead=true}

// =====================================================================
//  IA ADVERSE : commandant stratégique + champion qui mine et combat
// =====================================================================
function newAI(){const styles=['eco','rush','equilibre'];const style=styles[RI(0,2)];
  return{t:3,style,wave:Math.max(3,DF().wave-(style==='rush'?2:0)),sent:0,champ:null,champT:8,lastWave:0,vet:0,acc:0}}
function teamPow(team,nearX,radius){let p=0;for(const e of ents){if(e.dead||e.team!==team)continue;if(nearX!==undefined&&Math.abs(e.x-nearX)>radius)continue;
  if(e.type==='unit')p+=POW[e.kind]*e.hp/e.maxhp;else if(e.type==='player'&&!e.dead)p+=2.5}return p}
function updateAI(dt){
  const b=bases[1],st=b.storage,D=DF(),inc=D.inc,iq=D.iq;
  if(!ai.champ||ai.champ.dead){ai.champT-=dt;if(ai.champT<=0){ai.champ=recruit(1,'champion',true);ai.champ.hp=ai.champ.maxhp=Math.round(D.champ*(1+vet(1)));ai.champT=50;if(time>20)toast('Le champion rouge reprend les armes.',3,'#ff9a8a')}}
  // dernier carré : la première fois que le cœur rouge passe sous 40 %, sa garde d'élite sort du château (la fin de partie n'est jamais une formalité)
  if(!surv&&!ai.stand&&b.core.hp>0&&b.core.hp<b.core.maxhp*.4){ai.stand=true;for(let i=0;i<1+diff;i++)recruit(1,i%3===2?'archer':'warrior',true);if(iq>=3)recruit(1,'golem',true);
    toast('Le cœur rouge vacille : sa garde d\'élite sort du château !',5,'#ff6a5a');sfx.horn();buzz(120)}
  // le commandant réfléchit plus vite quand la difficulté monte ; le revenu est ramené à la seconde pour ne pas en dépendre
  ai.t-=dt;if(ai.t>0)return;ai.t=D.think;
  // petit revenu passif (le gros vient des mineurs et du champion)
  const m=inc*(.6+time/900)*(daily&&daily.mod.id==='fury'?1.4:1)*(surv?1+stats.waves*.2:1)*D.think/2;
  ai.acc=(ai.acc||0)+1.4*m;{const n=Math.floor(ai.acc);ai.acc-=n;st.wood+=n;st.stone+=n}if(rnd()<.3*m)st.copper++;if(rnd()<.25*m)st.coal++;if(rnd()<.18*m)st.iron++;if(rnd()<.08*m)st.silver++;if(rnd()<.05*m)st.gold++;
  const mine=ents.filter(e=>e.type==='unit'&&e.team===1&&!e.dead),cnt=k=>mine.filter(e=>e.kind===k).length;
  const fighters=mine.filter(isFighter);
  const coreX=b.core.x,pc=bases[0].core.x,threatPow=teamPow(0,coreX,70*T),myPow=teamPow(1,coreX,70*T);
  const foe=ents.filter(e=>e.type==='unit'&&e.team===0&&!e.dead),fk=k=>foe.filter(e=>e.kind===k).length;
  const holdMax=iq?90:140; // Paisible : le rouge hésite plus longtemps devant une défense solide
  // fin de vague : le champion retourne à la mine, les commandos rentrent dans le rang
  const endWave=()=>{if(ai.champ){ai.champ.war=false;ai.champ.retreat=false}for(const e of fighters)if(e.cmd)e.cmd=e.strike=false};
  // renseignement pour le HUD : où en est la prochaine vague rouge
  {const minT=firstWave(),n=fighters.length,I=ai.intel||(ai.intel={rate:.05,prev:n});
   I.rate=I.rate*.85+Math.max(0,(n-I.prev)/D.think)*.15;I.prev=n;I.have=Math.min(n,ai.wave);I.need=ai.wave;
   if(b.order==='attack'){const atk=fighters.filter(e=>!e.raid&&!e.retreat);I.phase='march';I.eta=0;I.alive=atk.length;I.sent=ai.sent;
     I.front=atk.length?Math.round(Math.min(...atk.map(e=>Math.abs(e.x-pc)))/T):0}
   else{I.phase=threatPow>0.5&&threatPow>myPow*.7?'defend':'gather';
     I.eta=Math.round(Math.max(minT-time,surv?0:(ai.restT||0)-time,(ai.wave-n)/Math.max(I.rate,.02),0));if(ai.wait)I.eta=Math.max(1,Math.round(holdMax-(time-ai.holdT)));
     if(I.eta<=25&&!I.warned&&I.phase==='gather'){I.warned=true;toast('L\'armée rouge se rassemble : attaque dans moins de 30 s !',4,'#ffb08a')}
     // la vague prévue écrase-t-elle ta défense ? on le dit à temps (une fois par vague) avec quoi faire
     const guard=teamPow(0,pc,45*T)+1.5+bases[0].upg.tower*.8,red=fighters.reduce((a,e)=>a+POW[e.kind],0)*Math.max(1,ai.wave/Math.max(1,n));I.danger=red>guard*1.3;
     if(I.danger&&I.eta<=75&&!I.dangerSaid&&I.phase==='gather'){I.dangerSaid=true;toast('La vague rouge ('+ai.wave+' unités) dépasse ta défense : recrute des troupes ou améliore la tour (Base).',5,'#ff9a8a')}}
   if(b.order==='attack'){I.warned=false;I.dangerSaid=false}}
  // composition de l'armée : au hasard en Paisible, en réponse à ce que tu alignes dès Normal, avec soigneurs et colosses dès Difficile
  const melee=fighters.filter(e=>!UNITS[e.kind].ranged&&!UNITS[e.kind].heal).length;
  const counter=()=>{if(iq<1)return rnd()<.65?'warrior':'archer';
    if(iq>=2){if(fighters.length>=5&&cnt('healer')<Math.floor(fighters.length/6)&&canPay(st,UNITS.healer.cost))return'healer';
      // tour bleue améliorée ou grosse armée : il faut des colosses pour encaisser
      if(cnt('golem')<Math.floor(fighters.length/8)+(bases[0].upg.tower>=2?1:0)&&canPay(st,UNITS.golem.cost))return'golem'}
    if(fk('golem')>=2)return'warrior';if(fk('warrior')>fk('archer')*1.5+1)return'archer';
    // beaucoup d'archers bleus : la mêlée ferme la distance
    if(fk('archer')>fk('warrior')+2&&melee<fighters.length*.7)return'warrior';
    if(rnd()<(ai.style==='rush'?.08:.18)&&st.gold>=2)return'golem';return rnd()<.6?'warrior':'archer'};
  const wantMiners=(ai.style==='eco'?4:ai.style==='rush'?2:3)+D.miners;
  // 1. défense : on rappelle tout le monde si la base est menacée
  // défense d'urgence : même plafond que le recrutement normal et 4 s entre deux recrues (sinon +30 unités par minute pendant un siège)
  if(threatPow>0.5&&threatPow>myPow*.7){if(b.order!=='defend'){b.order='defend';ai.sent=0;endWave()}
    if(fighters.length<survCap()&&time>=(ai.defT||0)&&(recruit(1,counter())||recruit(1,'warrior')))ai.defT=time+4;return}
  // 2. économie
  if(cnt('miner')<wantMiners&&recruit(1,'miner'))return;
  // 3. améliorations : quand la réserve déborde ; dès Difficile, choisies selon la situation (assaut : dégâts et vitesse, cœur entamé : cœur et tour)
  if(iq>=2){if(rnd()<.3){const pri=b.order==='attack'?['dmg','speed','core','tower']:b.core.hp<b.core.maxhp*.7?['core','tower','dmg','speed']:['dmg','tower','core','speed'];
      for(const id of pri){const u=UPG.find(u=>u.id===id),l=b.upg[id];if(l>=(id==='core'?D.coreUp:3))continue;const c=upgCost(u,l);if(canPay(st,c)&&st.stone>=(c.stone||0)+12){pay(st,c);b.upg[id]++;applyUpg(1,id);return}}}}
  else for(const u of UPG){const l=b.upg[u.id];if(l<(u.id==='core'?D.coreUp:3)&&rnd()<.2){const c=upgCost(u,l);if(canPay(st,c)&&(st.stone>c.stone*2||ai.style==='eco')){pay(st,c);b.upg[u.id]++;applyUpg(1,u.id);return}}}
  // 4. contre-attaque : l'armée du joueur est loin de sa base, son cœur est dégarni
  if(iq>=1){const home=teamPow(0,pc,45*T),away=foe.filter(e=>e.kind!=='miner'&&Math.abs(e.x-pc)>90*T).length;
   const reserve=fighters.filter(e=>canStrike(e)&&!e.raid&&!e.strike&&!e.retreat);
   if(away>=3&&home<1.2&&reserve.length>=3&&time-(ai.lastStrike||0)>150){const n=Math.min(reserve.length-1,D.strike);reserve.slice(0,n).forEach(e=>e.strike=true);ai.lastStrike=time;
     toast('Contre-attaque ! Des unités rouges foncent vers ton cœur dégarni.',4,'#ff6a5a');shake=Math.max(shake,3)}}
  // 5. raid : 2 unités (3 en Brutal) vont harceler les mineurs du joueur
  const foeMiners=fk('miner');
  if(iq>=1&&b.order==='defend'&&foeMiners>=2&&time-(ai.lastRaid||0)>(iq>=3?65:90)&&fighters.length>=3){const idle=fighters.filter(e=>canStrike(e)&&!UNITS[e.kind].big&&!e.raid&&!e.retreat).slice(0,iq>=3?3:2);idle.forEach(e=>e.raid=true);ai.lastRaid=time;if(idle.length)toast('Des pillards rouges traquent tes mineurs !',3,'#ff9a8a')}
  // 6. armée : on rassemble au point de ralliement puis on attaque en groupe (effectif plafonné : lisibilité et perfs)
  if(fighters.length<survCap()&&time>=(ai.recT||0)&&recruit(1,counter()))ai.recT=time+D.rec*(surv?.7:1);
  // opportunisme (Difficile+) : héros à terre ou parti loin de chez lui, la vague part tout de suite, même incomplète
  const opp=iq>=2&&!surv&&fighters.length>=5&&(player.dead||Math.abs(player.x-pc)>120*T);
  // avant de lancer la vague, on jauge la défense adverse (unités au cœur, joueur, tour) : trop forte, on grossit encore
  // l'armée, au plus 90 s ou jusqu'au plafond d'effectif, puis on attaque quand même pour ne jamais rester passif
  const ready=b.order==='defend'&&fighters.length>=ai.wave*(opp?.7:1)&&(surv?time-(ai.lastWave||0)>firstWave():time>firstWave()&&time>=(ai.restT||0));
  if(ready){const guard=teamPow(0,pc,45*T)+1.5+bases[0].upg.tower*.8,mine2=fighters.reduce((a,e)=>a+POW[e.kind]*e.hp/e.maxhp,0);
    ai.holdT=ai.holdT||time;const capped=fighters.length>=survCap();
    if(!opp&&mine2<guard*1.25&&!capped&&time-ai.holdT<holdMax){if(!ai.holdMsg){ai.holdMsg=true;toast('L\'armée rouge hésite devant ta défense et se renforce.',3,'#9fd0ff')}ai.wait=true}
    else ai.wait=false}
  else{ai.holdT=0;ai.holdMsg=false;ai.wait=false}
  if(ready&&!ai.wait){b.order='attack';ai.waveNo=(ai.waveNo||0)+1;for(const e of fighters)e.waveNo=ai.waveNo;ai.holdT=0;ai.holdMsg=false;ai.sent=fighters.length;ai.lastWave=time;ai.wave=Math.min(surv?44:D.wmax,ai.wave+D.grow);
    toast('L\'armée rouge marche sur ta base ('+fighters.length+' unités) !',4,'#ff9a8a');
    // Difficile+ : le champion quitte la mine et mène la vague
    if(iq>=2&&!surv&&ai.champ&&!ai.champ.dead&&ai.champ.hp>ai.champ.maxhp*.6&&(ai.waveNo>=2||iq>=3)){ai.champ.war=true;ai.champ.state='seek';ai.champ.tgt=null;toast('Le champion rouge mène l\'assaut : ses voisins frappent plus fort !',4,'#ff6a5a')}
    // Brutal+ : un commando de mêlée file droit sur ton cœur pendant que la ligne fixe tes défenseurs
    if(iq>=3)for(const e of fighters.filter(e=>canStrike(e)&&!UNITS[e.kind].ranged&&!UNITS[e.kind].big&&!e.raid).slice(0,Math.min(4,Math.floor(fighters.length*.2))))e.strike=e.cmd=true;
    // Cauchemar : chaque vague lancée aguerrit les recrues suivantes (+6 % de PV et de dégâts, jusqu'à +48 %)
    if(iq>=4)ai.vet=Math.min(.48,(ai.vet||0)+.06)}
  else if(b.order==='attack'){const atk=fighters.filter(e=>!e.retreat&&!e.raid),left=surv?(time-ai.lastWave>200?0:fighters.filter(e=>e.waveNo===ai.waveNo&&!e.retreat).length):atk.length;
    let back=left<=Math.max(1,Math.floor(ai.sent*(iq?.3:.45))),regroup=false;
    // Brutal+ : repli tactique. En nette infériorité loin de ton cœur, la vague rentre se regrouper au lieu de mourir au compte-gouttes
    if(!back&&iq>=3&&!surv&&atk.length){const fx=atk.reduce((a,e)=>Math.abs(e.x-pc)<Math.abs(a-pc)?e.x:a,atk[0].x);
      if(Math.abs(fx-pc)>35*T&&atk.reduce((a,e)=>a+POW[e.kind]*e.hp/e.maxhp,0)<teamPow(0,fx,30*T)*.45)back=regroup=true}
    if(back){b.order='defend';ai.restT=time+D.rest*(regroup?.5:1);endWave();
      if(surv){qAdd('wave');stats.waves++;if(stats.waves%5===0)findRelic();if(stats.waves>=10)unlock('siege10');toast('Vague '+stats.waves+' repoussée ! La suivante sera plus forte.',4,COL.gold);sfx.buy()}
      else toast(regroup?'L\'armée rouge se replie pour se regrouper.':'L\'ennemi bat en retraite.',3,'#9fd0ff')}}}
function applyUpg(team,id){const b=bases[team];if(id==='core'){b.core.maxhp+=300;b.core.hp+=300}}
function updateTowers(dt){for(const b of bases){if(b.core.dead)continue;const tw=b.tower;tw.cd-=dt;if(tw.cd>0)continue;const lv=b.upg.tower;
  const fake={x:tw.x,y:tw.y,w:0,h:0,team:b.team},rng=220+lv*18;let t=null,bd=rng;
  // priorité : ce qui tire de loin ou frappe déjà le cœur, puis le plus proche (les archers fondent sous la tour au lieu des colosses)
  let bs=-1;for(const o of ents){if(o.dead||!o.hp||o.type==='item'||o.team===b.team)continue;const d=Math.hypot(o.x+o.w/2-tw.x,o.y+o.h/2-tw.y);if(d>=rng)continue;
    const sc=(o.type==='unit'&&UNITS[o.kind].ranged?2:1)*(Math.abs(o.x+o.w/2-b.core.x-11)<3*T?1.6:1)*(o.kind==='golem'?.6:1)/(1+d/rng);if(sc>bs){bs=sc;bd=d;t=o}}
  if(!t){tw.cd=.3;continue}
  tw.cd=1.8/(1+.25*lv);const tx=t.x+t.w/2,ty=t.y+t.h/2,dx=tx-tw.x,v=300,tt=Math.abs(dx)/v;
  arrows.push({x:tw.x,y:tw.y,vx:Math.sign(dx)*v,vy:(ty-tw.y)/Math.max(tt,.1)-150*tt,team:b.team,dmg:(7+4*lv)*(b.team===0?1+relV('eye')/100:1),life:3,src:fake});}}
function updateArrows(dt){for(const a of arrows){a.vy+=300*dt;a.x+=a.vx*dt;a.y+=a.vy*dt;a.life-=dt;
  if(a.stuck)continue;
  if(a.lob&&!a.lob.dead&&a.x>a.lob.x-1&&a.x<a.lob.x+a.lob.w+1&&a.y>a.lob.y-1&&a.y<a.lob.y+a.lob.h+1){visualPuff(a.x,a.y,'#ffe8ad');hurt(a.lob,a.dmg,a.src);if(a.src)a.src.miss=0;a.life=0;continue}
  if(!a.lob&&solidAt(Math.floor(a.x/T),Math.floor(a.y/T))){visualPuff(a.x,a.y,'#a9bacb');a.stuck=true;a.life=Math.min(a.life,1.2);if(a.src&&a.src.type==='unit')a.src.miss=(a.src.miss||0)+1;continue}
  for(const e of ents){if(e.dead||!e.hp||e.type==='item'||e.team===a.team)continue;
    if(a.x>e.x-1&&a.x<e.x+e.w+1&&a.y>e.y-1&&a.y<e.y+e.h+1){visualPuff(a.x,a.y,'#ffe8ad');hurt(e,a.dmg,a.src);if(a.src)a.src.miss=0;a.life=0;break}}}
  arrows=arrows.filter(a=>a.life>0)}
// =====================================================================
//  BOUCLE DE MISE À JOUR
// =====================================================================
function endGame(win){musicJingle(win);const dur=time-stats.start;PROF.tot.mined+=stats.mined;PROF.tot.kills+=stats.kills;PROF.tot.recruited+=stats.recruited;endInfo={rec:false,dur};
  if(win){PROF.wins++;qAdd('win');unlock(DF().ach);if(dur<1200)unlock('speed');if((stats.coreHit||0)<bases[0].core.maxhp*.1)unlock('fort');if(daily){unlock('daily');PROF.daily.won=daily.key}
    const k=daily?'d'+daily.key:'k'+DF().id,prev=PROF.rec[k];endInfo.prev=prev;if(!prev||dur<prev){PROF.rec[k]=Math.round(dur);endInfo.rec=!!prev||true}}
  if(surv){const prev=PROF.rec.surv||0;endInfo.prev=prev;if(stats.waves>prev){PROF.rec.surv=stats.waves;endInfo.rec=true}}
  endInfo.coins=earnCoins(win,dur);PROF.coins+=endInfo.coins;
  endInfo.xp0=PROF.xp;endInfo.xp=earnXp(win,dur);const l0=lvlOf(PROF.xp).l;PROF.xp+=endInfo.xp;endInfo.lvBonus=0;endInfo.lvShown=l0;
  for(let l=l0+1;l<=lvlOf(PROF.xp).l;l++)endInfo.lvBonus+=lvlReward(l);PROF.coins+=endInfo.lvBonus;setTimeout(()=>sfx.coin(),900);
  saveProf()}
// effets d'interface et de monde qui vivent même en pause ou à l'écran titre
function updateFx(dt){if(state==='title')titleT+=dt;else titleT=0;if(fade>0)fade=Math.max(0,fade-dt*1.6);if(hurtFx>0)hurtFx=Math.max(0,hurtFx-dt*2.5);if(craftFx>0)craftFx-=dt;
  if(achPop[0]){achPop[0].t+=dt;if(achPop[0].t>=4)achPop.shift()}if(panelT<1)panelT=Math.min(1,panelT+dt*7);
  // victoire : lucioles qui montent lentement en ondulant (orbes façon Animal Well), pas de confettis
  for(const c of confetti){c.t+=dt;c.y+=c.vy*dt;c.x+=Math.sin(c.t*c.f+c.ph)*c.a*dt}confetti=confetti.filter(c=>c.y>-10&&c.t<c.life);
  if(state!==shownState){shownState=state;lastEndChange=performance.now();fade=.8;if(state==='win')for(let i=0;i<46;i++)confetti.push({x:R(0,VW),y:R(VH*.25,VH+40),vy:-R(6,16),t:-R(0,2.5),life:R(7,13),f:R(.6,1.4),ph:R(0,6.3),a:R(4,10),big:RI(0,3)===0,col:['#85ffe1','#35cbb1','#38ebff','#ffe066'][RI(0,3)]})}}
// lune de sang : la 2e nuit puis une nuit sur trois (toutes en défi « Nuits rouges »), monstres doublés et ogre de sang
const nightNo=()=>Math.floor(time/dayLen);
const isBlood=()=>daylight()<.25&&(daily&&daily.mod.id==='blood'||nightNo()%3===1);
function updateWorldFx(dt){
  for(let i=visualDebris.length-1;i>=0;i--){visualDebris[i].t+=dt;if(visualDebris[i].t>.65)visualDebris.splice(i,1)}
  for(const e of ents)if(!e.dead&&e.kind==='golem'){
    const beat=Math.floor(e.anim/2);
    if(e.onGround&&((e.visualGround===false)||(Math.abs(e.vx)>4&&e.visualBeat!==undefined&&e.visualBeat!==beat)))visualPuff(e.x+e.w/2,e.y+e.h,'#9b8aaa',6);
    e.visualGround=e.onGround;e.visualBeat=beat;
  }
  const bl=isBlood();if(bl&&bloodNight!==nightNo()){bloodNight=nightNo();weather.blood=true;toast('Lune de sang ! Les monstres sont deux fois plus nombreux cette nuit.',5,'#ff5a5a');sfx.horn();buzz(150);spawnOgre()}
  if(!bl&&weather.blood&&daylight()>.4){weather.blood=false;if(!player.dead){unlock('bloodmoon');toast('Tu as survécu à la lune de sang !',3,COL.gold)}}
  // météo : averses de temps en temps, orages avec éclairs
  const W=weather;W.t-=dt;if(W.t<=0){W.target=rnd()<.35?R(.4,1):0;W.t=R(35,90)}W.rain+=(W.target-W.rain)*Math.min(1,dt*.3);if(W.flash>0)W.flash-=dt*2.5;
  if(W.rain>.75&&rnd()<dt*.05){W.flash=1;setTimeout(()=>noise(1.2,.12,300),R(200,900))}
  if(W.rain>.05)for(let i=0;i<W.rain*dt*60;i++){const x=cam.x+R(0,VW),tx=Math.floor(x/T);if(tx<0||tx>=WW)continue;const y=surf[tx]*T;if(y>cam.y&&y<cam.y+VH)parts.push({x,y:y-1,vx:R(-20,20),vy:R(-40,-15),g:300,life:.25,max:.25,col:'#9cc4ff',size:1})}
  // braises des torches visibles
  if(rnd()<dt*12){const x=Math.floor((cam.x+R(0,VW))/T),y=Math.floor((cam.y+R(0,VH))/T);for(let k=0;k<6;k++){const X=x+RI(-6,6),Y=y+RI(-6,6);if(getT(X,Y)===TORCH){parts.push({x:X*T+8+R(-1,1),y:Y*T+6,vx:R(-6,6),vy:R(-30,-15),g:-10,life:R(.6,1.2),max:1.2,col:rnd()<.5?'#ffb653':'#fff3bb',size:1,glow:1});break}}}
  for(const c of corpses){c.t+=dt}corpses=corpses.filter(c=>c.t<.9);
  for(const q of pops)q.t-=dt;pops=pops.filter(q=>q.t>0);
  for(const e of ents)if(e.spawnT>0)e.spawnT-=dt}
function update(dt){
  updateFx(dt);music(dt);
  if(state==='title'){titleCam+=dt*30;time=dayLen*.22;return}
  if(state!=='play'||paused)return;
  if(hitStop>0){hitStop-=dt;return}
  time+=dt;updateWorldFx(dt);updateBombs(dt);
  saveT-=dt;if(saveT<=0){saveT=20;saveGame()}
  trickT-=dt;if(trickT<=0){trickT=3;bases[0].storage.wood++;if(rnd()<.5)bases[0].storage.stone++}
  checkTut();checkObjectives();updateObjTarget(dt);
  if(endT>0){endT-=dt;if(endT<=0){state=endState;return}}
  updatePlayer(dt);computeArmies();buildTargets();
  for(const e of ents){if(e.dead)continue;
    if(e.type==='unit')updateUnit(e,dt);else if(e.type==='monster')updateMonster(e,dt);
    else if(e.type==='item'){e.age+=dt;if(e.magnet){e.x+=e.vx*dt;e.y+=e.vy*dt;e.vx*=.9;e.vy*=.9}else{e.vx*=e.onGround?.8:1;moveEnt(e,dt,false)}if(e.age>240)e.dead=true}
    else if(e.type==='core'){e.anim+=dt;if(e.flash>0)e.flash-=dt;if(rnd()<dt*3)parts.push({x:e.x+R(4,18),y:e.y+R(4,26),vx:R(-5,5),vy:R(-20,-8),g:-5,life:1.4,max:1.4,col:e.team?'#ff9a8a':'#9fd0ff',size:1,glow:1})}}
  ents=ents.filter(e=>!e.dead||e.type==='player'||e.type==='core');
  wT+=dt;if(wT>.09){wT=0;waterStep()}
  updateTowers(dt);updateArrows(dt);updateAI(dt);spawnMonsters(dt);
  for(const p of parts){p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.leaf){p.vx=Math.sin(p.life*4)*20}p.life-=dt}parts=parts.filter(p=>p.life>0);if(parts.length>900)parts.splice(0,parts.length-900);
  for(const f of floats){f.t-=dt;f.y-=dt*18}floats=floats.filter(f=>f.t>0);
  for(const m of msgs)m.t-=dt;msgs=msgs.filter(m=>m.t>0);
  // lucioles la nuit, braises des torches
  if(daylight()<.3&&rnd()<dt*9){const x=cam.x+R(0,VW),tx=Math.floor(x/T);if(tx>0&&tx<WW){const y=(surf[tx]-R(1,5))*T;parts.push({x,y,vx:R(-8,8),vy:R(-6,6),g:0,life:R(2,4),max:4,col:'#d8ff7a',size:1,glow:1,fly:1})}}
  // caméra
  const p=player,tx=p.x+p.w/2-VW/2+p.dir*20,ty=p.y+p.h/2-VH*camFY()-10;cam.x=lerp(cam.x,tx,1-Math.pow(.002,dt));cam.y=lerp(cam.y,ty,1-Math.pow(.002,dt));
  cam.x=clamp(cam.x,0,WW*T-VW);cam.y=clamp(cam.y,-40,WH*T-VH);
  if(shake>0)shake=Math.max(0,shake-dt*20);
  if(lightDirty&&performance.now()-lastLight>120){computeLight();lastLight=performance.now()}
}

// =====================================================================
//  RENDU
// =====================================================================
// <calques> généré par tools/gen-calques.py, ne pas modifier à la main
const CALQUES=['data:image/png;base64,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',
'data:image/png;base64,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',
'data:image/png;base64,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',
'data:image/png;base64,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'];
// </calques>
let skyLayers=null;
const R0=(r,a,b)=>a+r()*(b-a);
function buildBackdrops(){skyLayers=[];
  for(let L=0;L<4;L++){const c=mk(1200,220),g=c.getContext('2d'),P=pen(g),rr=mulberry(410+L),col=['#0d1026','#111632','#151a3d','#132e3e'][L];
    for(let x=20;x<1200;x+=75+Math.floor(rr()*70)){const h=80+rr()*130,y=220-h,wd=14+L*3;
      P(x,y,wd,h,'#080b1b');P(x,y,1,h,col);P(x+wd-1,y,1,h,col);P(x+4,y,1,h,col);P(x+wd-5,y,1,h,col);
      P(x-5,y-5,wd+10,2,col);P(x-3,y-2,wd+6,2,col);P(x-4,211,wd+8,2,col);P(x-7,216,wd+14,2,col);
      for(let j=0;j<45;j++){const yy=j*3,xx=x+wd+11+Math.round(Math.sin(j*.2)*4);P(xx,yy,1,3,col);if(j%3===0){P(xx-4,yy,4,1,col);P(xx+1,yy+2,4,1,col)}}
      if(L>1)for(let f=-3;f<=3;f++)for(let j=0;j<35;j+=2){const xx=x+f*j*.6,yy=216-j+j*j*.009;P(xx,yy,1,2,col);P(xx-Math.abs(f)-2,yy-2,Math.abs(f)+2,1,col)}
    }skyLayers.push(c)}
  // nuages en pixels : boules empilées, bord clair en haut, ombre en bas (teintés au rendu)
  SPR.clouds=[];for(let i=0;i<6;i++){const rr=mulberry(77+i),W=60+i*10,c=mk(W,26),g=c.getContext('2d'),P=pen(g);const blobs=[];for(let k=0;k<5+i;k++)blobs.push([R0(rr,10,W-10),R0(rr,12,18),R0(rr,5,10)]);
    for(let y=0;y<26;y++)for(let x=0;x<W;x++){let inn=false,top=false;for(const[bx,by,r]of blobs){const d=(x-bx)**2+((y-by)*1.4)**2;if(d<r*r){inn=true;if(d>(r-2)*(r-2)&&y<by)top=true}}
      if(inn&&y<21)P(x,y,1,1,top?'#ffffff':y>16?'#9aa3c8':'#d5dbf2')}SPR.clouds.push(c)}
  SPR.stars=[];const rr=mulberry(5);for(let i=0;i<65;i++)SPR.stars.push([rr(),rr()*.7,rr()])}
// ciel : nuit indigo, jour bleu profond, aube et crépuscule rosés, lune de sang rouge
const sunAng=()=>(time%dayLen)/dayLen*Math.PI*2-.3;
function skyColors(){const b=daylight(),dusk=clamp(1-Math.abs(Math.sin(sunAng()))*2.5,0,1)*clamp(b*3,0,1);
  let top=mixc('#05050c','#142a5c',b),bot=mixc('#0a0f2a','#3a6ea6',b);top=mixc(rgb2hex(top),'#2a1a4a',dusk*.6);bot=mixc(rgb2hex(bot),'#d0607a',dusk*.75);
  if(weather.rain>0){top=mixc(rgb2hex(top),'#1a1d2c',weather.rain*.6);bot=mixc(rgb2hex(bot),'#2a3040',weather.rain*.6)}
  if(state==='play'&&isBlood()){top=mixc(rgb2hex(top),'#2a0508',.8);bot=mixc(rgb2hex(bot),'#6a1018',.8)}
  return[rgb2hex(top),rgb2hex(bot)]}
function disc(g,x,y,r,col,edge){for(let j=-r;j<=r;j++){const w=Math.floor(Math.sqrt(r*r-j*j));g.fillStyle=Math.abs(j)>r-2?edge:col;g.fillRect(Math.round(x-w),Math.round(y+j),w*2+1,1)}}

function rgb2hex(s){if(s[0]==='#')return s;const m=s.match(/\d+/g).map(Number);return'#'+m.map(v=>v.toString(16).padStart(2,'0')).join('')}
// Calques de décor en parallaxe (images Higgsfield pixelisées en 4 tons par tools/gen-calques.py) :
// ancrés sur le sol vu par le joueur (portrait comme paysage), du plus lointain au plus proche, teintés à chaque instant par le ciel (perspective atmosphérique), brume entre les plans.
const CQ=[],CQ_PAR=[.04,.09,.17,.28],CQ_VY=[.12,.2,.32,.45],CQ_FOOT=[-14,10,44,96],CQ_DEPTH=[.2,.4,.64,.86],CQ_K=[.6,.85,.75,.45],
  CQ_HUE=[[106,120,176],[86,100,158],[58,102,112],[36,72,62]];
function loadCalques(){if(typeof CALQUES==='undefined')return;CALQUES.forEach((src,i)=>{const im=new Image();im.onload=()=>{
  const W=im.width,H=im.height,c=mk(W,H),g=c.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(0,0,W,H).data,lv=new Uint8Array(W*H);
  for(let k=0;k<lv.length;k++)lv[k]=d[k*4+3]<128?0:clamp(Math.round(d[k*4]/60),1,4);
  const g2=c.getContext('2d');g2.clearRect(0,0,W,H);CQ[i]={W,H,lv,c,g:g2,img:g2.createImageData(W,H),key:'',t:-1}};im.src=src})}
const mixA=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
// couleurs des 4 tons d'un calque : plus il est loin, plus il se fond dans le bas du ciel
function calqueRamp(L){const[,bot]=skyColors(),day=daylight(),blood=state==='play'&&isBlood(),sky=hex(bot),
    ink=blood?[22,4,10]:[4,5,12],lite=blood?[255,120,110]:mixA([150,170,230],[255,236,200],day),
    base=mixA(mixA(sky,CQ_HUE[L],.3+.2*day),ink,CQ_DEPTH[L]*(1-.15*day)),k=CQ_K[L];
  return[mixA(base,ink,.45*k),base,mixA(base,lite,(.12+.1*day)*k),mixA(base,lite,(.28+.2*day)*k)]}
function tintCalque(C,L){const now=performance.now();if(now-C.t<120&&C.key)return;C.t=now;
  const ramp=calqueRamp(L),key=ramp.map(c=>c.map(v=>v|0).join()).join();if(key===C.key)return;C.key=key;C.dark=rgb(ramp[0]);
  const u=new Uint32Array(C.img.data.buffer),pal=[0,...ramp.map(c=>(0xff000000|((c[2]|0)<<16)|((c[1]|0)<<8)|(c[0]|0))>>>0)];
  for(let k=0;k<C.lv.length;k++)u[k]=pal[C.lv[k]];C.g.putImageData(C.img,0,0)}
function drawCalque(g,L,cx,cy){const C=CQ[L];if(!C)return false;tintCalque(C,L);
  const ground=BASE_GY*T-cy,hz=state==='title'||!player?ground:VH*camFY()+21,bottom=Math.round(hz+(ground-hz)*CQ_VY[L]+CQ_FOOT[L]),y=bottom-C.H,
    ox=-((cx*CQ_PAR[L]+L*311)%C.W+C.W)%C.W;
  for(let x=ox;x<VW;x+=C.W)g.drawImage(C.c,Math.round(x),y);
  if(bottom<VH){g.fillStyle=C.dark;g.fillRect(0,bottom,VW,VH-bottom)}
  // brume au pied du calque : le plan suivant sort du brouillard (plus épaisse sous la pluie et au crépuscule)
  if(L<3){const[,bot]=skyColors(),a=(.42-L*.1)+weather.rain*.2,fy=bottom-34-L*6,gr=g.createLinearGradient(0,fy,0,bottom+8),c=hex(bot);
    gr.addColorStop(0,`rgba(${c},0)`);gr.addColorStop(1,`rgba(${c},${clamp(a,0,.7)})`);g.fillStyle=gr;g.fillRect(0,fy,VW,Math.max(0,VH-fy))}
  return true}
function drawSky(g,cx,cy){const [top,bot]=skyColors(),gr=g.createLinearGradient(0,0,0,VH);gr.addColorStop(0,top);gr.addColorStop(1,bot);g.fillStyle=gr;g.fillRect(0,0,VW,VH);
  const underground=clamp((cy+VH/2-BASE_GY*T)/(18*T),0,1);
  const night=1-daylight();
  for(const[x,y,tw]of SPR.stars){g.globalAlpha=(1-underground)*night*(.3+.5*(.5+.5*Math.sin(time*1.5+tw*20)));g.fillStyle=tw>.9?'#ffe9b0':'#9bb8d6';g.fillRect(Math.floor(x*VW),Math.floor(y*VH),1,1)}
  // étoile filante de temps en temps
  {const k=Math.floor(time/7),ph=time/7-k;if(night>.6&&hash2(k,77)<.35&&ph<.12){const sx=hash2(k,78)*VW,sy=hash2(k,79)*VH*.3,t=ph/.12;g.globalAlpha=(1-underground)*(1-t);g.fillStyle='#ffffff';for(let i=0;i<8;i++)g.fillRect(Math.round(sx+t*60-i*2),Math.round(sy+t*25-i),1,1)}}
  g.globalAlpha=1-underground;
  // soleil et lune sur un arc
  {const a=sunAng(),sx=VW/2-Math.cos(a)*VW*.42,sy=VH*.62-Math.sin(a)*VH*.5;if(Math.sin(a)>-.15){halo(g,sx,sy,'#ffd27a',40,.5*(1-underground));g.globalAlpha=1-underground;disc(g,sx,sy,7,'#fff3c4','#ffcf6a')}
   const mx=VW/2+Math.cos(a)*VW*.42,my=VH*.62+Math.sin(a)*VH*.5;if(Math.sin(a)<.15){const bl=state==='play'&&isBlood();halo(g,mx,my,bl?'#ff3a3a':'#9fc0ff',bl?50:32,.45*(1-underground));g.globalAlpha=1-underground;disc(g,mx,my,6,bl?'#ff6a5a':'#e4ecff',bl?'#a01828':'#a9b8e0');g.fillStyle=bl?'#c8303a':'#c3cdee';g.fillRect(Math.round(mx-2),Math.round(my-1),2,2);g.fillRect(Math.round(mx+2),Math.round(my+2),1,1)}}
  g.globalAlpha=1;
  if(!CQ[0]&&SKY_ART.every(artReady)){drawArtSky(g,cx,cy,underground);return}
  for(let L=0;L<4;L++){if(!drawCalque(g,L,cx,cy)){const c=skyLayers[L],f=[.06,.13,.23,.34][L],ox=-((cx*f%c.width+c.width)%c.width),oy=Math.round(VH-c.height+18-cy*.02);
    for(let x=ox;x<VW;x+=c.width)g.drawImage(c,Math.round(x),oy)}
    // nuages qui dérivent entre les plans de montagnes
    if(L===1)drawClouds(g,cx,cy,underground)}
  if(underground>0){g.fillStyle=`rgba(5,5,12,${underground*.8})`;g.fillRect(0,0,VW,VH)}}

// plans de fond peints (www/art/bg-*.png, générés avec Higgsfield) : montagnes lointaines puis forêt,
// en miroir une copie sur deux pour cacher la jointure ; sans images, les silhouettes codées servent
const SKY_ART=[['art/bg-far.png',.07,1],['art/bg-near.png',.24,.78]].map(([src,f,h])=>{const im=new Image();im.src=src;return{im,f,h,key:'',sil:null,dark:null}});
const artReady=a=>a.im.complete&&a.im.naturalWidth>0;
function drawClouds(g,cx,cy,underground){const day=daylight();g.globalAlpha=(.12+.25*day+weather.rain*.3)*(1-underground);
  for(let i=0;i<9;i++){const cl=SPR.clouds[i%6],span=VW+cl.width*2,x=((hash2(i,5)*span-cx*.08+time*(3+i%3*2))%span+span)%span-cl.width,y=VH*.08+hash2(i,6)*VH*.3-cy*.01;g.drawImage(cl,Math.round(x),Math.round(y))}g.globalAlpha=1}
// teintes de l'heure, arrondies pour ne retailler les silhouettes que quelques fois par journée :
// liseré turquoise la nuit, doré le jour, rose au crépuscule, rouge sous la lune de sang
function skyTone(){const day=Math.round(daylight()*8)/8,dusk=Math.round(clamp(1-Math.abs(Math.sin(sunAng()))*2.5,0,1)*clamp(daylight()*3,0,1)*4)/4,bl=state==='play'&&isBlood(),rain=Math.round(weather.rain*4)/4;
  let rim=rgb2hex(mixc('#4fe0d0','#ffe6b0',day));rim=rgb2hex(mixc(rim,'#ff8a9a',dusk*.8));if(bl)rim='#ff3a3a';
  let fog=rgb2hex(mixc('#1d6f7a','#9cc4e8',day));fog=rgb2hex(mixc(fog,'#c06a8a',dusk*.6));fog=rgb2hex(mixc(fog,'#5a6070',rain*.6));if(bl)fog='#8a1420';
  const base=rgb2hex(mixc('#0a0f2a','#3a6ea6',day));
  return{rim,fog,far:rgb2hex(mixc(base,'#05050c',.5)),near:rgb2hex(mixc(base,'#05050c',.84))}}
// plan peint réduit à une silhouette sombre (un peu de la peinture transparaît) avec un liseré de lumière d'un pixel au sommet
function silhouette(a,body,rim,detail){const ht=Math.round(VH*a.h),wd=Math.round(a.im.naturalWidth*ht/a.im.naturalHeight),key=body+rim+wd+'x'+ht;
  if(a.key===key)return a.sil;a.key=key;
  const d=a.dark&&a.dark.width===wd&&a.dark.height===ht?a.dark:(a.dark=mk(wd,ht)),q=d.getContext('2d');q.globalCompositeOperation='copy';q.drawImage(a.im,0,0,wd,ht);
  q.globalCompositeOperation='source-over';q.globalAlpha=1-detail;q.fillStyle=body;q.fillRect(0,0,wd,ht);q.globalAlpha=1;q.globalCompositeOperation='destination-in';q.drawImage(a.im,0,0,wd,ht);
  const c=a.sil&&a.sil.width===wd&&a.sil.height===ht?a.sil:(a.sil=mk(wd,ht)),r=c.getContext('2d');r.globalCompositeOperation='copy';r.drawImage(a.im,0,0,wd,ht);
  r.globalCompositeOperation='source-in';r.fillStyle=rim;r.fillRect(0,0,wd,ht);r.globalCompositeOperation='source-over';r.drawImage(d,0,1);return c}
function drawArtLayer(g,a,cx,cy,img){const ht=img.height,wd=img.width,oy=Math.round(VH-ht+14-cy*.02),p=cx*a.f,i0=Math.floor(p/wd);
  for(let j=0,x=Math.round(i0*wd-p);x<VW;j++,x+=wd){if((i0+j)&1){g.save();g.translate(x+wd,oy);g.scale(-1,1);g.drawImage(img,0,0);g.restore()}else g.drawImage(img,x,oy)}}
// bande de brume colorée qui monte du bas de l'écran jusqu'à une hauteur donnée
function fogBand(g,col,top,alpha){const gr=g.createLinearGradient(0,top,0,VH);gr.addColorStop(0,col+'00');gr.addColorStop(1,col+'ff');g.globalAlpha=alpha;g.fillStyle=gr;g.fillRect(0,Math.floor(top),VW,VH-Math.floor(top))}
function drawArtSky(g,cx,cy,underground){const k=1-underground,tone=skyTone(),[far,near]=SKY_ART;
  g.globalAlpha=k;drawArtLayer(g,far,cx,cy,silhouette(far,tone.far,tone.rim,.22));g.globalAlpha=1;drawClouds(g,cx,cy,underground);
  fogBand(g,tone.fog,VH*.35-cy*.02,k*.42);
  g.globalAlpha=k;drawArtLayer(g,near,cx,cy,silhouette(near,tone.near,tone.rim,.1));
  fogBand(g,tone.fog,VH*.72-cy*.02,k*.3);
  g.globalAlpha=1;if(underground>0){g.fillStyle=`rgba(5,5,12,${underground*.8})`;g.fillRect(0,0,VW,VH)}}

function drawWorld(g,cx,cy){
  const x0=Math.max(0,Math.floor(cx/T)-1),x1=Math.min(WW-1,Math.floor((cx+VW)/T)+1),y0=Math.max(0,Math.floor(cy/T)-1),y1=Math.min(WH-1,Math.floor((cy+VH)/T)+1);
  const ox=Math.round(-cx),oy=Math.round(-cy);
  // murs de fond
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=idx(x,y);const t=fg[i];if(bg[i]&&(!TD[t].solid)){const h=(x*7+y*13)&3;g.drawImage(WALLTEX[bg[i]][h],x*T+ox,y*T+oy);
      const px=x*T+ox,py=y*T+oy,phase=x%12;g.fillStyle='#191d43';
      if(phase===2||phase===3){g.fillRect(px+(phase===2?3:11),py,1,T);g.fillRect(px+(phase===2?6:8),py,1,T);if(y%10===0){g.fillRect(px,py+2,T,1);g.fillRect(px,py+5,T,1)}}
      if(phase===4&&y%10===0){g.fillRect(px,py+2,5,1);g.fillRect(px,py+3,1,4)}
      if(phase===7){g.fillStyle='#12313b';g.fillRect(px+7+(y%3),py,1,T);g.fillRect(px+3,py+4,5,1);g.fillRect(px+9,py+11,4,1)}}}
  // château
  for(const b of bases){const c=SPR['castle'+b.team];g.drawImage(c,Math.round(b.castleX+ox),Math.round(BASE_GY*T-c.height+oy+1))}
  // tuiles
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){let t=fg[idx(x,y)];if(!t)continue;const d=TD[t];const h=(x*7+y*13)&3;
    if(t===GRASS&&TD[getT(x,y-1)].solid)t=DIRT;
    const px=x*T+ox,py=y*T+oy;
    if(t===TORCH){g.drawImage(SPR.torch[(Math.floor(time*9)+x+y)&3],px,py);continue}
    if(t===PLANT){g.drawImage(TEX[PLANT][(x*3+y)&3],px+Math.round(Math.sin(time*1.8+x*.9)*.8+weather.rain*.5),py+1);continue}
    if(t===LEAF||t===WATER)continue;
    if(t===VINE){g.drawImage(TEX[VINE][h],px+Math.round(Math.sin(time*1.3+x*.7+y*.4)*1),py);continue}
    if(t===CPLANT||t===MUSH){g.drawImage(TEX[t][h],px,py);continue}
    const interior=d.solid&&TD[getT(x-1,y)].solid&&TD[getT(x+1,y)].solid&&TD[getT(x,y-1)].solid&&TD[getT(x,y+1)].solid;
    const buried=interior&&SPR.buried[t];
    const arr=buried||TEX[t];g.drawImage(arr.length>4?arr[(y&3)*4+(x&3)]:arr[h],px,py);
    if(interior&&!buried){g.fillStyle='rgba(6,6,15,.75)';g.fillRect(px,py,T,T)}
    if(SPR.oreGlint[t]&&((Math.floor(time*3)+x*7+y*11)&15)===0)g.drawImage(SPR.oreGlint[t][h],px,py);
    if(!interior&&d.solid&&!TD[getT(x,y-1)].solid){g.fillStyle=t===GRASS?'#63ebca':t===DIRT?'#3f7f86':t===DEEP?'#7960ce':'#667d9c';g.fillRect(px,py,T,1);
      if(t===GRASS){const hh=(x*73)%13;if(hh<9)g.drawImage(hh<2?TEX[PLANT][x&3]:SPR.tuft[hh&3],px+Math.round(Math.sin(time*1.6+x*.7)*.8),py-T)}}}
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(fg[idx(x,y)]!==WATER)continue;const px=x*T+ox,py=y*T+oy;
    if(getT(x,y-1)!==WATER){const o=Math.round(Math.sin(time*2.2+x*.8)*1.3+Math.sin(time*1.3-x*.35));g.fillStyle='#061426';g.fillRect(px,py+3+o,T,T-3-o);
      g.fillStyle='rgba(93,222,231,.8)';g.fillRect(px,py+3+o,T,1);g.fillStyle='rgba(93,222,231,.22)';g.fillRect(px,py+5+o,T,1);g.fillRect(px+((x*7)%10),py+8+o,5,1);if(((x*13+Math.floor(time*3))%7)===0){g.fillStyle='#e8fbff';g.fillRect(px+((x*5)%12),py+5+o,2,1)}}
    else{g.fillStyle=getT(x,y-2)===WATER?'#050c1c':'#071a2c';g.fillRect(px,py,T,T);if(((x*5+Math.floor(time*1.5+y))%9)===0){g.fillStyle='rgba(120,240,230,.14)';g.fillRect(px+((x*11)%13),py,1,T)}if(((x*7+y*3+Math.floor(time*2))%11)===0){g.fillStyle='rgba(87,124,200,.45)';g.fillRect(px+((x*3+y)%13),py+((y*5)%14),2,1)}}}
  for(const tr of trees){const im=tr.img,X=tr.x*T+8-im.width/2+ox+Math.round(Math.sin(time*(.9+weather.rain)+tr.x*.37)*(1+weather.rain*1.5)),Y=(tr.top-1)*T+8-im.height/2+oy;if(X>VW||X+im.width<0||Y>VH||Y+im.height<0)continue;g.drawImage(im,Math.round(X),Math.round(Y))}
  for(const d of visualDebris){const k=d.t/.65;
    g.save();g.globalAlpha=1-Math.max(0,(k-.55)/.45);
    if(d.tree){g.translate(Math.round(d.x+ox),Math.round(d.y+oy));g.rotate(d.dir*(k<.2?Math.sin(k*60)*.025:(k-.2)**2*1.8));g.drawImage(d.img,-Math.floor(d.img.width/2),-d.img.height)}
    else g.drawImage(SPR.chestOpen[Math.min(3,Math.floor(k*8))],Math.round(d.x+ox),Math.round(d.y+oy)-4);
    g.restore();
  }
  // fissures
  if(mining&&mining.p>0)g.drawImage(SPR.crack[clamp(Math.floor(mining.p*4),0,3)],mining.tx*T+ox,mining.ty*T+oy);
}
const lc=mk(1,1),lg=lc.getContext('2d'),gc=mk(1,1),gg=gc.getContext('2d');
let LW=null,LWg=null,LM=null,LMg=null;
function skyLightCol(){const b=daylight()*(1-weather.rain*.25);if(state==='play'&&isBlood())return[200,80,90];const f=weather.flash>0?1+weather.flash*.8:1;return[lerp(115,175,b)*f,lerp(140,195,b)*f,lerp(205,240,b)*f]}

function buildLight(cx,cy){
  const x0=Math.floor(cx/T)-1,y0=Math.floor(cy/T)-1,nw=Math.ceil(VW/T)+3,nh=Math.ceil(VH/T)+3;
  if(lc.width!==nw||lc.height!==nh){lc.width=gc.width=nw;lc.height=gc.height=nh}
  const id=lg.createImageData(nw,nh),d=id.data,gd=gg.createImageData(nw,nh),G=gd.data,sc=skyLightCol(),day=.65+daylight()*.15;
  const pl=player||{x:-999,y:-999,w:0,h:0,dead:true};const pcx=(pl.x+pl.w/2)/T,pcy=(pl.y+pl.h/2)/T;
  for(let y=0;y<nh;y++)for(let x=0;x<nw;x++){const X=x0+x,Y=y0+y;let r=56,g=62,b=96,gr=0,gg2=0,gb=0;
    if(X>=0&&X<WW&&Y<WH){let sk,tl=0,ci=0;if(Y<0)sk=1;else{const i=idx(X,Y);sk=lightSky[i];tl=lightTorch[i];ci=LCI[i]}
      sk*=day;r+=sk*sc[0];g+=sk*sc[1];b+=sk*sc[2];
      if(tl>0){const fl=.92+.08*Math.sin(time*9+X*1.7+Y),c=LCOLS[ci],t=tl*fl;r+=t*c[0];g+=t*c[1];b+=t*c[2];const t2=t*t*t;gr=t2*c[0];gg2=t2*c[1];gb=t2*c[2]}}
    if(!pl.dead){const dd=Math.hypot(X+.5-pcx,Y+.5-pcy),l=Math.max(0,.75-dd*.07);r+=l*125;g+=l*165;b+=l*220}
    const k=(y*nw+x)*4;d[k]=Math.min(255,r);d[k+1]=Math.min(255,g);d[k+2]=Math.min(255,b);d[k+3]=255;G[k]=gr;G[k+1]=gg2;G[k+2]=gb;G[k+3]=255}
  lg.putImageData(id,0,0);gg.putImageData(gd,0,0);return{x:Math.round(x0*T-cx),y:Math.round(y0*T-cy),w:nw*T,h:nh*T}}
// assombrit la couche monde (multiplication) en préservant sa transparence (le ciel reste visible derrière)
function applyLight(layer,lgM,box){lgM.globalCompositeOperation='copy';lgM.drawImage(layer,0,0);
  const l=layer.getContext('2d');l.imageSmoothingEnabled=true;l.globalCompositeOperation='multiply';l.drawImage(lc,box.x,box.y,box.w,box.h);
  l.globalCompositeOperation='destination-in';l.drawImage(LM,0,0);l.globalCompositeOperation='source-over';l.imageSmoothingEnabled=false}
function drawBloom(g,box){g.save();g.imageSmoothingEnabled=true;g.globalCompositeOperation='lighter';
  g.globalAlpha=.35;g.drawImage(gc,box.x,box.y,box.w,box.h);
  g.globalAlpha=.16;g.drawImage(gc,box.x-2*T,box.y-2*T,box.w+4*T,box.h+4*T);g.restore()}
// Cached radial sprites and channel masks keep bloom and aberration independent of pixel loops.
const glowSprites={};
function halo(g,x,y,col,r,alpha=1){let c=glowSprites[col];if(!c){c=mk(64,64);const q=c.getContext('2d'),gr=q.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,col+'88');gr.addColorStop(.2,col+'33');gr.addColorStop(1,col+'00');q.fillStyle=gr;q.fillRect(0,0,64,64);glowSprites[col]=c}
  // opacité rendue après coup : laissée à alpha, elle rendait transparent tout ce qui était dessiné ensuite (panneaux du HUD)
  const a0=g.globalAlpha;g.globalAlpha=alpha;g.drawImage(c,Math.round(x-r),Math.round(y-r),r*2,r*2);g.globalAlpha=a0}

function sprFrame(set,e,ignoreSwing=false){const s=e.dir<0?set.L:set.R;
  if(e.digVisualUntil>time)return (e.digVisualPhase%1)<.45?s.wind:s.atk;
  if(!ignoreSwing&&e.swing>0)return e.swing>.08?s.atk:s.idle[0];
  if(e.type==='monster'&&e.atk>.8)return s.atk;
  if(e.type==='unit'&&e.atk>0&&e.atk<.18&&Math.abs(e.vx)<4)return s.wind;
  if(!e.onGround)return s.jump;if(Math.abs(e.vx)>4)return s.walk[Math.floor(e.anim)%s.walk.length];return s.idle[Math.floor(time*1.6+(e.x|0)%7*.13)%2]}
// écrasement à l'atterrissage, étirement en l'air (pieds fixes) ; traînée des yeux quand la créature court
function drawBody(g,img,e,x,y,set){let sq=e.squash||0;if(!e.onGround&&e.vy<-60)sq=Math.min(sq,-clamp(-e.vy/700,0,.6));
  if(e.type==='monster'){const sl=e.kind==='slime';if(e.atk>.8)sq=sl?-.55:-.2;else if(e.onGround&&Math.abs(e.vx)<4&&Math.abs(sq)<.05)sq+=Math.sin(time*(sl?4.2:2.6)+e.x*.13)*(sl?.14:.07)} // respiration et élan d'attaque
  if(set&&Math.abs(e.vx)>30&&e.onGround!==undefined){const ey=(e.dir<0?set.L:set.R).eyes;if(ey){const tr=e.eyeTr||(e.eyeTr=[]);g.globalCompositeOperation='lighter';
      for(let i=0;i<tr.length;i++){g.globalAlpha=.12+i*.09;g.drawImage(ey,tr[i][0],tr[i][1])}g.globalAlpha=1;g.globalCompositeOperation='source-over';
      tr.push([x,y]);if(tr.length>4)tr.shift()}}else if(e.eyeTr)e.eyeTr.length=0;
  if(Math.abs(sq)>.02){const sx=sq>0?1+sq*.28:1+sq*.18,sy=sq>0?1-sq*.25:1-sq*.22,fx=x+img.width/2,fy=y+img.height;g.save();g.translate(fx,fy);g.scale(sx,sy);g.drawImage(img,-img.width/2,-img.height);g.restore()}
  else g.drawImage(img,x,y)}
function drawEnts(g,cx,cy){
  const ox=-cx,oy=-cy;
  // fanion de l'ordre Tenir, planté à la surface
  {const b=bases[0];if(b.order==='hold'&&b.holdX!=null){const X=Math.round(b.holdX+ox),Y=surf[clamp(Math.floor(b.holdX/T),0,WW-1)]*T+oy;if(X>-20&&X<VW+20){const wv=Math.sin(time*5)>0?1:0;
    g.fillStyle='#120e1c';g.fillRect(X-1,Y-29,3,29);g.fillRect(X+1,Y-29,11,8);g.fillStyle='#c9d4ff';g.fillRect(X,Y-28,1,28);g.fillStyle='#4f9df5';g.fillRect(X+1,Y-28,9,6);g.fillStyle='#9fd0ff';g.fillRect(X+1,Y-28+wv,9,1);g.fillRect(X+3+wv*3,Y-26,2,2)}}}
  for(const e of ents){if(e.dead&&e.type!=='core')continue;if(e.type==='player')continue;
    if(e.x+40<cx||e.x-40>cx+VW||e.y+40<cy||e.y-60>cy+VH)continue;
    // troupe à l'arrêt : léger décalage propre à chaque unité pour lire une foule plutôt qu'un seul soldat
    if(e.type==='unit')e.dOff=(e.dOff||0)+((Math.abs(e.vx)<5?e.offs*4:0)-(e.dOff||0))*.15;
    const X=Math.round(e.x+ox+(e.type==='unit'?e.dOff+(e.swing>0?e.dir:0):e.type==='monster'&&e.atk>.8?e.dir*3:0)+(e.flash>0?(e.hitVisualDir||0)*2:0)),Y=Math.round(e.y+oy+(e.stepOff||0));
    if(e.type==='item'){const ic=ICON[e.id];if(ic){const bob=Math.round(Math.sin(e.age*4)*1.5);g.drawImage(ic,X-4,Y-6+bob);const sp=(Math.floor(e.age*8)+(e.x|0))&31;if(sp<3){g.fillStyle=sp===1?'#e8fbff':'#9ff3ff';const r=sp===1?2:1;g.fillRect(X+6,Y-4-r+bob,1,1+r*2);g.fillRect(X+5-r+1,Y-4+bob,1+r*2,1)}}continue}
    if(e.type==='core'){if(e.dead)continue;const hpf=e.hp/e.maxhp,f=SPR['core'+e.team][Math.floor(e.anim*(4+(1-hpf)*8))%4],fx=X+(e.w>>1)-(f.width>>1),fy=Y+e.h-f.height+1,cy=f.height>40?-6:0;g.drawImage(f,fx,fy);emit(f,fx,fy);
      // fissures selon les dégâts, étincelles quand il est presque détruit
      if(hpf<.66){g.fillStyle='#05050c';for(const[a,b]of[[9,10],[10,11],[10,12],[11,13],[12,14]])g.fillRect(X+a,Y+b+cy,1,1)}
      if(hpf<.33){g.fillStyle='#05050c';for(const[a,b]of[[13,9],[14,8],[12,17],[13,18],[8,15],[7,16]])g.fillRect(X+a,Y+b+cy,1,1);if(rnd()<.15)parts.push({x:e.x+R(4,18),y:e.y+R(6,22),vx:R(-30,30),vy:R(-50,-10),g:200,life:.4,max:.4,col:'#ffffff',size:1,glow:1})}if(e.flash>0){g.globalCompositeOperation='lighter';g.globalAlpha=.6;g.drawImage(f,fx,fy);g.globalAlpha=1;g.globalCompositeOperation='source-over'}continue}
    let img;
    if(e.type==='unit'){if(e.spawnT>0)g.globalAlpha=clamp(1-e.spawnT/.6,0,1);img=sprFrame(SPR[e.kind+e.team],e);const big=e.kind==='golem';const ox=(img.width>>1)-(e.w>>1);drawBody(g,img,e,X-ox,Y+e.h-img.height+1,SPR[e.kind+e.team]);emit(img,X-ox,Y+e.h-img.height+1,g.globalAlpha);
      // armes
      if((e.kind==='warrior'||e.kind==='miner'||e.kind==='champion')&&(!UNIT_ART.ok||e.swing>0||e.digVisualUntil>time)){const wi=ICON[e.kind==='miner'?'pick1':e.kind==='champion'?'sword4':(e.team?'sword3':'sword2')];drawHeld(g,wi,X+e.w/2,Y+11,e.dir,e.digVisualUntil>time?e.digVisualPhase%1:e.swing>0?1-e.swing/.25:0,e.digVisualUntil>time||e.swing>0)}
      if(e.kind==='archer'&&!UNIT_ART.ok&&!(e.atk>0&&e.atk<.18))drawHeld(g,ICON.bow,X+e.w/2+(e.swing>0?e.dir*2:0),Y+11,e.dir,-1);
      if(e.kind==='miner'&&(e.carryN>0||e.junk>0)){const best=['diamond','gold','silver','iron','copper','coal','stone','wood'].find(k=>e.carry[k]>0);if(best){g.drawImage(ICON[best],X-4+(e.dir>0?-6:6),Y+3,10,10)}}
      g.globalAlpha=1;if(e.spawnT>.3){g.globalCompositeOperation='lighter';g.globalAlpha=(e.spawnT-.3)/.3;g.drawImage(img,X-(img.width>>1)+(e.w>>1),Y+e.h-img.height+1);g.globalAlpha=1;g.globalCompositeOperation='source-over'}}
    else if(e.type==='monster'){if(e.kind==='slime'){const fr=(e.blue?SPR.slimeB:SPR.slime);img=fr[e.onGround?(Math.sin(e.anim*6)>0?0:1):2];const ox=(img.width>>1)-(e.w>>1);drawBody(g,img,e,X-ox,Y+e.h-img.height+1);emit(img,X-ox,Y+e.h-img.height+1)}
      else{const set=e.kind==='ogre'?SPR.ogre:SPR.zombie;img=e.pose==='wind'?(e.dir<0?set.L:set.R).wind:sprFrame(set,e);const ox=(img.width>>1)-(e.w>>1);drawBody(g,img,e,X-ox,Y+e.h-img.height+1,set);emit(img,X-ox,Y+e.h-img.height+1);
        if(e.boss)wtxt(g,'Ogre de sang',X+e.w/2,Y-24,'#ff6fae',7)}}
    if(e.flash>0&&img){g.globalCompositeOperation='lighter';g.globalAlpha=.7;g.drawImage(img,X-(img.width>>1)+(e.w>>1),Y+e.h-img.height+1);g.globalAlpha=1;g.globalCompositeOperation='source-over'}
    // barre de vie
    if(e.kind==='champion')wtxt(g,'Champion',X+e.w/2,Y-15,'#ff9a8a',7)
    // galvanisé par le champion : étincelle au-dessus de la tête
    if(e.aura>time&&((time*6+e.x)|0)%3===0){g.fillStyle='#ffd27a';g.fillRect(X+(e.w>>1),Y-4,1,2);g.fillRect(X+(e.w>>1)-1,Y-3,3,1)}
    if(e.hp<e.maxhp||e.kind==='champion'||e.boss){const wd=e.boss?34:Math.max(12,e.w+4);const by=Y-(e.boss?8:0);g.fillStyle='#120e1c';g.fillRect(X+e.w/2-wd/2-1,by-6,wd+2,3);g.fillStyle=e.team===0?'#5fb0ff':e.team===1?'#ff5a4a':'#7ddf6a';g.fillRect(X+e.w/2-wd/2,by-5,Math.max(1,wd*e.hp/e.maxhp),1)}}
  // joueur
  const p=player;
  // chute du héros : blessé, à genoux, bascule, allongé puis disparaît (cadres heroDoll().death)
  if(p.dead&&SPR.player.R.death){const t=6-(p.respawn||0),d=(p.dir<0?SPR.player.L:SPR.player.R).death,img=d[Math.min(3,Math.floor(t/.14))],al=t<1.5?1:Math.max(0,1-(t-1.5));
    if(al>0){const X=Math.round(p.x+ox)+(p.w>>1)-(img.width>>1),Y=Math.round(p.y+oy)+p.h+1-img.height;g.globalAlpha=al;g.drawImage(img,X,Y);g.globalAlpha=1;emit(img,X,Y,al)}}
  if(!p.dead&&!(p.iframes>.12&&p.iframes<.2&&Math.floor(time*20)%2)){const sel=p.inv[p.sel],tl=sel&&IT[sel.id]&&IT[sel.id].tool,armed=!sel||tl==='sword',img=SPR.player.R.death?heroPick(SPR.player,p,armed):sprFrame(SPR.player,p,!!mining);const X=Math.round(p.x+ox),Y=Math.round(p.y+oy+(p.stepOff||0));
    // écrasement à l'atterrissage, étirement au saut
    {const ox=(img.width>>1)-(p.w>>1);drawBody(g,img,p,X-ox,Y+p.h-img.height+1,SPR.player);emit(img,X-ox,Y+p.h-img.height+1)}
    if(sel&&ICON[sel.id]&&(tl||SPR.player.U)){const sw=tl==='sword'?(p.swing>0?1-p.swing/.32:0):tl==='pick'?(mining?((time*5)%1):0):tl?-1:-2,hd=!!SPR.player.U;
      // héros HD : l'épée fait partie du sprite (seule la traînée est ajoutée), les autres outils se tiennent à la main du sprite
      drawHeld(g,hd&&tl==='sword'?null:ICON[sel.id],hd?X+p.w/2+p.dir*4.5:X+p.w/2,hd?Y+p.h-9:Y+12,p.dir,sw,(tl==='pick'&&!!mining)||(tl==='sword'&&p.swing>0))}
    if(p.flash>0){g.globalCompositeOperation='lighter';g.globalAlpha=.6;g.drawImage(img,X-(img.width>>1)+(p.w>>1),Y+p.h-img.height+1);g.globalAlpha=1;g.globalCompositeOperation='source-over'}}
  // flèches
  // traînée des flèches
  g.fillStyle='#e8ecff';for(const a of arrows)if(!a.stuck){for(let i=1;i<=4;i++){g.globalAlpha=.35-i*.08;g.fillRect(Math.round(a.x+ox-a.vx*i*.012),Math.round(a.y+oy-a.vy*i*.012),1,1)}}g.globalAlpha=1;
  // dépouilles : la silhouette blanchit, s'aplatit et s'évapore
  for(const c of corpses){const k=c.t/.9;g.save();g.globalAlpha=1-k;g.translate(Math.round(c.x+ox),Math.round(c.y+oy));if(c.dir)g.rotate(c.dir*Math.min(1,k*3)*1.2);g.scale(1+k*.4,1-k*.7);g.drawImage(c.img,-c.img.width/2,-c.img.height);g.globalCompositeOperation='lighter';g.globalAlpha=(1-k)*.8;g.drawImage(c.img,-c.img.width/2,-c.img.height);g.restore()}
  // bombes : mèche qui clignote plus vite avant l'explosion
  for(const b of bombs){g.save();g.translate(Math.round(b.x+ox),Math.round(b.y+oy));g.rotate(b.vx*.004*(1.4-b.t)*8);g.drawImage(ICON.bomb,-8,-10);if(Math.sin((1.6-b.t)**2*30)>0){g.globalCompositeOperation='lighter';g.globalAlpha=.55;g.fillStyle='#ff5a4a';g.fillRect(-5,-3,10,6);g.fillRect(-3,-5,6,10);g.globalAlpha=.9;g.fillStyle='#fff3bb';g.fillRect(2,-10,2,2)}g.restore()}
  for(const a of arrows){g.save();g.translate(Math.round(a.x+ox),Math.round(a.y+oy));g.rotate(a.stuck?a.rot:(a.rot=Math.atan2(a.vy,a.vx)));g.drawImage(SPR.arrow,-8,-1);g.restore()}
}
function drawHeld(g,img,x,y,dir,sw,trail=false){g.save();g.translate(x+dir*3,y);g.scale(dir,1);if(trail&&sw>.12)g.drawImage(SPR.slash[Math.min(5,Math.floor(clamp(sw,0,1)*6))],-20,-20);if(sw===-2){if(img)g.drawImage(img,-6,-9,11,11);g.restore();return}let a=sw<0?.2:(-1.6+sw*2.6);g.rotate(a);if(img)g.drawImage(img,-3,-13);g.restore()}
function drawParts(g,cx,cy){for(const p of parts){if(p.dust)continue;const a=clamp(p.life/(p.max||1),0,1);g.globalAlpha=p.fly?(.5+.5*Math.sin(time*6+p.x)):a;g.fillStyle=p.col;g.fillRect(Math.round(p.x-cx),Math.round(p.y-cy),p.size,p.size)}g.globalAlpha=1}
function drawGlows(g,cx,cy){g.save();g.globalCompositeOperation='lighter';
  for(const p of parts)if(p.glow){g.globalAlpha=.25*clamp(p.life/p.max,0,1);g.fillStyle=p.col;g.fillRect(Math.round(p.x-cx),Math.round(p.y-cy),2,2)}
  for(const b of bases){const c=SPR['castle'+b.team],bx=b.castleX-cx,by=BASE_GY*T-c.height+1-cy;
    if(bx>VW+60||bx+c.width<-60)continue;
    if(!b.core.dead){for(const[x,y]of c.wins)halo(g,bx+x+4,by+y+6,'#ffbd62',18,.45);
      halo(g,b.core.x-cx+11,b.core.y-cy+16,b.team?'#e5534b':'#4f9df5',38+2*Math.sin(time*2+b.team),.6+.08*Math.sin(time*2+b.team))}
  }
  const x0=Math.max(0,Math.floor(cx/T)),x1=Math.min(WW-1,Math.floor((cx+VW)/T)+1),y0=Math.max(0,Math.floor(cy/T)),y1=Math.min(WH-1,Math.floor((cy+VH)/T)+1);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const t=fg[idx(x,y)],X=x*T-cx+8,Y=y*T-cy+8;
    if(t===TORCH){halo(g,X,Y,'#ffbc62',58,.9+.1*Math.sin(time*5+x));halo(g,X,Y,'#ff7a3a',22,.5);g.globalAlpha=1;g.fillStyle='#ffe8a6';g.fillRect(X-1,Y-1,2,3)}
    else if(t===MUSH){halo(g,X,Y,'#5fffd6',34,.7+.12*Math.sin(time*1.3+x*2))}
    else if(t===CHEST){halo(g,X,Y,'#ffcf47',26,.45+.25*Math.sin(time*3+x));if(Math.sin(time*2+x*3)>.97){g.globalAlpha=1;g.fillStyle='#ffffff';g.fillRect(X+3,Y-2,1,3);g.fillRect(X+2,Y-1,3,1)}}
    else if(ORE[t]&&t!==COAL){const exposed=!TD[getT(x-1,y)].solid||!TD[getT(x+1,y)].solid||!TD[getT(x,y-1)].solid||!TD[getT(x,y+1)].solid;
      halo(g,X,Y,ORE[t][1],t===CRYSTAL?44:20,exposed?(t===CRYSTAL?.65+.15*Math.sin(time*2+x+y):.5):.08)}
    else if(t===CPLANT||t===PLANT||t===GRASS&&!TD[getT(x,y-1)].solid){halo(g,X,Y-(t===GRASS?16:0),t===PLANT&&(x*3+y)%4===1?'#ff6fae':'#38e5c8',t===CPLANT?22:16,t===CPLANT?.28:.16)}}
  g.restore()}
let VG=null,CRT=null,glowLayer=null,glowTint=null;
// gouttes qui tombent du plafond des grottes et s'allument un instant à l'arrivée
function drawDrips(g,cx,cy){const x0=Math.max(1,Math.floor(cx/T)),x1=Math.min(WW-2,Math.floor((cx+VW)/T)),y0=Math.max(1,Math.floor(cy/T)),y1=Math.min(WH-2,Math.floor((cy+VH)/T));
  for(let x=x0;x<=x1;x++)for(let y=Math.max(y0,surf[x]+4);y<=y1;y++){const h=hash2(x*7+3,y*13+5);if(h>.06||!TD[getT(x,y)].solid||TD[getT(x,y+1)].solid)continue;
    let fall=1;while(fall<10&&!TD[getT(x,y+1+fall)].solid)fall++;
    const per=2.5+h*30,ph=(time+h*97)%per,dx=x*T+4+Math.floor(h*120)%8-cx,top=(y+1)*T-cy,len=fall*T,t=ph/.9;
    if(t<1){const dy=top+t*t*len;g.globalAlpha=.8;g.fillStyle='#8ff6ff';g.fillRect(Math.round(dx),Math.round(dy),1,2)}
    else if(t<1.4){halo(g,dx,top+len-1,'#5fffe0',8,(1.4-t)*1.2)}
    else{g.globalAlpha=.5;g.fillStyle='#8ff6ff';g.fillRect(Math.round(dx),top,1,1)}}}
function drawAtmos(g,cx,cy){
  // World-anchored, deterministic motes; no particle allocations or RNG mutations.
  // Surface: yellow fireflies, brighter at night. Underground: cyan/pink spores drifting up.
  const night=1-daylight(),x0=Math.floor(cx/48)-1,x1=Math.ceil((cx+VW)/48)+1,y0=Math.floor(cy/48)-1,y1=Math.ceil((cy+VH)/48)+1;
  g.save();g.globalCompositeOperation='lighter';
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const seed=hash2(x,y+901),tx=clamp(Math.floor((x*48+24)/T),0,WW-1),cave=y*48>(surf[tx]+3)*T;
    if(seed<(cave?.12:.22))continue;
    const rise=cave?((time*(4+seed*6)+seed*48)%48):0,X=x*48+seed*40+Math.sin(time*.7+seed*30)*9,Y=y*48+seed*35+Math.cos(time*.6+seed*40)*6-rise;
    if(TD[getT(Math.floor(X/T),Math.floor(Y/T))].solid)continue;
    const col=cave?(seed>.7?'#ff7ad0':'#5fffe0'):'#ffe066',a=Math.pow(.5+.5*Math.sin(time*1.7+seed*50),2)*(cave?.9:.35+.6*night);
    halo(g,X-cx,Y-cy,col,cave?11:9+3*night,a*.35);g.globalAlpha=a;g.fillStyle=col;g.fillRect(Math.round(X-cx),Math.round(Y-cy),1,1)}
  drawDrips(g,cx,cy);g.restore();
  if(!VG||VG.width!==VW||VG.height!==VH){VG=mk(VW,VH);const v=VG.getContext('2d'),gr=v.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.35,VW/2,VH/2,Math.max(VW,VH)*.7);gr.addColorStop(0,'#05050c00');gr.addColorStop(1,'#05050c99');v.fillStyle=gr;v.fillRect(0,0,VW,VH)}g.drawImage(VG,0,0)}
function drawGlowPass(g,cx,cy,box){if(!glowLayer||glowLayer.width!==VW||glowLayer.height!==VH){glowLayer=mk(VW,VH);glowTint=mk(VW,VH)}
  const q=glowLayer.getContext('2d'),t=glowTint.getContext('2d');q.clearRect(0,0,VW,VH);drawBloom(q,box);drawGlows(q,cx,cy);
  g.save();g.globalCompositeOperation='lighter';
  for(const[col,dx]of[['#ff3355',-1],['#38ffff',1]]){t.globalCompositeOperation='copy';t.drawImage(glowLayer,0,0);t.globalCompositeOperation='multiply';t.fillStyle=col;t.fillRect(0,0,VW,VH);t.globalCompositeOperation='destination-in';t.drawImage(glowLayer,0,0);g.globalAlpha=.15;g.drawImage(glowTint,dx,0)}
  g.globalAlpha=.8;g.drawImage(glowLayer,0,0);g.restore()}
// effets par-dessus le monde : anneaux, éclairs de pose, pluie, éclair d'orage, vignettes (dégâts, lune de sang, PV bas)
function drawOverlays(g,cx,cy){g.save();
  for(const q of pops){const k=1-q.t/q.max;
    if(q.ring){g.globalCompositeOperation='lighter';const X=Math.round(q.x-cx),Y=Math.round(q.y-cy),rad=2+q.r*Math.sqrt(k),n=Math.max(12,Math.round(rad*1.1)),sz=k<.5?2:1;
      g.globalAlpha=(1-k)*.9;g.fillStyle=q.col;for(let i=0;i<n;i++){const a=i/n*6.283;g.fillRect(Math.round(X+Math.cos(a)*rad),Math.round(Y+Math.sin(a)*rad),sz,sz)}
      if(q.r>40){g.globalAlpha=(1-k);for(let i=0;i<10;i++){const a=i*.628+q.r,d=rad*.55+6;g.fillStyle=i&1?'#9ff3ff':'#fff3bb';for(let j=0;j<3;j++)g.fillRect(Math.round(X+Math.cos(a)*(d+j*2)),Math.round(Y+Math.sin(a)*(d+j*2)),1,1)}}}
    else if(q.flash){g.globalCompositeOperation='lighter';halo(g,q.x-cx,q.y-cy,'#fff0c0',90,(1-k))}
    else if(q.tile){g.globalCompositeOperation='lighter';g.globalAlpha=(1-k)*.7;g.fillStyle='#ffffff';const z=(1-k)*3;g.fillRect(Math.round(q.tx*T-cx-z),Math.round(q.ty*T-cy-z),T+z*2,T+z*2)}}
  g.globalCompositeOperation='source-over';g.globalAlpha=1;
  if(weather.rain>.03&&state==='play'){const n=Math.floor(weather.rain*160);g.fillStyle='#9cc4ff';
    for(let i=0;i<n;i++){const x=((hash2(i,11)*VW*1.2+time*(60+hash2(i,13)*30)-cx*.0)%(VW*1.2)+VW*1.2)%(VW*1.2)-VW*.1,y=((hash2(i,12)*VH+time*(260+hash2(i,14)*80))%VH),tx=Math.floor((x+cx)/T);
      if(tx<0||tx>=WW||y+cy>surf[tx]*T)continue;g.globalAlpha=.25+hash2(i,15)*.3;g.fillRect(Math.round(x),Math.round(y),1,4)}g.globalAlpha=1}
  if(weather.flash>0&&state==='play'){g.fillStyle=`rgba(220,230,255,${weather.flash*.35})`;g.fillRect(0,0,VW,VH)}
  const low=player&&!player.dead&&state==='play'?clamp(1-player.hp/player.maxhp/.3,0,1)*(.6+.4*Math.sin(time*6)):0;
  const red=Math.max(hurtFx*.8,low*.6),blood=state==='play'&&isBlood()?.45:0;
  if(red>0||blood>0){if(!VR||VR.width!==VW||VR.height!==VH){VR=mk(VW,VH);const v=VR.getContext('2d'),gr=v.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.3,VW/2,VH/2,Math.max(VW,VH)*.75);gr.addColorStop(0,'#c0101800');gr.addColorStop(1,'#c01018ff');v.fillStyle=gr;v.fillRect(0,0,VW,VH)}
    g.globalAlpha=Math.min(1,red+blood);g.drawImage(VR,0,0)}
  g.restore()}
let VR=null;
function drawConfetti(){if(!confetti.length)return;ctx.save();ctx.globalCompositeOperation='lighter';
  for(const c of confetti){if(c.t<0)continue;const k=Math.min(1,c.t/.8,(c.life-c.t)/1.5)*(.65+.35*Math.sin(c.t*4+c.ph)),x=Math.round(c.x),y=Math.round(c.y);ctx.fillStyle=c.col;
    // halo en croix pixel, puis cœur clair
    ctx.globalAlpha=k*.18;ctx.fillRect(x-2,y-1,5,3);ctx.fillRect(x-1,y-2,3,5);if(c.big){ctx.globalAlpha=k*.08;ctx.fillRect(x-3,y-3,7,7)}
    ctx.globalAlpha=k;ctx.fillRect(x,y,1,1);if(c.big){ctx.fillStyle='#ffffff';ctx.globalAlpha=k*.7;ctx.fillRect(x,y,1,1)}}
  ctx.restore()}
// bannière de succès qui glisse depuis le haut
function drawAch(){const a=achPop[0];if(!a)return;const k=a.t<.35?a.t/.35:a.t>3.5?1-(a.t-3.5)/.5:1,e=1-Math.pow(1-k,3);
  const W=Math.min(VW-16,Math.max(uiWidth('SUCCÈS : '+a.a.n,8),uiWidth(a.a.d,7))+28),x=Math.round(VW/2-W/2),y=Math.round(-30+e*(36));
  box(x,y,W,24,'#05050cf0',COL.gold);ctx.globalAlpha=.5+.5*Math.sin(a.t*8);txt('★',x+6,y+5,COL.gold,8);ctx.globalAlpha=1;
  txt('Succès : '+a.a.n,x+18,y+4,COL.gold,8);txt(uiFit(a.a.d,W-24,7),x+18,y+14,COL.txt,7)}
function drawCRT(){if(!CRT||CRT.width!==cv.width||CRT.height!==cv.height){CRT=mk(cv.width,cv.height);const q=CRT.getContext('2d');q.fillStyle='rgba(0,0,8,.16)';for(let y=1;y<CRT.height;y+=2)q.fillRect(0,y,CRT.width,1)}ctx.drawImage(CRT,0,0)}

// Pixels qui brillent dans le noir (yeux des monstres, lampe du mineur, fantômes) : posés après l'éclairage,
// avec un petit halo de leur couleur, plus fort la nuit et sous terre.
let EMI=[];
function emit(img,x,y,a=1){if(img.emi)EMI.push([img.emi,x,y,a])}
function emiGlow(c){if(c.glow!==undefined)return c.glow;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0,sx=0,sy=0,r=0,gg=0,b=0;
  for(let i=0;i<d.length;i+=4)if(d[i+3]>0){const k=i/4;n++;sx+=k%c.width;sy+=Math.floor(k/c.width);r+=d[i];gg+=d[i+1];b+=d[i+2]}
  return c.glow=n?{x:sx/n+.5,y:sy/n+.5,col:'#'+[r,gg,b].map(v=>Math.round(v/n).toString(16).padStart(2,'0')).join(''),n}:null}
function drawEmissive(g){if(!EMI.length)return;const dark=1-daylight()*.7;g.save();g.globalCompositeOperation='lighter';
  for(const[c,x,y,a]of EMI){const gl=emiGlow(c);if(!gl)continue;g.globalAlpha=a*(.55+.45*dark);g.drawImage(c,x,y);
    halo(g,x+gl.x,y+gl.y,gl.col,8+Math.min(6,gl.n/4),a*.5*dark)}
  g.restore();g.globalAlpha=1;EMI=[]}
function render(){
  EMI=[];
  const g=w;g.imageSmoothingEnabled=false;
  let cx=cam.x,cy=cam.y;
  if(state==='title'||!player){cx=(titleCam%(WW*T-VW*2))+VW/2;cy=BASE_GY*T-VH*.62;if(fg){const m=Math.floor((cx+VW/2)/T);cy=Math.min(cy,surf[clamp(m,0,WW-1)]*T-VH*.55)}}
  // caméra calée sur le héros : son décalage à l'écran ne bouge que par pixel entier, sinon il oscille d'un pixel à chaque image en marchant (image floue sur téléphone)
  else{const ox=player.x-cam.x,oy=player.y-cam.y;if(Math.abs(ox-camOff.x)>=1)camOff.x=Math.round(ox);if(Math.abs(oy-camOff.y)>=1)camOff.y=Math.round(oy);
    cx=clamp(Math.round(player.x)-camOff.x,0,WW*T-VW);cy=clamp(Math.round(player.y)-camOff.y,-40,WH*T-VH)}
  if(shake>0&&PROF.set.shake){cx+=R(-shake,shake);cy+=R(-shake,shake)}
  cx=Math.round(cx);cy=Math.round(cy);
  drawSky(g,cx,cy);
  if(fg){if(!LW||LW.width!==VW||LW.height!==VH){LW=mk(VW,VH);LWg=LW.getContext('2d');LM=mk(VW,VH);LMg=LM.getContext('2d')}
    LWg.clearRect(0,0,VW,VH);LWg.imageSmoothingEnabled=false;
    drawWorld(LWg,cx,cy);if(player)drawEnts(LWg,cx,cy);drawParts(LWg,cx,cy);
    const box=buildLight(cx,cy);applyLight(LW,LMg,box);g.drawImage(LW,0,0);drawEmissive(g);
    drawGlowPass(g,cx,cy,box);drawAtmos(g,cx,cy);drawOverlays(g,cx,cy);
    if(state==='play'&&hoverTile&&!panelBlocks()){g.strokeStyle='rgba(255,236,170,.75)';g.lineWidth=1;g.strokeRect(hoverTile.tx*T-cx+.5,hoverTile.ty*T-cy+.5,T-1,T-1)}
    // nombres flottants : petit saut à l'apparition, puis fondu
    for(const f of floats){const age=1-f.t,hop=age<.15?Math.sin(age/.15*Math.PI)*3:0;g.globalAlpha=clamp(f.t*2,0,1);wtxt(g,f.s,Math.round(f.x-cx+(f.dx||0)*age*14),Math.round(f.y-cy-hop),f.col,f.big?14:7)}g.globalAlpha=1}
  // opacité et mode remis à zéro : un globalAlpha laissé par le HUD de l'image précédente fondait le monde sur l'ancienne image (traînée floue en mouvement)
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.imageSmoothingEnabled=false;ctx.drawImage(wc,0,0,VW*S,VH*S);
  if(PROF.set.crt)drawCRT();
  ctx.setTransform(S,0,0,S,0,0);
  uiHits=[];
  if(state==='play')drawHUD(cx,cy);else if(state==='title')drawTitle();else drawEnd();
  if(pressFx){const k=(performance.now()-pressFx.t)/180;if(k>=1)pressFx=null;else{ctx.globalAlpha=(1-k)*.45;ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(pressFx.x)+1,Math.round(pressFx.y)+1,Math.round(pressFx.w)-2,Math.round(pressFx.h)-2);ctx.globalAlpha=1}}
  drawAch();
  if(padHit&&padMenu())drawPadFocus(padHit);
  if(fade>0){ctx.fillStyle=`rgba(5,5,12,${clamp(fade,0,1)})`;ctx.fillRect(0,0,VW,VH)}
  drawCursor();
}

// =====================================================================
//  INTERFACE
// =====================================================================
let uiHits=[];
const VERSION='1.2.0';
const COL={panel:'#05050cee',panel2:'#05050c',edge:'#e8ecff8c',gold:'#ffe066',txt:'#e4e9ff',dim:'#a0a4be',blue:'#4f9df5',red:'#e5534b',ok:'#63ebca'};
// Tiny local bitmap alphabet: integer pixels, independent of downloaded fonts.
const UI_GLYPHS={
 A:['010','101','111','101','101'],B:['110','101','110','101','110'],C:['011','100','100','100','011'],D:['110','101','101','101','110'],E:['111','100','110','100','111'],F:['111','100','110','100','100'],G:['011','100','101','101','011'],H:['101','101','111','101','101'],I:['111','010','010','010','111'],J:['001','001','001','101','010'],K:['101','101','110','101','101'],L:['100','100','100','100','111'],M:['10001','11011','10101','10101','10101'],N:['1001','1101','1011','1001','1001'],O:['010','101','101','101','010'],P:['110','101','110','100','100'],Q:['010','101','101','011','001'],R:['110','101','110','101','101'],S:['011','100','010','001','110'],T:['111','010','010','010','010'],U:['101','101','101','101','111'],V:['101','101','101','101','010'],W:['10101','10101','10101','11011','10001'],X:['101','101','010','101','101'],Y:['101','101','010','010','010'],Z:['111','001','010','100','111'],
 '0':['111','101','101','101','111'],'1':['010','110','010','010','111'],'2':['110','001','010','100','111'],'3':['110','001','010','001','110'],'4':['101','101','111','001','001'],'5':['111','100','110','001','110'],'6':['011','100','111','101','111'],'7':['111','001','010','010','010'],'8':['111','101','111','101','111'],'9':['111','101','111','001','110'],
 ' ':['00','00','00','00','00'],'.':['0','0','0','0','1'],',':['00','00','00','01','10'],':':['0','1','0','1','0'],"'":['1','1','0','0','0'],'-':['000','000','111','000','000'],'/':['001','001','010','100','100'],'+':['000','010','111','010','000'],'×':['000','101','010','101','000'],'·':['0','0','1','0','0'],'!':['1','1','1','0','1'],'?':['110','001','010','000','010'],'%':['101','001','010','100','101'],'(':['01','10','10','10','01'],')':['10','01','01','01','10'],'…':['00000','00000','00000','00000','10101'],'★':['00100','11111','01110','11111','10001'],'☆':['00100','11011','10001','01010','10001'],'◇':['00100','01010','10001','01010','00100'],'←':['00100','01000','11111','01000','00100'],'→':['00100','00010','11111','00010','00100'],'↑':['010','111','010','010','010'],'◀':['001','011','111','011','001'],'▶':['100','110','111','110','100'],'▲':['00100','01110','11111','00000','00000'],'▼':['00000','00000','11111','01110','00100'],'=':['000','111','000','111','000']
};
// Accent rows sit above the unchanged five-pixel body; panel lines are at least nine pixels apart.
const UI_ACCENTS={É:['001','010'],È:['100','010'],Ê:['010','101'],Ë:['101','000'],À:['100','010'],Â:['010','101'],Ô:['010','101'],Î:['010','101'],Ï:['101','000'],Ù:['100','010'],Û:['010','101']};
for(const [c,rows]of Object.entries(UI_ACCENTS))UI_GLYPHS[c]=[...rows,...UI_GLYPHS[c.normalize('NFD')[0]]];
UI_GLYPHS['Ç']=[...UI_GLYPHS.C,'001','010'];
UI_GLYPHS['Œ']=['01111','10100','10110','10100','01111'];
function uiLetters(s){return [...String(tr(s)).toUpperCase().normalize('NFC')].map(c=>UI_GLYPHS[c]?c:c.normalize('NFD').replace(/[\u0300-\u036f]/g,'')).join('')}
function uiScale(size){return Math.max(1,Math.floor(size/7))}
function uiWidth(s,size=8){const z=uiScale(size);return Math.max(0,[...uiLetters(s)].reduce((n,c)=>n+(UI_GLYPHS[c]||UI_GLYPHS['?'])[0].length+1,0)-1)*z}
function uiFit(s,width,size=8){s=tr(s);if(uiWidth(s,size)<=width)return s;let t=String(s);while(t&&uiWidth(t+'…',size)>width)t=t.slice(0,-1);return t+'…'}
// TXC : toile cible (le HUD par défaut, la couche monde pour les nombres flottants)
let TXC=null;
function txt(s,x,y,col=COL.txt,size=8,align='left'){const g=TXC||ctx,z=uiScale(size),width=uiWidth(s,size);x=Math.round(x-(align==='center'?width/2:align==='right'?width:0));y=Math.round(y);g.fillStyle=col;
  for(const c of uiLetters(s)){const glyph=UI_GLYPHS[c]||UI_GLYPHS['?'];for(let j=0;j<glyph.length;j++)for(let i=0;i<glyph[j].length;i++)if(glyph[j][i]==='1')g.fillRect(x+i*z,y+(j-(UI_ACCENTS[c]?2:0))*z,z,z);x+=(glyph[0].length+1)*z}}
function wtxt(g,s,x,y,col,size=7,align='center'){TXC=g;txt(s,x+1,y+1,'#05050c',size,align);txt(s,x,y,col,size,align);TXC=null}
// cadre pixel : contour encre, coins coupés, liseré, biseau (clair en haut/gauche, sombre en bas/droite), ombre dure
function cutRect(x,y,wd,ht,c){ctx.fillRect(x+c,y,wd-2*c,ht);for(let i=0;i<c;i++)ctx.fillRect(x+i,y+c-i,wd-2*i,ht-2*(c-i))}
function box(x,y,wd,ht,fill=COL.panel,edge=COL.edge){x=Math.round(x);y=Math.round(y);wd=Math.round(wd);ht=Math.round(ht);if(wd<6||ht<6){ctx.fillStyle=fill;ctx.fillRect(x,y,wd,ht);return}
  ctx.fillStyle='#00000070';ctx.fillRect(x+2,y+ht,wd-3,1);ctx.fillRect(x+wd,y+2,1,ht-3);
  ctx.fillStyle='#05050c';cutRect(x,y,wd,ht,2);
  ctx.fillStyle=fill;ctx.fillRect(x+2,y+2,wd-4,ht-4);
  ctx.fillStyle=edge;ctx.fillRect(x+2,y+1,wd-4,1);ctx.fillRect(x+2,y+ht-2,wd-4,1);ctx.fillRect(x+1,y+2,1,ht-4);ctx.fillRect(x+wd-2,y+2,1,ht-4);
  if(ht>9){ctx.fillStyle='#ffffff20';ctx.fillRect(x+2,y+2,wd-4,1);ctx.fillStyle='#ffffff0e';ctx.fillRect(x+2,y+3,1,ht-6);ctx.fillStyle='#00000066';ctx.fillRect(x+2,y+ht-3,wd-4,1);ctx.fillStyle='#00000040';ctx.fillRect(x+wd-3,y+3,1,ht-6)}
  if(wd>40&&ht>30){ctx.fillStyle=edge;for(const[cx,cy]of[[x+3,y+3],[x+wd-4,y+3],[x+3,y+ht-4],[x+wd-4,y+ht-4]])ctx.fillRect(cx,cy,1,1)}}
// bandeau de titre des panneaux
function panelHead(x,y,W,s,col,left=false){ctx.fillStyle=col+'22';ctx.fillRect(x+3,y+3,W-6,16);ctx.fillStyle=col+'70';ctx.fillRect(x+3,y+19,W-6,1);ctx.fillStyle='#05050c';ctx.fillRect(x+3,y+20,W-6,1);if(!left){ctx.fillStyle=col;for(const ex of[x+6,x+W-8])ctx.fillRect(ex,y+10,2,2)}txt(uiFit(s,W-60,14),left?x+8:x+W/2,y+5,col,14,left?'left':'center')}
// texte du HUD posé sur le monde : ombre d'un pixel pour rester lisible sur le ciel clair
function stxt(s,x,y,col,size=7,align='left'){txt(s,x+1,y+1,'#05050cd0',size,align);txt(s,x,y,col,size,align)}
// encart sombre derrière un groupe d'infos du HUD
function plate(x,y,wd,ht){x=Math.round(x);y=Math.round(y);ctx.fillStyle='#05050c9c';ctx.fillRect(x+2,y,wd-4,1);ctx.fillRect(x+1,y+1,wd-2,1);ctx.fillRect(x,y+2,wd,ht-4);ctx.fillRect(x+1,y+ht-2,wd-2,1);ctx.fillRect(x+2,y+ht-1,wd-4,1);ctx.fillStyle='#e8ecff1c';ctx.fillRect(x+2,y+1,wd-4,1);ctx.fillStyle='#00000040';ctx.fillRect(x+2,y+ht-2,wd-4,1)}
function button(x,y,wd,ht,label,fn,on=true,hot=false){const hov=mouse.inside&&mouse.x>=x&&mouse.x<x+wd&&mouse.y>=y&&mouse.y<y+ht,dn=on&&hov&&mouse.l?1:0;
  box(x,y+dn,wd,ht-dn,!on?'#0a0b16ee':hot?(hov?'#2f4a86f2':'#22386cf0'):hov?'#1e2546f2':'#11152cf0',on?(hov||hot?'#ffffff':COL.edge):'#e8ecff25');
  if(on&&!dn){ctx.fillStyle='#05050c';ctx.fillRect(Math.round(x)+2,Math.round(y+ht),Math.round(wd)-4,1)}
  if(hot&&on){ctx.fillStyle=Math.sin(time*4)>0?'#ffffff':COL.gold;ctx.fillRect(Math.round(x)+3,Math.round(y+dn)+3,1,1)}
  txt(uiFit(label,wd-4),x+wd/2,y+dn+(ht-6)/2,on?COL.txt:COL.dim,8,'center');uiHits.push({x,y,w:wd,h:ht,fn:on?fn:()=>sfx.deny()})}
function costLine(c,x,y,st){let cx=x;for(const[k,v]of Object.entries(c)){const okk=(st[k]||0)>=v;ctx.drawImage(ICON[k],Math.round(cx),Math.round(y)-2,8,8);txt(''+v,cx+9,y,okk?COL.txt:'#ff6fae',7);cx+=9+uiWidth(''+v,7)+4}return cx}
function bar(x,y,wd,ht,f,col,back='#05050c'){x=Math.round(x);y=Math.round(y);wd=Math.round(wd);ctx.fillStyle=back;ctx.fillRect(x,y,wd,ht);ctx.fillStyle='#e8ecff22';ctx.fillRect(x,y,wd,ht);ctx.fillStyle=col;ctx.fillRect(x,y,Math.floor(wd*clamp(f,0,1)),ht)}
// barre de PV d'un cœur : cadre sombre, reflet clair, blanc quand il vient d'être frappé
function coreBar(x,y,wd,f,col,hi,hit){x=Math.round(x);y=Math.round(y);wd=Math.round(wd);const fw=Math.floor((wd-2)*clamp(f,0,1));ctx.fillStyle='#05050c';ctx.fillRect(x,y,wd,5);ctx.fillStyle='#e8ecff20';ctx.fillRect(x+1,y+1,wd-2,3);
  ctx.fillStyle=hit>0?'#ffffff':col;ctx.fillRect(x+1,y+1,fw,3);ctx.fillStyle=hi;if(fw>1)ctx.fillRect(x+1,y+1,fw,1);if(f<.25&&f>0&&Math.sin(time*8)>0){ctx.fillStyle='#ffffff55';ctx.fillRect(x+1,y+1,fw,3)}}
const coreHp={},coreHit={};
function uiCore(x,y,col){ctx.fillStyle=col;ctx.fillRect(x+2,y,3,1);ctx.fillRect(x+1,y+1,5,5);ctx.fillRect(x+2,y+6,3,1);ctx.fillStyle='#05050c';ctx.fillRect(x+3,y+2,1,3)}

function panelBlocks(){if(!mouse.inside||paused)return true;for(const h of uiHits)if(mouse.x>=h.x&&mouse.x<h.x+h.w&&mouse.y>=h.y&&mouse.y<h.y+h.h)return true;if(panel&&panelRect&&mouse.x>=panelRect.x&&mouse.x<panelRect.x+panelRect.w&&mouse.y>=panelRect.y&&mouse.y<panelRect.y+panelRect.h)return true;return false}
let panelRect=null,resTip=null;
function wrapLines(s,maxW,size){const out=[];let cur='';for(const wd of String(tr(s)).split(' ')){const t=cur?cur+' '+wd:wd;if(uiWidth(t,size)>maxW&&cur){out.push(cur);cur=wd}else cur=t}if(cur)out.push(cur);return out}
let HL={touchY:0},resPrev={},resPop={},selPrev=0,selT=0,pressFx=null;
// HUD adaptatif : disposition « large » (ordinateur, paysage) ou « étroite » (téléphone en portrait)
const HEART=['.XX.XX.','XXXXXXX','XXXXXXX','.XXXXX.','..XXX..','...X...'];
function heart(x,y,f){for(let j=0;j<6;j++)for(let i=0;i<7;i++)if(HEART[j][i]==='X'){const full=i<7*f;ctx.fillStyle=full?(j===1&&i<3&&i>0?'#ffc2dc':'#ff6fae'):'#2a2346';ctx.fillRect(x+i,y+j,1,1)}}
// ==== HUD : utilitaires propres (cadre encre, cœurs, cristaux, cases, boutons) — ne pas confondre avec box/button des menus
let resGain={};
// cadre : contour encre à coins coupés, fond nuit translucide, arête claire en haut à gauche, sombre en bas à droite
function hudFrame(x,y,w,h,accent,bg='#0b0c1ae0'){x=Math.round(x);y=Math.round(y);w=Math.round(w);h=Math.round(h);
  ctx.fillStyle=INK;ctx.fillRect(x+1,y,w-2,1);ctx.fillRect(x+1,y+h-1,w-2,1);ctx.fillRect(x,y+1,1,h-2);ctx.fillRect(x+w-1,y+1,1,h-2);
  ctx.fillStyle=bg;ctx.fillRect(x+1,y+1,w-2,h-2);
  ctx.fillStyle='#e8ecff2a';ctx.fillRect(x+2,y+1,w-4,1);ctx.fillRect(x+1,y+2,1,h-4);
  ctx.fillStyle='#00000070';ctx.fillRect(x+2,y+h-2,w-4,1);ctx.fillRect(x+w-2,y+2,1,h-4);
  if(accent){ctx.fillStyle=accent;ctx.fillRect(x+2,y+h-2,w-4,1);ctx.fillRect(x+1,y+1,1,1);ctx.fillRect(x+w-2,y+1,1,1)}}
// petit dessin en pixels avec contour encre : chaque lettre du masque renvoie à une couleur
function hudPix(m,x,y,cols){x=Math.round(x);y=Math.round(y);ctx.fillStyle=INK;for(let j=0;j<m.length;j++)for(let i=0;i<m[j].length;i++)if(m[j][i]!=='.')ctx.fillRect(x+i-1,y+j-1,3,3);
  for(let j=0;j<m.length;j++)for(let i=0;i<m[j].length;i++){const c=cols[m[j][i]];if(c){ctx.fillStyle=c;ctx.fillRect(x+i,y+j,1,1)}}}
const HUD_HEART=['.ab.ab.','awbbbbc','abbbbbc','.bbbbc.','..bcc..','...c...'],HUD_SUN=['a.a.a','.bbb.','abwba','.bbb.','a.a.a'],HUD_MOON=['.aa..','aw...','ab...','ab...','.aa..'];
// cœur 9x8 : rampe de rose (reflet, plein, ombre) ou vide violet nuit, contour encre
function hudHeart(x,y,f){x=Math.round(x);y=Math.round(y);ctx.fillStyle=INK;
  for(let j=0;j<6;j++)for(let i=0;i<7;i++)if(HUD_HEART[j][i]!=='.')ctx.fillRect(x+i,y+j,3,3);
  for(let j=0;j<6;j++)for(let i=0;i<7;i++){const c=HUD_HEART[j][i];if(c==='.')continue;const full=i<7*f;
    ctx.fillStyle=full?{a:'#ffc2dc',w:'#ffffff',b:'#ff6fae',c:'#b8326e'}[c]:(c==='a'||c==='w'?'#5a4c8c':c==='b'?'#43386e':'#352b58');ctx.fillRect(x+1+i,y+1+j,1,1)}}
function hudSky(x,y,night){if(night){halo(ctx,x+2,y+2,'#9fb4ff',7,.4);hudPix(HUD_MOON,x,y,{a:'#c8d0ff',w:'#ffffff',b:'#8a94d8'})}
  else{halo(ctx,x+2,y+2,'#ffd34a',8,.45);hudPix(HUD_SUN,x,y,{a:'#ffb84a',b:'#ffd34a',w:'#fff6c8'})}}
// cristal de cœur 7x7 (contour encre, face claire à gauche, sombre à droite), blanc quand il est frappé
function hudCrystal(x,y,col,hit){x=Math.round(x);y=Math.round(y);halo(ctx,x+3,y+3,col,10+hit*6,.35+hit*.4);
  const lt=hit>0?'#ffffff':shade(col,.45),dk=hit>0?'#ffffff':shade(col,-.4),md=hit>0?'#ffffff':col;
  hudPix(['...w...','..lmd..','.llmdd.','llmmmdd','.lmmdd.','..lmd..','...d...'],x,y,{w:'#ffffff',l:lt,m:md,d:dk})}
// barre de PV de 7 px : contour encre, reflet, plein, ombre ; clignote en blanc sous 25 %
function hudBar(x,y,w,f,col,hit){x=Math.round(x);y=Math.round(y);w=Math.round(w);const fw=Math.floor((w-2)*clamp(f,0,1));
  ctx.fillStyle=INK;ctx.fillRect(x+1,y,w-2,1);ctx.fillRect(x+1,y+6,w-2,1);ctx.fillRect(x,y+1,1,5);ctx.fillRect(x+w-1,y+1,1,5);
  ctx.fillStyle='#1a1530';ctx.fillRect(x+1,y+1,w-2,5);ctx.fillStyle='#2a2346';ctx.fillRect(x+1,y+1,w-2,1);
  if(fw>0){if(hit>0){ctx.fillStyle='#ffffff';ctx.fillRect(x+1,y+1,fw,5)}else{ctx.fillStyle=shade(col,.5);ctx.fillRect(x+1,y+1,fw,1);ctx.fillStyle=col;ctx.fillRect(x+1,y+2,fw,3);ctx.fillStyle=shade(col,-.45);ctx.fillRect(x+1,y+5,fw,1);ctx.fillStyle=INK;ctx.fillRect(x+1+fw-1,y+1,1,5);ctx.fillStyle=shade(col,.5);ctx.fillRect(x+fw-1,y+2,1,3)}
    if(f<.25&&Math.sin(time*8)>0){ctx.fillStyle='#ffffff55';ctx.fillRect(x+1,y+1,fw,5)}}
  ctx.fillStyle='#00000055';for(const q of[.25,.5,.75])ctx.fillRect(x+1+Math.round((w-2)*q),y+4,1,2)}
// case de la barre d'objets : contour encre, biseau intérieur ; la case choisie passe en or
function hudSlot(x,y,s,on){x=Math.round(x);y=Math.round(y);hudFrame(x,y,s,s,null,on?'#2a2310ee':'#0b0c1ae0');
  ctx.fillStyle=on?COL.gold:'#e8ecff1c';ctx.fillRect(x+2,y+2,s-4,1);ctx.fillRect(x+2,y+3,1,s-5);
  ctx.fillStyle=on?'#b8862a':'#00000060';ctx.fillRect(x+3,y+s-3,s-5,1);ctx.fillRect(x+s-3,y+3,1,s-6)}
// bouton du HUD en pierre bleu nuit (même contrat que button : uiHits, enfoncement au clic)
function hudBtn(x,y,w,h,label,fn,hot){x=Math.round(x);y=Math.round(y);const hov=mouse.inside&&mouse.x>=x&&mouse.x<x+w&&mouse.y>=y&&mouse.y<y+h,dn=hov&&mouse.l?1:0;
  if(!dn){ctx.fillStyle='#00000080';ctx.fillRect(x+1,y+h,w-2,1)}
  hudFrame(x,y+dn,w,h-dn,hot?(Math.sin(time*4)>0?COL.gold:'#b8862a'):null,hot?(hov?'#3a3016f0':'#272110ec'):hov?'#1f2750f0':'#141a36e6');
  txt(uiFit(label,w-4),x+w/2,y+dn+(h-6)/2,hot?COL.gold:COL.txt,8,'center');uiHits.push({x,y,w,h,fn})}
// pictos des commandes tactiles (a clair, b ombre, w reflet), dessinés par hudPix
const HUD_I={menu:['aaaaaaaaa','bbbbbbbbb','.........','aaaaaaaaa','bbbbbbbbb','.........','aaaaaaaaa','bbbbbbbbb'],
  base:['a.a...a.a','aaa...aaa','awa.a.aab','aaaaaaaab','awaaaaaab','aaa...aab','aaa...aab','bbb...bbb'],
  forge:['wwaaaaaaa','.aaaaaaab','..aaaaab.','....aab..','....aab..','...aaaab.','..abbbbbb'],
  bag:['..b...b..','...bbb...','...aaa...','.aaaaaaa.','awaaaaaab','aaaaaaaab','aaaaaaaab','.abbbbbb.'],
  attack:['.......wa','......wab','.....wab.','a...wab..','.a.wab...','..aab....','.bba.....','bb..a....','b........'],
  defend:['.aaaaaaa.','awaabaaab','awaabaaab','abbbbbbbb','awaabaaab','.aaabaab.','..aabab..','...abb...','....b....'],
  follow:['aa...aa...','.aa...aa..','..aa...aa.','...aa...aa','..ab...ab.','.ab...ab..','ab...ab...'],
  hold:['.b.......','.bwaaaaa.','.baaaaaab','.baaaaab.','.baaab...','.b.......','.b.......','.b.......','bbb......']}; // fanion de l'ordre Tenir
// bouton carré à picto (même pierre et même contrat que hudBtn), pour les écrans tactiles
function hudIconBtn(x,y,s,icon,fn,hot){x=Math.round(x);y=Math.round(y);const hov=mouse.inside&&mouse.x>=x&&mouse.x<x+s&&mouse.y>=y&&mouse.y<y+s,dn=hov&&mouse.l?1:0;
  if(!dn){ctx.fillStyle='#00000080';ctx.fillRect(x+1,y+s,s-2,1)}
  hudFrame(x,y+dn,s,s-dn,hot?(Math.sin(time*4)>0?COL.gold:'#b8862a'):null,hot?(hov?'#3a3016f0':'#272110ec'):hov?'#1f2750f0':'#141a36e6');
  if(hot)halo(ctx,x+s/2,y+s/2,COL.gold,s*.6,.15);
  hudPix(icon,x+Math.floor((s-icon[0].length)/2),y+dn+Math.floor((s-icon.length)/2),hot?{a:COL.gold,b:'#b8862a',w:'#fff6c8'}:{a:'#c8d6ff',b:'#6f7bb8',w:'#ffffff'});
  uiHits.push({x,y,w:s,h:s,fn})}
// scintillement d'un pixel sur les minerais (éclats) : petite croix additive qui naît et s'éteint
function hudGlint(x,y,seed,size=10){const t=time*1.6+seed*1.37,s=Math.floor(t),ph=t-s;if(hash2(s,seed)>.6)return;
  const px=Math.round(x+2+hash2(s,seed+7)*(size-5)),py=Math.round(y+2+hash2(s,seed+9)*(size-5)),a=Math.sin(ph*Math.PI);
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle='#ffffff';ctx.globalAlpha=a;ctx.fillRect(px,py,1,1);ctx.globalAlpha=a*.45;ctx.fillRect(px-1,py,1,1);ctx.fillRect(px+1,py,1,1);ctx.fillRect(px,py-1,1,1);ctx.fillRect(px,py+1,1,1);ctx.restore()}
// Rotate the arrow's pixel mask, then snap each output pixel to the UI grid.
function drawObjPointer(cx,cy,hudBottom,bottom){
  if(!objTgt||state!=='play'||panel||paused||menuPanel)return;
  const col=objTgt.kind==='base'?COL.blue:objTgt.kind==='ore'?ORE[COPPER][1]:COL.red;
  const sx=objTgt.x-cx,sy=objTgt.y-cy,pulse=.75+.2*Math.sin(time*3);
  const left=14,right=VW-14,top=Math.max(14,hudBottom+14);
  let floor=Math.min(VH-14,HL.barTop-14,bottom-14);
  if(isTouch)for(const b of touchBtns)floor=Math.min(floor,b.y-14);
  if(floor<=top)return;
  ctx.save();
  // HUD-covered targets use the edge guide too, so the marker stays readable.
  if(sx>=left&&sx<=right&&sy>=top+16&&sy<=floor){
    const x=Math.round(sx),y=Math.round(sy-12+Math.sin(time*2.5)*2);
    halo(ctx,x,y,col,12,.45*pulse);ctx.globalAlpha=1;
    ctx.fillStyle=COL.panel2;ctx.fillRect(x-4,y-2,9,3);ctx.fillRect(x-3,y+1,7,2);ctx.fillRect(x-1,y+3,3,2);
    ctx.fillStyle=col;ctx.fillRect(x-3,y-1,2,2);ctx.fillRect(x+2,y-1,2,2);ctx.fillRect(x-1,y+1,3,2);ctx.fillRect(x,y+3,1,1);
  }else{
    const mx=(left+right)/2,my=(top+floor)/2,dx=sx-mx,dy=sy-my;
    const k=Math.min(dx?((right-left)/2)/Math.abs(dx):Infinity,dy?((floor-top)/2)/Math.abs(dy):Infinity);
    const x=Math.round(mx+dx*k),y=Math.round(my+dy*k),angle=Math.atan2(dy,dx),c=Math.cos(angle),s=Math.sin(angle);
    halo(ctx,x,y,col,14,.55*pulse);ctx.globalAlpha=pulse;
    // A right-facing arrow, inverse-rasterized without antialiased canvas rotation.
    for(let j=-5;j<=5;j++)for(let i=-5;i<=5;i++){
      const u=Math.round(i*c+j*s),v=Math.round(-i*s+j*c);
      if((u>=-4&&u<=0&&Math.abs(v)<=1)||(u>=0&&u<=4&&Math.abs(v)<=4-u)){
        ctx.fillStyle=COL.panel2;ctx.fillRect(x+i-1,y+j-1,3,3)}}
    ctx.fillStyle=col;
    for(let j=-5;j<=5;j++)for(let i=-5;i<=5;i++){
      const u=Math.round(i*c+j*s),v=Math.round(-i*s+j*c);
      if((u>=-4&&u<=0&&Math.abs(v)<=1)||(u>=0&&u<=4&&Math.abs(v)<=4-u))ctx.fillRect(x+i,y+j,1,1)}
    ctx.globalAlpha=1;
    const label=''+Math.round(Math.hypot(objTgt.x-player.x-player.w/2,objTgt.y-player.y-player.h/2)/T);
    const lx=clamp(x-c*17,14+uiWidth(label,7)/2,VW-14-uiWidth(label,7)/2),ly=clamp(y-s*17-2,top,floor-5);
    ctx.fillStyle=COL.panel;ctx.fillRect(Math.round(lx-uiWidth(label,7)/2)-2,Math.round(ly)-2,uiWidth(label,7)+4,9);
    txt(label,lx,ly,col,7,'center');
  }
  ctx.restore();
}
function drawHUD(cx=cam.x,cy=cam.y){
  const p=player,b0=bases[0],b1=bases[1],narrow=VW<430;if(p.sel!==selPrev){selPrev=p.sel;selT=time;sfx.click()}
  const al=ents.filter(e=>e.type==='unit'&&e.team===0&&!e.dead).length,en=ents.filter(e=>e.type==='unit'&&e.team===1&&!e.dead).length;
  // héros
  const heroW=narrow?Math.min(124,Math.floor(VW*.44)):112;
  {const n=Math.max(1,Math.round(p.maxhp/10)),f=p.dead?0:p.hp/p.maxhp*n,lowp=!p.dead&&p.hp<p.maxhp*.3,beat=lowp?Math.pow(Math.max(0,Math.sin(time*5)),6):0;
   const pw=Math.max(n*8+10,98),ph=p.dead||p.recall>0?34:27;if(lowp)halo(ctx,4+pw/2,4+ph/2,'#ff3050',pw*.7,.12+beat*.3);
   hudFrame(4,4,pw,ph,lowp?(beat>.3?'#ff3050':'#8a1a30'):'#ff6fae55');
   for(let i=0;i<n;i++)hudHeart(7+i*8,6+(lowp&&Math.sin(time*8-i*.6)>.6?-1:0)+(hurtFx>.6&&i===Math.floor(f)?Math.round(R(-1,1)):0),clamp(f-i,0,1));
   const night=daylight()<.3;hudSky(9,18,night);stxt((night?'Nuit ':'Jour ')+(Math.floor(time/dayLen)+1),17,18,night?'#b9c0ff':'#ffe9a8',7);
   // PV en chiffres à droite du jour : rose, rouge clignotant quand la vie est basse
   if(!p.dead)stxt(Math.ceil(p.hp)+'/'+p.maxhp,4+pw-5,18,lowp?(beat>.3?'#ffffff':'#ff5070'):'#ffa8cc',7,'right');
   if(p.dead)stxt('Retour dans '+Math.ceil(p.respawn)+' s',8,27,'#ff6fae',7);else if(p.recall>0)stxt('Rappel dans '+Math.ceil(p.recall)+' s',8,27,'#9fd0ff',7);
   // blessé avec une potion dans le sac : un bouton pour la boire sans changer d'objet (à droite de l'encart)
   if(!p.dead&&p.hp<p.maxhp*.6&&!paused){const k=countItem('potion');if(k){const bx=4+pw+3;hudFrame(bx,4,17,17,lowp&&beat>.3?COL.gold:'#ff6fae88');ctx.drawImage(ICON.potion,bx+2,5,13,13);stxt(''+k,bx+15,13,COL.txt,6,'right');if(!isTouch)stxt('F',bx+3,6,'#ffe9a8',6);uiHits.push({x:bx,y:4,w:17,h:17,fn:drinkPotion})}}}
  // minicarte
  // Reserve 50 px below/around the map for cores and two resource rows.
  const mapH=narrow?Math.max(6,Math.min(41,Math.floor(VH*.22)-50)):0;
  const mw=narrow?Math.min(VW-heroW-16,120,Math.floor(mapH*WW/WH)):Math.min(176,Math.floor(VW*.28)),mh=Math.round(mw*WH/WW),mx=VW-mw-6,my=6;
  hudFrame(mx-3,my-3,mw+6,mh+6,null,'#05050cf0');ctx.imageSmoothingEnabled=false;ctx.drawImage(mmC,mx,my,mw,mh);
  const sc=mw/(WW*T);
  // voile sombre : la carte passe derrière les repères ; cadre de vue aligné au pixel, coins en L clairs
  ctx.fillStyle='#05050c40';ctx.fillRect(mx,my,mw,mh);
  {const vx=Math.round(mx+cam.x*sc),vy=Math.round(my+cam.y*sc),vw=Math.max(4,Math.round(VW*sc)),vh=Math.max(3,Math.round(VH*sc)),r=vx+vw-1,b2=vy+vh-1;
   ctx.save();ctx.beginPath();ctx.rect(mx,my,mw,mh);ctx.clip();ctx.fillStyle='#ffe9a850';ctx.fillRect(vx,vy,vw,1);ctx.fillRect(vx,b2,vw,1);ctx.fillRect(vx,vy,1,vh);ctx.fillRect(r,vy,1,vh);
   ctx.fillStyle='#ffe9a8';ctx.fillRect(vx,vy,3,1);ctx.fillRect(vx,vy,1,3);ctx.fillRect(r-2,vy,3,1);ctx.fillRect(r,vy,1,3);ctx.fillRect(vx,b2,3,1);ctx.fillRect(vx,b2-2,1,3);ctx.fillRect(r-2,b2,3,1);ctx.fillRect(r,b2-2,1,3);ctx.restore()}
  // repères : unités en 2x2 cerclées d'encre, cœurs en losange, joueur blanc qui clignote
  const mmDot=(x,y,col,z)=>{x=Math.round(x-z/2);y=Math.round(y-z/2);ctx.fillStyle=INK;ctx.fillRect(x-1,y-1,z+2,z+2);ctx.fillStyle=col;ctx.fillRect(x,y,z,z)};
  for(const e of ents){if(e.dead||(e.type!=='unit'&&e.type!=='monster'))continue;mmDot(mx+(e.x+e.w/2)*sc,my+(e.y+e.h/2)*sc,e.team===0?'#7fb8ff':e.team===1?'#ff6a60':e.boss?'#ff6fae':'#7ddf6a',e.boss?3:2)}
  if(b0.order==='hold'&&b0.holdX!=null){const fx=Math.round(mx+b0.holdX*sc),fy=Math.round(my+surf[clamp(Math.floor(b0.holdX/T),0,WW-1)]*T*sc);ctx.fillStyle=INK;ctx.fillRect(fx-1,fy-6,3,7);ctx.fillRect(fx,fy-6,4,4);ctx.fillStyle='#ffffff';ctx.fillRect(fx,fy-5,1,5);ctx.fillStyle='#7fb8ff';ctx.fillRect(fx+1,fy-5,2,2)}
  for(const t of[0,1]){const c=bases[t].core;if(!c||c.dead)continue;const x=Math.round(mx+(c.x+c.w/2)*sc),y=Math.round(my+(c.y+c.h/2)*sc);
   ctx.fillStyle=INK;ctx.fillRect(x-1,y-4,3,9);ctx.fillRect(x-4,y-1,9,3);ctx.fillRect(x-2,y-3,5,7);ctx.fillRect(x-3,y-2,7,5);
   ctx.fillStyle=t?COL.red:COL.blue;ctx.fillRect(x,y-3,1,7);ctx.fillRect(x-3,y,7,1);ctx.fillRect(x-1,y-2,3,5);ctx.fillRect(x-2,y-1,5,3);ctx.fillStyle='#ffffffcc';ctx.fillRect(x-1,y-1,1,1)}
  if(!player.dead){const x=mx+(player.x+player.w/2)*sc,y=my+(player.y+player.h/2)*sc,on=Math.sin(time*7)>-.4;if(on)halo(ctx,x,y,'#ffffff',6,.35);mmDot(x,y,on?'#ffffff':'#ffe9a8',3)}
  // barres des cœurs (+ effectifs)
  let cx0,cw,cy0;const midW=mx-heroW-26;
  if(narrow){cx0=8;cw=VW-16;cy0=my+mh+3}else if(midW>=150){cw=Math.min(240,midW);cx0=Math.round(heroW+12+(midW-cw)/2+4);cy0=4}else{cx0=8;cw=VW-16;cy0=Math.max(42,my+mh+6)}
  for(const t of[0,1]){const h=bases[t].core.hp;if(coreHp[t]!==undefined&&h<coreHp[t])coreHit[t]=time;coreHp[t]=h}
  const hitK=t=>clamp(1-(time-(coreHit[t]||-9))/.35,0,1),shk=t=>hitK(t)>0?Math.round(R(-1,1)):0;
  hudFrame(cx0-4,cy0,cw+8,22,null);
  hudCrystal(cx0+shk(0),cy0+2,COL.blue,hitK(0));hudCrystal(cx0+cw-7+shk(1),cy0+2,COL.red,hitK(1));
  hudBar(cx0+11,cy0+3,cw/2-19,b0.core.hp/b0.core.maxhp,COL.blue,hitK(0));hudBar(cx0+cw/2+8,cy0+3,cw/2-19,b1.core.hp/b1.core.maxhp,COL.red,hitK(1));
  ctx.fillStyle=COL.dim;ctx.fillRect(Math.round(cx0+cw/2),cy0+5,1,2);ctx.fillStyle='#ffffff10';ctx.fillRect(cx0-1,cy0+11,cw+2,1);stxt('TOI · '+al+(al>1?' unités':' unité'),cx0,cy0+13,'#7fb8ff',7);stxt(en+(en>1?' unités':' unité')+' · ENNEMI',cx0+cw,cy0+13,'#ff7a70',7,'right');
  // Read-only enemy intel; measure bitmap text and anchor the strip to the HUD margin.
  const intel=ai?.intel,waveVisible=intel&&['gather','march','defend'].includes(intel.phase),waveGap=waveVisible?6:0;
  if(waveVisible){const gathering=intel.phase==='gather',marching=intel.phase==='march';
    const pulse=Math.sin(time*6)>0,col=gathering?(intel.eta<=30?(pulse?'#ffbd62':'#ff8a54'):COL.red):marching?(intel.front<40&&pulse?'#ff9a8a':COL.red):COL.dim;
    let label=gathering?(intel.danger?'! ':'')+'VAGUE ROUGE  '+intel.have+'/'+intel.need+' · DANS '+intel.eta+' S':marching?'ARMÉE ROUGE EN MARCHE · '+intel.alive+' · '+intel.front+' CASES':"L'ENNEMI SE DÉFEND";
    // barre des cœurs au centre (écran large) : le bandeau se cale dessous, sinon il recouvrirait la minicarte
    const centered=!narrow&&midW>=150,right=centered?cx0+cw:VW-8,padding=18,maxWidth=centered?cw:narrow?VW-152:VW-16;
    if(uiWidth(label,7)>maxWidth-padding)label=gathering?(intel.danger?'! ':'')+'VAGUE '+intel.have+'/'+intel.need+' · DANS '+intel.eta+' S':marching?'EN MARCHE · '+intel.alive+' · '+intel.front+' CASES':label;
    // encore trop large (portrait) : version télégraphique plutôt qu'un texte coupé
    if(uiWidth(label,7)>maxWidth-padding)label=gathering?(intel.danger?'! ':'')+intel.have+'/'+intel.need+' · '+intel.eta+' S':marching?'MARCHE · '+intel.front+' CASES':label;
    label=uiFit(label,maxWidth-padding,7);
    const width=uiWidth(label,7)+padding,x=right-width,y=cy0+25;
    if(intel.phase!=='defend')halo(ctx,x+width/2,y+6,'#e5534b',width*.45,.1+(pulse?.08:0));
    hudFrame(x,y,width,12,intel.phase==='defend'?null:'#e5534b88','#140810e6');
    txt(label,right-5,y+2,col,7,'right');
    if(marching)txt('←',x+3,y+2,col,7);
    else{ctx.fillStyle=INK;ctx.fillRect(x+2,y+1,7,8);ctx.fillStyle=col;ctx.fillRect(x+3,y+2,1,6);ctx.fillRect(x+4,y+2,4,3)}
    if(gathering){const f=intel.need>0?clamp(intel.have/intel.need,0,1):0,bw=width-6;ctx.fillStyle='#2a0e18';ctx.fillRect(x+3,y+9,bw,1);ctx.fillStyle=col;ctx.fillRect(x+3,y+9,Math.round(bw*f),1)}
  }
  // réserve de la base
  let ry;
  // chaque case est touchable : son nom s'affiche dessous (survol à la souris, toucher sur mobile)
  const resCell=(k,x,y,cw)=>{uiHits.push({x:x-1,y:y-1,w:cw,h:11,fn:()=>{resTip={k,t:time+2.5};sfx.place()}});
    if(!isTouch&&mouse.inside&&mouse.x>=x-1&&mouse.x<x-1+cw&&mouse.y>=y-1&&mouse.y<y+10)resTip={k,t:time+.1};
    if(resTip&&resTip.k===k&&time<resTip.t)tipAt={k,x,y:y+11}};
  let tipAt=null;
  for(const k of RES){const v=b0.storage[k];if(resPrev[k]!==undefined&&v>resPrev[k]){const g=resGain[k];resGain[k]={n:(g&&time-g.t<.9?g.n:0)+v-resPrev[k],t:time};resPop[k]=time}resPrev[k]=v}
  const rc=k=>time-(resPop[k]||-9)<.6?(Math.sin(time*20)>0?COL.gold:'#ffffff'):(b0.storage[k]>0?COL.txt:'#6a6488'),rb=k=>time-(resPop[k]||-9)<.25?-1:0;
  // icône de ressource : halo or au gain, scintillement des minerais (cuivre et au-delà), « +n » qui monte au-dessus
  const gains=[],resIcon=(k,i,x,y)=>{const age=time-(resPop[k]||-9);if(age<.6)halo(ctx,x+5,y+5,COL.gold,9,.5*(1-age/.6));ctx.drawImage(ICON[k],x,y+rb(k),10,10);if(i>=3)hudGlint(x,y,i*13);const g=resGain[k];if(g&&time-g.t<.9)gains.push({x:x+5,y,n:g.n,a:time-g.t})};
  if(narrow){ry=cy0+28;hudFrame(4,ry-2,4*32+6,22);RES.forEach((k,i)=>{const x=8+(i%4)*32,y=ry+Math.floor(i/4)*10;resIcon(k,i,x,y);stxt(uiFit(''+b0.storage[k],20,7),x+11,y+2,rc(k),7);resCell(k,x,y,31)});ry+=24}
  else{ry=38;hudFrame(4,ry+1,4*27+7,22);RES.forEach((k,i)=>{const x=8+(i%4)*27,y=ry+5+Math.floor(i/4)*10;resIcon(k,i,x,y-2);stxt(''+b0.storage[k],x+11,y,rc(k),7);resCell(k,x,y-2,26)});ry=cy0+(waveVisible?41:28)}
  for(const g of gains){ctx.globalAlpha=clamp(1-(g.a-.5)/.4,0,1);stxt('+'+g.n,g.x,Math.round(g.y-g.a/.9*4),COL.gold,7,'center');ctx.globalAlpha=1}
  let hudBottom=Math.max(62,my+mh+2,cy0+26,ry);
  // Latest messages only, on small fading bands so the world stays visible.
  const hudTop=hudBottom;
  {const tw=narrow?VW-(isTouch?64:32):Math.max(160,Math.min(300,mx-heroW-24));const tx=narrow?VW/2:(midW>=150?heroW+12+midW/2+4:VW/2);let y=narrow?ry:Math.max(ry,cy0+26),linesLeft=narrow?2:Infinity;
   for(const m of msgs.slice(-2)){ctx.globalAlpha=clamp(m.t,0,1)*.9;const sl=Math.round(Math.max(0,1-(m.d-m.t)*6)*-8);y+=sl;const lines=wrapLines(m.s,tw,7);for(let i=0;i<lines.length&&linesLeft>0;i++,linesLeft--){const l=narrow?uiFit(linesLeft===1?lines.slice(i).join(' '):lines[i],tw,7):lines[i],width=uiWidth(l,7);ctx.fillStyle='#05050cbb';ctx.fillRect(Math.round(tx-width/2)-4,y-2,width+8,9);txt(l,tx,y,COL.txt,7,'center');y+=10}y+=3;ctx.globalAlpha=1}hudBottom=Math.max(hudBottom,y)}
  if(tipAt){const l=IT[tipAt.k].n+' : '+b0.storage[tipAt.k]+' en réserve',w=uiWidth(l,7)+8,x=clamp(tipAt.x-2,2,VW-w-2);box(x,tipAt.y,w,11,'rgba(5,5,12,.95)','#ffffff');txt(l,x+4,tipAt.y+2,COL.txt,7)}
  // bas de l'écran : la barre d'objets seule au centre. Commandes : en texte sur la même ligne (clavier),
  // en pictos sous la minicarte (tactile, paysage) ou en colonne au bord droit (tactile, portrait).
  // Tactile : si la barre tient entre les deux pavés, ceux-ci se calent tout en bas des coins.
  const tm=isTouch?touchMetrics():null,tFree=!!tm&&VW-2*tm.m>=9*22;
  const sw=tFree?Math.min(28,Math.floor((VW-2*tm.m)/9)):Math.min(isTouch?28:20,Math.floor((VW-8)/9)),hy=VH-sw-4,hx=Math.round(VW/2-(9*sw)/2);
  const btns=[['= Menu',34,()=>{paused=true;pauseHelp=false;sfx.place()},false],['◇ Base',40,()=>togglePanel('base'),panel==='base'],['+ Forge',40,()=>togglePanel('craft'),panel==='craft'],['· Sac',34,()=>togglePanel('inv'),panel==='inv'],['→ '+ORDERS[b0.order],52,toggleOrder,b0.order!=='defend']];
  let by=hy,cmdBottom=hudBottom;
  if(isTouch){const bs=VH>=330?24:22,g=3,ic=['menu','base','forge','bag',b0.order],row=!narrow&&5*bs+4*g<=mw+6;
    const x0=row?VW-3-(5*bs+4*g):VW-4-bs,y0=row?my+mh+7:hudTop+4;
    btns.forEach(([,,fn,on],i)=>{const x=row?x0+i*(bs+g):x0,y=row?y0:y0+i*(bs+g);hudIconBtn(x,y,bs,HUD_I[ic[i]],fn,on);if(i===1&&tutHL('base'))drawTutRing(x,y,bs,bs)});
    cmdBottom=row?y0+bs:y0+5*bs+4*g;HL.left=hx;HL.right=hx+9*sw}
  else{btns[1][0]+=' B';btns[2][0]+=' C';btns[3][0]+=' E';btns[4][0]+=' R';btns.slice(1).forEach(b=>b[1]+=8);
    const bw=btns.reduce((a,b)=>a+b[1]+3,0);const same=hx>=bw+12;
    let bx=same?6:Math.round(VW/2-bw/2);by=same?hy-1:hy-sw-4;HL.left=Math.min(bx,hx);HL.right=Math.max(bx+bw,hx+9*sw);
    for(const[l,wd,fn,on]of btns){hudBtn(bx,by,wd,sw,l,fn,on);if(fn===btns[1][2]&&tutHL('base'))drawTutRing(bx,by,wd,sw);bx+=wd+3}}
  for(let i=0;i<9;i++){const x=hx+i*sw,s=p.inv[i],on=i===p.sel;if(on)halo(ctx,x+sw/2-1,hy+sw/2-1,COL.gold,sw*.9,.22);hudSlot(x,hy,sw-2,on);
    if(on){ctx.fillStyle=Math.sin(time*5)>0?'#ffffff':COL.gold;ctx.fillRect(x,hy-2,4,1);ctx.fillRect(x-2,hy,1,4);ctx.fillRect(x+sw-6,hy+sw-1,4,1);ctx.fillRect(x+sw-1,hy+sw-6,1,4)}
    if(s){const bo=on&&time-selT<.2?-Math.round(Math.sin((time-selT)/.2*Math.PI)*3):0;ctx.drawImage(ICON[s.id],Math.round(x+(sw-18)/2),Math.round(hy+(sw-18)/2)+bo,16,16);if(s.n>1)stxt(''+s.n,x+sw-5,hy+sw-11,COL.txt,7,'right')}
    if(sw>=18)txt(''+(i+1),x+2,hy+1,on?COL.gold:COL.dim,6);
    uiHits.push({x,y:hy,w:sw-2,h:sw-2,fn:()=>{p.sel=i}})}
  let top=Math.min(hy,by);HL.barTop=top;
  // portrait tactile : les pavés montent juste au-dessus de la barre, le nom de l'objet et l'objectif passent au-dessus d'eux
  if(tm&&!tFree)top-=6+2*tm.s+tm.g;
  const ss=p.inv[p.sel];if(ss){stxt(IT[ss.id].n,VW/2,top-11,COL.txt,8,'center');top-=12}
  // One-line objective tag; no wide framed banner.
  const ob=tut>=0?{t:TUT[tut].t()+' ('+(tut+1)+'/'+TUT.length+')'}:OBJ[stats.obj];if(ob&&!panel){const label=uiFit(ob.t,tFree?VW-2*tm.m-18:VW-48,7),ow=uiWidth(label,7)+18,ox=Math.round((VW-ow)/2),oy=top-14;
    hudFrame(ox,oy-1,ow,13,'#b8862a');halo(ctx,ox+6,oy+5,COL.gold,7,.25+.15*Math.sin(time*3));hudPix(['..a..','.aba.','abwba','.aba.','..a..'],ox+4,oy+3,{a:'#b8862a',b:COL.gold,w:Math.sin(time*3)>.7?'#ffffff':'#fff2b0'});txt(label,ox+12,oy+3,COL.txt,7);top=oy-4}
  HL.touchY=tm&&!tFree?HL.barTop:top;
  if(isTouch)drawTouch();
  drawObjPointer(cx,cy,Math.max(hudBottom,cmdBottom),top);
  panelRect=null;if(panel){const k=1-Math.pow(1-panelT,3);ctx.save();if(k<1){ctx.globalAlpha=k;ctx.translate(0,Math.round((1-k)*14))}
    if(panel==='base')drawBasePanel();else if(panel==='craft')drawCraftPanel();else if(panel==='inv')drawInvPanel();ctx.restore();
    if(craftFx>0&&panelRect){ctx.globalAlpha=craftFx*1.2;ctx.strokeStyle=COL.gold;ctx.strokeRect(panelRect.x-.5-craftFx*6,panelRect.y-.5-craftFx*6,panelRect.w+craftFx*12,panelRect.h+craftFx*12);ctx.globalAlpha=1}}
  if(paused)drawPause();
}
function drawPadFocus(h){ctx.strokeStyle=COL.gold;ctx.lineWidth=1;ctx.strokeRect(Math.round(h.x)-1.5,Math.round(h.y)-1.5,Math.round(h.w)+3,Math.round(h.h)+3)}
function drawPause(){uiHits=[];ctx.fillStyle='rgba(8,6,16,.72)';ctx.fillRect(0,0,VW,VH);{const t=performance.now()/1000;mmist(VH,VH*.22,t,'#493489',.1);mmotes(8,t,VH*.2,VH)}if(menuPanel)return drawMenuPanel(()=>{menuPanel=null});
  const W=Math.min(VW-16,pauseHelp?300:170),help=isTouch?
    ['Flèches à l\'écran : marcher. ▲ : sauter, nager vers le haut.','Gros bouton : utiliser l\'objet, vise tout seul. ▼ + bouton : creuser dessous.','Toucher le monde : utiliser l\'objet à cet endroit précis.','Barre du bas : choisir un objet. Base : recruter, améliorer, rappel à la base.','Forge : fabriquer outils et armes. Ordre : Assaut, Défense, Tenir ou Suivre.','Blessé : le bouton Potion apparaît sous tes cœurs.']:
    ['Q D ou ← → : marcher. Z, Espace ou ↑ : sauter, nager.','Clic gauche : utiliser l\'objet. Clic droit : miner. Molette : objet.','B : base · C : forge · E : sac · R : ordre · M : son · Échap : menu.','F : boire une potion · H : rappel à la base (3 s sans bouger).'];
  const goal=['But : détruire le cœur rouge à l\'autre bout du monde.','Ton minerai est déposé tout seul à ta base. Les mineurs en rapportent aussi.','La nuit, slimes et zombies sortent. Le champion rouge pille la montagne.','Lune de sang : un ogre marche sur ta base. Abats-le avant l\'aube pour son trésor.'];
  // 2e page : ce que fait chaque unité et chaque ordre (la base n'affiche qu'une ligne par unité)
  const units=['Mineur : creuse et rapporte le minerai. Fuit les pillards vers la tour.','Guerrier : mêlée solide. Archer : tire de loin, recule au contact.','Guérisseur : soigne les alliés proches et reste derrière la ligne.','Golem : colosse lent qui brise tout, idéal contre le cœur.','Tour de guet : tire sur les ennemis proches de ton cœur. Améliore-la à la base.','',
    'Défense : tes troupes tiennent une ligne devant le cœur, sous la tour. 3 d\'entre elles chassent les pillards.','Assaut : l\'armée marche groupée vers le cœur rouge, la mêlée devant.','Tenir : plante un fanion où tu te tiens, tes troupes gardent cette position.','Suivre : tes troupes t\'escortent partout.','Blessées, les unités rentrent se soigner à la base.'];
  const lines=pauseHelp?(pauseHelp===2?units:[...goal,'',...help]).flatMap(l=>l?wrapLines(l,W-16,7):['']):[];
  const H=pauseHelp?30+lines.length*10+24:200,x=Math.round(VW/2-W/2),y=Math.round(VH/2-H/2);
  mbox(x,y,W,H);mhead(x,y,W,pauseHelp===2?'Unités et ordres':pauseHelp?'Aide':'Pause',pauseHelp?'#9fd0ff':COL.gold);
  if(pauseHelp){lines.forEach((l,i)=>txt(l,x+8,y+24+i*10,COL.txt,7));
    mbutton(x+W/2-78,y+H-20,76,15,pauseHelp===2?'← Commandes':'Unités →',()=>{pauseHelp=pauseHelp===2?1:2;sfx.place()});mbutton(x+W/2+2,y+H-20,76,15,'Retour',()=>{pauseHelp=false})}
  else{const bw=W-24,bx=x+12;
    mbutton(bx,y+24,bw,20,'Reprendre',()=>{paused=false},true,false,'hero');
    mbutton(bx,y+48,bw,18,'Réglages',()=>{menuPanel='set';panelT=0;sfx.place()});
    mbutton(bx,y+69,bw,18,'Aide et commandes',()=>{pauseHelp=1});
    mbutton(bx,y+90,bw,18,'Succès '+Object.keys(PROF.ach).length+'/'+ACH.length,()=>{menuPanel='ach';panelT=0;sfx.place()});
    mbutton(bx,y+111,bw,18,'Sauvegarder et quitter',()=>{saveGame();paused=false;panel=null;state='title'});
    // nouvelle partie depuis la pause : second appui pour confirmer, la partie en cours est abandonnée
    {const sx=x+W/2;ctx.fillStyle='#06060f';ctx.fillRect(bx+4,y+134,bw-8,1);ctx.fillStyle='#3c3966';ctx.fillRect(bx+4,y+135,bw-8,1);ctx.fillStyle='#06060f';ctx.fillRect(sx-3,y+132,6,6);ctx.fillStyle='#e5534b';ctx.fillRect(sx-1,y+133,2,4);ctx.fillRect(sx-2,y+134,4,2)}
    const sure=performance.now()-newAskT<3000;mbutton(bx,y+140,bw,18,sure?'Abandonner cette partie ?':'Nouvelle partie',()=>{if(!sure){newAskT=performance.now();sfx.click();return}newAskT=-1e9;try{localStorage.removeItem(SAVE_KEY)}catch(_){}paused=false;panel=null;state='title'},true,sure,'danger');
    txt(daily?'Défi du jour : '+daily.mod.n:surv?'Siège · vague '+(stats.waves+1):'Difficulté '+DIFFS[diff].n,x+W/2,y+164,daily?COL.gold:COL.dim,6,'center');
    txt('Partie sauvegardée toutes les 20 s',x+W/2,y+178,'#a0a4be',6,'center')}}
const ORDERS={attack:'Assaut',defend:'Défense',hold:'Tenir',follow:'Suivre'},ORDER_SEQ=['attack','defend','hold','follow'];
// Tenir : un fanion est planté là où se tient le héros, les troupes forment la ligne autour (avant-poste, embuscade, siège patient)
function toggleOrder(){const b=bases[0];b.order=ORDER_SEQ[(ORDER_SEQ.indexOf(b.order)+1)%ORDER_SEQ.length];if(b.order==='hold')b.holdX=player.x+player.w/2;
  toast({attack:'Tes troupes partent à l\'assaut du cœur rouge.',defend:'Tes troupes se regroupent devant ta base.',hold:'Fanion planté : tes troupes tiennent cette position.',follow:'Tes troupes t\'escortent.'}[b.order],2.5,'#9fd0ff');sfx.place()}
function togglePanel(n){panel=panel===n?null:n;cursorItem=null;panelT=0;sfx.place()}
const panelY=(H,y)=>HL.barTop&&HL.barTop-H-3>=2?Math.max(2,Math.min(y,HL.barTop-H-3)):y;
function drawBasePanel(){const b=bases[0],p=player,kinds=Object.entries(UNITS).filter(([,u])=>!u.hero),RP=21,W=262,H=98+kinds.length*RP,x=Math.round(VW/2-W/2),y=panelY(H,Math.round(VH/2-H/2)-6);panelRect={x,y,w:W,h:H};
  mbox(x,y,W,H);mhead(x,y,W-112,'Ta base','#7fb8ff',true);mbutton(x+W-18,y+4,14,12,'×',()=>togglePanel('base'));
  txt('Recruter',x+8,y+22,COL.dim,7);
  kinds.forEach(([k,u],i)=>{const yy=y+32+i*RP;mframe(x+6,yy,W-12,RP-2,'panel');
    // les sprites HD dépassent la rangée : réduits pour tenir dans 17 px de haut
    const img=SPR[k+'0'].R.idle[0],zs=Math.min(1,17/img.height),iw=Math.round(img.width*zs),ih=Math.round(img.height*zs);ctx.drawImage(img,x+18-(iw>>1),yy+18-ih,iw,ih);txt(u.n,x+30,yy+2,COL.txt,8);
    // effectif actuel de ce type, pour savoir quoi recruter sans compter à l'écran
    const own=ents.filter(e=>e.type==='unit'&&e.team===0&&e.kind===k&&!e.dead).length;if(own)txt('×'+own,x+34+uiWidth(u.n,8),yy+2,'#9fd0ff',8);txt(uiFit(u.d,101,6),x+30,yy+11,COL.dim,6);
    costLine(u.cost,x+136,yy+6,b.storage);mbutton(x+W-48,yy+3,40,13,'Recruter',()=>{if(recruit(0,k))toast(u.n+' recruté !',2,'#9fd0ff')},canPay(b.storage,u.cost))});
  const uy=y+34+kinds.length*RP;txt('Améliorations',x+8,uy,COL.dim,7);
  UPG.forEach((u,i)=>{const xx=x+6+(i%2)*126,yy=uy+9+Math.floor(i/2)*25,l=b.upg[u.id],c=upgCost(u,l);mframe(xx,yy,123,23,l>=3?{f:MTONE.panel.f,l:'#f2b941',d:'#a8661c'}:'panel');
    txt(u.n+' '+'★'.repeat(l)+'☆'.repeat(3-l),xx+4,yy+3,l>=3?COL.gold:COL.txt,7);if(l<3){costLine(c,xx+4,yy+13,b.storage);txt(uiFit(u.s,44,6),xx+92,yy+14,COL.dim,6,'right');mbutton(xx+95,yy+10,25,11,'+',()=>{if(canPay(b.storage,c)){pay(b.storage,c);b.upg[u.id]++;applyUpg(0,u.id);sfx.buy();toast(u.n+' : niveau '+b.upg[u.id],2,COL.gold)}},canPay(b.storage,c))}else{txt('max',xx+4,yy+13,COL.gold,7);txt(u.s,xx+119,yy+14,COL.dim,6,'right')}});
  // rappel : rentrer à la base d'où qu'on soit (cœur attaqué, sac plein au fond d'une grotte)
  {const far=Math.abs(p.x-b.core.x)>=12*T,cd=p.recallCd>0,ok=!p.dead&&!cd&&far;mbutton(x+W-80,y+19,74,11,cd?'Rappel '+Math.ceil(p.recallCd)+' s':isTouch?'Rappel à la base':'Rappel base H',startRecall,ok,ok&&b.core.alertT>time)}
  const nearB=Math.abs(player.x-b.core.x)<90;mbutton(x+W-108,y+4,86,12,'Déposer pierre/bois',()=>{let n=0;for(const k of['stone','wood']){const c=countItem(k);takeItem(k,c);b.storage[k]+=c;n+=c}toast(n?('Déposé : '+n):'Rien à déposer.',2,'#9fd0ff');if(n)sfx.buy()},nearB);
}
function drawCraftPanel(){const W=250,rows=RECIPES.length,RH=clamp(Math.floor(((HL.barTop||VH)-6-30)/rows),12,17),H=30+rows*RH,x=Math.round(VW/2-W/2),y=panelY(H,Math.max(30,Math.round(VH/2-H/2)-6));panelRect={x,y,w:W,h:H};
  const hint='sac puis réserve de la base';mbox(x,y,W,H);mhead(x,y,W-28-uiWidth(hint,6),'Forge','#ffb066',true);txt(hint,x+W-22,y+8,COL.dim,6,'right');mbutton(x+W-18,y+4,14,12,'×',()=>togglePanel('craft'));
  // le minerai est déposé tout seul à la base : la forge puise dans le sac puis dans la réserve
  const inv={},st=bases[0].storage;for(const s of player.inv)if(s)inv[s.id]=(inv[s.id]||0)+s.n;for(const k of RES)inv[k]=(inv[k]||0)+(st[k]||0);
  // lignes compressées si l'écran est bas (téléphone en paysage) pour ne pas couvrir les boutons du bas
  RECIPES.forEach((r,i)=>{const yy=y+22+i*RH,ok=canPay(inv,r.inp),ty=yy+Math.round((RH-2-5)/2);mframe(x+6,yy,W-12,RH-2,ok?'panel':'off');ctx.drawImage(ICON[r.out],x+8,yy,RH-3,RH-3);
    txt(IT[r.out].n+(r.n>1?' ×'+r.n:''),x+25,ty,ok?COL.txt:COL.dim,7);costLine(r.inp,x+120,ty,inv);
    mbutton(x+W-46,yy+1,38,RH-4,'Créer',()=>{for(const[k,v]of Object.entries(r.inp)){const fromBag=Math.min(v,countItem(k));takeItem(k,fromBag);if(v>fromBag)st[k]-=v-fromBag}const left=addItem(r.out,r.n);if(left)dropItem(player.x,player.y,r.out,left);sfx.buy();if(r.out==='pick4')unlock('pick4');craftFx=.5;toast('Fabriqué : '+IT[r.out].n,2,COL.gold)},ok)})}
function drawInvPanel(){const sw=20,W=9*sw+12,H=4*sw+34,x=Math.round(VW/2-W/2),y=panelY(H,Math.round(VH/2-H/2)-10);panelRect={x,y,w:W,h:H};
  const hint=isTouch?'touche pour déplacer':'clique pour déplacer';mbox(x,y,W,H);mhead(x,y,W-28-uiWidth(hint,6),'Sac','#c9a7ff',true);txt(hint,x+W-22,y+8,COL.dim,6,'right');mbutton(x+W-18,y+4,14,12,'×',()=>togglePanel('inv'));
  for(let i=0;i<36;i++){const r=i<9?3:Math.floor((i-9)/9),c=i%9,xx=x+6+c*sw,yy=y+22+r*sw+(i<9?6:0),s=player.inv[i];
    // barre rapide plus sombre, case choisie liserée d'or
    mframe(xx,yy,sw-2,sw-2,i===player.sel?{f:'#0f0e20',l:'#f2b941',d:'#a8661c'}:i<9?{f:'#0f0e20',l:'#2a2850',d:'#06060f'}:'panel');if(s){ctx.drawImage(ICON[s.id],xx+1,yy+1);if(s.n>1)txt(''+s.n,xx+sw-4,yy+sw-11,COL.txt,7,'right')}
    uiHits.push({x:xx,y:yy,w:sw-2,h:sw-2,fn:()=>{const t=player.inv[i];if(cursorItem&&t&&t.id===cursorItem.id&&!IT[t.id].tool){const k=Math.min(cursorItem.n,99-t.n);t.n+=k;cursorItem.n-=k;if(cursorItem.n<=0)cursorItem=null}else{player.inv[i]=cursorItem;cursorItem=t}sfx.place()}})}}
function drawCursor(){if(!mouse.inside||isTouch&&state==='play')return;const x=Math.round(mouse.x),y=Math.round(mouse.y);
  if(cursorItem){ctx.drawImage(ICON[cursorItem.id],x-6,y-6);if(cursorItem.n>1)txt(''+cursorItem.n,x+8,y+2,COL.txt,7)}
  ctx.fillStyle='#120e1c';ctx.fillRect(x-1,y-4,3,9);ctx.fillRect(x-4,y-1,9,3);ctx.fillStyle=COL.txt;ctx.fillRect(x,y-3,1,7);ctx.fillRect(x-3,y,7,1)}
// ==== MENUS PIXEL ART : cadre, bouton, bandeau (titre, pause, panneaux du menu, fin) ====
// mêmes tons que PixelFrame de l'app mobile (mobile-app/lib/theme.ts) : f remplissage, l biseau clair, d biseau sombre, t texte
const MTONE={hero:{f:'#f2b941',l:'#ffe680',d:'#a8661c',t:'#2a1606'},panel:{f:'#1e1c38',l:'#3c3966',d:'#0f0e20',t:'#e4e9ff'},ally:{f:'#1d4785',l:'#4f9df5',d:'#0f2750',t:'#e4e9ff'},
  danger:{f:'#5c1b20',l:'#e5534b',d:'#2e0b0e',t:'#e4e9ff'},window:{f:'#15132af6',l:'#3c3966',d:'#0b0a16',t:'#e4e9ff'},off:{f:'#121022',l:'#1d1b33',d:'#0b0a16',t:'#4a4766'}};
// ombre dure dessous, contour encre à coins coupés, biseau clair en haut/gauche, sombre (2 px) en bas/droite ; dn l'enfonce dans son ombre
function mframe(x,y,w,h,t,dn=0,lit=0){x=Math.round(x);y=Math.round(y);w=Math.round(w);h=Math.round(h);const T=typeof t==='string'?MTONE[t]:t;
  if(w<6||h<6){ctx.fillStyle=T.f;ctx.fillRect(x,y,w,h);return}
  ctx.fillStyle='#06060fb8';ctx.fillRect(x+1,y+h,w-2,2);ctx.fillRect(x+2,y+h+2,w-4,1);y+=dn;
  ctx.fillStyle='#06060f';ctx.fillRect(x+1,y,w-2,1);ctx.fillRect(x+1,y+h-1,w-2,1);ctx.fillRect(x,y+1,1,h-2);ctx.fillRect(x+w-1,y+1,1,h-2);
  ctx.fillStyle=T.f;ctx.fillRect(x+1,y+1,w-2,h-2);
  ctx.fillStyle=T.l;ctx.fillRect(x+1,y+1,w-3,1);ctx.fillRect(x+1,y+2,1,h-4);
  ctx.fillStyle=T.d;ctx.fillRect(x+2,y+h-3,w-3,2);ctx.fillRect(x+w-2,y+1,1,h-3);
  if(lit){ctx.fillStyle='#ffffff1c';ctx.fillRect(x+2,y+2,w-4,h-5)}}
// carte ou fenêtre : remplissage (translucide possible) et biseau clair au choix ; rivets aux coins des grandes fenêtres
function mbox(x,y,w,h,fill=MTONE.window.f,edge=MTONE.window.l){mframe(x,y,w,h,{f:fill,l:edge,d:'#0000008c'});
  if(w>60&&h>40){x=Math.round(x);y=Math.round(y);w=Math.round(w);h=Math.round(h);ctx.fillStyle='#06060f';for(const[cx,cy]of[[x+3,y+3],[x+w-6,y+3],[x+3,y+h-6],[x+w-6,y+h-6]])ctx.fillRect(cx,cy,3,3);
    ctx.fillStyle='#ffd27a';for(const[cx,cy]of[[x+4,y+4],[x+w-5,y+4],[x+4,y+h-5],[x+w-5,y+h-5]])ctx.fillRect(cx,cy,1,1)}}
// reflet en biais qui traverse un bouton important toutes les ~3 s
function mshine(x,y,w,h){const p=(performance.now()/1000*.55)%1.7;if(p>1)return;x=Math.round(x);y=Math.round(y);const sx=Math.round(x+(w+h)*p-h);ctx.fillStyle='#ffffff40';
  for(let j=2;j<h-3;j++){const px=sx+(h-j);for(const o of[0,1,3])if(px+o>x+1&&px+o<x+w-2)ctx.fillRect(px+o,y+j,1,1)}}
// bouton de menu : se creuse sous le doigt, s'éclaire au survol ; hot = action conseillée (bleu + reflet), tone force le ton
function mbutton(x,y,w,h,label,fn,on=true,hot=false,tone){const hov=on&&mouse.inside&&mouse.x>=x&&mouse.x<x+w&&mouse.y>=y&&mouse.y<y+h,dn=hov&&mouse.l?1:0,k=!on?'off':tone||(hot?'ally':'panel'),T=MTONE[k];
  mframe(x,y,w,h,T,dn,hov);if(on&&(hot||k==='hero'))mshine(x,y+dn,w,h);
  const big=h>=24&&uiWidth(label,14)<=w-12,sz=big?14:8;txt(uiFit(label,w-6,sz),x+w/2,y+dn+Math.floor((h-(big?13:8))/2),T.t,sz,'center');
  uiHits.push({x,y,w,h,fn:on?fn:()=>sfx.deny()})}
// bandeau de titre : cartouche encré au centre (ou à gauche) et filet orné de part et d'autre
function mhead(x,y,W,s,col,left=false){const tw=Math.min(W-12,uiWidth(s,14)+24),tx=left?x+6:Math.round(x+W/2-tw/2);
  ctx.fillStyle=col+'55';ctx.fillRect(x+6,y+11,W-12,1);ctx.fillStyle='#06060f';ctx.fillRect(x+6,y+12,W-12,1);
  for(const ex of[x+6,x+W-9])if(ex<tx-4||ex>tx+tw+2){ctx.fillStyle='#06060f';ctx.fillRect(ex,y+9,4,5);ctx.fillStyle=col;ctx.fillRect(ex+1,y+10,2,2)}
  mframe(tx,y+3,tw,17,{f:'#0f0e20',l:col+'aa',d:'#06060f'});txt(uiFit(s,tw-10,14),tx+tw/2,y+6,col,14,'center')}
// voile en bandes (pas de dégradé lisse) : n marches d'opacité entre y0 et y1
function mveil(y0,y1,a0,a1,n=6){const h=(y1-y0)/n;for(let i=0;i<n;i++){const a=a0+(a1-a0)*(i+.5)/n;ctx.fillStyle=`rgba(5,5,12,${a.toFixed(3)})`;ctx.fillRect(0,Math.round(y0+i*h),VW,Math.round(y0+(i+1)*h)-Math.round(y0+i*h))}}
// brume façon Animal Well : 3 nappes au bord en marches de 2 px (pas de flou), qui glissent lentement
function mmist(y1,h,t,col='#35cbb1',a=.09){ctx.save();ctx.fillStyle=col;for(let l=0;l<3;l++){ctx.globalAlpha=a*(1-l*.25);const s=t*(.18+l*.09)*(l%2?-1:1)*40;
  for(let x=0;x<VW;x+=4){const u=x+s+l*137,n=Math.sin(u*.019)+Math.sin(u*.043+l)*.55+Math.sin(u*.007)*.8,hh=Math.max(0,Math.round(h*(.35+l*.2+.18*n)/2)*2);ctx.fillRect(x,Math.round(y1-hh),4,hh)}}ctx.restore()}
// lucioles turquoise et or qui flottent et clignotent (halo en croix, cœur clair)
function mmotes(n,t,y0,y1,k0=0){ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<n;i++){const k=i+k0,p=((k*.618)%1),sp=4+k%4*2,
  y=Math.round(y1-((t*sp+k*71)%(y1-y0))),x=Math.round((p*VW+Math.sin(t*.6+k*1.7)*14+VW)%VW),b=.5+.5*Math.sin(t*(1.5+k%3*.6)+k);if(b<.15)continue;
  ctx.fillStyle=k%4?'#85ffe1':'#ffe066';ctx.globalAlpha=b*.2;ctx.fillRect(x-2,y-1,5,3);ctx.fillRect(x-1,y-2,3,5);ctx.globalAlpha=b;ctx.fillRect(x,y,1,1)}ctx.restore()}
let menuPanel=null,titleT=0;
const fmtT=sec=>{sec=Math.round(sec);return Math.floor(sec/60)+' min '+String(sec%60).padStart(2,'0')+' s'};
// boutons qui glissent à l'entrée de l'écran (décalage selon leur rang)
const slideIn=(k)=>{const t=clamp(titleT*3-k*.25,0,1);return Math.round((1-(1-Math.pow(1-t,3)))*40)};
function logo(cx,y,size){const z=uiScale(size),L=uiLetters('UNTIL THE END');let x=cx-uiWidth('UNTIL THE END',size)/2;
  [...L].forEach((c,i)=>{const dy=Math.round(Math.sin(time*2.4-i*.45)*z*.6),cw=uiWidth(c,size);
    ctx.save();ctx.shadowColor=i>=10?'#ff6a5a':'#7f9bff';ctx.shadowBlur=10;txt(c,x,y+dy,i>=10?'#ffd0c8':COL.txt,size);ctx.restore();x+=cw+z});
  for(let k=0;k<6;k++){const a=time*.7+k*1.05,sx=cx+Math.cos(a)*uiWidth('UNTIL THE END',size)*.55,sy=y+5*z/2+Math.sin(a*1.3)*5*z;ctx.globalAlpha=.4+.4*Math.sin(time*4+k);ctx.fillStyle=k%2?'#ffe066':'#9fc0ff';ctx.fillRect(Math.round(sx),Math.round(sy),1,1);ctx.fillRect(Math.round(sx)-1,Math.round(sy),3,1);ctx.fillRect(Math.round(sx),Math.round(sy)-1,1,3)}ctx.globalAlpha=1}
// illustration de l'écran titre (www/art/menu.png) ; sans elle, le monde sert de décor
const MENU_IMG=new Image();MENU_IMG.src='art/menu.png';
// fonds de l'écran de fin (Higgsfield, réduits au plus proche voisin) : château à l'aube / forteresse rouge sous la lune de sang
const END_IMG={win:new Image(),lose:new Image()};END_IMG.win.src='art/fin-victoire.png';END_IMG.lose.src='art/fin-defaite.png';
function endBackdrop(win){const im=END_IMG[win?'win':'lose'];if(!im.complete||!im.naturalWidth)return false;const iw=im.naturalWidth,ih=im.naturalHeight,sc=Math.max(VW/iw,VH/ih)*1.06,w=iw*sc,h=ih*sc,t=performance.now()/1000;
  const ox=(VW-w)/2+Math.sin(t*.06)*(w-VW)/2*.9,oy=(VH-h)/2+Math.cos(t*.045)*(h-VH)/2*.6;
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(im,Math.round(ox),Math.round(oy),Math.round(w),Math.round(h));ctx.restore();
  mmist(VH,VH*.24,t,win?'#35cbb1':'#c0304a',win?.08:.12);return true}
// pictogrammes 9×9 de la rangée de menus
const MICON={shop:['...XXX...','..X...X..','.XXXXXXX.','XX.....XX','X..XXX..X','X..X....X','X..XXX..X','XX.....XX','.XXXXXXX.'],
  relic:['..XXXXX..','.X.....X.','.X.....X.','..X...X..','...XXX...','..XXXXX..','.XX.X.XX.','..XXXXX..','...XXX...'],
  ach:['....X....','...XXX...','...XXX...','XXXXXXXXX','.XXXXXXX.','..XXXXX..','..XXXXX..','.XX...XX.','XX.....XX'],
  quest:['.XXXXXXX.','X.......X','.X.XXX.X.','.X.....X.','.X.XXXX..','.X.....X.','.X.XX..X.','X.......X','.XXXXXXX.'],
  set:['..X.X.X..','.XXXXXXX.','XXX...XXX','.X.....X.','XX.....XX','.X.....X.','XXX...XXX','.XXXXXXX.','..X.X.X..']};
function micon(k,x,y,col,z=2){const m=MICON[k];for(const[c,o]of[['#05050c',1],[col,0]]){ctx.fillStyle=c;for(let j=0;j<9;j++)for(let i=0;i<9;i++)if(m[j][i]==='X')ctx.fillRect(x+i*z+o,y+j*z+o,z,z)}}
function menuBackdrop(){
  if(MENU_IMG.complete&&MENU_IMG.naturalWidth){const iw=MENU_IMG.naturalWidth,ih=MENU_IMG.naturalHeight,sc=Math.max(VW/iw,VH/ih)*1.08,w=iw*sc,h=ih*sc,t=performance.now()/1000;
    const ox=(VW-w)/2+Math.sin(t*.05)*(w-VW)/2*.9,oy=(VH-h)/2+Math.cos(t*.037)*(h-VH)/2*.6;
    // plus proche voisin et position entière : l'illustration garde ses pixels nets
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(MENU_IMG,Math.round(ox),Math.round(oy),Math.round(w),Math.round(h));ctx.restore();
    // braises qui montent (croix de 3 px pour les plus proches), pour donner vie à l'image
    for(let k=0;k<16;k++){const sp=8+k%5*3,py=Math.round(VH-((t*sp+k*53)%(VH+20))),px=Math.round((k*97+Math.sin(t*.8+k)*12)%VW);ctx.globalAlpha=.4+.35*Math.sin(t*3+k);ctx.fillStyle=k%3?'#ffb35a':'#ffe066';ctx.fillRect(px,py,1,1);if(k%4===0){ctx.fillRect(px-1,py,3,1);ctx.fillRect(px,py-1,1,3)}}ctx.globalAlpha=1;
    mmist(VH*.86,VH*.26,t,'#35cbb1',.08);mmist(VH,VH*.3,t*1.3,'#493489',.14);mmotes(14,t,VH*.3,VH,3);
    mveil(0,VH,.12,.55,8)}
  else{ctx.fillStyle='rgba(5,5,12,.55)';ctx.fillRect(0,0,VW,VH)}}
function mhov(x,y,w,h){return mouse.inside&&mouse.x>=x&&mouse.x<x+w&&mouse.y>=y&&mouse.y<y+h}
// carte de mode : cadre pixel, liseré coloré à gauche, titre + sous-titre
function modeCard(x,y,w,h,title,sub,fn,col,hot){const hov=mhov(x,y,w,h),dn=hov&&mouse.l?1:0;mframe(x,y,w,h,{f:'#15132af0',l:hov?col:col+'88',d:'#0b0a16'},dn,hov);
  x=Math.round(x);y=Math.round(y)+dn;ctx.fillStyle=col;ctx.fillRect(x+2,y+3,2,h-7);ctx.fillStyle='#06060f';ctx.fillRect(x+4,y+3,1,h-7);
  if(hot&&Math.sin(performance.now()/200)>0){ctx.fillStyle='#06060f';ctx.fillRect(x+w-7,y+3,4,4);ctx.fillStyle=COL.gold;ctx.fillRect(x+w-6,y+4,2,2)}
  txt(uiFit(title,w-14,7),x+8,y+5,COL.txt,7);txt(uiFit(sub,w-14,6),x+8,y+15,col,6);uiHits.push({x,y:y-dn,w,h,fn})}
// tuile d'icône du dock : pictogramme 9×9, libellé, compteur, pastille « nouveau »
function iconTile(x,y,w,h,k,label,fn,col,badge,cnt){const hov=mhov(x,y,w,h),dn=hov&&mouse.l?1:0;mframe(x,y,w,h,hov?{f:'#1e1c38f4',l:col,d:'#0b0a16'}:'window',dn,hov);
  x=Math.round(x);y=Math.round(y)+dn;const bob=hov?Math.round(Math.sin(performance.now()/160)):0;
  micon(k,Math.round(x+w/2-9),y+4+bob,col);txt(uiFit(label,w-4,6),x+w/2,y+h-10,hov?COL.txt:'#a0a4be',6,'center');
  if(cnt&&uiWidth(cnt,6)<w/2-13)txt(cnt,x+3,y+3,col,6);
  if(badge){const b=Math.sin(performance.now()/220)>-.3;ctx.fillStyle='#06060f';ctx.fillRect(x+w-8,y+2,5,5);ctx.fillStyle=b?COL.gold:'#a8661c';ctx.fillRect(x+w-7,y+3,3,3)}
  uiHits.push({x,y:y-dn,w,h,fn})}
const MICON_C={};function MICON_IMG(k,col){const id=k+col;if(MICON_C[id])return MICON_C[id];const c=mk(10,10),g=c.getContext('2d');for(const[cc,o]of[['#05050c',1],[col,0]]){g.fillStyle=cc;MICON[k].forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch==='X')g.fillRect(i+o,j+o,1,1)}))}return MICON_C[id]=c}
const openPanel=m=>{menuPanel=m;panelT=0;sfx.place()};
// gros bouton principal de l'écran titre : ton héros (or), halo pixel qui respire, reflet qui passe, sous-titre en cartouche
function heroButton(x,y,w,h,label,sub,subCol,fn){x=Math.round(x);y=Math.round(y);const hov=mhov(x,y,w,h),dn=hov&&mouse.l?2:0,p=Math.sin(performance.now()/380)>0;
  // halo en marches de 1 px (pas de flou) : deux anneaux qui alternent
  ctx.fillStyle=p?'#ffe0664a':'#ffe06628';ctx.fillRect(x-2,y+1,w+4,h-2);ctx.fillRect(x+1,y-2,w-2,h+6);ctx.fillStyle=p?'#ffe06620':'#ffe06612';ctx.fillRect(x-3,y+3,w+6,h-6);ctx.fillRect(x+3,y-3,w-6,h+8);
  mframe(x,y,w,h,'hero',dn,hov);mshine(x,y+dn,w,h);
  const T=MTONE.hero,ty=sub?y+dn+4:y+dn+Math.floor((h-13)/2);txt(uiFit(label,w-12,14),x+w/2,ty,T.t,14,'center');
  if(sub){const s=uiFit(sub,w-24,6),sw=uiWidth(s,6)+10;ctx.fillStyle='#2a1606';ctx.fillRect(Math.round(x+w/2-sw/2),ty+15,sw,9);txt(s,x+w/2,ty+16,subCol,6,'center')}
  uiHits.push({x,y,w,h,fn})}
// sélecteur de difficulté : trois touches pixel, celle choisie est enfoncée et teintée
// une couleur par niveau, de Paisible à Cauchemar (pastilles du titre, bouton Jouer)
const DCOL=['#63ebca','#9fc0ff','#ffd27a','#ff8a80','#ff5aa8'],DDK=['#123d38','#1d2f5c','#4a3a14','#4a1a1d','#451236'];
// Cauchemar reste grisé (cadenas) tant qu'il n'est pas débloqué ; set() explique comment l'ouvrir
function diffChips(x,y,w,h,d,set){const n=DIFFS.length,g=2,cw=Math.floor((w-g*(n-1))/n),cols=DCOL,dk=DDK;
  for(let i=0;i<n;i++){const cx=Math.round(x+i*(cw+g)),ww=i===n-1?Math.round(w-i*(cw+g)):cw,on=i===d,hov=mhov(cx,y,ww,h);
    mframe(cx,y,ww,h,on?{f:dk[i],l:cols[i],d:'#06060f'}:'window',on?1:hov&&mouse.l?1:0,hov&&!on);
    txt(uiFit(DIFFS[i].n,ww-4,7),cx+ww/2,y+(on?1:0)+Math.floor((h-7)/2),on?cols[i]:diffOpen(i)?'#a0a4be':'#5a5e7a',7,'center');uiHits.push({x:cx,y,w:ww,h,fn:()=>set(i)})}}
function drawTitle(){
  menuBackdrop();
  if(menuPanel)return drawMenuPanel(()=>{menuPanel=null});
  // voiles sombres en haut (logo) et en bas (actions) pour garder l'illustration au centre
  mveil(0,VH*.32,.7,0,6);mveil(VH*.45,VH,0,.8,7);
  // porte-monnaie en haut à droite, ouvre la boutique
  {const s=''+PROF.coins,w=uiWidth(s,7)+20,x=VW-w-5,hov=mouse.inside&&mouse.x>=x&&mouse.y<20&&mouse.y>=4;mbox(x,4,w,15,'#05050cdd',hov?'#ffffff':COL.gold+'88');coinTag(s,x+w/2,9,COL.gold);uiHits.push({x,y:4,w,h:15,fn:()=>openPanel('shop')})}
  {const L=lvlOf(PROF.xp),w=Math.min(84,VW/3);mbox(5,4,w,15,'#05050cdd','#9fc0ff88');txt(tr('Niv. ')+L.l,10,7,'#9fc0ff',7);bar(10,14,w-10,2,L.cur/L.need,'#4f9df5');txt(Math.floor(L.cur)+'/'+L.need,w,7,COL.dim,6,'right')}
  const port=VH>VW*1.2,tsz=VW<360?21:28,lz=uiScale(tsz),ty=Math.max(26,Math.round(VH*(port?.15:.1)));logo(VW/2,ty,tsz);
  let lb=ty+lz*5+6;
  if(VH>=230){txt('Mine. Forge. Détruis leur cœur.',VW/2,lb+3,'#c8cde8',7,'center');lb+=13}
  // filet décoratif sous le logo
  {const w=Math.min(120,VW*.4),cx=Math.round(VW/2);ctx.fillStyle='#06060f';ctx.fillRect(cx-w/2,lb+1,w/2-5,1);ctx.fillRect(cx+5,lb+1,w/2-5,1);ctx.fillStyle='#3c3966';ctx.fillRect(cx-w/2,lb,w/2-5,1);ctx.fillRect(cx+5,lb,w/2-5,1);ctx.fillStyle='#f2b941';ctx.fillRect(cx-w/2-2,lb-1,2,3);ctx.fillRect(cx+w/2,lb-1,2,3);ctx.fillStyle='#06060f';ctx.fillRect(cx-3,lb-2,6,5);ctx.fillRect(cx-2,lb-3,4,7);ctx.fillStyle='#ff6a5a';ctx.fillRect(cx-1,lb-2,2,5);ctx.fillRect(cx-2,lb-1,4,3)}
  // barre d'icônes ancrée en bas
  const bw=Math.min(244,VW-24),bx=Math.round(VW/2-bw/2),th=port?36:32,dockY=VH-th-8;
  {ctx.fillStyle='#05050cb0';ctx.fillRect(0,dockY-6,VW,VH-dockY+6);ctx.fillStyle='#e8ecff1c';ctx.fillRect(0,dockY-6,VW,1);
   const n=5,g=4,tw=Math.floor((bw-g*(n-1))/n),q=questsToday(),rw=q.login!==dayKey(),na=Object.keys(PROF.ach).length,nr=Object.keys(PROF.relics).length,o=Math.round(slideIn(4)/3);
   const afford=OUTFITS.some(e=>!PROF.outfits[e.id]&&PROF.coins>=e.p);
   [['shop','Boutique','#ffe066',afford],['relic','Reliques','#c9a7ff',0,nr+'/'+RELICS.length],['ach','Succès','#ffd27a',0,na+'/'+ACH.length],['quest','Quêtes','#63ebca',rw,q.list.filter(e=>e.done).length+'/3'],['set','Réglages','#a0a4be']]
     .forEach(([id,l,c,bd,cn],i)=>iconTile(bx+i*(tw+g),dockY+o,i===n-1?bw-i*(tw+g):tw,th,id,l,()=>openPanel(id),c,bd,tw>=40?cn:0))}
  // bloc d'actions, calé juste au-dessus de la barre
  const sv=hasSave(),d0=clamp(PROF.lastDiff??1,0,DIFFS.length-1),d=diffOpen(d0)?d0:1,play=()=>{audioInit();newGame(d)};
  const setD=v=>{if(v===d)return;if(!diffOpen(v)){toast('Gagne en Difficile ou en Brutal pour l\'ouvrir',3,DCOL[v]);sfx.deny();return}PROF.lastDiff=v;saveProf();sfx.click()};
  const D=dailyInfo(),st=PROF.daily.streak&&PROF.daily.last>=dayKey(new Date(Date.now()-864e5))?PROF.daily.streak:0,hh=port?34:30;
  const H=hh+5+16+(sv?4+20:0)+6+26+(VH>=230?13:0);
  let y=Math.max(lb+8,dockY-10-H),k=0;
  if(sv){heroButton(bx-slideIn(k++),y,bw,hh,'Continuer la partie',0,0,()=>{audioInit();if(!loadGame())toast('Sauvegarde illisible.',2)});y+=hh+5;
    diffChips(bx+slideIn(k++),y,bw,16,d,setD);y+=20;mbutton(bx-slideIn(k++),y,bw,20,'Nouvelle partie',play);y+=26}
  else{diffChips(bx+slideIn(k++),y,bw,16,d,setD);y+=21;
    heroButton(bx-slideIn(k++),y,bw,hh,'Jouer',uiFit(DIFFS[d].d,bw-12,6),DCOL[d],play);y+=hh+6}
  // défi du jour et Siège
  {const done=PROF.daily.won===D.key,cw=Math.floor((bw-4)/2),o=slideIn(k++);
    modeCard(bx+o,y,cw,26,(done?'★ ':'')+tr('Défi du jour'),D.mod.n,()=>{audioInit();newGame(1,D)},done?COL.gold:'#ffd27a',!done);
    modeCard(bx+cw+4+o,y,bw-cw-4,26,'Mode Siège',PROF.rec.surv?tr('Record : ')+PROF.rec.surv:'Vagues infinies',()=>{audioInit();newGame(1,null,true)},'#ff8a80');y+=31}
  if(VH>=230)txt(uiFit(D.mod.d+(st?tr(' · Série : ')+st+tr(st>1?' jours':' jour'):''),bw,6),VW/2,y,'#ffd27a',6,'center');
  txt('v'+VERSION,VW/2,8,'#e8ecff50',6,'center');
}
// panneaux Réglages / Succès, partagés par l'écran titre et le menu pause
function drawMenuPanel(close){if(menuPanel==='set')return drawSettings(close);if(menuPanel==='quest')return drawQuestPanel(close);if(menuPanel==='relic')return drawRelicPanel(close);if(menuPanel==='shop')return drawShopPanel(close);return drawAchPanel(close)}
function panelAnim(x,y,W,H){const k=1-Math.pow(1-panelT,3);if(k>=1)return false;ctx.save();ctx.globalAlpha=k;const cx=x+W/2,cy=y+H/2,z=.9+.1*k;ctx.translate(cx,cy+(1-k)*8);ctx.scale(z,z);ctx.translate(-cx,-cy);return true}
function drawSettings(close){const S2=PROF.set,W=Math.min(VW-16,220),rows=[['sound','Son'],['music','Musique'],['vib','Vibrations'],['shake','Secousses de l\'écran'],['crt','Effet rétro (lignes)'],['lefty','Commandes'],['en','Langue / Language']],H=30+rows.length*22+26,x=Math.round(VW/2-W/2),y=Math.round(VH/2-H/2);
  const an=panelAnim(x,y,W,H);mbox(x,y,W,H);mhead(x,y,W,'Réglages',COL.txt);
  rows.forEach(([k,l],i)=>{const on=S2[k];mbutton(x+10,y+26+i*22,W-20,18,l+' : '+(k==='lefty'?(on?'gaucher':'droitier'):k==='en'?(on?'English':'français'):on?'oui':'non'),()=>{S2[k]=!S2[k];if(k==='sound'){muted=!S2.sound;if(!muted)audioInit()}if(k==='vib'&&S2.vib)buzz(30);saveProf();sfx.click()},true,on)});
  mbutton(x+W/2-40,y+H-22,80,16,'Retour',()=>{close();sfx.place()});if(an)ctx.restore()}
function drawAchPanel(close){const two=VW>=380,cols=two?2:1,rowsN=Math.ceil(ACH.length/cols),RH=Math.min(20,Math.floor((VH-70)/rowsN)),W=Math.min(VW-12,two?400:240),H=48+rowsN*RH+20,x=Math.round(VW/2-W/2),y=Math.max(2,Math.round(VH/2-H/2));
  const an=panelAnim(x,y,W,H);mbox(x,y,W,H);const na=Object.keys(PROF.ach).length;mhead(x,y,W,tr('Succès')+' '+na+'/'+ACH.length,COL.gold);
  const rec=DIFFS.map(d=>PROF.rec['k'+d.id]?d.n+' '+fmtT(PROF.rec['k'+d.id]):null).filter(Boolean);
  txt(uiFit('Parties '+PROF.games+' · Victoires '+PROF.wins+(rec.length?' · Records : '+rec.join(', '):''),W-12,6),x+W/2,y+22,COL.dim,6,'center');
  const cw=(W-12)/cols;ACH.forEach((a,i)=>{const c=Math.floor(i/rowsN),r=i%rowsN,xx=Math.round(x+6+c*cw),yy=y+34+r*RH,on=!!PROF.ach[a.id];
    txt(on?'★':'☆',xx+2,yy+2,on?COL.gold:'#e8ecff40',7);txt(uiFit(a.n,cw-16,7),xx+12,yy+1,on?COL.txt:COL.dim,7);if(RH>=17)txt(uiFit(a.d,cw-16,6),xx+12,yy+9,on?COL.dim:'#e8ecff50',6)});
  mbutton(x+W/2-40,y+H-19,80,15,'Retour',()=>{close();sfx.place()});if(an)ctx.restore()}
function drawQuestPanel(close){const q=questsToday(),W=Math.min(VW-16,250),H=150,x=Math.round(VW/2-W/2),y=Math.round(VH/2-H/2);
  const an=panelAnim(x,y,W,H);mbox(x,y,W,H);mhead(x,y,W,'Quêtes du jour',COL.gold);
  q.list.forEach((e,i)=>{const yy=y+26+i*28,bw=W-24;txt(e.done?'★':'☆',x+10,yy+1,e.done?COL.gold:'#e8ecff60',7);txt(uiFit(qName(e),bw-50,7),x+20,yy,e.done?COL.dim:COL.txt,7);
    txt(e.p+'/'+e.g,x+W-10,yy,e.done?COL.ok:COL.dim,7,'right');ctx.fillStyle='#06060f';ctx.fillRect(x+19,yy+9,bw-6,5);ctx.fillStyle='#1d1b33';ctx.fillRect(x+20,yy+10,bw-8,3);if(e.p){const fw=Math.round((bw-8)*e.p/e.g);ctx.fillStyle=e.done?COL.ok:COL.gold;ctx.fillRect(x+20,yy+10,fw,3);ctx.fillStyle='#ffffff55';ctx.fillRect(x+20,yy+10,fw,1)}
    txt(uiFit(lootTxt(QLOOT[e.tier]),bw-8,6),x+20,yy+16,'#e8ecff70',6)});
  const today=q.login===dayKey(),s=today?q.streak:(q.login===dayKey(new Date(Date.now()-864e5))?Math.min(7,q.streak+1):1);
  txt(uiFit((today?'Récompense du jour reçue · série ':'Lance une partie pour la récompense du jour · série ')+s+'/7',W-16,6),x+W/2,y+H-36,COL.dim,6,'center');
  mbutton(x+W/2-40,y+H-22,80,16,'Retour',()=>{close();sfx.place()});if(an)ctx.restore()}
// partage du résultat en une touche : feuille de partage Android (plugin Capacitor), Web Share, sinon presse-papiers
let sharedT=0;const SHARE_URL='https://joranvnp.github.io/until-the-end/';
function shareText(){const win=state==='win',mode=daily?tr('Défi du jour : ')+tr(daily.mod.n):(surv?tr('Siège · '):'')+tr('Difficulté ')+tr(DIFFS[diff].n);
  const head=surv?tr('J\'ai repoussé ')+stats.waves+tr(' vagues en mode Siège'):win?tr('J\'ai détruit le cœur rouge en ')+tr(fmtT(endInfo.dur||0)):tr('Mon cœur est tombé après ')+tr(fmtT(endInfo.dur||0));
  return 'Until The End · '+head+' ('+mode+', '+stats.kills+' '+tr('ennemis abattus')+').'+(daily?' '+tr('Fais mieux sur le défi du jour !'):win||surv?' '+tr('Bats mon record !'):'')}
async function shareResult(){const text=shareText(),data={title:'Until The End',text,url:SHARE_URL};sfx.place();
  try{const S=window.Capacitor?.Plugins?.Share;if(S&&NATIVE){await S.share({...data,dialogTitle:tr('Partager')});return}
    if(navigator.share){await navigator.share(data);return}
    await navigator.clipboard.writeText(text+' '+SHARE_URL);sharedT=performance.now();toast('Résultat copié, colle-le où tu veux !',3,COL.ok)}
  catch(e){if(e&&e.name!=='AbortError'&&!/cancel/i.test(e.message||''))toast('Partage impossible sur cet appareil.',3)}}
function drawRelicPanel(close){const W=Math.min(VW-16,300),wide=W>=260,cols=wide?2:1,rh=wide?30:26,rows=Math.ceil(RELICS.length/cols),H=34+rows*rh+30,x=Math.round(VW/2-W/2),y=Math.max(4,Math.round(VH/2-H/2));
  const an=panelAnim(x,y,W,H);mbox(x,y,W,H);const sl=relSlots(),eq=PROF.relEq;
  mhead(x,y,W,'Reliques','#c9a7ff');txt(uiFit('Équipées '+eq.length+'/'+sl+' · touche pour équiper · pas en défi du jour',W-12,6),x+W/2,y+22,COL.dim,6,'center');
  const cw=Math.floor((W-12-(cols-1)*4)/cols);
  RELICS.forEach((r,i)=>{const lv=Math.min(3,PROF.relics[r.id]||0),cx=x+6+(i%cols)*(cw+4),cy=y+30+Math.floor(i/cols)*rh,on=eq.includes(r.id);
    mframe(cx,cy,cw,rh-3,on?{f:'#2a1f45',l:'#c9a7ff',d:'#0b0a16'}:{f:'#15132a',l:'#2a2745',d:'#0b0a16'});if(on){ctx.fillStyle='#c9a7ff';ctx.fillRect(cx+2,cy+3,1,rh-9)}
    if(!lv){txt('???',cx+6,cy+4,'#e8ecff50',7);txt(uiFit('Coffres, champion rouge, Siège',cw-10,6),cx+6,cy+14,'#e8ecff40',6);return}
    txt(uiFit(r.n,cw-30,7),cx+6,cy+4,on?'#e9dcff':COL.txt,7);txt('★'.repeat(lv)+'☆'.repeat(3-lv),cx+cw-4,cy+4,'#c9a7ff',7,'right');
    txt(uiFit(relDesc(r,lv),cw-10,6),cx+6,cy+14,COL.dim,6);
    uiHits.push({x:cx,y:cy,w:cw,h:rh-3,fn:()=>{const j=eq.indexOf(r.id);if(j>=0)eq.splice(j,1);else{if(eq.length>=sl)eq.shift();eq.push(r.id)}saveProf();sfx.place()}})});
  if(sl<3)txt(uiFit('3e emplacement après 10 victoires ('+PROF.wins+'/10)',W-12,6),x+W/2,y+H-36,'#e8ecff60',6,'center');
  mbutton(x+W/2-40,y+H-22,80,16,'Retour',()=>{close();sfx.place()});if(an)ctx.restore()}
let shopNote=null;
function shopSay(s,col){shopNote={s,col,t:performance.now()}}
function buyOutfit(o){if(PROF.outfits[o.id]){PROF.outfit=o.id;SPR.player=heroSet(o.id);saveProf();sfx.click();return}
  if(PROF.coins<o.p){sfx.deny();shopSay(tr('Il te manque ')+(o.p-PROF.coins)+tr(' éclats.'),'#ff6fae');return}
  PROF.coins-=o.p;PROF.outfits[o.id]=1;PROF.outfit=o.id;SPR.player=heroSet(o.id);saveProf();sfx.buy();shopSay(tr('Tenue achetée : ')+tr(o.n),COL.ok)}
function buyBoost(o){const n=PROF.boosts[o.id]||0;if(n>=BOOST_MAX){sfx.deny();shopSay('Maximum en réserve : 3','#ff6fae');return}
  if(PROF.coins<o.p){sfx.deny();shopSay(tr('Il te manque ')+(o.p-PROF.coins)+tr(' éclats.'),'#ff6fae');return}
  PROF.coins-=o.p;PROF.boosts[o.id]=n+1;saveProf();sfx.buy();shopSay(tr(o.n)+tr(' : prêt pour la prochaine partie'),COL.ok)}
function drawShopPanel(close){const two=VW>=420,W=Math.min(VW-12,two?430:280),colW=two?Math.floor((W-18)/2):W-12,cardH=50,bRH=26,
    leftH=10+cardH+14,rightH=10+BOOSTS.length*bRH,H=two?36+Math.max(leftH,rightH)+34:36+leftH+6+rightH+34,x=Math.round(VW/2-W/2),y=Math.max(2,Math.round(VH/2-H/2));
  const an=panelAnim(x,y,W,H);mbox(x,y,W,H);mhead(x,y,W,'Boutique',COL.gold);
  coinTag(PROF.coins,x+W-8,y+8,COL.gold,7,'right');{const L=lvlOf(PROF.xp);txt(tr('Niv. ')+L.l,x+8,y+8,'#9fc0ff',7)}txt(uiFit('Gagne des éclats à chaque partie, encore plus en gagnant',W-16,6),x+W/2,y+24,COL.dim,6,'center');
  // tenues : aperçu du héros, prix ou coche
  const lx=x+6,ly=y+35;txt('Tenues',lx,ly,'#9fc0ff',7);const cg=3,cw=Math.floor((colW-cg*(OUTFITS.length-1))/OUTFITS.length);
  OUTFITS.forEach((o,i)=>{const cx=lx+i*(cw+cg),cy=ly+10,own=!!PROF.outfits[o.id],on=PROF.outfit===o.id,hov=mouse.inside&&mouse.x>=cx&&mouse.x<cx+cw&&mouse.y>=cy&&mouse.y<cy+cardH;
    mbox(cx,cy,cw,cardH,on?'#ffe0661c':o.tunic+'14',on?COL.gold:hov?'#ffffff':'#e8ecff33');
    // aperçu agrandi du héros (×2 quand la carte le permet), sur un petit socle à la couleur de la tenue
    const im=outfitImg(o.id),hd=im.width>40,z=1,pw=hd?22:19,ph=hd?25:22,px=Math.round(cx+cw/2-pw/2),py=cy+cardH-15-ph;
    ctx.fillStyle=o.tunic+'40';ctx.fillRect(Math.round(cx+cw/2-11),cy+cardH-16,22,2);ctx.globalAlpha=own||hov?1:.75;if(hd)ctx.drawImage(im,12,3,30,34,px,py,pw,ph);else ctx.drawImage(im,4,0,19,22,px,py,pw,ph);ctx.globalAlpha=1;
    if(on){ctx.fillStyle=COL.gold;const kx=Math.round(cx+cw/2)-4,ky=cy+cardH-11;[[0,3],[1,4],[2,5],[3,4],[4,3],[5,2],[6,1],[7,0]].forEach(([i,j])=>ctx.fillRect(kx+i,ky+j,1,2))}else if(own)txt(uiFit('Choisir',cw-4,6),cx+cw/2,cy+cardH-10,COL.dim,6,'center');else coinTag(o.p,cx+cw/2,cy+cardH-10,PROF.coins>=o.p?COL.txt:'#ff6fae',6);
    uiHits.push({x:cx,y:cy,w:cw,h:cardH,fn:()=>buyOutfit(o)})});
  const cur=OUTFITS.find(o=>o.id===PROF.outfit);txt(uiFit(tr('Portée : ')+tr(cur.n),colW,6),lx+colW/2,ly+cardH+14,COL.dim,6,'center');
  // bonus consommables
  const rx=two?x+12+colW:lx,ry=two?ly:ly+leftH+6;txt(uiFit('Bonus · prochaine partie (pas en défi)',colW,7),rx,ry,'#9fc0ff',7);
  BOOSTS.forEach((o,i)=>{const yy=ry+10+i*bRH,n=PROF.boosts[o.id]||0,bw=Math.max(38,uiWidth(''+o.p,8)+22);mframe(rx,yy,colW,bRH-3,{f:'#15132a',l:'#2a2745',d:'#0b0a16'});
    txt(uiFit(o.n,colW-bw-26,7),rx+4,yy+3,COL.txt,7);txt(uiFit(o.d,colW-bw-8,6),rx+4,yy+13,COL.dim,6);if(n)txt('×'+n,rx+colW-bw-6,yy+3,COL.ok,7,'right');
    const bx=rx+colW-bw-2,can=PROF.coins>=o.p&&n<BOOST_MAX;{const hv=can&&mhov(bx,yy+3,bw,bRH-9),dn=hv&&mouse.l?1:0;mframe(bx,yy+3,bw,bRH-9,can?'ally':'off',dn,hv);coinTag(o.p,bx+bw/2,yy+3+dn+Math.floor((bRH-9-5)/2),can?COL.txt:'#4a4766',7)}
    uiHits.push({x:bx,y:yy,w:bw+2,h:bRH-3,fn:()=>buyBoost(o)})});
  if(shopNote&&performance.now()-shopNote.t<2500)txt(uiFit(shopNote.s,W-16,6),x+W/2,y+H-31,shopNote.col,6,'center');
  mbutton(x+W/2-40,y+H-21,80,16,'Retour',()=>{close();sfx.place()});if(an)ctx.restore()}
let endShownT=0;const titleEnd=()=>(performance.now()-endShownT)/500;
function drawEnd(){if(!endShownT||endShownT<lastEndChange)endShownT=performance.now();if(endBackdrop(state==='win')){ctx.fillStyle='rgba(5,5,12,.38)';ctx.fillRect(0,0,VW,VH)}else{ctx.fillStyle='rgba(5,5,12,.82)';ctx.fillRect(0,0,VW,VH)}drawConfetti();const win=state==='win',W=Math.min(VW-16,300);
  // conseil adapté à ce qui s'est passé, pour que la partie suivante se joue autrement
  const rk=stats.rk||{},army=(rk.warrior||0)+(rk.archer||0)+(rk.golem||0);
  const tip=surv?(stats.waves<3?'Astuce : améliore la tour et garde l\'ordre Défense, les vagues viennent à toi.':'Chaque vague repoussée renforce la suivante : investis vite dans les améliorations.'):win?(diff<DIFFS.length-1?'Prêt pour plus dur ? Essaie la difficulté '+DIFFS[diff+1].n+'.':'Victoire en '+DIFFS[diff].n+' : bravo !')
    :diff>0&&!PROF.wins&&PROF.games>=3?'Astuce : la difficulté Paisible laisse bien plus de temps pour bâtir ton armée.'
    :stats.recruited===0?'Astuce : rapporte du minerai à ta base et recrute des mineurs, puis des guerriers (bouton Base).'
    :(rk.miner||0)===0?'Astuce : des mineurs remplissent la réserve tout seuls, recrute-les en premier.'
    :army===0?'Astuce : recrute aussi des guerriers et des archers pour protéger ton cœur.'
    :army<6?'Astuce : garde l\'ordre Défense tant que ton armée est petite, la tour couvre la ligne.'
    :'Astuce : regroupe une dizaine de combattants avant de lancer l\'Assaut.';
  // objectif suivant : la tenue (ou le bonus) la moins chère, cliquable vers la boutique
  const goal=OUTFITS.filter(o=>!PROF.outfits[o.id]).sort((p,q)=>p.p-q.p)[0]||BOOSTS.filter(o=>(PROF.boosts[o.id]||0)<BOOST_MAX).sort((p,q)=>p.p-q.p)[0];
  const recS=surv?(endInfo.rec?(endInfo.prev?'Nouveau record ! (avant : '+endInfo.prev+' vagues)':'Premier record établi !'):'Record : '+(endInfo.prev||0)+' vagues')
    :win&&endInfo.rec?(endInfo.prev?'Nouveau record ! (avant : '+fmtT(endInfo.prev)+')':'Premier record établi !'):win&&endInfo.prev?'Record à battre : '+fmtT(endInfo.prev):null;
  let tl=wrapLines(tip,W-20,7);const base=158+(goal?16:0)+(recS?11:0);if(base+tl.length*9>VH-8)tl=tl.slice(0,Math.max(0,Math.floor((VH-8-base)/9)));
  const H=base+tl.length*9,x=Math.round((VW-W)/2),k=clamp(titleEnd(),0,1),y=Math.max(4,Math.round((VH-H)/2+(1-(1-Math.pow(1-k,3)))*30)),t=(performance.now()-endShownT)/1000;
  const acc=win?COL.gold:surv?'#ffd27a':'#ff6fae';
  ctx.globalAlpha=k;mbox(x,y,W,H);ctx.fillStyle=acc+'22';ctx.fillRect(x+2,y+2,W-5,35);ctx.fillStyle='#06060f';ctx.fillRect(x+2,y+37,W-5,1);ctx.fillStyle=acc+'99';ctx.fillRect(x+2,y+38,W-5,1);ctx.globalAlpha=1;
  // titre avec halo qui respire
  const ttl=win?'VICTOIRE':'DÉFAITE',gl=Math.sin(t*3)>0?.28:.16;ctx.globalAlpha=gl;for(const[dx,dy]of[[-2,0],[2,0],[0,-2],[0,3]])txt(ttl,VW/2+dx,y+9+dy,acc,21,'center');ctx.globalAlpha=1;for(const[dx,dy]of[[-1,0],[1,0],[0,-1],[0,1],[0,2],[1,2],[-1,2]])txt(ttl,VW/2+dx,y+9+dy,'#06060f',21,'center');
  txt(ttl,VW/2,y+9,win?'#fff3c4':'#ffc2dc',21,'center');
  txt(uiFit(win?'Le cœur ennemi a volé en éclats.':surv?'Vagues repoussées : '+stats.waves:"Ton cœur s'est éteint.",W-12,7),VW/2,y+28,COL.txt,7,'center');
  txt(uiFit((daily?'Défi du jour · '+daily.mod.n:(surv?'Siège · ':'')+'Difficulté '+DIFFS[diff].n)+' · '+fmtT(endInfo.dur||0),W-12,6),VW/2,y+42,COL.dim,6,'center');
  // tuiles de statistiques
  {const st=[['stone',stats.mined,'Blocs'],['pick1',stats.recruited,'Recrues'],['sword3',stats.kills,'Abattus'],['plank',stats.chests||0,'Coffres']],g=3,tw=Math.floor((W-12-g*3)/4);
    st.forEach(([ic,v,l],i)=>{const tx=x+6+i*(tw+g),ty=y+52,a=clamp((t-.3-i*.08)*5,0,1);ctx.globalAlpha=a;mframe(tx,ty,tw,24,{f:'#15132a',l:'#2a2745',d:'#0b0a16'});
      if(ICON[ic])ctx.drawImage(ICON[ic],tx+2,ty+4,16,16);txt(uiFit(''+Math.round(v*clamp((t-.3)*2,0,1)),tw-22,8),tx+20,ty+5,COL.txt,8);txt(uiFit(l,tw-22,6),tx+20,ty+15,COL.dim,6);ctx.globalAlpha=1})}
  // carte de récompenses : éclats qui défilent, barre d'XP qui se remplit, passage de niveau
  {const ry=y+82,rh=40;mbox(x+6,ry,W-12,rh,'#ffe0660f',COL.gold+'55');
    const pc=clamp((t-.6)/.8,0,1),c=Math.round((endInfo.coins||0)*(1-Math.pow(1-pc,2)));coinTag('+'+c,x+12,ry+6,COL.gold,7,'left');
    if(endInfo.lvBonus&&t>2.2)coinTag('+'+endInfo.lvBonus,x+12+uiWidth('+'+(endInfo.coins||0),7)+16,ry+6,Math.sin(t*8)>0?'#fff3c4':COL.gold,7,'left');
    txt(tr('Total ')+PROF.coins,x+W-12,ry+6,COL.dim,6,'right');
    const px=clamp((t-1)/1.3,0,1),v=(endInfo.xp0||0)+(endInfo.xp||0)*(1-Math.pow(1-px,3)),L=lvlOf(v);
    if(endInfo.lvShown!=null&&L.l>endInfo.lvShown){endInfo.lvShown=L.l;endInfo.lvT=performance.now();sfx.ach();buzz(60)}
    const up=endInfo.lvT&&performance.now()-endInfo.lvT<2200;
    txt(tr('Niveau ')+L.l,x+12,ry+18,up&&Math.sin(t*10)>0?'#ffffff':'#9fc0ff',7);txt('+'+Math.round((endInfo.xp||0)*px)+' XP',x+W-12,ry+18,COL.ok,7,'right');
    bar(x+12,ry+28,W-24,5,L.cur/L.need,up?COL.gold:'#4f9df5');ctx.fillStyle='#ffffff40';ctx.fillRect(x+12,ry+28,Math.floor((W-24)*L.cur/L.need),1);
    if(up){const s=tr('NIVEAU ')+L.l+' !',bw2=uiWidth(s,7)+12,z=1+.15*Math.max(0,1-(performance.now()-endInfo.lvT)/300);ctx.save();ctx.translate(VW/2,ry-1);ctx.scale(z,z);
      mbox(-bw2/2,-5,bw2,11,'#3a2a08ee',COL.gold);txt(s,0,-2,COL.gold,7,'center');ctx.restore()}}
  let yy=y+128;
  if(goal){const can=PROF.coins>=goal.p,s=can?tr('Disponible : ')+tr(goal.n)+' !':tr(goal.n)+tr(' : encore ')+(goal.p-PROF.coins)+tr(' éclats'),gw=Math.min(W-12,uiWidth(s,6)+30),gx=VW/2-gw/2,hov=mouse.inside&&mouse.x>=gx&&mouse.x<gx+gw&&mouse.y>=yy&&mouse.y<yy+13;
    mbox(gx,yy,gw,13,hov?'#ffe06622':'#ffffff08',can&&Math.sin(t*4)>0?COL.gold:'#e8ecff40');ctx.drawImage(MICON_IMG('shop',can?COL.gold:COL.dim),Math.round(gx+4),yy+2);txt(uiFit(s,gw-22,6),gx+17,yy+4,can?COL.gold:COL.dim,6);
    uiHits.push({x:gx,y:yy,w:gw,h:13,fn:()=>{state='title';openPanel('shop')}});yy+=16}
  if(recS){txt(uiFit(recS,W-12,7),VW/2,yy+1,endInfo.rec&&Math.sin(time*6)>0?COL.gold:endInfo.rec?'#fff3c4':COL.dim,7,'center');yy+=11}
  tl.forEach((l,i)=>txt(l,VW/2,yy+1+i*9,'#ffd27a',7,'center'));
  const by=y+H-28,bw=W-12,pw=Math.floor(bw*.46),ow=Math.floor((bw-pw-8)/2);
  mbutton(x+6,by,pw,22,'Rejouer',()=>{audioInit();newGame(diff,daily,surv)},true,true,'hero');mbutton(x+6+pw+4,by,ow,22,performance.now()-sharedT<2500?'Copié !':'Partager',shareResult);mbutton(x+W-6-ow,by,ow,22,'Menu',()=>{state='title'})}
// ---------- contrôles tactiles ----------
const isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0;const touch={l:false,r:false,j:false,d:false,a:false};let touchBtns=[];
// Pavé gauche ◀ ▶ (▼ au-dessus pour creuser vers le bas), à droite ▲ saut et gros bouton d'action (vise tout seul).
// m : largeur réservée à chaque coin du bas (le plus large des deux pavés, pour rester juste en mode gaucher)
function touchMetrics(){const s=clamp(Math.floor(Math.min(VW,VH)/7),36,52),g=6,big=Math.round(s*1.3);return{s,g,big,m:Math.max(8+2*s+g+6,big+s+g+14)}}
function touchLayout(){const{s,g,big,m}=touchMetrics();
  const free=HL.left>=m&&HL.right<=VW-m,y=free?VH-s-8:HL.touchY-s-6;const ay=y-big+s;
  return[{k:'l',x:8,y,w:s,h:s,t:'◀'},{k:'r',x:8+s+g,y,w:s,h:s,t:'▶'},{k:'d',x:8+Math.round((s+g)/2),y:y-s-g,w:s,h:s,t:'▼'},
    {k:'a',x:VW-big-8,y:ay,w:big,h:big,t:''},{k:'j',x:VW-big-8-s-g,y:y,w:s,h:s,t:'▲'}].map(b=>PROF.set.lefty?{...b,x:VW-b.x-b.w}:b).map((b,i,A)=>PROF.set.lefty&&(b.k==='l'||b.k==='r')?{...b,x:A[b.k==='l'?1:0].x}:b)}
// Action-button-only sprites: cool highlights, one-pixel outline and stepped halo.
const touchIconCache=new WeakMap();
function touchIcon(ic,size){
  let sizes=touchIconCache.get(ic);if(!sizes){sizes=new Map();touchIconCache.set(ic,sizes)}
  if(sizes.has(size))return sizes.get(size);
  const light=document.createElement('canvas');light.width=light.height=size;
  const g=light.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(ic,0,0,size,size);
  const pixels=g.getImageData(0,0,size,size),d=pixels.data;
  for(let i=0;i<d.length;i+=4){const shade=(d[i]+d[i+1]+d[i+2])/765;
    d[i]=Math.round(166+65*shade);d[i+1]=Math.round(211+35*shade);d[i+2]=255}
  g.putImageData(pixels,0,0);
  const result=document.createElement('canvas');result.width=result.height=size+6;
  const r=result.getContext('2d');r.imageSmoothingEnabled=false;
  for(const [distance,color]of [[2,'#9cdeff35'],[1,'#080c20']]){
    const mask=document.createElement('canvas');mask.width=mask.height=size;
    const m=mask.getContext('2d');m.drawImage(light,0,0);m.globalCompositeOperation='source-in';m.fillStyle=color;m.fillRect(0,0,size,size);
    for(let dy=-distance;dy<=distance;dy++)for(let dx=-distance;dx<=distance;dx++)r.drawImage(mask,3+dx,3+dy)}
  r.drawImage(light,3,3);sizes.set(size,result);return result;
}
function drawTouch(){touchBtns=touchLayout();const p=player,sel=p&&p.inv[p.sel];
  ctx.save();ctx.imageSmoothingEnabled=false;
  for(const b of touchBtns){const pressed=touch[b.k],dn=pressed?1:0,x=Math.round(b.x),y=Math.round(b.y)+dn,W=Math.round(b.w),H=Math.round(b.h)-dn;
    const action=b.k==='a',cut=action?Math.round(W*.29):3;
    // pierre bleu nuit façon HUD : contour encre, arête claire en haut, ombre en bas ; enfoncée d'un pixel et lueur turquoise au toucher
    if(pressed)halo(ctx,x+W/2,y+H/2,COL.ok,W*.75,.35);
    else{ctx.fillStyle='#00000066';const ins=Math.max(0,cut-1);ctx.fillRect(x+ins+1,y+H,W-2*ins-2,1)}
    // lignes disjointes : le fond translucide reste uniforme jusque dans les coins en escalier
    for(let row=0;row<H;row++){const inset=Math.max(0,cut-Math.min(row,H-1-row)),width=W-2*inset;
      if(row===0||row===H-1){ctx.fillStyle=INK;ctx.fillRect(x+inset,y+row,width,1);continue}
      ctx.fillStyle=pressed?'#1d3a48e0':'#141a36c8';ctx.fillRect(x+inset+1,y+row,width-2,1);
      ctx.fillStyle=INK;ctx.fillRect(x+inset,y+row,1,1);ctx.fillRect(x+W-inset-1,y+row,1,1);
      const lit=pressed?'#63ebca70':'#9fb4ff40';
      if(row===1){ctx.fillStyle=lit;ctx.fillRect(x+inset+1,y+row,width-2,1)}
      else if(row===H-2){ctx.fillStyle='#00000070';ctx.fillRect(x+inset+1,y+row,width-2,1)}
      else{ctx.fillStyle=lit;ctx.fillRect(x+inset+1,y+row,1,1)}}
    if(action){const r=Math.max(3,Math.round(W*.08)),rc=pressed?COL.ok:'#63ebca55';ctx.fillStyle=rc;
      for(let row=r;row<H-r;row++){const inset=Math.max(0,cut-Math.min(row,H-1-row))+r;
        if(row===r||row===H-1-r)ctx.fillRect(x+inset,y+row,W-2*inset,1);else{ctx.fillRect(x+inset,y+row,1,1);ctx.fillRect(x+W-inset-1,y+row,1,1)}}}
    if(action){const ic=sel?ICON[sel.id]:null,z=Math.max(1,Math.round(W*.45/16)),size=16*z;
      if(ic){ctx.save();ctx.globalAlpha=1;ctx.filter='none';ctx.drawImage(touchIcon(ic,size),x+Math.floor((W-size)/2)-3,y+Math.floor((H-size)/2)-3);ctx.restore()}
      else{const z=Math.max(1,Math.floor(W/24)),ox=x+Math.floor((W-9*z)/2),oy=y+Math.floor((H-9*z)/2);
        ctx.fillStyle=pressed?'#ffffff':COL.txt;
        ctx.fillRect(ox+2*z,oy,5*z,z);ctx.fillRect(ox+z,oy+z,2*z,z);ctx.fillRect(ox+6*z,oy+z,2*z,z);
        ctx.fillRect(ox+7*z,oy+2*z,z,2*z);
        for(let i=0;i<6;i++)ctx.fillRect(ox+(6-i)*z,oy+(2+i)*z,z,2*z)}}
    else{const n=Math.max(5,Math.floor(W*.32/2)*2+1),mid=Math.floor(n/2),stem=Math.max(1,Math.floor(n/6));
      const ox=x+Math.floor((W-n)/2),oy=y+Math.floor((H-n)/2);
      // flèche vers le haut, tournée selon la direction ; d'abord le contour encre, puis le remplissage
      for(const pass of[0,1]){ctx.fillStyle=pass?(pressed?'#ffffff':COL.txt):INK;
        for(let v=0;v<n;v++)for(let u=0;u<n;u++)if(v<=mid?Math.abs(u-mid)<=v:Math.abs(u-mid)<=stem){
          const px=b.k==='l'?v:b.k==='r'?n-1-v:u,py=b.k==='l'||b.k==='r'?u:b.k==='d'?n-1-v:v;
          if(pass)ctx.fillRect(ox+px,oy+py,1,1);else ctx.fillRect(ox+px-1,oy+py-1,3,3)}}}}
  for(const b of touchBtns)if(tutHL(b.k))drawTutRing(Math.round(b.x),Math.round(b.y),Math.round(b.w),Math.round(b.h));
  ctx.restore()}
const activeTouches=new Map();
// Distance d'un point au bouton (0 dedans). Un doigt posé près d'un bouton le garde même en glissant hors du dessin.
function btnDist(t,b){return Math.hypot(Math.max(b.x-t.x,0,t.x-b.x-b.w),Math.max(b.y-t.y,0,t.y-b.y-b.h))}
function nearestBtn(t,reach){let best=null,bd=Infinity;for(const b of touchBtns){const d=btnDist(t,b);if(d<bd){bd=d;best=b}}return best&&bd<=reach?best:null}
const touchReach=()=>{const b=touchBtns[0];return b?Math.round(b.w*.35):14};
function touchUpdate(){const was={...touch};for(const k in touch)touch[k]=false;let worldTouch=null;
  for(const[,t]of activeTouches){if(t.ui)continue;
    // Un doigt parti d'un bouton reste une commande : il glisse de ◀ à ▶ sans jamais miner le monde par erreur.
    if(t.btn){const b=nearestBtn(t,touchReach()*2.5);if(b)touch[b.k]=true;continue}
    worldTouch=t}
  for(const k in touch)if(touch[k]&&!was[k])buzz(k==='a'?14:8);
  if(worldTouch){mouse.x=worldTouch.x;mouse.y=worldTouch.y;mouse.l=true;mouse.inside=true}else mouse.l=false;updateMouseWorld()}
// Visée automatique du bouton d'action : ennemi proche pour l'épée/l'arc, sinon le bloc devant (ou dessous avec ▼).
function autoAim(it){const p=player,pcx=p.x+p.w/2,pcy=p.y+6;
  if(it&&it.use==='bomb'){let best=null,bd=170;for(const e of ents){if(!e.hp||e===p||e.type==='item'||!hostile(p,e))continue;const d=Math.hypot(e.x+e.w/2-pcx,e.y+e.h/2-pcy);if(d<bd){bd=d;best=e}}
    if(best)return{x:best.x+best.w/2,y:best.y+best.h/2};if(touch.d)return{x:pcx+p.dir*6,y:pcy+40};return{x:pcx+p.dir*60,y:pcy-20}}
  if(it&&(it.tool==='sword'||it.tool==='bow')){const rg=it.tool==='bow'?220:40;let best=null,bd=rg;
    for(const e of ents){if(!e.hp||e===p||e.type==='item'||!hostile(p,e))continue;const d=Math.hypot(e.x+e.w/2-pcx,e.y+e.h/2-pcy);if(d<bd){bd=d;best=e}}
    if(best)return{x:best.x+best.w/2,y:best.y+best.h/2};return{x:pcx+p.dir*24,y:pcy}}
  const ftx=Math.floor((pcx+p.dir*(p.w/2+4))/T),htx=Math.floor(pcx/T),hy=Math.floor((p.y+2)/T),fy=Math.floor((p.y+p.h-2)/T),below=Math.floor((p.y+p.h+2)/T);
  const at=(tx,ty)=>({x:tx*T+8,y:ty*T+8});
  if(it&&it.place!==undefined){const free=(tx,ty)=>{const c=getT(tx,ty);return c===AIR||c===PLANT||c===WATER};
    if(touch.d)return at(htx,below);for(const ty of[fy,fy+1,hy])if(free(ftx,ty))return at(ftx,ty);return at(ftx,fy)}
  const solid=(tx,ty)=>{const c=getT(tx,ty);return c!==AIR&&c!==WATER&&TD[c].hard!==Infinity};
  if(touch.d)return at(htx,below);
  for(const ty of[hy,fy])if(solid(ftx,ty))return at(ftx,ty);
  if(solid(htx,hy-1))return at(htx,hy-1);return at(ftx,fy+1)}

// =====================================================================
//  ENTRÉES
// =====================================================================
function updateMouseWorld(){mouse.wx=mouse.x+cam.x;mouse.wy=mouse.y+cam.y}
function toLocal(ev){const r=cv.getBoundingClientRect();return{x:(ev.clientX-r.left)*cv.width/r.width/S,y:(ev.clientY-r.top)*cv.height/r.height/S}}
function uiClick(x,y){for(let i=uiHits.length-1;i>=0;i--){const h=uiHits[i];if(x>=h.x&&x<h.x+h.w&&y>=h.y&&y<h.y+h.h){pressFx={...h,t:performance.now()};h.fn();return true}}return false}
cv.addEventListener('mousemove',ev=>{const p=toLocal(ev);mouse.x=p.x;mouse.y=p.y;mouse.inside=true;updateMouseWorld()});
cv.addEventListener('mouseleave',()=>{mouse.inside=false;mouse.l=mouse.r=false});
cv.addEventListener('mousedown',ev=>{audioInit();cv.focus();const p=toLocal(ev);mouse.x=p.x;mouse.y=p.y;mouse.inside=true;updateMouseWorld();
  if(ev.button===0){if(uiClick(p.x,p.y))return;if(panel&&panelRect&&p.x>=panelRect.x&&p.x<panelRect.x+panelRect.w&&p.y>=panelRect.y&&p.y<panelRect.y+panelRect.h)return;mouse.l=true}
  if(ev.button===2)mouse.r=true});
addEventListener('mouseup',ev=>{if(ev.button===0)mouse.l=false;if(ev.button===2)mouse.r=false});
cv.addEventListener('contextmenu',ev=>ev.preventDefault());
cv.addEventListener('wheel',ev=>{if(state!=='play')return;ev.preventDefault();player.sel=(player.sel+(ev.deltaY>0?1:8))%9},{passive:false});
addEventListener('keydown',ev=>{keys[ev.code]=true;audioInit();
  if(ev.code==='Escape'&&menuPanel){menuPanel=null;return}
  if(state!=='play')return;
  if(ev.code.startsWith('Digit')){const n=+ev.code.slice(5);if(n>=1&&n<=9)player.sel=n-1}
  if(paused&&ev.code!=='Escape'&&ev.code!=='KeyP')return;
  if(ev.code==='KeyB')togglePanel('base');if(ev.code==='KeyC')togglePanel('craft');if(ev.code==='KeyE'||ev.code==='KeyI')togglePanel('inv');
  if(ev.code==='KeyR')toggleOrder();if(ev.code==='KeyF')drinkPotion();if(ev.code==='KeyH')startRecall();if(ev.code==='Escape'||ev.code==='KeyP'){if(panel&&ev.code==='Escape'){panel=null;cursorItem=null}else{paused=!paused;pauseHelp=false}}if(ev.code==='KeyM'){muted=!muted;toast(muted?'Son coupé':'Son activé',1.5)}
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(ev.code))ev.preventDefault()});
addEventListener('keyup',ev=>{keys[ev.code]=false});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.l=mouse.r=false;if(state==='play')paused=true});
cv.addEventListener('touchstart',ev=>{ev.preventDefault();audioInit();for(const t of ev.changedTouches){const p=toLocal(t);const ui=state!=='play'||uiHits.some(h=>p.x>=h.x&&p.x<h.x+h.w&&p.y>=h.y&&p.y<h.y+h.h)||(panel&&panelRect&&p.x>=panelRect.x&&p.x<panelRect.x+panelRect.w&&p.y>=panelRect.y&&p.y<panelRect.y+panelRect.h);
  if(ui){mouse.x=p.x;mouse.y=p.y;uiClick(p.x,p.y)}activeTouches.set(t.identifier,{...p,ui,btn:!ui&&state==='play'&&!!nearestBtn(p,touchReach())})}if(state==='play')touchUpdate()},{passive:false});
cv.addEventListener('touchmove',ev=>{ev.preventDefault();for(const t of ev.changedTouches){const a=activeTouches.get(t.identifier);if(a){const p=toLocal(t);a.x=p.x;a.y=p.y}}if(state==='play')touchUpdate()},{passive:false});
const tEnd=ev=>{for(const t of ev.changedTouches)activeTouches.delete(t.identifier);if(state==='play')touchUpdate()};cv.addEventListener('touchend',tEnd);cv.addEventListener('touchcancel',tEnd);

// =====================================================================
//  DÉMARRAGE
// =====================================================================
buildTextures();buildSprites();buildBackdrops();loadCalques();genWorld(4242);HD_TILES.im.src=TILES_HD;TREE_ART.im.src=TREES_HD;
bases=[0,1].map(t=>({team:t,core:{x:(t===0?19:WW-20)*T-3,y:BASE_GY*T-34,w:22,h:34,dead:false},castleX:(t===0?19:WW-20)*T-80}));computeLight();
// ---------- intégration Android (Capacitor) : bouton retour, pause en arrière-plan ----------
const NATIVE=!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
if(NATIVE){const App=window.Capacitor.Plugins.App;
  if(App){App.addListener('backButton',()=>{if(menuPanel)menuPanel=null;else if(state==='play'){if(panel)panel=null;else if(paused&&pauseHelp)pauseHelp=false;else paused=!paused}else if(state==='title')App.exitApp();else state='title'});
    App.addListener('pause',()=>{saveGame();if(state==='play')paused=true;if(AC)AC.suspend()});App.addListener('resume',()=>{if(AC)AC.resume().catch(()=>{});resize()})}}
// version web : mise en cache hors ligne (installable comme une appli)
else if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});
let last=performance.now();
// ---------- manette (Gamepad API, disposition standard) ----------
// A saut / valider · B retour · X ou RT action · Y sac · LB/RB barre d'objets · LT base · L3 forge · Select ordre · Start pause
// Dans les menus (titre, fin, pause, panneaux) : croix ou stick pour déplacer le focus, A pour cliquer.
const pad={on:false,prev:[],l:false,r:false,j:false,d:false,a:false,nav:0};let padFocus=null,padHit=null;
function padMenu(){return state!=='play'||paused||!!panel||!!menuPanel}
function padMove(dx,dy){if(!uiHits.length)return;const c=padHit?{x:padHit.x+padHit.w/2,y:padHit.y+padHit.h/2}:{x:VW/2,y:VH/2};let best=null,bs=1e9;
  for(const h of uiHits){if(h===padHit)continue;const hx=h.x+h.w/2-c.x,hy=h.y+h.h/2-c.y,fw=hx*dx+hy*dy;if(fw<=2)continue;const sc=fw+Math.abs(hx*dy-hy*dx)*2.5;if(sc<bs){bs=sc;best=h}}
  if(best){padFocus={x:best.x+best.w/2,y:best.y+best.h/2};sfx.place()}}
function resolvePadHit(){padHit=null;if(!pad.on||!padMenu()||!uiHits.length)return;
  if(padFocus){let bd=1e9;for(const h of uiHits){const d=Math.hypot(h.x+h.w/2-padFocus.x,h.y+h.h/2-padFocus.y);if(d<bd){bd=d;padHit=h}}if(bd>24)padHit=null}
  if(!padHit){padHit=uiHits.reduce((a,h)=>h.w*h.h>a.w*a.h?h:a,uiHits[0]);padFocus={x:padHit.x+padHit.w/2,y:padHit.y+padHit.h/2}}}
function pollPad(dt){const gp=navigator.getGamepads?[...navigator.getGamepads()].find(g=>g&&g.connected):null;
  if(!gp){if(pad.on){pad.on=false;touch.l=touch.r=touch.j=touch.d=touch.a=false}return}
  if(!pad.on){pad.on=true;toast('Manette connectée',2)}audioInit();
  const b=i=>!!(gp.buttons[i]&&(gp.buttons[i].pressed||gp.buttons[i].value>.5)),hit=i=>b(i)&&!pad.prev[i];
  const ax=gp.axes[0]||0,ay=gp.axes[1]||0,L=b(14)||ax<-.4,R=b(15)||ax>.4,U=b(12)||ay<-.5,D=b(13)||ay>.5;
  resolvePadHit();
  if(padMenu()){
    for(const k of['l','r','j','d','a'])if(pad[k]){pad[k]=false;touch[k]=false}
    const dir=L?1:R?2:U?3:D?4:0;pad.nav-=dt;if(dir&&(dir!==pad.navDir||pad.nav<=0)){pad.nav=dir!==pad.navDir?.32:.12;padMove(dir===1?-1:dir===2?1:0,dir===3?-1:dir===4?1:0)}pad.navDir=dir;
    if(hit(0)&&padHit){pressFx={...padHit,t:performance.now()};padHit.fn()}
    if(hit(1)){if(menuPanel)menuPanel=null;else if(panel){panel=null;cursorItem=null}else if(paused){paused=false;pauseHelp=false}}
  }else{
    const st={l:L&&!R,r:R&&!L,j:b(0)||U,d:D,a:b(2)||b(7)};
    for(const k in st)if(st[k]!==pad[k]){pad[k]=st[k];touch[k]=st[k]}
    if(hit(4))player.sel=(player.sel+8)%9;if(hit(5))player.sel=(player.sel+1)%9;
  }
  if(state==='play'){if(hit(9)){if(menuPanel)menuPanel=null;else{paused=!paused;pauseHelp=false}}
    if(!paused){if(hit(3))togglePanel('inv');if(hit(6))togglePanel('base');if(hit(10))togglePanel('craft');if(hit(8))toggleOrder()}}
  pad.prev=gp.buttons.map(x=>x.pressed||x.value>.5)}
addEventListener('gamepadconnected',()=>audioInit());
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;try{pollPad(dt);update(dt);render()}catch(err){console.error(err)}requestAnimationFrame(frame)}
requestAnimationFrame(frame);
window.__dbgT=(x,y)=>{const t=getT(x,y);return t===0?'.':t===LOG||t===LEAF||t===PLANT?',':t>=10?String.fromCharCode(55+t):''+t};window.__game={get stats(){return stats},get paused(){return paused},set paused(v){paused=v},saveGame,loadGame,step(n,dt=1/30){for(let i=0;i<n;i++)update(dt)},get state(){return state},newGame,dbg:{TRM,set panel(v){panel=v},set help(v){pauseHelp=v},endGame,SPR,ICON,text:(g,s,x,y,col,size,align='center')=>{TXC=g;txt(s,x,y,col,size,align);TXC=null},uiWidth,get weather(){return weather},explode,throwBomb,unlock,kill,addItem,menu:m=>{menuPanel=m;panelT=1},PROF,shareText,shareResult,findRelic,set paused(v){paused=v},hurt,DIFFS,diffOpen,UNITS,tr,startRecall,drinkPotion,toggleOrder,get ai(){return ai},get msgs(){return msgs}},get objTgt(){return objTgt},get tut(){return tut},get firstRun(){return firstRun},get player(){return player},get ents(){return ents},get bases(){return bases},recruit,set time(v){time=v},get time(){return time},cam};

    return window.__game;
  })();
}
