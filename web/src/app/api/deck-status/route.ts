import { NextRequest } from "next/server";
import { findDeckRow } from "@/lib/career-ops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Status of a generated deck for a report — reads the canonical
// data/deck-index.tsv ledger the deck mode writes after generate+deploy. The
// report-detail button polls this once its `deck` worker finishes to decide
// between "View deck" (external live URL) + PDF link, the local HTML fallback
// (deploy failed / anonymous expired), or nothing-yet.
export async function GET(req: NextRequest) {
  const report = (req.nextUrl.searchParams.get("report") ?? "").trim();
  if (!report) return new Response("report required", { status: 400 });
  const row = findDeckRow(report);
  if (!row) return Response.json({ hasDeck: false });
  return Response.json({
    hasDeck: true,
    deckUrl: row.deckUrl || null,
    authMode: row.authMode || null,
    hasHtml: Boolean(row.html),
    hasPdf: Boolean(row.pdf),
    date: row.date || null,
  });
}
