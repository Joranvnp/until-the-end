// Tests de fumée du moteur (mobile-app/game/engine.js) dans Chromium sans écran : npm test   (Playwright requis, comme pour gen-art.mjs)
// Vérifie qu'aucune erreur n'apparaît dans la console et que les règles principales tiennent :
// 5 difficultés, IA rouge (vagues, champion, dernier carré), guérisseur, ordre Tenir, rappel, potion, ogre de sang, bénédictions, sauvegarde et migrations.
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { startGameServer } from './game-server.mjs';
import path from 'path';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = createRequire('/opt/node-tools/node_modules/')('playwright'); }
// le moteur de l'app est servi par le banc d'essai (tools/game-server.mjs), comme avec `npm run play`
const server = await startGameServer();
const game = server.url;
const browser = await pw.chromium.launch();
let failed = 0;
// chaque test reçoit une page neuve (profil vide) ; `fn` s'exécute dans la page et renvoie '' si tout va bien, sinon le problème
async function test(name, fn, opt = {}) {
  const ctx = await browser.newContext({ viewport: opt.viewport || { width: 1366, height: 768 }, locale: opt.locale || 'fr-FR', hasTouch: !!opt.touch });
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); page.on('pageerror', e => errs.push(String(e)));
  if (opt.init) await page.addInitScript(opt.init);
  await page.goto(game); await page.waitForFunction('window.__game'); await page.waitForTimeout(150);
  let res; try { res = await page.evaluate(fn); if (opt.after) res = res || await opt.after(page); } catch (e) { res = 'exception : ' + e.message; }
  await page.waitForTimeout(150);
  const bad = res || (errs.length ? 'console : ' + errs[0] : '');
  console.log((bad ? 'ÉCHEC ' : 'ok    ') + name + (bad ? ' → ' + bad : '')); if (bad) failed++;
  await ctx.close();
}
// les bénédictions sont coupées par défaut : leur tirage dépend du monde (aléatoire) et fausserait les règles vérifiées ici ; leurs deux tests les rallument
const start = `const G=__game,D=G.dbg;D.PROF.tutDone=true;D.boon.off=true;const sec=n=>G.step(n*30);const units=(t,k)=>G.ents.filter(e=>e.type==='unit'&&e.team===t&&!e.dead&&(!k||e.kind===k));`;
const run = body => new Function(start + body);

await test('écran titre et panneaux de menu', run(`
  for(const m of ['set','ach','quest','relic','shop'])D.menu(m);return new Promise(r=>setTimeout(()=>r(G.state==='title'?'':'état '+G.state),400))`));
await test('5 difficultés jouables, de plus en plus dures', run(`
  if(D.DIFFS.length!==5)return 'DIFFS = '+D.DIFFS.length;const inc=[],first=[];
  for(let d=0;d<5;d++){G.newGame(d);sec(60);if(G.state!=='play')return 'difficulté '+d+' : état '+G.state;inc.push(D.DIFFS[d].inc);first.push(D.DIFFS[d].first)}
  for(let d=1;d<5;d++)if(inc[d]<=inc[d-1]||first[d]>=first[d-1])return 'paramètres non croissants';return ''`));
await test('partie sans rien faire : défaite (Normal)', run(`
  G.newGame(1);for(let i=0;i<1500&&G.state==='play';i++)sec(1);return G.state==='lose'?'':'état '+G.state+' après '+Math.round(G.time)+' s'`));
await test('grosse armée : victoire (Normal)', run(`
  G.newGame(1);const b=G.bases[0];for(let i=0;i<34;i++)G.recruit(0,['warrior','warrior','archer','healer','golem'][i%5],true);b.order='attack';
  for(let i=0;i<1500&&G.state==='play';i++)sec(1);return G.state==='win'?'':'état '+G.state+' après '+Math.round(G.time)+' s'`));
