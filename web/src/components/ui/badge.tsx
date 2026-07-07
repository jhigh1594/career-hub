import { cn } from "@/lib/cn";

// Verdara badge — solid-accent pill. Score/status grades route through the
// good/warn/bad scale mapped onto the Verdara palette (sage / ochre / coral).
// Pill shape per Verdara; no dark variants (light-only).
export function Badge({
  className,
  tone = "muted",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "good" | "warn" | "bad" | "muted" | "moss" | "mist";
}) {
  const tones = {
    good: "bg-sage text-moss",
    warn: "bg-ochre text-moss",
    bad: "bg-coral text-parchment",
    muted: "bg-surface-hover text-muted",
    moss: "bg-moss text-parchment",
    mist: "bg-mist text-moss",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide tabular-nums",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
