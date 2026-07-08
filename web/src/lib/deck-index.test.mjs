import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDeckIndex, findRow } from "./deck-index.mjs";

const HEADER = "report\tdeck_url\tauth_mode\thtml\tpdf\tdate\n";

test("empty / missing input returns []", () => {
  assert.deepEqual(parseDeckIndex(""), []);
  assert.deepEqual(parseDeckIndex(null), []);
});

test("parses header + two rows into typed rows", () => {
  const tsv = HEADER + "042\thttps://here.now/a\tpermanent\toutput/deck-a/index.html\toutput/deck-a.pdf\t2026-07-07\n" + "043\thttps://here.now/b\tanonymous\t\t\t2026-07-08\n";
  const rows = parseDeckIndex(tsv);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { report: "042", deckUrl: "https://here.now/a", authMode: "permanent", html: "output/deck-a/index.html", pdf: "output/deck-a.pdf", date: "2026-07-07" });
  assert.deepEqual(rows[1], { report: "043", deckUrl: "https://here.now/b", authMode: "anonymous", html: "", pdf: "", date: "2026-07-08" });
});

test("skips malformed / short rows without throwing", () => {
  const tsv = HEADER + "042\thttps://here.now/a\tpermanent\toutput/deck-a/index.html\toutput/deck-a.pdf\t2026-07-07\n" + "garbage line with no tabs\n" + "999\tonly\tthree\n";
  const rows = parseDeckIndex(tsv);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].report, "042");
});

test("splits on exactly \\t (a value with spaces survives)", () => {
  const tsv = HEADER + "042\thttps://here.now/a\tpermanent\tpath with spaces/index.html\toutput/deck-a.pdf\t2026-07-07\n";
  const rows = parseDeckIndex(tsv);
  assert.equal(rows[0].html, "path with spaces/index.html");
});

test("findRow returns the match or null", () => {
  const tsv = HEADER + "042\thttps://here.now/a\tpermanent\thtml\tpdf\t2026-07-07\n";
  assert.equal(findRow(tsv, "042").deckUrl, "https://here.now/a");
  assert.equal(findRow(tsv, "999"), null);
});

test("report-anchored: rows are distinct by report, not cross-matched", () => {
  const tsv = HEADER + "042\turl-a\tpermanent\thtml\tpdf\t2026-07-07\n" + "043\turl-b\tanonymous\t\t\t2026-07-08\n";
  assert.equal(findRow(tsv, "042").deckUrl, "url-a");
  assert.equal(findRow(tsv, "043").deckUrl, "url-b");
});
