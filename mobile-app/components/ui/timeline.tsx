import { Text, View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export type TimelineStep = {
  emoji: string;
  title: string;
  description: string;
  time?: string;
  active?: boolean;
  done?: boolean;
};

export type TimelineProps = ViewProps & {
  steps: TimelineStep[];
  className?: string;
};

export function Timeline({ steps, className, ...props }: TimelineProps) {
  return (
    <View className={className} {...props}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <View key={step.title} className="flex-row">
            <View className="mr-4 items-center" style={{ width: 44 }}>
              <View
                className={cn(
                  'h-11 w-11 items-center justify-center rounded-none',
                  step.done ? 'bg-foreground' : step.active ? 'bg-primary' : 'bg-secondary'
                )}>
                <Text className={cn('text-xl', step.done && 'text-primary-foreground')}>
                  {step.done ? '✓' : step.emoji}
                </Text>
              </View>
              {!isLast && <View className="my-1 h-4 w-[2px] bg-border" />}
            </View>
            <View className="flex-1 pb-4">
              {step.time && (
                <Text className="mb-0.5 font-pixel-bold text-[13px] uppercase tracking-wider text-muted-foreground">
                  {step.time}
                </Text>
              )}
              <Text
                className={cn(
                  'font-pixel-bold text-[17px]',
                  step.done ? 'text-muted-foreground line-through' : 'text-foreground'
                )}>
                {step.title}
              </Text>
              <Text className="font-sans text-[14px] leading-5 text-muted-foreground">
                {step.description}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
