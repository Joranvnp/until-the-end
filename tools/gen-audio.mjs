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
const output = resolve(dirname(fileURLToPath(import.meta.url)), '../www/audio');
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
// Accords : [fondamentale MIDI, qualité] ; mélodies : [temps, note, durée en temps].
const QUALITY = { maj: [0, 4, 7], min: [0, 3, 7], sus: [0, 5, 7], maj7: [0, 4, 7, 11], min7: [0, 3, 7, 10],
  add9: [0, 4, 7, 14], min9: [0, 3, 7, 14], dim: [0, 3, 6], sus2: [0, 2, 7] };
// Fondamentales entre do2 et si2 : éviter les do1/sol0 peu audibles en jeu.
const bassRoot = root => 36 + ((root % 12) + 12) % 12;
const tones = ([root, quality]) => QUALITY[quality].map(i => root + i);

function arp(track, chord, start, beat, pattern, inst, amp, octave = 0, step = 0.5, pan = 0.3) {
  const notes = tones(chord), ladder = [...notes, ...notes.map(n => n + 12)];
  pattern.forEach((index, k) => {
    if (index === null) return;
    inst(track, ladder[index] + octave, start + k * step * beat, step * beat * 1.6, amp * (k % 2 ? .75 : 1), k % 2 ? pan : -pan);
  });
}

function melody(track, inst, notes, start, beat, amp, pan = 0, shift = 0) {
  for (const [b, midi, d, v = 1] of notes) inst(track, midi + shift, start + b * beat, d * beat, amp * v, pan);
}

const DAY_A = [
  [[0, 78, 1.5], [1.5, 76, .5], [2, 74, 1], [3, 69, 1]], [[0, 73, 1], [1, 76, 1], [2, 81, 2]],
  [[0, 78, 1.5], [1.5, 79, .5], [2, 78, 1], [3, 74, 1]], [[0, 76, 3], [3, 74, .5], [3.5, 76, .5]],
  [[0, 78, 1], [1, 81, 1], [2, 83, 1], [3, 81, 1]], [[0, 76, 1.5], [1.5, 78, .5], [2, 76, 1], [3, 73, 1]],
  [[0, 74, 1], [1, 71, 1], [2, 74, 1], [3, 79, 1]], [[0, 76, 3.5]],
];
const DAY_B = [
  [[0, 83, 2], [2, 81, 1], [3, 79, 1]], [[0, 79, 1.5], [1.5, 81, .5], [2, 83, 2]],
  [[0, 86, 2], [2, 85, 1], [3, 81, 1]], [[0, 81, 3], [3, 76, 1]],
  [[0, 79, 1], [1, 78, 1], [2, 76, 1], [3, 74, 1]], [[0, 76, 1.5], [1.5, 74, .5], [2, 71, 2]],
  [[0, 74, 1], [1, 76, 1], [2, 78, 1], [3, 81, 1]], [[0, 79, 2], [2, 76, 1], [3, 74, 1]],
];

