import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useSignOut } from './use-sign-out';

export function AccountActions() {
  const router = useRouter();
  const confirmSignOut = useSignOut();

  return (
    <View className="px-6 pt-10">
      <Button
        variant="secondary"
        onPress={confirmSignOut}
        className="h-auto items-center rounded-none py-4">
        <Text className="font-pixel-bold text-[17px] text-destructive">Se déconnecter</Text>
      </Button>
      <Button
        variant="ghost"
        onPress={() => router.push('/(app)/delete-account')}
        className="mt-2 h-auto items-center rounded-none py-3">
        <Text className="font-pixel-bold text-[17px] text-destructive">Supprimer le compte</Text>
      </Button>
    </View>
  );
}
