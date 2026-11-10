import { type ReactNode } from 'react';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme-store';

export type HeaderProps = ViewProps & {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  trailing?: ReactNode;
  className?: string;
  children?: ReactNode;
};

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18L9 12L15 6"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Header({
  title,
  subtitle,
  onBack,
  showBack = true,
  trailing,
  className,
  children,
  ...props
}: HeaderProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const handleBack = onBack ?? (() => router.back());

  return (
    <View className={cn('flex-row items-center gap-3 px-6 pb-3', className)} {...props}>
      {showBack && (
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={12}
          style={({ pressed }) => [
            {
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              shadowColor: colors.foreground,
              shadowOpacity: 0.06,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: 1,
            },
            pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
          ]}>
          <BackIcon color={colors.foreground} />
        </Pressable>
      )}
      <View className="flex-1">
        {title && (
          <Text className="font-pixel-bold text-[17px] text-foreground" numberOfLines={1}>
            {title}
          </Text>
        )}
        {subtitle && <Text className="text-[12px] text-muted-foreground">{subtitle}</Text>}
        {children}
      </View>
      {trailing && <View className="flex-row items-center gap-2">{trailing}</View>}
    </View>
  );
}
