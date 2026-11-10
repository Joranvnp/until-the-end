# Note pour la prochaine session

Écrite le 2026-11-10, à la fin de la session « IA, difficultés, bonus, sprites ». À lire avant de reprendre, puis à mettre à jour ou à supprimer une fois les points traités.

## Où on en est

- Tout le travail est sur la branche `claude/game-ai-difficulty-features-d9pjof`, poussée sur GitHub. Aucune demande de fusion (PR) n'est ouverte : l'auteur n'en a pas demandé.
- Cette branche part de `expo-port` (les graphismes refaits par l'auteur) et non de `main`, qui est en retard.
- `npm test` : 21 tests verts. `cd mobile-app && npx tsc --noEmit && npm run lint` : verts au dernier passage (le moteur seul a changé depuis).
- Jamais vérifié : l'app lancée sur simulateur ou sur un vrai téléphone. Seul le banc d'essai navigateur (`npm run play`) et un `expo export` ont tourné.

## Fait pendant cette session

1. Cinq difficultés (table `DIFFS`), IA rouge plus maligne (composition, champion en tête, commandos, repli, vétérans, dernier carré), IA des unités (formation, soin, ordre Tenir), guérisseur, ogre de sang, rappel à la base, potion rapide.
2. Capacitor et l'ancienne version web retirés. Le moteur est une source unique : `mobile-app/game/engine.js`.
3. Objets tenus en main refaits (pioche, épée, arc, torche) avec un jeu de poses par objet.
4. Bénédictions : 1 bonus parmi 3 au début de la partie puis à chaque aube (25 bonus, une relance par partie, tirage lié à la graine du monde).
5. Cœurs en cristal (GPT Image 2), animés par code en 16 temps (`artCore`).
6. Héros jaune refait avec GPT Image 2 (21x34, main vide), découpage recalé (`HERO_SX`, `HERO_GRIP`, `HERO_REF`).
7. Guérisseurs et ogre de sang générés avec GPT Image 2.

## À faire ensuite, dans l'ordre proposé à l'auteur

L'auteur a validé le point 1 (les bénédictions, fait). Les points suivants ont été proposés mais pas encore validés : lui redemander avant de s'y lancer.

### Point 2 : les parties qui s'enlisent (le plus important pour une sortie)

Constat du 2026-11-10 avec `node tools/bot.mjs 1 avg 11,22,33,44,55,66` : les 12 parties (6 mondes, avec et sans bénédictions) sont encore en cours à 35 minutes, cœur rouge intact. Les bénédictions n'y changent rien. Le monde 11 examiné avec `node tools/bot.mjs --diag 11 12` montre deux défauts du jeu :

- **La vague rouge s'étire et n'arrive pas.** Lancée à 5 min 30, elle a encore ses archers éparpillés de x=108 à x=363 six minutes plus tard (dans la montagne, y=31 à 48). L'ordre rouge reste « attack » pendant tout ce temps. Pistes : vitesse de traversée de la montagne (creusage, escalade), regroupement avant le départ, abandon d'une vague qui n'avance plus.
- **Les défenseurs bleus tombent dans des trous près du château.** En ordre Défense, 36 combattants sont à 5 à 11 cases sous le sol, à droite du château (x=26 à 36). Le sol de la ligne 64 est percé juste à côté du château (x=26 à 32), au-dessus de grandes cavités. Pistes : interdire aux mineurs de percer la surface près de la base, faire remonter les défenseurs (comme `escapeFloor`), tenir la ligne sur le plancher du château.

Attention à la lecture des résultats : le joueur automatique reste en Défense tant que le rouge est en Assaut. Il grossit donc le problème. Un vrai joueur irait attaquer, mais les deux défauts restent réels.

Autre constat : l'armée du joueur n'a aucune limite d'effectif (le joueur automatique dépasse 160 unités). Proposé à l'auteur : une limite, avec un message clair dans le panneau Base. Le rouge en a déjà une (`cap` dans `DIFFS`).

### Points 3 à 5 (proposés, non détaillés)

3. Campagne ou classement du défi du jour.
4. Pouvoirs du héros et défenses à construire.
5. Sauvegarde dans le nuage (Convex) et découpage du moteur en modules.

## Décisions en attente de l'auteur

- **Netteté des autres personnages.** Le héros est réduit avec `--add hero:34:net` (couleur la plus fréquente par case), les autres sprites avec une moyenne, d'où un rendu plus flou à côté de lui. On peut repasser tous les personnages en réduction nette sans dépenser de crédit. Non fait : cela modifie les sprites que l'auteur a refaits. Lui montrer un avant/après d'abord.
- **Bouton Partager.** `SHARE_URL` pointe toujours vers l'ancienne adresse GitHub Pages (`https://joranvnp.github.io/until-the-end/`), qui n'est plus publiée. Demander la bonne adresse.
- **Captures des stores.** Elles datent de `expo-port` (portrait, anciens graphismes). L'app est en paysage. `npm run art` les régénère.
- **Autres personnages en GPT Image 2.** Environ 1,5 crédit par image. L'auteur n'a demandé que le héros.
- **Essai sur téléphone réel**, puis mesure des performances sur entrée de gamme.

## Recette Higgsfield (GPT Image 2)

Règle du projet : annoncer le coût et obtenir l'accord de l'auteur avant toute génération payante, jamais `use_unlim` sans demande explicite, 2 régénérations au plus par image, coût noté dans le message de commit.

- Modèle `gpt_image_2_6`, `quality: "high"`, `resolution: "1k"`, `aspect_ratio: "1:1"`, `use_unlim: false`, 1,5 crédit par image.
- **`background: "transparent"` est obligatoire** : sans lui le modèle rend un fond noir avec halo, impossible à détourer.
- Les références se passent par identifiant de génération (`medias: [{role: "image_references", value: <id>}]`). L'envoi de fichiers n'est pas possible depuis la session (hôte d'envoi bloqué), le téléchargement des résultats l'est.
- Identifiants utiles dans l'historique : héros d'origine `562851b9-df99-40ba-8475-b110861d0c45`, héros GPT `c13c1bd6-f95c-4eb8-a470-e855573ed2f5`, guérisseur bleu GPT `28dde703-7398-4fa8-814c-a40f9a97059e`, guérisseur rouge GPT `6cd15dea-23d3-47bf-93ac-ae514d849004`, ogre GPT `b15061ab-3697-4257-aa90-00bf21e6f309`, cristal bleu `a0de5f79-db0b-4839-a7f5-c760a65ace33`, cristal rouge `97dd9107-a123-4518-b0c0-939a0bacf7c5`, archer bleu `a6ea0ff7-f6ad-4c62-8c78-d39d4489b99d`.
- Après téléchargement : poser l'image sur fond magenta (sprites bleus ou jaunes) ou vert (sprites rouges), la ranger en 512 px dans `art/hd-sources/`, puis `python3 tools/gen-hd-art.py --add nom:hauteur:net`. L'outil affiche le rectangle à recopier dans `UNIT_ART.r`.
- Crédits dépensés cette session pour les sprites : 3 pour les deux cristaux et 1,5 pour le héros ; environ 18 au total avec les guérisseurs et l'ogre (essais Nano Banana compris).

## Pièges rencontrés

- **Un test qui échoue ne doit pas passer inaperçu.** Deux fois, un `npm test | tail` enchaîné avec `&&` a laissé partir un commit malgré un échec. Lancer `npm test`, lire le code de sortie, puis valider.
- Les bénédictions sont coupées par défaut dans `tools/test.mjs` (`D.boon.off=true`) : leur tirage dépend du monde et rendait un test aléatoire. `__game.step` choisit seul la première offre ; `step(n, dt, false)` l'en empêche.
- `tools/gen-art.mjs` coupe aussi les bénédictions pour que l'écran de choix n'apparaisse pas sur les captures des stores.
- Une régénération complète de `units-hd.png` ne redonne pas les PNG livrés (sources réduites à 512 px). Toujours passer par `--add`.
- Le découpage du héros (`heroHDParts`) est calé au pixel près sur son sprite. Tout nouveau sprite du héros demande de revoir `HERO_SX`, `HERO_GRIP`, `HERO_REF`, la boîte des yeux et les lignes de coupe.