await test('guérisseur : soigne un allié blessé et le héros', run(`
  G.newGame(1);G.bases[0].order='defend';const w=G.recruit(0,'warrior',true),h=G.recruit(0,'healer',true);sec(4);w.hp=30;G.player.hp=40;G.player.x=w.x;sec(8);
  return w.hp>60&&G.player.hp>50&&h.hp>0?'':'guerrier '+Math.round(w.hp)+' PV, héros '+Math.round(G.player.hp)+' PV'`));
await test('ordre Tenir : les troupes rejoignent le fanion', run(`
  G.newGame(1);for(let i=0;i<5;i++)G.recruit(0,i%2?'archer':'warrior',true);G.player.x=70*16;sec(1);const b=G.bases[0];b.order='defend';D.toggleOrder();
  if(b.order!=='hold'||Math.abs(b.holdX-G.player.x)>16)return 'ordre '+b.order+' holdX '+b.holdX;sec(60);
  const far=units(0).filter(e=>Math.abs(e.x-b.holdX)>60).length;D.toggleOrder();return far?far+' unités loin du fanion':b.order==='follow'?'':'ordre suivant : '+b.order`));
await test('rappel à la base (touche H) et potion (touche F)', run(`
  G.newGame(1);const p=G.player;p.x=150*16;p.y=20*16;sec(2);window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyH'}));window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyH'}));
  if(!(p.recall>0))return 'rappel non lancé';sec(4);if(Math.abs(p.x-G.bases[0].core.x)>80)return 'héros resté à x='+Math.round(p.x);if(!(p.recallCd>30))return 'pas de recharge';
  D.addItem('potion',1);p.hp=30;window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyF'}));return p.hp===80?'':'PV après potion : '+p.hp`));
await test('ogre de sang : arrive à la lune de sang, trésor et succès', run(`
  G.newGame(1);G.time=300+300*.62;sec(3);const o=G.ents.find(e=>e.kind==='ogre');if(!o)return 'pas d\\'ogre';const x0=o.x;sec(20);
  if(!(o.x<x0-200))return 'l\\'ogre n\\'avance pas ('+Math.round(x0-o.x)+' px en 20 s)';const n=G.ents.length;D.kill(o,G.player);
  return D.PROF.ach.ogre&&G.ents.length>n?'':'pas de butin ou de succès'`));
await test("ogre de sang : s'évapore à l'aube", run(`
  G.newGame(0);G.time=300+300*.62;sec(3);if(!G.ents.some(e=>e.kind==='ogre'))return 'pas d\\'ogre';for(let i=0;i<260;i++)sec(1);
  return G.ents.some(e=>e.kind==='ogre'&&!e.dead)?'ogre encore là de jour':''`));
await test('onde de choc du cœur bleu (Normal) et dernier carré rouge', run(`
  G.newGame(1);const c=G.bases[0].core,foe=G.recruit(1,'warrior',true);foe.x=c.x+40;foe.y=c.y;c.hp=c.maxhp*.26;D.hurt(c,60,G.player);
  if(!c.surged||foe.hp>=foe.maxhp)return 'pas d\\'onde de choc';
  const r=G.bases[1].core,n=units(1).length;r.hp=r.maxhp*.39;sec(1);return D.ai.stand&&units(1).length>=n+2?'':'pas de garde d\\'élite'`));
await test('Brutal : le champion mène la vague, un commando vise le cœur', run(`
  G.newGame(3);for(let i=0;i<600&&G.bases[1].order!=='attack';i++)sec(1);if(G.bases[1].order!=='attack')return 'pas de vague en 10 min';
  const ch=D.ai.champ;return (ch&&ch.war||ch&&ch.hp<=ch.maxhp*.6||!ch||ch.dead)&&units(1).some(e=>e.cmd)?'':'champion war='+(ch&&ch.war)+', commandos='+units(1).filter(e=>e.cmd).length`));
await test('victoire en Difficile : succès, record, et le Cauchemar s\'ouvre', run(`
  if(D.diffOpen(4))return 'Cauchemar ouvert sur un profil neuf';G.newGame(2);sec(5);D.kill(G.bases[1].core,G.player);sec(3);
  return G.state==='win'&&D.PROF.ach.winh&&D.PROF.rec.kh>0&&D.diffOpen(4)?'':'état '+G.state+', record '+D.PROF.rec.kh+', ouvert '+D.diffOpen(4)`));
