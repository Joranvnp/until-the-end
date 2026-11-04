import { Alert, Linking, View } from 'react-native';
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
import { ListItem } from '@/components/ui/list-item';
import { BlurHeaderScreen } from '@/components/ui/blur-header-screen';

type IoniconName = keyof typeof Ionicons.glyphMap;
type SocialLink = { label: string; url: string; icon: string };

// site-config.ts reste évaluable en JS : la liste vide y est typée never[].
const socialLinks: SocialLink[] = SiteConfig.social.links;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { email, isAuthenticated } = useAuth();
  const { isGuest, leaveGuest } = useGuest();
  const { colors } = useTheme();
  const isAdmin = useQuery(api.users.account.checkIsAdmin, isAuthenticated ? {} : 'skip');

  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Lien indisponible', 'Réessaie dans un instant.');
    }
  };

  return (
    <BlurHeaderScreen
      title="Réglages"
      largeTitle
      contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}>
      <View className="mb-8 px-6">
        <Text className="mb-3 font-pixel-bold text-[13px] uppercase tracking-wider text-muted-foreground">
          Compte
        </Text>
        <View className="gap-2.5">
          {isAuthenticated ? (
            <ListItem
              title="Mon compte"
              description={email ?? 'E-mail, nom, offre et gestion du compte'}
              showChevron
              onPress={() => router.push('/(app)/account')}
            />
          ) : (
            <>
              <ListItem
                title="Créer un compte"
                description="Garde ta progression sur tous tes appareils"
                showChevron
                onPress={() => router.push('/onboarding')}
              />
              {isGuest && (
                <ListItem
                  title="Quitter le mode invité"
                  description="Retour à l'écran titre"
                  showChevron
                  onPress={async () => {
                    await leaveGuest();
                    router.replace('/onboarding');
                  }}
                />
              )}
            </>
          )}
        </View>
      </View>

      <View className="mb-8 px-6">
        <Text className="mb-3 font-pixel-bold text-[13px] uppercase tracking-wider text-muted-foreground">
          Aide
        </Text>
        <View className="gap-2.5">
          <ListItem
            title="Nous écrire"
            description={SiteConfig.company.email}
            showChevron
            onPress={() => openUrl(`mailto:${SiteConfig.company.email}`)}
          />
          <ListItem
            title="Confidentialité"
            description={SiteConfig.urls.privacy}
            showChevron
            onPress={() => openUrl(SiteConfig.urls.privacy)}
          />
          <ListItem
            title="Conditions d'utilisation"
            description={SiteConfig.urls.terms}
            showChevron
            onPress={() => openUrl(SiteConfig.urls.terms)}
          />
        </View>
      </View>

      {socialLinks.length > 0 && (
        <View className="mb-8 px-6">
          <Text className="mb-3 font-pixel-bold text-[13px] uppercase tracking-wider text-muted-foreground">
            Réseaux
          </Text>
          <View className="flex-row gap-3">
            {socialLinks.map((link) => (
              <Button
                key={link.url}
                variant="secondary"
                size="icon-lg"
                accessibilityLabel={link.label}
                onPress={() => openUrl(link.url)}
                className="rounded-none">
                <Ionicons
                  name={link.icon as IoniconName}
                  size={19}
                  color={colors['secondary-foreground']}
                />
              </Button>
            ))}
          </View>
        </View>
      )}

      <View className="mt-8 items-center px-6">
        <Text className="font-sans text-[13px] text-muted-foreground">
          {`${SiteConfig.title} ${SiteConfig.version}`}
        </Text>
      </View>

      {isAdmin && (
        <View className="mt-8 px-6">
          <Button
            variant="ghost"
            onPress={() => router.push('/(app)/admin' as never)}
            className="h-auto flex-row items-center justify-between rounded-none border border-admin-border bg-admin-surface px-5 py-4">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-none bg-admin">
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={colors['admin-foreground']}
              />
            </View>
            <View className="flex-1">
              <Text className="font-pixel-bold text-[15px] text-admin-text">Admin</Text>
              <Text className="text-[13px] text-admin-text opacity-80">Infos et outils</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors['admin-text']} />
          </Button>
        </View>
      )}
    </BlurHeaderScreen>
  );
}
