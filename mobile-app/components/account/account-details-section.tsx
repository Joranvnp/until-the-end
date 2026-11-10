import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/theme-store';
import { AccountDetailRow } from './account-detail-row';

type AccountDetailsSectionProps = {
  email: string | null;
  name: string | null;
  planLabel: string;
  canOpenPlan: boolean;
  onChangeName: () => void;
  onOpenPlan: () => void;
};

export function AccountDetailsSection({
  email,
  name,
  planLabel,
  canOpenPlan,
  onChangeName,
  onOpenPlan,
}: AccountDetailsSectionProps) {
  const { colors } = useTheme();

  return (
    <View className="px-6">
      <Text className="mb-3 font-pixel-bold text-[13px] uppercase tracking-wider text-muted-foreground">
        Compte
      </Text>
      <View className="rounded-none bg-secondary">
        <AccountDetailRow label="E-mail" value={email ?? '-'} />
        <AccountDetailRow
          label="Pseudo"
          value={name ?? 'non défini'}
          mutedValue={!name}
          bordered
          action={
            <Button
              variant="ghost"
              size="xs"
              onPress={onChangeName}
              className="h-7 rounded-none px-3">
              <Text className="font-pixel-bold text-[13px] text-primary">Modifier</Text>
            </Button>
          }
        />
        <AccountDetailRow
          label="Offre"
          value={planLabel}
          bordered
          onPress={canOpenPlan ? onOpenPlan : undefined}
          accessibilityHint="Ouvre les offres disponibles"
          action={
            canOpenPlan ? (
              <View className="flex-row items-center gap-1">
                <Text className="font-pixel-bold text-[13px] text-primary">Voir les offres</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </View>
            ) : undefined
          }
        />
      </View>
    </View>
  );
}
