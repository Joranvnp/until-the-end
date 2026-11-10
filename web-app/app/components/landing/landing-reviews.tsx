import { Star } from "lucide-react";
import { SiteConfig } from "@site-config";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

interface Review {
  title: string;
  body: string;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
}

const REVIEWS: Review[] = [
  {
    title: "Finally a notes app that disappears.",
    body: "NowStack feels like a friend who knows when to be quiet. I just open it, write, and close. That is it.",
    author: "Maya, designer",
    rating: 5,
  },
  {
    title: "Saved my mornings.",
    body: "I write three lines about each morning surf. Six months later I have a timeline that means more than any feed.",
    author: "Diego, founder",
    rating: 5,
  },
  {
    title: "The only paid app I do not regret.",
    body: "One-time price. No upsells. No nagging. The whole product fits in my head, which is the point.",
    author: "Linh, writer",
    rating: 5,
  },
  {
    title: "Beats every voice memo app.",
    body: "I used to record voice notes I never listened to. Now I type a sentence and I actually go back to read them.",
    author: "Sam, PM",
    rating: 5,
  },
  {
    title: "Lovely on web too.",
    body: "Most mobile-first apps treat the web like an afterthought. NowStack does not. The desktop app is beautiful.",
    author: "Priya, engineer",
    rating: 5,
  },
  {
    title: "Calm, finally.",
    body: "I deleted three journaling apps after I found this one. NowStack does less, but the less it does is exactly what I needed.",
    author: "Theo, photographer",
    rating: 5,
  },
  {
    title: "The capture screen is perfect.",
    body: "Open, write, save. No tagging, no folder picker, no AI. Just my words and the time. Brilliant.",
    author: "Anna, lawyer",
    rating: 5,
  },
  {
    title: "Switched from Notion.",
    body: "Notion was too much for daily moments. NowStack is the right shape for capturing life as it happens.",
    author: "Jordan, marketer",
    rating: 5,
  },
  {
    title: "Honest pricing.",
    body: "Twenty bucks, once. I would have paid that monthly. Glad I do not have to think about renewing.",
    author: "Cora, student",
    rating: 5,
  },
  {
    title: "The timeline view is gold.",
    body: "Scrolling through my own past in chronological order is more powerful than any productivity hack.",
    author: "Vince, indie hacker",
    rating: 5,
  },
  {
    title: "Bali days, captured.",
    body: "I take one quick note every morning here. NowStack made me actually look forward to it. That alone is worth it.",
    author: "Inez, traveler",
    rating: 5,
  },
  {
    title: "Replaces my journal.",
    body: "I never kept a paper journal going. NowStack lasted longer than every notebook I have bought.",
    author: "Owen, teacher",
    rating: 5,
  },
];

function StarRating({ rating }: { rating: Review["rating"] }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < rating
              ? "fill-foreground text-foreground"
              : "fill-muted text-muted",
          )}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <figure className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <StarRating rating={review.rating} />
      <p className="mt-4 text-base font-semibold leading-snug text-foreground">
        &ldquo;{review.title}&rdquo;
      </p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {review.body}
      </p>
      <figcaption className="mt-4 text-xs tracking-widest text-muted-foreground uppercase">
        {review.author}
      </figcaption>
    </figure>
  );
}

function ReviewColumn({
  reviews,
  duration,
  className,
}: {
  reviews: Review[];
  duration: string;
  className?: string;
}) {
  return (
    <div
      className={cn("animate-marquee-up space-y-6", className)}
      style={{ ["--marquee-duration" as string]: duration }}
    >
      {[...reviews, ...reviews].map((review, idx) => (
        <ReviewCard key={`${review.author}-${idx}`} review={review} />
      ))}
    </div>
  );
}

function splitArray<T>(array: T[], parts: number): T[][] {
  const result: T[][] = Array.from({ length: parts }, () => []);
  array.forEach((item, idx) => {
    result[idx % parts].push(item);
  });
  return result;
}

export function LandingReviews() {
  const columns = splitArray(REVIEWS, 3);

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-title"
      className="overflow-hidden py-20 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          id="reviews-title"
          eyebrow="Reviews"
          title="Loved by people who value their moments."
          description={`A few words from people using ${SiteConfig.title} every day.`}
        />

        <div className="relative mt-16 grid h-[36rem] max-h-[140vh] grid-cols-1 items-start gap-6 overflow-hidden md:grid-cols-2 lg:grid-cols-3">
          <ReviewColumn reviews={columns[0]} duration="60s" />
          <ReviewColumn
            reviews={columns[1]}
            duration="75s"
            className="hidden md:block"
          />
          <ReviewColumn
            reviews={columns[2]}
            duration="50s"
            className="hidden lg:block"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </div>
      </div>
    </section>
  );
}
