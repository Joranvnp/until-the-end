# Publier Until The End sur l'App Store (iPhone et iPad)

L'appli iOS est un projet **Capacitor 8** (dossier `ios/`) qui embarque le même jeu web (`www/`) que la version Android.
Identifiant (bundle ID) : `com.joranvnp.untiltheend` — le même que sur Android.

**Pas besoin de Mac** : GitHub Actions construit l'appli sur un Mac dans le cloud et l'envoie sur TestFlight.
(Avec un Mac, tu peux aussi tout faire dans Xcode : `npm ci && npm run ios`, puis *Product > Archive*.)

## Ce qui est automatique
À chaque push sur `main`, le workflow **iOS** (onglet Actions) compile l'appli pour le simulateur :
ça vérifie que le projet iOS est sain. L'envoi sur TestFlight se lance à la main (étape 4).

## 1. Compte Apple Developer
Inscris-toi sur https://developer.apple.com/programs/ (99 € par an). En tant que particulier,
ton nom apparaîtra comme vendeur sur l'App Store. La validation prend de quelques heures à 2 jours.

## 2. Créer l'appli dans App Store Connect
1. https://developer.apple.com/account/resources/identifiers : **Identifiers > +** > App IDs > App,
   Bundle ID explicite `com.joranvnp.untiltheend`, aucune capacité particulière à cocher.
2. https://appstoreconnect.apple.com : **Apps > + > Nouvelle app** : plateforme iOS, nom « Until The End »,
   langue principale Français, le bundle ID ci-dessus, SKU `until-the-end`.

## 3. Clé d'API pour GitHub Actions
App Store Connect > **Utilisateurs et accès > Intégrations > Clés d'API App Store Connect** > Générer :
nom « GitHub », accès **Admin** (nécessaire pour que Xcode crée tout seul les certificats de signature).
Télécharge le fichier `AuthKey_XXXX.p8` (une seule fois possible !) et note l'**ID de la clé** et l'**ID de l'émetteur**.

Puis dans le dépôt GitHub > **Settings > Secrets and variables > Actions > New repository secret** :

| Secret | Valeur |
|---|---|
| `ASC_KEY_ID` | ID de la clé (10 caractères) |
| `ASC_ISSUER_ID` | ID de l'émetteur (format UUID) |
| `ASC_KEY_P8` | tout le contenu du fichier `.p8` (de `-----BEGIN PRIVATE KEY-----` à `-----END…`) |
| `APPLE_TEAM_ID` | ton Team ID (https://developer.apple.com/account > Membership details) |

## 4. Envoyer une version sur TestFlight
Actions > **iOS** > **Run workflow** (case « Envoyer sur TestFlight » cochée).
Après ~15 min de traitement chez Apple, la version apparaît dans App Store Connect > TestFlight.
Installe l'appli **TestFlight** sur ton iPhone pour la tester ; tu peux inviter jusqu'à 10 000 testeurs.
Le numéro de build augmente tout seul à chaque lancement.

## 5. Fiche App Store (App Store Connect > ton app > Distribution)
- **Sous-titre (30 car.)** : Mine, forge et détruis leur cœur
- **Texte promotionnel (170 car.)** : Nouveau : défi du jour, mode Siège à vagues infinies et reliques à collectionner !
- **Description** : reprends celle de `store/FICHE_PLAY_STORE.md`.
- **Mots-clés (100 car.)** : `pixel,minage,stratégie,bac à sable,terraria,armée,château,hors ligne,rétro,survie`
- **URL d'assistance** : https://joranvnp.github.io/until-the-end/assistance.html
- **URL de confidentialité** : https://joranvnp.github.io/until-the-end/confidentialite.html (voir GitHub Pages dans `PUBLIER_PLAY_STORE.md`)
- **Catégorie** : Jeux > Stratégie (secondaire : Action)
- **Captures** : `store/ios/iphone-6.9-*.png` (iPhone 6,9", 1320 × 2868) et `store/ios/ipad-13-*.png`
  (iPad 13", 2064 × 2752) ; versions anglaises dans `store/en/ios/`.
- **Confidentialité de l'app** : « Données non collectées ».
- **Classification par âge** : questionnaire — violence de dessin animé ou fantastique : « Rare/légère » ; le reste : Aucun.
- **Prix** : gratuit. **Chiffrement** : déjà déclaré « aucun » dans l'appli (`ITSAppUsesNonExemptEncryption`).

Ensuite, choisis le build envoyé par TestFlight dans la version, puis **Soumettre pour vérification**
(réponse d'Apple en général sous 24 à 48 h).

## 6. Mettre à jour
Change `MARKETING_VERSION` (ex. 1.2.0) dans `ios/App/App.xcodeproj/project.pbxproj` (et la version Android,
voir `PUBLIER_PLAY_STORE.md`), pousse sur `main`, puis relance l'étape 4.

## Spécificités iOS déjà gérées dans le jeu
- Jeu dans la zone sûre (rien sous l'encoche ni sous la barre d'accueil), barre de statut masquée.
- Son relancé après un appel ou un verrouillage (iOS suspend l'audio), pause + sauvegarde quand on quitte l'appli.
- Vibrations par le moteur haptique de l'iPhone ; partage par la feuille de partage iOS.
- Icône sans transparence (exigence Apple), écran de démarrage sombre, iPhone et iPad, portrait et paysage.
