/** Génère les effets et boucles musicales d’Until The End par synthèse DSP.
 * Commande prévue : npm run audio.
 * Commande autonome : node tools/gen-audio.mjs — Node 18+, ffmpeg, sans npm.
 * Tout est synthétisé ici (aucun échantillon externe) : instruments à cordes pincées
 * Karplus-Strong, lames de marimba et de kalimba, chœur à formants, percussions,
 * brume et gouttes de grotte, réverbération Freeverb repliée sur la boucle.
 */
import { mkdtemp, mkdir, writeFile, unlink, rmdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const SR = 44100, TAU = 2 * Math.PI;
const extra = process.argv.includes('--extra');
const output = resolve(dirname(fileURLToPath(import.meta.url)), extra ? '../musiques/nouvelles' : '../www/audio');
const started = performance.now();
let seed = 0x554e544c;
function random() {
  seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
  return (seed >>> 0) / 4294967296;
}
const noise = () => random() * 2 - 1;
const between = (a, b) => a + (b - a) * random();
const hz = midi => 440 * 2 ** ((midi - 69) / 12);
const sine = phase => Math.sin(TAU * phase);
const db = value => 10 ** (value / 20);

// Biquads RBJ : état propre à chaque voix, coefficients normalisés par a0.
function biquad(type, frequency, q = 0.707) {
  const w = TAU * Math.min(frequency, SR * 0.45) / SR, c = Math.cos(w), a = Math.sin(w) / (2 * q);
  let b0, b1, b2;
  if (type === 'low') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
  else if (type === 'high') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
  else { b0 = a; b1 = 0; b2 = -a; }
  const a0 = 1 + a, a1 = -2 * c / a0, a2 = (1 - a) / a0;
  b0 /= a0; b1 /= a0; b2 /= a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return x => {
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

// Filtre à variables d’état (TPT) : fréquence modulable à chaque échantillon.
function svf(mode) {
  let ic1 = 0, ic2 = 0;
  return (x, frequency, q = 0.707) => {
    const g = Math.tan(Math.PI * Math.min(frequency, SR * 0.45) / SR), k = 1 / q;
    const a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2;
    const v3 = x - ic2, v1 = a1 * ic1 + a2 * v3, v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2;
    return mode === 'low' ? v2 : mode === 'band' ? v1 : x - k * v1 - v2;
  };
}

// Dent de scie à bande limitée (polyBLEP) : pas de repliement criard dans les aigus.
function blep(t, dt) {
  if (t < dt) { t /= dt; return t + t - t * t - 1; }
  if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
  return 0;
}
function saw(phase, dt) { const t = phase - Math.floor(phase); return 2 * t - 1 - blep(t, dt); }

function adsr(t, duration, attack, decay, sustain, release) {
  if (t < 0 || t >= duration) return 0;
  const gate = t < attack ? t / attack
    : t < attack + decay ? 1 - (1 - sustain) * (t - attack) / decay : sustain;
  return gate * Math.min(1, (duration - t) / release);
}

function canvas(seconds, stereo = false, loop = false) {
  const length = Math.round(seconds * SR);
  return { channels: Array.from({ length: stereo ? 2 : 1 }, () => new Float32Array(length)), length, loop };
}

// Les boucles replient tout ce qui dépasse : une queue de note jouée en fin de
// morceau retombe sur le début, la jonction reste donc continue.
function layer(track, start, duration, amplitude, sample, pan = 0) {
  const offset = Math.round(start * SR);
  const count = Math.min(Math.round(duration * SR), track.loop ? Infinity : track.length - offset);
  // Micro-fondus aux bornes réelles, y compris les voix tronquées des effets.
  // Une peau coupée à trois constantes de temps garde encore 5 % d’amplitude.
  const attack = Math.min(32, count / 4), release = Math.min(530, count / 4);
  const left = Math.cos((pan + 1) * Math.PI / 4), right = Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < count; i++) {
    let index = offset + i;
    if (track.loop) index = ((index % track.length) + track.length) % track.length;
    else if (index >= track.length) break;
    const edge = Math.min(1, i / attack) * Math.min(1, (count - 1 - i) / release);
    const value = amplitude * sample(i / SR, i) * edge;
    track.channels[0][index] += value * (track.channels.length === 1 ? 1 : left);
    if (track.channels.length === 2) track.channels[1][index] += value * right;
  }
}

// Texture continue sur toute la boucle : la fin est prolongée d’une seconde et
// fondue (puissance constante) sur un début qui démarre filtre à zéro.
function texture(track, amplitude, sample, pan = 0) {
  const overlap = SR, total = track.length + overlap;
  layer(track, 0, total / SR, amplitude, (t, i) => {
    const x = sample(t, i);
    if (i < overlap) return x * Math.sin(Math.PI / 2 * i / overlap);
    if (i >= track.length) return x * Math.cos(Math.PI / 2 * (i - track.length) / overlap);
    return x;
  }, pan);
}

// ---------- Percussions et bruits ----------

function burst(track, start, duration, amp, frequency, type = 'band', q = 0.85, decay = 8, pan = 0, attack = 0.001) {
  const filter = biquad(type, frequency, q);
  layer(track, start, duration, amp, t => filter(noise()) * Math.min(1, t / attack)
    * Math.exp(-decay * t / duration) * Math.min(1, (duration - t) / 0.006), pan);
}

// Bruit filtré dont la fréquence glisse de f0 à f1 (souffles, lames, flèches).
function sweep(track, start, duration, amp, f0, f1, q = 1.4, peak = 0.3, pan = 0) {
  const filter = svf('band');
  layer(track, start, duration, amp, t => {
    const u = t / duration, envelope = u < peak ? Math.sin(Math.PI / 2 * u / peak) : ((1 - u) / (1 - peak)) ** 1.6;
    return filter(noise(), f0 * (f1 / f0) ** u, q) * envelope;
  }, pan);
}

// Grosse caisse ou peau : sinus dont la hauteur chute, léger grain saturé.
function drum(track, start, amp, { f0 = 160, f1 = 50, drop = 28, decay = 0.35, drive = 1.4, click = 0.25, pan = 0 } = {}) {
  let phase = 0;
  layer(track, start, decay * 3, amp, t => {
    phase += (f1 + (f0 - f1) * Math.exp(-drop * t)) / SR;
    return Math.tanh(drive * sine(phase)) / Math.tanh(drive) * Math.exp(-t / decay);
  }, pan);
  if (click) burst(track, start, 0.012, amp * click, 3000, 'band', 0.7, 3, pan);
}

function taiko(track, start, amp, pan = 0) {
  drum(track, start, amp, { f0: 120, f1: 58, drop: 18, decay: 0.32, drive: 1.8, click: 0.1, pan });
  burst(track, start, 0.25, amp * 0.35, 240, 'band', 1.2, 6, pan);
}

function shaker(track, start, amp, pan = 0) { burst(track, start, 0.07, amp, 7200, 'high', 0.7, 5, pan, 0.012); }

function rim(track, start, amp, pan = 0) {
  burst(track, start, 0.05, amp, 1900, 'band', 2.5, 7, pan);
  layer(track, start, 0.05, amp * 0.5, t => sine(520 * t) * Math.exp(-70 * t), pan);
}

// Grain de pierre : petit résonateur excité par un clic de bruit.
function pebble(track, start, amp, frequency, pan = 0) {
  const filter = biquad('band', frequency, 9);
  layer(track, start, 0.07, amp, t => filter(t < 0.004 ? noise() : 0) * 6 * Math.exp(-40 * t), pan);
}

// Goutte d’eau de grotte : sinus qui remonte très vite.
function drip(track, start, amp, frequency, pan = 0) {
  let phase = 0;
  layer(track, start, 0.09, amp, t => {
    phase += frequency * (1 + 1.4 * (1 - Math.exp(-60 * t))) / SR;
    return sine(phase) * Math.min(1, t / 0.002) * Math.exp(-45 * t);
  }, pan);
}

// ---------- Instruments mélodiques ----------

// Corde pincée Karplus-Strong : délai fractionnaire et compensation du moyennage.
// L’interpolation linéaire amortit davantage les partiels élevés.
function pluck(track, midi, start, duration, amp, pan = 0, { bright = 0.5, damping = 0.996, ring = 1.2 } = {}) {
  const f = hz(midi), length = Math.round((duration + ring) * SR), out = new Float32Array(length);
  const delay = SR / f - 0.5, excite = biquad('low', 600 + bright * 7000), period = Math.ceil(SR / f);
  const fade = Math.round(duration * SR);
  const excitation = new Float32Array(period);
  let mean = 0;
  for (let i = 0; i < period; i++) { excitation[i] = excite(noise()); mean += excitation[i]; }
  mean /= period;
  for (let i = 0; i < length; i++) {
    let x = i < period ? excitation[i] - mean : 0;
    const position = i - delay;
    if (position >= 1) {
      const k = Math.floor(position), fraction = position - k;
      const a = out[k] + (out[k + 1] - out[k]) * fraction, b = out[k - 1] + (out[k] - out[k - 1]) * fraction;
      // Étouffement après la durée notée : la corde ne bave pas sur l’accord suivant.
      x += (i > fade ? damping * 0.985 : damping) * 0.5 * (a + b);
    }
    out[i] = x;
  }
  const dc = biquad('high', 40);
  layer(track, start, length / SR, amp, (t, i) => dc(out[i]) * Math.min(1, (length - i) / 400), pan);
}

// Lame percutée : partiels inharmoniques à décroissance rapide (marimba, kalimba, cloche).
const BARS = {
  marimba: { partials: [[1, 1, 1.4], [3.99, 0.22, 7], [9.9, 0.06, 16]], click: 0.25, tone: 1800 },
  kalimba: { partials: [[1, 1, 2.2], [5.4, 0.18, 10], [8.9, 0.07, 18]], click: 0.15, tone: 3500 },
  bell: { partials: [[1, 1, 0.9], [2.0, 0.28, 1.6], [3.01, 0.12, 2.8], [4.16, 0.06, 5]], click: 0.04, tone: 6000 },
  glass: { partials: [[1, 1, 1.2], [2.76, 0.3, 2.5], [5.4, 0.1, 6], [8.93, 0.04, 12]], click: 0.02, tone: 8000 },
  wood: { partials: [[1, 1, 18], [2.6, 0.4, 30], [4.3, 0.15, 45]], click: 0.4, tone: 1500 },
};
function bar(kind, track, midi, start, duration, amp, pan = 0) {
  const { partials, click, tone } = BARS[kind], f = hz(midi), filter = biquad('band', tone, 0.8);
  // Écarter les modes proches de Nyquist avant leur génération : le filtre
  // final ne peut pas retirer un partiel déjà replié dans le spectre audible.
  const modes = partials.filter(([ratio]) => f * ratio < SR * .42);
  const ring = kind === 'wood' ? 0.25 : duration + 1.8 / partials[0][2];
  layer(track, start, ring, amp, t => {
    let value = 0;
    for (const [ratio, gain, decay] of modes) {
      const warmth = Math.min(1, 4200 / (f * ratio)) ** 2;
      value += gain * warmth * sine(f * ratio * t) * Math.exp(-decay * t * (f > 800 ? 1.5 : 1));
    }
    if (t < 0.006) value += click * filter(noise());
    // Étouffoir après la durée écrite : laisser résonner sans brouiller l’accord suivant.
    value *= Math.exp(-Math.max(0, t - duration) / (kind === 'bell' || kind === 'glass' ? .38 : .2));
    return value * Math.min(1, t / 0.0015) * Math.min(1, (ring - t) / 0.05);
  }, pan);
}
const marimba = (...args) => bar('marimba', ...args), kalimba = (...args) => bar('kalimba', ...args);
const bell = (...args) => bar('bell', ...args), glass = (...args) => bar('glass', ...args);

// Flûte douce : sinus, un peu d’octave, souffle filtré, vibrato qui arrive tard.
function flute(track, midi, start, duration, amp, pan = 0) {
  const f = hz(midi), breath = biquad('band', f * 2, 2);
  let phase = 0;
  layer(track, start, duration + 0.25, amp, t => {
    const vibrato = 1 + 0.004 * Math.min(1, Math.max(0, t - 0.25) / 0.4) * sine(5.2 * t);
    phase += f * vibrato / SR;
    const envelope = adsr(t, duration + 0.25, 0.07, 0.2, 0.8, 0.3);
    return envelope * (sine(phase) + 0.12 * sine(2 * phase) + 0.04 * sine(3 * phase) + 0.25 * breath(noise()));
  }, pan);
}

// Nappe : trois scies désaccordées dans un passe-bas qui s’ouvre lentement.
function pad(track, midi, start, duration, amp, pan = 0, { cutoff = 1400, attack = 0.9, release = 1.6 } = {}) {
  const f = hz(midi), filter = svf('low'), detune = [0.996, 1, 1.0045], phases = detune.map(() => random());
  const total = duration + release;
  layer(track, start, total, amp, t => {
    let value = 0;
    for (let v = 0; v < 3; v++) { phases[v] += f * detune[v] / SR; value += saw(phases[v], f * detune[v] / SR); }
    const envelope = adsr(t, total, attack, 0.5, 0.85, release);
    return filter(value / 3, cutoff * (0.6 + 0.4 * Math.min(1, t / (attack * 2))), 0.6) * envelope;
  }, pan);
}

// Chœur : scie vibrée passée dans trois formants de voyelle (« a » ou « o »).
const VOWELS = { a: [[800, 1], [1150, 0.5], [2900, 0.12]], o: [[450, 1], [800, 0.45], [2830, 0.06]], u: [[325, 1], [700, 0.25], [2530, 0.04]] };
function choir(track, midi, start, duration, amp, pan = 0, vowel = 'o') {
  const f = hz(midi), formants = VOWELS[vowel].map(([frequency, gain]) => [biquad('band', frequency, 5), gain]);
  const voices = [0.997, 1.003, 1].map(d => ({ d, phase: random(), rate: between(4.6, 5.6) }));
  const total = duration + 1.2;
  layer(track, start, total, amp, t => {
    let source = 0;
    for (const voice of voices) {
      const freq = f * voice.d * (1 + 0.006 * sine(voice.rate * t));
      voice.phase += freq / SR; source += saw(voice.phase, freq / SR);
    }
    let value = 0;
    for (const [filter, gain] of formants) value += gain * filter(source);
    return value * adsr(t, total, 0.6, 0.4, 0.85, 1.2);
  }, pan);
}

// Cordes détachées pour le combat : scie double, passe-bas à enveloppe.
function strings(track, midi, start, duration, amp, pan = 0) {
  const f = hz(midi), filter = svf('low');
  let p1 = random(), p2 = random();
  layer(track, start, duration + 0.12, amp, t => {
    p1 += f * 0.997 / SR; p2 += f * 1.003 / SR;
    const envelope = adsr(t, duration + 0.12, 0.012, 0.08, 0.6, 0.1);
    return filter(0.5 * (saw(p1, f / SR) + saw(p2, f / SR)), 700 + 2600 * Math.exp(-14 * t), 0.9) * envelope;
  }, pan);
}

// Cor : scie qui remonte d’un demi-ton, formant cuivré, souffle.
function brass(track, midi, start, duration, amp, pan = 0) {
  const f = hz(midi), low = svf('low'), formant = biquad('band', 620, 2.2), breath = biquad('band', 900, 1.5);
  let phase = random();
  layer(track, start, duration + 0.3, amp, t => {
    const freq = f * 2 ** (-1.2 * Math.exp(-22 * t) / 12) * (1 + 0.003 * sine(4.8 * t) * Math.min(1, t / 0.6));
    phase += freq / SR;
    const envelope = adsr(t, duration + 0.3, 0.05, 0.25, 0.75, 0.3);
    const raw = saw(phase, freq / SR), cutoff = 450 + 1500 * envelope;
    return envelope * (Math.tanh(1.5 * low(raw, cutoff, 0.8)) + 0.5 * formant(raw) + 0.05 * breath(noise()));
  }, pan);
}

// Basse ronde : sinus + harmonique douce, saturation légère.
function bass(track, midi, start, duration, amp, pan = 0) {
  const f = hz(midi);
  let phase = 0;
  layer(track, start, duration + 0.08, amp, t => {
    phase += f / SR;
    const envelope = adsr(t, duration + 0.08, 0.008, 0.2, 0.7, 0.08);
    return Math.tanh(1.6 * (sine(phase) + 0.25 * sine(2 * phase) * Math.exp(-6 * t))) * envelope;
  }, pan);
}

// ---------- Espace : réverbération et échos repliés ----------

// Freeverb : 8 peignes amortis + 4 passe-tout par canal, prédélai. La queue
// est repliée modulo la longueur (boucles), le niveau humide est calé sur le sec.
function reverb(track, wet, { room = 0.8, damp = 0.35, predelay = 0.02 } = {}) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], passes = [556, 441, 341, 225];
  const feedback = 0.7 + 0.28 * room, tail = track.loop ? 14 * SR : 0, pre = Math.round(predelay * SR);
  const mono = new Float32Array(track.length);
  for (const channel of track.channels) for (let i = 0; i < track.length; i++) mono[i] += channel[i] / track.channels.length;
  const wetChannels = track.channels.map((_, channel) => {
    const spread = channel * 23;
    const cs = combs.map(size => ({ buffer: new Float32Array(size + spread), index: 0, store: 0 }));
    const ps = passes.map(size => ({ buffer: new Float32Array(size + spread), index: 0 }));
    const result = new Float32Array(track.length);
    for (let i = 0; i < track.length + tail + pre; i++) {
      const j = i - pre, input = j >= 0 && j < track.length ? mono[j] * 0.1 : 0;
      let sum = 0;
      for (const c of cs) {
        const delayed = c.buffer[c.index];
        c.store = delayed * (1 - damp) + c.store * damp;
        c.buffer[c.index] = input + c.store * feedback;
        c.index = (c.index + 1) % c.buffer.length;
        sum += delayed;
      }
      for (const p of ps) {
        const delayed = p.buffer[p.index], value = delayed - sum;
        p.buffer[p.index] = sum + 0.5 * delayed;
        p.index = (p.index + 1) % p.buffer.length;
        sum = value;
      }
      if (track.loop || i < track.length) result[i % track.length] += sum;
    }
    return result;
  });
  let dry = 0, moist = 0;
  for (let c = 0; c < track.channels.length; c++) for (let i = 0; i < track.length; i++) {
    dry += track.channels[c][i] ** 2; moist += wetChannels[c][i] ** 2;
  }
  const gain = moist ? wet * Math.sqrt(dry / moist) : 0;
  track.channels.forEach((channel, c) => { for (let i = 0; i < track.length; i++) channel[i] += gain * wetChannels[c][i]; });
}

