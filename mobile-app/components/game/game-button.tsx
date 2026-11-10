import { Pressable, View, type PressableProps } from 'react-native';
import { Text } from '@/components/ui/text';
import { PixelFrame } from '@/components/game/pixel-frame';
import { cva, type VariantProps } from '@/lib/cva';
import { cn } from '@/lib/utils';

// Content layout per size; the frame itself (outline, bevel, shadow) is PixelFrame.
const contentVariants = cva('flex-row items-center', {
  variants: {
    variant: { hero: '', panel: '', ally: '', danger: '' },
    size: {
      lg: 'min-h-[64px] px-6 py-3',
      md: 'min-h-[52px] px-5 py-2',
    },
  },
  defaultVariants: { variant: 'panel', size: 'md' },
});

const labelVariants = cva('font-pixel-bold uppercase tracking-[2px]', {
  variants: {
    variant: {
      hero: 'text-hero-foreground',
      panel: 'text-foreground',
      ally: 'text-foreground',
      danger: 'text-foreground',
    },
    size: { lg: 'text-[22px]', md: 'text-[17px]' },
  },
  defaultVariants: { variant: 'panel', size: 'md' },
});

const sublabelVariants = cva('mt-0.5 font-pixel text-[13px]', {
  variants: {
    variant: {
      hero: 'text-hero-foreground opacity-75',
      panel: 'text-muted-foreground',
      ally: 'text-foreground opacity-75',
      danger: 'text-foreground opacity-75',
    },
  },
  defaultVariants: { variant: 'panel' },
});

export type GameButtonProps = Omit<PressableProps, 'children'> &
  VariantProps<typeof contentVariants> & {
    label: string;
    sublabel?: string;
    icon?: React.ReactNode;
    className?: string;
  };

// Pixel-art menu button: gold "hero" for the main action, blue for the player's
// side, red for dangerous ones, slate for the rest.
export function GameButton({
  label,
  sublabel,
  icon,
  variant,
  size,
  className,
  disabled,
  ...props
}: GameButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      className={cn('w-full', disabled && 'opacity-50', className)}
      {...props}>
      {({ pressed }) => (
        <PixelFrame
          tone={variant ?? 'panel'}
          pressed={pressed}
          contentClassName={contentVariants({ variant, size })}>
          {icon && <View className="mr-3">{icon}</View>}
          <View className="flex-1">
            <Text className={labelVariants({ variant, size })}>{label}</Text>
            {sublabel && <Text className={sublabelVariants({ variant })}>{sublabel}</Text>}
          </View>
        </PixelFrame>
      )}
    </Pressable>
  );
}
