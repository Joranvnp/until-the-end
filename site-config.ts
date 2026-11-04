export const SiteConfig = {
  title: "Until The End",
  description: "Mine, forge, recrute ton armée et détruis le cœur ennemi.",
  slug: "untiltheend",
  bundleId: "com.joranvnp.untiltheend",
  androidPackage: "com.joranvnp.untiltheend",
  appleTeamId: "BN6HZGJYZL",
  easProjectId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  version: "2.0.0",

  company: {
    name: "Joran Vanpeene",
    address: "France",
    email: "joran.vanpeene@gmail.com",
  },

  brand: {
    primary: "#ffe066",
    background: "#0b0a16",
    foreground: "#e4e9ff",
    muted: "#a0a4be",
    accent: "#4f9df5",
  },

  fonts: {
    serif: "System",
    sans: "System",
  },

  team: {
    name: "Joran Vanpeene",
    website: "https://until-the-end-game.vercel.app",
    twitter: "",
    image: "https://until-the-end-game.vercel.app/icone.png",
  },

  payment: {
    entitlementKey: "lifetime",
    currency: "usd",
    priceAmount: 299,
    priceDisplay: "$2.99",
    productIds: {
      apple: "com.joranvnp.untiltheend.pro",
      google: "com.joranvnp.untiltheend.pro",
      stripe: "untiltheend_lifetime",
    },
    providers: {
      ios: "apple_iap",
      android: "google_play",
      web: "stripe",
    },
    stripe: {
      priceEnvVar: "STRIPE_PRICE_ID",
      publishableKeyEnvVar: "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    },
    iapProductId: "com.joranvnp.untiltheend.pro",
  },

  urls: {
    website: "https://until-the-end-game.vercel.app",
    admin: "https://until-the-end-game.vercel.app/admin",
    app: "https://until-the-end-game.vercel.app/app",
    privacy: "https://until-the-end-game.vercel.app/privacy",
    terms: "https://until-the-end-game.vercel.app/cgv",
    appStore: "",
    playStore:
      "https://play.google.com/store/apps/details?id=com.joranvnp.untiltheend",
  },

  social: {
    links: /** @type {{ label: string; url: string; icon: string }[]} */ ([]),
  },

  auth: {
    trustedOrigins: /** @type {string[]} */ ([
      "untiltheend://",
      "https://until-the-end-game.vercel.app",
    ]),
    adminEmails: /** @type {string[]} */ (["joran.vanpeene@gmail.com"]),
  },

  features: {
    enablePaywall: /** @type {boolean} */ (true),
    enableOnboarding: /** @type {boolean} */ (true),
    enableAppleSignIn: /** @type {boolean} */ (true),
    enableGitHubSignIn: /** @type {boolean} */ (false),
    enableGoogleSignIn: /** @type {boolean} */ (true),
  },

  legal: {
    privacy: "Your privacy policy content here...",
    terms: "Your terms of service content here...",
  },
};
