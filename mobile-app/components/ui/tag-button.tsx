import { cva, type VariantProps } from '@/lib/cva';
import * as React from 'react';
import { Text, type TextProps } from 'react-native';

import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const tagButtonLabelVariants = cva('text-[14px] font-pixel-bold leading-[14px]', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-white',
      outline: 'text-foreground',
      ghost: 'text-foreground',
      link: 'text-primary underline',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type TagButtonVariant = NonNullable<VariantProps<typeof tagButtonLabelVariants>['variant']>;

const variantToButtonVariant: Record<TagButtonVariant, NonNullable<ButtonProps['variant']>> = {
  default: 'default',
  secondary: 'secondary',
  destructive: 'default',
  outline: 'outline',
  ghost: 'ghost',
  link: 'link',
};

export type TagButtonProps = Omit<ButtonProps, 'children' | 'variant'> & {
  variant?: TagButtonVariant;
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
  textProps?: Omit<TextProps, 'children' | 'className' | 'style'> & {
    className?: string;
    style?: TextProps['style'];
  };
};

function isPrimitiveLabel(children: React.ReactNode): children is string | number {
  return typeof children === 'string' || typeof children === 'number';
}

export const TagButton = React.forwardRef<React.ComponentRef<typeof Button>, TagButtonProps>(
  function TagButton(
    {
      className,
      textClassName,
      textProps,
      variant = 'default',
      size = 'xs',
      children,
      ...buttonProps
    },
    ref
  ) {
    const v = variant ?? 'default';
    const {
      className: textPropsClassName,
      style: textPropsStyle,
      ...restTextProps
    } = textProps ?? {};

    return (
      <Button
        ref={ref}
        size={size}
        variant={variantToButtonVariant[v]}
        className={cn(
          'h-auto min-h-0 shrink-0 justify-center rounded-none px-4 py-1.5',
          v === 'destructive' && 'web:hover:bg-destructive/90 bg-destructive',
          className
        )}
        {...buttonProps}>
        {isPrimitiveLabel(children) ? (
          <Text
            {...restTextProps}
            className={cn(
              tagButtonLabelVariants({ variant: v }),
              textPropsClassName,
              textClassName
            )}
            style={[{ includeFontPadding: false }, textPropsStyle]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Button>
    );
  }
);

TagButton.displayName = 'TagButton';

export { tagButtonLabelVariants };
