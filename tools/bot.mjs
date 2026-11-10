// Parties jouées par un joueur automatique, pour juger l'équilibrage et trouver où une partie s'enlise (Playwright requis, comme npm test).
//   node tools/bot.mjs <difficulté 0-4> <nov|avg|exp> <graines a,b,c> [on,off]
//       parties appariées : le même monde avec (on) et sans (off) bénédictions. Une ligne par partie :
//       résultat et minute (w = victoire, l = défaite, p = toujours en cours à 35 min), pic d'effectif, PV mini du cœur bleu,
//       PV restants du cœur rouge, minutes des ordres d'assaut, bénédictions prises.
//   node tools/bot.mjs --diag <graine> [minutes] [difficulté]
//       une partie détaillée : état minute par minute, puis où sont les unités, l'état du commandant rouge et le terrain près de la base bleue.
// Limite connue : ce joueur reste en Défense tant que le rouge est en Assaut. Une vague rouge qui n'arrive jamais le bloque donc
// indéfiniment (voir docs/prochaine-session.md) : un « p35 » signale un enlisement à examiner avec --diag, pas forcément un match nul réel.
import { createRequire } from 'module';
import { startGameServer } from './game-server.mjs';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = createRequire('/opt/node-tools/node_modules/')('playwright'); }

// s'exécute dans la page : joue une partie et renvoie le bilan
function play({ d, sk, seed, mode, mins, diag }) {
  const G = window.__game, D = G.dbg; D.PROF.tutDone = true; D.boon.off = mode === 'off';
  G.newGame(d, { seed, mod: { id: 'none', n: 'Test', d: '' }, key: 1 });
  const K = { nov: { inc: .6, atk: 8, up: false, min: 2 }, avg: { inc: 1, atk: 12, up: true, min: 3 }, exp: { inc: 1.5, atk: 16, up: true, min: 4 } }[sk];
  let t = 0, minCore = 1, peak = 0; const acc = {}, atkT = [], log = [];
  // revenu simulé du héros qui mine (par minute), ajusté par le niveau du joueur
  const add = (k, perMin) => { acc[k] = (acc[k] || 0) + perMin / 60 * K.inc; const n = Math.floor(acc[k]); if (n) { acc[k] -= n; G.bases[0].storage[k] += n; } };
  const blue = () => G.ents.filter(e => e.type === 'unit' && e.team === 0 && !e.dead);
  for (; t < mins * 60;) {
    G.step(30); t++; if (G.state !== 'play') break;
    const b = G.bases[0], st = b.storage, mine = blue(), c = k => mine.filter(e => e.kind === k).length, f = mine.length - c('miner');
    add('wood', 14); add('stone', 16); add('coal', 5); add('copper', 8); if (t > 180) add('iron', 3.5); if (t > 360) add('silver', 1.6); if (t > 480) add('gold', .8);
    peak = Math.max(peak, f); minCore = Math.min(minCore, b.core.hp / b.core.maxhp);
    if (t % 2 === 0) {
      if (c('miner') < K.min) G.recruit(0, 'miner');
      else {
        if (f >= 5 && c('healer') < Math.floor(f / 6)) G.recruit(0, 'healer');
        if (f >= 8 && st.gold >= 2 && st.silver >= 4) G.recruit(0, 'golem');
        G.recruit(0, c('warrior') <= c('archer') * 1.5 ? 'warrior' : 'archer') || G.recruit(0, 'warrior');
      }
    }
    if (K.up && t % 5 === 0) {
      const C = { tower: { stone: 15, silver: 3 }, dmg: { iron: 6, gold: 2 }, core: { stone: 20, iron: 4 }, speed: { copper: 8, coal: 6 } };
      for (const id of ['tower', 'dmg', 'core', 'speed']) {
        const l = b.upg[id]; if (l >= 3 || (id !== 'tower' && f < 6)) continue;
        const cost = Object.fromEntries(Object.entries(C[id]).map(([k, v]) => [k, Math.ceil(v * (1 + .6 * l))]));
        if (Object.entries(cost).every(([k, v]) => st[k] >= v + (k === 'stone' ? 20 : 0))) { for (const k in cost) st[k] -= cost[k]; b.upg[id]++; if (id === 'core') { b.core.maxhp += 300; b.core.hp += 300; } break; }
      }
    }
    const redAtk = G.bases[1].order === 'attack', o0 = b.order;
    if (redAtk) { if (b.order !== 'defend') b.order = 'defend'; } else if (b.order === 'defend' && f >= K.atk) b.order = 'attack'; else if (b.order === 'attack' && f <= Math.max(3, K.atk / 3)) b.order = 'defend';
    if (t === 1) b.order = 'defend'; if (b.order === 'attack' && o0 !== 'attack') atkT.push(Math.round(t / 60));
    if (diag && t % 60 === 0) {
      const h = {}; for (const e of mine) if (e.kind !== 'miner') { const k = Math.floor(e.x / 16 / 20) * 20; h[k] = (h[k] || 0) + 1; }
      log.push('min' + t / 60 + ' ordres ' + b.order + '/' + G.bases[1].order + ' bleus ' + f + ' ' + JSON.stringify(h) + ' rouges ' + G.ents.filter(e => e.type === 'unit' && e.team === 1 && !e.dead).length + ' cœur rouge ' + Math.round(G.bases[1].core.hp));
    }
  }
  const res = { s: G.state, t, minCore: +minCore.toFixed(2), peak, atk: atkT.slice(0, 6).join('/'), red: Math.round(G.bases[1].core.hp / G.bases[1].core.maxhp * 100), bo: Object.entries(D.boon.own).map(([k, v]) => k + (v > 1 ? v : '')).join(',') };
  if (diag) {
    const pos = e => e.kind[0] + '@' + Math.round(e.x / 16) + ',' + Math.round((e.y + e.h) / 16) + ':' + (e.state || '') + (e.tgt ? '>' + (e.tgt.type === 'unit' ? e.tgt.kind : e.tgt.type) : '');
    const cnt = {}; for (const e of blue()) if (e.kind !== 'miner') { const k = pos(e).slice(1); cnt[k] = (cnt[k] || 0) + 1; }
    res.log = log; res.blue = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, n]) => n + '×' + k);
    res.reds = G.ents.filter(e => e.type === 'unit' && e.team === 1 && !e.dead).map(e => pos(e) + ' pv' + Math.round(e.hp));
    res.ai = JSON.stringify(D.ai, (k, v) => v && typeof v === 'object' && v.type ? '<' + v.type + '>' : v).slice(0, 700);
    res.map = []; for (let y = 58; y < 80; y++) { let r = ''; for (let x = 10; x < 60; x++) r += window.__dbgT(x, y) || '?'; res.map.push(String(y).padStart(3) + ' ' + r); }
  }
  return res;
}

