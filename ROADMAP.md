# Liste de tâches

## Fait (version 1.1.0)
### Dépôt
- [x] La version web devient le projet principal (`www/`), suppression de la version LÖVE2D (Lua)
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

### Mobile / Play Store
- [x] Projet Android Capacitor 8 (SDK 36), plein écran immersif, écran toujours allumé
- [x] Bouton retour Android (ferme panneau → pause → menu → quitter), pause + sauvegarde en arrière-plan
- [x] Vibrations natives (plugin Haptics)
- [x] Icônes adaptatives, écran de démarrage, visuels Play Store générés depuis les sprites
- [x] GitHub Actions : APK de test + AAB signé ; GitHub Pages pour la version web
- [x] PWA (manifeste + service worker) : installable et jouable hors ligne depuis le navigateur
- [x] Politique de confidentialité, fiche Play Store, guide de publication

## À faire ensuite (idées)
- [ ] Tester l'APK sur plusieurs téléphones réels (performances sur entrée de gamme)
- [ ] Musique composée (pistes jour / nuit / bataille) à la place du synthé aléatoire
- [ ] Manette (Gamepad API) et clavier Bluetooth sur Android
- [ ] Mode Survie : vagues infinies, score à battre
- [ ] Nouveaux biomes (désert, glace profonde) et boss de fin de lune de sang
- [ ] Classement en ligne du défi du jour (Google Play Jeux)
- [ ] Traduction anglaise (élargit beaucoup l'audience du Play Store)
