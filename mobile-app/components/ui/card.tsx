import { type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { cva, type VariantProps } from '@/lib/cva';
import { cn } from '@/lib/utils';

const cardVariants = cva('overflow-hidden rounded-none', {
  variants: {
    variant: {
      default: 'border border-border bg-card',
      secondary: 'bg-secondary',
      outline: 'border border-border bg-background',
      ghost: 'bg-transparent',
      elevated: 'border border-border bg-card shadow-sm',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type CardProps = ViewProps &
  VariantProps<typeof cardVariants> & {
    className?: string;
    children?: ReactNode;
  };

export function Card({ className, variant, ...props }: CardProps) {
  return <View className={cn(cardVariants({ variant }), className)} {...props} />;
}

export function CardHeader({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('px-5 pb-2 pt-4', className)} {...props} />;
}

export function CardContent({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('px-5 py-3', className)} {...props} />;
}

export function CardFooter({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('flex-row items-center px-5 pb-4 pt-2', className)} {...props} />;
}

export { cardVariants };
