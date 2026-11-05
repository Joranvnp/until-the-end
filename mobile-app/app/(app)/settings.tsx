import { Alert, Linking, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@convex/_generated/api';
import { SiteConfig } from '@site-config';
import { useAuth } from '@/lib/auth-store';
import { useGuest } from '@/lib/guest-store';
import { useTheme } from '@/lib/theme-store';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { GameButton } from '@/components/game/game-button';
import { GameIconButton } from '@/components/game/game-icon-button';
import { GamePanel } from '@/components/game/game-panel';
import { MenuBackdrop } from '@/components/game/menu-backdrop';

type IoniconName = keyof typeof Ionicons.glyphMap;
type SocialLink = { label: string; url: string; icon: string };

// site-config.ts reste évaluable en JS : la liste vide y est typée never[].
const socialLinks: SocialLink[] = SiteConfig.social.links;

async function openUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Lien indisponible', 'Réessaie dans un instant.');
  }
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="mb-3 font-pixel-bold text-[13px] uppercase tracking-wider text-muted-foreground">
      {children}
    </Text>
  );
}

function AccountSection() {
  const router = useRouter();
  const { email, isAuthenticated } = useAuth();
  const { isGuest, leaveGuest } = useGuest();

  if (isAuthenticated) {
    return (
      <GameButton
        label="Mon compte"
        sublabel={email ?? 'E-mail, nom, offre et gestion du compte'}
        onPress={() => router.push('/(app)/account')}
      />
    );
  }

  return (
    <View className="gap-2.5">
      <GameButton
        variant="ally"
        label="Créer un compte"
        sublabel="Garde ta progression partout"
        onPress={() => router.push('/onboarding')}
      />
      {isGuest && (
        <GameButton
          label="Quitter le mode invité"
          sublabel="Retour à l'écran titre"
          onPress={async () => {
            await leaveGuest();
            router.replace('/onboarding');
          }}
        />
      )}
    </View>
  );
}

function HelpSection() {
  const router = useRouter();
  return (
    <View className="gap-2.5">
      <GameButton
        label="Comment jouer"
        sublabel="But, commandes, unités et dangers"
        onPress={() => router.push('/(app)/tutorials')}
      />
      <GameButton
        label="Nous écrire"
        sublabel={SiteConfig.company.email}
        onPress={() => openUrl(`mailto:${SiteConfig.company.email}`)}
      />
      <GameButton label="Confidentialité" onPress={() => openUrl(SiteConfig.urls.privacy)} />
      <GameButton label="Conditions d'utilisation" onPress={() => openUrl(SiteConfig.urls.terms)} />
    </View>
  );
}

function AdminButton() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <Button
      variant="ghost"
      onPress={() => router.push('/(app)/admin' as never)}
      className="h-auto flex-row items-center justify-between rounded-none border border-admin-border bg-admin-surface px-5 py-4">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-none bg-admin">
        <Ionicons name="shield-checkmark-outline" size={20} color={colors['admin-foreground']} />
      </View>
      <View className="flex-1">
        <Text className="font-pixel-bold text-[15px] text-admin-text">Admin</Text>
        <Text className="text-[13px] text-admin-text opacity-80">Infos et outils</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors['admin-text']} />
    </Button>
  );
}

// Settings as a game pause menu: back button and title on top, then the account
// and help columns side by side in landscape.
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const isAdmin = useQuery(api.users.account.checkIsAdmin, isAuthenticated ? {} : 'skip');
  const sidePadding = {
    paddingLeft: Math.max(insets.left, 24),
    paddingRight: Math.max(insets.right, 24),
  };

  return (
    <View className="flex-1 bg-background">
      <MenuBackdrop dim={0.6} />

      <View
        className="flex-row items-center gap-4"
        style={{ paddingTop: insets.top + 12, ...sidePadding }}>
        <GameIconButton icon="arrow-back" label="Retour" onPress={() => router.back()} />
        <Text className="font-pixel-bold text-[24px] uppercase tracking-[3px] text-foreground">
          Réglages
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 24,
          ...sidePadding,
        }}>
        <View className="flex-row flex-wrap gap-6">
          <GamePanel className="min-w-[300px] flex-1 p-4">
            <SectionTitle>Compte</SectionTitle>
            <AccountSection />

            {socialLinks.length > 0 && (
              <View className="mt-5">
                <SectionTitle>Réseaux</SectionTitle>
                <View className="flex-row gap-3">
                  {socialLinks.map((link) => (
                    <GameIconButton
                      key={link.url}
                      icon={link.icon as IoniconName}
                      label={link.label}
                      onPress={() => openUrl(link.url)}
                    />
                  ))}
                </View>
              </View>
            )}

            {isAdmin && (
              <View className="mt-5">
                <AdminButton />
              </View>
            )}
          </GamePanel>

          <GamePanel className="min-w-[300px] flex-1 p-4">
            <SectionTitle>Aide</SectionTitle>
            <HelpSection />
          </GamePanel>
        </View>

        <Text className="mt-6 text-center font-sans text-[13px] text-muted-foreground">
          {`${SiteConfig.title} ${SiteConfig.version}`}
        </Text>
      </ScrollView>
    </View>
  );
}
