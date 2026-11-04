import * as React from 'react';
import { Platform, Pressable, Text as RNText, type PressableProps } from 'react-native';
import { cva, type VariantProps } from '@/lib/cva';
import { Slot } from '@/components/ui/slot';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex shrink-0 flex-row items-center justify-center rounded-none border border-transparent bg-clip-padding text-sm outline-none active:opacity-90 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 web:select-none web:whitespace-nowrap web:transition-all web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50 web:active:not-aria-[haspopup]:translate-y-px web:aria-invalid:border-destructive web:aria-invalid:ring-3 web:aria-invalid:ring-destructive/20 dark:web:aria-invalid:border-destructive/50 dark:web:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground web:hover:bg-primary/80',
        outline:
          'border-border bg-background web:hover:bg-muted web:hover:text-foreground web:aria-expanded:bg-muted web:aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:web:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground web:hover:bg-secondary/80 web:aria-expanded:bg-secondary web:aria-expanded:text-secondary-foreground',
        ghost:
          'web:hover:bg-muted web:hover:text-foreground web:aria-expanded:bg-muted web:aria-expanded:text-foreground dark:web:hover:bg-muted/50',
        destructive:
          'bg-destructive/10 text-destructive web:hover:bg-destructive/20 web:focus-visible:border-destructive/40 web:focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:web:hover:bg-destructive/30 dark:web:focus-visible:ring-destructive/40',
        link: 'border-transparent bg-transparent text-primary web:underline-offset-4 web:hover:underline',
      },
      size: {
        default:
          'h-auto min-h-[52px] gap-2 rounded-none px-6 py-4 web:has-data-[icon=inline-end]:pr-5 web:has-data-[icon=inline-start]:pl-5',
        xs: "h-6 gap-1 rounded-[10px] px-2 text-xs web:in-data-[slot=button-group]:rounded-none web:has-data-[icon=inline-end]:pr-1.5 web:has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-none px-2.5 text-[0.8rem] web:in-data-[slot=button-group]:rounded-none web:has-data-[icon=inline-end]:pr-1.5 web:has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-9 gap-1.5 px-2.5 web:has-data-[icon=inline-end]:pr-2 web:has-data-[icon=inline-start]:pl-2',
        icon: 'size-8',
        'icon-xs':
          "size-6 rounded-[10px] web:in-data-[slot=button-group]:rounded-none [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-7 rounded-none web:in-data-[slot=button-group]:rounded-none',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonLabelVariants = cva('font-sans', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      outline: 'text-foreground',
      secondary: 'text-secondary-foreground',
      ghost: 'text-foreground',
      destructive: 'text-destructive',
      link: 'text-primary',
    },
    size: {
      default: 'font-pixel-bold text-[17px]',
      xs: 'text-xs',
      sm: 'text-[13px]',
      lg: 'text-sm',
      icon: 'text-sm',
      'icon-xs': 'text-xs',
      'icon-sm': 'text-[13px]',
      'icon-lg': 'text-sm',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function isPrimitiveLabel(child: React.ReactNode): child is string | number {
  return typeof child === 'string' || typeof child === 'number';
}

const Button = React.forwardRef<React.ComponentRef<typeof Pressable>, ButtonProps>(function Button(
  { children, className, variant, size, asChild = false, disabled, ...props },
  ref
) {
  const dataProps =
    Platform.OS === 'web'
      ? ({
          'data-slot': 'button',
          'data-variant': variant ?? 'default',
          'data-size': size ?? 'default',
        } as const)
      : {};

  const mergedClassName = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return (
      <Slot ref={ref} disabled={disabled} className={mergedClassName} {...dataProps} {...props} />
    );
  }

  const content =
    typeof children === 'function'
      ? children
      : React.Children.map(children, (child): React.ReactNode => {
          if (!isPrimitiveLabel(child)) {
            return child;
          }

          return <RNText className={buttonLabelVariants({ variant, size })}>{child}</RNText>;
        });

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      role="button"
      disabled={disabled}
      className={mergedClassName}
      {...dataProps}
      {...props}>
      {content}
    </Pressable>
  );
});

Button.displayName = 'Button';

export { Button, buttonLabelVariants, buttonVariants };
