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
