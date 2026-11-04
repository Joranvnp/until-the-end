import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, RefreshCw, Zap } from "lucide-react";
import { CircleBackground } from "./circle-background";
import {
  AnimatedFeaturePhone,
  CaptureScreen,
  type FeatureScreenKey,
  PhoneFrame,
  SyncScreen,
  DefaultTimelineScreen,
} from "./phone-mockup";
import { SectionHeading } from "./section-heading";
import { cn } from "@/lib/utils";

const FEATURES: {
  key: FeatureScreenKey;
  name: string;
  description: string;
  icon: typeof Zap;
  Screen: typeof CaptureScreen;
}[] = [
  {
    key: "capture",
    name: "Capture in one tap",
    description:
      "Open the app, write the note, save it. No tagging, no folders, no decisions to slow you down.",
    icon: Zap,
    Screen: CaptureScreen,
  },
  {
    key: "sync",
    name: "Sync everywhere",
    description:
      "Your timeline travels with you. iPhone, Android, and the web all stay in sync without you thinking about it.",
    icon: RefreshCw,
    Screen: SyncScreen,
  },
  {
    key: "timeline",
    name: "Browse your past",
    description:
      "Scroll back through a quiet timeline of your own thoughts and moments. Searchable, beautiful, yours alone.",
    icon: Eye,
    Screen: DefaultTimelineScreen,
  },
];

export function LandingPrimaryFeatures() {
  const [state, setState] = useState({
    index: 0,
    changeCount: 0,
    isForwards: true,
  });

  const select = (index: number) =>
    setState((s) =>
      index === s.index
        ? s
        : {
            index,
            changeCount: s.changeCount + 1,
            isForwards: index > s.index,
          },
    );

  return (
    <section
      id="features"
      aria-label="Features for capturing moments"
      className="dark bg-background py-20 text-foreground sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          tone="dark"
          align="left"
          eyebrow="Core features"
          title="Every feature you need. Nothing you do not."
          description="Three things done very well, so you never reach for a louder app for what should be a small note."
          className="lg:mx-0 lg:max-w-3xl"
        />

        {/* Mobile: swipeable cards */}
        <div className="mt-16 md:hidden">
          <div className="-mb-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.key}
                  className="w-full flex-none snap-center px-4 first:pl-6 last:pr-6"
                >
                  <div className="relative overflow-hidden rounded-2xl bg-card px-5 pt-6 pb-8">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <CircleBackground
                        color="currentColor"
                        className="animate-spin-slower text-primary/30"
                      />
                    </div>
                    <PhoneFrame className="relative mx-auto w-full max-w-[260px]">
                      <feature.Screen />
                    </PhoneFrame>
                    <div className="absolute inset-x-0 bottom-0 bg-card/95 p-6 backdrop-blur-sm">
                      <Icon className="size-6 text-muted-foreground" />
                      <h3 className="mt-4 text-base font-semibold text-foreground">
                        {feature.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop: animated phone + tab list */}
        <div className="mt-20 hidden md:grid md:grid-cols-12 md:items-center md:gap-8 lg:gap-16 xl:gap-24">
          <div className="relative col-span-6">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <CircleBackground
                color="currentColor"
                className="animate-spin-slower text-primary/30"
              />
            </div>
            <AnimatedFeaturePhone
              screen={FEATURES[state.index].key}
              isForwards={state.isForwards}
              changeCount={state.changeCount}
              className="z-10 mx-auto w-full max-w-[320px]"
            />
          </div>
          <div className="relative order-last col-span-6 space-y-4">
            {FEATURES.map((feature, idx) => {
              const Icon = feature.icon;
              const isActive = idx === state.index;
              return (
                <button
                  key={feature.key}
                  type="button"
                  onClick={() => select(idx)}
                  className="relative w-full rounded-2xl p-8 text-left transition-colors hover:bg-card/40"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFeature"
                      className="absolute inset-0 rounded-2xl bg-card"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <div className="relative z-10">
                    <Icon
                      className={cn(
                        "size-7 transition-colors",
                        isActive ? "text-foreground" : "text-muted-foreground",
                      )}
                    />
                    <h3 className="mt-6 text-lg font-semibold text-foreground">
                      {feature.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
