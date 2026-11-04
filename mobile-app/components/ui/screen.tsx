import { type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';

export type ScreenProps = ViewProps & {
  className?: string;
  insetTop?: number;
  padded?: boolean;
  children?: ReactNode;
};

export function Screen({
  className,
  insetTop = 8,
  padded = false,
  style,
  children,
  ...props
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={cn('flex-1 bg-background', padded && 'px-6', className)}
      style={[{ paddingTop: insets.top + insetTop }, style]}
      {...props}>
      {children}
    </View>
  );
}