// Écho ping-pong en croches pointées, assombri à chaque passage, replié sur la boucle.
function echo(track, time, feedback, wet) {
  if (track.channels.length < 2) return;
  const d = Math.round(time * SR), [left, right] = track.channels;
  const lowL = biquad('low', 3200), lowR = biquad('low', 3200);
  const bufferL = new Float32Array(d), bufferR = new Float32Array(d), outL = new Float32Array(track.length), outR = new Float32Array(track.length);
  const total = track.length + (track.loop ? 10 * SR : 0);
  for (let i = 0; i < total; i++) {
    const k = i % d, inL = i < track.length ? left[i] : 0, inR = i < track.length ? right[i] : 0;
    const dl = bufferL[k], dr = bufferR[k];
    bufferL[k] = lowL(0.5 * (inL + inR) + dr * feedback);
    bufferR[k] = lowR(dl * feedback);
    if (track.loop || i < track.length) { outL[i % track.length] += dl; outR[i % track.length] += dr; }
  }
  for (let i = 0; i < track.length; i++) { left[i] += wet * outL[i]; right[i] += wet * outR[i]; }
}

function master(track, music, peakDb = -1) {
  let meanSquare = 0, peak = 0;
  for (const channel of track.channels) {
    // La suppression de la composante continue préserve la périodicité.
    let mean = 0;
    for (const x of channel) mean += x;
    mean /= channel.length;
    // Aigus feutrés ; marge pour les variations de hauteur du lecteur d’effets.
    const soften = biquad('low', music ? 11000 : 8500, 0.6);
    if (music) for (let i = 0; i < SR && i < channel.length; i++) soften(channel[channel.length - SR + i] - mean);
    for (let i = 0; i < channel.length; i++) {
      let x = soften(channel[i] - mean);
      if (!music) x *= Math.min(1, i / 32) * Math.min(1, (channel.length - 1 - i) / (SR * 0.025));
      channel[i] = x;
      peak = Math.max(peak, Math.abs(x)); meanSquare += x * x;
    }
  }
  if (!peak || !Number.isFinite(meanSquare)) throw new Error('Signal vide ou non fini');
  const rms = Math.sqrt(meanSquare / (track.length * track.channels.length));
  // Pré-gain, puis saturation douce ; loudnorm mesure ensuite le LUFS réel.
  const gain = music ? Math.min(db(-1) / peak, db(-15) / rms) : db(peakDb) / peak;
  for (const channel of track.channels) for (let i = 0; i < channel.length; i++) {
    const x = channel[i] * gain;
    channel[i] = music ? Math.tanh(x * 1.2) / 1.2 : x;
  }
  if (music) {
    // Le MP3 encode les extrémités avec un voisinage silencieux. Choisir une
    // coupe stéréo peu énergétique à ±10 ms réduit ce transitoire du codec.
    // Rotation circulaire commune : aucune queue perdue, aucun fondu ni silence,
    // durée et déphasage gauche/droite conservés, départ musical décalé de ≤10 ms.
    let cut = 0, best = Infinity;
    for (let offset = -441; offset <= 441; offset++) {
      const i = (track.length + offset) % track.length, previous = (i + track.length - 1) % track.length;
      let energy = 0;
      for (const channel of track.channels) energy += channel[i] ** 2 + channel[previous] ** 2;
      if (energy < best) { best = energy; cut = i; }
    }
    if (cut) for (const channel of track.channels) {
      const copy = channel.slice();
      channel.set(copy.subarray(cut));
      channel.set(copy.subarray(0, cut), track.length - cut);
    }
  }
}

