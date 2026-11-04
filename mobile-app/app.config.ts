// @ts-nocheck -- Must stay plain JavaScript: EAS Build evaluates this file on a Node
// runtime during the "Read app config" phase, so it cannot contain TS-only syntax
// (no `import type`, parameter/return annotations, or `as` casts). Anything imported
// here (e.g. ../site-config.ts) must also avoid non-plain-JS TypeScript syntax.
import { SiteConfig } from '../site-config.ts';

const easProjectId =
  SiteConfig.easProjectId && !SiteConfig.easProjectId.startsWith('xxxxxxxx')
    ? SiteConfig.easProjectId
    : undefined;

const expoConfig = (ctx) => ({
  ...ctx.config,
  name: SiteConfig.title,
  slug: SiteConfig.slug,
  version: SiteConfig.version,
  scheme: SiteConfig.slug,
  platforms: ['ios', 'android'],
  plugins: [
    'expo-router',
    'expo-web-browser',
    'expo-font',
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: false,
          useLegacyPackaging: false,
        },
        ios: {
          deploymentTarget: '15.1',
        },
      },
    ],
    ['./plugins/with-android-ndk-version', { version: '28.0.13004108' }],
    [
      '@stripe/stripe-react-native',
      {
        enableGooglePay: true,
      },
    ],
    [
      'expo-secure-store',
      {
        faceIDPermission: false,
      },
    ],
    'expo-iap',
    'expo-apple-authentication',
    // Son du jeu (Web Audio natif) : pas de lecture en arrière-plan ni de micro.
    [
      'react-native-audio-api',
      {
        iosBackgroundMode: false,
        androidForegroundService: false,
        androidPermissions: [],
      },
    ],
    './plugins/with-storekit-config',
    './plugins/with-pods-deployment-target',
    './plugins/with-quoted-bundle-phase',
  ],
  experiments: {
    typedRoutes: true,
    tsconfigPaths: true,
  },
  // Le jeu se joue en portrait comme en paysage, sur téléphone et tablette.
  orientation: 'default',
  icon: './assets/icon.png',
  // Thème unique sombre : le jeu n'a pas de version claire.
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: SiteConfig.brand.background,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    requireFullScreen: false,
    bundleIdentifier: SiteConfig.bundleId,
    usesAppleSignIn: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    appleTeamId: SiteConfig.appleTeamId,
  },
  android: {
    package: SiteConfig.androidPackage ?? SiteConfig.bundleId,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundImage: './assets/adaptive-icon-background.png',
      backgroundColor: SiteConfig.brand.background,
    },
    permissions: [],
    blockedPermissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.READ_MEDIA_AUDIO',
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.SYSTEM_ALERT_WINDOW',
    ],
  },
  extra: {
    router: {},
    ...(easProjectId ? { eas: { projectId: easProjectId } } : {}),
    posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
    posthogHost: process.env.POSTHOG_HOST,
  },
});

export default expoConfig;
