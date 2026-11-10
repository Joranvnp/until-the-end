# Calques de décor (parallaxe) : images Higgsfield -> pixel art à 4 tons, incrustées dans mobile-app/game/engine.js.
# Usage : python3 tools/gen-calques.py   (Pillow + numpy)
# Méthode (skills codixel / pixel-art-studio) : partir d'une vraie image, la pixeliser à la taille du jeu,
# réduire à 4 tons, nettoyer les pixels isolés. Les couleurs sont posées au rendu (jour, nuit, aube, lune de sang).
import base64, io, os, re
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art', 'calques')
GAME = os.path.join(ROOT, 'mobile-app', 'game', 'engine.js')
PREVIEW = os.path.join(ROOT, 'art', 'calques-apercu.png')

# nom du fichier source, hauteur du calque en pixels de jeu (du plus lointain au plus proche)
LAYERS = [('lointain', 96), ('pic', 140), ('ruines', 128), ('foret', 150)]
LEVELS = 4


def kmeans1d(v, k, it=30):
    c = np.quantile(v, (np.arange(k) + .5) / k)
    for _ in range(it):
        lab = np.abs(v[:, None] - c[None, :]).argmin(1)
        nc = np.array([v[lab == j].mean() if (lab == j).any() else c[j] for j in range(k)])
        if np.allclose(nc, c):
            break
        c = nc
    return np.sort(c)


def process(name, h_out):
    im = np.asarray(Image.open(os.path.join(SRC, name + '.png')).convert('RGBA')).astype(np.float32)
    op = im[..., 3] >= 128
    rows = np.where(op.mean(1) > .004)[0]
    im, op = im[rows[0]:], op[rows[0]:]
    lum = im[..., 0] * .299 + im[..., 1] * .587 + im[..., 2] * .114
    cent = kmeans1d(lum[op], LEVELS)
    lab = np.abs(lum[..., None] - cent[None, None, :]).argmin(2) + 1  # 1..4, 0 = vide
    lab[~op] = 0
    H, W = lab.shape
    w_out = round(W * h_out / H)
    # sous-échantillonnage par vote majoritaire (5x5 points par pixel de sortie) : bords nets, pas de bouillie
    ys = (np.arange(h_out)[:, None] + (np.arange(5)[None, :] + .5) / 5) * H / h_out
    xs = (np.arange(w_out)[:, None] + (np.arange(5)[None, :] + .5) / 5) * W / w_out
    ys, xs = np.clip(ys.astype(int), 0, H - 1), np.clip(xs.astype(int), 0, W - 1)
    samp = lab[ys[:, None, :, None], xs[None, :, None, :]].reshape(h_out, w_out, 25)
    counts = np.stack([(samp == j).sum(2) for j in range(LEVELS + 1)], 2)
    out = counts.argmax(2)
    # pixels isolés : remplacés par la valeur de leurs voisins quand ceux-ci sont d'accord
    for _ in range(2):
        p = np.pad(out, 1, mode='edge')
        n = np.stack([p[:-2, 1:-1], p[2:, 1:-1], p[1:-1, :-2], p[1:-1, 2:]])
        same = (n == n[0]).all(0) & (n[0] != out)
        out = np.where(same, n[0], out)
    # bas du calque toujours plein (le rendu prolonge la couleur la plus sombre dessous)
    out[-2:][out[-2:] == 0] = 1
    # raccord sans couture : le calque suivi de son miroir
    tile = np.concatenate([out, out[:, ::-1]], 1).astype(np.uint8)
    img = Image.fromarray(tile, 'P')
    pal = [0, 0, 0] + sum(([v, v, v] for v in (60, 120, 180, 240)), [])
    img.putpalette(pal + [0] * (768 - len(pal)))
    img.info['transparency'] = 0
    buf = io.BytesIO()
    img.save(buf, 'PNG', optimize=True, transparency=0)
    return tile, base64.b64encode(buf.getvalue()).decode()


def main():
    data, tiles = [], []
    for name, h in LAYERS:
        tile, b64 = process(name, h)
        tiles.append(tile)
        data.append(f"'data:image/png;base64,{b64}'")
        print(f'{name}: {tile.shape[1]}x{tile.shape[0]}, {len(b64) * 3 // 4 // 1024} Ko')
    block = '// <calques> généré par tools/gen-calques.py, ne pas modifier à la main\nconst CALQUES=[' + ',\n'.join(data) + '];\n// </calques>'
    src = open(GAME, encoding='utf-8').read()
    pat = re.compile(r'// <calques>.*?// </calques>', re.S)
    if not pat.search(src):
        raise SystemExit('marqueurs // <calques> introuvables dans mobile-app/game/engine.js')
    open(GAME, 'w', encoding='utf-8').write(pat.sub(lambda m: block, src))
    # aperçu : calques empilés avec une teinte de crépuscule, agrandis x2
    ramps = [[(70, 80, 130), (95, 105, 160), (125, 135, 185), (165, 170, 210)],
             [(45, 55, 100), (65, 75, 125), (90, 100, 150), (130, 140, 185)],
             [(25, 40, 60), (38, 58, 78), (55, 80, 98), (85, 110, 125)],
             [(10, 20, 26), (18, 32, 38), (28, 48, 52), (48, 72, 70)]]
    W, GROUND, FOOT = 960, 190, [-14, 10, 44, 96]  # mêmes pieds que CQ_FOOT dans le jeu
    can = Image.new('RGB', (W, 260), (210, 120, 140))
    for i, t in enumerate(tiles):
        rgba = np.zeros(t.shape + (4,), np.uint8)
        for j in range(1, LEVELS + 1):
            rgba[t == j] = ramps[i][j - 1] + (255,)
        lay = Image.fromarray(rgba, 'RGBA')
        for x in range(-(i * 137) % lay.width - lay.width, W, lay.width):
            can.paste(lay, (x, GROUND + FOOT[i] - lay.height), lay)
    can.paste((40, 28, 30), (0, GROUND, W, 260))
    can.resize((W * 2, 520), Image.NEAREST).save(PREVIEW)
    print('écrit', os.path.relpath(PREVIEW, ROOT))


main()
