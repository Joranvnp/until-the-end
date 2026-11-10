import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// "Jouer en invité": a local flag that lets the player into the app without an
// account. Progress stays on the device until they create one from the settings.
const GUEST_KEY = 'ute-guest-v1';

type GuestState = {
  isGuest: boolean;
  isGuestLoading: boolean;
  enterGuest: () => Promise<void>;
  leaveGuest: () => Promise<void>;
};

const GuestContext = createContext<GuestState | null>(null);

export function GuestProvider({ children }: { children: React.ReactNode }) {
  const [isGuest, setIsGuest] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(GUEST_KEY)
      .then((value) => setIsGuest(value === '1'))
      .catch(() => setIsGuest(false))
      .finally(() => setIsGuestLoading(false));
  }, []);

  const enterGuest = useCallback(async () => {
    setIsGuest(true);
    await AsyncStorage.setItem(GUEST_KEY, '1').catch(() => undefined);
  }, []);

  const leaveGuest = useCallback(async () => {
    setIsGuest(false);
    await AsyncStorage.removeItem(GUEST_KEY).catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({ isGuest, isGuestLoading, enterGuest, leaveGuest }),
    [isGuest, isGuestLoading, enterGuest, leaveGuest]
  );

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
}

export function useGuest() {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error('useGuest must be used inside GuestProvider');
  return ctx;
}
