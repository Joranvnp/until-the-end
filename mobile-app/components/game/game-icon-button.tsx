import { Pressable, type PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/theme-store';
import { cn } from '@/lib/utils';

type IoniconName = keyof typeof Ionicons.glyphMap;

export type GameIconButtonProps = Omit<PressableProps, 'children'> & {
  icon: IoniconName;
  /** Lu par VoiceOver, et affiché sous l'icône quand `showLabel` est vrai. */
  label: string;
  showLabel?: boolean;
  className?: string;
};

// Small square corner button (settings, help, back), like the HUD buttons of
// Stardew Valley or Terraria on mobile.
export function GameIconButton({
  icon,
  label,
  showLabel = false,
  className,
  ...props
}: GameIconButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      className={cn(
        'min-h-[48px] min-w-[48px] items-center justify-center border-2 border-edge bg-panel px-2 active:opacity-70',
        className
      )}
      {...props}>
      <Ionicons name={icon} size={22} color={colors.foreground} />
      {showLabel && (
        <Text className="mt-0.5 font-pixel text-[11px] uppercase text-muted-foreground">
          {label}
        </Text>
      )}
    </Pressable>
  );
}
