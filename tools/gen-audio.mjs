/** Génère les effets et boucles musicales d’Until The End par synthèse DSP.
 * Commande prévue : npm run audio (si déclaré dans package.json).
 * Commande autonome : node tools/gen-audio.mjs — Node 18+, ffmpeg, sans npm.
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
const hz = midi => 440 * 2 ** ((midi - 69) / 12);
const sine = phase => Math.sin(TAU * phase);
const db = value => 10 ** (value / 20);

// Biquads RBJ : état propre à chaque voix, coefficients normalisés par a0.
function biquad(type, frequency, q = 0.707) {
  const w = TAU * frequency / SR, c = Math.cos(w), a = Math.sin(w) / (2 * q);
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

function layer(track, start, duration, amplitude, sample, pan = 0) {
  const offset = Math.round(start * SR), count = Math.round(duration * SR);
  const left = Math.cos((pan + 1) * Math.PI / 4), right = Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < count; i++) {
    let index = offset + i;
    if (track.loop) index = ((index % track.length) + track.length) % track.length;
    else if (index >= track.length) break;
    const value = amplitude * sample(i / SR, i);
    track.channels[0][index] += value * (track.channels.length === 1 ? 1 : left);
    if (track.channels.length === 2) track.channels[1][index] += value * right;
  }
}

function dust(track, start, duration, amp, frequency, type = 'band', decay = 8, pan = 0) {
  const filter = biquad(type, frequency, 0.85);
  layer(track, start, duration, amp, t => filter(noise()) * Math.exp(-decay * t / duration)
    * Math.min(1, (duration - t) / 0.008), pan);
}

function note(track, kind, midi, start, duration, amp, pan = 0) {
  const f = hz(midi), filter = biquad('low', kind === 'bass' ? 650 : 4200);
  let phase = 0;
  layer(track, start, duration, amp, t => {
    phase += f * (1 + (kind === 'flute' || kind === 'horn' ? 0.0025 * sine(5.1 * t) : 0)) / SR;
    let value, envelope;
    switch (kind) {
      case 'bell':
        value = sine(f * t + 0.6 * Math.exp(-9 * t) * sine(f * 2.76 * t))
          + 0.33 * sine(f * 2.01 * t) * Math.exp(-5 * t) + 0.13 * sine(f * 4.09 * t) * Math.exp(-12 * t);
        envelope = adsr(t, duration, 0.001, duration * 0.65, 0.08, 0.08) * Math.exp(-2.5 * t / duration);
        break;
      case 'pluck':
        value = sine(f * t + 1.8 * Math.exp(-20 * t) * sine(f * t)) + 0.2 * sine(3 * f * t) * Math.exp(-18 * t);
        envelope = adsr(t, duration, 0.001, duration * 0.75, 0.02, 0.025) * Math.exp(-3 * t / duration);
        break;
      case 'pad':
        value = (sine(f * t) + 0.45 * sine(f * 1.002 * t) + 0.3 * sine(f * 0.998 * t)
          + 0.15 * sine(f * 2 * t)) / 1.9;
        envelope = adsr(t, duration, 0.65, 0.6, 0.8, 1.1);
        break;
      case 'flute':
        value = sine(phase + 0.12 * sine(phase * 2)) + 0.035 * filter(noise());
        envelope = adsr(t, duration, 0.045, 0.15, 0.72, 0.18);
        break;
      case 'horn':
        value = Math.tanh(1.4 * (sine(phase + 0.65 * sine(phase)) + 0.25 * sine(phase * 2)));
        envelope = adsr(t, duration, 0.025, 0.3, 0.8, 0.55);
        break;
      default:
        value = filter(sine(phase) + 0.23 * sine(phase * 2) + 0.1 * sine(phase * 3));
        envelope = adsr(t, duration, 0.009, 0.13, 0.55, 0.18);
    }
    return value * envelope;
  }, pan);
}

function thump(track, start, duration, amp, frequency = 90, pan = 0) {
  layer(track, start, duration, amp, t => Math.tanh(1.6 * sine(frequency * t + 3 * (1 - Math.exp(-30 * t))))
    * Math.exp(-7 * t / duration) * Math.min(1, (duration - t) / 0.01), pan);
}

// Réseau Schroeder : 4 peignes amortis et 2 diffuseurs passe-tout par canal.
// Les queues sont explicitement repliées modulo N. 12 secondes de décroissance
// bornent le résidu sous -100 dB (T60 <= 1.8 s), sans fondu global de la boucle.
function reverb(track, wet, t60 = 1.2) {
  track.channels = track.channels.map((dry, channel) => {
    const combs = [0.0297, 0.0371, 0.0411, 0.0437].map(time => {
      const size = Math.round((time + channel * 0.00073) * SR);
      return { buffer: new Float32Array(size), index: 0, damp: 0, feedback: 10 ** (-3 * size / SR / t60) };
    });
    const allpasses = [0.005, 0.0017].map(time => ({ buffer: new Float32Array(Math.round((time + channel * 0.00031) * SR)), index: 0 }));
    const result = Float32Array.from(dry);
    const end = dry.length + (track.loop ? 12 * SR : 0);
    for (let i = 0; i < end; i++) {
      const input = i < dry.length ? dry[i] : 0;
      let sum = 0;
      for (const comb of combs) {
        const delayed = comb.buffer[comb.index];
        comb.damp = 0.68 * delayed + 0.32 * comb.damp;
        comb.buffer[comb.index] = input + comb.damp * comb.feedback;
        comb.index = (comb.index + 1) % comb.buffer.length;
        sum += delayed * 0.25;
      }
      for (const pass of allpasses) {
        const delayed = pass.buffer[pass.index], value = delayed - 0.5 * sum;
        pass.buffer[pass.index] = sum + 0.5 * value;
        pass.index = (pass.index + 1) % pass.buffer.length;
        sum = value;
      }
      result[i % dry.length] += wet * sum;
    }
    return result;
  });
}

function master(track, music) {
  let meanSquare = 0, peak = 0;
  for (const channel of track.channels) {
    // La suppression de la composante continue préserve la périodicité.
    let mean = 0;
    for (const x of channel) mean += x;
    mean /= channel.length;
    for (let i = 0; i < channel.length; i++) {
      let x = channel[i] - mean;
      x = Math.tanh(x * 1.15) / 1.15;
      if (!music) x *= Math.min(1, (channel.length - 1 - i) / (SR * 0.012));
      channel[i] = x;
      peak = Math.max(peak, Math.abs(x)); meanSquare += x * x;
    }
  }
  if (!peak || !Number.isFinite(meanSquare)) throw new Error('Signal vide ou non fini');
  const rms = Math.sqrt(meanSquare / (track.length * track.channels.length));
  // RMS seulement comme pré-gain ; loudnorm mesure ensuite le LUFS réel.
  const gain = music ? Math.min(db(-3) / peak, db(-16) / rms) : db(-1) / peak;
  for (const channel of track.channels) for (let i = 0; i < channel.length; i++) channel[i] *= gain;
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

function effect(name, duration) {
  const t = canvas(duration);
  switch (name) {
    case 'hit':
      dust(t, 0, .15, .55, 3700, 'high'); note(t, 'bell', 94, 0, .11, .5); thump(t, 0, .08, .3, 230); break;
    case 'brk':
      dust(t, 0, .2, .8, 1200); thump(t, 0, .16, .5, 100);
      for (let i = 0; i < 7; i++) dust(t, .035 + i * .039, .065, .32 * (1 - i / 9), 1800 + i * 330);
      break;
    case 'place': thump(t, 0, .12, .8, 170); dust(t, 0, .08, .4, 750); break;
    case 'jump':
      dust(t, 0, .15, .3, 1500, 'band', 3);
      layer(t, 0, .15, .3, s => sine(290 * s + 800 * s * s) * Math.exp(-25 * s)); break;
    case 'pick': note(t, 'bell', 88, 0, .26, .7); note(t, 'bell', 95, .075, .22, .5); break;
    case 'sword': dust(t, 0, .22, .8, 2600, 'band', 2.5); thump(t, .13, .12, .6, 150); break;
    case 'hurt':
      thump(t, 0, .25, .8, 60); dust(t, 0, .11, .35, 900);
      layer(t, 0, .3, .5, s => Math.tanh(2 * sine(110 * s - 70 * s * s + .6 * sine(47 * s))) * Math.exp(-12 * s)); break;
    case 'buy':
      [76, 80, 83, 88].forEach((n, i) => note(t, 'bell', n, i * .065, .6 - i * .065, .45)); dust(t, 0, .05, .2, 6500, 'high'); break;
    case 'bow':
      layer(t, 0, .28, .65, s => (sine(180 * s + 1.5 * Math.exp(-35 * s) * sine(360 * s))) * Math.exp(-20 * s));
      dust(t, .025, .3, .35, 4700, 'band', 4); break;
    case 'ach': [74, 78, 81, 86, 90].forEach((n, i) => note(t, 'bell', n, i * .12, 1.2 - i * .12, .55)); break;
    case 'horn': note(t, 'horn', 38, 0, 1.8, .65); note(t, 'horn', 45, .02, 1.75, .23); dust(t, 0, .08, .18, 500); break;
    case 'click': dust(t, 0, .04, .5, 1600, 'low'); thump(t, 0, .05, .25, 600); break;
    case 'boom':
      thump(t, 0, 1.4, 1, 38); dust(t, 0, 1.4, 1.1, 700, 'low', 5); dust(t, 0, .24, .6, 3000, 'high');
      for (let i = 0; i < 8; i++) dust(t, .03 + i * .07, .1, .25 * Math.exp(-i / 4), 1500, 'band'); break;
    case 'deny': [43, 40].forEach((n, i) => note(t, 'bass', n, i * .12, .13, .8)); dust(t, 0, .02, .1, 500, 'low'); break;
    case 'coin': [88, 95, 100, 91, 98, 103, 107].forEach((n, i) => note(t, 'bell', n, i * .075, .9 - i * .075, .45)); break;
    default: throw new Error(`Effet inconnu : ${name}`);
  }
  reverb(t, name === 'horn' ? .55 : .16, name === 'horn' ? 1.8 : .65);
  return t;
}

const scores = {
  menu: { bpm: 80, bars: 16, chords: [[50,57,62,65], [46,53,58,62], [53,60,65,69], [48,55,60,64],
    [50,57,62,65], [43,50,58,62], [46,53,58,65], [45,52,61,64]],
    melody: [[74,77,76,72], [70,74,77,74], [72,77,81,79], [76,72,67,72],
      [74,81,79,77], [79,77,74,70], [77,74,70,72], [73,76,69,73]] },
  day: { bpm: 92, bars: 24, chords: [[48,55,60,64], [45,52,57,60], [53,60,65,69], [43,50,55,62],
    [48,55,64,67], [52,59,64,67], [53,60,65,69], [43,55,59,62]],
    melody: [[72,76,79,81], [79,76,72,69], [72,74,76,79], [74,79,76,74],
      [76,79,84,81], [79,76,74,72], [81,79,76,74], [74,72,67,72]] },
  night: { bpm: 70, bars: 18, chords: [[33,45,52,60], [33,45,53,60], [29,41,48,57],
    [31,43,50,59], [33,45,52,60], [28,40,47,56]],
    melody: [[69,71], [72,68], [65,64], [67,66], [64,60], [59,68]] },
};

function music(name) {
  const score = scores[name], beat = 60 / score.bpm, bar = 4 * beat;
  const t = canvas(score.bars * bar, true, true);
  for (let b = 0; b < score.bars; b++) {
    const chord = score.chords[b % score.chords.length], start = b * bar;
    const phrase = Math.floor(b / score.chords.length), lift = phrase % 2 ? 1.12 : 1;
    if (name === 'night') {
      chord.slice(0, 3).forEach((n, i) => note(t, 'pad', n, start, bar + 2, .16, (i - 1) * .4));
      [0, 1.5, 2.5].forEach((p, i) => thump(t, start + p * beat, .48, i ? .085 : .16, 42, i ? .12 : -.12));
      note(t, 'bell', chord[2], start + beat * .5, 3.5, .15, -.3);
      if (b % 3 !== 1) {
        const motif = score.melody[b % 6];
        note(t, 'flute', motif[0], start + beat * 1.5, beat * 1.8, .085, .25);
        if (b % 3 === 2) note(t, 'bell', motif[1], start + beat * 3.25, 2.2, .055, -.35);
      }
      dust(t, start, bar, .025, 800, 'band', 1, .3);
      continue;
    }
    chord.slice(1).forEach((n, i) => note(t, 'pad', n, start, bar + 1.4, name === 'menu' ? .14 : .055, (i - 1) * .4));
    note(t, 'bass', chord[0] - 12, start, beat * 2.8, .26);
    note(t, 'bass', chord[0] - 5, start + beat * 3, beat * .9, .15);
    const pattern = [0, 1, 2, 1, 0, 2, 1, 2];
    for (let step = 0; step < 8; step++) {
      const n = chord[1 + pattern[step]] + (name === 'menu' ? 12 : 0);
      note(t, name === 'menu' ? 'bell' : 'pluck', n, start + step * beat / 2,
        name === 'menu' ? 1.4 : .65, (step % 2 ? .09 : .13) * lift, step % 2 ? .3 : -.3);
    }
    const motif = score.melody[b % score.melody.length];
    // Réponses espacées en fin de phrase ; seconde exposition ornée.
    const rhythm = b % 4 === 3 ? [0, 1.5, 2.5] : [.5, 1.5, 2.25, 3];
    rhythm.forEach((p, i) => note(t, name === 'menu' ? 'flute' : 'pluck', motif[i],
      start + beat * p, beat * (i === rhythm.length - 1 ? 1.6 : .85), .17 * lift, .1));
    if (phrase && b % 4 === 2) note(t, 'bell', motif[3] + 12, start + beat * 3.5, 1, .065, -.35);
    if (name === 'menu') {
      if (b % 2 === 0) thump(t, start, 1.5, .22, 55, -.2);
      if (b % 4 === 3) thump(t, start + beat * 3, .8, .12, 75, .2);
    } else {
      [0, 2].forEach(p => thump(t, start + p * beat, .15, .095, 95));
      [1, 3].forEach(p => dust(t, start + p * beat, .09, .08, 1900, 'band', 6, -.25));
      for (let s = 0; s < 8; s++) dust(t, start + s * beat / 2, .045, s % 2 ? .03 : .02, 6500, 'high', 5, .3);
    }
  }
  reverb(t, name === 'day' ? .22 : .43, name === 'night' ? 1.8 : 1.5);
  return t;
}

const effects = { hit: .15, brk: .35, place: .12, jump: .15, pick: .3, sword: .25, hurt: .3,
  buy: .6, bow: .35, ach: 1.2, horn: 2.2, click: .05, boom: 1.4, deny: .25, coin: .9 };
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
try {
  for (const name of [...Object.keys(effects), 'music-menu', 'music-day', 'music-night']) {
    const isMusic = name.startsWith('music-');
    const track = isMusic ? music(name.slice(6)) : effect(name, effects[name]);
    master(track, isMusic);
    const source = join(temporary, `${name}.wav`);
    temporaryFiles.push(source);
    await writeFile(source, wav(track));
    let encodingGain = 0;
    if (isMusic) {
      // Analyse seulement : gain constant ensuite pour conserver la jonction,
      // sans état de compresseur/loudnorm susceptible de casser la boucle.
      const report = run(ffmpeg, ['-hide_banner', '-i', source, '-af', 'loudnorm=I=-14:TP=-3:LRA=11:print_format=json', '-f', 'null', '-']);
      const json = report.match(/\{\s*"input_i"[\s\S]*?\}/);
      if (!json) throw new Error('Mesure LUFS ffmpeg absente');
      const measurement = JSON.parse(json[0]);
      const gain = Math.min(-14 - Number(measurement.input_i), -3.3 - Number(measurement.input_tp));
      if (!Number.isFinite(gain)) throw new Error('Mesure LUFS invalide');
      encodingGain = gain;
      console.log(`${name} : ${(track.length / SR).toFixed(3)} s, ≈ ${(Number(measurement.input_i) + gain).toFixed(1)} LUFS`);
    }
    // Xing/LAME contient le délai et le padding pour les lecteurs MP3 gapless.
    for (let attempt = 0; attempt < 6; attempt++) {
      run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', source, '-af', `volume=${encodingGain}dB`,
        '-ar', String(SR), '-ac', isMusic ? '2' : '1', '-c:a', 'libmp3lame', '-b:a', isMusic ? '128k' : '96k',
        '-write_xing', '1', '-map_metadata', '-1', join(output, `${name}.mp3`)]);
      const decoded = spawnSync(ffmpeg, ['-v', 'error', '-i', join(output, `${name}.mp3`),
        '-f', 'f32le', '-acodec', 'pcm_f32le', '-'], { maxBuffer: 32 * 1024 * 1024 });
      if (decoded.error) throw decoded.error;
      if (decoded.status !== 0) throw new Error(decoded.stderr.toString());
      if (decoded.stdout.length !== track.length * track.channels.length * 4) throw new Error('Longueur gapless incorrecte');
      let peak = 0;
      for (let i = 0; i < decoded.stdout.length; i += 4) peak = Math.max(peak, Math.abs(decoded.stdout.readFloatLE(i)));
      if (!Number.isFinite(peak) || peak <= 0) throw new Error('MP3 décodé invalide');
      const peakDb = 20 * Math.log10(peak);
      if (peakDb <= (isMusic ? -3 : -1)) break;
      if (attempt === 5) throw new Error(`Normalisation MP3 non convergente : ${name}`);
      encodingGain += (isMusic ? -3.15 : -1.15) - peakDb;
    }
    const size = (await stat(join(output, `${name}.mp3`))).size;
    if (!size) throw new Error(`${name}.mp3 vide`);
    console.log(`${name}.mp3\t${size} octets`);
  }
  console.log(`18 fichiers vérifiés — ${((performance.now() - started) / 1000).toFixed(1)} s.`);
} finally {
  // Uniquement les WAV temporaires créés par cette exécution.
  for (const path of temporaryFiles) await unlink(path).catch(error => { if (error.code !== 'ENOENT') throw error; });
  await rmdir(temporary);
}
