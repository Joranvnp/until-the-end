import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

const SHEET_ANIMATION_DURATION_MS = 220;

export function useSheetTransition(visible: boolean) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: SHEET_ANIMATION_DURATION_MS,
      useNativeDriver: true,
    }).start();
  }, [progress, visible]);

  return progress;
}
