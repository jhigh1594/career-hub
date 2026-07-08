# Deck Mode — Case-Study Portfolio Decks

**Status:** Brainstorm complete, ready for planning
**Date:** 2026-07-07
**Owner:** Jon High
**Scope tier:** Standard (feature), Deep-leaning

## Problem

career-ops produces CVs, cover letters, application emails, and form answers — all text artifacts parsed for ATS or read as prose. None of them let a hiring manager *see* a candidate's work in depth. A CV holds bullet points; a cover letter holds claims. For a candidate pivoting roles (here: ops/program coordination → climate/mission-driven program & operations roles), the gap between "bullet that says I led ESG volunteer programs" and "a hiring manager who believes it" is wide.

The missing artifact is a **deep proof object**: 1-3 case studies shown in narrative depth, with high visual craft, tailored to the company and role, delivered as a shareable link and an attached PDF.

## Goal

Add a `deck` mode that produces a multi-slide HTML case-study deck per application. The deck's job is two things, in priority order:

1. **Deep proof of competence** — case studies rendered as problem → approach → outcome → your role → result, with real numbers.
2. **Pure differentiation / visual wow** — clearly above-average effort and craft, memorable in a pile.

Explicitly **not** a primary axis: values/culture-fit signaling (mission alignment shows through the case studies themselves, not through a separate "values" framing).

## Users & beneficiary

The applicant (Jon, currently) running career-ops to apply to ops/program/mission-driven roles. Secondary: recruiters and hiring managers who receive the deck link or PDF. Decks are single-tenant — each is the applicant's own work, there is no multi-user concept.

## Source-of-truth boundary (non-negotiable)

Deck content is user-facing. It may be generated **only** from in-scope files plus statements the user makes in the current conversation:

- `cv.md` (canonical CV)
- `case-studies.md` (new — see Content Pipeline)
- `modes/_profile.md`
- `article-digest.md` (if/when populated)
- `writing-samples/` and `voice-dna.md` (style/voice only)
- The live evaluation `report` for the target role (company name, role title, fit analysis, JD — used for tailoring only, not as a source of claims *about the user*)

**Keywords reformulated, never fabricated.** No invented metrics, outcomes, projects, or roles. No authorship claims unless attributed in `cv.md` or `article-digest.md`. If a case study lacks a number, the slot stays empty rather than filled with a guess.

Deploying a deck via `here-now` publishes its content externally. The boundary above is the safety contract for that publication: nothing goes in a deck that wouldn't belong on a public page.

## Content pipeline

Case-study source material is hybrid:

1. **Interview-sourced (strong).** The user is interviewed for the 2-3 strongest case studies in STAR+R form (Situation, Task, Action, Result, + Reflection / your specific role). Output is written into `case-studies.md` (user layer). Each study is tagged (see below).
2. **CV-bullet expansion (supporting).** Fuller narrative framing of points already in `cv.md` / `cv-mission.md` — reorder and emphasize, no new facts.

`case-studies.md` is a **new user-layer file**. Each case study carries tags so a future "cut" pass can select by fit: role-type (e.g. `ops`, `program`), skill (e.g. `stakeholder-coordination`, `esg`), industry, and a strength/hero flag.

## Artifact shape

**Multi-slide HTML deck**, presentation feel, **6-8 slides per case study**, 3 case studies optimal per deck. Full-bleed visuals, next/prev navigation, high visual craft, mobile-flawless (recruiters review on phones — research).

PDF is produced from the same HTML via the existing `generate-pdf.mjs` pipeline — deck HTML is the canonical source, PDF is a render target.

### Slide grammar (research-derived — see deck-mode-research.md)

The spine that survives across PM/design/data/eng/consulting "got hired" cases: **Problem → Process → Decision → Outcome → Reflection.** Per case study:

1. **Hook / TL;DR** — metric headline, names *impact* not deliverable. The 7-second scan lives here.
2. **Context** — company, scale, team, your explicit role, constraints (timeline, budget, headcount).
3. **Problem** — the business pain, quantified where possible.
4. **Approach** — method, the insight that changed direction.
5. **Decision & trade-off** — options considered, why A beat B (evidence-led, not aesthetic-led).
6. **Solution + artifact** — what shipped, with a real artifact (annotated screenshot, redacted doc, before/after chart). **No artifact = junior tell.**
7. **Outcome** — metric + baseline + timeframe. #1 senior differentiator.
8. **Reflection** — what went wrong, what you'd do differently. **Non-negotiable; its absence is a junior tell.**

Deck wrapper: title slide (name, target role, company) + hook slide + 3 case-study runs + optional point-of-view/philosophy slide (senior separator) + closing CTA. ~150-250 words/slide, scannable hierarchy (bold keywords, pull quotes).

## Tailoring (v1)

Driven manually via `/career-ops deck <report>` (analogous to how `pdf` and `cover` consume a report):

