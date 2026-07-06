#!/usr/bin/env node
// weekly-packet.mjs — weekly aggregator.

/**
 * Pure: build the weekly SUMMARY markdown from parsed tracker rows.
 *
 * @param {Array<object>} rows - output of tracker-parse.mjs parseTrackerRow().
 * @param {Record<string,string>} reportTexts - report path -> report text (for rationale).
 *   Keys must match `row.report` verbatim from `parseTrackerRow()` — the CLI wrapper
 *   indexes this map by that exact string, so a key/path mismatch silently falls back
 *   to "see report" rather than crashing.
 * @param {{week: string, threshold?: number, top?: number}} opts
 *   - week: a YYYY-MM-DD inside the target week (Mon-start; a Sunday resolves to the
 *     Mon..Sun window just ended). Bad/missing week falls back to "all time" + a bare header.
 *   - threshold: min score to count as "qualified" (default 4.0).
 *   - top: cap qualified rows shown (default 8).
 * @returns {string} SUMMARY markdown.
 */
export function buildSummary(rows, reportTexts, opts) {
  const threshold = opts.threshold ?? 4.0;
  const top = opts.top ?? 8;
  const BELOW_BAR_CAP = 5; // ponytail: separate smaller cap for near-misses; name if scaling needed

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
    nextBest.slice(0, BELOW_BAR_CAP).forEach((r, i) => {
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

// ── CLI wrapper ────────────────────────────────────────────────────
// Reads data/applications.md via tracker-parse.mjs (DRY — no re-parse),
// reads each report, calls buildSummary, writes output/weekly/{week}/SUMMARY.md.

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { resolveColumns, parseTrackerRow } from './tracker-parse.mjs';

const __filename = fileURLToPath(import.meta.url);

function usage() {
  console.log(`usage: node weekly-packet.mjs [--week YYYY-MM-DD] [--top N] [--threshold F] [--applications PATH] [--reports DIR] [--out DIR]

  --week        a date inside the target week (default: today)
  --top         max qualified rows in table (default 8)
  --threshold   min score to qualify (default 4.0)
  --applications  tracker path (default data/applications.md)
  --reports     reports dir (default reports)
  --out         output root (default output/weekly)`);
}

function todayYMD() {
  // ponytail: derive from system clock for CLI default; tests pass --week explicitly.
  return new Date().toISOString().slice(0, 10);
}

function parseFlags(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { out.help = true; continue; }
    if (a.startsWith('--')) {
      const key = a.slice(2);
      out[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    }
  }
  return out;
}

// Mon-start week (matches buildSummary's weekRange). Output folder named by the
// Monday of that week, YYYYMMDD, so reruns of the same week are idempotent.
function weekFolderTag(week) {
  const dayMs = 86_400_000;
  const ms = Date.parse(week + 'T00:00:00Z');
  if (Number.isNaN(ms)) return week.replace(/[^0-9a-z]/gi, '-');
  const dow = new Date(ms).getUTCDay(); // 0=Sun..6=Sat
  const mondayMs = ms - ((dow + 6) % 7) * dayMs;
  return new Date(mondayMs).toISOString().slice(0, 10).replace(/-/g, '');
}

async function main() {
  const args = parseFlags(process.argv.slice(2));
  if (args.help) { usage(); return; }

  const week = args.week || todayYMD();
  const top = args.top ? parseInt(args.top, 10) : 8;
  const threshold = args.threshold ? parseFloat(args.threshold) : 4.0;
  const applicationsPath = args.applications || 'data/applications.md';
  const reportsDir = args.reports || 'reports';
  const outRoot = args.out || 'output/weekly';

  if (!existsSync(applicationsPath)) {
    console.error(`weekly-packet: ${applicationsPath} not found — nothing to summarize yet.`);
    process.exit(2);
  }

  const raw = readFileSync(applicationsPath, 'utf8').split('\n');
  const colmap = resolveColumns(raw);
  // Data rows: lines starting with '|', excluding separator rows and the header row.
  const dataRows = raw
    .map(l => l.trim())
    .filter(l => l.startsWith('|') && !/\|\s*[-:]+\s*\|/.test(l))
    .filter((l, i, arr) => i > 0 || !/^\|\s*#?\s*num\b/i.test(l))
    .map(l => parseTrackerRow(l, colmap))
    .filter(Boolean);

  // Load report text for each row. Try the report path verbatim first (handles
  // absolute paths and cwd-relative paths like `reports/001.md`), then fall back
  // to <reportsDir>/<basename> so --reports can redirect a non-default reports dir.
  // Key is always the verbatim `r.report` string (buildSummary looks it up by that).
  const reportTexts = {};
  for (const r of dataRows) {
    if (!r.report) continue;
    const candidates = [resolve(r.report), resolve(reportsDir, r.report)];
    const rp = candidates.find(p => existsSync(p));
    if (rp) reportTexts[r.report] = readFileSync(rp, 'utf8');
  }

  const summary = buildSummary(dataRows, reportTexts, { week, threshold, top });

  const outDir = resolve(outRoot, weekFolderTag(week));
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, 'SUMMARY.md');
  writeFileSync(outPath, summary);
  console.log(`weekly-packet: wrote ${outPath} (${dataRows.length} tracker rows scanned)`);
}

if (process.argv[1] === __filename) main();
