#!/bin/sh
# Publie le site vitrine (accueil, assistance, confidentialité) sur Vercel : https://until-the-end-game.vercel.app
# Tout le site est dans site/ ; seule l'illustration du menu vient des images du jeu.
set -e
cd "$(dirname "$0")/.."
OUT=$(mktemp -d)
cp site/index.html site/assistance.html site/confidentialite.html "$OUT/"
mkdir -p "$OUT/icons" "$OUT/art"
cp site/icons/icon-192.png "$OUT/icons/"
cp mobile-app/assets/art/menu.png "$OUT/art/"
cd "$OUT"
vercel link --yes --project until-the-end --scope joranvnps-projects >/dev/null
vercel deploy --prod --yes --scope joranvnps-projects
