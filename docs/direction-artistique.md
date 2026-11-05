# Direction artistique et assets générés (Higgsfield)

Guide pour améliorer les visuels (menus, camp, logo, store, illustrations) avec Higgsfield **sans quitter le style du jeu**.

## Quand ce guide s'applique

- Créer ou remplacer une illustration : fond de menu, camp, réglages, offre, écran de chargement.
- Refaire le logo, des panneaux d'interface, l'icône ou les visuels des stores.
- Produire des planches de concept (héros, unités, ennemis, champion rouge) ou des sprites animés.

## Notre style (référence)

- **Pixel art 2D, vue de côté**, façon Terraria pour la lecture, ambiance **Animal Well** : lumière colorée, brume, grottes vivantes, nuit profonde.
- Tuiles 16×16, contour encre `#06060f`, palettes courtes (3 à 5 teintes par matière). Tout le jeu est dessiné par code dans `www/index.html` (section `GÉNÉRATION DES TEXTURES PIXEL ART`).
- Polices de l'app : **Pixelify Sans** (texte) et **Press Start 2P** (titres).
- Camp allié = **bleu**, ennemi = **rouge**. Le héros contraste en jaune chaud.

### Palette

| Rôle | Couleurs |
| --- | --- |
| Nuit / fond | `#05050c`, `#0B0A16`, `#0d0f2a`, `#1d2a6a` |
| Surfaces UI | `#15132A` (carte), `#1D1B33` (atténué), `#2A2745` (bordure) |
| Texte | `#E4E9FF`, secondaire `#A0A4BE` |
| Accent / héros | `#FFE066`, `#FFD27A` |
| Allié | `#4F9DF5` |
| Ennemi / danger | `#E5534B`, logo « END » `#FFB0A6` |
| Pierre | `#1e2a6e`, `#3d5bd9`, `#5a7cff` |
| Herbe / grotte vivante | `#18515c`, `#35cbb1`, `#85ffe1` |
| Profondeurs | `#211942`, `#493489`, `#7960ce` |
| Cristal / minerais | `#ee63ed`, `#38ebff`, `#ffcf47`, `#ff874c` |
| Étoiles | `#9bb8d6`, `#ffe9b0` |

Les couleurs de l'app restent définies **uniquement** dans `mobile-app/lib/theme.ts`. Une image générée ne remplace jamais un token de thème.

## Higgsfield : ce qu'on utilise, ce qu'on n'utilise pas

- **Mode « game » (website-builder-flow, `type: "game"`) : non.** Il construit un jeu web hébergé (salons multijoueur sur un Worker Cloudflare). Ça ne s'intègre pas à notre app Expo native ni au moteur `www/index.html`.
- **Oui** : ses guides d'assets de jeu et les outils d'image et de vidéo.

| Besoin | Outil Higgsfield | Modèle |
| --- | --- | --- |
| Fonds (menu, camp, chargement) | `generate_image` | `nano_banana_2`, 1k, 16:9 |
| Sprites, tuiles | `generate_image` | `nano_banana_2`, 1k, 1:1 |
| Logo, panneaux UI, boutons | `generate_image` | `gpt_image_2_6`, qualité high, 1k |
| Planche personnage (concept) | workflow `character-sheet` (preset game-concept) | - |
| Sprite animé | pose clé `flux_2` puis vidéo `seedance_1_5` (voir plus bas) | - |
| Détourage | `remove_background` (sinon couleur clé) | - |
| Agrandir / élargir un fond | `upscale_image`, `outpaint_image` | - |

## STYLE FORMULA (figée)

Coller **mot pour mot** dans chaque prompt, sans la modifier. Si on la change, on régénère tout le lot.

```text
Crisp 2D pixel art, side-view, limited palette, chunky readable silhouettes with 1px near-black ink outlines (#06060f), no anti-aliasing, no gradients inside sprites. Environment in deep night blues and violets (#0d0f2a, #1e2a6e, #3d5bd9, #493489) with teal bioluminescent accents (#35cbb1, #85ffe1); hero and allies in warm gold (#ffe066) and blue (#4f9df5); enemies and danger in signal red (#e5534b). Moody colored light, soft mist, glowing crystals, living caves, atmospheric depth like Animal Well. Clear focal point, high readability at small size.
```

STYLE TOKEN (version courte, 120 caractères max, pour les retouches) :

```text
crisp side-view pixel art, night blue/violet, teal glow, gold hero, red enemies, ink outlines, misty colored light
```

