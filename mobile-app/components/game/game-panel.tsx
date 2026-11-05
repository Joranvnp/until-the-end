import { PixelFrame } from '@/components/game/pixel-frame';
import { cn } from '@/lib/utils';

type GamePanelProps = {
  /** Layout of the panel in its parent (width, flex). */
  className?: string;
  /** Spacing inside the frame. */
  contentClassName?: string;
  children: React.ReactNode;
};

// Translucent pixel window for grouping menu content (settings sections, title card).
export function GamePanel({ className, contentClassName, children }: GamePanelProps) {
  return (
    <PixelFrame tone="window" className={className} contentClassName={cn('grow', contentClassName)}>
      {children}
    </PixelFrame>
  );
}
