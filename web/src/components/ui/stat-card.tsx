import Link from "next/link";
import { instrumentSerif } from "@/lib/fonts";
import { cn } from "@/lib/cn";
import { PetalSeal } from "@/components/petal-seal";

// Verdara stat tile. `featured` renders a moss color-block with an oversized
// Fraunces number + faint Petal-Seal watermark (Verdara stat-band pattern).
// Default renders a hairline parchment card. Gradients are gone (Verdara
// forbids them); depth comes from solid color + hairline.
export function StatCard({
  href,
  icon: Icon,
  value,
  label,
  hint,
  featured = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  value: number | string;
  label: string;
  hint: string;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative block overflow-hidden rounded-[20px] p-5 transition-colors",
        featured
          ? "bg-moss text-parchment"
          : "border border-hairline bg-surface text-foreground hover:border-moss/40 hover:bg-surface-hover",
      )}
    >
      {featured && (
        <PetalSeal size="watermark" className="absolute -bottom-12 -right-12 h-64 w-64 text-parchment opacity-[0.10]" />
      )}
      <Icon className={cn("relative size-5", featured ? "text-ochre" : "text-moss")} />
      <div
        className={cn(
          "relative mt-3 text-4xl leading-none tabular-nums",
          featured ? instrumentSerif.className : "font-semibold",
        )}
      >
        {value}
      </div>
      <div className="relative mt-2 text-sm">{label}</div>
      <div className={cn("relative text-xs", featured ? "text-parchment/70" : "text-faint")}>{hint}</div>
    </Link>
  );
}
