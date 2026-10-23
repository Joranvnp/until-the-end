# Publier Until The End sur TestFlight (iPhone / iPad)

L'appli iOS est un projet **Capacitor 8** (dossier `ios/`, Swift Package Manager, pas de CocoaPods) qui embarque le jeu web (`www/`).
Identifiant : `com.joranvnp.untiltheend` (le même que sur Android). Version **1.2.0**, build **3**.
Déjà créés le 2026-10-23 : l'identifiant de lot sur developer.apple.com et l'app « Until The End » sur App Store Connect (Team `BN6HZGJYZL`, réglé dans le projet).

Déjà réglé dans le projet :
- l'icône (1024 px, sans transparence) et l'écran de démarrage, générés par `npm run assets` ;
- la barre d'état masquée et le plein écran sur iPad ;
- la catégorie « Jeux de stratégie » ;
- `ITSAppUsesNonExemptEncryption = NO` (pas de question sur le chiffrement à chaque build) ;
- la zone sûre (Dynamic Island, barre d'accueil), gérée par le jeu.

## Prérequis (une seule fois)
1. Un compte **Apple Developer Program** (99 $/an) : <https://developer.apple.com/programs/>.
2. Xcode > **Settings > Accounts** : ajoute ton identifiant Apple et vérifie que ton équipe (Team) apparaît.
3. Sur <https://appstoreconnect.apple.com>, ouvre **Apps > +** puis **Nouvelle app** :
   - plateforme iOS, nom `Until The End` ;
   - identifiant de lot `com.joranvnp.untiltheend` (crée-le s'il n'existe pas : Xcode peut le faire à l'étape suivante) ;
   - SKU au choix, par exemple `until-the-end`.

## 1. Préparer le projet
```bash
npm install
npm run ios        # copie www/ dans l'appli iOS et ouvre Xcode
```
Dans Xcode, sélectionne la cible **App**, puis l'onglet **Signing & Capabilities** :
- coche **Automatically manage signing** ;
- choisis ton **Team**.

Xcode crée tout seul le certificat et le profil.

## 2. Tester sur ton iPhone (facultatif)
Branche l'iPhone, choisis-le en haut de la fenêtre Xcode, puis lance ▶︎.
Le mode développeur doit être activé : sur l'iPhone, **Réglages > Confidentialité et sécurité > Mode développeur**.

## 3. Construire et envoyer le build TestFlight
1. En haut de Xcode, choisis la destination **Any iOS Device (arm64)**.
2. Menu **Product > Archive**. L'archive s'ouvre dans l'**Organizer**.
3. Clique **Distribute App**, puis **TestFlight & App Store** (ou **App Store Connect > Upload**).
4. Laisse les options par défaut et clique **Upload**.

En ligne de commande, une fois ton identifiant Apple ajouté dans Xcode > Settings > Accounts :
```bash
npm run testflight # archive puis envoie le build sur App Store Connect
```
(`npm run ipa` fait seulement l'archive `ios/App/build/UntilTheEnd.xcarchive`.)

## 4. Inviter des testeurs
App Store Connect > ton app > **TestFlight**. Le build apparaît après 5 à 30 min de traitement.
- **Testeurs internes** (jusqu'à 100 membres de ton équipe) : ajoute-les, le build est disponible tout de suite.
- **Testeurs externes** (lien public) : crée un groupe et ajoute le build. Il faut remplir « Informations de test ». La première fois, Apple fait une courte vérification.

Sur l'iPhone, installe l'app **TestFlight** et accepte l'invitation.

## Chaque nouvelle version
1. Modifie le jeu dans `www/index.html`.
2. Augmente le **build** : Xcode > cible App > **General > Build** (4, 5, …). Apple refuse deux envois avec le même numéro. Change **Version** (1.2.1, 1.3.0, …) quand tu publies une vraie mise à jour.
3. Lance `npm run ios`, puis **Product > Archive**, puis **Distribute App**.

## À faire avant la vraie publication sur l'App Store
- **Retirer le menu Triche (dev)** : touche F9 ou 5 tapes sur le titre « Pause » (`drawCheatPanel` et `openCheat` dans `www/index.html`).
- Captures d'écran iPhone 6,9" (1320×2868 ou 2868×1320) et iPad 13" si l'iPad reste activé.
- Une URL de politique de confidentialité : le jeu ne collecte rien, déclare « Aucune donnée collectée ».