function musicDay() {
  const bpm = 100, beat = 60 / bpm, barLength = 4 * beat, bars = 32;
  const t = canvas(bars * barLength, true, true);
  const A = [[62, 'add9'], [57, 'maj'], [59, 'min7'], [55, 'maj7'], [62, 'maj'], [57, 'maj'], [55, 'add9'], [57, 'sus']];
  const B = [[52, 'min7'], [55, 'maj'], [62, 'add9'], [57, 'maj'], [52, 'min9'], [55, 'maj7'], [59, 'min'], [57, 'sus']];
  for (let b = 0; b < bars; b++) {
    const section = Math.floor(b / 8), i = b % 8, start = b * barLength;
    const chord = (section === 2 ? B : A)[i], notes = tones(chord);
    // Nappe et basse
    notes.slice(0, 3).forEach((n, k) => pad(t, n, start, barLength, .05, (k - 1) * .5, { cutoff: 1500 }));
    bass(t, bassRoot(chord[0]), start, beat * 1.8, .32);
    bass(t, bassRoot(chord[0]) + 7, start + beat * 2, beat * .9, .2);
    bass(t, bassRoot(chord[0]), start + beat * 3, beat * .9, section ? .22 : .14);
    // Harpe en croches, plus dense au fil des sections
    const pattern = section === 0 ? [0, null, 2, null, 1, null, 3, null] : [0, 2, 4, 2, 1, 3, 5, 3];
    arp(t, chord, start, beat, pattern, (tr, m, s, d, a, p) => pluck(tr, m, s, d, a, p, { bright: .45, damping: .995, ring: .9 }), .2);
    // Mélodie : marimba, puis flûte au pont, marimba doublée d’une cloche au retour
    if (section === 0 && i % 2 === 0) melody(t, marimba, DAY_A[i].slice(0, 2), start, beat, .14, .1, -12);
    if (section === 1) melody(t, marimba, DAY_A[i], start, beat, .32, .1);
    if (section === 2) melody(t, flute, DAY_B[i], start, beat, .16, -.05);
    if (section === 3 && i < 7) {
      melody(t, marimba, DAY_A[i], start, beat, .28, .1);
      melody(t, bell, DAY_A[i].slice(0, 1), start, beat, .035, -.3);
    }
    if (section === 3 && i === 7) melody(t, kalimba, [[0, 74, 2], [2, 69, 2]], start, beat, .25, .2);
    // Percussions douces
    if (section) {
      drum(t, start, .32, { f0: 140, f1: 52, decay: .22, click: .1 });
      drum(t, start + beat * 2.5, .22, { f0: 140, f1: 52, decay: .2, click: .1 });
      for (let s = 0; s < 8; s++) shaker(t, start + s * beat / 2 + (s % 2 ? beat * .04 : 0), s % 2 ? .05 : .08, .35);
    }
    if (section === 2) [1, 3].forEach(p => rim(t, start + p * beat, .09, -.2));
    if (section === 0 && i % 2 === 0) kalimba(t, notes[2] + 12, start + beat * 3.5, beat, .07, -.4);
  }
  const air = svf('band');
  texture(t, .025, (_, i) => air(noise(), 440 + 120 * sine(2 * i / t.length), .8), -.3);
  echo(t, beat * .75, .3, .14);
  reverb(t, .3, { room: .7, damp: .45, predelay: .02 });
  return t;
}

function musicMenu() {
  const bpm = 72, beat = 60 / bpm, barLength = 4 * beat, bars = 16;
  const t = canvas(bars * barLength, true, true);
  const C = [[57, 'min9'], [53, 'maj7'], [48, 'add9'], [55, 'sus2'], [57, 'min7'], [53, 'maj7'], [50, 'min9'], [52, 'maj']];
  const M = [
    [[0, 76, 1.5], [1.5, 74, .5], [2, 72, 2]], [[0, 69, 1], [1, 72, 1], [2, 76, 2]],
    [[0, 79, 2], [2, 76, 1], [3, 74, 1]], [[0, 74, 3.5]],
    [[0, 76, 1], [1, 79, 1], [2, 81, 1.5], [3.5, 79, .5]], [[0, 77, 2], [2, 76, 1], [3, 72, 1]],
    [[0, 74, 1.5], [1.5, 72, .5], [2, 76, 2]], [[0, 68, 2], [2, 71, 2]],
  ];
  for (let b = 0; b < bars; b++) {
    const i = b % 8, start = b * barLength, chord = C[i];
    tones(chord).forEach((n, k) => pad(t, n, start, barLength, .045, (k - 1.5) * .35, { cutoff: 1100, attack: 1.4 }));
    bass(t, bassRoot(chord[0]), start, barLength * .9, .22);
    arp(t, chord, start, beat, [0, null, 2, 3, null, 1, 4, null], kalimba, .12, 12, .5, .4);
    if (b >= 8) melody(t, flute, M[i], start, beat, .14, 0);
    else if (i % 2 === 0) melody(t, marimba, M[i].slice(0, 2), start, beat, .1, -.2, -12);
    else if (i % 2 === 1) glass(t, tones(chord)[2] + 24, start + beat * 2, beat, .04, .4);
    if (i % 2 === 0) taiko(t, start, .2, -.15);
    if (i === 7) taiko(t, start + beat * 3, .12, .15);
  }
  // Brume : souffle grave qui respire sur la durée du morceau (périodique)
  const wind = svf('band');
  texture(t, .05, (_, i) => wind(noise(), 380 + 220 * Math.sin(TAU * 2 * i / t.length), 1.2), .2);
  echo(t, beat * .75, .35, .18);
  reverb(t, .45, { room: .88, damp: .35, predelay: .03 });
  return t;
}

