import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { useAuth } from '@/lib/auth-store';

export function useSignOut() {
  const router = useRouter();
  const posthog = usePostHog();
  const { signOut } = useAuth();

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          posthog.capture('user_logged_out');
          await signOut();
          router.replace('/onboarding');
        },
      },
    ]);
  };

  return confirmSignOut;
}
