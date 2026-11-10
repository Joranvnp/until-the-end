// Recopie le moteur du jeu web (www/index.html, référence du gameplay) dans un module
// que l'app native exécute avec ses propres window/document/canvas (voir game/env.ts).
// À relancer après chaque modification du jeu : npm run sync-game
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(resolve(here, '../../www/index.html'), 'utf8');

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const engine = scripts.find((s) => s.trimStart().startsWith("'use strict'"));
if (!engine) throw new Error('Script du jeu introuvable dans www/index.html');

const GLOBALS = [
  'window',
  'document',
  'navigator',
  'localStorage',
  'performance',
  'addEventListener',
  'Image',
  'fetch',
  'innerWidth',
  'innerHeight',
  'location',
  'ResizeObserver',
  'visualViewport',
  'requestAnimationFrame',
  'setTimeout',
  'atob',
  'btoa',
];

// Le moteur est enveloppé dans une fonction : ses globales viennent de l'environnement natif.
// Il ne lit innerWidth/innerHeight qu'en secours de getBoundingClientRect : on démarre donc
// le jeu une fois la taille de la vue connue (voir app/(app)/game.tsx).
const out = `/* eslint-disable */
// Généré par scripts/sync-game.mjs depuis www/index.html : ne pas modifier à la main.
export default function createGame(env) {
  const { ${GLOBALS.join(', ')} } = env;
  return (function () {
${engine}
    return window.__game;
  })();
}
`;

writeFileSync(resolve(here, '../game/engine.generated.js'), out);
console.log(`game/engine.generated.js : ${engine.split('\n').length} lignes`);
