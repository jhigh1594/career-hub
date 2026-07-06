#!/usr/bin/env node
// weekly-packet.mjs — weekly aggregator.

/**
 * Pure: build the weekly SUMMARY markdown from parsed tracker rows.
 *
 * @param {Array<object>} rows - output of tracker-parse.mjs parseTrackerRow().
 * @param {Record<string,string>} reportTexts - report path -> report text (for rationale).
 * @param {{week: string, threshold?: number, top?: number}} opts
 *   - week: a YYYY-MM-DD inside the target week (week = that day's calendar week, Sun-start).
 *   - threshold: min score to count as "qualified" (default 4.0).
 *   - top: cap qualified rows shown (default 8).
 * @returns {string} SUMMARY markdown.
 */
export function buildSummary(rows, reportTexts, opts) {
  const threshold = opts.threshold ?? 4.0;
  const top = opts.top ?? 8;

  const { start, end } = weekRange(opts.week);

  const inWeek = rows.filter(r => {
    const score = parseScore(r.score);
    if (score == null) return false;
    const d = parseDate(r.date);
    return d != null && d >= start && d <= end;
  });

  const scored = inWeek
    .map(r => ({ ...r, _score: parseScore(r.score) }))
    .sort((a, b) => b._score - a._score);

  const qualified = scored.filter(r => r._score >= threshold);
  const nextBest = scored.filter(r => r._score < threshold);

  const lines = [];

  if (qualified.length === 0) {
    lines.push(headerLine(start));
    lines.push('');
    lines.push(`> No roles met the ${threshold}/5 bar this week.`);
    if (nextBest.length) {
      lines.push('> Below-bar roles worth a look:');
      lines.push('');
      lines.push('| # | Score | Company | Role | Report |');
      lines.push('|---|-------|---------|-------|--------|');
      nextBest.slice(0, top).forEach((r, i) => {
        lines.push(`| ${i + 1} | ${r.score} | ${r.company} | ${r.role} | ${r.report || '—'} |`);
      });
      lines.push('');
    }
    return lines.join('\n');
  }

  lines.push(headerLine(start));
  lines.push('');
  lines.push(`Qualified (≥ ${threshold}/5): ${qualified.length} role(s). Ranked by score.`);
  lines.push('');
  lines.push('| # | Score | Company | Role | Why it fits | Report |');
  lines.push('|---|-------|---------|-------|-------------|--------|');
  qualified.slice(0, top).forEach((r, i) => {
    const why = fitOneLiner(reportTexts[r.report] || '', r);
    lines.push(`| ${i + 1} | ${r.score} | ${r.company} | ${r.role} | ${why} | ${r.report || '—'} |`);
  });
  lines.push('');

  if (nextBest.length) {
    lines.push('### Below bar (review at your discretion)');
    lines.push('');
    nextBest.slice(0, 5).forEach((r, i) => {
      lines.push(`- ${r.score} — **${r.company}** / ${r.role} — ${r.report || ''}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

/** Pull the first non-empty, non-heading line from the report as a one-line rationale. */
function fitOneLiner(reportText, row) {
  const line = reportText
    .split('\n')
    .map(l => l.trim())
    .find(l => l && !l.startsWith('#') && !l.startsWith('|') && !l.startsWith('---'));
  // ponytail: first content line as rationale; escape pipes so it doesn't break the table.
  return (line || `see ${row.report || 'report'}`).replace(/\|/g, '\\|').slice(0, 140);
}

/** Parse "N.N/5" -> number, or null. */
function parseScore(cell) {
  if (typeof cell !== 'string') return null;
  const m = cell.match(/^(\d+(?:\.\d+)?)\/5$/);
  return m ? parseFloat(m[1]) : null;
}

/** Parse YYYY-MM-DD -> epoch ms, or null. */
function parseDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const ms = Date.parse(s + 'T00:00:00Z');
  return Number.isNaN(ms) ? null : ms;
}

/** epoch ms -> YYYY-MM-DD (UTC). */
function fmtISO(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Header line: bare when the week is unparseable, dated otherwise. */
function headerLine(start) {
  return Number.isFinite(start)
    ? `# Weekly Packet — week of ${fmtISO(start)}`
    : `# Weekly Packet`;
}

/** Mon-start calendar week containing `week` (YYYY-MM-DD). Returns {start,end} epoch ms.
 *  A Sunday --week resolves to the Mon..Sun window just ended (the natural
 *  "weekly packet" meaning: run Sunday, summarize the week that ended). */
function weekRange(week) {
  const ms = parseDate(week);
  if (ms == null) {
    // fall back to "everything" so a bad --week arg never silently empties the packet
    return { start: -Infinity, end: Infinity };
  }
  const dayMs = 86_400_000;
  const dow = new Date(ms).getUTCDay(); // 0=Sun..6=Sat
  const start = ms - ((dow + 6) % 7) * dayMs; // back up to Monday
  const end = start + 7 * dayMs - 1;          // through end of Sunday
  return { start, end };
}