function musicNight() {
  const bpm = 64, beat = 60 / bpm, barLength = 4 * beat, bars = 20;
  const t = canvas(bars * barLength, true, true);
  const C = [[52, 'min9'], [48, 'maj7'], [45, 'min9'], [47, 'sus'], [52, 'min7'], [48, 'maj7'], [50, 'add9'], [47, 'min7'], [45, 'min9'], [47, 'sus']];
  const M = [
    [[0, 71, 1.5], [1.5, 74, .5], [2, 76, 1.5]], [[0, 79, 2], [2, 78, .5], [2.5, 76, 1]],
    [[0, 72, 2], [2, 71, 1], [3, 69, .5]], [[0, 76, 2], [2, 78, 1.5]],
    [[0, 76, 1.5], [1.5, 78, .5], [2, 79, 1.5]], [[0, 83, 2], [2, 79, 1], [3, 76, .5]],
    [[0, 78, 2.5], [3, 76, .5]], [[0, 74, 1], [1, 73, .5], [1.5, 71, 2]],
    [[0, 72, 1.5], [2, 71, 1], [3, 69, .5]], [[0, 76, 2], [2, 78, 1], [3, 71, .5]],
  ];
  for (let b = 0; b < bars; b++) {
    const i = b % 10, start = b * barLength, chord = C[i], notes = tones(chord);
    notes.forEach((n, k) => pad(t, n, start, barLength, .055, (k - 1.5) * .4, { cutoff: 900, attack: 1.8, release: 2.4 }));
    bass(t, bassRoot(chord[0]), start, barLength * .95, b % 4 === 0 ? .16 : .1);
    if (b % 2 === 0) drum(t, start, .18, { f0: 90, f1: 45, decay: .5, click: 0 });
    // Cloches de verre en écho, motif de trois notes qui tourne lentement
    [0, 1.5, 3].forEach((p, k) => glass(t, notes[(k + b) % notes.length] + 12, start + beat * p, beat, .045 * (k ? .7 : 1), k % 2 ? .45 : -.45));
    if (b >= 4 && b < 12) melody(t, flute, M[i], start, beat, .12, .1);
    if (b >= 14 && b < 18) melody(t, marimba, M[i], start, beat, .14, -.1, -12);
  }
  // Grotte : gouttes semées et vent qui respire
  for (let k = 0; k < 22; k++) drip(t, between(0, t.length / SR), between(.03, .07), between(650, 1200), between(-.7, .7));
  const wind = svf('band'), wind2 = svf('band');
  texture(t, .07, (_, i) => wind(noise(), 300 + 180 * Math.sin(TAU * 3 * i / t.length), 1.5), -.4);
  texture(t, .04, (_, i) => wind2(noise(), 900 + 400 * Math.sin(TAU * 2 * i / t.length + 1), 3), .4);
  echo(t, beat * .75, .45, .25);
  reverb(t, .6, { room: .92, damp: .3, predelay: .04 });
  return t;
}

function musicCombat() {
  const bpm = 128, beat = 60 / bpm, barLength = 4 * beat, bars = 24;
  const t = canvas(bars * barLength, true, true);
  const C = [[50, 'min'], [46, 'maj'], [48, 'maj'], [50, 'min'], [50, 'min'], [46, 'maj'], [43, 'min'], [45, 'maj']];
  const M = [
    [[0, 74, 1.5], [1.5, 77, .5], [2, 81, 2]], [[0, 82, 1], [1, 81, 1], [2, 77, 2]],
    [[0, 79, 1.5], [1.5, 81, .5], [2, 79, 1], [3, 76, 1]], [[0, 74, 3], [3, 72, 1]],
    [[0, 74, 1], [1, 77, 1], [2, 81, 1], [3, 86, 1]], [[0, 84, 2], [2, 82, 1], [3, 81, 1]],
    [[0, 79, 1.5], [1.5, 77, .5], [2, 79, 1], [3, 82, 1]], [[0, 81, 2], [2, 73, 2]],
  ];
  for (let b = 0; b < bars; b++) {
    const section = Math.floor(b / 8), i = b % 8, start = b * barLength, chord = C[i], notes = tones(chord);
    // Ostinato de basse en croches
    const line = [0, 0, 12, 0, 0, 7, 0, 7];
    line.forEach((n, s) => bass(t, bassRoot(chord[0]) + n, start + s * beat / 2, beat * .42, s % 2 ? .22 : .3));
    // Cordes détachées en doubles croches sur les deux premières sections
    for (let s = 0; s < 16; s++) {
      if ((section === 2 && s % 2 !== 0) || (section === 1 && s % 4 === 3)) continue;
      const n = notes[[0, 1, 2, 1][s % 4]] + 12;
      strings(t, n, start + s * beat / 4, beat * .2, (s % 4 ? .07 : .11) * (section === 1 ? .7 : 1), s % 2 ? .35 : -.35);
    }
    // Taikos : grand coup sur 1, réponses syncopées, roulement en fin de phrase
    taiko(t, start, .55, -.1);
    taiko(t, start + beat * 1.5, .3, .2);
    taiko(t, start + beat * 2, .45, -.1);
    if (i % 4 === 3) [3, 3.25, 3.5, 3.75].forEach((p, k) => taiko(t, start + beat * p, .2 + k * .06, k % 2 ? .3 : -.3));
    [1, 3].forEach(p => rim(t, start + p * beat, .14, .25));
    for (let s = 0; s < 8; s++) shaker(t, start + s * beat / 2, s % 2 ? .06 : .04, -.3);
    // Thème : cors au milieu, cordes aiguës au dernier tiers
    if (section === 1) { melody(t, brass, M[i], start, beat, .22, 0, -12); melody(t, brass, M[i], start, beat, .1, .2, -24); }
    if (section === 2) melody(t, strings, M[i], start, beat, .16, -.1);
    if (section !== 1) tones(chord).forEach((n, k) => pad(t, n, start, barLength, .035, (k - 1) * .5, { cutoff: 1800, attack: .3, release: .6 }));
    if (i === 7) sweep(t, start + beat * 2, beat * 2, .12, 600, 6000, .8, .95, 0);
  }
  reverb(t, .22, { room: .75, damp: .45, predelay: .015 });
  return t;
}

