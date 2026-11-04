import { createAuthClient } from 'better-auth/react';
import { convexClient } from '@convex-dev/better-auth/client/plugins';
import { emailOTPClient } from 'better-auth/client/plugins';
import { expoClient } from '@better-auth/expo/client';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

console.log('[AUTH-CLIENT] baseURL:', process.env.EXPO_PUBLIC_CONVEX_SITE_URL);

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_CONVEX_SITE_URL,
  plugins: [
    expoClient({
      scheme: Constants.expoConfig?.scheme as string,
      storagePrefix: Constants.expoConfig?.scheme as string,
      storage: SecureStore,
    }),
    emailOTPClient(),
    convexClient(),
  ],
});
