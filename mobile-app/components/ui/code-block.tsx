import { ScrollView, Text, View } from 'react-native';
import { cn } from '@/lib/utils';

export type CodeBlockProps = {
  code: string;
  title?: string;
  className?: string;
};

export function CodeBlock({ code, title, className }: CodeBlockProps) {
  return (
    <View className={cn('overflow-hidden rounded-none bg-zinc-900', className)}>
      {title && (
        <View className="border-b border-zinc-700 px-4 py-2">
          <Text className="font-mono text-[12px] text-zinc-400">{title}</Text>
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text className="px-4 py-3 font-mono text-[13px] leading-5 text-zinc-100" selectable>
          {code}
        </Text>
      </ScrollView>
    </View>
  );
}
