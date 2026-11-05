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
    title: 'Un seul paiement',
    subtitle: `${SiteConfig.payment.priceDisplay}, payé une seule fois`,
  },
  {
    icon: 'infinite-outline',
    title: 'Accès à vie',
    subtitle: 'Sans abonnement, sans renouvellement, sans date de fin',
  },
  {
    icon: 'sparkles-outline',
    title: 'Mises à jour incluses',
    subtitle: 'Tu gardes tout ce qui arrive ensuite',
  },
];
