# Until The End

Jeu 2D pixel art façon Terraria : mine, forge, recrute des troupes et détruis le cœur de la base adverse.

- **Jouer sur ordinateur (développement)** : `npm run play`, puis ouvre l'adresse affichée. C'est le moteur de l'app lancé dans un navigateur, pas une version web publiée.
- **iPhone, iPad et Android** : app native Expo dans `mobile-app/`. Le moteur du jeu est `mobile-app/game/engine.js`, source unique. L'ancienne version web (`www/`) et l'emballage Capacitor ont été retirés.
- **Tests** : `npm test` (tests de fumée sans écran, Playwright requis).
- **Liste de tâches** : [ROADMAP.md](ROADMAP.md).

Voir `CLAUDE.md` pour l'organisation du code et la façon de tester.
