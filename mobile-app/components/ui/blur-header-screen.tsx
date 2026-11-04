import { type ReactNode, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme-store';
import { Text } from '@/components/ui/text';
import { Header } from '@/components/ui/header';

// Shared iOS-style header: an absolute blur bar that the scroll content passes
// under. The blur + hairline border fade in on scroll and are absent at the top,
// so the title reads on the plain background at rest. One source of truth for
// every header-over-scroll screen — keep new scroll screens on this primitive.
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export type BlurHeaderScreenProps = {
  title: string;
  // true → 28px large title (tab roots); false → compact title + back (pushed screens).
  largeTitle?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  trailing?: ReactNode;
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
};

export function BlurHeaderScreen({
  title,
  largeTitle = false,
  showBack,
  onBack,
  trailing,
  children,
  contentContainerStyle,
  scrollEnabled = true,
}: BlurHeaderScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, resolved } = useTheme();
  const scrollY = useSharedValue(0);
  const [headerHeight, setHeaderHeight] = useState(insets.top + (largeTitle ? 52 : 44));

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const blurAnimatedProps = useAnimatedProps(() => ({
    intensity: interpolate(scrollY.value, [0, 50], [0, 80], Extrapolation.CLAMP),
  }));

  const borderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 40], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View className="flex-1 bg-background">
      <Animated.ScrollView
        style={{ flex: 1 }}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          { paddingTop: headerHeight + 4, paddingBottom: insets.bottom + 24 },
          contentContainerStyle,
        ]}>
        {children}
      </Animated.ScrollView>

      <Animated.View
        pointerEvents="box-none"
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
        style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <AnimatedBlurView
          tint={resolved}
          animatedProps={blurAnimatedProps}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: StyleSheet.hairlineWidth,
              backgroundColor: colors.border,
            },
            borderAnimatedStyle,
          ]}
        />
        {largeTitle ? (
          <View
            className="flex-row items-center justify-between px-6 pb-2"
            style={{ paddingTop: insets.top + 8 }}>
            <Text className="font-pixel-bold text-[28px] text-foreground">{title}</Text>
            {trailing ? <View className="flex-row items-center gap-2">{trailing}</View> : null}
          </View>
        ) : (
          <View style={{ paddingTop: insets.top + 8 }}>
            <Header title={title} showBack={showBack} onBack={onBack} trailing={trailing} />
          </View>
        )}
      </Animated.View>
    </View>
  );
}
