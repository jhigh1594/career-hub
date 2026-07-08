#!/usr/bin/env node
/**
 * generate-deck.mjs — Renders a multi-slide case-study deck payload to HTML + PDF.
 *
 * Usage:
 *   node generate-deck.mjs --payload payload.json
 *   node generate-deck.mjs --payload payload.json --report 042 --format a4
 *
 * Fills templates/deck-template.html (8-beat slide grammar), writes the HTML to
 * output/deck-{slug}/index.html (a directory publishable by the here-now skill),
 * and renders a PDF sibling via the same Playwright pipeline as CVs
 * (generate-pdf.mjs). Decks opt out of data/pdf-index.tsv (skipManifest) and are
 * tracked separately in data/deck-index.tsv by the deck mode after deploy.
 *
 * `buildDeckHtml` is exported pure so the template/substitution logic is testable
 * without Playwright (renderHtmlToPdf is imported lazily inside main).
 */

import { readFileSync, existsSync, mkdirSync } from "fs";
import { dirname, resolve, join } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { parseArgs } from "util";

const OUTPUT_ROOT = resolve("output");
const DEFAULT_ACCENT = "#1a1a2e";

// Strict color allowlist. {{ACCENT}} is injected into a CSS rule context, where
// HTML-escaping does nothing — a value like "red;} *{...}" would break out of
// the rule (CSS injection). Only hex and a small named set pass; everything else
// falls back to the default. Never pass ACCENT through escapeHtml into CSS.
const NAMED_COLORS = new Set([
  "black", "white", "red", "green", "blue", "navy", "teal", "orange",
  "purple", "maroon", "gray", "grey", "silver",
]);
function sanitizeAccent(value) {
  if (!value) return DEFAULT_ACCENT;
  const v = String(value).trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return v;
  if (NAMED_COLORS.has(v.toLowerCase())) return v.toLowerCase();
  return DEFAULT_ACCENT;
}

