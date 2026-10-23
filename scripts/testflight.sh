#!/bin/sh
# Archive puis envoie le build sur App Store Connect avec une clé d'API Apple (pas besoin de compte dans Xcode).
# Les identifiants de la clé sont lus dans ios/asc.env (non versionné), voir PUBLIER_TESTFLIGHT.md.
set -e
cd "$(dirname "$0")/.."
[ -f ios/asc.env ] || { echo "ios/asc.env manquant (ASC_KEY_PATH, ASC_KEY_ID, ASC_ISSUER_ID)"; exit 1; }
. ios/asc.env
AUTH="-allowProvisioningUpdates -authenticationKeyPath $ASC_KEY_PATH -authenticationKeyID $ASC_KEY_ID -authenticationKeyIssuerID $ASC_ISSUER_ID"
npx cap sync ios
cd ios/App
xcodebuild -project App.xcodeproj -scheme App -configuration Release -destination generic/platform=iOS -archivePath build/UntilTheEnd.xcarchive $AUTH archive
xcodebuild -exportArchive -archivePath build/UntilTheEnd.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath build/export $AUTH

# Une fois le build traité par Apple, le donner au groupe de testeurs internes « Moi » (outil asc, déjà connecté avec la même clé).
BUILD=$(grep -m1 'CURRENT_PROJECT_VERSION' App.xcodeproj/project.pbxproj | tr -dc '0-9')
command -v asc >/dev/null || { echo "asc absent : ajoute le build $BUILD au groupe « Moi » dans App Store Connect > TestFlight"; exit 0; }
echo "Attente du traitement du build $BUILD par Apple…"
for i in $(seq 60); do
  asc builds add-groups --app 6826313116 --build-number "$BUILD" --platform IOS --group Moi >/dev/null 2>&1 && { echo "Build $BUILD disponible dans TestFlight."; exit 0; }
  sleep 30
done
echo "Toujours en traitement : ajoute le build $BUILD au groupe « Moi » dans App Store Connect > TestFlight."
