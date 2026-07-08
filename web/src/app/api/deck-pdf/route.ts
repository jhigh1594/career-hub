import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { resolveDeckArtifact } from "@/lib/career-ops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Serve the deck PDF the deck mode wrote (output/deck-{slug}.pdf), inline so it
// opens in the browser. Resolution + path containment live in career-ops.ts
// (resolveDeckArtifact) — the deck-index row path is only honored inside
// output/, never an absolute/escaping path (the ledger is LLM-authored).
export async function GET(req: NextRequest) {
  const report = (req.nextUrl.searchParams.get("report") ?? "").trim();
  if (!report) return new Response("report required", { status: 400 });
  const file = resolveDeckArtifact(report, "pdf");
  if (!file) return new Response("no deck PDF found for this report", { status: 404 });
  try {
    const buf = fs.readFileSync(file);
    // Sanitize the filename: strip control chars / quotes so a corrupt deck-index
    // row can't inject response headers via Content-Disposition.
    const safeName = path.basename(file).replace(/[\r\n"]+/g, "_");
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("could not read the PDF", { status: 500 });
  }
}
