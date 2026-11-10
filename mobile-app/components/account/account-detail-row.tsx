import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

type AccountDetailRowProps = {
  label: string;
  value: string;
  bordered?: boolean;
  mutedValue?: boolean;
  action?: ReactNode;
  onPress?: () => void;
  accessibilityHint?: string;
};

export function AccountDetailRow({
  label,
  value,
  bordered = false,
  mutedValue = false,
  action,
  onPress,
  accessibilityHint,
}: AccountDetailRowProps) {
  const className = cn('px-5 py-4', bordered && 'border-t border-border');
  const content = (
    <>
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-[13px] text-muted-foreground">{label}</Text>
        {action}
      </View>
      <Text className={cn('text-[17px]', mutedValue ? 'text-muted-foreground' : 'text-foreground')}>
        {value}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        className={cn(className, 'active:opacity-70')}>
        {content}
      </Pressable>
    );
  }

  return <View className={className}>{content}</View>;
}
