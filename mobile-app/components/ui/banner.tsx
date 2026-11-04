import { type ReactNode } from 'react';
import { Text, View, type ViewProps } from 'react-native';
import { cva, type VariantProps } from '@/lib/cva';
import { cn } from '@/lib/utils';

const bannerVariants = cva('rounded-none px-5 py-4', {
  variants: {
    variant: {
      info: 'border border-emerald-200 bg-emerald-50',
      warning: 'border border-amber-200 bg-amber-50',
      error: 'border border-red-200 bg-red-50',
      neutral: 'bg-secondary',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

const bannerTitleVariants = cva('mb-1 font-pixel-bold text-[15px]', {
  variants: {
    variant: {
      info: 'text-emerald-800',
      warning: 'text-amber-900',
      error: 'text-red-800',
      neutral: 'text-foreground',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

const bannerDescriptionVariants = cva('font-sans text-[13px] leading-[19px]', {
  variants: {
    variant: {
      info: 'text-emerald-700',
      warning: 'text-amber-700',
      error: 'text-red-700',
      neutral: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

export type BannerProps = ViewProps &
  VariantProps<typeof bannerVariants> & {
    icon?: string;
    title?: string;
    description?: string;
    centered?: boolean;
    className?: string;
    children?: ReactNode;
  };

export function Banner({
  className,
  variant,
  icon,
  title,
  description,
  centered,
  children,
  ...props
}: BannerProps) {
  return (
    <View
      className={cn(bannerVariants({ variant }), centered && 'items-center', className)}
      {...props}>
      {icon && <Text className="mb-1 text-3xl">{icon}</Text>}
      {title && (
        <Text className={cn(bannerTitleVariants({ variant }), centered && 'text-center')}>
          {title}
        </Text>
      )}
      {description && (
        <Text className={cn(bannerDescriptionVariants({ variant }), centered && 'text-center')}>
          {description}
        </Text>
      )}
      {children}
    </View>
  );
}

export { bannerVariants, bannerTitleVariants, bannerDescriptionVariants };
