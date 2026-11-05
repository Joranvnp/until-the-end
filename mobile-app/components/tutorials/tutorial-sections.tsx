import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { TutorialSection } from '@/content/tutorials/tutorials';

export type TutorialSectionsProps = {
  sections: TutorialSection[];
};

export function TutorialSections({ sections }: TutorialSectionsProps) {
  return (
    <>
      {sections.map((section) => (
        <Card key={section.title}>
          <CardContent>
            <Text className="mb-1 font-pixel-bold text-[15px] text-foreground">
              {section.title}
            </Text>
            <Text className="text-[13px] leading-5 text-muted-foreground">{section.body}</Text>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
