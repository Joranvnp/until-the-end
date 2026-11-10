import { useRouter } from 'expo-router';
import { BlurHeaderScreen } from '@/components/ui/blur-header-screen';
import { ListItem } from '@/components/ui/list-item';
import { TUTORIAL_LIST } from '@/content/tutorials/tutorials';

export default function TutorialsScreen() {
  const router = useRouter();

  return (
    <BlurHeaderScreen
      title="Comment jouer"
      showBack
      contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
      {TUTORIAL_LIST.map((tutorial) => (
        <ListItem
          key={tutorial.slug}
          title={tutorial.title}
          description={tutorial.description}
          showChevron
          onPress={() =>
            router.push({ pathname: '/(app)/tutorials/[slug]', params: { slug: tutorial.slug } })
          }
        />
      ))}
    </BlurHeaderScreen>
  );
}
