# Liste de tâches

## Fait (version 1.1.0)
### Dépôt
- [x] La version web devient le projet principal (`www/`), suppression de la version LÖVE2D (Lua) — remplacée le 2026-11-10 par l'app Expo, moteur dans `mobile-app/game/engine.js`
- [x] Jeu 100 % hors ligne (police bitmap partout, plus de Google Fonts)

### Graphismes et animations
- [x] Ciel jour/nuit coloré : aube et crépuscule rosés, soleil et lune sur un arc, étoiles scintillantes, étoiles filantes
- [x] Nuages en pixel art qui dérivent entre les plans de montagnes
- [x] Météo : averses et orages (éclairs, tonnerre, éclaboussures), arbres et herbes qui ondulent au vent
- [x] Lune de sang : ciel et lumière rouges, vignette pulsante
- [x] Joueur : écrasement à l'atterrissage, étirement au saut, poussière
- [x] Unités : apparition lumineuse au recrutement, petit élan en attaquant, dépouilles qui s'évaporent
- [x] Cœur : fissures selon les dégâts, battement qui accélère, étincelles quand il est presque détruit
- [x] Flèches avec traînée, blocs posés qui flashent, braises des torches, éclat des objets ramassés
- [x] Gel d'image (hit-stop) sur les gros coups, gros chiffres de dégâts qui sautent
- [x] Vignette rouge quand on est touché et cœurs qui battent quand les PV sont bas
- [x] Interface : titre animé (lettres qui ondulent, étincelles), boutons qui glissent, panneaux qui s'ouvrent en fondu,
      flash au toucher des boutons, messages qui glissent, ressources qui clignotent quand elles augmentent,
      objet sélectionné qui rebondit, fondus entre écrans, confettis à la victoire, bannière de succès

### Fonctionnalités
- [x] Coffres au trésor dans les grottes (potions, bombes, minerais, diamants)
- [x] Bombes (forge : 2 charbon + 1 cuivre → 3) : lancer en cloche, rebonds, explosion qui creuse et blesse
- [x] Lune de sang une nuit sur quatre (monstres doublés)
- [x] 16 succès, statistiques, records de temps par difficulté
- [x] Défi du jour : monde et règle spéciale communs (filons généreux, nuits rouges, rouge enragé, trésor royal, cœurs de verre) + série de jours
- [x] Réglages : son, musique, vibrations, secousses, effet rétro, commandes gaucher

