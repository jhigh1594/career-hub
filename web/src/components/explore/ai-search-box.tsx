"use client";

import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { CostBadge } from "@/components/cost/cost-badge";
import { PetalSeal } from "@/components/petal-seal";

const EXAMPLES = [
  "AI infra roles at climate startups, remote EU",
  "Forward-deployed engineer at Series A devtools, US-remote",
  "Head of Applied AI at healthtech, posted this week",
];

// Natural-language search box: a hairline surface that warms to an ochre halo
// on focus. Effect CSS co-located per the Tailwind v4 stale-CSS HMR gotcha.
const STYLE = `
.co-aibox{position:relative;border-radius:1.1rem;border:1px solid var(--color-hairline);background:var(--color-surface);transition:border-color .3s,box-shadow .3s}
.co-aibox:focus-within{border-color:var(--color-ochre);box-shadow:0 0 0 3px rgba(242,178,51,.45)}
.co-aibox textarea{width:100%;resize:none;background:transparent;border:none;outline:none;font-size:16px;line-height:1.5;color:inherit}
.co-aibox textarea::placeholder{color:var(--color-faint)}
@media(prefers-reduced-motion:reduce){.co-aibox{transition:none}}
`;

export function AiSearchBox({
  intent,
  onIntent,
  onSubmit,
  cliConfigured,
  cliName,
  onRunScan,
}: {
  intent: string;
  onIntent: (s: string) => void;
  onSubmit: () => void;
  cliConfigured: boolean;
  cliName?: string;
  onRunScan: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const grow = () => {
    const t = ref.current;
    if (t) {
      t.style.height = "auto";
      t.style.height = `${Math.min(t.scrollHeight, 160)}px`;
    }
  };

  return (
    <div>
      <style>{STYLE}</style>
      <div className="co-aibox p-4">
        <div className="mb-2 flex items-center gap-2 text-[12px] font-medium text-moss">
          <PetalSeal size="bullet" /> Describe the role — an AI hunts the open web for it
        </div>
        <textarea
          ref={ref}
          rows={2}
          value={intent}
          onChange={(e) => {
            onIntent(e.target.value);
            grow();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (intent.trim()) onSubmit();
            }
          }}
          placeholder="“AI infra at climate startups, remote EU, not staff-level” — plain language, your words"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[12px] text-muted">
            {cliConfigured ? (
              <>
                Reads the public web with <span className="text-foreground">{cliName || "your CLI"}</span> — it costs your tokens.
              </>
            ) : (
              "Connect an AI CLI in Config to use AI search."
            )}
          </span>
          <button
            type="button"
            disabled={!intent.trim()}
            onClick={onSubmit}
            className="inline-flex items-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-parchment transition hover:bg-deep-loam disabled:opacity-50"
          >
            Search the open web
            <CostBadge kind="spend" size="xs" />
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => onIntent(ex)}
            className="rounded-full border border-hairline bg-surface/60 px-3 py-1.5 text-[12px] text-muted transition hover:border-moss/40 hover:text-moss"
          >
            {ex}
          </button>
        ))}
        <button type="button" onClick={onRunScan} className="ml-auto inline-flex items-center gap-1 text-[12px] text-faint transition hover:text-foreground">
          or run the free Scan instead →
        </button>
      </div>
    </div>
  );
}