function wav(track) {
  const channels = track.channels.length, bytes = track.length * channels * 2;
  const data = Buffer.alloc(44 + bytes);
  data.write('RIFF'); data.writeUInt32LE(36 + bytes, 4); data.write('WAVEfmt ', 8);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(channels, 22);
  data.writeUInt32LE(SR, 24); data.writeUInt32LE(SR * channels * 2, 28);
  data.writeUInt16LE(channels * 2, 32); data.writeUInt16LE(16, 34);
  data.write('data', 36); data.writeUInt32LE(bytes, 40);
  let offset = 44;
  for (let i = 0; i < track.length; i++) for (const channel of track.channels) {
    const dither = (random() - random()) / 65536;
    data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round((channel[i] + dither) * 32767))), offset);
    offset += 2;
  }
  return data;
}

// ---------- Effets ----------
// [durée en s, crête en dBFS] : les petits sons d’interface restent discrets,
// seuls l’explosion et le cor de guerre montent près du plafond.
const effects = {
  hit: [.3, -3], brk: [.55, -3], place: [.22, -5], jump: [.24, -11], pick: [.55, -7], sword: [.32, -6],
  hurt: [.4, -3], buy: [.9, -5], bow: [.5, -5], ach: [2, -3], horn: [2.8, -2], click: [.09, -13],
  boom: [2.2, -1], deny: [.35, -8], coin: [1.1, -6],
};

function effect(name, duration) {
  const t = canvas(duration);
  switch (name) {
    case 'hit': // coup porté : choc sourd, claquement bref, pas de tintement
      drum(t, 0, .9, { f0: 170, f1: 70, drop: 40, decay: .07, drive: 2, click: 0 });
      burst(t, 0, .035, .32, 1700, 'band', .9, 4);
      bar('wood', t, 50, .006, .08, .2);
      pebble(t, .025, .12, 780);
      burst(t, 0, .09, .45, 650, 'band', 1, 5);
      break;
    case 'brk': // bloc cassé : craquement, gravats qui roulent
      drum(t, 0, .7, { f0: 120, f1: 55, drop: 30, decay: .1, drive: 2.2, click: 0 });
      burst(t, 0, .09, .6, 1400, 'low', .7, 5);
      for (let i = 0; i < 10; i++) pebble(t, .02 + i * .035 + between(0, .02), .32 * (1 - i / 12), between(550, 1800), between(-.3, .3));
      burst(t, .02, .45, .12, 700, 'low', .7, 4);
      break;
    case 'place': // pose de bloc : « toc » mat
      drum(t, 0, .8, { f0: 230, f1: 130, drop: 50, decay: .045, drive: 1.6, click: 0 });
      bar('wood', t, 56, 0, .1, .35);
      burst(t, .025, .1, .14, 420, 'low', .7, 4);
      burst(t, 0, .012, .25, 1300, 'band', 1, 3);
      break;
    case 'jump': // saut : souffle léger qui monte
      sweep(t, 0, .22, .7, 450, 1500, 1.6, .25);
      layer(t, 0, .12, .18, s => sine(170 * s + 500 * s * s) * Math.exp(-25 * s));
      break;
    case 'pick': // ramassage : deux lames de kalimba, quinte ascendante
      kalimba(t, 74, 0, .16, .7, -.1); kalimba(t, 81, .07, .22, .45, .1);
      burst(t, .07, .08, .04, 2200, 'band', .7, 4);
      break;
    case 'sword': // fendre l’air, reflet métallique très discret
      sweep(t, 0, .26, 1, 800, 3000, 2, .35);
      glass(t, 78, .015, .05, .035);
      break;
    case 'hurt': // le héros encaisse : impact + plainte sourde
      drum(t, 0, .9, { f0: 140, f1: 60, drop: 30, decay: .09, drive: 2, click: .15 });
      {
        const f1 = biquad('band', 650, 3), f2 = biquad('band', 1100, 4);
        let phase = 0;
        layer(t, .015, .3, .55, s => {
          const f = 150 * 2 ** (-0.6 * s / .3); phase += f / SR;
          const x = saw(phase, f / SR);
          return (f1(x) + 0.5 * f2(x)) * Math.min(1, s / .01) * Math.exp(-9 * s);
        });
      }
      burst(t, 0, .12, .25, 500, 'low', .7, 5);
      break;
    case 'buy': // achat : pièces puis arpège de marimba
      [62, 66, 69, 74].forEach((n, i) => marimba(t, n, .05 + i * .06, .3, .45 - i * .04, (i - 1.5) * .15));
      [0, .05].forEach((s, i) => glass(t, 84 + i * 7, s, .05, .065));
      break;
    case 'bow': // corde de l’arc puis flèche qui file
      pluck(t, 45, 0, .1, .9, 0, { bright: .3, damping: .985, ring: .15 });
      sweep(t, .018, .26, .4, 2400, 650, 1, .12);
      burst(t, .005, .045, .2, 800, 'band', .8, 4);
      break;
    case 'ach': // succès : arpège de cloches sur une nappe qui s’ouvre
      [69, 73, 76, 83, 81, 88].forEach((n, i) => bell(t, n, i * .09, .4, .4 - i * .03, (i % 2 ? .25 : -.25)));
      [57, 64, 69, 73].forEach((n, i) => pad(t, n, 0, 1, .12, (i - 1.5) * .3, { cutoff: 1800, attack: .25, release: .7 }));
      break;
    case 'horn': // cor de guerre : deux cors à la quinte, montée de souffle
      brass(t, 38, 0, 1.9, .7, -.1); brass(t, 45, .06, 1.8, .4, .1); brass(t, 50, .12, 1.6, .15);
      burst(t, 0, .6, .1, 400, 'low', .7, 2, 0, .2);
      break;
    case 'click': // interface : petit « tic » de bois
      layer(t, 0, .065, .8, s => (sine(740 * s) + .18 * sine(1180 * s)) * Math.exp(-85 * s));
      burst(t, 0, .009, .16, 1600, 'band', .8, 3);
      break;
    case 'boom': // explosion : souffle grave, roulement et débris
      drum(t, 0, 1, { f0: 90, f1: 28, drop: 7, decay: .45, drive: 2.5, click: 0 });
      burst(t, 0, .07, .6, 1500, 'band', .65, 3);
      drum(t, .065, .32, { f0: 125, f1: 52, drop: 18, decay: .23, drive: 1.6, click: 0 });
      {
        const filter = svf('low');
        layer(t, 0, 2, .9, s => filter(noise(), 150 + 1600 * Math.exp(-4 * s), .7) * Math.min(1, s / .004) * Math.exp(-2.2 * s));
      }
      for (let i = 0; i < 16; i++) pebble(t, between(.12, 1.3), .2 * Math.exp(-i / 10), between(700, 2400), between(-.3, .3));
      break;
    case 'deny': // refus : deux coups de bois graves, descendants
      bar('wood', t, 58, 0, .1, .8); bar('wood', t, 54, .11, .1, .7);
      break;
    case 'coin': // pièces : trois tintements de métal, scintillement
      [[0, 76], [.09, 83], [.2, 88]].forEach(([s, n], i) => {
        glass(t, n, s, .1, .25 - i * .045, (i - 1) * .3);
        bell(t, n - 12, s, .1, .28 - i * .045, (i - 1) * .3);
      });
      burst(t, .04, .18, .06, 1800, 'band', .8, 5);
      break;
    default: throw new Error(`Effet inconnu : ${name}`);
  }
  const space = { horn: [.5, .9, .3, .03], ach: [.35, .8, .3, .02], boom: [.25, .85, .5, .01], coin: [.25, .6, .4, .01], buy: [.2, .6, .4, .01] }[name];
  if (space) reverb(t, space[0], { room: space[1], damp: space[2], predelay: space[3] });
  else reverb(t, .12, { room: .45, damp: .5, predelay: .005 });
  return t;
}