function musicBlood() {
  const bpm = 76, beat = 60 / bpm, barLength = 4 * beat, bars = 16;
  const t = canvas(bars * barLength, true, true);
  // Do mineur phrygien : le ré bémol donne la menace.
  const C = [[48, 'min'], [49, 'maj'], [48, 'min'], [44, 'maj'], [48, 'min'], [49, 'maj'], [46, 'min'], [47, 'dim']];
  const M = [
    [[0, 72, 2], [2, 73, .5], [2.5, 72, 1]], [[0, 73, 2.5], [3, 68, .5]], [[0, 67, 2], [2, 68, 1], [3, 67, 1]], [[0, 63, 4]],
    [[0, 72, 1.5], [1.5, 75, .5], [2, 73, .5], [2.5, 72, 1]], [[0, 73, 2], [2, 68, 1.5]], [[0, 70, 2], [2, 65, 1.5]], [[0, 65, 2], [2, 62, 1.5]],
  ];
  for (let b = 0; b < bars; b++) {
    const i = b % 8, start = b * barLength, chord = C[i];
    tones(chord).forEach((n, k) => choir(t, n, start, barLength, .06, (k - 1) * .5, b % 2 ? 'o' : 'u'));
    bass(t, bassRoot(chord[0]), start, barLength * .85, .18);
    // Battement de cœur : « lub-dub » sur chaque temps fort
    [0, 2].forEach(p => {
      drum(t, start + p * beat, .5, { f0: 80, f1: 42, drop: 20, decay: .18, click: 0 });
      drum(t, start + p * beat + .17, .3, { f0: 75, f1: 40, drop: 20, decay: .15, click: 0 });
    });
    if (i === 0 || i === 4) taiko(t, start, .4, 0);
    // Cloches au triton, presque immobiles
    glass(t, chord[0] + 30, start + beat * 1, beat * .5, .025, -.5);
    if (b % 2) glass(t, chord[0] + 36, start + beat * 3, beat, .035, .5);
    if (b >= 8) melody(t, (tr, m, s, d, a, p) => choir(tr, m, s, d, a, p, 'a'), M[i], start, beat, .1, .1);
    else melody(t, flute, M[i], start, beat, .06, .2, -12);
  }
  // Grincement métallique lointain et vent rouge
  const scrape = svf('band'), wind = svf('band');
  texture(t, .035, (_, i) => scrape(noise(), 2400 + 900 * Math.sin(TAU * 4 * i / t.length), 12), .5);
  texture(t, .06, (_, i) => wind(noise(), 260 + 140 * Math.sin(TAU * 3 * i / t.length), 1.4), -.3);
  echo(t, beat * .75, .4, .18);
  reverb(t, .55, { room: .93, damp: .35, predelay: .035 });
  return t;
}

const musics = { menu: musicMenu, day: musicDay, night: musicNight, combat: musicCombat, blood: musicBlood };

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
const names = [...Object.keys(effects), ...Object.keys(musics).map(name => `music-${name}`)];
try {
  for (const name of names) {
    const isMusic = name.startsWith('music-');
    const track = isMusic ? musics[name.slice(6)]() : effect(name, effects[name][0]);
    const ceiling = isMusic ? -3 : effects[name][1];
    master(track, isMusic, ceiling);
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
