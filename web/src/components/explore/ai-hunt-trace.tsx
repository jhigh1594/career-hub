"use client";

import { useEffect, useMemo, useRef } from "react";
import { PetalSeal } from "@/components/petal-seal";
import { cn } from "@/lib/cn";
import type { AiTraceChunk } from "@/lib/explore-ai";

// The live reasoning panel — a contained parchment card. Narration arrives as
// arbitrary stream deltas (split mid-word), so we coalesce every chunk, strip
// markdown, and re-split into clean sentences. Newest emphasized; auto-scrolls.
const STYLE = `
.co-reason__dot{width:.5rem;height:.5rem;border-radius:50%;background:var(--color-moss);animation:co-reason-blink 1.6s ease-in-out infinite}
.co-reason__body{-webkit-mask-image:linear-gradient(180deg,transparent,#000 16%);mask-image:linear-gradient(180deg,transparent,#000 16%)}
.co-reason__line{animation:co-reason-in .35s ease both}
@keyframes co-reason-blink{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes co-reason-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
@media(prefers-reduced-motion:reduce){.co-reason__dot,.co-reason__line{animation:none}}
`;

// Render **bold** spans inline without a full markdown engine.
function renderInline(s: string) {
  return s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

export function AiHuntTrace({ trace }: { trace: AiTraceChunk[] }) {
  const sentences = useMemo(() => {
    const full = trace
      .filter((c) => c.kind === "narration")
      .map((c) => (c as { text: string }).text)
      .join("");
    const clean = full.replace(/`/g, "").replace(/\s+/g, " ").trim();
    if (!clean) return [];
    // split into sentences (after . ! ? …), drop leading markdown bullets/quotes
    return clean
      .split(/(?<=[.!?…])\s+/)
      .map((s) => s.replace(/^[>\-*\s]+/, "").trim())
      .filter((s) => s.length > 2)
      .slice(-6);
  }, [trace]);

  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [sentences.length]);

  if (sentences.length === 0) return null;

  return (
    <div className="w-full max-w-2xl rounded-[20px] border border-hairline bg-surface text-left shadow-[0_12px_32px_rgba(20,58,43,0.10)]">
      <style>{STYLE}</style>
      <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
        <span className="co-reason__dot" />
        <span className="text-[12px] font-medium text-foreground">Reasoning live</span>
        <PetalSeal size="bullet" className="ml-auto text-moss/60" />
      </div>
      <div ref={bodyRef} className="co-reason__body flex max-h-52 flex-col gap-2 overflow-y-auto px-4 py-3">
        {sentences.map((s, i) => (
          <p
            key={`${sentences.length}-${i}`}
            className={cn("co-reason__line text-[13.5px] leading-relaxed", i === sentences.length - 1 ? "text-foreground" : "text-muted")}
          >
            {renderInline(s)}
          </p>
        ))}
      </div>
    </div>
  );
}