## Modèles de prompt par type

Ordre : **gabarit du type + description + STYLE FORMULA + suffixe du type**.

- **background** : `Game background illustration, wide 16:9: <description>. <FORMULA> No characters, no UI, no text, muted detail in the center so menus stay readable.`
- **sprite** : `Single game sprite, centered, full body, side view: <description>. <FORMULA> Isolated on a flat solid #FF00FF background, no shadow on the ground, no text.`
- **tile** : `Seamless tileable 16x16-style game tile: <description>. <FORMULA> Tiles seamlessly on all edges, flat front view.`
- **ui** : `Game UI element: <description>. <FORMULA> Pixel frame, flat front view, isolated on solid #FF00FF background, no text unless asked.`

Couleur clé (transparence) : `#FF00FF` par défaut ; `#00FF00` si l'asset contient du rose ou du violet (cristaux !) ; `#0000FF` si les deux sont pris. Penser aussi à vider les zones fermées de couleur clé à l'intérieur de l'asset.

## Pipeline

1. **Chiffrer d'abord** : appeler l'outil avec `get_cost: true`, annoncer le coût à l'auteur et **attendre son accord** avant toute génération payante. Ne jamais activer `use_unlim` sans demande explicite.
2. Générer. **2 régénérations maximum** par asset ; au-delà, retoucher le prompt ou abandonner.
3. Mettre au propre :
   - réduire en **plus proche voisin uniquement** (`ffmpeg -vf scale=W:H:flags=neighbor` ; pas de `sips` ni de redimensionnement lissé, qui floutent le pixel art) ;
   - fonds : 960×540 (même ratio que `menu.png`) ;
   - sprites : 32, 48 ou 64 px de haut.
4. **Planche contact** : tous les assets côte à côte à l'échelle relative, comparée à une capture du jeu. On valide seulement si tout se tient.
5. Ranger :
   - jeu web : `www/art/` (ex. `www/art/menu.png`) ;
   - app : `mobile-app/assets/art/` (même nom de fichier) ;
   - visuels de store : régénérer avec `npm run art` puis `npm run assets` (`tools/gen-art.mjs`).
6. Brancher :
   - fonds de menu : `mobile-app/components/game/menu-backdrop.tsx` (garder le ratio 960/540 ou mettre à jour `ART_RATIO`) ;
   - si le moteur du jeu change : `cd mobile-app && npm run sync-game` (ne jamais modifier `game/engine.generated.js` à la main).

### Sprites animés (si besoin)

Pose clé avec `flux_2`, puis vidéo `seedance_1_5` de 4 s en 720p, ratio explicite (même image de début et de fin pour une boucle). Toujours ajouter le bloc négatif : caméra fixe, pas d'inertie des accessoires, regard toujours du même côté. Ensuite :

1. Extraire toutes les images avec ffmpeg.
2. Garder 8 à 16 images réparties régulièrement, en gardant la première et la dernière.
3. Détourer chaque image.
4. Assembler une planche : boîte englobante commune, ancrage en bas au centre, dernière image retirée pour une boucle, grille de 4096 px maximum.
5. Réduire en plus proche voisin.
6. Nommer `{asset}_{action}_f{n}_{WxH}_g{cxr}_fps{n}_{loop|once}.png`.

Viser 8 à 12 fps et des mouvements discrets. Le moteur dessine ses sprites par code : un sprite animé généré demande un chargement d'image dans `www/index.html`, à prévoir comme un vrai chantier.

## Priorités

1. Fonds de menu dédiés : camp (feu de camp devant la montagne, nuit), réglages et offre (variantes plus sombres et calmes), en remplacement ou en complément de `menu.png`.
2. Illustrations de l'écran de chargement (`components/ui/loading.tsx`), une par astuce ou par biome.
3. Visuels de store : bannière Play Store et fond des captures, toujours générés par `tools/gen-art.mjs`.
4. Planches de concept du héros, des unités et du champion rouge, pour guider le pixel art codé.
5. Logo et cadres de panneaux, seulement si le rendu bat `GameLogo` et `GamePanel`.

## Vérification

- Planche contact validée avant d'intégrer quoi que ce soit.
- Captures en paysage (simulateur, skill `/ns-ios-verification`) du camp, des réglages et de l'offre : texte lisible par-dessus le fond, pas de bavure ni d'anti-crénelage.
- `cd mobile-app && npx tsc --noEmit && npm run lint` si du code a changé.
- Noter le coût en crédits dans le message de commit ou la PR.
