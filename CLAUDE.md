# Until The End

Jeu 2D pixel art façon Terraria, app mobile native (Expo + React Native, iOS et Android) sur le socle NowStack (Convex, better-auth, achats Apple/Google/Stripe).
Inspiré du projet LÖVE2D d'origine (`3 - Projets/until-the-end` sur Google Drive) et de son document `UNTIL_THE_END_Reference_Complète.md`.

## Où est le jeu
- **Moteur : `mobile-app/game/engine.js`, source unique.** Tout le jeu (monde, IA, combat, rendu, HUD) est dans ce fichier JavaScript dense, sans dépendance. C'est lui qu'on modifie. Il n'y a plus de version web ni de copie générée (`www/` et `sync-game` supprimés le 2026-11-10, Capacitor aussi).
- L'app l'exécute sans WebView sur de faux window/document/canvas : `game/canvas.ts` (Canvas2D → Skia, une SkPicture par frame), `game/env.ts` (stockage AsyncStorage, sons react-native-audio-api, tactile, haptique, partage, et l'objet `window.Capacitor` que le moteur interroge encore pour ces services), `game/runtime.ts` (une instance par lancement). Écran : `app/(app)/game.tsx`.
- Sons : `mobile-app/assets/audio/`. Images : `mobile-app/assets/art/`. Le moteur les demande par chemin relatif (`audio/x.mp3`, `art/x.png`) ; toute nouvelle image va aussi dans `IMAGES` de `game/env.ts`.
- **Banc d'essai navigateur** : `npm run play` (racine) sert `tools/game.html`, une page vide qui passe les objets du navigateur au même moteur. Sert à développer sur ordinateur, aux tests (`npm test`) et aux captures des stores. Ce n'est pas une version web : aucune logique de jeu n'y vit.
- Reste de l'app : `mobile-app/` (identité dans `site-config.ts` : bundle `com.joranvnp.untiltheend`, version 2.0.0), `convex/` (backend), `web-app/` (site, landing et pages légales). Règles du socle : lire `AGENTS.md` et `.agents/rules/*` avant de toucher ces dossiers. Couleurs uniquement dans `mobile-app/lib/theme.ts` (thème sombre unique).
- Site vitrine statique : `site/` (accueil, `assistance.html`, `confidentialite.html`), publié par `tools/deploy-site.sh`. La fiche du store pointe vers sa page de confidentialité.
- Parcours façon jeu (fait le 2026-11-01) : écran de chargement (`components/ui/loading.tsx`, barre pixel + astuces), écran titre `app/onboarding/index.tsx` (Jouer en invité / S'inscrire / Se connecter, mode invité dans `lib/guest-store`), camp `app/(app)/home.tsx`, réglages `app/(app)/settings.tsx` et paywall en français. App en paysage uniquement, sans barre d'onglets (fait le 2026-11-05) : boutons de coin façon Stardew Valley (aide, compte, réglages). Composants jeu dans `components/game/` (GameButton, GameIconButton, GamePanel, GameLogo, MenuBackdrop), polices Pixelify Sans et Press Start 2P. Les boutons Jouer/Défi/Boutique du camp ouvrent l'écran de jeu.

## Lancer et vérifier
- Jouer sur ordinateur : `npm run play`, puis ouvrir l'adresse affichée. Tests du moteur : `npm test`.
- App : voir `.agents/rules/launch-app.md`. Après tout changement sous `mobile-app/` : `cd mobile-app && npx tsc --noEmit && npm run lint`.

## Priorités de l'auteur
1. Fonctionnalités et interface : tout lisible et utilisable sur téléphone (portrait/paysage), tablette et ordinateur.
2. Intelligence artificielle : IA adverse (commandant, champion rouge, vagues, raids) et IA des unités (déplacement, minage, combat, ordres Assaut/Défense/Tenir/Suivre).
3. Graphismes ensuite (direction : ambiance façon Animal Well, lumière colorée, brume, grottes vivantes).

## Repères dans le code (sections `// ====` de `mobile-app/game/engine.js`)
- GÉNÉRATION DES TEXTURES PIXEL ART : tuiles, personnages, château, canopées, tout est dessiné par code. Personnages : `humanoid` (cadre 24x32, `roundBody` + `hueRamp` + `selout`), `golemSet`, `slimeFrames` ; les pixels lumineux vont dans `c.emi`, dessinés après l'éclairage par `drawEmissive`.
- MONDE : génération (montagne centrale, grottes, filons, eau, lianes, champignons), éclairage BFS coloré.
- ÉTAT DU JEU : difficultés (table `DIFFS`, 5 niveaux, `DF()` = niveau en cours, `iq` = ce que sait faire le commandant rouge), newGame, sauvegarde/chargement (localStorage, clé `ute-save-v1`), profil (`ute-profile-v1` : réglages PROF.set, succès ACH/unlock, records, défi du jour MODS/dailyInfo), objectifs (OBJ).
- Bénédictions (`BOONS`, `BOON` = niveaux acquis, `bv`/`bval`, `offerBoons`/`chooseBoon`/`rerollBoons`, écran `drawBoonPick`) : au début de la partie puis à chaque aube, le jeu se fige et propose 1 bonus parmi 3 pour la partie en cours ; tirage lié à la graine (`rollBoons`). `__game.step` choisit tout seul la première offre pour que les tests ne se figent pas (`step(n,dt,false)` pour l'empêcher, `dbg.boon` pour piloter).
- Bombes (throwBomb/explode), coffres (tuile CHEST), lune de sang (isBlood), météo (weather), effets (pops, corpses, updateFx/updateWorldFx, drawOverlays).
- OBJETS TENUS EN MAIN : outils dessinés droits (`toolBase`), tournés proprement (`rotPix`, contour posé après), mis en cache (`heldTool`) ; un jeu de poses du héros par objet (`SPR.player.held(id)`, `heldFn`), minage en 4 temps.
- JOUEUR (rappel à la base startRecall, potion rapide drinkPotion), COMBAT (onde de choc coreSurge), UNITÉS (navigate, climbUp/pilier, digStep, engage, cohésion et formation computeArmies/armyFront, soin healStep, ordres Assaut/Défense/Tenir/Suivre).
- MONSTRES : slimes, zombies, ogre de sang (boss de la lune de sang, spawnOgre/updateOgre).
- IA ADVERSE : updateAI (styles eco/rush/équilibre, composition, défense, raids, contre-attaque, vagues groupées, champion en tête, commandos, repli, dernier carré, vétérans), champion.
- RENDU : couches monde/lumière (multiply) + halo, atmosphère.
- INTERFACE : HUD adaptatif (drawHUD, mode large/étroit), panneaux Base/Forge/Sac, menu pause, contrôles tactiles. Le HUD en jeu a ses propres utilitaires pixel art (`hudFrame`, `hudPix`, `hudBar`, `hudSlot`, `hudBtn`, `hudGlint`, `resGain`), décrits dans `docs/direction-artistique.md` (section HUD en jeu) . Les menus (titre, pause, panneaux du menu, fin) utilisent les primitives `MTONE`, `mframe`, `mbox`, `mbutton`, `mhead`, `mveil` alignées sur `PixelFrame` (section Menus du même guide) ; les panneaux Base/Forge/Sac aussi. `button`/`box`/`panelHead` ne servent plus qu'au reste de l'interface.

## Visuels
Décor en calques (parallaxe) : 4 images Higgsfield (`art/calques/`) converties en pixel art à 4 tons par `python3 tools/gen-calques.py`, incrustées dans le moteur entre `// <calques>` et `// </calques>`, coloriées au rendu selon le ciel (`drawCalque`). Procédure complète : skill `.claude/skills/calques-decor`. Skills pixel art installées : `codixel` (sprite à partir d'une image de référence) et `pixelfx` (effets animés en code).
`npm run art` régénère les visuels des stores (`tools/gen-art.mjs` ; captures App Store dans `store/ios/`, anglais dans `store/en/`). Icône et écran de démarrage de l'app : `mobile-app/assets/`.
Sprites HD (Higgsfield façon Animal Well) : `mobile-app/assets/art/units-hd.png` (personnages et monstres, ~34 px), `tiles-hd.png` (16 variantes par matière), `trees-hd.png` (canopées), générés par `python3 tools/gen-hd-art.py` depuis `art/hd-sources/`. Cœurs : cristal animé par code en 16 temps (`artCore`). Pour ajouter une unité : `python3 tools/gen-hd-art.py --add nom:hauteur` (ajouter `:net` pour une réduction nette, à préférer pour les sources GPT Image 2 ; colle le sprite à droite de l'atlas sans régénérer le reste, les sources à 512 px ne redonnant pas exactement les PNG livrés), puis recopier le rectangle affiché dans `UNIT_ART.r` et le nom dans `artSprites`. Chargés par `UNIT_ART`, `HD_TILES` et `TREE_ART` avec repli procédural. Ajouter toute nouvelle image à `IMAGES` dans `mobile-app/game/env.ts`.
Unités et monstres animés (style « peuple d'ombre ») : spritesheets Higgsfield `art/persos/` découpées par `python3 tools/gen-persos.py`, incrustées entre `// <persos>` et `// </persos>` ; elles remplacent les sprites HD fixes des unités dès leur chargement (le héros reste le héros modulaire). Détails : `docs/direction-artistique.md`.
Héros modulaire : le sprite HD du héros (GPT Image 2, 21x34, main vide, repères `HERO_SX`/`HERO_GRIP`/`HERO_REF`) découpé en calques et animé par code (`heroHDParts`, `heroHDFrame`, `heroHDDoll`, `heroPick`), recolorié par `headCol`/`tunic`, avec ou sans épée selon l'objet en main ; repli procédural `heroFrame`. Préréglages `OUTFITS[].look`, surcharge future `PROF.look`. Détails dans `docs/direction-artistique.md` (« Héros modulaire »).
Assets générés par IA (Higgsfield : fonds de menu, logo, concepts, sprites) : suivre `docs/direction-artistique.md` (palette, STYLE FORMULA figée, réduction au plus proche voisin, coût validé avant toute génération).

## Sons
`npm run audio` régénère `mobile-app/assets/audio/*.mp3` (synthèse DSP + ffmpeg, `tools/gen-audio.mjs`). Le moteur (`loadSounds`/`playSnd`/`music`) retombe sur la synthèse `synth` si un fichier manque. Menu : illustration `mobile-app/assets/art/menu.png`.

## Boutique
Monnaie « éclats » (`PROF.coins`, gagnée dans `endGame` via `earnCoins`), tenues `OUTFITS` (couleurs du héros) et bonus `BOOSTS` consommés par `applyBoosts` (jamais en défi du jour ni à la reprise).

## Tests utilisés
- `npm test` (`tools/test.mjs`) : tests de fumée sans écran, à relancer après toute modification du jeu.
- Simulation accélérée : `__game.newGame(1)` puis `__game.step(n)` (exposé sur window pour les tests ; `__game.dbg` donne accès à la météo, aux bombes, aux succès et aux panneaux).
- Vérifier : aucune erreur console, une partie AFK se termine en défaite, une grosse armée finit par gagner,
  captures à 1366x768, 390x844 (mobile portrait), 844x390 (paysage), 1024x768 (tablette).
