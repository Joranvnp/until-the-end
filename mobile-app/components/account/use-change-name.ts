import { useState } from 'react';
import { useMutation } from 'convex/react';
import { usePostHog } from 'posthog-react-native';
import { api } from '@convex/_generated/api';

export function useChangeName() {
  const posthog = usePostHog();
  const updateProfile = useMutation(api.users.account.updateProfile);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (nextName: string) => {
    if (saving) return;

    setSaving(true);
    setError(null);
    try {
      await updateProfile({ name: nextName });
      posthog.capture('account_name_updated');
      setSheetOpen(false);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Could not update name. Try again.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return {
    sheetOpen,
    saving,
    error,
    setError,
    openSheet: () => setSheetOpen(true),
    closeSheet: () => setSheetOpen(false),
    submit,
  };
}