// ---------- Musiques ----------
// Partitions originales : chaque mesure contient [temps, MIDI, durée en temps].
// Aucun bruit d'ambiance ; les seuls bruits sont les transitoires du kit.
const QUALITY = { maj: [0, 4, 7], min: [0, 3, 7], dom: [0, 4, 7, 10], dim: [0, 3, 6] };
const tones = ([root, quality]) => QUALITY[quality].map(n => root + n);
const bassRoot = root => 36 + ((root % 12) + 12) % 12;

// Deux fronts polyBLEP : carré à largeur modulée, vibrato retardé.
function chipLead(track, midi, start, duration, amp, pan = 0) {
  const f = hz(midi), low = biquad('low', 5700);
  let phase = 0;
  layer(track, start, duration + .055, amp, t => {
    const dt = f * (1 + .0035 * Math.min(1, t / .22) * sine(5.4 * t)) / SR;
    phase = (phase + dt) % 1;
    const width = .43 + .055 * sine(1.8 * t);
    const pulse = (phase < width ? 1 : -1) + blep(phase, dt) - blep((phase - width + 1) % 1, dt);
    return low(pulse * .72 + sine(phase) * .18) * adsr(t, duration + .055, .008, .09, .78, .055);
  }, pan);
}

function chipKeys(track, midi, start, duration, amp, pan = 0) {
  const f = hz(midi), total = duration + .16;
  layer(track, start, total, amp, t => {
    const mod = 1.8 * Math.exp(-7 * t) * sine(f * 2 * t);
    return Math.sin(TAU * f * t + mod) * Math.exp(-1.8 * t)
      * adsr(t, total, .003, .2, .65, .16);
  }, pan);
}

function chipHarp(track, midi, start, duration, amp, pan = 0) {
  const f = hz(midi), total = duration + .1;
  layer(track, start, total, amp, t => (sine(f * t) + .32 * sine(2 * f * t) + .12 * sine(3 * f * t))
    * Math.exp(-7 * t) * adsr(t, total, .002, .12, .7, .1), pan);
}

function chipStrings(track, midi, start, duration, amp, pan = 0) {
  const f = hz(midi), low = biquad('low', 2100), total = duration + .16;
  layer(track, start, total, amp, t => low((saw(f * .997 * t, f * .997 / SR)
    + saw(f * 1.003 * t + .27, f * 1.003 / SR)) * .5)
    * adsr(t, total, .07, .16, .65, .16), pan);
}

function chipBrass(track, midi, start, duration, amp, pan = 0) {
  const f = hz(midi), low = biquad('low', 2800), total = duration + .07;
  layer(track, start, total, amp, t => low(saw(f * t, f / SR) + .3 * saw(2 * f * t, 2 * f / SR))
    * adsr(t, total, .018, .1, .55, .07), pan);
}

// Bruit local déterministe pour les peaux : ne consomme pas le PRNG des effets.
function kitNoise() {
  let state = 0x13579bdf;
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 2147483648 - 1; };
}
function kit(track, kind, start, amp, pan = 0, pitch = 150) {
  const lengths = { kick: .28, snare: .2, hat: .065, open: .24, crash: .95, tom: .24 };
  const duration = lengths[kind], n = kitNoise(), high = biquad('high', kind === 'snare' ? 1600 : 6500);
  let phase = 0;
  layer(track, start, duration, amp, t => {
    if (kind === 'kick' || kind === 'tom') {
      const f = kind === 'kick' ? 49 + 105 * Math.exp(-42 * t) : pitch * (1 + .65 * Math.exp(-35 * t));
      phase += f / SR;
      return (sine(phase) + .12 * sine(2 * phase)) * Math.exp(-t * (kind === 'kick' ? 17 : 14));
    }
    if (kind === 'snare') return .72 * high(n()) * Math.exp(-23 * t)
      + .42 * sine(185 * t) * Math.exp(-35 * t) + .18 * sine(330 * t) * Math.exp(-45 * t);
    const metallic = [4013, 5347, 7019, 8231, 10103].reduce((sum, f) => sum + sine(f * t), 0) / 5;
    return high(.65 * n() + .35 * metallic) * Math.exp(-t * (kind === 'hat' ? 65 : kind === 'open' ? 18 : 5));
  }, pan);
}

function melody(track, inst, notes, start, beat, amp, pan = 0, shift = 0) {
  for (const [at, note, duration] of notes) inst(track, note + shift, start + at * beat, duration * beat * .9, amp, pan);
}

