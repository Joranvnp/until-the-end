import { Linking, View } from 'react-native';
import { SiteConfig } from '@site-config';
import { Text } from '@/components/ui/text';

const LEGAL_URLS = {
  terms: SiteConfig.urls.terms,
  privacy: SiteConfig.urls.privacy,
};

export function SignInLegalFooter() {
  return (
    <View className="mt-4">
      <Text className="text-center font-sans text-[12px] leading-[17px] text-muted-foreground">
        {'En continuant, tu acceptes les '}
        <Text
          className="font-sans text-[12px] text-foreground underline"
          onPress={() => Linking.openURL(LEGAL_URLS.terms)}>
          {"conditions d'utilisation"}
        </Text>
        {' et la '}
        <Text
          className="font-sans text-[12px] text-foreground underline"
          onPress={() => Linking.openURL(LEGAL_URLS.privacy)}>
          politique de confidentialité
        </Text>
        {' de '}
        {SiteConfig.title}.
      </Text>
    </View>
  );
}
