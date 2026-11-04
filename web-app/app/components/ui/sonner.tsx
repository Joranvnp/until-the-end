import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/components/theme-provider";

export function Toaster() {
  const { resolved } = useTheme();
  return (
    <SonnerToaster
      theme={resolved}
      position="bottom-right"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "rounded-lg border border-border bg-popover text-popover-foreground shadow-lg",
        },
      }}
    />
  );
}
