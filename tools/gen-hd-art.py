"""Convertit les images Higgsfield de art/hd-sources/ en sprites pixel art pour le jeu.

Usage : python3 tools/gen-hd-art.py [dossier_sortie]   (défaut : www/art)
        python3 tools/gen-hd-art.py --add nom:hauteur [nom:hauteur ...]
        Ajoute des sprites à droite de www/art/units-hd.png SANS régénérer le reste, puis affiche leurs rectangles
        à recopier dans UNIT_ART.r. À préférer pour toute nouvelle unité : voir la remarque sur les sources ci-dessous.
Besoin : Pillow et numpy.

Sorties :
- units-hd.png : atlas des personnages et monstres sur une ligne (rects affichés -> UNIT_ART.r dans index.html)
- trees-hd.png : 4 canopées (ronde petite/grande, saule petit/grand) (rects -> TREE_ART.r)
- tiles-hd.png : 64 px de large, une bande de 64x64 par matière (16 variantes 16x16), ordre HD_TILES.row
Les trois images sont aussi intégrées en base64 dans index.html (bloc // <hd-art>).
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
OUT = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else os.path.join(ROOT, 'www', 'art')


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
    """Réduction en moyenne de boîte puis palette restreinte ; retire le liseré de couleur clé."""
    w = max(1, round(im.width * h / im.height))
    al = np.asarray(im)[..., 3]
    rgb = im.convert('RGB').resize((w, h), Image.BOX)
    aa = np.asarray(Image.fromarray(al).resize((w, h), Image.BOX)) > 140
    c = np.asarray(rgb).astype(int)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    if im.spill == 'm':
        aa &= ~((np.minimum(r, b) - g > 45) & (np.abs(r - b) < 90))
    else:
        aa &= ~(g - np.maximum(r, b) > 45)
    q = rgb.quantize(colors, method=Image.Quantize.MEDIANCUT).convert('RGB')
    return Image.fromarray(np.dstack([np.asarray(q), np.where(aa, 255, 0).astype(np.uint8)]), 'RGBA')


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
        n, h = a.split(':')
        new[n] = shrink(keyed(n), int(h))
    at = Image.new('RGBA', (old.width + sum(i.width + 1 for i in new.values()), max([old.height] + [i.height for i in new.values()])))
    at.paste(old, (0, 0))
    x, R = old.width + 1, {}
    for n, i in new.items():
        at.paste(i, (x, 0))
        R[n] = [x, 0, i.width, i.height]
        x += i.width + 1
    at.save(os.path.join(OUT, 'units-hd.png'))
    print('units-hd.png, rectangles à ajouter à UNIT_ART.r :', json.dumps(R, separators=(',', ':')))
    HTML = os.path.join(ROOT, 'www', 'index.html')
    html = open(HTML, encoding='utf-8').read()
    b64 = base64.b64encode(open(os.path.join(OUT, 'units-hd.png'), 'rb').read()).decode()
    html, k = re.subn(r"const UNITS_HD='data:image/png;base64,[^']*';", "const UNITS_HD='data:image/png;base64," + b64 + "';", html)
    if k != 1:
        raise SystemExit('const UNITS_HD introuvable dans www/index.html')
    open(HTML, 'w', encoding='utf-8').write(html)
    print('index.html : UNITS_HD mis à jour')
    sys.exit(0)

UNITS = {'hero': 34, 'warrior0': 34, 'warrior1': 34, 'archer0': 34, 'archer1': 34, 'miner0': 34, 'miner1': 34,
         'champion0': 36, 'champion1': 36, 'zombie': 34, 'golem0': 40, 'golem1': 40, 'slime': 16, 'core0': 38, 'core1': 38}
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

# les trois images sont aussi intégrées en base64 dans index.html : le jeu lit leurs pixels (getImageData),
# ce qu'un navigateur refuse pour une image chargée depuis file://
if OUT == os.path.join(ROOT, 'www', 'art'):
    HTML = os.path.join(ROOT, 'www', 'index.html')
    d = lambda n: 'data:image/png;base64,' + base64.b64encode(open(os.path.join(OUT, n), 'rb').read()).decode()
    html = open(HTML, encoding='utf-8').read()
    pat = re.compile(r'(// <hd-art>[^\n]*\n).*?(// </hd-art>)', re.S)
    if not pat.search(html):
        raise SystemExit('marqueurs // <hd-art> introuvables dans www/index.html')
    body = f"const UNITS_HD='{d('units-hd.png')}';\nconst TILES_HD='{d('tiles-hd.png')}';\nconst TREES_HD='{d('trees-hd.png')}';\n"
    html = pat.sub(lambda m: m.group(1) + body + m.group(2), html)
    open(HTML, 'w', encoding='utf-8').write(html)
    print('index.html : bloc // <hd-art> mis à jour')
