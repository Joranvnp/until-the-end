import { SiteConfig } from "@site-config";

const APP_NAME = SiteConfig.title;
const PRICE = SiteConfig.payment.priceDisplay;

const FAQ_COLUMNS = [
  [
    {
      question: `What exactly is ${APP_NAME}?`,
      answer: `${APP_NAME} is a simple way to save quick notes about your life, thoughts, and moments. No noise, no algorithm. Just your timeline, preserved.`,
    },
    {
      question: "How much does it cost?",
      answer: `One-time payment of ${PRICE}. No subscriptions, no upgrades, no hidden charges.`,
    },
    {
      question: "Can I use it without the mobile app?",
      answer: `Yes. Sign in on the web app with the same email code flow and access your timeline anywhere.`,
    },
    {
      question: "Is there a free trial?",
      answer: `You can browse the web app and explore the interface before buying. The mobile app unlocks after a single in-app purchase.`,
    },
  ],
  [
    {
      question: "Is my data private?",
      answer:
        "Yes. Your moments are private to your account. We do not show ads, do not sell data, and do not train models on your notes.",
    },
    {
      question: "Does it work offline?",
      answer: `Yes. Capture without signal and ${APP_NAME} syncs once you reconnect.`,
    },
    {
      question: "What if I do not like it?",
      answer:
        "Email us within 14 days and we will refund without asking why. We would rather have someone happy than reluctant.",
    },
    {
      question: "Do you offer team accounts?",
      answer: `${APP_NAME} is built for individuals. If you want a team product, reach out and we will let you know if we build one.`,
    },
  ],
  [
    {
      question: "Which devices are supported?",
      answer:
        "iPhone, iPad, Android, and any modern browser. One purchase, all platforms.",
    },
    {
      question: "Can I export my notes?",
      answer:
        "Yes. You can export a full archive of your timeline as JSON or plain text from the web app at any time.",
    },
    {
      question: "Who built this?",
      answer: `Built solo by ${SiteConfig.team.name} in Bali. Reach out at ${SiteConfig.team.twitter} or ${SiteConfig.company.email}.`,
    },
    {
      question: "Will it stay this simple?",
      answer:
        "Yes. We add features only when they make capturing or finding a moment quieter. If a feature would shout, it does not ship.",
    },
  ],
];

export function LandingFaqs() {
  return (
    <section
      id="faq"
      aria-labelledby="faqs-title"
      className="border-t border-border py-20 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            FAQ
          </p>
          <h2
            id="faqs-title"
            className="mt-3 text-3xl font-medium tracking-tight text-foreground sm:text-4xl"
          >
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Anything else?{" "}
            <a
              href={`mailto:${SiteConfig.company.email}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              Email us
            </a>
            .
          </p>
        </div>
        <ul
          role="list"
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-10 sm:mt-20 lg:max-w-none lg:grid-cols-3"
        >
          {FAQ_COLUMNS.map((column, columnIndex) => (
            <li key={columnIndex}>
              <ul role="list" className="space-y-10">
                {column.map((faq) => (
                  <li key={faq.question}>
                    <h3 className="text-base leading-6 font-semibold text-foreground">
                      {faq.question}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {faq.answer}
                    </p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
