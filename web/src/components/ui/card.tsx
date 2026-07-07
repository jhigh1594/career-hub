import { cn } from "@/lib/cn";

// Verdara card. Parchment surface on parchment canvas, 1px hairline border,
// 20px radius. The old brand-gradient corner is gone (Verdara forbids
// gradients); depth comes from the hairline + optional low shadow.
// `corner` is retained as a no-op so existing callers keep typechecking
// during the migration sweep. `feature` renders a flat solid-accent tile.
type FeatureTone = "ochre" | "coral" | "mist" | "sage" | "moss";

const FEATURE: Record<FeatureTone, string> = {
  ochre: "bg-ochre text-moss",
  coral: "bg-coral text-parchment",
  mist: "bg-mist text-moss",
  sage: "bg-sage text-moss",
  moss: "bg-moss text-parchment",
};

export function Card({
  className,
  elevated,
  feature,
  corner: _corner,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  elevated?: boolean;
  feature?: FeatureTone;
  /** @deprecated retained for caller compatibility during migration */
  corner?: "br" | "bl" | "tr" | "tl";
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[20px] p-5",
        feature
          ? cn("border-0", FEATURE[feature])
          : "border border-hairline bg-surface text-foreground",
        elevated && "shadow-[0_12px_32px_rgba(20,58,43,0.10)]",
        className,
      )}
      {...props}
    />
  );
}
