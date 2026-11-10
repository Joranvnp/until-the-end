import { Text, View, type ViewProps } from 'react-native';
import { cva, type VariantProps } from '@/lib/cva';
import { cn } from '@/lib/utils';

const badgeVariants = cva('rounded-none px-2 py-0.5', {
  variants: {
    variant: {
      default: 'bg-background/90',
      success: 'bg-emerald-500',
      warning: 'bg-amber-500/90',
      info: 'bg-blue-500/90',
      destructive: 'bg-red-500',
      muted: 'bg-background/70',
      accent: 'bg-primary',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const badgeTextVariants = cva('text-[10px] font-pixel-bold', {
  variants: {
    variant: {
      default: 'text-foreground',
      success: 'text-white',
      warning: 'text-white',
      info: 'text-white',
      destructive: 'text-white',
      muted: 'text-muted-foreground',
      accent: 'text-primary-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type BadgeProps = ViewProps &
  VariantProps<typeof badgeVariants> & {
    label: string;
    className?: string;
    textClassName?: string;
  };

export function Badge({ className, textClassName, variant, label, ...props }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)} {...props}>
      <Text className={cn(badgeTextVariants({ variant }), textClassName)}>{label}</Text>
    </View>
  );
}

export { badgeVariants, badgeTextVariants };
