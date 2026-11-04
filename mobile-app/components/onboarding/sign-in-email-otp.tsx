import { useState } from 'react';
import { Alert, Pressable, TextInput } from 'react-native';
import { Text } from '@/components/ui/text';
import { GameButton } from '@/components/game/game-button';
import { authClient } from '@/lib/auth-client';
import { useTheme } from '@/lib/theme-store';

export function SignInEmailOtp({
  view,
  mode,
  loading,
  setLoading,
  onCodeSent,
  onVerified,
}: {
  view: 'email' | 'otp';
  mode: 'signin' | 'signup';
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onCodeSent: () => void;
  onVerified: (email: string) => void;
}) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const sendOtp = async () => {
    setLoading(true);
    try {
      const res = await authClient.$fetch('/email-otp/send-verification-otp', {
        method: 'POST',
        body: { email: email.trim(), type: 'sign-in' },
      });
      if (res.error) {
        Alert.alert('Oups', res.error.message ?? "Impossible d'envoyer le code.");
        return;
      }
      onCodeSent();
    } catch (e: unknown) {
      Alert.alert('Oups', e instanceof Error ? e.message : "Impossible d'envoyer le code.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const res = await authClient.$fetch('/sign-in/email-otp', {
        method: 'POST',
        body: { email: email.trim(), otp },
      });
      if (res.error) {
        Alert.alert('Code refusé', res.error.message ?? 'Ce code ne fonctionne pas.');
      } else {
        onVerified(email.trim());
      }
    } catch (e: unknown) {
      Alert.alert('Oups', e instanceof Error ? e.message : 'La vérification a échoué.');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'email') {
    return (
      <>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="ton@email.fr"
          placeholderTextColor={colors['muted-foreground']}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoFocus
          className="mb-3 h-[52px] w-full border-2 border-edge bg-background px-4 font-sans text-[18px] text-foreground"
        />
        <GameButton
          variant="hero"
          label={loading ? 'Envoi...' : mode === 'signup' ? 'Créer mon compte' : 'Recevoir le code'}
          onPress={sendOtp}
          disabled={!isValidEmail || loading}
        />
      </>
    );
  }

  return (
    <>
      <Text className="mb-3 text-center font-sans text-[16px] text-muted-foreground">
        {'Code envoyé à '}
        <Text className="font-pixel-bold text-[16px] text-foreground">{email.trim()}</Text>
      </Text>
      <TextInput
        value={otp}
        onChangeText={setOtp}
        placeholder="000000"
        placeholderTextColor={colors['muted-foreground']}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        className="mb-3 h-[60px] w-full border-2 border-edge bg-background px-4 text-center font-title text-[22px] tracking-[6px] text-primary"
      />
      <GameButton
        variant="hero"
        label={loading ? 'Vérification...' : 'Valider'}
        onPress={verifyOtp}
        disabled={otp.length < 6 || loading}
      />
      <Pressable
        onPress={sendOtp}
        disabled={loading}
        className="mt-2 h-[40px] w-full items-center justify-center">
        <Text className="font-sans text-[15px] text-muted-foreground underline">
          Renvoyer le code
        </Text>
      </Pressable>
    </>
  );
}
