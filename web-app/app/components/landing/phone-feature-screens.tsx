import { Camera, Heart, MapPin, Sparkles, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ScreenBody,
  ScreenHeader,
  type ScreenProps,
} from "./phone-screen";

export function DefaultTimelineScreen(props: ScreenProps = {}) {
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader eyebrow="Today" title="Tuesday, May 19" {...props} />
      <ScreenBody {...props}>
        <div className="space-y-3">
          <div className="rounded-2xl bg-primary p-4 text-primary-foreground shadow-lg shadow-primary/20">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-medium tracking-wider uppercase opacity-80">
              <Sun className="size-3" />
              7:32 AM
            </div>
            <p className="text-sm leading-snug font-medium">
              Morning surf at Padang Padang. Glassy waves before the wind picks
              up.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              <Sparkles className="size-3 text-foreground" />
              10:14 AM
            </div>
            <p className="text-sm leading-snug font-medium">
              Idea: weekend project to build a habit-tracking mobile app.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              <Camera className="size-3 text-foreground" />
              12:48 PM
            </div>
            <div className="mb-2 h-20 w-full overflow-hidden rounded-xl bg-gradient-to-br from-muted via-muted to-secondary" />
            <p className="text-sm leading-snug font-medium">
              Lunch at the new warung in Bingin.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-border bg-background p-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-foreground">
              <MapPin className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">Uluwatu, Bali</p>
              <p className="truncate text-[10px] text-muted-foreground">
                4 moments today
              </p>
            </div>
            <Heart className="size-4 text-muted-foreground" />
          </div>
        </div>
      </ScreenBody>
    </div>
  );
}

export function CaptureScreen(props: ScreenProps = {}) {
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader eyebrow="New moment" title="Right now" {...props} />
      <ScreenBody {...props}>
        <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
          <p className="text-sm leading-relaxed">
            Closed the deal with the Bali studio. Felt the room go quiet right
            before they said yes.
          </p>
          <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-foreground">
              <Camera className="size-3.5" />
            </div>
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-foreground">
              <MapPin className="size-3.5" />
            </div>
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-foreground">
              <Sparkles className="size-3.5" />
            </div>
            <div className="ml-auto rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground">
              Save
            </div>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-3 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            Recent
          </p>
          <div className="space-y-2">
            {[
              "Morning surf — Padang Padang",
              "Idea: weekend project",
              "Coffee with Sarah",
            ].map((note) => (
              <div
                key={note}
                className="rounded-xl border border-border bg-background p-3 text-xs"
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      </ScreenBody>
    </div>
  );
}

export function SyncScreen(props: ScreenProps = {}) {
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader eyebrow="Devices" title="Synced everywhere" {...props} />
      <ScreenBody {...props}>
        <div className="space-y-3">
          {[
            { name: "iPhone 15", subtitle: "Active now", active: true },
            { name: "MacBook Pro", subtitle: "Synced 2 min ago", active: false },
            { name: "iPad", subtitle: "Synced today", active: false },
            { name: "Web", subtitle: "Synced 1 hour ago", active: false },
          ].map((d) => (
            <div
              key={d.name}
              className="flex items-center justify-between rounded-2xl border border-border bg-background p-4"
            >
              <div>
                <p className="text-sm font-medium">{d.name}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {d.subtitle}
                </p>
              </div>
              <span
                className={cn(
                  "size-2.5 rounded-full",
                  d.active ? "bg-primary" : "bg-muted-foreground/30",
                )}
              />
            </div>
          ))}
        </div>
      </ScreenBody>
    </div>
  );
}
