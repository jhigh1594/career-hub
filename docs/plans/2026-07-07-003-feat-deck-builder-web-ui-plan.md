---
title: "feat: Deck builder — generate button in web UI"
status: completed
type: feat
plan-depth: standard
created: 2026-07-07
origin: handoff-deck-mode.md (CLI deck mode, shipped) + user request "add our deck builder capability to our UI"
target-repo-subproject: web/ (Next.js 16 app at web/, sibling to the career-ops engine)
---

# Plan — Deck builder (generate button) in the web UI

## Problem Frame

The CLI `deck` mode shipped end-to-end (`/career-ops deck {report}` → multi-slide HTML case-study deck → here.now live URL + PDF; see `docs/plans/2026-07-07-002-feat-deck-mode-case-study-decks-plan.md`, status completed). The web UI at `web/` exposes the other spend-modes as per-report buttons — `GeneratePdfButton` (kind `pdf`) runs the real CLI `pdf` mode headlessly and serves the PDF. The deck capability has no UI surface yet: a user in the browser cannot generate or view a deck.

**Goal:** give the report detail view a "Generate deck" button that runs the real CLI `deck` mode headlessly (generate HTML + PDF, deploy to here.now, write `data/deck-index.tsv`) and then serves the PDF + links the live deck — the exact shape `GeneratePdfButton` + `/api/cv-pdf` already use.

**Non-goal (deferred):** an interactive `/deck` wizard that surfaces the mode's interview (case-study selection Step 3, mirrored-headline confirmation Step 4, anti-slop drop review Step 5, inline slide preview) as in-browser controls. That is a separate, larger plan — see Scope Boundaries. This plan ships the minimal generate button now; the wizard is tracked as a follow-up.

**Single source of truth preserved:** the web orchestrates the real engine — it does NOT reimplement deck generation. The button spawns the real CLI `deck` mode via the existing `/api/run` runner, exactly as the CV button spawns `pdf`. A web deck is byte-identical to a CLI deck.

## Scope Synthesis

