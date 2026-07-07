import { PetalSeal } from "@/components/petal-seal";

// Verdara has no gradients/glass — the old animated grain-gradient glow is
// replaced by a static, faint Petal-Seal watermark. Same component name and
// absolute full-bleed positioning so existing callers (Today, first-run,
// job detail) need no edits. Zero LCP cost (inline SVG), no theme dependency.
export function HeroGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <PetalSeal
        size="watermark"
        className="absolute -right-24 -top-24 h-[420px] w-[420px] text-moss opacity-[0.06]"
      />
      <PetalSeal
        size="watermark"
        className="absolute -bottom-32 -left-32 h-[360px] w-[360px] text-ochre opacity-[0.07]"
      />
    </div>
  );
}
