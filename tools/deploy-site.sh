#!/bin/sh
# Publie le site vitrine (accueil, assistance, confidentialité) sur Vercel : https://until-the-end-game.vercel.app
# Les pages assistance/confidentialité viennent de www/ pour rester identiques à celles du jeu.
set -e
cd "$(dirname "$0")/.."
OUT=$(mktemp -d)
cp site/index.html www/assistance.html www/confidentialite.html "$OUT/"
mkdir -p "$OUT/icons" "$OUT/art"
cp www/icons/icon-192.png "$OUT/icons/"
cp www/art/menu.png "$OUT/art/"
cd "$OUT"
vercel link --yes --project until-the-end --scope joranvnps-projects >/dev/null
vercel deploy --prod --yes --scope joranvnps-projects
