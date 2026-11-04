export const SiteConfig = {
  title: "Until The End",
  slug: "untiltheend",
  bundleId: "com.joranvnp.untiltheend",
  androidPackage: "com.joranvnp.untiltheend",
  brand: {
    primary: "#ffe066",
  },
  team: {
    name: "Joran Vanpeene",
  },
  company: {
    contactEmail: "joran.vanpeene@gmail.com",
  },
  auth: {
    // Must mirror site-config.ts > auth.trustedOrigins (scripts/check-setup.mjs verifies).
    trustedOrigins: [
      "untiltheend://",
      "https://until-the-end-game.vercel.app",
    ] as string[],
  },
  // Mirror site-config.ts > features. Used by getEnabledAuthProviders to decide
  // which social sign-in buttons the clients may render.
  features: {
    enablePaywall: true,
    enableOnboarding: true,
    enableAppleSignIn: true,
    enableGitHubSignIn: false,
    enableGoogleSignIn: true,
  },
  payment: {
    entitlementKey: "lifetime",
    currency: "usd",
    priceAmount: 299,
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
    },
  },
};