function _require(obj, keys, context) {
  for (const key of keys) {
    if (!obj || typeof obj !== "object" || !(key in obj)) {
      throw new Error(`Missing required field: ${context}.${key}`);
    }
  }
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Ponytail: minimal markdown-ish bold support (**x** -> <strong>x</strong>) so
// beat prose can emphasize a phrase without the payload carrying raw HTML.
// Operates on already-escaped text.
function withBold(escaped) {
  return escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function esc(text) {
  return withBold(escapeHtml(text));
}

function asUrl(value) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function buildContactLine(candidate) {
  const parts = [];
  if (candidate.location) parts.push(escapeHtml(candidate.location));
  if (candidate.email) {
    const email = escapeHtml(candidate.email);
    parts.push(`<a href="mailto:${email}">${email}</a>`);
  }
  if (candidate.phone) parts.push(escapeHtml(candidate.phone));
  if (candidate.linkedin) {
    parts.push(`<a href="${escapeHtml(asUrl(candidate.linkedin))}">LinkedIn</a>`);
  }
  if (candidate.github) {
    const display = candidate.github.replace(/^https?:\/\//, "");
    parts.push(`<a href="${escapeHtml(asUrl(candidate.github))}">${escapeHtml(display)}</a>`);
  }
  return parts.join(' &nbsp;|&nbsp; ');
}

function buildArtifactFigure(artifact) {
  if (!artifact || !artifact.src) return "";
  // artifact_alt is REQUIRED when an artifact is present — a bare <img> with
  // empty/templated alt is both an AI-slop tell and an a11y failure on the
  // live URL. The mode flags missing alt; here we render alt="" defensively but
  // the generator cannot invent one (source-of-truth boundary).
  const alt = escapeHtml(artifact.alt || "");
  const caption = artifact.caption
    ? `\n      <figcaption>${esc(artifact.caption)}</figcaption>`
    : "";
  return `
    <figure class="artifact">
      <img src="${escapeHtml(artifact.src)}" alt="${alt}">
      ${caption}
    </figure>`;
}

function buildStudySlides(study) {
  // Each beat with content becomes its own slide section; empty beats are
  // omitted entirely (anti-slop: no empty placeholder chrome).
  const slides = [];
  const label = escapeHtml(study.label || study.id || "Case study");
  const meta = study.meta ? `<div class="study-meta">${esc(study.meta)}</div>` : "";

  if (study.context || study.problem) {
    const body = [study.context, study.problem].filter(Boolean).map(esc).join("<br><br>");
    slides.push(`
  <section class="slide" data-study="${escapeHtml(study.id || "")}" data-beat="problem">
    <div class="study-label">${label} · Context</div>
    ${meta}
    <div class="beat-h">${esc(study.problem_headline || "The problem")}</div>
    <div class="beat-body">${body}</div>
  </section>`);
  }

  if (study.approach || study.decision) {
    let body = "";
    if (study.approach) body += esc(study.approach);
    if (study.decision) {
      const d = study.decision;
      if (d.chosen || d.tradeoff) {
        body += `<div class="tradeoff">`;
        if (d.chosen) body += `<div class="col"><div class="col-h">Decision</div><div class="col-b">${esc(d.chosen)}</div></div>`;
        if (d.tradeoff) body += `<div class="col"><div class="col-h">Trade-off</div><div class="col-b">${esc(d.tradeoff)}</div></div>`;
        body += `</div>`;
      }
    }
    slides.push(`
  <section class="slide" data-study="${escapeHtml(study.id || "")}" data-beat="approach">
    <div class="study-label">${label} · Approach</div>
    <div class="beat-h">How I approached it</div>
    <div class="beat-body">${body}</div>
  </section>`);
  }

  if (study.solution || study.artifact) {
    const figure = buildArtifactFigure(study.artifact);
    slides.push(`
  <section class="slide" data-study="${escapeHtml(study.id || "")}" data-beat="solution">
    <div class="study-label">${label} · Solution</div>
    <div class="beat-h">What I shipped</div>
    <div class="beat-body">${study.solution ? esc(study.solution) : ""}</div>
    ${figure}
  </section>`);
  }

  if (study.outcome && (study.outcome.number || study.outcome.detail)) {
    const o = study.outcome;
    slides.push(`
  <section class="slide" data-study="${escapeHtml(study.id || "")}" data-beat="outcome">
    <div class="study-label">${label} · Outcome</div>
    ${o.number ? `<div class="outcome-number">${esc(o.number)}</div>` : ""}
    ${o.detail ? `<div class="outcome-detail">${esc(o.detail)}</div>` : ""}
  </section>`);
  }

  if (study.reflection) {
    slides.push(`
  <section class="slide" data-study="${escapeHtml(study.id || "")}" data-beat="reflection">
    <div class="study-label">${label} · Reflection</div>
    <div class="beat-h">What I'd do differently</div>
    <div class="reflection-body">${esc(study.reflection)}</div>
  </section>`);
  }

  return slides.join("\n");
}

export function buildDeckHtml(payload) {
  _require(payload, ["candidate", "deck"], "payload");
  const { candidate, deck } = payload;
  _require(candidate, ["name"], "candidate");
  _require(deck, ["role", "company", "hook_headline", "hook_metric"], "deck");

  const studies = Array.isArray(deck.studies) ? deck.studies : [];
  const accent = sanitizeAccent(deck.accent);

  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const templatePath = resolve(scriptDir, "templates", "deck-template.html");
  let html = readFileSync(templatePath, "utf-8");

  const contactLine = buildContactLine(candidate);
  const ctaContact = deck.cta_contact || contactLine;

  const studiesHtml = studies.map(buildStudySlides).join("\n");
  const povHtml = deck.pov
    ? `
  <section class="slide pov" id="pov">
    <div class="pov-kicker">Point of view</div>
    <div class="pov-body">${esc(deck.pov)}</div>
  </section>`
    : "";

  const replacements = {
    "{{LANG}}": escapeHtml(deck.lang || "en"),
    "{{ACCENT}}": accent, // already sanitized to a safe color token; NOT escaped
    "{{NAME}}": escapeHtml(candidate.name),
    "{{ROLE}}": escapeHtml(deck.role),
    "{{COMPANY}}": escapeHtml(deck.company),
    "{{CONTACT_LINE}}": contactLine,
    "{{HOOK_METRIC}}": escapeHtml(deck.hook_metric),
    "{{HOOK_HEADLINE}}": escapeHtml(deck.hook_headline),
    "{{STUDIES_HTML}}": studiesHtml,
    "{{POV_HTML}}": povHtml,
    "{{CTA_LINE}}": escapeHtml(deck.cta_line || `Let's talk about ${deck.role} at ${deck.company}.`),
    "{{CTA_CONTACT}}": ctaContact,
  };

  // Single-pass substitution: each {{TOKEN}} replaced exactly once against the
  // original template. A value containing a literal {{TOKEN}} stays literal
  // (not re-interpreted). Tokens with no entry are left untouched.
  return html.replace(/\{\{[A-Z_]+\}\}/g, (token) => replacements[token] ?? token);
}

function slugify(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

async function main() {
  const { values: args } = parseArgs({
    options: {
      payload: { type: "string" },
      format:  { type: "string" },
      report:  { type: "string" },
      out:     { type: "string" },
      help:    { type: "boolean", short: "h" },
    },
    strict: false,
  });

  if (args.help || !args.payload) {
    console.log(`
Usage:
  node generate-deck.mjs --payload payload.json [--report 042] [--format a4] [--out output/deck-slug/index.html]

  --payload   Path to the JSON payload file (required)
  --report    Report number (records provenance; deck-index row written by the mode after deploy)
  --format    Page format: a4 | letter (default a4)
  --out       Override HTML output path (PDF written alongside)
`);
    process.exit(args.help ? 0 : 1);
  }

  const payloadPath = resolve(args.payload);
  if (!existsSync(payloadPath)) {
    console.error(`ERROR: payload file not found: ${payloadPath}`);
    process.exit(1);
  }
  const payload = JSON.parse(readFileSync(payloadPath, "utf-8"));

  const company = slugify(payload.deck?.company || "company");
  const slug = `deck-${company}`;
  const htmlDir = args.out ? dirname(resolve(args.out)) : join(OUTPUT_ROOT, slug);
  const htmlPath = join(htmlDir, "index.html");
  const pdfPath = join(htmlDir + ".pdf");
  const format = args.format || payload.deck?.format || "a4";

  mkdirSync(htmlDir, { recursive: true });

  // Imported lazily so buildDeckHtml can be tested without Playwright.
  const { renderHtmlToPdf } = await import("./generate-pdf.mjs");

  try {
    const html = buildDeckHtml(payload);
    const { writeFileSync } = await import("fs");
    writeFileSync(htmlPath, html, "utf-8");
    console.log(`✅ Deck HTML: ${htmlPath}`);

    // skipManifest: decks keep their own index (data/deck-index.tsv), written by
    // the mode after deploy. Keeps data/pdf-index.tsv for CVs only.
    await renderHtmlToPdf(html, pdfPath, {
      format,
      reportNum: args.report || "",
      skipManifest: true,
      baseDir: htmlDir, // so relative artifact paths (output/deck-assets/...) resolve
    });
    console.log(`\nDeck PDF: ${pdfPath}`);
    console.log(`\nPublish with here-now:  ~/.claude/skills/here-now/scripts/publish.sh ${htmlDir}`);
  } catch (err) {
    console.error("ERROR generating deck:");
    console.error(err.message);
    process.exit(1);
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main();
