import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <View className="flex flex-1 items-center justify-center bg-background">
      <Stack.Screen options={{ title: 'Not Found' }} />
      <Text className="mb-4 font-pixel-bold text-xl text-foreground">
        {"This page doesn't exist."}
      </Text>
      <Link href="/">
        <Text className="text-[15px] text-muted-foreground underline">Go home</Text>
      </Link>
    </View>
  );
}
