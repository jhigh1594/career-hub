"use client";

import { ApplyBackdrop } from "@/components/apply/apply-backdrop";
import { PetalSeal } from "@/components/petal-seal";
import { instrumentSerif } from "@/lib/fonts";
import { useCountUp } from "./discovering-state";
import { AiHuntTrace } from "./ai-hunt-trace";
import { DiscoveryCard } from "./discovery-card";
import { useExplore } from "./explore-provider";

// The AI hunt surface. The old glowing/spinning orbiter + sparkle iconography
// read as AI theatre; it's replaced by the Petal Seal — the system's own
// signature mark — with one quiet rotation. The effort ledger is a moss chip
// on the Verdara scale (no santifer-orange, no fake $0).
const STYLE = `
.co-aihunt{position:relative;z-index:1;display:flex;min-height:72vh;flex-direction:column;align-items:center;gap:1.2rem;padding:2.5rem 1rem 2rem;text-align:center}
.co-aiorb{display:grid;place-items:center;width:3rem;height:3rem;color:var(--color-moss)}
.co-aiorb .petal-seal{animation:co-seal-spin 6s linear infinite}
.co-ailedger{display:inline-flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.45rem;border-radius:999px;border:1px solid color-mix(in srgb,var(--color-moss) 30%,transparent);background:color-mix(in srgb,var(--color-moss) 8%,transparent);color:var(--color-moss);padding:.4rem .9rem;font-size:12.5px;font-weight:600}
@keyframes co-seal-spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.co-aiorb .petal-seal{animation:none}}
`;

export function AiHuntView({ cliName }: { cliName?: string }) {
  const { phase, matchCount, aiTrace, aiCost, offers } = useExplore();
  const shown = useCountUp(matchCount);
  const revealing = phase === "revealing";

  return (
    <>
      <ApplyBackdrop intense={!revealing} />
      <div className="co-aihunt">
        <style>{STYLE}</style>

        <span className="co-aiorb">
          <PetalSeal size="signature" className="h-12 w-12" />
        </span>

        <div>
          <h2 className={`${instrumentSerif.className} text-3xl leading-tight text-foreground`}>
            {matchCount > 0 ? `${shown} candidate${shown === 1 ? "" : "s"}` : "Hunting the open web"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {revealing ? "found — review them below" : matchCount > 0 ? "found so far · streaming in" : "casting across the public web…"}
          </p>
        </div>

        <div className="co-ailedger">
          <PetalSeal size="bullet" />
          {cliName || "your CLI"} · searching the open web
          {aiCost.searches > 0 && <span className="opacity-75">· {aiCost.searches} searches</span>}
          {matchCount > 0 && <span className="opacity-75">· {matchCount} found</span>}
        </div>

        <AiHuntTrace trace={aiTrace} />

        {offers.length > 0 && (
          <div className="mt-2 grid w-full max-w-4xl gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {offers.map((o) => (
              <DiscoveryCard key={o.url} offer={o} inPipeline={false} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