await test('sauvegarde et reprise (ordre Tenir, garde, vétérans)', run(`
  G.newGame(4);for(let i=0;i<4;i++)G.recruit(0,'healer',true);const b=G.bases[0];b.order='hold';b.holdX=999;D.ai.vet=.1;D.ai.stand=true;sec(5);const t=G.time,n=units(0).length;G.saveGame();
  G.newGame(0);if(!G.loadGame())return 'chargement refusé';const b2=G.bases[0];
  return b2.order==='hold'&&b2.holdX===999&&D.ai.vet===.1&&D.ai.stand&&units(0,'healer').length===4&&Math.abs(G.time-t)<1?'':'données perdues'`));
await test('bénédictions : 3 offres au début, jeu figé, choix appliqué, tirage stable après reprise', run(`
  D.boon.off=false;G.newGame(1);G.step(60,1/30,false);const p=D.boon.pick;if(!p||p.length!==3||new Set(p).size!==3)return 'pas de tirage au début : '+JSON.stringify(p);
  const t=G.time;G.step(30,1/30,false);if(G.time!==t)return 'le jeu avance pendant le choix';
  G.saveGame();G.newGame(0);if(!G.loadGame())return 'chargement refusé';G.step(5,1/30,false);if(JSON.stringify(D.boon.pick)!==JSON.stringify(p))return 'tirage changé après reprise';
  D.boon.reroll();if(D.boon.re!==0||JSON.stringify(D.boon.pick)===JSON.stringify(p))return 'relance sans effet';D.boon.reroll();
  const id=D.boon.pick[1];D.boon.choose(1);if(D.boon.pick||D.boon.own[id]!==1)return 'choix non appliqué';G.step(30,1/30,false);if(D.boon.pick)return 'second tirage le même jour';
  G.time=299;sec(3);if(G.stats.boons!==2)return 'pas de tirage à l\\'aube : '+G.stats.boons;return ''`));
await test('bénédictions : effets (unités, héros, cœur, prix) et sauvegarde', run(`
  G.newGame(1);sec(3);const B=D.boon,b=G.bases[0],c=b.core.maxhp;
  const w0=units(0,'warrior').length,m0=units(0,'miner').length;
  for(const id of['vigor','heart','bastion','supply','crew','levy','fury','march','volley','thorns','pulse','mend','leech','vein','tithe','loot','regen','haste','drill','hearth','ballista','might','bombs','cache','golem'])B.give(id);
  const hp=Math.round(D.UNITS.warrior.hp*(1+.2*B.own.vigor)),w=units(0,'warrior');if(w.length!==w0+3||w.some(e=>e.maxhp!==hp))return 'Sang de fer / Levée : '+w.map(e=>e.maxhp)+' attendu '+hp;
  if(units(0,'miner').length!==m0+2||!units(0,'golem').length)return 'renforts absents';
  const mh=100+30*B.own.heart;if(G.player.maxhp!==mh)return 'Cœur vaillant : '+G.player.maxhp;if(b.core.maxhp!==c+400*B.own.bastion)return 'Bastion : '+b.core.maxhp;
  Object.assign(b.storage,{wood:0,stone:0,coal:0,copper:0,iron:0,silver:0,gold:0,diamond:0});const full=D.UNITS.warrior.cost;for(const k in full)b.storage[k]=Math.ceil(full[k]*.85);
  if(!G.recruit(0,'warrior'))return 'Intendance : prix non réduit';
  // le cœur attaqué : épines et onde gardienne blessent l'assaillant
  const foe=G.recruit(1,'warrior',true);foe.x=b.core.x+30;foe.y=b.core.y;const h=foe.hp;D.hurt(b.core,20,foe);if(foe.hp>=h)return 'épines ou onde sans effet';
  sec(25);G.saveGame();const n=Object.keys(B.own).length;G.newGame(0);G.loadGame();
  if(Object.keys(B.own).length!==n||G.player.maxhp!==mh)return 'bénédictions perdues à la reprise';
  // Pierre de foyer : rappel en 1 s, 15 s de recharge
  const p=G.player;p.x=150*16;p.y=20*16;sec(1);D.startRecall();sec(2);return Math.abs(p.x-G.bases[0].core.x)<80&&p.recallCd>10&&p.recallCd<=15?'':'Pierre de foyer : x='+Math.round(p.x)+' recharge '+p.recallCd`));
