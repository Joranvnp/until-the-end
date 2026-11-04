import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth-store';
import { useGuest } from '@/lib/guest-store';
import { useStoreDemoMode } from '@/lib/store-demo';
import { useTheme } from '@/lib/theme-store';
import { LoadingScreen } from '@/components/ui/loading';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isGuest, isGuestLoading } = useGuest();
  const isStoreDemo = useStoreDemoMode();
  const { colors } = useTheme();

  if ((isLoading || isGuestLoading) && !isStoreDemo) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated && !isGuest && !isStoreDemo) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