const MENU_A = [
  [[0,69,.75],[.75,72,.25],[1,76,1.5],[2.5,74,.5],[3,72,1]],
  [[0,72,1],[1,77,1],[2,76,.5],[2.5,72,.5],[3,69,1]],
  [[0,67,.5],[.5,72,.5],[1,76,1],[2,79,1.5],[3.5,76,.5]],
  [[0,74,2],[2,71,1],[3,67,1]],
  [[0,69,.75],[.75,72,.25],[1,76,1],[2,81,1],[3,79,.5],[3.5,76,.5]],
  [[0,77,1.5],[1.5,76,.5],[2,72,1],[3,69,1]],
  [[0,74,1],[1,77,.5],[1.5,76,.5],[2,74,1],[3,72,1]],
  [[0,71,1.5],[1.5,69,.5],[2,68,1],[3,71,1]],
];
const MENU_B = [
  [[0,77,2],[2,81,.5],[2.5,79,.5],[3,77,1]],
  [[0,76,1.5],[1.5,74,.5],[2,72,2]],
  [[0,74,.5],[.5,77,.5],[1,81,1],[2,79,1],[3,77,1]],
  [[0,76,2.5],[2.5,72,.5],[3,69,1]],
  [[0,72,1],[1,74,1],[2,77,1.5],[3.5,76,.5]],
  [[0,74,1],[1,71,1],[2,67,1],[3,74,1]],
  [[0,77,.5],[.5,76,.5],[1,74,1],[2,72,1],[3,69,1]],
  [[0,68,1],[1,71,.5],[1.5,76,.5],[2,74,1],[3,71,1]],
];
const DAY_A = [
  [[0,74,.5],[.5,78,.5],[1,81,.75],[1.75,78,.25],[2,76,.5],[2.5,74,.5],[3,78,1]],
  [[0,76,.75],[.75,73,.25],[1,69,1],[2.5,73,.5],[3,76,1]],
  [[0,78,.5],[.5,81,.5],[1,83,1],[2,81,.5],[2.5,78,.5],[3,74,1]],
  [[0,79,1.5],[1.5,78,.5],[2,74,1],[3,71,1]],
  [[0,74,.5],[.5,78,.5],[1,81,1],[2,86,.75],[2.75,85,.25],[3,81,1]],
  [[0,79,.5],[.5,78,.5],[1,76,1],[2,73,.5],[2.5,74,.5],[3,76,1]],
  [[0,79,1],[1,78,.5],[1.5,76,.5],[2,74,1],[3,71,1]],
  [[0,73,.5],[.5,76,.5],[1,81,1],[2,76,1],[3,73,1]],
];
const DAY_B = [
  [[0,79,1],[1,83,1.5],[2.5,81,.5],[3,79,1]],
  [[0,78,.5],[.5,79,.5],[1,81,2],[3,78,1]],
  [[0,76,1],[1,79,.5],[1.5,83,.5],[2,81,1],[3,79,1]],
  [[0,85,1.5],[1.5,83,.5],[2,81,1],[3,76,1]],
  [[0,83,.5],[.5,81,.5],[1,79,1],[2,78,.5],[2.5,79,.5],[3,83,1]],
  [[0,81,1],[1,78,.5],[1.5,74,.5],[2,78,2]],
  [[0,76,.5],[.5,79,.5],[1,83,1],[2,81,.5],[2.5,79,.5],[3,76,1]],
  [[0,73,1],[1,76,1],[2,81,1],[3,73,1]],
];
const NIGHT_A = [
  [[0,76,1.5],[1.5,71,.5],[2,79,1],[3,78,1]],
  [[0,76,2],[2,72,.5],[2.5,74,.5],[3,76,1]],
  [[0,72,1],[1,76,1.5],[2.5,74,.5],[3,69,1]],
  [[0,71,2],[2,75,1],[3,78,1]],
  [[0,79,1.5],[1.5,78,.5],[2,76,.5],[2.5,74,.5],[3,71,1]],
  [[0,72,1],[1,76,1],[2,79,1.5],[3.5,76,.5]],
  [[0,74,1],[1,72,.5],[1.5,71,.5],[2,69,2]],
  [[0,71,1.5],[1.5,74,.5],[2,75,1],[3,71,1]],
];
const NIGHT_B = [
  [[0,79,1],[1,83,2],[3,81,1]],
  [[0,78,1.5],[1.5,76,.5],[2,74,2]],
  [[0,76,.5],[.5,79,.5],[1,84,1.5],[2.5,83,.5],[3,79,1]],
  [[0,81,2],[2,76,1],[3,72,1]],
  [[0,83,1.5],[1.5,81,.5],[2,79,1],[3,76,1]],
  [[0,78,1],[1,74,1],[2,71,1],[3,74,1]],
  [[0,76,1],[1,72,1],[2,69,1],[3,72,1]],
  [[0,75,1],[1,78,.5],[1.5,81,.5],[2,78,1],[3,75,1]],
];
const COMBAT_A = [
  [[0,74,.5],[.5,74,.25],[.75,77,.25],[1,81,1],[2,77,.5],[2.5,74,.5],[3,81,1]],
  [[0,82,1],[1,81,.5],[1.5,77,.5],[2,74,.75],[2.75,77,.25],[3,82,1]],
  [[0,79,.5],[.5,76,.5],[1,72,1],[2,76,.5],[2.5,79,.5],[3,84,1]],
  [[0,81,1.5],[1.5,77,.5],[2,74,1],[3,72,.5],[3.5,73,.5]],
  [[0,74,.5],[.5,77,.5],[1,81,.5],[1.5,86,.5],[2,84,.5],[2.5,81,.5],[3,77,1]],
  [[0,82,.75],[.75,81,.25],[1,77,1],[2,74,.5],[2.5,77,.5],[3,82,1]],
  [[0,79,.5],[.5,82,.5],[1,86,1],[2,82,.5],[2.5,79,.5],[3,77,1]],
  [[0,76,.5],[.5,73,.5],[1,69,1],[2,73,.5],[2.5,76,.5],[3,81,1]],
];
const COMBAT_B = [
  [[0,81,2],[2,84,1],[3,86,1]],
  [[0,84,1.5],[1.5,82,.5],[2,79,1],[3,76,1]],
  [[0,82,1],[1,86,1],[2,89,1],[3,86,1]],
  [[0,81,2],[2,77,.5],[2.5,79,.5],[3,81,1]],
  [[0,79,1],[1,82,1.5],[2.5,81,.5],[3,79,1]],
  [[0,77,.5],[.5,81,.5],[1,86,1],[2,84,1],[3,81,1]],
  [[0,82,1],[1,79,.5],[1.5,77,.5],[2,79,1],[3,82,1]],
  [[0,85,1.5],[1.5,83,.5],[2,81,.5],[2.5,79,.5],[3,76,1]],
];
const BLOOD_A = [
  [[0,72,.75],[.75,71,.25],[1,72,.5],[1.5,75,.5],[2,79,1],[3,75,1]],
  [[0,80,1.5],[1.5,79,.5],[2,75,.5],[2.5,72,.5],[3,68,1]],
  [[0,77,.5],[.5,72,.5],[1,68,1],[2,72,.5],[2.5,77,.5],[3,80,1]],
  [[0,79,1],[1,74,.5],[1.5,71,.5],[2,67,1],[3,71,1]],
  [[0,72,.5],[.5,75,.5],[1,79,.75],[1.75,80,.25],[2,79,1],[3,84,1]],
  [[0,83,1],[1,80,.5],[1.5,77,.5],[2,74,1],[3,77,1]],
  [[0,80,.75],[.75,79,.25],[1,77,1],[2,75,.5],[2.5,74,.5],[3,72,1]],
  [[0,71,.5],[.5,74,.5],[1,79,1],[2,77,.5],[2.5,74,.5],[3,71,1]],
];
const BLOOD_B = [
  [[0,75,1],[1,79,2],[3,82,1]],
  [[0,82,1.5],[1.5,80,.5],[2,77,1],[3,74,1]],
  [[0,80,1],[1,84,1],[2,87,1.5],[3.5,84,.5]],
  [[0,79,2],[2,75,1],[3,72,1]],
  [[0,77,1],[1,80,.5],[1.5,84,.5],[2,82,1],[3,80,1]],
  [[0,83,1.5],[1.5,80,.5],[2,77,1],[3,74,1]],
  [[0,80,.5],[.5,79,.5],[1,77,1],[2,74,1],[3,71,1]],
  [[0,79,1],[1,77,.5],[1.5,74,.5],[2,71,1],[3,67,1]],
];

// Les dominantes majeures ferment les phrases mineures et préparent la boucle.
const SCORES = {
  menu: { bpm: 96, a: MENU_A, b: MENU_B, long: false, energy: .65,
    chordsA: [[57,'min'],[53,'maj'],[48,'maj'],[55,'maj'],[57,'min'],[53,'maj'],[50,'min'],[52,'dom']],
    chordsB: [[53,'maj'],[48,'maj'],[50,'min'],[57,'min'],[53,'maj'],[55,'maj'],[50,'min'],[52,'dom']] },
  day: { bpm: 116, a: DAY_A, b: DAY_B, long: true, energy: .8,
    chordsA: [[62,'maj'],[57,'maj'],[59,'min'],[55,'maj'],[62,'maj'],[57,'maj'],[55,'maj'],[57,'dom']],
    chordsB: [[55,'maj'],[62,'maj'],[52,'min'],[57,'maj'],[55,'maj'],[62,'maj'],[52,'min'],[57,'dom']] },
  night: { bpm: 84, a: NIGHT_A, b: NIGHT_B, long: false, energy: .38,
    chordsA: [[52,'min'],[48,'maj'],[45,'min'],[47,'dom'],[52,'min'],[48,'maj'],[45,'min'],[47,'dom']],
    chordsB: [[55,'maj'],[50,'maj'],[48,'maj'],[45,'min'],[52,'min'],[47,'min'],[45,'min'],[47,'dom']] },
  combat: { bpm: 144, a: COMBAT_A, b: COMBAT_B, long: true, energy: 1,
    chordsA: [[50,'min'],[46,'maj'],[48,'maj'],[50,'min'],[50,'min'],[46,'maj'],[43,'min'],[45,'dom']],
    chordsB: [[53,'maj'],[48,'maj'],[46,'maj'],[50,'min'],[43,'min'],[50,'min'],[43,'min'],[45,'dom']] },
  blood: { bpm: 140, a: BLOOD_A, b: BLOOD_B, long: true, energy: 1.12,
    chordsA: [[48,'min'],[44,'maj'],[41,'min'],[43,'dom'],[48,'min'],[47,'dim'],[41,'min'],[43,'dom']],
    chordsB: [[51,'maj'],[46,'maj'],[44,'maj'],[48,'min'],[41,'min'],[47,'dim'],[47,'dim'],[43,'dom']] },
};

