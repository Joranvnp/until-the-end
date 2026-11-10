import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

// Same lockup as the web title screen: "UNTIL THE" in pale blue-white, "END" in red,
// the tagline under a small red diamond.
export function GameLogo({
  size = 'lg',
  tagline = true,
}: {
  size?: 'md' | 'lg';
  tagline?: boolean;
}) {
  const big = size === 'lg';
  return (
    <View className="items-center">
      <Text
        className={cn(
          'text-center font-title text-foreground',
          big ? 'text-[26px] leading-[38px]' : 'text-[18px] leading-[28px]'
        )}
        style={{ textShadowColor: '#7F9BFF', textShadowRadius: 10 }}>
        {'UNTIL THE '}
        <Text
          className={cn('font-title text-destructive', big ? 'text-[26px]' : 'text-[18px]')}
          style={{ textShadowColor: '#FF6A5A', textShadowRadius: 10 }}>
          END
        </Text>
      </Text>
      {tagline && (
        <View className="mt-3 items-center">
          <View className="mb-2 h-[6px] w-[6px] rotate-45 bg-destructive" />
          <Text className="text-center font-pixel text-[15px] uppercase tracking-[2px] text-muted-foreground">
            Mine. Forge. Détruis leur cœur.
          </Text>
        </View>
      )}
    </View>
  );
}
