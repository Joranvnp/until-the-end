import {
  motion,
  type MotionProps,
  type TargetAndTransition,
  type Variants,
} from "framer-motion";

// --- Animated screen scaffolding (ported from the Pocket template) ---

export type ScreenProps =
  | { animated: true; custom: { isForwards: boolean; changeCount: number } }
  | { animated?: false };

const headerAnimation: Variants = {
  initial: { opacity: 0, transition: { duration: 0.3 } },
  animate: { opacity: 1, transition: { duration: 0.3, delay: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const maxZIndex = 2147483647;

const bodyVariantBackwards: TargetAndTransition = {
  opacity: 0.4,
  scale: 0.8,
  zIndex: 0,
  filter: "blur(4px)",
  transition: { duration: 0.4 },
};

const bodyVariantForwards = (custom: {
  changeCount: number;
}): TargetAndTransition => ({
  y: "100%",
  zIndex: maxZIndex - custom.changeCount,
  transition: { duration: 0.4 },
});

type BodyCustom = { isForwards: boolean; changeCount: number };

const bodyAnimation: MotionProps = {
  initial: "initial",
  animate: "animate",
  exit: "exit",
  variants: {
    initial: (custom: BodyCustom): TargetAndTransition =>
      custom.isForwards ? bodyVariantForwards(custom) : bodyVariantBackwards,
    animate: (custom: BodyCustom): TargetAndTransition => ({
      y: "0%",
      opacity: 1,
      scale: 1,
      zIndex: maxZIndex / 2 - custom.changeCount,
      filter: "blur(0px)",
      transition: { duration: 0.4 },
    }),
    exit: (custom: BodyCustom): TargetAndTransition =>
      custom.isForwards ? bodyVariantBackwards : bodyVariantForwards(custom),
  } satisfies Variants,
};

export function ScreenHeader({
  eyebrow,
  title,
  animated,
}: {
  eyebrow: string;
  title: string;
  animated?: boolean;
}) {
  return (
    <motion.div
      className="px-5 pt-2 pb-4"
      {...(animated ? headerAnimation : {})}
    >
      <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-xl font-semibold tracking-tight">{title}</h3>
    </motion.div>
  );
}

export function ScreenBody({
  children,
  ...props
}: { children: React.ReactNode } & ScreenProps) {
  return (
    <motion.div
      className="relative flex-auto overflow-hidden rounded-t-3xl border-t border-border bg-card px-5 pt-5 pb-6"
      {...(props.animated ? { ...bodyAnimation, custom: props.custom } : {})}
    >
      {children}
    </motion.div>
  );
}
