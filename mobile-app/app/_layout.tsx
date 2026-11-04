import '../global.css';

import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import { Stack, usePathname, useGlobalSearchParams } from 'expo-router';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useFonts } from 'expo-font';
import { PixelifySans_400Regular, PixelifySans_700Bold } from '@expo-google-fonts/pixelify-sans';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { AuthProvider } from '@/lib/auth-store';
import { GuestProvider } from '@/lib/guest-store';
import { AuthProvidersProvider } from '@/lib/auth-providers';
import { ThemeProvider } from '@/lib/theme-store';
import { authClient } from '@/lib/auth-client';
import { PostHogProvider } from 'posthog-react-native';
import { useEffect, useRef } from 'react';
import { posthog } from '@/lib/posthog';

cssInterop(ExpoImage, { className: 'style' });

if (__DEV__) {
  LogBox.ignoreAllLogs(true);
}

const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error('Missing EXPO_PUBLIC_CONVEX_URL');
}

const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
});

export default function RootLayout() {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);
  const [fontsLoaded] = useFonts({
    PixelifySans_400Regular,
    PixelifySans_700Bold,
    PressStart2P_400Regular,
  });

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...params,
      });
      previousPathname.current = pathname;
    }
  }, [pathname, params]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PostHogProvider
        client={posthog}
        autocapture={{
          captureScreens: false,
          captureTouches: true,
          propsToCapture: ['testID'],
        }}>
        <StripeProvider publishableKey={stripePublishableKey}>
          <ConvexProvider client={convex}>
            <ConvexBetterAuthProvider client={convex} authClient={authClient}>
              <AuthProvider>
                <GuestProvider>
                  <SafeAreaProvider>
                    {/* ThemeProvider owns the StatusBar + themed background. */}
                    <ThemeProvider>
                      <AuthProvidersProvider>
                        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
                      </AuthProvidersProvider>
                    </ThemeProvider>
                  </SafeAreaProvider>
                </GuestProvider>
              </AuthProvider>
            </ConvexBetterAuthProvider>
          </ConvexProvider>
        </StripeProvider>
      </PostHogProvider>
    </GestureHandlerRootView>
  );
}
