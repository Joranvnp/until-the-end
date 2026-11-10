// Sert le moteur de l'app dans un navigateur : banc d'essai (tools/game.html), moteur, sons et images.
// - `npm run play` : ouvre http://127.0.0.1:8080 pour jouer et développer sur ordinateur
// - importé par tools/test.mjs et tools/gen-art.mjs (startGameServer) pour les tests et les captures sans écran
import { createServer } from 'http';
import { existsSync, readFileSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = path.join(root, 'mobile-app');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.mp3': 'audio/mpeg' };
// chemin demandé par la page -> fichier du dépôt (le moteur demande audio/x.mp3 et art/x.png, relatifs à la page)
function resolveFile(url) {
  const p = decodeURIComponent(url.split('?')[0]);
  if (p === '/' || p === '/index.html') return path.join(root, 'tools/game.html');
  if (p === '/engine.js') return path.join(app, 'game/engine.js');
  for (const dir of ['audio', 'art']) {
    if (p.startsWith('/' + dir + '/')) {
      const f = path.join(app, 'assets', dir, path.basename(p));
      return f;
    }
  }
  return null;
}

export function startGameServer(port = 0) {
  const server = createServer((req, res) => {
    const f = resolveFile(req.url);
    if (!f || !existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(readFileSync(f));
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok({ url: 'http://127.0.0.1:' + server.address().port + '/', close: () => server.close() })));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { url } = await startGameServer(Number(process.env.PORT) || 8080);
  console.log('Banc d\'essai du moteur : ' + url + '  (Ctrl+C pour arrêter)');
}
