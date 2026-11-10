import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

type EnabledAuthProviders = {
  apple: boolean;
  github: boolean;
  google: boolean;
};

type AuthProvidersState = {
  providers: EnabledAuthProviders | null;
  isLoading: boolean;
};

const AuthProvidersContext = createContext<AuthProvidersState | null>(null);

let cachedProviders: EnabledAuthProviders | null = null;

export function AuthProvidersProvider({ children }: { children: ReactNode }) {
  const queriedProviders = useQuery(api.auth.getEnabledAuthProviders, {});
  const [providers, setProviders] = useState<EnabledAuthProviders | null>(cachedProviders);

  useEffect(() => {
    if (queriedProviders === undefined) return;
    cachedProviders = queriedProviders;
    setProviders(queriedProviders);
  }, [queriedProviders]);

  const value = useMemo(
    () => ({
      providers,
      isLoading: providers === null,
    }),
    [providers]
  );

  return <AuthProvidersContext.Provider value={value}>{children}</AuthProvidersContext.Provider>;
}

export function useAuthProviders() {
  const context = useContext(AuthProvidersContext);
  if (!context) throw new Error('useAuthProviders must be used within AuthProvidersProvider');
  return context;
}
