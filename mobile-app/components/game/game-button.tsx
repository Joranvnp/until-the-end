import { Pressable, View, type PressableProps } from 'react-native';
import { Text } from '@/components/ui/text';
import { cva, type VariantProps } from '@/lib/cva';
import { cn } from '@/lib/utils';

// Square pixel panel button, like the web menu: dark fill, thin light edge,
// gold "hero" variant for the main action, red for the dangerous ones.
const panelVariants = cva(
  'w-full flex-row items-center border-2 active:opacity-80 disabled:opacity-50',
  {
    variants: {
      variant: {
        hero: 'border-primary bg-hero',
        panel: 'border-edge bg-panel',
        ally: 'border-ally bg-panel',
        danger: 'border-destructive bg-panel',
      },
      size: {
        lg: 'min-h-[64px] px-5 py-3',
        md: 'min-h-[52px] px-4 py-2',
      },
    },
    defaultVariants: { variant: 'panel', size: 'md' },
  }
);

const labelVariants = cva('font-pixel-bold uppercase tracking-[2px]', {
  variants: {
    variant: {
      hero: 'text-primary',
      panel: 'text-foreground',
      ally: 'text-foreground',
      danger: 'text-destructive',
    },
    size: { lg: 'text-[22px]', md: 'text-[17px]' },
  },
  defaultVariants: { variant: 'panel', size: 'md' },
});

const accentVariants = cva('mr-3 w-[4px] self-stretch', {
  variants: {
    variant: {
      hero: 'bg-primary',
      panel: 'bg-edge',
      ally: 'bg-ally',
      danger: 'bg-destructive',
    },
  },
  defaultVariants: { variant: 'panel' },
});

export type GameButtonProps = Omit<PressableProps, 'children'> &
  VariantProps<typeof panelVariants> & {
    label: string;
    sublabel?: string;
    icon?: React.ReactNode;
    className?: string;
  };

export function GameButton({
  label,
  sublabel,
  icon,
  variant,
  size,
  className,
  ...props
}: GameButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(panelVariants({ variant, size }), className)}
      {...props}>
      <View className={accentVariants({ variant })} />
      {icon && <View className="mr-3">{icon}</View>}
      <View className="flex-1">
        <Text className={labelVariants({ variant, size })}>{label}</Text>
        {sublabel && (
          <Text className="mt-0.5 font-pixel text-[13px] text-muted-foreground">{sublabel}</Text>
        )}
      </View>
    </Pressable>
  );
}
