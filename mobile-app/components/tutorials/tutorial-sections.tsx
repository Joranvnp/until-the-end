import { Card, CardContent } from '@/components/ui/card';
import { CodeBlock } from '@/components/ui/code-block';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
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
            <Text
              className={cn('text-[13px] leading-5 text-muted-foreground', section.code && 'mb-3')}>
              {section.body}
            </Text>
            {section.code && <CodeBlock code={section.code.snippet} title={section.code.title} />}
          </CardContent>
        </Card>
      ))}
    </>
  );
}
