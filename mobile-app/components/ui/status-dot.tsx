import { View, type ViewProps } from 'react-native';
import { cva, type VariantProps } from '@/lib/cva';
import { cn } from '@/lib/utils';

const statusDotVariants = cva('rounded-full', {
  variants: {
    status: {
      completed: 'bg-emerald-500',
      processing: 'bg-amber-400',
      failed: 'bg-red-500',
      pending: 'bg-neutral-400',
    },
    size: {
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-2.5 w-2.5',
    },
  },
  defaultVariants: {
    status: 'pending',
    size: 'sm',
  },
});

export type StatusDotStatus = NonNullable<VariantProps<typeof statusDotVariants>['status']>;

export type StatusDotProps = ViewProps &
  VariantProps<typeof statusDotVariants> & {
    className?: string;
  };

export function StatusDot({ className, status, size, ...props }: StatusDotProps) {
  return <View className={cn(statusDotVariants({ status, size }), className)} {...props} />;
}

export function getStatusDotStatus(status: string | undefined): StatusDotStatus {
  const valid: StatusDotStatus[] = ['completed', 'processing', 'failed', 'pending'];
  return valid.includes(status as StatusDotStatus) ? (status as StatusDotStatus) : 'pending';
}

export { statusDotVariants };
