import { TextInput, View, Text, type TextInputProps } from 'react-native';
import { cva, type VariantProps } from '@/lib/cva';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme-store';

const inputVariants = cva(
  'rounded-none border px-4 py-3 text-[14px] leading-5 text-foreground font-sans',
  {
    variants: {
      variant: {
        default: 'border-border bg-background',
        filled: 'border-border bg-secondary',
        muted: 'border-border bg-muted',
      },
      inputSize: {
        default: 'min-h-[44px]',
        sm: 'min-h-[36px] px-3 py-2 text-[13px]',
        lg: 'min-h-[52px] px-5 py-4 text-[15px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
);

export type InputProps = TextInputProps &
  VariantProps<typeof inputVariants> & {
    className?: string;
    label?: string;
    maxLength?: number;
    showCounter?: boolean;
  };

export function Input({
  className,
  variant,
  inputSize,
  label,
  maxLength,
  showCounter,
  value,
  multiline,
  style,
  ...props
}: InputProps) {
  const { colors } = useTheme();
  return (
    <View>
      {label && <Text className="mb-1.5 font-pixel-bold text-[15px] text-foreground">{label}</Text>}
      <TextInput
        value={value}
        maxLength={maxLength}
        multiline={multiline}
        placeholderTextColor={colors['muted-foreground']}
        className={cn(
          inputVariants({ variant, inputSize }),
          multiline && 'min-h-[80px]',
          className
        )}
        style={[multiline ? { textAlignVertical: 'top' as const } : undefined, style]}
        {...props}
      />
      {showCounter && maxLength != null && (
        <Text className="mt-1 text-right text-[12px] text-muted-foreground">
          {(value ?? '').length}/{maxLength}
        </Text>
      )}
    </View>
  );
}

export { inputVariants };