function arrangeMusic(name) {
  const score = SCORES[name], beat = 60 / score.bpm, barLength = 4 * beat;
  const battle = name === 'combat' || name === 'blood', quiet = name === 'night';
  const form = [['intro',4], ['A',score.long ? 16 : 8], ['B',8], ["A'",score.long ? 16 : 12]];
  const bars = form.reduce((sum, [, count]) => sum + count, 0);
  const t = canvas(bars * barLength, true, true);
  let barIndex = 0;
  for (const [section, count] of form) for (let b = 0; b < count; b++, barIndex++) {
    const intro = section === 'intro', bridge = section === 'B', reprise = section === "A'";
    // L'intro expose quatre mesures complètes ; le retour court finit sur V.
    const i = intro ? [0,1,6,7][b] : reprise && count === 12 && b >= 8 ? b - 4 : b % 8;
    const chord = (bridge ? score.chordsB : score.chordsA)[i], notes = tones(chord);
    const start = barIndex * barLength, root = bassRoot(chord[0]);
    const lift = intro ? .68 : bridge && b < 4 ? .8 : reprise ? 1.08 : 1;
    const power = score.energy * lift;
    // Cordes à voix rapprochées, toujours derrière la mélodie.
    notes.slice(0,3).forEach((n,k) => chipStrings(t, 60 + n % 12, start, barLength * .94, .055 * lift, (k-1)*.55));
    const bassPattern = battle ? [0,0,12,0,0,7,12,7] : [0,null,7,12,0,7,null,12];
    bassPattern.forEach((n,k) => {
      if (n === null || (intro && k % 2)) return;
      bass(t, root+n, start+k*beat/2, beat * (quiet ? .65 : .4), .29 * (k%2 ? .8 : 1) * lift);
    });
    // Harpe régulière et accords syncopés de piano FM.
    const arpPattern = bridge ? [0,2,1,2,0,1,2,1] : [0,1,2,1,0,2,1,2];
    arpPattern.forEach((n,k) => chipHarp(t, notes[n]+12, start+k*beat/2, beat*.45, quiet ? .12 : .075, k%2 ? .4 : -.4));
    if (!intro) [ .5, 2.5 ].forEach(at => notes.slice(0,3).forEach((n,k) =>
      chipKeys(t, n+12, start+at*beat, beat*.42, .065*lift, -.35+k*.18)));
    const tune = (bridge ? score.b : score.a)[i];
    melody(t, quiet ? chipKeys : chipLead, tune, start, beat, quiet ? .34 : .25, -.04);
    if (reprise && b >= 4) {
      // Réponse indépendante sous les tenues du thème, pas un doublage parallèle.
      const counter = [[.5,notes[2]+12,.75],[2,notes[1]+12,.5],[3,notes[0]+12,.75]];
      melody(t, chipKeys, counter, start, beat, .1, .4);
    }
    if ((battle || name === 'menu') && !intro) [0,2.5].forEach(at => notes.slice(0,3).forEach((n,k) =>
      chipBrass(t, n+12, start+at*beat, beat*.32, .07*power, (k-1)*.3)));
    const kicks = intro ? [0,2] : battle ? [0,.75,2,2.5] : name === 'day' ? [0,1.5,2,3.5] : [0,2.5];
    kicks.forEach(at => kit(t,'kick',start+at*beat,.56*power));
    [1,3].forEach(at => kit(t,'snare',start+at*beat,.4*power,-.12));
    for (let k=0;k<8;k++) {
      const open = !intro && !quiet && k===7 && b%4!==3;
      kit(t,open ? 'open' : 'hat',start+k*beat/2,.12*power*(k%2 ? .7 : 1),.32);
    }
    if (b===0 && !intro) kit(t,'crash',start,.22*power,-.4);
    // Fin de chaque phrase : roulement caisse claire, toms descendants, reprise.
    if (b%4===3) {
      const hits = battle ? 6 : 4;
      for (let k=0;k<hits;k++) {
        const at = 4-(hits-k)*.25;
        kit(t,k<2 ? 'snare' : 'tom',start+at*beat,(.22+k*.035)*power,
          -.35+k*.12,190-k*19);
      }
    }
  }
  reverb(t, quiet ? .23 : .17, { room: .42, damp: .55, predelay: .012 });
  return t;
}
const musicMenu = () => arrangeMusic('menu');
const musicDay = () => arrangeMusic('day');
const musicNight = () => arrangeMusic('night');
const musicCombat = () => arrangeMusic('combat');
const musicBlood = () => arrangeMusic('blood');

const musics = { menu: musicMenu, day: musicDay, night: musicNight, combat: musicCombat, blood: musicBlood };

// ---------- Nouvelles partitions : chemin indépendant, uniquement --extra ----------
function pizzicato(track, midi, start, duration, amp, pan = 0) {
  const f = hz(midi), total = duration + .12;
  layer(track, start, total, amp, t => (sine(f*t) + .42*sine(2*f*t) + .2*sine(3*f*t))
    * Math.exp(-11*t) * adsr(t,total,.002,.09,.55,.12), pan);
}
function ocarina(track, midi, start, duration, amp, pan = 0) {
  const f = hz(midi), total = duration + .09;
  let phase = 0;
  layer(track, start, total, amp, t => {
    phase += f*(1+.0025*sine(5.8*t)*Math.min(1,t/.2))/SR;
    return (sine(phase)+.16*sine(3*phase)+.04*sine(5*phase))*adsr(t,total,.018,.08,.8,.09);
  }, pan);
}
function triangleBass(track, midi, start, duration, amp, pan = 0) {
  const f = hz(midi), total = duration + .055;
  layer(track,start,total,amp,t => (sine(f*t)-sine(3*f*t)/9+sine(5*f*t)/25-sine(7*f*t)/49)
    * adsr(t,total,.006,.1,.8,.055),pan);
}
function tambourine(track, start, amp, pan = .3) {
  const n = kitNoise(), high = biquad('high',4200);
  layer(track,start,.16,amp,t => high(.45*n()+.2*sine(6193*t)+.2*sine(8371*t)+.15*sine(10459*t))
    * Math.exp(-27*t)*Math.min(1,t/.003),pan);
}
function brush(track, start, amp, pan = -.25) {
  const n = kitNoise(), band = biquad('band',2400,.65);
  layer(track,start,.22,amp,t => band(n())*Math.sin(Math.PI*Math.min(1,t/.22))*Math.exp(-12*t),pan);
}

