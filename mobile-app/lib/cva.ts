import { clsx, type ClassValue } from 'clsx';

export type VariantMap = Record<string, Record<string, ClassValue>>;

type CvaConfig<V extends VariantMap> = {
  variants: V;
  defaultVariants?: Partial<{ [K in keyof V]: keyof V[K] & string }>;
};

/**
 * Minimal `class-variance-authority`-style helper for React Native / Metro (avoids broken `exports` resolution).
 */
export function cva<V extends VariantMap>(base: ClassValue, config: CvaConfig<V>) {
  const { variants } = config;
  const defaultVariants = (config.defaultVariants ?? {}) as Partial<{
    [K in keyof V]: keyof V[K] & string;
  }>;

  return (
    props?: Partial<{
      [K in keyof V]: (keyof V[K] & string) | null | undefined;
    }> & { className?: ClassValue }
  ) => {
    const { className, ...rest } = props ?? {};
    const selection = rest as Partial<{
      [K in keyof V]: (keyof V[K] & string) | null | undefined;
    }>;
    const pieces: ClassValue[] = [base];

    for (const key of Object.keys(variants) as (keyof V)[]) {
      const map = variants[key];
      const raw = selection[key] ?? defaultVariants[key];
      if (raw != null && map[raw as keyof typeof map] !== undefined) {
        pieces.push(map[raw as keyof typeof map]);
      }
    }

    return clsx(...pieces, className);
  };
}

export type VariantProps<T extends (...args: never) => unknown> = Omit<
  Partial<NonNullable<Parameters<T>[0]>>,
  'className'
>;
