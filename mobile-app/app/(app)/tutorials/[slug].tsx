import { Redirect, useLocalSearchParams } from 'expo-router';
import { BlurHeaderScreen } from '@/components/ui/blur-header-screen';
import { TutorialSections } from '@/components/tutorials/tutorial-sections';
import { TUTORIALS, isTutorialSlug } from '@/content/tutorials/tutorials';

export default function TutorialScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  if (!slug || !isTutorialSlug(slug)) {
    return <Redirect href="/(app)/tutorials" />;
  }

  const tutorial = TUTORIALS[slug];

  return (
    <BlurHeaderScreen
      title={tutorial.title}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}>
      <TutorialSections sections={tutorial.sections} />
    </BlurHeaderScreen>
  );
}
