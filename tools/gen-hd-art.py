"""Convertit les images Higgsfield de art/hd-sources/ en sprites pixel art pour le jeu.

Usage : python3 tools/gen-hd-art.py [dossier_sortie]   (défaut : mobile-app/assets/art)
        python3 tools/gen-hd-art.py --add nom:hauteur[:net] [nom:hauteur ...]
        (:net = réduction nette, couleur la plus fréquente par case : pour les sources GPT Image 2 en gros pixels)
        Ajoute des sprites à droite de mobile-app/assets/art/units-hd.png SANS régénérer le reste, puis affiche leurs rectangles
        à recopier dans UNIT_ART.r. À préférer pour toute nouvelle unité : voir la remarque sur les sources ci-dessous.
Besoin : Pillow et numpy.

Sorties :
- units-hd.png : atlas des personnages et monstres sur une ligne (rects affichés -> UNIT_ART.r dans le moteur (mobile-app/game/engine.js))
- trees-hd.png : 4 canopées (ronde petite/grande, saule petit/grand) (rects -> TREE_ART.r)
- tiles-hd.png : 64 px de large, une bande de 64x64 par matière (16 variantes 16x16), ordre HD_TILES.row
Les trois images sont aussi intégrées en base64 dans le moteur (mobile-app/game/engine.js) (bloc // <hd-art>).
Les sources sont sur fond vert ou magenta uni (détourage par couleur clé).
Les sources du dépôt sont réduites à 512 px : une régénération complète ne redonne PAS les PNG livrés
(tailles et pixels différents, vérifié le 2026-11-10). Pour ajouter une unité, utiliser --add, qui ne touche pas aux sprites existants.
"""
import base64
import json
import os
import re
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art', 'hd-sources')
OUT = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else os.path.join(ROOT, 'mobile-app', 'assets', 'art')


