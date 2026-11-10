import { type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type OptionButtonProps = Omit<ButtonProps, 'variant' | 'children'> & {
  label: string;
  emoji?: string;
  icon?: ReactNode;
  selected?: boolean;
  className?: string;
};

export function OptionButton({
  label,
  emoji,
  icon,
  selected = false,
  className,
  ...props
}: OptionButtonProps) {
  return (
    <Button
      variant={selected ? 'default' : 'outline'}
      className={cn(
        'h-auto w-full flex-row items-center rounded-none border-2 px-6 py-4',
        selected ? 'border-foreground' : 'border-border',
        className
      )}
      {...props}>
      {emoji && <Text className="mr-3 text-xl">{emoji}</Text>}
      {icon && <View className="mr-3">{icon}</View>}
      <Text
        className={cn(
          'font-pixel-bold text-[17px]',
          selected ? 'text-primary-foreground' : 'text-foreground'
        )}>
        {label}
      </Text>
    </Button>
  );
}
