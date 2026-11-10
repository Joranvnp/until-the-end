# Direction artistique et assets générés (Higgsfield)

Guide pour améliorer les visuels (menus, camp, logo, store, illustrations) avec Higgsfield **sans quitter le style du jeu**.

## Quand ce guide s'applique

- Créer ou remplacer une illustration : fond de menu, camp, réglages, offre, écran de chargement.
- Refaire le logo, des panneaux d'interface, l'icône ou les visuels des stores.
- Produire des planches de concept (héros, unités, ennemis, champion rouge) ou des sprites animés.

## Notre style (référence)

- **Pixel art 2D, vue de côté**, façon Terraria pour la lecture, ambiance **Animal Well** : lumière colorée, brume, grottes vivantes, nuit profonde.
- Tuiles 16×16, contour encre `#06060f`, palettes courtes (3 à 5 teintes par matière). Tout le jeu est dessiné par code dans `mobile-app/game/engine.js` (section `GÉNÉRATION DES TEXTURES PIXEL ART`).
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

## Bible graphique du jeu (ce qu'on veut, partout)

Référence d'ambiance : **Animal Well**, avec des briques bleu nuit, des plantes et des lianes turquoise qui luisent, des orbes bleus, des halos doux et un léger grain CRT. On garde la lisibilité de Terraria : silhouettes nettes, une tuile = 16×16.

### Règles de base

- **Nuit d'abord** : le monde est sombre (bleus et violets). La couleur vient de la **lumière**, pas des surfaces. Une surface claire en plein jour reste désaturée.
- **Contour encre** `#06060f` (`INK`) de 1 px autour de chaque objet détaché du décor : coffre, lanterne, plantes, champignons, cœur, unités. Les tuiles de terrain n'en ont pas.
- **Selout** (`selout`) : le contour devient plus clair du côté éclairé (en haut à gauche) et reste encre de l'autre. Ça donne du volume sans dégradé.
- **Lumière en haut à gauche** (`LIGHT`) : arête claire de 1 à 2 px à gauche et en haut, ombre sur le tiers droit et le bas.
- **Rampes de 5 tons** (`hueRamp(base)`) : de l'ombre `[0]` à la lumière `[4]`. Les ombres glissent vers le bleu-violet et les lumières vers le jaune. C'est ce qui évite le gris plat. Une matière utilise 3 à 5 tons, jamais de dégradé lisse.
- **Pas d'anticrénelage** : pixels pleins, réduction au plus proche voisin. Seule exception, les sprites HD réduits en moyenne de boîte puis requantifiés (voir plus bas).

### Ce qui brille, et comment

Trois outils, à doser dans cet ordre :

1. **Pixels émissifs** (`mkE` puis `c.emi`) : un 2e calque du sprite, dessiné **après** l'éclairage en mode additif (`emit` puis `drawEmissive`). Il reste vif même dans le noir. On n'y met que quelques pixels : un cœur, des yeux, des runes, une flamme.
2. **Halos** (`halo(g,x,y,couleur,rayon,alpha)`) : une tache radiale douce posée par `drawGlows`, parfois pulsée par un `sin(time)`.
3. **Éclairage du monde** : propagation colorée (BFS) depuis les sources `light` des tuiles, qui teinte les blocs voisins.

| Élément | Couleur de lumière | Comment |
| --- | --- | --- |
| Lanterne (TORCH) | `#ffbc62` + cœur `#ff7a3a` | halo 58 px vacillant, flamme animée sur 4 images, pixel blanc-jaune au centre |
| Fenêtres du château | `#ffbd62` | vitres `#7a3f1c` → `#ffb653` → `#fff0b8`, halo 18 px |
| Porte du château | `#ffb653`, `#fff0b8` | lueur chaude au fond de la voûte, derrière la herse |
| Noyau de base | couleur d'équipe | cœur et runes émissifs, éclats en orbite, halo pulsé 38 px |
| Coffre | `#ffcf47` | halo pulsé et éclat blanc en étoile de temps en temps |
| Champignons | `#5fffd6` | halo 34 px, chapeaux turquoise ou rose |
| Fougères, herbe, plantes | `#38e5c8` (parfois `#ff6fae`) | halo faible 16 à 22 px, la grotte « respire » |
| Minerais et cristaux | couleur du minerai | halo seulement s'ils touchent le vide, cristaux 44 px pulsés |
| Gouttes de lianes | `#5fffe0` | petit halo de 8 px |
| Yeux des monstres et des unités | couleur de l'équipe ou du monstre | pixels émissifs |
| Lune de sang | `#ff3a3a` | halo de lune rouge |

