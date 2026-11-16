import { cn } from "../lib/format";

/** The ListenMusic mark: headphones embracing dynamic equalizer bars. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none">
      <path
        d="M9.5 25C9.5 15.5 16 9 24 9C32 9 38.5 15.5 38.5 25"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <rect x="7" y="22" width="5" height="14" rx="2.5" fill="currentColor" />
      <rect x="36" y="22" width="5" height="14" rx="2.5" fill="currentColor" />
      <rect x="16.25" y="20" width="3.5" height="16" rx="1.75" fill="currentColor" />
      <rect x="22.25" y="15" width="3.5" height="23" rx="1.75" fill="currentColor" />
      <rect x="28.25" y="18" width="3.5" height="19" rx="1.75" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="size-7 text-accent-text" />
      <span className="text-[17px] font-semibold tracking-tight">ListenMusic</span>
    </span>
  );
}

/** The mark in motion: marks the track that is playing. */
export function Equalizer({ live, className }: { live: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("inline-flex h-3.5 items-end gap-[2px]", live && "eq-live", className)}>
      <span className="eq-bar h-full w-[3px] rounded-full bg-accent-text" />
      <span className="eq-bar h-full w-[3px] rounded-full bg-accent-text" />
      <span className="eq-bar h-full w-[3px] rounded-full bg-accent-text" />
    </span>
  );
}
