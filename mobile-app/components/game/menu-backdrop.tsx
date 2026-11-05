import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme-store';

// Both illustrations are 960x540 (see docs/direction-artistique.md).
const ARTS = {
  menu: require('@/assets/art/menu.png'),
  camp: require('@/assets/art/camp.png'),
};
const ART_RATIO = 960 / 540;

type MenuBackdropProps = { art?: keyof typeof ARTS; dim?: number };

// A menu illustration slowly panning like `menuBackdrop()` in the web game, with a
// night veil so text stays readable.
export function MenuBackdrop({ art = 'menu', dim = 0.35 }: MenuBackdropProps) {
  const { width, height } = useWindowDimensions();
  const { colors } = useTheme();
  const artHeight = height * 1.08;
  const artWidth = Math.max(width * 1.08, artHeight * ART_RATIO);
  const travel = Math.max(0, artWidth - width);
  const pan = useSharedValue(0);

  useEffect(() => {
    pan.value = withRepeat(
      withTiming(1, { duration: 40000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [pan]);

  const artStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -travel * (0.2 + pan.value * 0.6) }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.Image
        source={ARTS[art]}
        resizeMode="cover"
        style={[
          {
            position: 'absolute',
            top: (height - artHeight) / 2,
            width: artWidth,
            height: artHeight,
          },
          artStyle,
        ]}
      />
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, opacity: dim }]}
      />
    </View>
  );
}
