# Note pour la prochaine session (2026-11-10)

À lire avant de toucher aux graphismes. Elle résume ce qui a été décidé avec l'auteur et où en est le travail.

## Où est le travail

- Branche de cette session : `claude/projet-skills-claude-5v6kbz`. Elle contient tout `claude/game-ai-difficulty-features-d9pjof`
  (fusionnée le 2026-11-10 jusqu'à `0e3bde9` : bénédictions, cœurs en cristal, héros jaune GPT Image 2) plus les unités animées.
- **Rien n'est fusionné dans `main`** : l'auteur a demandé d'attendre. GitHub Pages, TestFlight et Android se publient depuis `main`.
- Si l'autre branche avance encore, la fusionner dans celle-ci (merge normal ; seul `CLAUDE.md` a déjà été en conflit, ligne « Visuels »).
- La version web (`www/`) n'existe plus : le jeu est dans `mobile-app/game/engine.js`. Les anciens commits web de cette branche
  sont gardés dans l'historique (fusion `-s ours`), leur contenu vit dans le moteur mobile.

## Décisions de l'auteur (à respecter)

- **Style des unités et monstres : direction B « peuple d'ombre »**, choisie sur une planche de 4 concepts Higgsfield.
  Silhouettes sombres, liseré de lumière froide, seuls les yeux, la lampe du mineur et le cristal du guérisseur brillent.
- **Le héros n'est pas concerné** : c'est le héros modulaire (sprite HD jaune découpé en calques, tenues, objet tenu dans la pose).
  Ne pas le remplacer par un sprite de planche.
- Il veut des personnages **animés** (marche, repos, saut, attaque) générés avec Higgsfield, pas seulement dessinés par code.
- Styles refusés : le style « chibi mignon » coloré (premier essai Higgsfield), et les blobs procéduraux retouchés.
- **Pas d'herbe ni de ligne de sol sous les sprites.** Higgsfield en ajoute tout seul : l'écrire dans le prompt
  (« NO ground, NO ground line, NO grass ») ; `tools/gen-persos.py` retire de toute façon la ligne de sol et les touffes.
- Il aime les planches de choix (plusieurs directions, il choisit) avant une grosse génération.

## Ce qui est fait

- Unités et monstres animés : guerrier, archer, mineur, guérisseur, champion, zombie, golem (chat fantôme), slimes, ogre de sang.
  Sources `art/persos/*.png` (grille 2x6 : marche x6, repos x2, saut, préparation, coup, retour), découpe `python3 tools/gen-persos.py`,
  bloc `// <persos>` du moteur, chargement `loadPersos` / `applyPersos` / `persoSet`. Détails : `docs/direction-artistique.md`.
- Décor en calques (parallaxe) : `art/calques/`, `tools/gen-calques.py`, skill `.claude/skills/calques-decor` (dépôt web d'origine).
- `npm test` : 21 tests passent après la fusion. `npx tsc --noEmit` et `npm run lint` de `mobile-app/` **pas lancés** (dépendances
  non installées dans cette session).

## Higgsfield : ce qu'il faut savoir

- Modèle `gpt_image_2_6`, 21:9, `high`, `2k` : 2,75 crédits par planche. Total de cette session : environ 60 crédits.
- Le réseau de la session bloque `upload.higgsfield.ai` : impossible de téléverser une image locale. Pour garder un personnage
  identique, passer un **identifiant de génération** en `image_references` (ex. planche B : `e7b44b8a-f6a0-47fe-80ca-eecc3615fcc9`).
- Fond magenta `#FF00FF` ou vert `#00FF00` uni pour le détourage ; consigne « crisp hard-edged pixel art, no glow halos, no bloom ».

## À faire ensuite (proposé à l'auteur, pas encore validé)

1. Blocs, objets et icônes dans le même style B (roche sombre gravée, filons qui luisent dans le noir).
2. Régénérer les visuels des stores (`npm run art`) : ils montrent encore les anciens personnages.
3. Lancer `cd mobile-app && npx tsc --noEmit && npm run lint`, puis tester sur un vrai téléphone.
4. Fusion dans `main` quand l'auteur le demande.