Règle : **une source de lumière par zone visuelle**. Le chaud (or, orange) est réservé au feu, aux trésors et aux fenêtres ; le froid (turquoise, bleu) au vivant et à la magie ; le rouge au danger et à l'ennemi.

### Personnages et monstres

- **Cadre 24×32** (`humanoid`) : corps arrondi (`roundBody`), rampe `hueRamp` par matière (peau, tenue, métal), `selout`, yeux et éléments magiques dans `c.emi`.
- **Sprites HD** (Higgsfield, environ 34 px, golem 40, slime 16) dans `mobile-app/assets/art/units-hd.png`, avec repli procédural. Recolorés par code pour l'équipe bleue ou rouge (le héros est à part, voir « Héros modulaire »).
- **Héros** : capuche **jaune or** (`#ffe066`), visage dans l'ombre, il doit ressortir sur tous les fonds. Alliés **bleus** (`#4f9df5`), ennemis **rouges** (`#e5534b`).
- Monstres : silhouettes simples et lisibles, deux ou trois tons par matière, yeux brillants. Animations courtes (4 images), mouvements discrets.

### Héros modulaire (`// HÉROS MODULAIRE` dans `mobile-app/game/engine.js`, fait le 2026-11-09)

Le héros **est le sprite HD Higgsfield** (`hero` dans `units-hd.png`, capuche or, visage noir, yeux en croix), **découpé en calques par code** pour l'animer et préparer une **boutique de personnalisation**. Le héros entièrement procédural (`heroFrame`, `heroDollProc`) reste en repli si l'image HD manque.

