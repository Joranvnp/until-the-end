import { ActivityIndicator, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/theme-store';
import { SignInEmailOtp } from '@/components/onboarding/sign-in-email-otp';
import { SignInLegalFooter } from '@/components/onboarding/sign-in-legal-footer';
import { SignInSocialButtons } from '@/components/onboarding/sign-in-social-buttons';
import { useSignInFlow } from '@/components/onboarding/use-sign-in-flow';

export function SignInForm({
  mode = 'signin',
  onSuccess,
}: { mode?: 'signin' | 'signup'; onSuccess?: () => void } = {}) {
  const { colors } = useTheme();
  const {
    view,
    animateViewChange,
    formAnimStyle,
    loading,
    setLoading,
    waitingForAuth,
    startWaiting,
  } = useSignInFlow(onSuccess);

  if (waitingForAuth) {
    return (
      <View className="w-full items-center py-8">
        <ActivityIndicator size="large" color={colors.primary} className="mb-3" />
        <Text className="font-sans text-[16px] text-muted-foreground">Connexion...</Text>
      </View>
    );
  }

  return (
    <View className="w-full">
      <Animated.View entering={FadeInDown.duration(300)} className="w-full">
        <Animated.View style={formAnimStyle}>
          {view === 'main' && (
            <SignInSocialButtons
              loading={loading}
              setLoading={setLoading}
              onSignedIn={startWaiting}
              onEmailPress={() => animateViewChange('email')}
            />
          )}

          {(view === 'email' || view === 'otp') && (
            <SignInEmailOtp
              view={view}
              mode={mode}
              loading={loading}
              setLoading={setLoading}
              onCodeSent={() => animateViewChange('otp')}
              onVerified={(email) => startWaiting('email_otp', email)}
            />
          )}
        </Animated.View>

        <SignInLegalFooter />
      </Animated.View>
    </View>
  );
}
