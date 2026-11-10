import { useId, type ComponentPropsWithoutRef } from "react";
import {
  LOGO_MARK_HEX_PATH,
  LOGO_MARK_SIZE,
  LOGO_MARK_SLICE_PATH,
  LOGO_MARK_SLICE_WIDTH,
} from "@/components/logo-mark";
import { cn } from "@/lib/utils";

type LogoSvgProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

export function LogoSvg({ size = 32, className, ...props }: LogoSvgProps) {
  const maskId = useId();

  return (
    <svg
      viewBox={`0 0 ${LOGO_MARK_SIZE} ${LOGO_MARK_SIZE}`}
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      <mask
        id={maskId}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width={LOGO_MARK_SIZE}
        height={LOGO_MARK_SIZE}
      >
        <rect width={LOGO_MARK_SIZE} height={LOGO_MARK_SIZE} fill="#fff" />
        <path
          d={LOGO_MARK_SLICE_PATH}
          stroke="#000"
          strokeWidth={LOGO_MARK_SLICE_WIDTH}
        />
      </mask>
      <path
        d={LOGO_MARK_HEX_PATH}
        fill="currentColor"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}