await test('migration : anciens records et ancienne sauvegarde Brutal', run(`
  if(D.PROF.rec.kb!==777||D.PROF.rec.kn!==555||D.PROF.rec['2'])return 'records : '+JSON.stringify(D.PROF.rec);if(D.PROF.lastDiff!==3)return 'dernier niveau choisi : '+D.PROF.lastDiff;
  G.newGame(1);sec(2);G.saveGame();const s=JSON.parse(localStorage.getItem('ute-save-v1'));delete s.dv;s.diff=2;localStorage.setItem('ute-save-v1',JSON.stringify(s));
  G.loadGame();D.kill(G.bases[1].core,G.player);sec(3);return D.PROF.ach.win2?'':'l\\'ancien Brutal n\\'est pas rechargé en Brutal'`),
  { init: `try{if(!localStorage.getItem('ute-profile-v1'))localStorage.setItem('ute-profile-v1',JSON.stringify({games:3,lastDiff:2,rec:{'1':555,'2':777}}))}catch(e){}` });
await test('anglais : aucun nouveau texte resté en français', run(`
  D.PROF.set.en=true;const fr=['Guérisseur','Nouvelle partie','Difficile','Cauchemar','Tenir','Rappel','Ogre de sang','Fanion planté : tes troupes tiennent cette position.',
    'Un ogre de sang marche sur ta base ! Abats-le avant l\\'aube pour son trésor.','Rappel prêt dans 12 s.','Tu es tombé… retour à la base dans 8 s.','Le cœur rouge vacille : sa garde d\\'élite sort du château !',
    ...D.DIFFS.map(d=>d.d),...Object.values(D.UNITS).map(u=>u.d).filter(Boolean),...D.boon.BOONS.flatMap(b=>[b.n,b.d]),'Choisis une bénédiction','Un bonus pour toute la partie. Un autre viendra à chaque aube.',
    'Bénédiction : Sang de fer','Économie','Armée','Héros','Immédiat','Relancer','Onde gardienne : ton cœur repousse les assaillants !','Béni des anciens','Aucune bénédiction pour l\\'instant.'];
  const bad=fr.filter(s=>D.tr(s)===s||/[éèêàçœ]/i.test(D.tr(s)));return bad.length?'non traduits : '+bad.join(' | '):''`));
for (const [name, viewport, touch] of [['PC 1366x768', { width: 1366, height: 768 }, false], ['téléphone portrait 390x844', { width: 390, height: 844 }, true], ['téléphone paysage 844x390', { width: 844, height: 390 }, true], ['tablette 1024x768', { width: 1024, height: 768 }, true]])
  await test('affichage ' + name + ' : panneaux sans erreur', run(`
    G.newGame(1);const b=G.bases[0];for(const k of ['miner','warrior','archer','healer','golem'])G.recruit(0,k,true);D.addItem('potion',2);G.player.hp=30;sec(3);
    return new Promise(r=>{const seq=['base','craft','inv',null];let i=0;const next=()=>{if(i<seq.length){D.panel=seq[i++];setTimeout(next,120)}else{D.boon.offer();setTimeout(()=>{D.boon.reroll();setTimeout(()=>{D.boon.choose(1);G.paused=true;D.help=3;setTimeout(()=>{D.help=2;setTimeout(()=>{D.help=1;setTimeout(()=>r(''),120)},120)},120)},120)},120)}};next()})`), { viewport, touch });

await browser.close(); server.close();
console.log(failed ? failed + ' test(s) en échec' : 'Tous les tests passent.');
process.exit(failed ? 1 : 0);