// Chaque paire est [MIDI, durée] ; 0 est un silence. Les durées remplissent
// exactement une mesure, exprimées en noires (aube/grotte) ou croches (village/raid).
function phrase(bars, units) {
  return bars.map(notes => {
    let at = 0;
    const events = notes.map(([note,duration]) => { const event = [at,note,duration]; at += duration; return event; });
    if (Math.abs(at-units)>1e-8) throw new Error(`Mesure incomplète : ${at}/${units}`);
    return events.filter(([,note]) => note !== 0);
  });
}
const AUBE_A = phrase([
  [[69,1],[72,.5],[70,.5],[69,1]], [[67,.5],[65,.5],[64,1],[67,1]],
  [[69,.5],[72,.5],[77,1.5],[76,.5]], [[74,1],[72,1],[69,1]],
  [[70,1.5],[74,.5],[72,1]], [[69,.5],[67,.5],[65,1],[69,1]],
  [[67,1],[70,.5],[69,.5],[67,1]], [[64,1.5],[67,.5],[72,1]],
],3);
const AUBE_B = phrase([
  [[77,1.5],[76,.5],[74,1]], [[73,.5],[76,.5],[79,1],[76,1]],
  [[74,1],[69,.5],[72,.5],[74,1]], [[72,2],[69,.5],[67,.5]],
  [[70,.5],[74,.5],[77,1],[74,1]], [[69,1.5],[72,.5],[77,1]],
  [[74,1],[70,1],[67,1]], [[76,1],[74,.5],[72,.5],[70,1]],
],3);
const VILLAGE_A = phrase([
  [[71,1],[74,1],[79,1],[78,1],[74,2]], [[76,2],[71,1],[67,1],[71,1],[74,1]],
  [[72,1],[76,1],[79,1],[81,2],[79,1]], [[78,1],[74,1],[69,1],[74,2],[72,1]],
  [[71,2],[74,1],[79,1],[83,1],[81,1]], [[79,1],[76,1],[72,1],[76,2],[79,1]],
  [[81,1],[79,1],[76,1],[74,1],[72,1],[69,1]], [[78,2],[76,1],[74,2],[69,1]],
],6);
const VILLAGE_B = phrase([
  [[83,3],[81,1],[79,2]], [[78,2],[76,1],[74,3]],
  [[76,1],[79,1],[83,1],[86,2],[83,1]], [[81,3],[78,2],[74,1]],
  [[79,2],[76,1],[72,2],[76,1]], [[78,1],[81,1],[84,1],[83,2],[81,1]],
  [[79,1],[78,1],[76,1],[74,2],[71,1]], [[72,1],[69,1],[66,1],[69,2],[74,1]],
],6);
const VILLAGE_C = phrase([
  [[76,3],[71,2],[67,1]], [[78,2],[75,1],[71,3]],
  [[79,2],[78,1],[76,2],[74,1]], [[73,1],[76,1],[79,1],[81,3]],
  [[78,3],[74,3]], [[76,2],[72,1],[69,2],[72,1]],
  [[71,1],[74,1],[79,1],[78,1],[76,1],[74,1]], [[78,2],[81,1],[78,1],[74,1],[72,1]],
],6);
const GROTTE_A = phrase([
  [[73,.5],[68,.5],[71,1],[75,.5],[73,1],[0,.5]],
  [[66,1],[69,.5],[73,.5],[75,1],[73,1]],
  [[68,.5],[71,.5],[75,1.5],[78,.5],[75,1]],
  [[70,1.5],[73,.5],[78,1],[76,1]],
  [[73,.5],[80,.5],[78,1],[75,.5],[73,.5],[71,1]],
  [[78,1],[76,.5],[73,.5],[71,1],[68,1]],
  [[66,.5],[70,.5],[73,1],[76,1.5],[75,.5]],
  [[71,1],[75,.5],[78,.5],[75,1],[71,1]],
],4);
const GROTTE_B = phrase([
  [[76,2],[80,1],[78,1]], [[75,1.5],[71,.5],[68,2]],
  [[78,1],[82,1],[80,.5],[78,.5],[75,1]], [[80,2],[78,1],[76,1]],
  [[78,.5],[76,.5],[73,1],[70,1],[73,1]], [[75,1],[78,1.5],[76,.5],[75,1]],
  [[73,1.5],[70,.5],[66,1],[70,1]], [[72,1],[75,.5],[80,.5],[78,1],[75,1]],
],4);
const RAID_A = phrase([
  [[66,1],[73,1],[69,1],[66,2],[65,1],[66,1]],
  [[74,2],[73,1],[69,1],[66,1],[62,2]],
  [[64,1],[71,1],[68,1],[76,2],[74,1],[71,1]],
  [[73,3],[72,1],[69,1],[68,1],[65,1]],
  [[66,1],[69,1],[73,1],[78,2],[77,1],[78,1]],
  [[74,1],[69,1],[66,1],[62,2],[66,2]],
  [[71,2],[74,1],[78,1],[76,1],[74,2]],
  [[77,2],[73,1],[68,2],[65,1],[73,1]],
],7);
const RAID_B = phrase([
  [[81,3],[80,2],[76,2]], [[80,2],[76,2],[73,3]],
  [[78,3],[74,1],[73,1],[71,2]], [[76,2],[73,1],[69,4]],
  [[74,3],[78,2],[81,2]], [[80,2],[78,1],[76,2],[73,2]],
  [[71,1],[74,1],[78,1],[81,2],[78,2]], [[77,3],[75,1],[73,1],[72,1],[73,1]],
],7);
const RAID_C = phrase([
  [[66,2],[0,1],[67,1],[66,1],[61,2]], [[67,1],[70,1],[73,1],[79,2],[76,2]],
  [[69,2],[73,1],[76,2],[75,1],[73,1]], [[68,1],[71,1],[74,1],[77,2],[74,2]],
  [[66,3],[69,1],[73,1],[78,2]], [[74,2],[73,1],[69,1],[66,1],[62,2]],
  [[71,1],[74,1],[78,1],[77,1],[74,1],[71,2]], [[65,1],[68,1],[73,1],[77,1],[80,1],[77,1],[73,1]],
],7);
const EXTRA_SCORES = {
  aube: { bpm:84, units:3, form:['A','B','A','B'],
    sections: { A: { tune:AUBE_A, chords:[[53,'maj'],[48,'maj'],[53,'maj'],[50,'min'],[46,'maj'],[53,'maj'],[43,'min'],[48,'dom']] },
      B: { tune:AUBE_B, chords:[[50,'min'],[57,'dom'],[50,'min'],[53,'maj'],[46,'maj'],[53,'maj'],[43,'min'],[48,'dom']] } } },
  village: { bpm:270, units:6, form:['A','A','B','B','C','A'],
    sections: { A: { tune:VILLAGE_A, chords:[[55,'maj'],[52,'min'],[48,'maj'],[50,'dom'],[55,'maj'],[48,'maj'],[45,'min'],[50,'dom']] },
      B: { tune:VILLAGE_B, chords:[[55,'maj'],[50,'maj'],[52,'min'],[50,'maj'],[48,'maj'],[50,'dom'],[55,'maj'],[50,'dom']] },
      C: { tune:VILLAGE_C, chords:[[52,'min'],[47,'dom'],[52,'min'],[57,'dom'],[50,'maj'],[45,'min'],[55,'maj'],[50,'dom']] } } },
  grotte: { bpm:98, units:4, form:['A','B','B','A'],
    sections: { A: { tune:GROTTE_A, chords:[[49,'min'],[54,'min'],[56,'min'],[54,'maj'],[49,'min'],[52,'maj'],[54,'dom'],[47,'maj']] },
      B: { tune:GROTTE_B, chords:[[52,'maj'],[56,'min'],[59,'maj'],[49,'min'],[54,'maj'],[47,'maj'],[54,'maj'],[56,'dom']] } } },
  raid: { bpm:224, units:7, form:['A','B','A','C','B'],
    sections: { A: { tune:RAID_A, chords:[[42,'min'],[50,'maj'],[52,'maj'],[49,'dom'],[42,'min'],[50,'maj'],[47,'min'],[49,'dom']] },
      B: { tune:RAID_B, chords:[[57,'maj'],[49,'min'],[47,'min'],[54,'min'],[50,'maj'],[49,'min'],[47,'min'],[49,'dom']] },
      C: { tune:RAID_C, chords:[[42,'min'],[43,'dim'],[45,'maj'],[44,'dim'],[42,'min'],[50,'maj'],[47,'min'],[49,'dom']] } } },
};

function arrangeExtra(name) {
  const score = EXTRA_SCORES[name], beat = 60/score.bpm, length = score.units*beat;
  const t = canvas(score.form.length*8*length,true,true);
  let index = 0;
  for (const [sectionIndex,section] of score.form.entries()) {
    const {tune,chords} = score.sections[section], contrast = section !== 'A';
    const reprise = sectionIndex === score.form.length-1, lift = reprise ? 1.08 : 1;
    for (let b=0;b<8;b++,index++) {
      const start = index*length, notes = tones(chords[b]), root = bassRoot(chords[b][0]);
      const nextSection = score.form[(sectionIndex+1)%score.form.length];
      const nextChord = b===7 ? score.sections[nextSection].chords[0] : chords[b+1];
      const nextRoot = bassRoot(nextChord[0]);
      if (name === 'aube') {
        melody(t,contrast ? chipKeys : chipHarp,tune[b],start,beat,contrast ? .36 : .48,-.18);
        triangleBass(t,root,start,beat*.85,.32);
        [1,2].forEach(at => notes.forEach((n,k) => chipKeys(t,n+12,start+at*beat,beat*.55,.09,(k-1)*.3)));
        [0,.5,1,1.5,2,2.5].forEach((at,k) => chipHarp(t,notes[[0,2,1,2,0,1][k]]+12,start+at*beat,beat*.45,.09,.45));
        if (contrast) notes.forEach((n,k) => chipStrings(t,n+12,start,length*.85,.055,(k-1)*.5));
        kit(t,'kick',start,.17);
        [1,2].forEach(at => brush(t,start+at*beat,.12));
        if (b%4===3) [2,2.33,2.67].forEach((at,k) => chipHarp(t,notes[2-k]+24,start+at*beat,beat*.25,.18,.4));
      } else if (name === 'village') {
        melody(t,contrast ? ocarina : pizzicato,tune[b],start,beat,contrast ? .3 : .48,-.12);
        if (reprise) melody(t,ocarina,tune[b],start,beat,.14,.25);
        [0,3].forEach((at,k) => triangleBass(t,root+(k ? 7 : 0),start+at*beat,beat*1.8,.34));
        [1,2,4,5].forEach(at => notes.forEach((n,k) => pizzicato(t,n+12,start+at*beat,beat*.7,.1,(k-1)*.4)));
        for (let k=0;k<6;k++) tambourine(t,start+k*beat,(k%3===0 ? .27 : .12)*lift);
        [0,3].forEach(at => kit(t,'kick',start+at*beat,.25));
        if (section==='C') notes.forEach((n,k) => chipStrings(t,n+12,start,length*.9,.06,(k-1)*.5));
        if (b%4===3) [4,4.5,5,5.5].forEach((at,k) => { tambourine(t,start+at*beat,.2+k*.02); kit(t,'tom',start+at*beat,.12,-.3+k*.2,220-k*35); });
      } else if (name === 'grotte') {
        melody(t,contrast ? bell : marimba,tune[b],start,beat,contrast ? .27 : .4,-.25);
        // Échos du motif seulement : la basse et les balais restent nets.
        melody(t,contrast ? bell : marimba,tune[b],start+beat*.75,beat,.09,.55);
        const walk = [root,root+(notes[1]-notes[0]),root+7,nextRoot-1];
        walk.forEach((n,k) => triangleBass(t,n,start+k*beat,beat*.8,.33));
        [0,2.5].forEach(at => notes.forEach((n,k) => chipKeys(t,n+12,start+at*beat,beat*.65,.085,(k-1)*.45)));
        if (contrast) melody(t,ocarina,[[1,notes[2]+12,1.5],[3,notes[1]+12,.75]],start,beat,.12,.3);
        [1,3].forEach(at => brush(t,start+at*beat,.3));
        [0,2].forEach(at => kit(t,'kick',start+at*beat,.28));
        [0,.5,1.5,2,2.5,3.5].forEach(at => kit(t,'hat',start+at*beat,.055,.4));
        if (b%4===3) [3,3.25,3.5,3.75].forEach((at,k) => brush(t,start+at*beat,.12+k*.04,-.4+k*.2));
      } else {
        melody(t,chipBrass,tune[b],start,beat,.29*lift,-.1);
        if (contrast) melody(t,chipStrings,tune[b],start,beat,.12,.2,-12);
        // 2+2+3 : accents aux croches 0, 2, 4, approche chromatique vers l'accord suivant.
        [root,root+12,root+7,root+6,root, nextRoot-2,nextRoot-1].forEach((n,k) => bass(t,n,start+k*beat,beat*.65,.36));
        [0,2,4].forEach(at => {
          notes.forEach((n,k) => chipBrass(t,n+12,start+at*beat,beat*.65,.075,(k-1)*.5));
          kit(t,'kick',start+at*beat,.55); kit(t,'tom',start+at*beat,.3,at/7-.4,at===4 ? 110 : 170);
        });
        notes.forEach((n,k) => chipStrings(t,n+12,start,length*.9,contrast ? .08 : .04,(k-1)*.6));
        [2,5].forEach(at => kit(t,'snare',start+at*beat,.32));
        for (let k=0;k<7;k++) kit(t,'hat',start+k*beat,.09,.4);
        if (b===0) kit(t,'crash',start,.25,-.4);
        if (b%4===3) [4,4.5,5,5.5,6,6.5].forEach((at,k) => kit(t,'tom',start+at*beat,.28+k*.025,-.5+k*.2,240-k*28));
      }
    }
  }
  reverb(t,name==='grotte' ? .24 : .15,{room:name==='grotte' ? .62 : .38,damp:.55,predelay:.014});
  return t;
}

