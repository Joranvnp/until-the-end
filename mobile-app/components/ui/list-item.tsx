import { Pressable, Text, View, type PressableProps } from 'react-native';
import { cn } from '@/lib/utils';

export type ListItemProps = Omit<PressableProps, 'children'> & {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  description?: string;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  className?: string;
  iconClassName?: string;
};

export function ListItem({
  icon,
  emoji,
  title,
  description,
  trailing,
  showChevron = false,
  className,
  iconClassName,
  onPress,
  ...props
}: ListItemProps) {
  const inner = (
    <View className="flex-row items-center gap-3 rounded-none border border-border bg-card px-4 py-3.5">
      {(icon || emoji) && (
        <View
          className={cn(
            'h-10 w-10 items-center justify-center rounded-none bg-secondary',
            iconClassName
          )}>
          {emoji ? <Text className="text-[18px]">{emoji}</Text> : icon}
        </View>
      )}
      <View className="flex-1">
        <Text className="font-pixel-bold text-[15px] text-foreground">{title}</Text>
        {description && (
          <Text className="font-sans text-[13px] text-muted-foreground">{description}</Text>
        )}
      </View>
      {trailing}
      {showChevron && <Text className="text-muted-foreground/60 text-[18px] font-light">›</Text>}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={cn('active:opacity-70', className)} {...props}>
        {inner}
      </Pressable>
    );
  }

  return <View className={className}>{inner}</View>;
}
