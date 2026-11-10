import { useEffect, useMemo, useRef, useState } from 'react';
import { PixelRatio, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { Canvas, Group, Picture, Skia, type SkPicture } from '@shopify/react-native-skia';
import { useKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameButton } from '@/components/game/game-button';
import { Text } from '@/components/ui/text';
import type { TouchPoint } from '@/game/env';
import { getRuntime } from '@/game/runtime';

type Runtime = Awaited<ReturnType<typeof getRuntime>>;

function emptyPicture() {
  const rec = Skia.PictureRecorder();
  rec.beginRecording(Skia.XYWHRect(0, 0, 1, 1));
  return rec.finishRecordingAsPicture();
}

// Le jeu complet (moteur de www/index.html) dessiné en Skia, plein écran dans la zone sûre.
export default function GameScreen() {
  useKeepAwake();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const empty = useMemo(emptyPicture, []);
  const picture = useSharedValue<SkPicture>(empty);
  const rt = useRef<Runtime | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const view = useRef<View>(null);
  const [onTitle, setOnTitle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scale = 1 / PixelRatio.get();

  useEffect(() => () => rt.current?.detach(), []);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    view.current?.measureInWindow((x, y) => (origin.current = { x, y }));
    if (rt.current) {
      rt.current.resize(width, height);
      return;
    }
    getRuntime(width, height)
      .then((r) => {
        rt.current = r;
        r.resize(width, height);
        let title = false;
        r.attach({
          onFrame: (pic) => {
            picture.value = pic;
            const now = r.game.state === 'title';
            if (now !== title) setOnTitle((title = now));
          },
          onExit: () => router.back(),
        });
      })
      .catch((err: unknown) => setError(String(err)));
  };

  const points = (list: GestureResponderEvent['nativeEvent'][]): TouchPoint[] =>
    list.map((t) => ({
      identifier: Number(t.identifier),
      clientX: t.pageX - origin.current.x,
      clientY: t.pageY - origin.current.y,
    }));

  const send =
    (type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel') =>
    (e: GestureResponderEvent) => {
      const { changedTouches, touches } = e.nativeEvent;
      // touches contient encore les doigts levés sur iOS au moment de la fin : on les retire.
      const ended = type === 'touchend' || type === 'touchcancel';
      const gone = new Set(changedTouches.map((t) => t.identifier));
      const all = ended ? touches.filter((t) => !gone.has(t.identifier)) : touches;
      rt.current?.touch(type, points(changedTouches), points(all));
    };

  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}>
      <StatusBar hidden />
      <View
        ref={view}
        className="flex-1"
        onLayout={onLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderStart={send('touchstart')}
        onResponderMove={send('touchmove')}
        onResponderEnd={send('touchend')}
        onResponderTerminate={send('touchcancel')}>
        <Canvas style={{ flex: 1 }} pointerEvents="none">
          <Group transform={[{ scale }]}>
            <Picture picture={picture} />
          </Group>
        </Canvas>
      </View>

      {onTitle && (
        <View
          className="absolute w-[110px]"
          style={{ top: insets.top + 64, left: insets.left + 8 }}>
          <GameButton variant="panel" label="Camp" onPress={() => router.back()} />
        </View>
      )}

      {error && (
        <View className="absolute inset-x-6 top-1/3">
          <Text className="text-center font-sans text-[14px] text-destructive">{error}</Text>
          <GameButton
            className="mt-3"
            variant="panel"
            label="Retour"
            onPress={() => router.back()}
          />
        </View>
      )}
    </View>
  );
}
