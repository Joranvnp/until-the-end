import type { Tutorial } from './tutorials';

const AUTH_CLIENT_SNIPPET = `// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  plugins: [expoClient()],
});`;

const USE_AUTH_SNIPPET = `// lib/auth-store.tsx
const { email, userId, isAuthenticated, signOut } = useAuth();

// In any component:
if (!isAuthenticated) router.replace("/onboarding");`;

const CONVEX_SYNC_SNIPPET = `// convex/functions.ts - auth middleware
export const authQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await readUser(ctx); // throws if not authed
    return { user };
  }),
);`;

export const authTutorial: Tutorial = {
  slug: 'auth',
  title: 'How Auth Works',
  description: 'Email OTP + Apple Sign In',
  sections: [
    {
      title: 'Setup - better-auth',
      body: 'Auth runs via better-auth on Convex HTTP endpoints. The mobile app uses the better-auth React client with the Expo plugin for secure token storage.',
      code: { title: 'auth-client.ts', snippet: AUTH_CLIENT_SNIPPET },
    },
    {
      title: 'Email OTP flow',
      body: '1. User enters email\n2. POST /email-otp/send-verification-otp\n3. User enters 6-digit code\n4. POST /sign-in/email-otp\n5. better-auth sets session cookie / token\n6. useAuth() reflects authenticated state',
    },
    {
      title: 'Apple Sign In',
      body: 'Uses expo-apple-authentication to get an identity token, then passes it to better-auth via authClient.signIn.social(). Only available on iOS.',
    },
    {
      title: 'Convex auth middleware',
      body: 'Every protected Convex function uses authQuery / authMutation which injects the current user into ctx. Throws automatically if unauthenticated.',
      code: { title: 'functions.ts', snippet: CONVEX_SYNC_SNIPPET },
    },
    {
      title: 'useAuth() hook',
      body: 'Central auth state via Zustand. Syncs session from better-auth into the store. Use anywhere in the app.',
      code: { title: 'usage', snippet: USE_AUTH_SNIPPET },
    },
  ],
};
