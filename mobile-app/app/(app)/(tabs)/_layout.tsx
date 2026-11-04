import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { useTheme } from '@/lib/theme-store';

export default function TabLayout() {
  const { colors } = useTheme();

  // Native tab bar: real UITabBar on iOS (Liquid Glass on iOS 26+) and Material on
  // Android. The OS owns the surface color/translucency, so we only tint the active
  // item — not the background. SF Symbols on iOS, drawables on Android.
  return (
    <NativeTabs
      tintColor={colors.primary}
      labelStyle={{ fontSize: 12, fontFamily: 'PixelifySans_700Bold' }}>
      <NativeTabs.Trigger name="home">
        <Label>Camp</Label>
        <Icon sf={{ default: 'house', selected: 'house.fill' }} drawable="ic_home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Label>Réglages</Label>
        <Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} drawable="ic_settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
