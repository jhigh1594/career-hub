// Pure deck-index.tsv parser (no fs) — kept as plain .mjs so it can be tested
// with `node --test` like lib/clean-chips.mjs. career-ops.ts reads the file and
// delegates here. Columns: report, deck_url, auth_mode, html, pdf, date.
// Tolerant: bad/short rows are skipped, never thrown.

/**
 * @param {string} tsv
 * @returns {Array<{report:string, deckUrl:string, authMode:string, html:string, pdf:string, date:string}>}
 */
export function parseDeckIndex(tsv) {
  if (!tsv) return [];
  const rows = [];
  const lines = tsv.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (i === 0 && line.startsWith("report\t")) continue; // header
    const c = line.split("\t");
    if (c.length < 6) continue;
    const [report, deckUrl, authMode, html, pdf, date] = c;
    if (!report) continue;
    rows.push({ report, deckUrl, authMode, html, pdf, date });
  }
  return rows;
}

/** Find the row for a report number, or null. */
export function findRow(tsv, n) {
  return parseDeckIndex(tsv).find((r) => r.report === n) ?? null;
}