**In scope**
- Per-report "Generate deck" button wired to worker kind `deck`.
- Headless deck prompt in `/api/run` (select studies by tag fit automatically, mirror JD vocab, run the anti-slop gate silently, generate, deploy, write `deck-index.tsv`).
- Serve routes: deck PDF (inline) + deck status (live URL + auth mode + artifact presence) + local HTML fallback.
- Registry action `generateDeck` (so the assistant console can fire it too — UI and agentic surfaces share one registry).
- Ethics gate: button disabled for report score < 4.0 (deck mode Step 0 recommends against low-fit decks).
- `case-studies.md` presence gate (deck's primary source).

**Out of scope (deferred to follow-up)**
- `/deck` wizard route, interactive selection/mirroring UI, inline preview, here.now account setup UI.

## Key Technical Decisions

1. **Worker kind `deck`, mirror `pdf` exactly.** The `/api/run` runner already handles `pdf` (write-capable tools, 720s kill timer, cv.md gate, honesty gate via VERDICT). Deck reuses every one of these mechanisms; only the prompt and `needsScript` differ. No new runner plumbing.

2. **Deploy is part of the button run (user pre-approves by clicking).** The CLI `deck` mode gates here.now deploy on explicit user approval; in headless UI mode the click IS the approval, so the prompt instructs: generate → deploy via `~/.claude/skills/here-now/scripts/publish.sh` → write the `deck-index.tsv` row (columns: `report`, `deck_url`, `auth_mode`, `html`, `pdf`, `date`). If `~/.herenow/credentials` is absent the publish falls back to anonymous (24h expiry) — the `auth_mode` column captures that and the UI surfaces a warning. This is an execution-time unknown (depends on the user's here.now setup), surfaced via `deck-index.tsv`, not resolved in the plan.

3. **`deck-index.tsv` is the status source of truth.** The button is client-side and cannot read the repo directly. After a `deck` job finishes, the button fetches `/api/deck-status?report=N`, which parses `data/deck-index.tsv` and returns the row (`deck_url`, `auth_mode`, hasPdf, hasHtml). This mirrors how the tracker (`applications.md`) is the source of truth for CV/apply state.

4. **Two serve routes, not three.** PDF is served inline by `/api/deck-pdf?report=N` (strict mirror of `/api/cv-pdf`). The live deck HTML is the external `deck_url` from `deck-index.tsv` — the button links it directly (no proxy needed for an external HTTPS URL). A local `/api/deck-html?report=N` fallback serves `output/deck-{slug}/index.html` only when `deck_url` is absent (deploy failed / anonymous expired). One status route + one PDF route + one fallback HTML route.

5. **Ethics + source gates borrowed from existing patterns.** Score < 4.0 disables the button (matches the verdict-first `<4.0 don't-apply` badge already in `report-view.tsx` and the mode's Step 0). Missing `case-studies.md` disables it with a tooltip ("Add case studies first") — deck's primary source is `case-studies.md`, the way CV's is `cv.md`.

6. **Anti-slop + source-of-truth boundary honored in the prompt.** The headless prompt explicitly instructs: render-without-metric over fabricate (the template omits empty slots), every metric traces to `case-studies.md`/`cv.md`/`article-digest.md` or is dropped, no authorship claims. This is the CLI mode's own Step 5 — the prompt enforces it, the UI does not need to.

---

## Implementation Units

### U1. Headless deck prompt + runner wiring

**Goal:** Teach `/api/run` the `deck` kind — prompt, script check, cv.md + case-studies.md gates, write-capable tools, 720s timer.

**Files:**
- `web/src/app/api/run/route.ts` (modify)
- `web/src/lib/career-ops.ts` (read-only reference — existing `careerOpsRoot`, `readReport`, `findApplication`)

**Requirements:** advances "web deck is byte-identical to a CLI deck" (Decision 1).

**Dependencies:** none.

**Approach:**
- Add a `kind === "deck"` branch to `buildPrompt()`. The prompt (directional, not implementation spec):
  - "You are generating a case-study deck for application #N, headless. Run the REAL career-ops `deck` mode — follow `modes/deck.md` EXACTLY."
  - Load only the in-scope files (`config/profile.yml`, `cv.md`, `case-studies.md`, `article-digest.md`, `modes/_profile.md`, `voice-dna.md`, `reports/{N}-*.md`).
  - **No interview:** auto-select 1–3 studies by tag fit to the JD's top competencies (honor the mode's selection logic, skip the "wait for confirmation" steps); default accent/format from `config/profile.yml` (`deck.accent_color`, `deck.default_format`).
  - Run the Step 5 anti-slop gate silently — drop unbacked metrics, report what was dropped in the streamed text.
  - Build the payload, write it to `/tmp/deck-payload-{slug}.json`, run `node generate-deck.mjs --payload /tmp/deck-payload-{slug}.json --report {N}`.
  - **Deploy (pre-approved by the click):** run `~/.claude/skills/here-now/scripts/publish.sh` against the generated `output/deck-{slug}/` directory; if `~/.herenow/credentials` is absent, proceed with anonymous deploy and set `auth_mode=anonymous`, else `auth_mode=permanent`.
  - Write the `deck-index.tsv` row (TAB-separated: `report\tdeck_url\tauth_mode\thtml\tpdf\tdate`).
  - `End with EXACTLY one final line: VERDICT: {5 if deck written + deployed, else 1}/5 — {deck_url or output path, ≤12 words}`.
- Extend `needsScript`: add `deck: "generate-deck.mjs"`.
- Extend the cv.md gate to deck AND add a `case-studies.md` requirement for deck: `if ((kind === "evaluate" || kind === "pdf" || kind === "deck") && !cv.md) → 400`; `if (kind === "deck" && !case-studies.md) → 400 "Add case studies first"`.
- Extend the write-capable tool set and kill timer to deck: `tools` condition becomes `kind === "evaluate" || kind === "fix-portal" || kind === "pdf" || kind === "deck"`; `killMs` becomes `kind === "pdf" || kind === "deck" ? 720_000 : 285_000`.
- Do NOT add deck to the `persists`/reports-count honesty gate — deck's artifact lives in `output/`, not `reports/`. Deck relies on the clean-exit + emitted-text + VERDICT path, same as `pdf`.

**Patterns to follow:** the `pdf` branch of `buildPrompt` (structure, VERDICT contract, "do not improvise" framing).

**Test scenarios:**
- `buildPrompt("deck", "042", …)` returns a string containing "modes/deck.md", "generate-deck.mjs", "case-studies.md", and the VERDICT contract line. (Extract `buildPrompt` to a module export OR test via the exported prompt shape — see U5.)
- `needsScript["deck"] === "generate-deck.mjs"`.
- POST `/api/run` `{kind:"deck", input:"042"}` with no `generate-deck.mjs` at root → 400 with the "complete career-ops checkout" message.
- POST with `cv.md` present but `case-studies.md` absent → 400 "Add case studies first".

**Verification:** a `deck` POST streams NDJSON `text`/`tool`/`status`/`done` events and exits clean; `data/deck-index.tsv` gains a row for the report; `output/deck-{slug}/index.html` + `.pdf` exist.

---

### U2. `readDeckIndex()` parser + status route

**Goal:** Expose `data/deck-index.tsv` to the UI so the button knows whether a deck exists for a report and where it lives.

**Files:**
- `web/src/lib/career-ops.ts` (modify — add `readDeckIndex()`)
- `web/src/app/api/deck-status/route.ts` (new)
- `web/src/lib/deck-index.test.mjs` (new — node:test, beside source like `lib/clean-chips.mjs`)

**Requirements:** advances Decision 3 (`deck-index.tsv` is the status source of truth).

**Dependencies:** none (parallel with U1).

**Approach:**
- `readDeckIndex(): DeckRow[]` in `career-ops.ts`, mirroring `readApplications()` (read `path.join(careerOpsRoot(), "data/deck-index.tsv")`, split TSV, skip the header row, map columns). Return type `{ report, deckUrl, authMode, html, pdf, date }`. Tolerate missing file → `[]`.
- `findDeckRow(n: string): DeckRow | null` — `readDeckIndex().find(r => r.report === n)`.
- `/api/deck-status?report=N` → `findDeckRow(N)`; return `{ hasDeck: bool, deckUrl, authMode, hasPdf, hasHtml }` or `{ hasDeck: false }`. `runtime: "nodejs"`, `dynamic: "force-dynamic"`.

**Patterns to follow:** `readApplications()` / `readInbox()` in `career-ops.ts`; `findApplication(n)`.

**Test scenarios:**
- `readDeckIndex()` on a fixture with header + 2 rows → 2 `DeckRow` objects with correctly typed fields.
- `readDeckIndex()` on missing file → `[]` (no throw).
- `findDeckRow("042")` returns the matching row; `findDeckRow("999")` returns null.
- TSV with a quoted/multi-tab field does not corrupt adjacent columns (the mode writes plain TAB-separated values — confirm the parser splits on exactly `\t`).
- GET `/api/deck-status?report=042` with a row present → 200 JSON `{hasDeck:true, deckUrl, authMode, …}`; absent → `{hasDeck:false}`; missing `report` param → 400.

**Verification:** `node --test web/src/lib/deck-index.test.mjs` passes; the route returns the row for a report whose deck was generated.

---

### U3. Deck PDF + local-HTML serve routes

**Goal:** Serve the deck PDF inline (mirror `/api/cv-pdf`) and the local HTML as a deploy fallback.

**Files:**
- `web/src/app/api/deck-pdf/route.ts` (new)
- `web/src/app/api/deck-html/route.ts` (new)

**Requirements:** advances Decision 4 (PDF inline + external live URL + local HTML fallback).

**Dependencies:** U2 (`findDeckRow` to resolve the artifact path from `deck-index.tsv`; fall back to scanning `output/` like `/api/cv-pdf` does by company slug).

**Approach:**
- `/api/deck-pdf?report=N` → resolve the deck's PDF path: prefer the `pdf` column from `findDeckRow(N)`; else scan `output/deck-*.pdf` filtered by a report-anchored match and newest-first (mirror the slug-boundary regex in `/api/cv-pdf` to avoid `Meta`/`Metabase` collisions). Stream inline with `Content-Type: application/pdf`, `Cache-Control: no-store`. 404 if none.
- `/api/deck-html?report=N` → serve `output/deck-{slug}/index.html` (resolved via `findDeckRow(N)`'s `html` column or a directory scan). `Content-Type: text/html`. This is the fallback when `deck_url` is absent; the primary "View deck" link points at the external `deck_url`.

**Patterns to follow:** `/api/cv-pdf/route.ts` (slug-boundary regex, newest-first sort, inline disposition, CodeQL-safe token-extract slug).

**Test scenarios:**
- GET `/api/deck-pdf?report=042` with a generated deck → 200, `application/pdf`, body non-empty; missing report → 400; no artifact → 404.
- GET `/api/deck-html?report=042` → 200 `text/html`; absent → 404.
- Report-number anchoring: `report=042` does NOT serve a `043` deck file even when 042's artifact is missing (no accidental cross-serve).

**Verification:** opening the PDF URL in a browser renders the deck; the HTML URL renders the slides.

---

### U4. `GenerateDeckButton` component + registry action

**Goal:** The per-report button. Disabled when score < 4.0 or `case-studies.md` missing; running → spinner link to the job; done → "View deck" (external live URL, or local HTML fallback) + PDF link + auth warning.

**Files:**
- `web/src/components/generate-deck-button.tsx` (new)
- `web/src/app/actions/registry.ts` (modify — add `generateDeck`)

**Requirements:** advances Decisions 1, 3, 5; the registry action makes it assistant-fireable (UI + agentic parity).

**Dependencies:** U2 (`/api/deck-status`), U3 (serve routes).

**Approach:**
- Component mirrors `generate-pdf-button.tsx`: `useJobs()` to find the latest `kind:"deck" && input===n` job; `startJob({title:"Deck · {company}", subtitle:"case-study deck", kind:"deck", input:n, page:"/pipeline/{n}"})`.
- Props: `{ n, company, score, hasCaseStudies }`.
- States:
  - `!hasCaseStudies` → disabled button + tooltip "Add case studies first".
  - `scoreNum(score) < 4.0` → disabled + tooltip "Decks are for strong-fit roles (score ≥ 4.0)" (mirrors the verdict-first `<4.0` ethics badge).
  - `job.status === "running"` → spinner link to `/jobs/{id}` "Generating deck…".
  - `job.status === "done"` → fetch `/api/deck-status?report=n` (via `useEffect`/SWW); render:
    - "View deck" → `<a href={deckUrl}>` if `deckUrl`, else `<a href="/api/deck-html?report=n">` (local fallback).
    - PDF link → `/api/deck-pdf?report=n` (download/print).
    - If `authMode === "anonymous"` → small warning chip "Live link expires in 24h — set up here.now for a permanent URL".
  - default → "Generate deck" button + `<CostBadge kind="spend" />`.
- Registry `generateDeck` (mirror `generatePdf`): `sideEffect:"spend"`, validate `n`, resolve company from `ctx.applications`, `ctx.startJob({kind:"deck", input:n, page:"/pipeline/{n}"})`.

**Patterns to follow:** `generate-pdf-button.tsx` (job lookup, states, CostBadge); `apply-button.tsx` (readiness gating); `generatePdf` registry entry.

**Test scenarios:**
- Renders disabled with "Add case studies first" tooltip when `hasCaseStudies=false`.
- Renders disabled when `score="3.5/5"`; enabled when `score="4.2/5"`.
- Clicking when enabled calls `startJob` with `kind:"deck"`, `input:n`.
- After a done job with `deck-status` returning `{hasDeck:true, deckUrl:"https://here.now/…"}`, renders an anchor to that URL and a PDF link to `/api/deck-pdf?report=n`.
- When `deck-status` returns `{hasDeck:true, deckUrl:null}`, "View deck" points at `/api/deck-html?report=n`.
- `authMode:"anonymous"` renders the 24h warning chip; `"permanent"` does not.

**Verification:** on a real report with score ≥ 4.0, clicking generates a deck; after completion the button becomes "View deck" + PDF and the live URL opens the deployed deck.

---

### U5. Wire the button into the report view + registry assistant surface

**Goal:** Render `<GenerateDeckButton>` in the report header next to `<GeneratePdfButton>`; confirm the assistant console can dispatch `generateDeck`.

**Files:**
- `web/src/components/report-view.tsx` (modify — import + place the button; thread `score` + a `hasCaseStudies` flag)
- `web/src/lib/career-ops.ts` (modify — add a `hasCaseStudies()` helper, or compute inline via `fs.existsSync` at the page level)

**Requirements:** the button is discoverable where decks are relevant (Decision 5).

**Dependencies:** U4.

**Approach:**
- In `report-view.tsx`'s action row (the `mt-4 flex flex-wrap` div holding `StatusSelect`, `GeneratePdfButton`, `ApplyButton`), add `<GenerateDeckButton n={id} company={app?.company ?? meta?.title ?? id} score={score ?? ""} hasCaseStudies={hasCaseStudies} />` after `GeneratePdfButton`.
- `hasCaseStudies`: the report page is a server component (`app/pipeline/[id]/page.tsx`) that already calls `readReport`/`findApplication`; pass `fs.existsSync(path.join(careerOpsRoot(), "case-studies.md"))` down as a prop, or expose a `hasCaseStudies()` helper from `career-ops.ts`.
- Confirm the assistant dispatch path: `actionExists("generateDeck")` returns true after U4 (covered by registry tests); no separate wiring needed because `dispatch()` is generic.

**Patterns to follow:** the existing action-row composition in `report-view.tsx`.

**Test scenarios:**
- A report with score ≥ 4.0 renders all three buttons (PDF, Deck, Apply).
- A report with score < 4.0 renders Deck disabled; PDF and Apply behave unchanged.
- `case-studies.md` absent → Deck disabled; other buttons unchanged.
- No regressions: `report-view` still renders for a report with no `app` row (existing graceful state).

**Verification:** `npm run typecheck` passes; the report page shows the button in the right state; the assistant console can fire `<<act:generateDeck {"n":"042"}>>`.

---

## Test Plan (consolidated)

- **Unit (node:test):** `web/src/lib/deck-index.test.mjs` — TSV parse, missing file, `findDeckRow` hit/miss, column integrity. Pattern: `web/lib/clean-chips.mjs` + its `test-clean-chips.mjs`.
- **Build/typecheck:** `cd web && npm run typecheck` — catches the registry/component/route type drift.
- **Existing test:** `cd web && npm run test` (clean-chips) still passes — no regressions.
- **Manual smoke (the real proof):** on a report with score ≥ 4.0 and `case-studies.md` present, click Generate deck → job streams → `output/deck-{slug}/` + PDF written → `data/deck-index.tsv` row added → here.now URL returned → button becomes "View deck" + PDF → live URL opens the deployed deck → PDF serves inline. Then test the anonymous-deploy warning path and the local-HTML fallback (kill the `deck_url`).

## Risks

- **here.now auth is an execution-time unknown.** If `~/.herenow/credentials` is absent, deploy falls back to anonymous (24h) — the prompt sets `auth_mode=anonymous` and the UI warns. If publish.sh fails entirely, the prompt should still write the local HTML+PDF and set `deck_url=""`, so the button falls back to the local HTML serve route. The prompt must not treat a deploy failure as a total failure (VERDICT 1) if the local artifacts exist — call this out in the prompt.
- **Headless selection quality.** Auto-selecting studies without the human confirmation (Step 3) produces a weaker deck than the interactive CLI flow. This is the accepted trade-off of "button now, wizard later" — the wizard is the follow-up that restores human-in-the-loop selection.
- **`deck-index.tsv` is append-only and unlocked.** Unlike `applications.md` (which has the tracker-write token), deck-index has no shared lock. Concurrent deck generations for different reports could interleave writes. Low risk (decks are one-per-application, rarely parallel) — if it matters, acquire the existing `run-registry` token for kind `deck` too. Note as a deferred decision.
- **`generate-deck.mjs` writes to `output/` (gitignored).** No index collision expected; the serve routes scan `output/` so a missing `deck-index.tsv` row degrades gracefully to a directory scan.

## Deferred to Follow-Up Work

- **`/deck` wizard route** — interactive case-study selection, mirrored-headline preview, anti-slop drop review surfaced as UI, inline slide preview, accent/format controls. Separate plan. This is the bulk of "deck builder" as a first-class experience.
- **here.now account setup UI** — a settings surface to enter/store `~/.herenow/credentials` so deploys are permanent; today that's a manual CLI step (`here-now` skill).
- **`deck-index.tsv` write lock** — acquire the run-registry token for kind `deck` if concurrent deck generation becomes real.
- **Tracker integration** — surfacing "deck built" as a column/state on `applications.md` (today deck state lives only in `deck-index.tsv`).
- **Pre-existing test-failure cleanup** (from handoff-deck-mode.md open items #2) — unrelated to this work.