- Company name, role title injected into title + hook slides.
- Accent color / theme (per company, optional).
- Tag-based selection of which case studies from `case-studies.md` appear.
- JD-keyword-mirrored slide headlines (reframe existing content to mirror the posting's language; never invent).

## Delivery

Per application, two artifacts from one HTML source:

1. **Live URL** — deck HTML deployed via the `here-now` skill. Shareable link, interactive.
2. **PDF** — rendered via `generate-pdf.mjs`. Attachable to applications and emails.

The deck URL is a trackable asset. It should be surfaced to the `cover` and `email` modes so a generated cover letter or application email can reference/link it, and recorded in the application tracker notes.

## Delivery channels / integrations

- `here-now` — HTML → hosted URL.
- `generate-pdf.mjs` — HTML → PDF (existing).
- Evaluation `report` — source of company/role/JD for tailoring.
- `cover` / `email` modes — consumers of the deck URL.
- `data/applications.md` — deck URL recorded in notes column for applied rows.

## Proven-out path (deferred → revisit after 3 real decks)

The long-term target is a **master deck + per-role cuts** model: one canonical master maintained as the durable asset, a cheap tailoring pass producing per-application cuts. **Not built now.** v1 ships the manual mode but is structured so the upgrade is a small step, not a rewrite:

- `case-studies.md` is tagged from day one → a future "cut" is a tag filter.
- The template accepts a subset + accent + company block as input → that *is* the cut pass, driven manually at first.
- After each deck, log what was reused vs rewritten. That log becomes the master-deck spec, arriving from evidence.

Deferred items (only build after the format proves stable):

- Auto-subset / auto-reorder by report fit score.
- Auto-pipeline integration (deck generated alongside CV + cover in auto-pipeline).
- Master-vs-cut distinction surfaced as a user-facing concept.
- Role-weighted auto-emphasis across modes.

## Success criteria

- A deck can be produced for any existing evaluation report via `/career-ops deck <report>` with under ~5 minutes of user input.
- Deployed here.now link loads and reads as visually above-average craft on both desktop and mobile.
- PDF renders cleanly from the same HTML (no layout breakage, no ATS concern — decks are human-read, not machine-parsed).
- Every metric, outcome, and project in the deck traces to `case-studies.md`, `cv.md`, or a live conversation statement. Zero fabricated detail.
- After 3 real decks, the reuse-vs-rewrite log is concrete enough to write the master-deck spec from it.

## Non-goals

- Values/culture-fit signaling as a deck axis.
- A separate hosted web app or dashboard for browsing decks (here.now per-deck deploys suffice).
- ATS optimization of the deck (decks are supplementary wow artifacts; the CV remains the ATS-safe object).
- Slide-deck export to .pptx / Google Slides native formats (HTML + PDF only for v1).

## Open questions for planning

- Exact `here-now` invocation contract (input format, deploy lifecycle, whether per-app deploys or one mutable URL). Resolve in `/ce-plan`.
- `case-studies.md` schema: fields = `id`, `title` (metric-headline), `tags` (role-type, skill, industry), `hero` flag, plus the 8-beat spine fields (context, problem, approach, decision, solution+artifact-ref, outcome+baseline+timeframe, reflection). Artifact handling (path or embed) to be pinned.
- Whether the deck URL is written to the tracker automatically or via a follow-up command.

## Anti-slop guardrail (research-derived, critical)

2026 hiring managers actively scan for AI-generated tells; voiceless could-describe-anyone prose + no authentic detail + unbacked claims are now red flags. The source-of-truth boundary is the direct mitigation, but it must be enforced at schema level: **a slide must render *without* a metric rather than fabricate one.** An unbacked metric is worse than no metric — it trips the exact flags that get the application binned. Every metric, role claim, and decision must trace to `case-studies.md`, `cv.md`, or a live statement. Optional-but-recommended fields (artifact, quote) stay optional; core claim fields stay source-backed.

## Decisions log

- **2026-07-07** — Deck job = competence proof + visual wow (not values signaling, not role-weighted auto-emphasis).
- **2026-07-07** — Content pipeline = interview-sourced hero studies + CV-bullet expansion; new `case-studies.md` user-layer file.
- **2026-07-07** — Shape = multi-slide HTML deck; PDF via existing `generate-pdf.mjs`.
- **2026-07-07** — Tailoring v1 = manual mode, tag-based selection, JD-keyword-mirrored headlines. Master+cuts (C) deferred; ship A structured C-shaped.
- **2026-07-07** — Delivery = here.now live URL + PDF; deck URL is a trackable asset shared with `cover`/`email`.
- **2026-07-07** — Research-grounded slide grammar: 8-beat spine (hook/context/problem/approach/decision/solution+artifact/outcome/reflection), 3 case studies/deck, reflection non-negotiable, ≥1 real artifact per study, anti-slop guardrail (render without metric rather than fabricate). See deck-mode-research.md.
