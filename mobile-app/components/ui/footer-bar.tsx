import { type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';

export type FooterBarProps = ViewProps & {
  className?: string;
  bottomOffset?: number;
  respectSafeArea?: boolean;
  children?: ReactNode;
};

export function FooterBar({
  className,
  bottomOffset = 12,
  respectSafeArea = false,
  style,
  children,
  ...props
}: FooterBarProps) {
  const insets = useSafeAreaInsets();
  const paddingBottom = (respectSafeArea ? insets.bottom : 0) + bottomOffset;

  return (
    <View
      className={cn('border-t border-border bg-background px-6 pt-3', className)}
      style={[{ paddingBottom }, style]}
      {...props}>
      {children}
    </View>
  );
}
