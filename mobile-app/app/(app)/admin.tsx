import { Alert, Linking, Pressable, View, type PressableProps } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@convex/_generated/api';
import { SiteConfig } from '@site-config';
import { BlurHeaderScreen } from '@/components/ui/blur-header-screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth-store';
import { useTheme } from '@/lib/theme-store';

type IoniconName = keyof typeof Ionicons.glyphMap;

type AdminListItemProps = Omit<PressableProps, 'children'> & {
  icon: IoniconName;
  title: string;
  description?: string;
  showChevron?: boolean;
};

function AdminBadge({ icon, size = 18 }: { icon: IoniconName; size?: number }) {
  const { colors } = useTheme();

  return (
    <View className="h-10 w-10 items-center justify-center rounded-none bg-secondary">
      <Ionicons name={icon} size={size} color={colors.foreground} />
    </View>
  );
}

function AdminListItem({
  icon,
  title,
  description,
  showChevron = false,
  onPress,
  ...props
}: AdminListItemProps) {
  const { colors } = useTheme();
  const inner = (
    <View className="flex-row items-center gap-3 rounded-none border border-border bg-card px-4 py-3.5">
      <AdminBadge icon={icon} size={17} />
      <View className="flex-1">
        <Text className="font-pixel-bold text-[15px] text-foreground">{title}</Text>
        {description ? (
          <Text className="text-[13px] text-muted-foreground">{description}</Text>
        ) : null}
      </View>
      {showChevron ? (
        <Ionicons name="chevron-forward" size={18} color={colors['muted-foreground']} />
      ) : null}
    </View>
  );

  if (!onPress) return <View>{inner}</View>;

  return (
    <Pressable onPress={onPress} className="active:opacity-70" {...props}>
      {inner}
    </Pressable>
  );
}

export default function AdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const isAdmin = useQuery(api.users.account.checkIsAdmin, isAuthenticated ? {} : 'skip');

  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Impossible d’ouvrir le lien', 'Réessaie dans un instant.');
    }
  };

  if (isAdmin === undefined) {
    return (
      <BlurHeaderScreen title="Admin" showBack contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-none bg-secondary">
            <Ionicons name="shield-checkmark-outline" size={28} color={colors.foreground} />
          </View>
          <Text className="text-center font-pixel-bold text-[20px] text-foreground">
            Vérification de l’accès admin
          </Text>
          <Text className="mt-2 text-center text-[15px] leading-[22px] text-muted-foreground">
            Les outils admin s’affichent une fois les droits du compte confirmés.
          </Text>
        </View>
      </BlurHeaderScreen>
    );
  }

  if (!isAdmin) {
    return (
      <BlurHeaderScreen title="Admin" showBack contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center px-8">
          <View className="items-center">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-none bg-secondary">
              <Ionicons name="lock-closed-outline" size={28} color={colors.foreground} />
            </View>
            <Text className="text-center font-pixel-bold text-[22px] text-foreground">
              Accès admin requis
            </Text>
            <Text className="mt-2 text-center text-[15px] leading-[22px] text-muted-foreground">
              Cette page est réservée aux comptes administrateurs.
            </Text>
          </View>
          <Button
            variant="secondary"
            onPress={() => router.replace('/(app)/settings' as never)}
            className="mt-8">
            Retour aux réglages
          </Button>
        </View>
      </BlurHeaderScreen>
    );
  }

  return (
    <BlurHeaderScreen
      title="Admin"
      showBack
      contentContainerStyle={{ paddingBottom: insets.bottom + 34 }}>
      <View className="px-6">
        <Text className="mb-3 font-pixel-bold text-[13px] uppercase tracking-wider text-muted-foreground">
          Actions
        </Text>
        <View className="gap-2.5">
          <AdminListItem
            icon="play-circle-outline"
            title="Revoir l’écran titre"
            description="Ouvre le parcours de premier lancement"
            showChevron
            onPress={() => router.push('/onboarding')}
          />
          <AdminListItem
            icon="open-outline"
            title="Ouvrir l’admin web"
            description="Gérer les données de production"
            showChevron
            onPress={() => openUrl(SiteConfig.urls.admin)}
          />
        </View>
      </View>
    </BlurHeaderScreen>
  );
}
