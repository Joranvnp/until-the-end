# Publier Until The End sur le Google Play Store

L'appli Android est un projet **Capacitor 8** (dossier `android/`) qui embarque le jeu web (`www/`).
Identifiant de l'appli : `com.joranvnp.untiltheend` (modifiable dans `capacitor.config.json` **avant** la première publication, plus jamais ensuite).

## 1. Récupérer une version de test (APK)
À chaque push sur `main`, GitHub Actions construit l'appli (onglet **Actions** > workflow **Android**).
Télécharge l'artefact `until-the-end-debug-apk`, dézippe et installe l'APK sur ton téléphone
(autoriser « sources inconnues »). C'est la façon la plus rapide de tester sur un vrai téléphone.

## 2. Créer la clé de signature (une seule fois, à garder précieusement)
Sur ton ordinateur (Java installé) :
```bash
keytool -genkeypair -v -keystore until-the-end-upload.jks -alias upload \
  -keyalg RSA -keysize 2048 -validity 10000
```
Note le mot de passe. **Ne mets jamais ce fichier dans le dépôt** (il est ignoré par `.gitignore`).
Sauvegarde-le (clé USB, gestionnaire de mots de passe) : sans lui, plus de mise à jour possible
(sauf réinitialisation via le support Play, avec la « signature d'application par Google Play » activée).

## 3. Donner la clé à GitHub Actions
Dépôt GitHub > **Settings > Secrets and variables > Actions > New repository secret** :

| Secret | Valeur |
|---|---|
| `UTE_KEYSTORE_BASE64` | contenu de `base64 -w0 until-the-end-upload.jks` (macOS : `base64 -i until-the-end-upload.jks`) |
| `UTE_KEYSTORE_PASSWORD` | mot de passe du keystore |
| `UTE_KEY_ALIAS` | `upload` |
| `UTE_KEY_PASSWORD` | mot de passe de la clé (souvent le même) |

Relance le workflow **Android** (Actions > Android > Run workflow) : l'artefact
`until-the-end-release-aab` contient le fichier **.aab signé** à envoyer au Play Store.

> Construire en local à la place : installe Android Studio, crée `android/keystore.properties` :
> ```
> storeFile=/chemin/until-the-end-upload.jks
> storePassword=...
> keyAlias=upload
> keyPassword=...
> ```
> puis `npm ci && npm run aab` → `android/app/build/outputs/bundle/release/app-release.aab`.

## 4. Play Console
1. Crée un compte développeur sur https://play.google.com/console (25 $, une fois). Un compte **personnel**
   récent doit faire un **test fermé avec au moins 12 testeurs pendant 14 jours** avant la production.
2. **Créer une application** : nom « Until The End », langue français, *Jeu*, *Gratuit*.
3. **Fiche du Play Store** : textes prêts dans `store/FICHE_PLAY_STORE.md`, images dans `store/`
   (icône 512, bannière 1024×500, captures 1080×1920).
4. **Contenu de l'appli** :
   - Règles de confidentialité : URL de `confidentialite.html` (voir § 6) ;
   - Accès à l'appli : tout est accessible sans connexion ;
   - Annonces : non ; Sécurité des données : *aucune donnée collectée ni partagée* ;
   - Classification du contenu : questionnaire IARC (violence fantastique légère, pixel art) ;
   - Public cible : 13 ans et plus conseillé (évite les exigences « Familles »).
5. **Tests > Test fermé** : crée une version, envoie le `.aab`, ajoute tes testeurs (adresses Gmail).
6. Après 14 jours / 12 testeurs : **Production > Créer une version** avec le même `.aab` (ou un plus récent).

## 5. Mettre à jour l'appli
Augmente `versionCode` (entier, +1 à chaque envoi) et `versionName` dans `android/app/build.gradle`,
ainsi que `VERSION` dans `www/index.html` et `CACHE` dans `www/sw.js`, puis pousse sur `main`.

## 6. Version web et politique de confidentialité en ligne
Settings > Pages > Source : **GitHub Actions**, puis ajoute la variable de dépôt `WEB_PAGES` = `on`
(Settings > Secrets and variables > Actions > Variables). Le jeu sera jouable sur
`https://joranvnp.github.io/until-the-end/` et la politique sur `…/confidentialite.html` (URL à donner au Play Store).

## 7. Régénérer icônes, écran de démarrage et visuels
`npm run art` (dessine à partir des sprites du jeu) puis `npm run assets` (icônes Android toutes tailles).
