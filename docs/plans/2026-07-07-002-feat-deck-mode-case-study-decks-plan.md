---
title: "feat: Deck Mode — Case-Study Portfolio Decks"
type: feat
status: completed
created: 2026-07-07
origin: docs/brainstorms/deck-mode-requirements.md
research: docs/brainstorms/deck-mode-research.md
depth: standard
---

# Plan — Deck Mode (Case-Study Portfolio Decks)

Adds a `deck` mode that produces a multi-slide HTML case-study deck per application: deep competence proof + visual wow, drawn from a new tagged `case-studies.md`, deployed as a live here.now URL and rendered to PDF. Originates from `docs/brainstorms/deck-mode-research.md` (8-beat slide grammar, anti-slop guardrail) and `docs/brainstorms/deck-mode-requirements.md` (full requirements, scope boundaries, decisions log).

---

## Problem Frame

career-ops produces CVs, cover letters, application emails, and form answers — all text artifacts. None let a hiring manager see a candidate's work in depth. For a role-pivot candidate (ops/program → climate/mission-driven program & operations), the gap between "a bullet that says I led ESG volunteer programs" and "a hiring manager who believes it" is wide. The deck is the missing deep-proof object: 1-3 case studies in narrative depth, high visual craft, tailored per company.

**Goal of the deck (priority order):** (1) deep proof of competence, (2) pure differentiation / visual wow. Not a values-signaling axis (mission alignment shows through the case studies).

**Source-of-truth boundary holds (non-negotiable):** deck content generated only from `cv.md`, `case-studies.md`, `config/profile.yml`, `modes/_profile.md`, `article-digest.md`, `writing-samples/`, `voice-dna.md` (style only) + the live evaluation report for tailoring. Keywords reformulated, never fabricated. Deploying publishes externally — the boundary is the safety contract for that publication.

---

## Scope Boundaries

### In scope
- New user-layer source file `case-studies.md` + data-contract registration.
- New `templates/deck-template.html` (8-beat slide grammar).
- New `generate-deck.mjs` (reuses existing PDF renderer; mirrors `generate-cover-letter.mjs`).
- New `modes/deck.md` agent brain (context load, tag selection, JD-keyword mirroring, anti-slop guardrail, deploy gate).
- here.now deploy flow (agent-driven), `data/deck-index.tsv`, report-header URL, `cover`/`email` cross-ref, `.herenow/` gitignore.
- Registration across `SKILL.md`, `CLAUDE.md`, `AGENTS.md`, `README.md`, `SYSTEM_PATHS`.

### Deferred to Follow-Up Work (out of v1, sequenced for later)
- **Proven-out path (master+cuts model)** — revisit after 3 real decks, guided by a reuse-vs-rewrite log (see origin: Decisions). v1 ships manual mode structured C-shaped (tagged source + subset-accepting template) so the upgrade is a small step.
- **Auto-pipeline integration** — a deck gate in `modes/auto-pipeline.md` / `modes/pipeline.md` (e.g. `auto_deck_score_threshold`). Seam documented only; do not wire.
- **Go dashboard regen** — extend `dashboard/internal/data/pdf.go` `ResolveHTML` (hardcoded `cv-*.html`) and add a `runGenerateDeck` msg. v1 accepts CLI-only regeneration.
- **Language modes** — `modes/{lang}/deck.md`. Asset-generation modes (pdf/cover/email) are English-only by convention; no mirror required for v1.

### Outside this product's identity
- A hosted web app or dashboard for browsing decks (per-deck here.now deploys suffice).
- ATS optimization of the deck (the CV remains the ATS-safe object; decks are human-read supplementary wow).
- Native `.pptx` / Google Slides export (HTML + PDF only).

---

## Key Technical Decisions

