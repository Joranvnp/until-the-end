import { cn } from "@/lib/utils";
import { DefaultTimelineScreen } from "./phone-feature-screens";

type PhoneFrameProps = {
  className?: string;
  children?: React.ReactNode;
};

export function PhoneFrame({ className, children }: PhoneFrameProps) {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-[366/729] w-full max-w-[340px]",
        className,
      )}
    >
      <div className="absolute inset-y-[0.14%] right-[1.4%] left-[1.9%] rounded-[12%/6%] bg-gradient-to-b from-zinc-900 to-zinc-700 shadow-[0_50px_120px_-20px_rgba(0,0,0,0.45),0_25px_60px_-15px_rgba(8,30,40,0.3)]" />
      <div className="force-light-theme absolute inset-y-[2%] right-[3%] left-[3.5%] overflow-hidden rounded-[10%/5%] bg-foreground">
        <div className="relative flex h-full flex-col bg-background text-foreground">
          <div className="relative z-20 flex items-center justify-between px-6 pt-5 pb-3 text-[10px] font-medium">
            <span>9:41</span>
            <div className="absolute top-2 left-1/2 h-4 w-20 -translate-x-1/2 rounded-full bg-zinc-900" />
            <div className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-foreground" />
              <span className="size-1.5 rounded-full bg-foreground" />
              <span className="size-1.5 rounded-full bg-foreground" />
            </div>
          </div>
          <div className="relative grid flex-1 grid-cols-1 overflow-hidden [&>*]:col-start-1 [&>*]:row-start-1">
            {children ?? <DefaultTimelineScreen />}
          </div>
        </div>
      </div>
    </div>
  );
}
