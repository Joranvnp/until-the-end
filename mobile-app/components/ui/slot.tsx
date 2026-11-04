import * as React from 'react';

import { cn } from '@/lib/utils';

export function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.RefCallback<T | null> {
  return (value) => {
    for (const ref of refs) {
      if (ref == null) continue;
      if (typeof ref === 'function') {
        (ref as (instance: T | null) => void)(value);
      } else {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    }
  };
}

export type SlotProps = {
  children: React.ReactElement;
} & Record<string, unknown>;

/** Merges props onto a single child (shadcn `asChild` pattern) for React Native. */
export const Slot = React.forwardRef<unknown, SlotProps>(function Slot(
  { children, className, ...props },
  ref
) {
  const child = React.Children.only(children);
  if (!React.isValidElement(child)) {
    throw new Error('Slot requires a single valid React element child.');
  }

  const childProps = child.props as Record<string, unknown> & {
    className?: string;
    ref?: React.Ref<unknown>;
  };

  return React.cloneElement(child, {
    ...childProps,
    ...props,
    className: cn(childProps.className, className as string | undefined),
    ref: mergeRefs(ref as React.Ref<never>, childProps.ref),
  } as never);
});

Slot.displayName = 'Slot';