1. **Reuse the existing PDF renderer; do not build a new Playwright pipeline.** `generate-deck.mjs` lazy-imports `renderHtmlToPdf`, `inlineLocalFonts`, `injectPrintPageCss` from `generate-pdf.mjs`. This inherits the #951 `file://`-origin fix, `document.fonts.ready` wait, `printBackground`, and `preferCSSPageSize` for free (see origin research §1). One generator per artifact type matches the established `generate-cover-letter.mjs` pattern.
2. **`generate-deck.mjs` mirrors `generate-cover-letter.mjs`** — exported pure `buildDeckHtml(payload)` (templateable without Playwright, unit-testable) + `main()` that parses args and calls the renderer lazily. Standalone test exercises the pure function only.
3. **Single-pass `{{TOKEN}}` substitution** — `html.replace(/\{\{[A-Z_]+\}\}/g, …)` with a replacements map; tokens not in the map stay literal. Matches the cover-letter contract (held by `test-all.mjs:5559-5588`). Avoids re-substitution bugs when a field value contains literal `{{...}}` text.
4. **ATS / print guards carried into the deck template verbatim** (from `templates/cv-template.html`): `font-variant-ligatures: none` + `"liga" 0, "clig" 0, "dlig" 0` on `*` and `body`; `-webkit-print-color-adjust: exact` on `html`; static system sans stack (not bundled variable woff2). Required for any colored slide background to survive PDF and for clean text extraction if a deck is ever forwarded/parsed.
5. **Multi-slide = one HTML document with CSS page breaks.** Slides are `<section class="slide">` separated by `page-break-after: always`; Playwright honors `@page` via `preferCSSPageSize: true`. One HTML → one multi-page PDF. Output artifact for here.now is a directory `output/deck-{slug}/index.html` (skill requires `index.html` at root).
6. **`case-studies.md` is separate from `article-digest.md`.** Different granularity: `article-digest.md` holds compact proof-point bullets; `case-studies.md` holds full 8-beat narrative. Same underlying facts, never contradictory — `article-digest.md` may seed the metric headlines, but the long-form structure does not fit its compact design. (Flag raised by institutional-learnings pass; resolved as separate file.)
7. **here.now deploy is agent-driven, not a repo script.** The here-now `publish.sh` lives at `<skill-dir>/scripts/publish.sh` (resolved skill dir, e.g. `~/.claude/skills/here-now/scripts/publish.sh`) — NOT at the skill root. `modes/deck.md` instructs the agent to invoke the here-now **skill by name** (which loads its own `SKILL.md` and knows its `scripts/` path); if a direct shell call is ever needed, the path is the skill's `scripts/publish.sh`, never `publish.sh` at the skill root. The repo gains no deploy script — only a mode instruction and a gitignore entry.
8. **here.now authenticated = supported; anonymous = warned fallback.** Anonymous sites expire in 24h — too short for recruiter timelines. The mode checks for `~/.herenow/credentials` (or `$HERENOW_API_KEY`); if absent, warns that the link expires in 24h and asks whether to proceed or set up a key before deploying.
9. **Deck URL recorded in two places, neither polluting the CV index.** (a) `**Deck:** {url}` header line in `reports/{NNN}-*.md` (next to `**URL:**`, `**Legitimacy:**`, `**PDF:**`) — every report-consuming mode already reads the header, so `cover`/`email` pick it up with a one-line instruction edit. (b) `data/deck-index.tsv` (`report \t deck_url \t html \t pdf \t date`) for queryability. `data/pdf-index.tsv` is left to CVs only.
10. **Deploy is user-gated.** Mirror `cover.md`'s "do NOT generate until the user approves" discipline: the agent generates HTML + PDF for review, then deploys only on explicit user confirmation (publishing is an outward-facing, hard-to-reverse action).
11. **Anti-slop guardrail enforced at schema + mode level.** Optional fields (artifact, quote) render empty when absent; core claim fields must trace to a source file. A slide renders *without* a metric rather than fabricating one — an unbacked metric trips the AI-resume flags hiring managers now actively scan (see origin research §anti-patterns). Visual dimension added (see Decision #14): uniform placeholder chrome across studies is itself a slop signal — absent fields collapse their slot entirely rather than render an empty card.
12. **`renderHtmlToPdf` gains a `skipManifest` opt-out (first edit to the shared renderer).** `generate-pdf.mjs:443` calls `updatePDFManifest` unconditionally inside the exported `renderHtmlToPdf`, so every `--report=` deck would pollute `data/pdf-index.tsv`. Extend `opts` with `skipManifest` (default `false`), guard the manifest call, and have `generate-deck.mjs` pass `{ reportNum, skipManifest: true }`. Cover-letter/CV behavior unchanged. This is the single surgical change the deck requires in an existing repo file — call it out in U3 so it isn't discovered mid-build.
13. **`{{ACCENT}}` is validated, not just escaped.** `escapeHtml` is for HTML text contexts; `{{ACCENT}}` is injected into a CSS rule, where HTML-escaping does nothing. `buildDeckHtml` validates ACCENT against a strict color regex (`/^#[0-9a-fA-F]{3,8}$/` or a named-color allowlist) and rejects/clamps to a default otherwise — closing a CSS-injection vector (user-controllable company color → arbitrary CSS / external-resource load).
14. **PII visibility is a separate gate from deploy.** A public `anyone-with-link` URL has a different threat model than an emailed PDF (crawlable, shareable, permanent). Before deploy, the mode distinguishes the full-contact PDF render from a web render that may strip to name+role or a single contact channel, and prompts the user to confirm what publishes publicly. When full PII must ship publicly, the mode offers here.now **restricted access** (password / email-allowlist via `PATCH /api/v1/publish/{slug}/access`) rather than defaulting to public.
15. **Template design contracts are pinned in U2, not deferred.** The template is the feature's entire visual surface; deferring every visual decision to "finalize during execution" leaves the implementer doing design during coding with no review gate. U2 carries concrete contracts for: responsive breakpoints + phone reflow, keyboard/focus/reduced-motion, artifact `<figure>`+alt-text, accent contrast, hook-slide visual singularity, POV-slide treatment, and the print-vs-screen media-query split.

---

## High-Level Technical Design

The deck is a four-stage agent flow, each stage a separate concern:

```
report + JD ──▶ [tailor] ──▶ payload ──▶ [render] ──▶ HTML ──┬─▶ [PDF] generate-pdf.mjs
                                                              └─▶ [deploy] here-now ──▶ URL
case-studies.md ──────────────⬆                     generate-deck.mjs (buildDeckHtml)
cv.md / profile / _profile ────┘
```

- **Tailor (agent, in `modes/deck.md`):** read report + JD + tagged `case-studies.md`; select 1-3 studies by tag fit; mirror JD keywords in slide headlines (reframe, never invent); assemble a payload.
- **Render (`generate-deck.mjs`):** `buildDeckHtml(payload)` does single-pass `{{TOKEN}}` substitution against `templates/deck-template.html`; `main()` calls `renderHtmlToPdf` for the PDF. Pure function = unit-testable without Playwright.
- **Deploy (agent, via here-now skill):** on user approval, publish `output/deck-{slug}/`; capture URL; write report header + `data/deck-index.tsv`.

### `case-studies.md` schema (directional)

Each study is a record with the 8-beat spine fields + tags. Markdown with a light structure the mode parses:

```
## [id] Metric-headline title
tags: ops, stakeholder-coordination, esg | hero: true
company: Atlassian | role: Program & Operations Lead | timeframe: 2021-2026
context: <prose — company, scale, team, your role, constraints>
problem: <prose — business pain, quantified>
approach: <prose — method, the insight that changed direction>
decision: <prose — options considered, why A beat B>
solution: <prose — what shipped> | artifact: output/deck-assets/{id}.png | artifact_alt: <one sourced sentence — what it shows and why> | artifact_caption: <optional>
outcome: <metric + baseline + timeframe>
reflection: <what went wrong, what you'd do differently>
```

Fields left empty render as omitted slides/sections, never as fabricated content. `artifact` is optional (path under `output/deck-assets/` or a URL); absence does not block the study but the mode warns (research: ≥1 real artifact per study or it reads junior).

### `templates/deck-template.html` token grammar (directional)

Wrapper + per-study block. Repeating slide groups are built as HTML strings in `buildDeckHtml` helpers and substituted into one slot (same sub-block pattern as cover-letter's achievements list):

```
{{LANG}} {{ACCENT}} {{NAME}} {{ROLE}} {{COMPANY}} {{CONTACT_LINE}}
{{HOOK_HEADLINE}} {{HOOK_METRIC}}
{{STUDIES_HTML}}   ← built from N study blocks, each a <section class="slide"> run
{{POV_HTML}}       ← optional point-of-view slide (senior separator)
{{CTA_HTML}}
```

Directional only; the implementer finalizes exact token names and CSS. Carry the ATS/print guards and the self-hosted `fonts/` reference (auto-inlined by `inlineLocalFonts`).

---

## Implementation Units

### U1. `case-studies.md` source file + data-contract registration

**Goal:** Establish the user-layer source file that holds tagged, 8-beat case studies, and register it across every place the source-of-truth boundary is enforced.

**Requirements:** Advances origin "Content pipeline" + "Source-of-truth boundary". Without this, the deck has no content source and any generation would fabricate.

**Dependencies:** none (foundational).

**Files:**
- `case-studies.md` (create — user layer; seeded empty with the schema block from High-Level Technical Design as a template + one worked example commented out)
- `CLAUDE.md` (modify — add `case-studies.md` to the User Layer list AND the Source-of-Truth Boundary in-scope list)
- `AGENTS.md` (modify — same two additions)
- `DATA_CONTRACT.md` (modify — add `case-studies.md` to the full user-layer list)
- `update-system.mjs` (modify — add `case-studies.md` to `USER_PATHS`, near `cv.md`/`article-digest.md`)
- `config/profile.example.yml` (modify — add an optional `deck:` block mirroring the `cover_letter:` block at ~line 100-122: `accent_color`, `default_format`, optional `deploy_base_url`; schema reference only, no user data)

**Approach:** The file is user-authored content (the agent helps draft it via interview, but the file itself is user layer). Seed it with the schema skeleton + one commented worked example so the structure is unambiguous. Data-contract registration in all three governance files is mandatory — an unlisted source is out-of-scope by default (institutional-learnings finding #3). `profile.example.yml` gains the optional deck block so accent/format have a schema home; actual values live in the user's `config/profile.yml` (never written programmatically).

**Patterns to follow:** `article-digest.md` role (compact proof points) is the nearest sibling — copy its file-level framing tone, different granularity. `cover_letter:` block in `config/profile.example.yml` is the schema-block template.

**Test scenarios:**
- **Covers origin Source-of-Truth Boundary.** A grep/parse check that `case-studies.md` appears in the User Layer list and the in-scope list of `CLAUDE.md`, `AGENTS.md`, and `DATA_CONTRACT.md` (failure = silently out-of-scope).
- `validate-system-paths-coverage.mjs` passes with `case-studies.md` present and registered in `USER_PATHS`.
- `case-studies.md` parses: each `## [id]` study has the required `tags`/`hero`/`company`/`role` lines and the 8-beat fields; missing-beat detection reports which study is incomplete.

**Verification:** `node validate-system-paths-coverage.mjs` exits clean; the three governance files all list `case-studies.md` in both the User Layer and Source-of-Truth sections.

---

### U2. `templates/deck-template.html`

**Goal:** The multi-slide deck visual template — high craft, 8-beat grammar, carrying the repo's hard-won ATS/print guards.

**Requirements:** Advances origin "Artifact shape" + "Slide grammar (research-derived)" + anti-slop rendering (empty fields omit, never fabricate).

**Dependencies:** U1 (schema must be settled so token names are stable).

**Files:**
- `templates/deck-template.html` (create — system layer; auto-covered by the `templates/` dir entry in `SYSTEM_PATHS`, no individual registration needed)
- `output/deck-assets/` (convention — where per-study artifacts live; `.gitkeep` so the dir exists, contents gitignored under `output/`)

**Approach:** Single HTML document; each study is a `<section class="slide">` run. Inline `<style>` (no external CSS — Chromium renders from `file://`). Tokens are `{{TOKEN}}` (single-pass contract). Repeating slide groups (studies, optional POV) are built as HTML strings in `buildDeckHtml` and substituted into one slot — the template holds one `{{STUDIES_HTML}}`, not a per-study loop.

**Carry-from-cv-template (these DO exist there):** ligature-disable rules (`font-variant-ligatures: none` + `"liga" 0, "clig" 0, "dlig" 0`), `-webkit-print-color-adjust: exact`, system sans fallback stack.

**Fonts/ self-hosting — net-new, NOT carried.** `cv-template.html` has no `@font-face` (it uses system stacks only). Author a new `@font-face` block in the deck template referencing `fonts/dm-sans-latin.woff2` and `fonts/space-grotesk-latin.woff2` via `url("./fonts/<file>")` — this exact form is what `inlineLocalFonts` (generate-pdf.mjs, regex `url(\s*(['\"]?)\./fonts/...`) matches and auto-inlines as data: URLs. Pair every custom font with the system sans fallback so a failed load still renders.

**Design contracts (pinned, not deferred — the template is the feature's visual surface):**

- **Responsive / mobile (P0).** Primary breakpoint `min-width: 768px` = desktop multi-column slide; below = single-column stacked, full-bleed artifact, vertical scroll-snap. On phone width the hook headline + metric stay above the fold; multi-column decision lists collapse to one column. One test scenario renders at 375px with no horizontal scroll.
- **Two render targets, two media layers.** `@media screen` owns scroll-snap, next/prev nav, any JS interaction; `@media print` owns `page-break-after: always` on `.slide` and a rule that each `.slide` fills exactly one `@page` with no overflow. Full-bleed backgrounds rely on the carried `print-color-adjust: exact` plus a print rule preventing clipping at the page boundary. Test asserts the 3-study PDF produces exactly the expected page count with no blank pages (the scroll-snap-doesn't-break-print regression).
- **Keyboard / focus / reduced-motion (P1).** CSS scroll-snap is primary (print-safe, no JS dependency); a progressive-enhancement JS layer adds arrow-key / PageUp-Down nav, visible `:focus-visible` outlines, and a `prefers-reduced-motion` query that disables snap animation. PDF ignores all of this (`page-break-after` is the print contract).
- **Artifact rendering (P1).** Artifacts render as `<figure><img alt="..."><figcaption>...</figcaption></figure>`. The schema gains a required `artifact_alt` field (one sourced sentence — what it shows and why; never templated) and optional `artifact_caption`. Local paths under `output/deck-assets/` are copied into the deploy dir alongside `index.html`; absolute URLs embed as-is. A study with `artifact` but no `artifact_alt` is flagged the same as a missing artifact.
- **Accent contrast (P1).** `{{ACCENT}}` is restricted to non-text use OR paired with a contrast-chosen text color (white/black) meeting 4.5:1; full-bleed accent slides pair accent with a darkened overlay for legibility. If a supplied accent fails contrast/sanitization, the mode warns and falls back to the default accent instead of shipping an unreadable slide.
- **Hook-slide visual singularity (P2).** The hook slide is the *only* slide with its treatment: `{{HOOK_METRIC}}` is the dominant element (largest type on the slide, accent-colored numeral / pull-quote), `{{HOOK_HEADLINE}}` secondary, minimal supporting text. Visual singularity signals "start here" for the 7-second scan.
- **POV slide — opt-in (resolves Open Question).** `{{POV_HTML}}` is payload-driven; absent = no slide (same empty-omits contract). Distinct treatment from case-study slides (full-bleed accent or quote background, larger prose, no metric/structure), positioned between the last case study and the CTA. The mode's tag-selection recommends POV for senior-targeting roles, omits it for IC/mid-level.
- **Anti-slop visual dimension (P2, review-time check).** Permit per-study variation in artifact treatment (full-bleed image vs inline figure vs before/after split); absent fields collapse their slot entirely rather than render an empty card. A study should not read as a fill-in-the-blanks version of the others — verified visually on the first rendered deck, not unit-tested.

**Execution note:** Visually verify the first rendered deck against the research's "junior tell" list (no artifact, no reflection, vague outcomes) before considering the template done — the template is where those tells are structurally prevented.

**Patterns to follow:** `templates/cover-letter-template.html` (token + sub-block pattern, `{{LANG}}`/`{{NAME}}`/`{{CONTACT_LINE}}` conventions, inline `<style>`); `templates/cv-template.html` (ATS guards, fonts/ self-hosting, `print-color-adjust`).

**Test scenarios:**
- **Covers origin Slide Grammar.** A rendered deck with 3 studies contains, per study, slides/sections for: hook, context, problem, approach, decision, solution, outcome, reflection (assertion against built HTML string).
- A study with an empty `outcome` field renders *no metric* in that slide — the slot is omitted, not filled with placeholder text (anti-slop guardrail).
- A study with no `artifact` renders the study but the mode flags it; a study with `artifact` but no `artifact_alt` is flagged identically (alt-text is required when an artifact is present).
- **Mobile (P0).** Rendered HTML at 375px viewport has no horizontal scroll; hook headline + metric are above the fold; multi-column lists collapse to one column.
- **Print/screen split.** PDF of a 3-study deck produces exactly the expected page count with no blank pages (scroll-snap does not break print); colored backgrounds survive (`print-color-adjust: exact` honored).
- **Keyboard/a11y.** Rendered deck has a focusable landmark per slide; `prefers-reduced-motion` disables snap animation (assertable via CSS presence).
- **Accent contrast.** Rendered text-on-accent combinations meet 4.5:1, OR accent is restricted to non-text use; a failing accent triggers fallback to default (assertable via the validated/swapped value).
- **Hook singularity.** The hook slide's metric element is the largest text node in the deck.
- Text extraction of the rendered PDF contains "verification" intact (no `ﬁ`/`ﬂ` ligature corruption) — mirrors the existing ATS-ligature test.

**Verification:** A deck rendered from the worked-example source renders 3 studies × 8 beats across the expected page count, with backgrounds and ligature-correct text in the PDF.

---

### U3. `generate-deck.mjs` + standalone test

**Goal:** The generator — pure `buildDeckHtml(payload)` + lazy PDF render, mirroring `generate-cover-letter.mjs`.

**Requirements:** Advances origin "Delivery" (PDF half) and the reuse decision (no new Playwright pipeline).

**Dependencies:** U2 (template must exist).

**Files:**
- `generate-deck.mjs` (create — system layer)
- `generate-deck.test.mjs` (create — standalone, beside source; NOT registered in `test-all.mjs` per the standalone-test convention, but tracked → must be in `SYSTEM_PATHS`)
- `generate-pdf.mjs` (modify — add `skipManifest` opt-out to `renderHtmlToPdf` opts, guard the `updatePDFManifest` call at ~line 443; default `false` preserves CV/cover-letter behavior)
- `update-system.mjs` (modify — add `generate-deck.mjs` and `generate-deck.test.mjs` to `SYSTEM_PATHS`, near `generate-cover-letter.mjs`)

**Approach:** Exported `buildDeckHtml(payload)` reads `templates/deck-template.html`, builds a replacements map from the payload (HTML-escaping every user value via an `escapeHtml` helper), applies single-pass `{{TOKEN}}` substitution, and returns the HTML string. `main()` parses args (`--payload <json>`, `--out <html-path>`, `--pdf <pdf-path>`, `--format`, `--report=<NNN>`, `--help`), writes the HTML to `output/deck-{slug}/index.html`, lazy-imports `renderHtmlToPdf` from `generate-pdf.mjs`, and renders the PDF passing `{ reportNum, skipManifest: true }` so decks do NOT pollute `data/pdf-index.tsv` (see Decision #12). A small `writeDeckIndex` helper appends a row to `data/deck-index.tsv` (including auth mode — see U5) when `--report=` is passed. `{{ACCENT}}` is validated against a strict color regex before substitution (reject/clamp to default; never passed through `escapeHtml` into CSS — see Decision #13).

**Patterns to follow:** `generate-cover-letter.mjs` is the structural twin — copy its `buildHtml`/`escapeHtml`/lazy-import shape, its arg-parsing style, and its exported-pure-function discipline.

**Test scenarios:** (standalone, Playwright-free — exercise `buildDeckHtml` only)
- **Happy path:** a 3-study payload produces HTML containing all 3 study sections and all 8 beats per study.
- **Edge — empty optional field:** a payload with no artifact for one study still builds valid HTML (no `{{...}}` leak, no crash).
- **Edge — zero studies:** a payload with no studies builds the wrapper (title/hook/CTA) without a studies block (degrades gracefully).
- **Substitution contract:** a field value containing the literal text `{{NOT_A_TOKEN}}` survives unchanged (no re-substitution / no blanking) — mirrors `test-all.mjs:5559-5588`.
- **HTML-escape:** a payload value with `<`, `>`, `&` is escaped in output (no injected markup).
- **Accent injection:** `{{ACCENT}}` appears in the right CSS rule and only there.
- **ACCENT sanitization (P1):** an ACCENT value containing `;`, `{`, `}`, or any non-color characters is rejected/clamped to the default accent — never substituted into the stylesheet (closes the CSS-injection vector).
- **Manifest opt-out:** a render with `skipManifest: true` does NOT add a row to `data/pdf-index.tsv`; the same render without the flag still does (regression guard for CV/cover-letter paths).

**Verification:** `node generate-deck.test.mjs` passes; `node generate-deck.mjs --payload <worked-example> --out output/deck-test/index.html --pdf output/deck-test.pdf` produces both files; `data/deck-index.tsv` gains a row when `--report=` is passed.

---

### U4. `modes/deck.md`

**Goal:** The agent brain — context loading, tag-based study selection, JD-keyword mirroring, anti-slop enforcement, deploy gate, and here.now invocation instructions.

**Requirements:** Advances origin "Tailoring (v1)", "Content pipeline", "Anti-slop guardrail", "Delivery", and the source-of-truth boundary.

**Dependencies:** U1 (source file), U2 (template), U3 (generator). U6 registers `modes/deck.md` after it is created — U4 is complete once the mode file is written; registration is a downstream U6 action, not a blocking dependency.

**Files:**
- `modes/deck.md` (create — system layer)

**Approach:** Mirror the canonical mode structure (purpose + "It is NOT" block, `## Invocation`, `## Step 1 — Load Context`, numbered steps with mandatory gates, JSON payload shape + CLI invocation, `## Language rules`, `## Style Rules`, `## Output`). Load Context enumerates ONLY in-scope files (mirror `modes/email.md:43-52`): `config/profile.yml`, `cv.md`, `case-studies.md`, `article-digest.md` (if present, for metric headlines), `modes/_profile.md`, `modes/_custom.md`, `voice-dna.md` (style only), `reports/{NNN}-*.md`. Steps: (0) confirm a report/JD is targeted; (1) load context; (2) tag-select 1-3 studies by fit to the role (recommend POV for senior-targeting, omit for IC/mid-level); (3) mirror JD keywords in headlines (reframe, never invent); (4) assemble payload, omitting empty fields; (5) anti-slop review — every metric/role/decision traces to a source file, else drop it; (6) generate HTML + PDF via `generate-deck.mjs`; (7) **PII-visibility gate** — confirm what contact info is safe for a *public* URL vs the privately-emailed PDF; strip/redact to name+role or a single channel for the web render, or offer here.now restricted-access (password/email-allowlist) when full PII must ship publicly; (8) **mandatory user approval gate before deploy**; (9) deploy via the here-now skill (by name) on `output/deck-{slug}/` — parse ONLY the `publish_result.*` and `siteUrl` lines from output; never log raw stderr and never write the `claimToken` into the report header, `deck-index.tsv`, tracker notes, or rendered HTML; (10) capture URL + auth mode, write `**Deck:** {url}` (annotated with auth mode — see U5) into the report header + append to `data/deck-index.tsv`; (11) optionally update tracker notes via the TSV+merge path (never hand-edit `applications.md`). here.now instruction: check `~/.herenow/credentials` / `$HERENOW_API_KEY`; if absent, warn the link expires in 24h and ask whether to proceed or set up a permanent account first.

**Execution note:** Write the mode's anti-slop step as a hard gate with a concrete checklist (trace each metric to `case-studies.md`/`cv.md`/`article-digest.md`/conversation), not a reminder — research shows unbacked metrics are the highest-risk AI-slop vector in 2026.

**Patterns to follow:** `modes/cover.md` (gold-standard gate discipline: Step 0 JD gate, mandatory prompts before drafting, explicit "do NOT generate/deploy until approved"); `modes/email.md` (Load Context file list, standalone-asset framing); `modes/pdf.md` (CLI invocation line with `--report=`).

**Test scenarios:**
- **Covers origin Tailoring (v1).** A dry-run of the mode against a worked-example report selects studies whose tags match the role and produces a payload with JD-mirrored headlines.
- **Covers origin Anti-slop guardrail.** Given a study missing an `outcome` metric, the mode's anti-slop step produces a deck with that metric omitted (not fabricated) — assertable on the generated payload/HTML.
- **Covers origin Delivery (deploy gate).** The mode does NOT invoke here-now deploy without an explicit user-approval turn (procedural — enforced by the step ordering and the "do NOT deploy until approved" line).
- **Source-of-truth boundary:** the Load Context step enumerates only in-scope files; no reference to auto-memory, sibling repos, or out-of-scope paths.

**Verification:** A full `deck` run against a worked-example report produces HTML + PDF for review, holds at the deploy gate, and on approval deploys + writes the report-header URL + deck-index row.

---

### U5. here.now deploy integration, index, report header, cross-ref, gitignore

**Goal:** Wire the deploy output, the URL record, the cross-mode reference, and the gitignore — everything that makes a deployed deck a first-class trackable asset.

**Requirements:** Advances origin "Delivery" (live-URL half) + "Delivery channels / integrations".

**Dependencies:** U3 (generator writes the index), U4 (mode performs the deploy + writes the report header).

**Files:**
- `.gitignore` (modify — add `.herenow/` so publish state/credentials never get committed)
- `data/deck-index.tsv` (create — header row: `report \t deck_url \t html \t pdf \t date`; gitignored or tracked per `data/` convention — match how `data/pdf-index.tsv` is treated)
- `modes/cover.md` (modify — one-line addition to Load Context: "If the report has a `**Deck:**` line, mention it as a companion asset/link.")
- `modes/email.md` (modify — same one-line addition)
- `README.md` (modify — if there is a data-files section, note `case-studies.md` and `data/deck-index.tsv`)

**Approach:** Deploy is agent-driven via the here-now skill (no repo script). The mode publishes `output/deck-{slug}/` (dir with `index.html` at root — the skill's requirement) and captures the returned `siteUrl`. Authenticated deploy (saved API key) is permanent and preferred; anonymous is warned as 24h-expiry. **Auth mode is recorded with the URL** so downstream modes do not cite a link that will expire before the application is read: the report header reads `**Deck:** {url}` plus `*(anonymous, 24h)*` when anonymous, and `data/deck-index.tsv` gains an `auth_mode` column (`report \t deck_url \t auth_mode \t html \t pdf \t date`). When full PII ships publicly, the mode can set here.now restricted access (`PATCH /api/v1/publish/{slug}/access`) instead of defaulting to `anyone_with_link`. `.herenow/` gitignore is mandatory: `publish.sh` writes `.herenow/state.json` (carrying `claimToken`s) to the working dir, and credentials must never be committed.

**Patterns to follow:** `data/pdf-index.tsv` (TSV manifest shape); report-header convention (`**URL:**`, `**Legitimacy:**`, `**PDF:**` — add `**Deck:**` in the same family).

**Test scenarios:**
- **Covers origin Delivery.** After a deploy, `reports/{NNN}-*.md` contains a `**Deck:** https://...here.now/...` line and `data/deck-index.tsv` contains a matching row; an anonymous deploy annotates both with the 24h expiry.
- `.herenow/` is matched by `.gitignore` (a created `.herenow/state.json` is reported as ignored by `git check-ignore`).
- **No token leakage (P2):** a publish run does not write the `claimToken` to any tracked file under `reports/`, `data/`, or the rendered HTML (only `siteUrl` and auth mode are captured).
- `cover`/`email` modes, given a report with a `**Deck:**` line, reference the deck URL in their generated output (procedural — assertable on generated text).
- Anonymous-deploy warning fires when no credentials/key is present (procedural — the mode's pre-deploy check).

**Verification:** End-to-end deploy produces a live URL, the report header carries it, the index row exists, and `.herenow/` is gitignored.

---

### U6. Registration: SKILL router, command menus, SYSTEM_PATHS

**Goal:** Make `/career-ops deck` discoverable and keep CI green — the wiring a new mode would otherwise violate by accident.

**Requirements:** Advances the repo's "every script/mode registered" conventions; without it the command is invisible and CI fails.

**Dependencies:** U1, U3, U4 (the files being registered must exist).

**Files:**
- `.agents/skills/career-ops/SKILL.md` (modify — (1) add `deck` to the `argument-hint` line; (2) add a row to the Mode Routing table; (3) add a line to the Discovery menu; (4) decide Context Loading: deck is standalone asset-generation from a report → standalone group, like cover/email, unless it needs scoring)
- `CLAUDE.md` (modify — add `deck` row to the Skill Modes table; add `deck` to the Subcommands list)
- `AGENTS.md` (modify — same two additions; keep CLAUDE.md and AGENTS.md in sync, they share the command menu)
- `README.md` (modify — add `deck` to the commands list ~line 282-283)
- `update-system.mjs` (modify — add `modes/deck.md`, `generate-deck.mjs`, `generate-deck.test.mjs` to `SYSTEM_PATHS`; `case-studies.md` to `USER_PATHS` (action listed in U1, executed here as part of the registration sweep))

**Approach:** Four files carry command menus (SKILL.md, CLAUDE.md, AGENTS.md, README.md) — CI does not check doc sync, so all four are edited in one pass. SYSTEM_PATHS entries are mandatory for `validate-system-paths-coverage.mjs` (every tracked file must be in SYSTEM or USER paths or CI fails). `templates/deck-template.html` needs no entry (the `templates/` dir is registered). `output/deck-assets/.gitkeep` (committed placeholder from U2) is added to the `EXCLUDES` array in `validate-system-paths-coverage.mjs` — mirrors `batch/logs/.gitkeep` (line 48); it is a placeholder, not a system file, and without the EXCLUDES entry CI fails on the tracked `.gitkeep`.

**Patterns to follow:** the existing `cover`/`email` rows in each of the four menu files; existing `generate-cover-letter.mjs` entry in `SYSTEM_PATHS`.

**Test scenarios:**
- **Covers origin (discoverability).** `/career-ops deck` routes to `modes/deck.md` (the SKILL.md Mode Routing table maps `deck` → `deck`).
- `validate-system-paths-coverage.mjs` passes with all new tracked files registered.
- All four menu files (SKILL.md, CLAUDE.md, AGENTS.md, README.md) list `deck` consistently.

**Verification:** `node validate-system-paths-coverage.mjs` exits clean; `deck` appears in all four command menus; routing resolves.

---

## System-Wide Impact

- **Affected parties:** the applicant (new asset type, new source file to maintain); recruiters/hiring managers (external-facing published artifact); the agent (new mode to route). No multi-user or ops impact — single-tenant local tool.
- **External surface:** here.now deploys publish content externally (intended). No new env vars consumed by other systems; `~/.herenow/credentials` and `$HERENOW_API_KEY` are local-only (skill-managed, not repo-managed).
- **CI:** new tracked files must clear `validate-system-paths-coverage.mjs` (U6). No Go changes → `cd dashboard && go test ./...` unaffected. `test-all.mjs` unaffected (standalone test convention).
- **Pipeline integrity:** deck URL enters via report header + `data/deck-index.tsv`; tracker rows still go through the TSV + `merge-tracker.mjs` path only. No direct `applications.md` row edits.

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Fabricated metrics slip into a deck (AI-slop, the #1 2026 recruiter red flag) | high | Anti-slop hard gate in U4 with a concrete trace checklist; empty-omits rendering in U2/U3; source-of-truth boundary registration in U1. |
| Anonymous here.now deploy expires in 24h before a recruiter opens it | high | U4 pre-deploy credential check; warn + gate; documented permanent-account setup. |
| `.herenow/state.json` or credentials committed | medium | U5 `.gitignore` entry; skill already `chmod 600`s credentials. |
| Deck template drops ATS/print guards → broken PDF backgrounds / ligature corruption | medium | U2 carries guards verbatim from `cv-template.html`; test scenarios assert both. |
| Command-menu drift across the 4 doc files (CI doesn't check) | low | U6 edits all four in one pass. |
| `case-studies.md` duplication/conflict with `article-digest.md` | low | Decision #6: separate files, distinct granularity, article-digest seeds headlines only. |
| Dashboard can't regenerate decks (invisibility trap) | low | Accepted v1 limitation (CLI regen only); Go work deferred and documented. |

---

## Deferred Implementation Notes (resolve during execution)

- Exact `{{TOKEN}}` names and final CSS for the deck template (U2) — directional grammar in High-Level Technical Design; finalize against a rendered deck.
- Whether deck HTML lives at `output/deck-{slug}/index.html` (dir, for here.now) and also as a flat `output/deck-{slug}.pdf` — confirm the skill's dir-vs-file publish behavior during U5 execution.
- Minimal JS for next/prev nav vs CSS scroll-snap — decide during U2 once print-safety is verified (PDF page-breaks must not break).
- Whether `data/deck-index.tsv` is tracked or gitignored — match `data/pdf-index.tsv`'s treatment during U5.
- here.now skill-dir resolution path (`~/.claude/skills/here-now/` symlink) — the agent resolves this at deploy time; the mode references the skill by name, not a hardcoded path.

---

## Open Questions (non-blocking)

- Should the deck mode offer to update tracker notes with the deck URL automatically, or leave that to an explicit follow-up? (Lean: explicit — the deploy gate already pauses; auto-writing notes risks surprising the user. Resolve during U4.)
- PDF output path: does `--pdf` default to `output/deck-{slug}.pdf` (sibling of the deploy dir) or `output/deck-{slug}/deck.pdf` (inside the dir that here.now publishes)? here.now publishes the whole dir either way; the manifest/index rows reference distinct paths. Resolve during U3.
- Should decks carrying the full `{{CONTACT_LINE}}` default to here.now restricted-access rather than public `anyone_with_link`? (Lean: prompt at the PII gate; default public only when stripped to name+role. Resolve during U4.)
- Should `cover`/`email` re-validate a deck URL (cheap HEAD) before citing it in an outbound application, to catch silently-expired anonymous deploys at send time? (Lean: yes for anonymous-flagged URLs. Resolve during U5.)

---

## Review Pass (2026-07-07)

Plan strengthened by a headless doc review (coherence, feasibility, security-lens, design-lens). Applied: 4 `safe_auto` fixes (U4/update-system.mjs dedup, terminology normalized, `output/deck-assets/.gitkeep` → `EXCLUDES`, publish.sh path corrected) + folded the P0/P1/P2 actionable set into Decisions #12-15, U2 design contracts, U3 (skipManifest + ACCENT sanitization), U4 (PII gate + claimToken parse-only), U5 (auth-mode recording + restricted-access). Resolved the POV-slide open question (opt-in). Remaining items above are non-blocking implementation-time questions.

---

## Requirements Traceability

| Origin section | Plan coverage |
|---|---|
| Goal / Problem | Problem Frame |
| Source-of-truth boundary | U1 (registration) + U4 (mode Load Context) + Key Decision #6, #11 |
| Content pipeline | U1 (source file) + U4 (interview/selection steps) |
| Artifact shape + Slide grammar | U2 + High-Level Technical Design |
| Tailoring (v1) | U4 (tag selection, JD-keyword mirroring) |
| Delivery (here.now + PDF) | U3 (PDF) + U5 (deploy/index/header) + Key Decisions #7, #8, #9, #10 |
| Anti-slop guardrail | U2/U3 (empty-omits) + U4 (hard gate) + Key Decision #11 |
| Proven-out path (deferred C) | Scope Boundaries (Deferred) — v1 structured C-shaped via tagged source + subset template |
| Success criteria | U-verification + test scenarios (traceable metrics, <5min input, mobile load, clean PDF, zero fabrication) |
| Non-goals | Scope Boundaries (Outside this product's identity) |

---

*Plan origin: `docs/brainstorms/deck-mode-requirements.md`. Research: `docs/brainstorms/deck-mode-research.md`. All paths repo-relative.*
