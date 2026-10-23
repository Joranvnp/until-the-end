// Génère icônes, écran de démarrage et visuels Play Store à partir des sprites du jeu.
// Usage : node tools/gen-art.mjs   (Playwright + Chromium requis)
import { createRequire } from 'module';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = createRequire('/opt/node-tools/node_modules/')('playwright'); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const game = 'file://' + path.join(root, 'www/index.html');
const browser = await pw.chromium.launch();
const page = await browser.newPage();
await page.goto(game); await page.waitForTimeout(300);
const save = (file, dataUrl) => { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64')); console.log('écrit', path.relative(root, file)); };
// art(kind, size) : dessine dans une toile et renvoie un PNG en data URL
const art = (kind, w, h) => page.evaluate(([kind, w, h]) => {
  const D = __game.dbg, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const bg = () => { const gr = g.createRadialGradient(w/2, h*.48, 0, w/2, h*.5, Math.max(w,h)*.7); gr.addColorStop(0, '#1d2a6a'); gr.addColorStop(.55, '#0d0f2a'); gr.addColorStop(1, '#05050c'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = (a)=>{let t=Math.sin(a*12.9898)*43758.5453;return t-Math.floor(t)}; for (let i=0;i<w*h/9000;i++){g.fillStyle=i%7?'#9bb8d6':'#ffe9b0';g.globalAlpha=.3+r(i)*.6;const z=Math.max(1,Math.round(w/256));g.fillRect(Math.floor(r(i+1)*w),Math.floor(r(i+2)*h),z,z)} g.globalAlpha=1; };
  const glow = (x,y,r,col,a=1)=>{const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,col);gr.addColorStop(1,col.slice(0,7)+'00');g.globalAlpha=a;g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);g.globalAlpha=1};
  const core = (cx, cy, hgt, team=0) => { const s = D.SPR['core'+team][0], z = Math.floor(hgt / s.height); glow(cx, cy, hgt*.9, team?'#e5534bcc':'#4f9df5cc'); g.drawImage(s, Math.round(cx - s.width*z/2), Math.round(cy - s.height*z/2), s.width*z, s.height*z); return z; };
  const hero = (x, y, z) => { const s = D.SPR.player.R.idle[0]; g.drawImage(s, Math.round(x), Math.round(y - s.height*z), s.width*z, s.height*z); const p = D.ICON.pick4; g.save(); g.translate(x + s.width*z*.75, y - s.height*z*.45); g.rotate(-.5); g.drawImage(p, -8*z, -14*z, 16*z, 16*z); g.restore(); };
  const logo = (y, size) => { D.text(g, 'UNTIL THE', w/2, y, '#e4e9ff', size); D.text(g, 'END', w/2, y + size*.95, '#ffb0a6', size); };
  if (kind === 'icon') { bg(); core(w/2, h*.5, h*.62); }
  if (kind === 'fg') { core(w/2, h*.5, h*.42); }
  if (kind === 'bgonly') { bg(); }
  if (kind === 'mask') { bg(); core(w/2, h*.5, h*.46); }
  if (kind === 'splash') { g.fillStyle = '#0b0a16'; g.fillRect(0, 0, w, h); const z = core(w/2, h*.45, Math.min(w,h)*.22); logo(h*.45 + 22*z, Math.floor(Math.min(w,h)/90)*7); }
  if (kind === 'feature') { bg(); core(w*.82, h*.5, h*.6, 1); const z = Math.floor(h*.42/26); hero(w*.08, h*.82, z); D.text(g, 'UNTIL THE END', w*.47, h*.36, '#e4e9ff', 49); D.text(g, 'MINE. FORGE. DÉTRUIS LEUR CŒUR.', w*.47, h*.62, '#ffd27a', 21); }
  return c.toDataURL('image/png');
}, [kind, w, h]);
save(path.join(root, 'www/icons/icon-512.png'), await art('icon', 512, 512));
save(path.join(root, 'www/icons/icon-192.png'), await art('icon', 192, 192));
save(path.join(root, 'www/icons/icon-maskable-512.png'), await art('mask', 512, 512));
save(path.join(root, 'assets/icon-only.png'), await art('icon', 1024, 1024));
save(path.join(root, 'assets/icon-foreground.png'), await art('fg', 1024, 1024));
save(path.join(root, 'assets/icon-background.png'), await art('bgonly', 1024, 1024));
save(path.join(root, 'assets/splash.png'), await art('splash', 2732, 2732));
save(path.join(root, 'assets/splash-dark.png'), await art('splash', 2732, 2732));
save(path.join(root, 'store/icone-512.png'), await art('icon', 512, 512));
save(path.join(root, 'store/banniere-1024x500.png'), await art('feature', 1024, 500));
await page.close();
// captures d'écran pour les fiches Play Store et App Store
const scenes = {
  '1-titre': ``,
  '2-jeu': `__game.newGame(1);const b=__game.bases[0];b.storage.stone=99;b.storage.copper=40;for(const k of ['miner','warrior','warrior','archer'])__game.recruit(0,k);__game.step(1500);const u=__game.ents.filter(e=>e.type==='unit'&&e.team===0&&!e.dead&&e.kind==='miner')[0];if(u){__game.player.x=u.x-30;__game.player.y=u.y-30}__game.step(60)`,
  '3-lune-de-sang': `__game.newGame(1);__game.time=300*3+300*.8;__game.step(600);__game.dbg.weather.target=.8;__game.dbg.weather.rain=.8;__game.dbg.weather.t=999;__game.step(30)`,
  '4-bataille': `__game.newGame(0);const b=__game.bases[0];for(let i=0;i<14;i++){b.storage.stone=999;b.storage.copper=999;b.storage.iron=99;b.storage.wood=99;__game.recruit(0,i%3?'warrior':'archer')}__game.step(30*150);const u=__game.ents.filter(e=>e.type==='unit'&&e.team===0&&!e.dead).sort((a,b)=>b.x-a.x)[0];if(u){__game.player.x=u.x-30;__game.player.y=u.y-30}__game.step(90)`,
};
// Play Store : téléphone 1080 x 1920 ; App Store : iPhone 6,9" (1320 x 2868) et iPad 13" (2064 x 2752)
const devices = [
  { out: 'store/capture', viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 },
  { out: 'store/ios/iphone-6.9', viewport: { width: 440, height: 956 }, deviceScaleFactor: 3 },
  { out: 'store/ios/ipad-13', viewport: { width: 1032, height: 1376 }, deviceScaleFactor: 2 },
];
mkdirSync(path.join(root, 'store/ios'), { recursive: true });
// une série en français (store/, store/ios/) et une en anglais (store/en/)
mkdirSync(path.join(root, 'store/en/ios'), { recursive: true });
for (const [locale, prefix] of [['fr-FR', ''], ['en-US', 'en/']]) for (const d0 of devices) {
  const d = { ...d0, out: d0.out.replace('store/', 'store/' + prefix) };
  const ctx = await browser.newContext({ locale, viewport: d.viewport, deviceScaleFactor: d.deviceScaleFactor, hasTouch: true, isMobile: true });
  for (const [n, code] of Object.entries(scenes)) { const p = await ctx.newPage(); await p.goto(game); await p.waitForTimeout(400); if (code) await p.evaluate(code); await p.waitForTimeout(1200); const f = `${d.out}-${n}.png`; await p.screenshot({ path: path.join(root, f) }); console.log('écrit ' + f); await p.close(); }
  await ctx.close();
}
await browser.close();
