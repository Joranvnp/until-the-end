import { Ionicons } from '@expo/vector-icons';
import { SiteConfig } from '@site-config';

type IoniconName = keyof typeof Ionicons.glyphMap;

export type PlanFeature = {
  icon: IoniconName;
  title: string;
  subtitle: string;
};

export const PLAN_FEATURES: PlanFeature[] = [
  {
    icon: 'card-outline',
    title: 'Pay once',
    subtitle: `${SiteConfig.payment.priceDisplay}, one single payment`,
  },
  {
    icon: 'infinite-outline',
    title: 'Lifetime access',
    subtitle: 'No subscription, no renewal, no expiry',
  },
  {
    icon: 'sparkles-outline',
    title: 'Future updates',
    subtitle: 'Keep access as the app improves',
  },
];
