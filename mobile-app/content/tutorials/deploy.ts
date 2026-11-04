import type { Tutorial } from './tutorials';

const EAS_SNIPPET = `# Build for iOS (TestFlight)
cd mobile-app
eas build --platform ios --profile preview

# Build for production
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios`;

const CONVEX_SNIPPET = `# Deploy Convex functions + schema
cd nowstack
npx convex deploy

# Or during development (watches for changes)
npx convex dev`;

const VERCEL_SNIPPET = `# Deploy web app
cd web-app
vercel --prod`;

const ENV_SNIPPET = `# mobile-app/.env.local
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
EXPO_PUBLIC_API_URL=https://your-api.convex.site
EXPO_PUBLIC_POSTHOG_KEY=phc_xxxx

# Convex dashboard env vars
APPLE_SHARED_SECRET=xxxx
STRIPE_SECRET_KEY=sk_live_xxxx
LUMAIL_API_KEY=lum_xxxx`;

export const deployTutorial: Tutorial = {
  slug: 'deploy',
  title: 'How to Deploy',
  description: 'EAS, Convex, Vercel',
  sections: [
    {
      title: 'Environment variables',
      body: 'Set up env vars before deploying. Mobile app vars are prefixed EXPO_PUBLIC_. Convex secrets go in the Convex dashboard, never in code.',
      code: { title: '.env.local', snippet: ENV_SNIPPET },
    },
    {
      title: 'Convex backend',
      body: 'Deploy Convex first - the mobile app and admin depend on it. Schema changes are applied automatically.',
      code: { title: 'terminal', snippet: CONVEX_SNIPPET },
    },
    {
      title: 'Mobile app - EAS Build',
      body: 'EAS Build compiles the native app in the cloud. Use preview profile for TestFlight, production for App Store submission. Configure eas.json for each profile.',
      code: { title: 'terminal', snippet: EAS_SNIPPET },
    },
    {
      title: 'Web app - Vercel',
      body: 'The web app deploys landing, legal pages, the user app, and admin dashboard together. Set env vars in the Vercel dashboard.',
      code: { title: 'terminal', snippet: VERCEL_SNIPPET },
    },
  ],
};
