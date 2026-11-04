import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GameLogo } from '@/components/game/game-logo';
import { MenuBackdrop } from '@/components/game/menu-backdrop';
import { useTheme } from '@/lib/theme-store';

export function PaywallHero({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View className="relative h-[260px] overflow-hidden">
      <MenuBackdrop dim={0.35} />
      <View className="absolute inset-x-0 bottom-6 items-center">
        <GameLogo size="md" tagline={false} />
      </View>
      <View className="absolute inset-x-0 bottom-0 h-[6px] bg-background" />
      <Pressable
        onPress={onClose}
        accessibilityLabel="Fermer"
        className="absolute right-5 z-10 size-9 items-center justify-center border-2 border-edge bg-panel"
        style={{ top: insets.top + 8 }}>
        <Ionicons name="close" size={18} color={colors.foreground} />
      </Pressable>
    </View>
  );
}
