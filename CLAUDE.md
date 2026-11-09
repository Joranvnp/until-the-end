# Until The End — version web

Jeu 2D pixel art façon Terraria, en un seul fichier `www/index.html` (HTML + JavaScript, aucune dépendance, aucun build).
Emballé pour Android et iOS avec Capacitor (`android/`, `ios/`, `capacitor.config.json`) : voir `PUBLIER_PLAY_STORE.md` et `PUBLIER_APP_STORE.md`.
Inspiré du projet LÖVE2D d'origine (`3 - Projets/until-the-end` sur Google Drive) et de son document `UNTIL_THE_END_Reference_Complète.md`.

## Portage natif en cours (branche `expo-port`)
Le jeu est porté en vraie app mobile sur le socle NowStack (Expo + React Native, Convex, better-auth, achats Apple/Google/Stripe).
- `mobile-app/` (app Expo, identité dans `site-config.ts` : bundle `com.joranvnp.untiltheend`, version 2.0.0), `convex/` (backend), `web-app/` (site, landing et pages légales).
- Règles du socle : lire `AGENTS.md` et `.agents/rules/*` avant de toucher ces dossiers. Couleurs uniquement dans `mobile-app/lib/theme.ts` (thème sombre unique).
- Vérifier : `cd mobile-app && npx tsc --noEmit && npm run lint`.
- `www/` reste la référence du gameplay jusqu'à la parité, puis Capacitor (`android/`, `ios/`) sera retiré.
- Parcours façon jeu (fait le 2026-11-01) : écran de chargement (`components/ui/loading.tsx`, barre pixel + astuces), écran titre `app/onboarding/index.tsx` (Jouer en invité / S'inscrire / Se connecter, mode invité dans `lib/guest-store`), camp `app/(app)/home.tsx`, réglages `app/(app)/settings.tsx` et paywall en français. App en paysage uniquement, sans barre d'onglets (fait le 2026-11-05) : boutons de coin façon Stardew Valley (aide, compte, réglages). Composants jeu dans `components/game/` (GameButton, GameIconButton, GamePanel, GameLogo, MenuBackdrop), polices Pixelify Sans et Press Start 2P. Les boutons Jouer/Défi/Boutique du camp ouvrent l'écran de jeu.
- Jeu natif (fait le 2026-11-01, sans WebView) : `mobile-app/scripts/sync-game.mjs` recopie le script de `www/index.html` dans `game/engine.generated.js` (ne pas modifier à la main) ; relancer `cd mobile-app && npm run sync-game` après chaque changement du jeu web. Le moteur tourne sur des faux window/document/canvas : `game/canvas.ts` (Canvas2D → Skia, une SkPicture par frame), `game/env.ts` (stockage AsyncStorage, sons react-native-audio-api, tactile, haptique, partage), `game/runtime.ts` (une instance par lancement). Écran : `app/(app)/game.tsx`.

## Lancer
Ouvrir `www/index.html` dans un navigateur. Après modification du jeu : `npx cap sync` (fait aussi par la CI, workflows Android et iOS). Pour les tests headless : `npx playwright` avec Chromium.

## Priorités de l'auteur
1. Fonctionnalités et interface : tout lisible et utilisable sur téléphone (portrait/paysage), tablette et ordinateur.
2. Intelligence artificielle : IA adverse (commandant, champion rouge, vagues, raids) et IA des unités (déplacement, minage, combat, ordres Assaut/Défense/Suivre).
3. Graphismes ensuite (direction : ambiance façon Animal Well, lumière colorée, brume, grottes vivantes).

## Repères dans le code (sections `// ====` de index.html)
- GÉNÉRATION DES TEXTURES PIXEL ART : tuiles, personnages, château, canopées, tout est dessiné par code. Personnages : `humanoid` (cadre 24x32, `roundBody` + `hueRamp` + `selout`), `golemSet`, `slimeFrames` ; les pixels lumineux vont dans `c.emi`, dessinés après l'éclairage par `drawEmissive`.
- MONDE : génération (montagne centrale, grottes, filons, eau, lianes, champignons), éclairage BFS coloré.
- ÉTAT DU JEU : newGame, sauvegarde/chargement (localStorage, clé `ute-save-v1`), profil (`ute-profile-v1` : réglages PROF.set, succès ACH/unlock, records, défi du jour MODS/dailyInfo), objectifs (OBJ).
- Bombes (throwBomb/explode), coffres (tuile CHEST), lune de sang (isBlood), météo (weather), effets (pops, corpses, updateFx/updateWorldFx, drawOverlays).
- JOUEUR, COMBAT, UNITÉS (navigate, climbUp/pilier, digStep, engage, cohésion d'armée computeArmies).
- IA ADVERSE : updateAI (styles eco/rush/équilibre, défense, raids, vagues groupées, retraite), champion.
- RENDU : couches monde/lumière (multiply) + halo, atmosphère.
- INTERFACE : HUD adaptatif (drawHUD, mode large/étroit), panneaux Base/Forge/Sac, menu pause, contrôles tactiles. Le HUD en jeu a ses propres utilitaires pixel art (`hudFrame`, `hudPix`, `hudBar`, `hudSlot`, `hudBtn`, `hudGlint`, `resGain`), décrits dans `docs/direction-artistique.md` (section HUD en jeu) . Les menus (titre, pause, panneaux du menu, fin) utilisent les primitives `MTONE`, `mframe`, `mbox`, `mbutton`, `mhead`, `mveil` alignées sur `PixelFrame` (section Menus du même guide) ; les panneaux Base/Forge/Sac aussi. `button`/`box`/`panelHead` ne servent plus qu'au reste de l'interface.

## Visuels
Décor en calques (parallaxe) : 4 images Higgsfield (`art/calques/`) converties en pixel art à 4 tons par `python3 tools/gen-calques.py`, incrustées dans `index.html` entre `// <calques>` et `// </calques>`, coloriées au rendu selon le ciel (`drawCalque`). Procédure complète : skill `.claude/skills/calques-decor`. Skills pixel art installées : `codixel` (sprite à partir d'une image de référence) et `pixelfx` (effets animés en code).
`npm run art` régénère icônes, écran de démarrage et visuels Play Store (`tools/gen-art.mjs`), puis `npm run assets` pour Android et iOS (captures App Store dans `store/ios/`, anglais dans `store/en/`).
Sprites HD (Higgsfield façon Animal Well) : `www/art/units-hd.png` (personnages et monstres, ~34 px), `tiles-hd.png` (16 variantes par matière), `trees-hd.png` (canopées), générés par `python3 tools/gen-hd-art.py` depuis `art/hd-sources/`. Chargés par `UNIT_ART`, `HD_TILES` et `TREE_ART` avec repli procédural. Ajouter toute nouvelle image à `IMAGES` dans `mobile-app/game/env.ts`.
Héros modulaire : le sprite HD Higgsfield du héros découpé en calques et animé par code (`heroHDParts`, `heroHDFrame`, `heroHDDoll`, `heroPick`), recolorié par `headCol`/`tunic`, avec ou sans épée selon l'objet en main ; repli procédural `heroFrame`. Préréglages `OUTFITS[].look`, surcharge future `PROF.look`. Détails dans `docs/direction-artistique.md` (« Héros modulaire »).
Assets générés par IA (Higgsfield : fonds de menu, logo, concepts, sprites) : suivre `docs/direction-artistique.md` (palette, STYLE FORMULA figée, réduction au plus proche voisin, coût validé avant toute génération).

## Sons
`npm run audio` régénère `www/audio/*.mp3` (synthèse DSP + ffmpeg, `tools/gen-audio.mjs`). Le moteur (`loadSounds`/`playSnd`/`music`) retombe sur la synthèse `synth` si un fichier manque. Menu : illustration `www/art/menu.png`.

## Boutique
Monnaie « éclats » (`PROF.coins`, gagnée dans `endGame` via `earnCoins`), tenues `OUTFITS` (couleurs du héros) et bonus `BOOSTS` consommés par `applyBoosts` (jamais en défi du jour ni à la reprise).

## Tests utilisés
- Simulation accélérée : `__game.newGame(1)` puis `__game.step(n)` (exposé sur window pour les tests ; `__game.dbg` donne accès à la météo, aux bombes, aux succès et aux panneaux).
- Vérifier : aucune erreur console, une partie AFK se termine en défaite, une grosse armée finit par gagner,
  captures à 1366x768, 390x844 (mobile portrait), 844x390 (paysage), 1024x768 (tablette).
