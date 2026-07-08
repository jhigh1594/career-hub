import { NextRequest } from "next/server";
import fs from "node:fs";
import { resolveDeckArtifact } from "@/lib/career-ops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Local HTML fallback for when the live here.now URL is absent (deploy failed or
// the anonymous 24h link expired). Serves output/deck-{slug}/index.html — the
// same directory the here-now skill publishes. The primary "View deck" link in
// the UI points at the external deck_url; this route is the fallback only.
// Resolution + path containment live in career-ops.ts (resolveDeckArtifact).
export async function GET(req: NextRequest) {
  const report = (req.nextUrl.searchParams.get("report") ?? "").trim();
  if (!report) return new Response("report required", { status: 400 });
  const file = resolveDeckArtifact(report, "html");
  if (!file) return new Response("no deck HTML found for this report", { status: 404 });
  try {
    const buf = fs.readFileSync(file);
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch {
    return new Response("could not read the deck", { status: 500 });
  }
}
