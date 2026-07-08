"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Presentation, Loader2, ExternalLink, FileDown, RotateCcw, AlertTriangle } from "lucide-react";
import { useJobs } from "@/components/jobs/job-store";
import { CostBadge } from "@/components/cost/cost-badge";
import { scoreNum } from "@/lib/format";

// Fires the real career-ops `deck` mode (worker kind "deck") to build a
// multi-slide case-study deck tailored to THIS offer → output/deck-{slug}/ +
// here.now live URL (data/deck-index.tsv ledger). Mirrors GeneratePdfButton.
// Gated: decks are for strong-fit roles (score ≥ 4.0, per the mode's Step 0) and
// need case-studies.md (the mode's primary source). Once generated, becomes a
// "View deck" link (live URL, local-HTML fallback) + PDF + regenerate.
type DeckStatus = { hasDeck: boolean; deckUrl: string | null; authMode: string | null };

export function GenerateDeckButton({
  n,
  company,
  score,
  hasCaseStudies,
}: {
  n: string;
  company: string;
  score: string;
  hasCaseStudies: boolean;
}) {
  const { jobs, startJob } = useJobs();
  const job = useMemo(
    () => jobs.filter((j) => j.kind === "deck" && j.input === n).sort((a, b) => b.startedAt - a.startedAt)[0],
    [jobs, n],
  );
  const [status, setStatus] = useState<DeckStatus | null>(null);

  const generate = () =>
    startJob({ title: `Deck · ${company}`, subtitle: "case-study deck", kind: "deck", input: n, page: `/pipeline/${n}` });

  // Once the worker finishes, read the deck-index ledger to decide View-deck
  // (external URL) vs local-HTML fallback vs not-yet.
  useEffect(() => {
    if (job?.status !== "done") return;
    let cancelled = false;
    fetch(`/api/deck-status?report=${encodeURIComponent(n)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((s: DeckStatus | null) => { if (!cancelled) setStatus(s); })
      .catch(() => { if (!cancelled) setStatus(null); });
    return () => { cancelled = true; };
  }, [job?.status, n]);

  if (!hasCaseStudies)
    return (
      <button
        disabled
        title="Decks are built from case-studies.md — add case studies first (run /career-ops deck in the CLI)."
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-faint/60"
      >
        <Presentation className="size-3.5" /> Generate deck
      </button>
    );

  const strongFit = scoreNum(score) >= 4;
  if (!strongFit)
    return (
      <button
        disabled
        title="Decks are for strong-fit roles (score ≥ 4.0) — your time and the recruiter's attention are both valuable."
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-faint/60"
      >
        <Presentation className="size-3.5" /> Generate deck
      </button>
    );

  if (job?.status === "running")
    return (
      <Link href={`/jobs/${job.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
        <Loader2 className="size-3.5 animate-spin" /> Generating deck…
      </Link>
    );

  if (job?.status === "done" && status?.hasDeck) {
    const viewHref = status.deckUrl ?? `/api/deck-html?report=${encodeURIComponent(n)}`;
    return (
      <span className="inline-flex items-center gap-1">
        <a
          href={viewHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-moss/30 bg-moss/10 px-3 py-1 text-xs font-medium text-moss transition-colors hover:bg-moss/15"
        >
          <ExternalLink className="size-3.5" /> View deck
        </a>
        <a
          href={`/api/deck-pdf?report=${encodeURIComponent(n)}`}
          target="_blank"
          rel="noreferrer"
          title="Deck PDF (print / download)"
          className="inline-flex items-center rounded-full border border-moss/30 bg-moss/10 px-2 py-1 text-xs font-medium text-moss transition-colors hover:bg-moss/15"
        >
          <FileDown className="size-3.5" />
        </a>
        <button onClick={generate} title="Regenerate the deck" className="rounded-full p-1 text-faint transition-colors hover:text-brand">
          <RotateCcw className="size-3" />
        </button>
        {status.authMode === "anonymous" && (
          <span title="Anonymous here.now deploy — link expires in 24h. Set up here.now for a permanent URL." className="inline-flex items-center gap-1 text-[11px] text-coral">
            <AlertTriangle className="size-3" /> 24h
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        onClick={generate}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-brand/40 hover:text-brand"
        title="Generate a case-study deck tailored to this role"
      >
        <Presentation className="size-3.5" /> Generate deck
      </button>
      <CostBadge kind="spend" size="xs" />
    </span>
  );
}
