# Until The End — version web

Jeu 2D pixel art façon Terraria, en un seul fichier `www/index.html` (HTML + JavaScript, aucune dépendance, aucun build).
Emballé pour Android et iOS avec Capacitor (`android/`, `ios/`, `capacitor.config.json`) : voir `PUBLIER_PLAY_STORE.md` et `PUBLIER_APP_STORE.md`.
Inspiré du projet LÖVE2D d'origine (`3 - Projets/until-the-end` sur Google Drive) et de son document `UNTIL_THE_END_Reference_Complète.md`.

## Lancer
Ouvrir `www/index.html` dans un navigateur. Après modification du jeu : `npx cap sync` (fait aussi par la CI, workflows Android et iOS). Pour les tests headless : `npx playwright` avec Chromium.

## Priorités de l'auteur
1. Fonctionnalités et interface : tout lisible et utilisable sur téléphone (portrait/paysage), tablette et ordinateur.
2. Intelligence artificielle : IA adverse (commandant, champion rouge, vagues, raids) et IA des unités (déplacement, minage, combat, ordres Assaut/Défense/Suivre).
3. Graphismes ensuite (direction : ambiance façon Animal Well, lumière colorée, brume, grottes vivantes).

## Repères dans le code (sections `// ====` de index.html)
- GÉNÉRATION DES TEXTURES PIXEL ART : tuiles, personnages, château, canopées, tout est dessiné par code.
- MONDE : génération (montagne centrale, grottes, filons, eau, lianes, champignons), éclairage BFS coloré.
- ÉTAT DU JEU : newGame, sauvegarde/chargement (localStorage, clé `ute-save-v1`), profil (`ute-profile-v1` : réglages PROF.set, succès ACH/unlock, records, défi du jour MODS/dailyInfo), objectifs (OBJ).
- Bombes (throwBomb/explode), coffres (tuile CHEST), lune de sang (isBlood), météo (weather), effets (pops, corpses, updateFx/updateWorldFx, drawOverlays).
- JOUEUR, COMBAT, UNITÉS (navigate, climbUp/pilier, digStep, engage, cohésion d'armée computeArmies).
- IA ADVERSE : updateAI (styles eco/rush/équilibre, défense, raids, vagues groupées, retraite), champion.
- RENDU : couches monde/lumière (multiply) + halo, atmosphère.
- INTERFACE : HUD adaptatif (drawHUD, mode large/étroit), panneaux Base/Forge/Sac, menu pause, contrôles tactiles.

## Visuels
`npm run art` régénère icônes, écran de démarrage et visuels Play Store (`tools/gen-art.mjs`), puis `npm run assets` pour Android et iOS (captures App Store dans `store/ios/`, anglais dans `store/en/`).

## Tests utilisés
- Simulation accélérée : `__game.newGame(1)` puis `__game.step(n)` (exposé sur window pour les tests ; `__game.dbg` donne accès à la météo, aux bombes, aux succès et aux panneaux).
- Vérifier : aucune erreur console, une partie AFK se termine en défaite, une grosse armée finit par gagner,
  captures à 1366x768, 390x844 (mobile portrait), 844x390 (paysage), 1024x768 (tablette).
