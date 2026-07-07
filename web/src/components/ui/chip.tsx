import { cn } from "@/lib/cn";

// Verdara chip — field-sage pill with moss label. Used for filters, tags,
// and inline metadata. `tone` overrides the accent for status chips.
export function Chip({
  className,
  tone = "sage",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "sage" | "ochre" | "coral" | "mist" | "moss";
}) {
  const tones = {
    sage: "bg-sage text-moss",
    ochre: "bg-ochre text-moss",
    coral: "bg-coral text-parchment",
    mist: "bg-mist text-moss",
    moss: "bg-moss text-parchment",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
