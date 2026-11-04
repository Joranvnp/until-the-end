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
        Account
      </Text>
      <View className="rounded-none bg-secondary">
        <AccountDetailRow label="Email" value={email ?? '-'} />
        <AccountDetailRow
          label="Name"
          value={name ?? 'not defined'}
          mutedValue={!name}
          bordered
          action={
            <Button
              variant="ghost"
              size="xs"
              onPress={onChangeName}
              className="h-7 rounded-none px-3">
              <Text className="font-pixel-bold text-[13px] text-primary">Change</Text>
            </Button>
          }
        />
        <AccountDetailRow
          label="Plan"
          value={planLabel}
          bordered
          onPress={canOpenPlan ? onOpenPlan : undefined}
          accessibilityHint="Opens available plans"
          action={
            canOpenPlan ? (
              <View className="flex-row items-center gap-1">
                <Text className="font-pixel-bold text-[13px] text-primary">View plans</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </View>
            ) : undefined
          }
        />
      </View>
    </View>
  );
}
