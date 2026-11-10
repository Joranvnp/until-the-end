import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import type { Id } from '@convex/_generated/dataModel';
import { posthog } from '@/lib/posthog';

type AuthState = {
  userId: Id<'users'> | null;
  email: string | null;
  name: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const isAuthenticated = !!session?.user;

  const me = useQuery(api.users.account.getMe, isAuthenticated ? {} : 'skip');
  const ensureUser = useMutation(api.users.account.ensureUser);
  const didEnsure = useRef(false);
  const [ensureSettled, setEnsureSettled] = useState(false);

  useEffect(() => {
    if (isAuthenticated && me === null && !didEnsure.current) {
      didEnsure.current = true;
      setEnsureSettled(false);
      ensureUser({})
        .catch(console.error)
        .finally(() => setEnsureSettled(true));
    }
    if (!isAuthenticated) {
      didEnsure.current = false;
      setEnsureSettled(false);
    }
  }, [isAuthenticated, me, ensureUser]);

  useEffect(() => {
    if (me && session?.user) {
      posthog.identify(me._id, {
        email: session.user.email ?? me.email,
        name: me.name ?? '',
      });
    }
  }, [me, session]);

  const meLoading = isAuthenticated && (me === undefined || (me === null && !ensureSettled));
  const isLoading = sessionLoading || meLoading;

  const signOut = async () => {
    posthog.reset();
    await authClient.signOut();
  };

  const value = useMemo(
    () => ({
      userId: (me?._id as Id<'users'>) ?? null,
      email: session?.user?.email ?? me?.email ?? null,
      name: me?.name ?? null,
      isLoading,
      isAuthenticated: isAuthenticated && !!me,
      signOut,
    }),
    [me, session, isLoading, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
