import { motion } from "framer-motion";
import {
  CloudOff,
  Image as ImageIcon,
  Lock,
  Search,
  Smartphone,
  Tag,
} from "lucide-react";
import { SectionHeading } from "./section-heading";

const FEATURES = [
  {
    name: "Offline first",
    description:
      "Capture without signal. Notes stay on device until you reconnect, then sync silently.",
    icon: CloudOff,
  },
  {
    name: "Attach photos",
    description:
      "A few seconds with the camera and a sentence. A memory you would have otherwise lost.",
    icon: ImageIcon,
  },
  {
    name: "Private by default",
    description:
      "Your moments belong to you. No ads, no training data, no third-party feeds.",
    icon: Lock,
  },
  {
    name: "Instant search",
    description:
      "Find a moment by a single word months later. Search works across all your devices.",
    icon: Search,
  },
  {
    name: "iOS, Android, Web",
    description:
      "Native mobile apps and a fast web app, all powered by the same lifetime account.",
    icon: Smartphone,
  },
  {
    name: "Light tagging",
    description:
      "Tag if you want, ignore tags if you do not. Works either way without judging.",
    icon: Tag,
  },
];

export function LandingSecondaryFeatures() {
  return (
    <section
      id="secondary-features"
      aria-label="Everything else NowStack does well"
      className="py-20 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="Everything else"
          title="Quiet on the outside. Complete on the inside."
          description="The few things you actually want from a notes app, done with care."
        />
        <ul
          role="list"
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-5 text-sm sm:mt-20 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3"
        >
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.li
                key={feature.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: (idx % 3) * 0.08 }}
                className="group rounded-2xl border border-border p-8 transition-colors hover:border-foreground/20 hover:bg-muted/50"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-6 font-semibold text-foreground">
                  {feature.name}
                </h3>
                <p className="mt-2 leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
