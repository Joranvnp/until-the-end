import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export function GamePanel({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('border-2 border-edge bg-panel', className)} {...props} />;
}
