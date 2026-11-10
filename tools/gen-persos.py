# Personnages et monstres : spritesheets Higgsfield (art/persos/<nom>.png, grille 2 x 6 sur fond magenta ou vert)
# -> images du jeu, incrustées dans le moteur (mobile-app/game/engine.js) entre // <persos> et // </persos>.
# Le héros n'est pas ici : c'est le héros modulaire (sprite HD découpé en calques, voir docs/direction-artistique.md).
# Usage : python3 tools/gen-persos.py   (Pillow + numpy). Écrit aussi art/persos-apercu.png.
# Ligne 1 : marche (6). Ligne 2 : repos (2), saut, préparation, coup, retour.
# Méthode codixel : quantifier à pleine taille, réduire par vote majoritaire, garder les yeux, nettoyer.
import base64, colorsys, io, os, re
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art', 'persos')
GAME = os.path.join(ROOT, 'mobile-app', 'game', 'engine.js')
PREVIEW = os.path.join(ROOT, 'art', 'persos-apercu.png')
COLS, ROWS = 6, 2
NO_GROUND = {'guerisseur', 'ogre'}  # planches générées sans ligne de sol (consigne explicite)

# nom du jeu : (fichier, hauteur en pixels de jeu du sol au sommet, couleurs, variantes)
# variantes : liste de (suffixe, rotation de teinte (de, vers, largeur)) ; 'eyes' teinte les yeux blancs
PERSOS = {
    'warrior':  ('guerrier', 34, 12, [('0', None), ('1', (220, 0, 45))]),
    'archer':   ('archer', 32, 12, [('0', None), ('1', (220, 0, 45))]),
    'miner':    ('mineur', 30, 12, [('0', 'eyes:#7fd8ff'), ('1', 'eyes:#ff6a5a')]),
    'healer':   ('guerisseur', 33, 12, [('0', None), ('1', (220, 0, 45))]),
    'champion': ('champion', 44, 14, [('1', None), ('0', (355, 218, 40))]),
    'zombie':   ('zombie', 31, 10, [('', None)]),
    'golem':    ('golem', 28, 10, [('0', None), ('1', None)]),
    'slime':    ('slime', 16, 8, [('', None), ('B', (275, 215, 45))]),
    'ogre':     ('ogre', 54, 14, [('', None)]),
}


def key_mask(im):
    """Masque du sujet : tout ce qui n'est pas proche de la couleur du fond (prise dans le coin)."""
    bg = np.median(im[:8, :8].reshape(-1, 3), 0)
    d = np.sqrt(((im - bg) ** 2).sum(2))
    return d > 110, bg


