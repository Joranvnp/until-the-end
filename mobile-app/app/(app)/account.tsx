import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurHeaderScreen } from '@/components/ui/blur-header-screen';
import { AccountActions } from '@/components/account/account-actions';
import { AccountDetailsSection } from '@/components/account/account-details-section';
import { ChangeNameSheet } from '@/components/account/change-name-sheet';
import { PlanSheet } from '@/components/account/plan-sheet';
import { useChangeName } from '@/components/account/use-change-name';
import { usePlan } from '@/components/account/use-plan';
import { useAuth } from '@/lib/auth-store';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { email, name } = useAuth();
  const changeName = useChangeName();
  const plan = usePlan();

  return (
    <>
      <BlurHeaderScreen
        title="Account"
        showBack
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 32 }}>
        <View className="flex-1 justify-between">
          <AccountDetailsSection
            email={email}
            name={name}
            planLabel={plan.planLabel}
            canOpenPlan={plan.canOpenPlan}
            onChangeName={changeName.openSheet}
            onOpenPlan={plan.openSheet}
          />
          <AccountActions />
        </View>
      </BlurHeaderScreen>

      <ChangeNameSheet
        visible={changeName.sheetOpen}
        currentName={name}
        saving={changeName.saving}
        error={changeName.error}
        onClose={changeName.closeSheet}
        onErrorChange={changeName.setError}
        onSubmit={changeName.submit}
      />
      <PlanSheet
        visible={plan.sheetOpen}
        loading={plan.loading}
        onClose={plan.closeSheet}
        onPurchase={plan.purchase}
      />
    </>
  );
}
