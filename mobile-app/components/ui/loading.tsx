import { useEffect, useState } from 'react';
import { ActivityIndicator, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { GameLogo } from '@/components/game/game-logo';
import { MenuBackdrop } from '@/components/game/menu-backdrop';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme-store';

export type LoadingSpinnerProps = {
  size?: 'small' | 'large';
  color?: string;
  className?: string;
};

export function LoadingSpinner({ size = 'large', color, className }: LoadingSpinnerProps) {
  const { colors } = useTheme();
  return <ActivityIndicator size={size} color={color ?? colors.foreground} className={className} />;
}

const SEGMENTS = 14;
const TIPS = [
  'Creuse vers les filons, le fer fait les meilleures épées.',
  'Ton cœur de base tient tant que le château tient.',
  'La lune de sang rend leurs vagues plus féroces.',
  'Une bombe ouvre un tunnel plus vite que dix coups de pioche.',
];

export type LoadingScreenProps = ViewProps & {
  className?: string;
};

// Game boot screen: the title art, the logo and a pixel bar that fills in steps.
export function LoadingScreen({ className, ...props }: LoadingScreenProps) {
  const [filled, setFilled] = useState(1);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  useEffect(() => {
    const id = setInterval(() => setFilled((n) => (n >= SEGMENTS ? SEGMENTS : n + 1)), 110);
    return () => clearInterval(id);
  }, []);

  return (
    <View className={cn('flex-1 bg-background', className)} {...props}>
      <MenuBackdrop dim={0.45} />
      <SafeAreaView className="flex-1 items-center justify-between px-8 py-10">
        <View />
        <GameLogo size="lg" />
        <View className="w-full max-w-[360px] items-center">
          <View className="w-full flex-row border-2 border-edge bg-panel p-[3px]">
            {Array.from({ length: SEGMENTS }).map((_, i) => (
              <View
                key={i}
                className={cn(
                  'mx-[1px] h-[14px] flex-1',
                  i < filled ? 'bg-primary' : 'bg-background'
                )}
              />
            ))}
          </View>
          <Text className="mt-3 font-pixel-bold text-[15px] uppercase tracking-[3px] text-foreground">
            Chargement...
          </Text>
          <Text className="mt-2 text-center font-sans text-[14px] text-muted-foreground">
            {tip}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
