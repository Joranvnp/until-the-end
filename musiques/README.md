# Musiques — Until The End

Morceaux originaux style 16 bits, entièrement générés par code (`tools/gen-audio.mjs`, aucun extrait protégé).
Les boucles sont pliées à la génération et encodées en MP3 sans blanc (gapless) : dans le jeu, elles s'enchaînent sans coupure.

## `jeu-16-bits/` — utilisées dans le jeu (copie de `mobile-app/assets/audio/`, `npm run audio`)

| Fichier | Moment | Tonalité | Tempo | Durée |
|---|---|---|---|---|
| music-menu.mp3 | Menu | La mineur | 96 | 80,0 s |
| music-day.mp3 | Jour | Ré majeur | 116 | 91,0 s |
| music-night.mp3 | Nuit | Mi mineur | 84 | 91,4 s |
| music-combat.mp3 | Combat | Ré mineur | 144 | 73,3 s |
| music-blood.mp3 | Lune de sang | Do mineur harmonique | 140 | 75,4 s |

## `nouvelles/` — pas encore dans le jeu (`npm run audio:extra`)

| Fichier | Idée | Tonalité | Mesure / tempo | Durée | Boucle |
|---|---|---|---|---|---|
| aube.mp3 | Aube, valse douce | Fa majeur | 3/4, 84 | 68,6 s | oui |
| village.mp3 | Château / construction, gigue | Sol majeur | 6/8, 90 | 64,0 s | oui |
| grotte.mp3 | Exploration souterraine | Do♯ dorien | 4/4, 98 | 78,4 s | oui |
| raid.mp3 | Raid / boss | Fa♯ mineur | 7/8, 224 | 75,0 s | oui |
| victoire.mp3 | Fanfare de victoire | Mi♭ majeur | 4/4, 120 | 10,5 s | non (jingle) |
| defaite.mp3 | Défaite | Si mineur | 3/4, 60 | 11,5 s | non (jingle) |
