import { useGlobalSearchParams } from 'expo-router';

const STORE_DEMO_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_STORE_SCREENSHOTS === '1';

export function useStoreDemoMode() {
  const params = useGlobalSearchParams<{ storeDemo?: string }>();
  return (
    STORE_DEMO_ENABLED &&
    (process.env.EXPO_PUBLIC_STORE_SCREENSHOTS === '1' || params.storeDemo === '1')
  );
}
