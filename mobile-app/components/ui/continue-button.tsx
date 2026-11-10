import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme-store';

type ContinueButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
  loading?: boolean;
};

export function ContinueButton({
  onPress,
  disabled = false,
  label = 'Next',
  loading = false,
}: ContinueButtonProps) {
  const isDisabled = disabled || loading;
  const { colors } = useTheme();

  return (
    <Button
      onPress={onPress}
      disabled={isDisabled}
      className={cn(
        'mb-12 h-auto min-h-[52px] w-full rounded-none py-4',
        isDisabled && 'bg-disabled web:hover:bg-disabled'
      )}
      variant="default">
      <View className="min-h-[24px] items-center justify-center">
        {loading ? (
          <ActivityIndicator
            color={isDisabled ? colors['disabled-foreground'] : colors['primary-foreground']}
          />
        ) : (
          <Text
            className={cn(
              'font-pixel-bold text-[17px]',
              isDisabled ? 'text-disabled-foreground' : 'text-primary-foreground'
            )}>
            {label}
          </Text>
        )}
      </View>
    </Button>
  );
}