### iOS / App Store
- [x] Projet iOS Capacitor 8 (iPhone + iPad), zone sûre (encoche), barre de statut masquée, son relancé après interruption, haptique iPhone
- [x] GitHub Actions : compilation à chaque push + envoi TestFlight sans Mac (clé d'API App Store Connect)
- [x] Captures App Store iPhone 6,9" et iPad 13" (français et anglais), guide `PUBLIER_APP_STORE.md` (retiré avec Capacitor le 2026-11-10)

### Mobile / Play Store
- [x] Projet Android Capacitor 8 (SDK 36), plein écran immersif, écran toujours allumé
- [x] Bouton retour Android (ferme panneau → pause → menu → quitter), pause + sauvegarde en arrière-plan
- [x] Vibrations natives (plugin Haptics)
- [x] Icônes adaptatives, écran de démarrage, visuels Play Store générés depuis les sprites
- [x] GitHub Actions : APK de test + AAB signé ; GitHub Pages pour la version web
- [x] PWA (manifeste + service worker) : installable et jouable hors ligne depuis le navigateur
- [x] Politique de confidentialité, fiche Play Store, guide de publication

## Fait (version 1.2.0) — IA, difficultés et jouabilité
### Difficultés
- [x] 5 niveaux (Paisible, Normal, Difficile, Brutal, Cauchemar) réglés par une seule table `DIFFS` : revenu rouge, PV des cœurs, délai et taille des vagues,
      effectif max, repos entre deux vagues, champion, monstres, dégâts subis, délai de retour du héros, et ce que le commandant sait faire (`iq`)
- [x] Écran « Nouvelle partie » : une ligne par niveau (description, record, étoile si gagné), niveau conseillé en surbrillance, Cauchemar à débloquer
- [x] Anciens profils et sauvegardes repris tels quels (records rangés par niveau, l'ancien Brutal reste Brutal)

### IA adverse
- [x] Composition réfléchie : contre ce que le joueur aligne, guérisseurs et colosses dès Difficile (tour bleue améliorée = plus de golems)
- [x] Le champion quitte la mine pour mener la vague (Difficile+) et galvanise ses voisins (+20 % de dégâts)
- [x] Opportunisme (Difficile+) : héros à terre ou parti loin, la vague part tout de suite
- [x] Commando de mêlée qui file sur le cœur pendant que la ligne fixe la défense, repli tactique en infériorité, pillards plus nombreux (Brutal+)
- [x] Vétérans (Cauchemar) : chaque vague lancée renforce les recrues suivantes
- [x] Dernier carré : sous 40 % de PV, la garde d'élite du cœur rouge sort du château ; Paisible : vagues plus timides et longues pauses
- [x] Améliorations rouges choisies selon la situation ; cadence de réflexion du commandant selon le niveau

### IA des unités
- [x] Formation : mêlée devant, tireurs et guérisseurs un rang derrière (marche, défense, position tenue), golems en avant
- [x] Tir concentré : on achève les blessés, on vise d'abord les guérisseurs, les archers se répondent
- [x] Nouvelle unité Guérisseur (soigne unités, champion et héros, s'écarte de la mêlée)

### Jouabilité et nouveautés
- [x] Ordre « Tenir » : un fanion planté où se tient le héros, l'armée garde cette position (visible aussi sur la minicarte)
- [x] Rappel à la base (touche H ou bouton du panneau Base) : 3 s immobile, 45 s de recharge
- [x] Potion rapide : touche F, ou bouton qui apparaît sous les cœurs quand on est blessé
- [x] Onde de choc du cœur bleu, une fois par partie quand il passe sous 25 % (jusqu'en Difficile)
- [x] Lune de sang dès la 2e nuit puis une nuit sur trois, avec son boss : l'ogre de sang marche sur la base, à abattre avant l'aube (diamants, or, relique)
- [x] 4 nouveaux succès (21 au total) : Stratège, Fin du cauchemar, Tueur d'ogre, Forteresse
- [x] `npm test` : tests de fumée sans écran (règles du jeu, sauvegarde, migrations, anglais, 4 tailles d'écran)

## Fait (2026-11-10) — rejouabilité : bénédictions
- [x] Bénédictions : au début de la partie puis à chaque aube, le jeu se fige et propose 1 bonus parmi 3, valable pour la partie en cours (25 bonus : économie, armée, héros, base ; certains montent jusqu'au niveau 3, les rares ont un cadre doré)
- [x] Une relance du tirage par partie ; tirage lié à la graine du monde (identique pour tous en défi du jour, inchangé si on quitte et reprend)
- [x] Liste des bénédictions acquises dans le menu Pause (bouton Bonus), succès « Béni des anciens », sauvegarde, anglais, manette et touches 1/2/3
- [x] Cœurs bleu et rouge en cristal flottant sur leur socle (GPT Image 2), à la place des cœurs en forme de cœur ; animés par code en 16 temps (flottement, reflet, éclats en orbite, runes et centre qui palpitent, étincelles)
- [x] Héros jaune refait avec GPT Image 2 (net, main vide), découpage et tenues recalés

## Version 1.2 — reste à faire (rendre le jeu addictif et prêt pour le Play Store)
### Graphismes et animations (Codex)
- [x] Personnages et monstres façon Animal Well, plus grands (cadre 24x32) : volume éclairé en 5 tons décalés en teinte, liseré de lumière, vraie marche (pieds et mains qui alternent), yeux des monstres, lampe du mineur et golem fantôme qui brillent dans le noir après l'éclairage
- [x] Décor en calques : montagnes lointaines, grand pic, ruines et forêt (images Higgsfield pixelisées en 4 tons), parallaxe, couleurs qui suivent le ciel (aube, nuit, lune de sang), brume entre les plans
- [x] Animations : marche/minage/attaque des unités, cycle de marche du joueur, coups de pioche, chute des arbres, ouverture des coffres
- [ ] Monstres animés (respiration, attaque, mort), projectiles et impacts plus lisibles — fait : respiration, élan d'attaque du slime, corps qui basculent, éclat blanc à chaque coup ; reste : projectiles plus lisibles
- [ ] Interface : icônes d'objets redessinées, transitions de panneaux, retour visuel sur chaque bouton tactile

### Fonctionnalités
- [x] Tutoriel guidé de la première partie : marcher, sauter, miner avec boutons tactiles en surbrillance, puis bouton Base mis en avant ; première vague repoussée de 2 min
- [x] Mode Siège : vagues infinies de plus en plus fortes, score et record (succès « Inébranlable »)
- [x] Traduction anglaise (langue auto selon le téléphone + réglage)
- [x] Manette (Gamepad API) et clavier Bluetooth
- [x] Récompense quotidienne et quêtes (3 objectifs par jour)
- [x] Boss de lune de sang (ogre de sang)
- [ ] Nouveaux biomes (désert, glace profonde)

### Innovation (ce qui différencie le jeu)
- [ ] Héros à débloquer avec un pouvoir chacun (mineur, archer, bâtisseur)
- [x] Reliques : 8 bonus permanents (coffres, champion rouge, Siège toutes les 5 vagues), niveau 1 à 3 par doublon, 2 emplacements (3 après 10 victoires)
- [x] Partage du résultat (temps, défi du jour) en une touche

### Play Store
- [ ] Brancher `main` sur la version fusionnée (le workflow Android construit l'APK/AAB depuis `main`)
- [ ] Tester sur téléphone réel, mesurer les performances entrée de gamme
- [ ] Test fermé 12 testeurs / 14 jours puis production (app Expo, skills `ns-android-beta` puis `ns-android-distribute`)

## À faire ensuite (idées)
- [ ] Tester l'APK sur plusieurs téléphones réels (performances sur entrée de gamme)
- [ ] Musique composée (pistes jour / nuit / bataille) à la place du synthé aléatoire
- [ ] Classement en ligne du défi du jour (Google Play Jeux)
