import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { SiteConfig } from '@site-config';
import { useAuth } from '@/lib/auth-store';
import { useGuest } from '@/lib/guest-store';
import { useStoreDemoMode } from '@/lib/store-demo';
import { LoadingScreen } from '@/components/ui/loading';

// Keep the loading screen up long enough to read, once per app launch.
const MIN_BOOT_MS = 1600;
let bootShown = false;

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isGuest, isGuestLoading } = useGuest();
  const isStoreDemo = useStoreDemoMode();
  const [booted, setBooted] = useState(bootShown);
  const shouldEnforcePaywall = !isStoreDemo && !__DEV__ && SiteConfig.features.enablePaywall;
  const entitlement = useQuery(
    api.payments.entitlements.getMine,
    isAuthenticated && shouldEnforcePaywall ? {} : 'skip'
  );

  useEffect(() => {
    if (booted) return;
    const id = setTimeout(() => {
      bootShown = true;
      setBooted(true);
    }, MIN_BOOT_MS);
    return () => clearTimeout(id);
  }, [booted]);

  if (
    !booted ||
    (!isStoreDemo &&
      (isLoading ||
        isGuestLoading ||
        (isAuthenticated && shouldEnforcePaywall && entitlement === undefined)))
  ) {
    return <LoadingScreen />;
  }

  if (isStoreDemo) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  if (isAuthenticated) {
    if (shouldEnforcePaywall && !entitlement?.active) {
      return <Redirect href="/(flow)/paywall" />;
    }

    return <Redirect href="/(app)/(tabs)/home" />;
  }

  if (isGuest) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  return <Redirect href="/onboarding" />;
}