function extraJingle(victory) {
  // Deux phrases : appel/cadence en mi bémol, plainte/résolution en si mineur.
  const beat = 60/(victory ? 120 : 60), units = victory ? 4 : 3;
  const t = canvas(victory ? 10.5 : 11.5,true,false);
  const tune = victory ? phrase([
    [[70,.5],[70,.5],[75,1],[79,.5],[82,.5],[87,1]],
    [[84,1],[80,.5],[79,.5],[77,1],[74,1]],
    [[75,4]],
  ],4) : phrase([
    [[74,1.5],[73,.5],[71,1]], [[67,1],[66,1],[70,1]], [[71,3]],
  ],3);
  const chords = victory ? [[51,'maj'],[58,'dom'],[51,'maj']] : [[47,'min'],[54,'dom'],[47,'min']];
  for (let b=0;b<3;b++) {
    const start = b*units*beat, notes = tones(chords[b]), final = b===2;
    melody(t,victory ? chipBrass : chipKeys,tune[b],start,beat,victory ? .32 : .4,-.08);
    notes.forEach((n,k) => {
      (victory ? chipBrass : chipStrings)(t,n+12,start,final ? (victory ? 1.7 : 2.2) : units*beat*.85,.12,(k-1)*.45);
      if (final) bell(t,n+12,start,victory ? 2.6 : 1.5,.09,(k-1)*.4);
    });
    triangleBass(t,bassRoot(chords[b][0]),start,final ? 2 : units*beat*.8,.38);
    if (victory) {
      kit(t,'crash',start,final ? .42 : .2,-.35);
      kit(t,'kick',start,.5);
      if (!final) [2,2.5,3,3.5].forEach((at,k) => kit(t,b===1 ? 'tom' : 'snare',start+at*beat,.2+k*.04,k*.2-.3,200-k*30));
    }
  }
  reverb(t,.26,{room:.62,damp:.48,predelay:.018});
  // La réserve de silence accueille la réverbération, puis fondu de sécurité de 120 ms.
  for (const channel of t.channels) for (let i=t.length-Math.round(.12*SR);i<t.length;i++) channel[i] *= (t.length-1-i)/(.12*SR);
  return t;
}
const extraMusics = {
  aube: () => arrangeExtra('aube'), village: () => arrangeExtra('village'),
  grotte: () => arrangeExtra('grotte'), raid: () => arrangeExtra('raid'),
  victoire: () => extraJingle(true), defaite: () => extraJingle(false),
};

function run(binary, args) {
  const result = spawnSync(binary, args, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${binary} : ${result.stderr || result.signal}`);
  return result.stderr;
}
let ffmpeg = process.env.FFMPEG || 'ffmpeg';
const probe = spawnSync(ffmpeg, ['-version'], { encoding: 'utf8' });
if (probe.error?.code === 'ENOENT' && ffmpeg === 'ffmpeg') ffmpeg = '/Users/joran/video-editing/.runtime/bin/ffmpeg';
run(ffmpeg, ['-version']);
await mkdir(output, { recursive: true });
const temporary = await mkdtemp(join(tmpdir(), 'until-the-end-audio-'));
const temporaryFiles = [];
const names = extra ? Object.keys(extraMusics) : [...Object.keys(effects), ...Object.keys(musics).map(name => `music-${name}`)];
try {
  for (const name of names) {
    const isMusic = extra || name.startsWith('music-');
    const track = extra ? extraMusics[name]() : isMusic ? musics[name.slice(6)]() : effect(name, effects[name][0]);
    const ceiling = extra && !track.loop ? -1 : isMusic ? -3 : effects[name][1];
    master(track, isMusic && track.loop, ceiling);
    const source = join(temporary, `${name}.wav`);
    temporaryFiles.push(source);
    await writeFile(source, wav(track));
    let encodingGain = 0;
    if (isMusic) {
      // Analyse seulement : gain constant ensuite pour conserver la jonction,
      // sans état de compresseur/loudnorm susceptible de casser la boucle.
      const report = run(ffmpeg, ['-hide_banner', '-i', source, '-af', 'loudnorm=I=-15:TP=-3:LRA=11:print_format=json', '-f', 'null', '-']);
      const json = report.match(/\{\s*"input_i"[\s\S]*?\}/);
      if (!json) throw new Error('Mesure LUFS ffmpeg absente');
      const measurement = JSON.parse(json[0]);
      const gain = Math.min(-15 - Number(measurement.input_i), -3.3 - Number(measurement.input_tp));
      if (!Number.isFinite(gain)) throw new Error('Mesure LUFS invalide');
      encodingGain = gain;
      console.log(`${name} : ${(track.length / SR).toFixed(3)} s, ≈ ${(Number(measurement.input_i) + gain).toFixed(1)} LUFS`);
    }
    // Xing/LAME contient le délai et le padding pour les lecteurs MP3 gapless.
    for (let attempt = 0; attempt < 6; attempt++) {
      run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', source, '-af', `volume=${encodingGain}dB`,
        '-ar', String(SR), '-ac', isMusic ? '2' : '1', '-c:a', 'libmp3lame', '-b:a', isMusic ? '96k' : '80k',
        '-write_xing', '1', '-map_metadata', '-1', join(output, `${name}.mp3`)]);
      const decoded = spawnSync(ffmpeg, ['-v', 'error', '-i', join(output, `${name}.mp3`),
        '-f', 'f32le', '-acodec', 'pcm_f32le', '-'], { maxBuffer: 64 * 1024 * 1024 });
      if (decoded.error) throw decoded.error;
      if (decoded.status !== 0) throw new Error(decoded.stderr.toString());
      if (decoded.stdout.length !== track.length * track.channels.length * 4) throw new Error('Longueur gapless incorrecte');
      let peak = 0;
      for (let i = 0; i < decoded.stdout.length; i += 4) peak = Math.max(peak, Math.abs(decoded.stdout.readFloatLE(i)));
      if (!Number.isFinite(peak) || peak <= 0) throw new Error('MP3 décodé invalide');
      const peakDb = 20 * Math.log10(peak);
      if (peakDb <= ceiling) break;
      if (attempt === 5) throw new Error(`Normalisation MP3 non convergente : ${name}`);
      encodingGain += ceiling - 0.15 - peakDb;
    }
    const size = (await stat(join(output, `${name}.mp3`))).size;
    if (!size) throw new Error(`${name}.mp3 vide`);
    console.log(`${name}.mp3\t${size} octets`);
  }
  console.log(`${names.length} fichiers vérifiés — ${((performance.now() - started) / 1000).toFixed(1)} s.`);
} finally {
  // Uniquement les WAV temporaires créés par cette exécution.
  for (const path of temporaryFiles) await unlink(path).catch(error => { if (error.code !== 'ENOENT') throw error; });
  await rmdir(temporary);
}
