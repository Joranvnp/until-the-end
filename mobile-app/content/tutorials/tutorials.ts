import { authTutorial } from './auth';
import { convexTutorial } from './convex';
import { deployTutorial } from './deploy';
import { paymentsTutorial } from './payments';

export type TutorialSlug = 'auth' | 'convex' | 'payments' | 'deploy';

export type TutorialSection = {
  title: string;
  body: string;
  code?: { title: string; snippet: string };
};

export type Tutorial = {
  slug: TutorialSlug;
  title: string;
  description: string;
  sections: TutorialSection[];
};

export const TUTORIALS: Record<TutorialSlug, Tutorial> = {
  auth: authTutorial,
  convex: convexTutorial,
  payments: paymentsTutorial,
  deploy: deployTutorial,
};

export const TUTORIAL_LIST: Tutorial[] = [
  authTutorial,
  convexTutorial,
  paymentsTutorial,
  deployTutorial,
];

export function isTutorialSlug(value: string): value is TutorialSlug {
  return value in TUTORIALS;
}
