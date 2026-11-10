import { AnimatePresence } from "framer-motion";
import { PhoneFrame } from "./phone-frame";
import {
  CaptureScreen,
  DefaultTimelineScreen,
  SyncScreen,
} from "./phone-feature-screens";

export { PhoneFrame } from "./phone-frame";
export type { ScreenProps } from "./phone-screen";
export {
  CaptureScreen,
  DefaultTimelineScreen,
  SyncScreen,
} from "./phone-feature-screens";

// Animated phone that cross-fades between feature screens like the Pocket demo.
const FEATURE_SCREENS = {
  capture: CaptureScreen,
  sync: SyncScreen,
  timeline: DefaultTimelineScreen,
} as const;

export type FeatureScreenKey = keyof typeof FEATURE_SCREENS;

export function AnimatedFeaturePhone({
  screen,
  isForwards,
  changeCount,
  className,
}: {
  screen: FeatureScreenKey;
  isForwards: boolean;
  changeCount: number;
  className?: string;
}) {
  const Screen = FEATURE_SCREENS[screen];
  return (
    <PhoneFrame className={className}>
      <AnimatePresence initial={false} custom={{ isForwards, changeCount }}>
        <Screen
          key={`${screen}-${changeCount}`}
          animated
          custom={{ isForwards, changeCount }}
        />
      </AnimatePresence>
    </PhoneFrame>
  );
}
