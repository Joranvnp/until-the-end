---
name: calques-decor
description: Crée ou remplace les calques de décor en parallaxe d'Until The End (montagnes, ruines, forêt) - génération Higgsfield, pixelisation en 4 tons avec tools/gen-calques.py, intégration dans www/index.html et captures de vérification. À utiliser pour « nouveau décor », « change le fond », « ajoute un biome en arrière-plan », « calques », « parallaxe ».
---

# Calques de décor (parallaxe)

Le fond du jeu est fait de 4 calques, du plus lointain au plus proche : `lointain`, `pic`, `ruines`, `foret`.
Chaque calque est une image en 4 tons (pas de couleur). Le jeu les colorie à chaque instant avec le ciel :
plus un calque est loin, plus il se fond dans le bas du ciel (aube rose, nuit bleue, lune de sang rouge).
Une brume monte au pied des calques lointains.

- Sources : `art/calques/<nom>.png` (images Higgsfield en demi-résolution, fond transparent).
- Conversion : `python3 tools/gen-calques.py` (Pillow + numpy). Le script recadre, réduit chaque image à 4 tons,
  la ramène à la taille du jeu par vote majoritaire (bords nets), retire les pixels isolés, raccorde le calque
  avec son miroir, puis incruste le résultat entre `// <calques>` et `// </calques>` dans `www/index.html`.
  Il écrit aussi `art/calques-apercu.png`.
- Rendu : `drawCalque`, `calqueRamp`, `tintCalque` dans la section RENDU de `www/index.html`.
  Réglages par calque : `CQ_PAR` (vitesse de parallaxe), `CQ_VY` (suivi vertical), `CQ_FOOT` (pied du calque
  sous le sol, en pixels), `CQ_DEPTH` (fondu dans le ciel), `CQ_K` (contraste), `CQ_HUE` (teinte).

## Générer un nouveau calque avec Higgsfield

1. Modèle `gpt_image_2_6`, `aspect_ratio: 21:9`, `quality: high`, `resolution: 2k`, `background: transparent`
   (environ 3 crédits l'image). Lancer 2 variantes par calque avec `generate_image_batch`, puis `jobs_wait`.
2. Modèle de prompt (garder la structure, changer le sujet) :
   « Single isolated parallax background layer for a 2D side-scrolling pixel art game, <PLAN> layer: <sujet>,
   strictly side view. Monochrome <teinte>, only 4 flat tonal values, crisp 16-bit pixel art with hard pixel
   edges, no blur, no gradients. Touches the bottom edge across the full width; everything above is fully
   transparent, no sky, no clouds, no text, no characters. Horizontally seamless. »
3. Télécharger le PNG, le regarder sur fond magenta pour vérifier la transparence, puis l'enregistrer en
   demi-résolution dans `art/calques/<nom>.png` (`Image.resize(..., Image.NEAREST)`).
4. Ajouter ou remplacer l'entrée dans `LAYERS` de `tools/gen-calques.py` (nom, hauteur en pixels de jeu),
   lancer le script, regarder `art/calques-apercu.png`.

Garder une direction cohérente : ambiance façon Animal Well, silhouettes calmes. Le premier plan reste sombre et
peu contrasté pour que le joueur, les unités et les blocs restent lisibles.

## Vérifier

Capturer le jeu (Playwright + Chromium) à 1366x768, 390x844, 844x390 et 1024x768, de jour, au crépuscule, de nuit
et pendant une lune de sang (`__game.newGame(1)`, puis `__game.time = 3*300 + .78*300`). Contrôler aussi l'écran
titre. Aucune erreur console. En portrait, les calques doivent rester visibles au-dessus du sol.

Pour des effets animés (feu, éclairs, lucioles, brume animée), voir la skill `pixelfx`. Pour un sprite tiré d'une
image de référence, voir la skill `codixel`.
