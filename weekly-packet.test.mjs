#!/usr/bin/env node
// weekly-packet.test.mjs — unit test for buildSummary (pure function).
// Run: node weekly-packet.test.mjs

import { buildSummary } from './weekly-packet.mjs';

let passed = 0, failed = 0;
const ok = (c, m) => { c ? (console.log(`  ✅ ${m}`), passed++) : (console.error(`  ❌ ${m}`), failed++); };

// Fixture rows mimic tracker-parse.mjs output: {num, date, company, role, score, status, report, notes}
const rows = [
  { num: '1', date: '2026-07-01', company: 'Google',   role: 'Sustainability Lead',     score: '4.6/5', status: 'evaluated', report: 'reports/001-google-2026-07-01.md', notes: '' },
  { num: '2', date: '2026-07-02', company: 'Microsoft', role: 'Climate Program Manager', score: '4.2/5', status: 'evaluated', report: 'reports/002-microsoft-2026-07-02.md', notes: '' },
  { num: '3', date: '2026-07-03', company: 'Patagonia', role: 'ESG Strategy',           score: '3.8/5', status: 'evaluated', report: 'reports/003-patagonia-2026-07-03.md', notes: '' },
  { num: '4', date: '2026-07-04', company: 'Salesforce', role: 'Philanthropy Lead',     score: '**4.1/5**', status: 'evaluated', report: 'reports/004-salesforce-2026-07-04.md', notes: '' }, // bold score (tracker convention)
  { num: '5', date: '2026-06-20', company: 'StaleCo',   role: 'CSR Manager',            score: '4.5/5', status: 'evaluated', report: 'reports/005-staleco-2026-06-20.md', notes: '' }, // out of week
];

const reportTexts = {
  'reports/001-google-2026-07-01.md': '# Google — Sustainability Lead\nMission fit: strong. Tech-co climate roadmap aligns with her proof points.\n',
  'reports/002-microsoft-2026-07-02.md': '# Microsoft — Climate Program Manager\nStrong program-management muscle match.\n',
  'reports/003-patagonia-2026-07-03.md': '# Patagonia — ESG Strategy\nDecent but level below target.\n',
  'reports/004-salesforce-2026-07-04.md': '# Salesforce — Philanthropy Lead\nFoundation experience direct match.\n',
};

const week = '2026-07-05'; // Sunday; week covers 2026-06-29 .. 2026-07-05

// Case 1: filters by score threshold + week, ranks desc.
let out = buildSummary(rows, reportTexts, { week, threshold: 4.0, top: 8 });
ok(out.includes('Google'), 'includes Google (4.6, in-week)');
ok(out.includes('Microsoft'), 'includes Microsoft (4.2, in-week)');
ok(out.includes('Salesforce'), 'includes Salesforce (4.1, in-week)');
ok(!out.includes('StaleCo'), 'excludes out-of-week row (2026-06-20)');
const patagoniaInQualifiedTable = out
  .split('\n')
  .some(l => l.startsWith('|') && l.includes('Patagonia'));
ok(!patagoniaInQualifiedTable, 'excludes below-threshold (3.8) from qualified table');
ok(out.indexOf('Google') < out.indexOf('Microsoft'), 'ranked: Google (4.6) before Microsoft (4.2)');

// Case 2: zero-qualified fallback lists next-best below threshold.
const onlyLow = [
  { num: '1', date: '2026-07-01', company: 'LowCo', role: 'CSR Manager', score: '3.5/5', status: 'evaluated', report: 'reports/001-lowco.md', notes: '' },
];
const out2 = buildSummary(onlyLow, { 'reports/001-lowco.md': '# LowCo\n' }, { week, threshold: 4.0, top: 8 });
ok(/no roles met/i.test(out2), 'zero-qualified SUMMARY states it explicitly');
ok(out2.includes('LowCo'), 'zero-qualified SUMMARY lists next-best');

// Case 3: top N cap respected.
const many = Array.from({ length: 12 }, (_, i) => ({
  num: String(i + 1), date: '2026-07-03', company: `Co${i}`, role: 'Sustainability Lead',
  score: '4.5/5', status: 'evaluated', report: `reports/${i}.md`, notes: '',
}));
const out3 = buildSummary(many, {}, { week, threshold: 4.0, top: 5 });
const tableRows = out3.split('\n').filter(l => l.startsWith('|') && /Co\d/.test(l)).length;
ok(tableRows === 5, `top N cap: 5 rows in table (got ${tableRows})`);

// Case 4: bad/missing week must not crash (graceful bare header).
let badWeekOk = true;
try {
  const out4 = buildSummary(rows, reportTexts, { threshold: 4.0, top: 8 });
  badWeekOk = typeof out4 === 'string' && /^# Weekly Packet\s*$/m.test(out4.split('\n')[0]);
} catch { badWeekOk = false; }
ok(badWeekOk, 'missing --week does not crash, emits bare header');

console.log(`\n${failed === 0 ? 'ALL PASS' : 'FAILURES'} — ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