- **Découpe** (`heroHDParts`) : tête (capuche, jusqu'à y 12), corps, jambe arrière et jambe avant (bas du sprite, x < 12 / x ≥ 12), bas de cape (bord gauche), épée (bas droite), plus les pixels lumineux des yeux. Chaque calque est une petite image avec une marge de 4 px.
- **Cadre 48×38** (sprite posé en 12,3), tourné vers la droite, miroir par `flipE`. Ordre des calques : cape procédurale (si `cape` courte ou longue), jambe arrière, jambe avant, bas de cape, corps (+ ceinture d'étoffe), tête, coiffe, yeux, écharpe, épée.
- **Recoloration** (`heroTint`, garde la luminosité de chaque pixel) : les teintes or de la capuche (18–52°) prennent `headCol`, les bleus de la tunique (205–255°) prennent `tunic`. `HERO_BASE` vaut `#daa84a` / `#2f3a5b` : sans tenue, on retrouve le sprite d'origine.
- **Emplacements** (`HERO_PARTS`, défauts dans `HERO_BASE`) :
  - `head` : `hood` (sprite tel quel), `pointed` (pointe de capuche), `horns` (cornes), `helm` (heaume posé sur la capuche), `hat` (chapeau) ; couleur `headCol` ;
  - `cape` : `none`, `short`, `long`, `scarf` (écharpe qui flotte) ; couleur `capeCol` ;
  - `acc` : `sash` (ceinture d'étoffe), `belt`, `none` ; couleur `accCol` ;
  - `tunic`, `eyes` (couleur des yeux, émissifs : ils brillent dans le noir).
- **Tenues** : chaque entrée de `OUTFITS` a un `look`. `heroLookOf(id, extra)` fusionne `HERO_BASE`, `look` et `extra`. Future boutique : `PROF.look` surcharge la tenue portée (`PROF.look={head:'horns',eyes:'#7ff0ff'}` puis `SPR.player=heroSet(PROF.outfit)`).
- **Animations** (`heroHDFrame`, assemblées par `heroHDDoll`) : `idle` (4 images, respiration), `blink`, `walk` (8 images, jambes alternées, rebond, cape), `jump`, `fall`, `wind` / `atk` / `atk2` (l'épée du sprite pivote autour de la main), `mine` (2 images), `hurt`, `death` (4 images, la dernière couchée au sol par `heroRotHD`).
- **Objet en main** : `heroHDDoll` rend deux jeux de poses, armé (épée du sprite) et `U` sans épée. `heroPick(set, p, armed)` prend le jeu armé seulement quand l'épée est sélectionnée (ou la main vide). Pioche, hache, torche ou bloc : pose sans épée et icône de l'objet dessinée dans la main (`drawHeld`, main en x+4,5 du centre, outils inclinés, objets réduits à 11 px).
- **Ajouter une pièce** : une clé dans `HERO_PARTS`, son dessin dans `heroHDFrame` (calque superposé, contour encre, même rampe), puis vérifier la planche de toutes les poses dans les deux sens. Pour des poses vraiment dessinées à la main, on pourra générer avec Higgsfield une planche d'animation du même personnage (coût à valider avant).

### Noyau de base (`coreSprite`)

Cristal taillé qui flotte au-dessus d'un socle de pierre, 26×38, 4 images.
- Socle à deux niveaux en pierre bleu nuit (`#0b0d24` → `#6d7cc0`), 3 runes de la couleur d'équipe qui s'allument à tour de rôle (émissif).
- Deux griffes courbes qui tiennent le cristal.
- Cristal à facettes dans la rampe d'équipe : moitié haute claire, moitié basse sombre, arête centrale, ceinture lumineuse, reflet blanc en haut à gauche.
- Cœur blanc qui pulse (émissif), le cristal monte et descend de 1 px, deux éclats tournent autour.

### Château de base (`castleSprite`)

176×150, maçonnerie faite avec les tuiles CASTLE.
- Donjon central avec **rosace** chaude, deux **tours** à toit pointu en ardoises de la **couleur d'équipe**, avec épi doré et fanion.
- Rempart crénelé, mâchicoulis sous les toits, contreforts au pied des tours, socle de fondation.
- **Porte voûtée** à claveaux, herse et lueur chaude au fond. Deux **bannières** d'équipe à queue d'aronde, frappées du noyau.
- Fenêtres en arc à meneaux, vitres chaudes (voir le tableau). **Mousse et lierre turquoise** qui pendent des créneaux.
- Volumes : arête claire à gauche, ombre sur le tiers droit.

### Tuiles et décor

- **Terrain** : tuiles HD (`tiles-hd.png`, 16 variantes 16×16 par matière), assombries pour rester dans la nuit. Pierre bleue `#1e2a6e`/`#3d5bd9`, profondeurs violettes `#211942`/`#493489`, briques et château bleu nuit.
- **Lanterne** : anneau, chapeau, cadre de verre avec arête claire à gauche, flamme en dégradé du blanc-jaune au cœur vers l'orange, contour encre.
- **Coffre** : couvercle bombé, planches veinées bleu nuit, sangles et coins dorés, bande dorée, serrure claire avec trou noir, contour encre. Le couvercle (lignes 4 à 9) et la caisse (lignes 9 à 15) sont découpés par `SPR.chestOpen` : garder ces lignes.
- **Végétation vivante** : herbe, fougères (CPLANT), lianes (VINE) et champignons (MUSH) en turquoise `#18515c` → `#35cbb1` → `#85ffe1`, avec des touches roses `#ff6fae` et `#e9b4ff`.
- **Arbres** : canopées HD (`trees-hd.png`), troncs en tuiles LOG (écorce bleu nuit, lichen turquoise).
- **Décor de fond** : calques en parallaxe (`art/calques/`, skill `calques-decor`), 4 tons, coloriés selon le ciel.

### Atmosphère

Brume en couches, poussières qui flottent, ciel de nuit étoilé (`#9bb8d6`, `#ffe9b0`), lune bleutée `#9fc0ff`, soleil `#ffd27a`. Sous terre, les halos turquoise et les cristaux remplacent le ciel.

### HUD en jeu (`drawHUD`, `drawTouch`, fait le 2026-11-09)

Tout est dessiné par code, sans image. Les utilitaires sont dans le bloc `// ==== HUD : utilitaires propres` de `mobile-app/game/engine.js`, juste après `heart`. Ils sont propres au HUD : les menus gardent `button`, `box`, `plate` et `coreBar`.
- **Cadres** : `hudFrame` fait une plaque sombre (`#0b0c1ae0`), un contour encre `INK`, une arête claire en haut et un trait d'accent en bas, coloré selon le rôle. `hudSlot` sert aux cases d'objet et `hudBtn` aux boutons (même contrat que `button`, pousse dans `uiHits`).
- **Icônes pixel** : `hudPix(masque,x,y,couleurs)` détoure chaque masque avec un contour encre. Elle dessine le cœur (`HUD_HEART`), le soleil et la lune (`hudSky`), ainsi que les cristaux des cœurs de base (`hudCrystal`).
- **Barres** : `hudBar` fait 7 px de haut, avec des repères aux quarts. Elle clignote sous 25 %.
- **Ce qui brille** : les halos ne servent qu'aux éléments vivants. Il y en a pour la vie basse (battement rouge `#ff3050`), la vague rouge, l'objectif (or pulsé) et la ressource gagnée (halo or).
- **Animations** :
  - les minerais (indice ≥ 3 de `RES`) scintillent avec `hudGlint` ;
  - chaque gain affiche un « +n » doré qui monte de 4 px et s'efface en 0,9 s ;
  - les gains rapprochés s'additionnent dans `resGain`.
- **Contrôles tactiles** :
  - pierres sombres `#141a36c8` à contour encre, avec une ombre portée ;
  - à l'appui : enfoncement d'1 px et halo `COL.ok` ;
  - le bouton d'action a un anneau turquoise ;
  - les flèches sont tracées en deux passes : contour encre, puis remplissage.
- **Boutons-icônes (tactile)** : `hudIconBtn(x,y,taille,picto,fn,actif)` fait un bouton carré en pierre `hudFrame`, avec un picto `HUD_I` (`menu`, `base`, `forge`, `bag`, `attack`, `defend`, `follow`) centré. Actif : picto or, contour or clignotant et halo. Il s'enfonce au toucher. Le bureau garde les boutons texte avec raccourcis (B, C, E, R).
- **Disposition tactile** (`touchMetrics` donne la taille des pavés et la marge `m` des coins) :
  - paysage : les 5 boutons-icônes en rangée sous la minicarte, la barre d'objets seule en bas au centre, les pavés calés dans les coins bas ;
  - portrait : les boutons-icônes en colonne au bord droit sous le HUD du haut, la barre d'objets tout en bas, les pavés juste au-dessus, puis le nom de l'objet et l'objectif au-dessus des pavés. Le milieu de l'écran reste libre.
  - `HL.touchY` dit où poser les pavés ; `drawObjPointer` reste entre le bas des boutons-icônes et le haut des pavés.
- **Lisibilité** : vérifier à 390x844, 844x390, 1024x768 et 1366x768. En mode étroit, aucun « +n » ni halo ne doit recouvrir le texte voisin.

### Menus (`// ==== MENUS PIXEL ART` dans `mobile-app/game/engine.js`, fait le 2026-11-09)

Écran titre, pause, panneaux du menu (réglages, quêtes, reliques, boutique, succès) et écran de fin partagent les primitives de `PixelFrame` (`mobile-app/components/game/pixel-frame.tsx`) pour que web et mobile se ressemblent :
- `MTONE` : tons `hero` (or, action principale), `panel` (neutre), `ally` (bleu, choix actif), `danger` (rouge, irréversible), `window` (fond de fenêtre), `off` (désactivé). Mêmes valeurs que `lib/theme.ts`.
- `mframe(x,y,w,h,ton,enfoncé,survol)` : ombre encre dure de 2 px, contour encre `#06060f` à coins coupés, biseau clair en haut à gauche, sombre en bas à droite ; enfoncé = décalé de 1-2 px vers le bas.
- `mbox` (fenêtre avec rivets dorés), `mbutton` (bouton ; un seul `hero` par écran, reflet `mshine` toutes les ~3 s), `mhead` (cartouche de titre encré avec losanges), `mveil` (voile sombre en bandes, jamais de dégradé lisse).
- Rangées et tuiles (reliques, bonus, stats de fin) : `mframe` au ton `#15132a`/`#2a2745`. Jauges : contour encre, reflet clair de 1 px sur le remplissage.
- Titres forts (VICTOIRE/DÉFAITE) : contour encre plus halo de couleur en marches qui alterne entre deux intensités, pas de flou.
- Victoire : pas de confettis. Des lucioles turquoise et or (orbes façon Animal Well) montent lentement en ondulant derrière le panneau, avec un halo en croix pixel (`drawConfetti`, appelé dans `drawEnd`).
- Ambiance des menus : `mmist(bas, hauteur, t, couleur, alpha)` dessine trois nappes de brume au bord en marches de 2 px (jamais de flou) et `mmotes(n, t, y0, y1)` des lucioles turquoise et or qui clignotent. Titre : brume turquoise + violette et 14 lucioles par-dessus l'illustration ; pause : brume violette et 8 lucioles sous le panneau.
- Fonds de l'écran de fin (Higgsfield, nano_banana, 16:9, STYLE FORMULA + gabarit de fond, réduits à 960×540 au plus proche voisin) : `mobile-app/assets/art/fin-victoire.png` (château bleu à l'aube, bannières or, lucioles turquoise, forteresse rouge brisée au loin) et `mobile-app/assets/art/fin-defaite.png` (château bleu en ruine, forteresse de cristal rouge sous la lune de sang). `endBackdrop(win)` les dessine en cover avec un lent panoramique, une brume turquoise ou rouge et un voile léger ; repli sur le voile sombre tant que l'image n'est pas chargée. Déclarés dans `IMAGES` de `mobile-app/game/env.ts`.
- Illustration du titre (`menu.png`) au plus proche voisin, à position entière ; braises en pixels pleins.
- Les panneaux de jeu (Base, Forge, Sac) utilisent aussi les primitives `m*` (fait le 2026-11-09) : rangées en `mframe` ton panel (ton off si la recette est impossible), amélioration au max liserée d'or, case choisie du sac liserée d'or, barre rapide plus sombre. Le filet de `mhead` s'arrête avant les boutons et l'aide à droite. Les sprites d'unité sont réduits à 20 px de haut dans les rangées de recrutement.

### Check-list avant d'ajouter un graphisme

1. Il est lisible en 16 px et sur téléphone ?
2. Contour encre et lumière en haut à gauche ?
3. Trois à cinq tons, pas de dégradé lisse ?
4. S'il brille : pixels émissifs plus un halo, et la bonne famille de couleur (chaud, froid ou danger) ?
5. Couleur d'équipe seulement pour ce qui appartient à une équipe ?

## Higgsfield : ce qu'on utilise, ce qu'on n'utilise pas

- **Mode « game » (website-builder-flow, `type: "game"`) : non.** Il construit un jeu web hébergé (salons multijoueur sur un Worker Cloudflare). Ça ne s'intègre pas à notre app Expo native ni au moteur `mobile-app/game/engine.js`.
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
   - jeu et app : `mobile-app/assets/art/` (ex. `menu.png`), à déclarer dans `IMAGES` de `mobile-app/game/env.ts` si le moteur la charge ;
   - visuels de store : régénérer avec `npm run art` (`tools/gen-art.mjs`) ; icône et écran de démarrage de l'app dans `mobile-app/assets/`.
6. Brancher :
   - fonds de menu : `mobile-app/components/game/menu-backdrop.tsx` (garder le ratio 960/540 ou mettre à jour `ART_RATIO`) ;
   - le moteur se modifie directement dans `mobile-app/game/engine.js` ; relancer `npm test` ensuite.

### Sprites et tuiles du jeu (fait le 2026-11-09)

Personnages, monstres, cœurs, arbres et tuiles du terrain viennent de Higgsfield, sur fond vert ou magenta uni pour le détourage. Les sources réduites à 512 px sont dans `art/hd-sources/`.
`python3 tools/gen-hd-art.py` les convertit en `mobile-app/assets/art/units-hd.png`, `trees-hd.png` et `tiles-hd.png`, puis affiche les rectangles à recopier dans `UNIT_ART.r` et `TREE_ART.r` (`mobile-app/game/engine.js`). Ici on réduit en moyenne de boîte plus une palette de 16 à 32 couleurs, et non au plus proche voisin, sinon le détail est perdu.
- Personnages : environ 34 px de haut (golem 40, slime 16), recolorés par le code (tenues du héros, équipes bleue et rouge) avec les yeux en émissif.
- Tuiles : une bande 64x64 par matière, soit 16 variantes 16x16 choisies selon la position, assombrie pour coller au terrain.
- Arbres : 4 canopées sans tronc, les troncs restent des tuiles LOG.
- Guérisseurs et ogre de sang (ajoutés le 2026-11-10) : `gpt_image_2_6`, qualité high, 1k carré, avec un sprite existant en référence (`medias` = identifiant de la génération d'origine dans l'historique Higgsfield, rôle `image_references`). Ce modèle ignore le fond uni demandé et rend un fond noir avec halo, impossible à détourer : toujours passer `background: "transparent"`, puis poser le résultat sur magenta (bleus) ou vert (rouges) avant de le ranger dans `art/hd-sources/`. Le guérisseur rouge a été généré à partir du guérisseur bleu pour obtenir une paire aux mêmes proportions.
- Cœurs de base (refaits le 2026-11-10, même recette `gpt_image_2_6`) : un cristal taillé qui flotte au-dessus d'un socle gravé de runes, bleu pour le joueur, rouge sur socle de fer noir hérissé pour l'ennemi (le rouge est généré avec le bleu en référence pour garder taille et proportions). 44 px de haut. `artCore` coupe l'image à la première ligne vide du bas : le cristal monte et descend, le socle reste fixe, et les pixels clairs du cristal vont dans le calque lumineux.
- Ajouter une unité sans toucher aux autres : `python3 tools/gen-hd-art.py --add nom:hauteur`. La réduction pondère les couleurs par l'opacité, la couleur clé du fond ne bave donc plus sur les bords.
- Chaque image a un repli procédural si elle ne charge pas. Toute nouvelle image doit aussi être ajoutée à `IMAGES` dans `mobile-app/game/env.ts`.

### Sprites animés (si besoin)

Pose clé avec `flux_2`, puis vidéo `seedance_1_5` de 4 s en 720p, ratio explicite (même image de début et de fin pour une boucle). Toujours ajouter le bloc négatif : caméra fixe, pas d'inertie des accessoires, regard toujours du même côté. Ensuite :

1. Extraire toutes les images avec ffmpeg.
2. Garder 8 à 16 images réparties régulièrement, en gardant la première et la dernière.
3. Détourer chaque image.
4. Assembler une planche : boîte englobante commune, ancrage en bas au centre, dernière image retirée pour une boucle, grille de 4096 px maximum.
5. Réduire en plus proche voisin.
6. Nommer `{asset}_{action}_f{n}_{WxH}_g{cxr}_fps{n}_{loop|once}.png`.

Viser 8 à 12 fps et des mouvements discrets. Le moteur dessine ses sprites par code : un sprite animé généré demande un chargement d'image dans `mobile-app/game/engine.js`, à prévoir comme un vrai chantier.

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
