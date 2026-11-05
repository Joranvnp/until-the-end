import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/lib/theme-store';
import type { ThemeColors } from '@/lib/theme';
import { cn } from '@/lib/utils';

// One "art pixel" of the frame, the cut corner size, and the hard drop shadow.
const PX = 2;
const SHADOW = 4;

type ToneColors = { fill: keyof ThemeColors; light: keyof ThemeColors; dark: keyof ThemeColors };

const TONES = {
  hero: { fill: 'hero-fill', light: 'hero-light', dark: 'hero-dark' },
  panel: { fill: 'btn-fill', light: 'btn-light', dark: 'btn-dark' },
  ally: { fill: 'ally-fill', light: 'ally-light', dark: 'ally-dark' },
  danger: { fill: 'danger-fill', light: 'danger-light', dark: 'danger-dark' },
  window: { fill: 'panel', light: 'btn-light', dark: 'btn-dark' },
} satisfies Record<string, ToneColors>;

export type FrameTone = keyof typeof TONES;

// A rectangle with its four corner pixels cut out, drawn as two overlapping bars.
function CutCornerBox({ color }: { color: string }) {
  return (
    <>
      <View style={[styles.fill, { left: PX, right: PX, backgroundColor: color }]} />
      <View style={[styles.fill, { top: PX, bottom: PX, backgroundColor: color }]} />
    </>
  );
}

type PixelFrameProps = {
  tone?: FrameTone;
  pressed?: boolean;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
};

// Pixel-art box shared by game buttons and panels: ink outline with cut corners,
// light top bevel, dark bottom bevel and a hard shadow. Pressing sinks it into
// its shadow, like a physical key.
export function PixelFrame({
  tone = 'panel',
  pressed = false,
  className,
  contentClassName,
  children,
}: PixelFrameProps) {
  const { colors } = useTheme();
  const { fill, light, dark } = TONES[tone];
  const isWindow = tone === 'window';
  const bevel = {
    backgroundColor: colors[fill],
    borderTopWidth: isWindow ? PX : PX + 1,
    borderLeftWidth: PX,
    borderRightWidth: PX,
    borderBottomWidth: isWindow ? PX : PX + 2,
    borderTopColor: colors[light],
    borderLeftColor: colors[light],
    borderRightColor: colors[dark],
    borderBottomColor: colors[dark],
  };

  return (
    <View className={cn('relative', className)} style={{ marginBottom: SHADOW }}>
      <View pointerEvents="none" style={[styles.fill, styles.shadow]}>
        <CutCornerBox color={colors.ink} />
      </View>
      <View
        className={contentClassName}
        style={{ transform: [{ translateY: pressed ? SHADOW / 2 : 0 }] }}>
        <View pointerEvents="none" style={styles.fill}>
          <CutCornerBox color={colors.ink} />
          <View style={[styles.fill, styles.inset, bevel]} />
        </View>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  inset: { top: PX, bottom: PX, left: PX, right: PX },
  shadow: { top: SHADOW, bottom: -SHADOW, opacity: 0.7 },
});