def keyed(n):
    a = np.asarray(Image.open(os.path.join(SRC, n + '.png')).convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    k = a[2, 2]
    green = k[1] > k[0]
    m = (g - np.maximum(r, b) > 55) if green else ((np.minimum(r, b) - g > 55) & (np.abs(r - b) < 90))
    al = np.where(m, 0, 255).astype(np.uint8)
    im = Image.fromarray(np.dstack([a.astype(np.uint8), al]), 'RGBA')
    o = im.crop(im.getbbox())
    o.spill = 'g' if green else 'm'
    return o


def shrink(im, h, colors=28):
    """Réduction en moyenne de boîte puis palette restreinte ; retire le liseré de couleur clé.
    La moyenne est pondérée par l'opacité : la couleur clé du fond ne se mélange pas aux pixels du bord."""
    w = max(1, round(im.width * h / im.height))
    a = np.asarray(im).astype(np.float32)
    al = a[..., 3]
    pm = Image.fromarray((a[..., :3] * (al[..., None] / 255)).astype(np.uint8), 'RGB').resize((w, h), Image.BOX)
    cov = np.asarray(Image.fromarray(al.astype(np.uint8)).resize((w, h), Image.BOX)).astype(np.float32) / 255
    rgb = Image.fromarray((np.asarray(pm) / np.maximum(cov[..., None], .02)).clip(0, 255).astype(np.uint8), 'RGB')
    aa = cov * 255 > 140
    c = np.asarray(rgb).astype(int)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    if im.spill == 'm':
        aa &= ~((np.minimum(r, b) - g > 45) & (np.abs(r - b) < 90))
    else:
        aa &= ~(g - np.maximum(r, b) > 45)
    q = rgb.quantize(colors, method=Image.Quantize.MEDIANCUT).convert('RGB')
    return Image.fromarray(np.dstack([np.asarray(q), np.where(aa, 255, 0).astype(np.uint8)]), 'RGBA')


def shrink_net(im, h, colors=24):
    """Réduction nette : chaque pixel prend la couleur la plus fréquente de sa case (palette restreinte), au lieu de la moyenne.
    Garde des aplats francs et un contour lisible ; à préférer pour une source déjà en gros pixels (GPT Image 2)."""
    w = max(1, round(im.width * h / im.height))
    al = np.asarray(im)[..., 3] > 128
    q = im.convert('RGB').quantize(colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    pal = np.array(q.getpalette()[:colors * 3]).reshape(-1, 3)
    idx = np.asarray(q)
    out = np.zeros((h, w, 4), np.uint8)
    for y in range(h):
        y0 = int(y * im.height / h)
        y1 = max(int((y + 1) * im.height / h), y0 + 1)
        for x in range(w):
            x0 = int(x * im.width / w)
            x1 = max(int((x + 1) * im.width / w), x0 + 1)
            m = al[y0:y1, x0:x1]
            if m.mean() < .5:
                continue
            out[y, x, :3] = pal[np.bincount(idx[y0:y1, x0:x1][m], minlength=colors).argmax()]
            out[y, x, 3] = 255
    return Image.fromarray(out, 'RGBA')


def atlas(ims, name):
    W = sum(i.width + 1 for i in ims.values())
    H = max(i.height for i in ims.values())
    at = Image.new('RGBA', (W, H))
    x, R = 0, {}
    for n, i in ims.items():
        at.paste(i, (x, 0))
        R[n] = [x, 0, i.width, i.height]
        x += i.width + 1
    at.save(os.path.join(OUT, name))
    print(name, json.dumps(R, separators=(',', ':')))


if '--add' in sys.argv:
    # ajout sans régénération : l'atlas existant est recopié tel quel, les nouveaux sprites sont collés à sa droite
    old = Image.open(os.path.join(OUT, 'units-hd.png')).convert('RGBA')
    new = {}
    for a in sys.argv[sys.argv.index('--add') + 1:]:
        n, h, *opt = a.split(':')
        new[n] = (shrink_net if 'net' in opt else shrink)(keyed(n), int(h))
    at = Image.new('RGBA', (old.width + sum(i.width + 1 for i in new.values()), max([old.height] + [i.height for i in new.values()])))
    at.paste(old, (0, 0))
    x, R = old.width + 1, {}
    for n, i in new.items():
        at.paste(i, (x, 0))
        R[n] = [x, 0, i.width, i.height]
        x += i.width + 1
    at.save(os.path.join(OUT, 'units-hd.png'))
    print('units-hd.png, rectangles à ajouter à UNIT_ART.r :', json.dumps(R, separators=(',', ':')))
    HTML = os.path.join(ROOT, 'mobile-app', 'game', 'engine.js')
    html = open(HTML, encoding='utf-8').read()
    b64 = base64.b64encode(open(os.path.join(OUT, 'units-hd.png'), 'rb').read()).decode()
    html, k = re.subn(r"const UNITS_HD='data:image/png;base64,[^']*';", "const UNITS_HD='data:image/png;base64," + b64 + "';", html)
    if k != 1:
        raise SystemExit('const UNITS_HD introuvable dans mobile-app/game/engine.js')
    open(HTML, 'w', encoding='utf-8').write(html)
    print('engine.js : UNITS_HD mis à jour')
    sys.exit(0)

UNITS = {'hero': 34, 'warrior0': 34, 'warrior1': 34, 'archer0': 34, 'archer1': 34, 'miner0': 34, 'miner1': 34,
         'champion0': 36, 'champion1': 36, 'zombie': 34, 'golem0': 40, 'golem1': 40, 'slime': 16, 'core0': 44, 'core1': 44}
sp = {n: shrink(keyed(n), h) for n, h in UNITS.items()}
s = np.asarray(sp['slime']).copy()
s[..., [0, 1, 2]] = s[..., [1, 0, 2]]  # slime rouge de l'ennemi
sp['slimeB'] = Image.fromarray(s, 'RGBA')
atlas(sp, 'units-hd.png')

t0, t1 = keyed('tree0'), keyed('tree1')
atlas({'round-s': shrink(t0, 72, 32), 'round-l': shrink(t0, 96, 32),
       'willow-s': shrink(t1, 84, 32), 'willow-l': shrink(t1, 104, 32)}, 'trees-hd.png')

# assombrissement par matière pour coller au terrain sombre du jeu
TILES = [('t_dirt', .95), ('t_stone', .6), ('t_deep', .62), ('t_brick', .8), ('t_castle', .78), ('t_plank', 1), ('t_bark', 1)]
ts = Image.new('RGB', (64, 64 * len(TILES)))
for j, (n, k) in enumerate(TILES):
    im = Image.open(os.path.join(SRC, n + '.png')).convert('RGB').resize((64, 64), Image.BOX)
    im = im.quantize(16, method=Image.Quantize.MEDIANCUT).convert('RGB')
    im = Image.fromarray((np.asarray(im).astype(float) * k).clip(0, 255).astype(np.uint8))
    ts.paste(im, (0, 64 * j))
ts.save(os.path.join(OUT, 'tiles-hd.png'))
print('tiles-hd.png', [n for n, _ in TILES])

# les trois images sont aussi intégrées en base64 dans le moteur (mobile-app/game/engine.js) : le jeu lit leurs pixels (getImageData),
# ce qu'un navigateur refuse pour une image chargée depuis file://
if OUT == os.path.join(ROOT, 'mobile-app', 'assets', 'art'):
    HTML = os.path.join(ROOT, 'mobile-app', 'game', 'engine.js')
    d = lambda n: 'data:image/png;base64,' + base64.b64encode(open(os.path.join(OUT, n), 'rb').read()).decode()
    html = open(HTML, encoding='utf-8').read()
    pat = re.compile(r'(// <hd-art>[^\n]*\n).*?(// </hd-art>)', re.S)
    if not pat.search(html):
        raise SystemExit('marqueurs // <hd-art> introuvables dans mobile-app/game/engine.js')
    body = f"const UNITS_HD='{d('units-hd.png')}';\nconst TILES_HD='{d('tiles-hd.png')}';\nconst TREES_HD='{d('trees-hd.png')}';\n"
    html = pat.sub(lambda m: m.group(1) + body + m.group(2), html)
    open(HTML, 'w', encoding='utf-8').write(html)
    print('engine.js : bloc // <hd-art> mis à jour')