def components(mask):
    """Étiquettes 4-connexes (simple et suffisant pour une case)."""
    H, W = mask.shape
    lab = np.zeros((H, W), np.int32)
    n = 0
    sizes = [0]
    for y0 in range(H):
        row = mask[y0]
        for x0 in np.where(row & (lab[y0] == 0))[0]:
            if lab[y0, x0]:
                continue
            n += 1
            st = [(y0, x0)]
            lab[y0, x0] = n
            c = 0
            while st:
                y, x = st.pop()
                c += 1
                for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= yy < H and 0 <= xx < W and mask[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = n
                        st.append((yy, xx))
            sizes.append(c)
    return lab, np.array(sizes)


def cells(path, ground_line=True):
    im = np.asarray(Image.open(path).convert('RGB')).astype(np.float64)
    H, W = im.shape[:2]
    out = []
    for r in range(ROWS):
        for c in range(COLS):
            cell = im[r * H // ROWS:(r + 1) * H // ROWS, c * W // COLS:(c + 1) * W // COLS]
            m, bg = key_mask(cell)
            # ligne de sol : rangées presque pleines sur toute la largeur -> on coupe dessous
            full = m.mean(1) > .45
            ground = np.where(full)[0] if ground_line else []
            gy = None  # pas de ligne de sol : on prendra le bas commun de la rangée
            if len(ground):  # ligne de sol : rangées du bas aussi couvertes que la toute dernière (le corps l'est moins)
                cov = m.mean(1)
                gy = ground.max()
                c0 = cov[gy]
                while gy > 0 and cov[gy - 1] >= c0 - .06:
                    gy -= 1
            if gy is not None:
                m[gy:] = False
            # herbe et éclats : petits morceaux détachés du corps
            lab, sizes = components(m)
            big = sizes.max() if len(sizes) > 1 else 0
            keep = np.isin(lab, [i for i, s in enumerate(sizes) if i and s >= big * .04])
            out.append((cell, keep, gy))
    # cases sans ligne de sol : même ligne de base pour toute la rangée (le bas le plus bas)
    for r in range(ROWS):
        row = out[r * COLS:(r + 1) * COLS]
        base = max(np.where(k.any(1))[0].max() + 1 for _, k, _ in row if k.any())
        for i, (c, k, g) in enumerate(row):
            if g is None:
                out[r * COLS + i] = (c, k, base)
    return out


def kmeans(px, k, it=25, seed=1):
    rng = np.random.default_rng(seed)
    s = px[rng.choice(len(px), min(len(px), 40000), replace=False)]
    c = s[rng.choice(len(s), k, replace=False)].copy()
    for _ in range(it):
        lab = ((s[:, None] - c[None]) ** 2).sum(2).argmin(1)
        nc = np.array([s[lab == j].mean(0) if (lab == j).any() else c[j] for j in range(k)])
        if np.allclose(nc, c):
            break
        c = nc
    return c


def nearest(px, c):
    out = np.empty(len(px), np.int32)
    for i in range(0, len(px), 100000):
        out[i:i + 100000] = ((px[i:i + 100000, None] - c[None]) ** 2).sum(2).argmin(1)
    return out


def hue_rotate(rgb, frm, to, width):
    out = rgb.copy()
    for i, (r, g, b) in enumerate(rgb):
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        dh = ((h * 360 - frm + 540) % 360) - 180
        if abs(dh) <= width and s > .2:
            nh = ((to + dh) % 360) / 360
            out[i] = np.array(colorsys.hls_to_rgb(nh, l, s)) * 255
    return out


def emissive(rgb):
    """Couleurs qui brillent dans le noir : très claires, ou vives et claires (yeux, lampe, fantômes)."""
    out = []
    for r, g, b in rgb:
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        v = max(r, g, b) / 255
        lum = (r * .299 + g * .587 + b * .114)
        out.append(lum > 200 or (v > .72 and s > .45 and lum > 95))
    return np.array(out)


def build(key, f, height, ncol):
    cs = cells(os.path.join(SRC, f + '.png'), f not in NO_GROUND)
    allpx = np.concatenate([c[keep] for c, keep, _ in cs])
    pal = kmeans(allpx, ncol)
    # échelle commune : hauteur du personnage au repos (case 7 = repos)
    _, keep6, gy6 = cs[6]
    ys = np.where(keep6.any(1))[0]
    sc = height / (gy6 - ys.min())
    # point d'ancrage horizontal : centre du torse au repos
    band = keep6[int(gy6 - (gy6 - ys.min()) * .7):int(gy6 - (gy6 - ys.min()) * .3)]
    ax = np.where(band.any(0))[0].mean()
    frames = []
    for i, (cell, keep, gy) in enumerate(cs):
        # saut (et tout le slime) : posé sur ses propres pieds, le jeu gère déjà la hauteur du saut
        if (i == 8 or key == 'slime') and keep.any():
            gy = np.where(keep.any(1))[0].max() + 1
        lab = np.full(keep.shape, ncol, np.int32)
        lab[keep] = nearest(cell[keep], pal)
        frames.append((lab, gy))
    # cadre commun : on prend l'étendue de toutes les images autour de l'ancre
    ext = [0, 0, 0]  # gauche, droite, haut (en pixels source, relatifs à l'ancre et au sol)
    for lab, gy in frames:
        m = lab < ncol
        if not m.any():
            continue
        yy, xx = np.where(m)
        ext[0] = max(ext[0], ax - xx.min())
        ext[1] = max(ext[1], xx.max() - ax)
        ext[2] = max(ext[2], gy - yy.min())
    half = int(np.ceil(max(ext[0], ext[1]) * sc)) + 2
    FW, FH = half * 2, int(np.ceil(ext[2] * sc)) + 3
    step = 1 / sc
    out = []
    for lab, gy in frames:
        img = np.full((FH, FW), ncol, np.int32)
        k = 5
        for oy in range(FH):
            for ox in range(FW):
                # case source correspondant au pixel (ox, oy) ; le sol tombe sur la ligne FH-2
                sx0 = ax + (ox - half) * step
                sy0 = gy - (FH - 1 - oy) * step
                xs = np.clip((sx0 + (np.arange(k) + .5) / k * step).astype(int), 0, lab.shape[1] - 1)
                yv = (sy0 + (np.arange(k) + .5) / k * step).astype(int)
                if yv.min() >= lab.shape[0] or yv.max() < 0:
                    continue
                yv = np.clip(yv, 0, lab.shape[0] - 1)
                s = lab[yv[:, None], xs[None, :]].ravel()
                cnt = np.bincount(s, minlength=ncol + 1)
                # les détails très clairs (yeux) gagnent dès qu'ils couvrent un quart de la case
                bright = [j for j in range(ncol) if pal[j] @ [.299, .587, .114] > 170 and cnt[j] >= len(s) * .25]
                img[oy, ox] = bright[0] if bright else cnt.argmax()
        out.append(img)
    return pal, out, FW, FH


def strip(pal, frames, FW, FH, ncol, emi):
    n = len(frames)
    col = np.zeros((FH, FW * n, 4), np.uint8)
    em = np.zeros((FH, FW * n, 4), np.uint8)
    for i, fr in enumerate(frames):
        m = fr < ncol
        rgb = np.zeros((FH, FW, 3))
        rgb[m] = pal[fr[m]]
        # liseré de lumière froide sur le bord haut (et gauche) : la silhouette se détache du fond sombre
        pm = np.pad(m, 1)
        rim = m & (~pm[:-2, 1:-1] | ~pm[1:-1, :-2]) & ~np.isin(fr, np.where(emi)[0])
        rgb[rim] = rgb[rim] * .55 + np.array([170, 185, 235]) * .45
        col[:, i * FW:(i + 1) * FW, :3] = rgb.clip(0, 255)
        col[:, i * FW:(i + 1) * FW, 3] = m * 255
        e = m & np.isin(fr, np.where(emi)[0])
        em[:, i * FW:(i + 1) * FW, :3] = (rgb * e[..., None]).clip(0, 255)
        em[:, i * FW:(i + 1) * FW, 3] = e * 255
    return col, em


def b64(a):
    buf = io.BytesIO()
    Image.fromarray(a, 'RGBA').save(buf, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()


def main():
    parts, prev = [], []
    for key, (f, h, ncol, variants) in PERSOS.items():
        pal, frames, FW, FH = build(key, f, h, ncol)
        for suf, mod in variants:
            p = pal.copy()
            emi = emissive(p)
            if isinstance(mod, tuple):
                p = hue_rotate(p, *mod)
            elif isinstance(mod, str) and mod.startswith('eyes:'):
                t = np.array([int(mod[6 + i:8 + i], 16) for i in (0, 2, 4)])
                for j in range(len(p)):
                    if emi[j] and p[j] @ [.299, .587, .114] > 200:
                        p[j] = p[j] * .35 + t * .65
            col, em = strip(p, frames, FW, FH, ncol, emi)
            parts.append(f"{key}{suf}:{{w:{FW},h:{FH},img:'{b64(col)}',emi:'{b64(em)}'}}")
            prev.append(col)
        print(f'{key}: cadre {FW}x{FH}, {len(frames)} images')
    block = ('// <persos> généré par tools/gen-persos.py, ne pas modifier à la main\nconst PERSOS_HF={' +
             ',\n'.join(parts) + '};\n// </persos>')
    src = open(GAME, encoding='utf-8').read()
    pat = re.compile(r'// <persos>.*?// </persos>', re.S)
    if not pat.search(src):
        raise SystemExit('marqueurs // <persos> introuvables dans www/index.html')
    open(GAME, 'w', encoding='utf-8').write(pat.sub(lambda m: block, src))
    print(f'{len(block) // 1024} Ko incrustés')
    # aperçu x4 sur fond nuit
    W = max(p.shape[1] for p in prev)
    H = sum(p.shape[0] + 4 for p in prev)
    can = Image.new('RGBA', (W, H), (8, 8, 18, 255))
    y = 0
    for p in prev:
        can.alpha_composite(Image.fromarray(p, 'RGBA'), (0, y))
        y += p.shape[0] + 4
    can.resize((W * 4, H * 4), Image.NEAREST).save(PREVIEW)
    print('écrit', os.path.relpath(PREVIEW, ROOT))


main()