const args = process.argv.slice(2), server = await startGameServer(), browser = await pw.chromium.launch();
const run = async job => {
  const p = await browser.newPage({ viewport: { width: 1366, height: 768 } }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(server.url); await p.waitForFunction('window.__game');
  const r = await p.evaluate(play, job); await p.close(); if (errs.length) r.err = errs[0].slice(0, 120); return r;
};
if (args[0] === '--diag') {
  const r = await run({ d: +(args[3] ?? 1), sk: 'avg', seed: +args[1], mode: 'off', mins: +(args[2] || 12), diag: true });
  console.log(r.log.join('\n')); console.log('\nÉtat :', r.s, '· bleus (nombre × case:état) :', r.blue.join(' | ')); console.log('Rouges :', r.reds.join(' | '));
  console.log('Commandant rouge :', r.ai); console.log('Terrain près de la base bleue (x 10-59, y 58-79 ; . = vide, chiffres = roche, H = château) :\n' + r.map.join('\n')); if (r.err) console.log('ERREUR', r.err);
} else {
  const [d, sk, seeds, modes] = [+(args[0] ?? 1), args[1] || 'avg', (args[2] || '11,22,33').split(',').map(Number), (args[3] || 'on,off').split(',')];
  const jobs = seeds.flatMap(seed => modes.map(mode => ({ d, sk, seed, mode, mins: 35, diag: false }))), out = {};
  await Promise.all([1, 2, 3, 4].map(async () => { for (let j; (j = jobs.shift());) { const r = await run(j); out[j.seed + ' ' + j.mode] = r.s[0] + Math.round(r.t / 60) + ' pic' + r.peak + ' cœur' + r.minCore + ' rouge' + r.red + '% assauts@' + r.atk + ' [' + r.bo + ']' + (r.err ? ' ERREUR ' + r.err : ''); } }));
  for (const k of Object.keys(out).sort()) console.log(k.padEnd(10), out[k]);
}
await browser.close(); server.close();
