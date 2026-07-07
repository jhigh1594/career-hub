---
title: "Migrate web/ UI to the Verdara design system"
status: completed
plan_depth: standard
type: refactor
created: 2026-07-07
origin: session brainstorm + scoping synthesis (no prior requirements doc)
target_package: web/
audience: Jon's own use (personal job-search; climate-tech/ops pivot)
---

# Migrate web/ UI to the Verdara design system

**Target package:** `web/` (the Next.js web UI at `web/src/`). Paths below are relative to the repo root, prefixed `web/`.

## Context

`web/` is career-ops's official alpha web UI (Next 16 + React 19, Tailwind v4, local-first view over CLI files). Its current visual identity is a generic warm-neutral SaaS palette (orange `brand`, stone background, Instrument Serif display) with a full light/dark theme. The source is santifer's; the palette reflects his AI/automation job search.

Verdara (`/Users/jon.high/Downloads/verdara` — copied into the repo reading path, not committed) is an editorial-warm sustainability design system: parchment canvas, Fraunces variable display serif, Inter body, solid-accent tiles (ochre/coral/mist/sage/moss), pill buttons, 20px-radius cards, hairline borders, a nine-petal "Petal Seal" motif, no gradients, no glass. Its DNA is light-only.

Goal: re-skin `web/` to Verdara without touching functionality or the dashboard information architecture. This is a visual migration, not a product redesign.

## Goals

1. Verdara palette, typography, and component primitives across every `web/` view.
2. Drop dark mode (Verdara is light-only by design; see Key Decision 1).
3. Preserve all existing functionality and IA (Today, Explore, Pipeline, Portals, Analytics, CV, Config, Assistant Console, all flows).
4. Keep the change small: lean on the existing semantic-token layer so most of the app re-skins by remapping token *values*, not by rewriting component markup.

## Non-Goals

- Redesigning page layouts into asymmetric editorial/magazine grids (dashboard IA stays).
- Adopting Verdara's vanilla `.class` CSS system wholesale (keep Tailwind utilities).
- Migrating lucide-react → Phosphor (kept; see Key Decision 3).
- Touching `templates/cv-template.html`, `generate-pdf.mjs`, or the Go TUI in `dashboard/` — separate surfaces, separate work.
- Building a Verdara dark variant (deferred).

## Key Technical Decisions

**1. Drop dark mode.** Verdara is light-only; a faithful migration removes the `.dark` token block in `web/src/app/globals.css`, the `THEME_SCRIPT` inline boot script and dark `theme-color` logic in `web/src/app/layout.tsx`, the `ThemeToggle` component, and its mounts in `app-shell.tsx` / `mobile-nav.tsx`. Stray `dark:` Tailwind variants in ~15 components become inert (no `.dark` class is ever applied) and are removed opportunistically during each view's restyle. *Why:* halves the token matrix, removes a toggle Verdara doesn't support, and the user confirmed the drop.

**2. Port Verdara tokens into the existing Tailwind v4 `@theme` layer; keep Tailwind utilities for layout.** `web/` already uses semantic tokens (`brand`, `surface`, `muted`, `faint`, `border`, `foreground`, `landing`, `surface-hover`) through Tailwind utility classes — `brand` alone appears 334×, `border` 472×. Remapping the *values* in `@theme` / `@theme inline` re-skins the whole app in one place. Verdara's vanilla `.btn`/`.card`/`.chip` classes are *not* adopted as the primary API; instead the handful of Verdara component primitives (pill button, 20px card, chip, badge, tab, pill input, checkbox) are implemented as Tailwind `@layer components` classes and/or thin React primitives under `web/src/components/ui/`. *Why:* adopting Verdara's class system would mean rewriting every `className` across 45+ files for no functional gain; the token approach gets the same visual result at a fraction of the diff.

**3. Keep lucide-react.** MIT, already installed, visually neutral. Verdara's "Phosphor regular only" rule governs Verdara's *own* deliverables, not this app. A full icon sweep is high-churn/low-value. *Caveat:* if a reviewer finds lucide's line-weight visually clashes with Verdara's solid tiles, a Phosphor swap is a follow-up — not blocked by this plan.

**4. Token map (Verdara → existing semantic tokens).** This is the core remap; it lives in U2:

| web/ semantic token | Current value | Verdara value | Verdara role |
|---|---|---|---|
| `--bg` | `#f7f6f3` (light) / `#0a0a0a` (dark) | `#F5EEDF` parchment | primary canvas (light only) |
| `--surface` | `#ffffff` / `#161616` | `#FBF7EE` surface-white | lifted cards, inputs |
| `--surface-hover` | `#efeeea` / `#232323` | `#EFE7D2` (parchment -1) | hover ground |
| `--fg` | warm near-black | `#0B231A` deep-loam | body text |
| `--muted` | `hsl(35 9% 34%)` | `#3D4A43` (loam +grey) | secondary text |
| `--faint` | `hsl(35 7% 42%)` | `#6B766F` (loam +grey) | captions/meta |
| `--border` | `hsl(40 9% 86%)` | `#D9CFB8` hairline | 1px borders |
| `--landing` | `#59592a` olive | `#143A2B` moss-ink | editorial headlines |
| `--color-brand` | `hsl(26 73% 51%)` orange | `#143A2B` moss-ink | links, active state, primary fills |
| `--color-brand-soft` | orange @ 12% | `rgba(20,58,43,0.10)` | soft fills |
| focus ring | brand | `0 0 0 3px rgba(242,178,51,0.55)` ochre | focus halo |

Accent colors not in the existing token set are **added** as new `@theme` tokens for use in primitives: `--color-ochre #F2B233`, `--color-coral #EC6A47`, `--color-mist #9DC9E5`, `--color-sage #C8D6B4`, `--color-moss #143A2B` (alias of brand), `--color-error #C0432A`. Final hex values for derived `--muted`/`--faint` are a planning-time target; exact contrast-verified values are an implementation-time detail (confirm ≥4.5:1 on parchment for body/caption text).

## Scope Boundaries

### In scope
- Token remap + dark-mode removal (U1, U2).
- Verdara primitive layer: pill button, 20px card, chip, badge, tab, pill input, checkbox, Petal Seal (U3).
- App-chrome restyle (U4).
- Per-view restyle: Today/Pipeline/Report (U5), Explore/Apply (U6), CV/Config/Analytics/Console/Portals/Inbox (U7).

### Deferred to Follow-Up Work
- Phosphor icon migration (if lucide visually clashes after U3–U7 land).
- Verdara dark variant.
- Editorial page-layout redesigns (asymmetric heroes, stat strips, feature-tile grids, magazine reads lists).
- Verdara treatment of `templates/cv-template.html` (PDF) and the Go TUI.
- Expanding the `brand` accent system to use ochre/coral/mist/sage as semantic accents per view (e.g. status chips) beyond the baseline token map.

## System-Wide Impact

- **Affected party:** Jon (sole user). No external consumers; `web/` is local-first, not deployed.
- **CI:** `web/` is isolated from the core career-ops packaging/release (per `web/README.md`). The core `test-all.mjs` does not cover `web/`. `web/`'s only test is `test-clean-chips.mjs`; `npm run build` + `npx tsc --noEmit` are the real gates.
- **Risk surface:** visual regressions only. No data, API, auth, or persistence changes. Local-first files (`cv.md`, `data/*`) untouched.

## Execution posture

No component test framework in `web/`. Verification per unit = `npx tsc --noEmit` (typecheck) + `npm run build` (production build) + visual screenshot review of the touched view. `test-clean-chips.mjs` must continue to pass where chips are touched. Accessibility: verify WCAG AA text contrast (≥4.5:1) for body/caption on parchment after U2.

---

## Implementation Units

### U1. Swap fonts: Fraunces + Inter via next/font

**Goal:** Replace Instrument Serif with Fraunces (variable display) as the editorial display face; keep Inter as body.

**Dependencies:** none.

**Files:**
- `web/src/lib/fonts.ts` (modify — add Fraunces via `next/font/google`, retire `Instrument_Serif`/italic exports or remap their CSS variables to Fraunces so existing `font-serif`/`font-display` references resolve without a sweeping rename)
- `web/src/app/layout.tsx` (modify — update the `variable` className list and any direct `instrumentSerif` reference)

**Approach:** Load Fraunces as a variable font (weights 500–800, opsz axis) and Inter. Preserve the existing CSS-variable names (`--font-inter`, `--font-instrument-serif` → repoint to Fraunces, or introduce `--font-display`/`--font-serif` aliases) so the ~26 files referencing `instrumentSerif`/`font-serif`/`font-display` keep resolving. This avoids a 26-file rename in this unit; the rename is opportunistic during view restyles. Apply Fraunces opsz variation settings at the type-scale level in U2 (`font-variation-settings: "opsz" 96..144` for display sizes), matching `css/system.css` lines 132–173.

**Test expectation:** none — pure asset/type wiring. Verify `npx tsc --noEmit` and `npm run build` pass; visually confirm Fraunces renders on the home hero.

**Verification:** `npm run build` succeeds; home `/` headline renders in Fraunces, body in Inter.

---

### U2. Port Verdara tokens into `@theme`; remove dark mode

**Goal:** Re-skin the whole app at the token layer and delete the dark-mode machinery. This is the unit that delivers ~80% of the visible migration.

**Dependencies:** U1 (font variables resolved).

**Files:**
- `web/src/app/globals.css` (modify — rewrite `@theme` color tokens + `@theme inline` semantic map to the Verdara values in Key Decision 4; add `--color-ochre/coral/mist/sage/moss/error`; delete the `.dark` block and dark `--dot`/`--pre-bg`; set focus ring to ochre; add Fraunces `font-variation-settings` to display type classes)
- `web/src/app/layout.tsx` (modify — remove `THEME_SCRIPT`; set `themeColor` to parchment `#F5EEDF` statically; remove `suppressHydrationWarning` rationale)
- `web/src/components/theme-toggle.tsx` (delete)
- `web/src/components/app-shell.tsx` (modify — remove `ThemeToggle` import + mount; remove the `local-first · v0` row's toggle)
- `web/src/components/mobile-nav.tsx` (modify — remove any `ThemeToggle`/theme reference)

**Approach:** Single source of truth: the token table in Key Decision 4. Map semantic tokens to Verdara raw colors so every `bg-background`/`text-foreground`/`border-border`/`text-brand` utility resolves to Verdara. Removing `.dark` + the boot script means the 15 files carrying `dark:` variants no longer have a `.dark` ancestor — those variants become inert and are cleaned in U4–U7. Derived `--muted`/`--faint` values must pass AA on parchment (confirm at implementation time; nudge toward loam-grey if contrast falls under 4.5:1).

**Patterns to follow:** Verdara `css/system.css` lines 10–73 (token block) and 121–218 (type scale + opsz) are the reference. Map 1:1 onto the existing `@theme inline` indirection already in `globals.css` lines 22–43.

**Test scenarios:**
- Contrast: deep-loam body on parchment ≥4.5:1; moss-ink headline on parchment ≥7:1; muted/faint captions ≥4.5:1.
- No dark theme: `localStorage` has no `career-ops:theme` effect; app always renders light; `ThemeToggle` absent from DOM.
- Focus: keyboard focus on a link/button shows the ochre 3px halo, not the old brand ring.

**Verification:** `npx tsc --noEmit` clean; `npm run build` succeeds; opening `/` shows parchment canvas, moss headline, deep-loam body; no toggle in sidebar.

---

### U3. Verdara primitive layer (buttons, cards, chips, badges, tabs, inputs, checkbox, Petal Seal)

**Goal:** Provide the Verdara component vocabulary as Tailwind `@layer components` classes + extend the `web/src/components/ui/` primitives, so U4–U7 restyle by swapping to these rather than hand-rolling.

**Dependencies:** U2 (tokens available).

**Files:**
- `web/src/app/globals.css` (modify — add `@layer components` for `.btn`/`.btn--primary`/`.btn--secondary`/`.btn--ghost` (48px pills), `.card`/`.card--feature--{ochre,coral,mist,sage}`/`.card--block` (20px radius, hairline), `.chip` (sage pill), `.badge--{coral,ochre,moss,mist}`, `.tab`/`.tab--active` (moss pill active), `.input` (56px pill, ochre focus), `.checkbox` (22px, 8px radius) — translating `css/system.css` lines 338–700 into Tailwind-v4 `@layer`)
- `web/src/components/ui/card.tsx` (modify — align to `.card` 20px/hairline spec)
- `web/src/components/ui/badge.tsx` (modify — map variants to `.badge--{coral,ochre,moss,mist}`)
- `web/src/components/ui/button.tsx` (create — pill button primitive, primary/secondary/ghost)
- `web/src/components/ui/chip.tsx` (create — sage chip)
- `web/src/components/ui/input.tsx` (create — pill input wrapper, if not already present)
- `web/src/components/petal-seal.tsx` (create — inline SVG nine-petal seal, three sizes via prop: `bullet`/`signature`/`watermark`, `currentColor`-driven)

**Approach:** Translate Verdara's vanilla CSS into Tailwind v4 `@layer components` classes that resolve against the U2 tokens — this keeps the Tailwind-utility workflow web/ already uses and avoids a parallel vanilla-CSS system. The Petal Seal is a single SVG component (geometry from Verdara `html/preview.html` or `cover.html` — read at implementation time to extract the exact petal path); it replaces the `CoMark` wordmark accent and is reused as a low-opacity watermark on moss color-block tiles.

**Patterns to follow:** Verdara `css/system.css` component sections (lines 338–729) and `DESIGN.md` "Components" (lines 322–384). Phosphor is *not* introduced (Key Decision 3); any icon slot in a primitive stays lucide.

**Test scenarios:**
- Buttons render at 48px pill; primary=moss/parchment, secondary=ochre/moss, ghost=hairline; hover deepens primary to deep-loam.
- Card variants: parchment card has 1px hairline; feature cards are flat solid accent (no gradient); block card is moss with parchment text.
- Chip = sage/moss pill; badge variants resolve to the four accents.
- Tab active = moss pill + parchment text; inactive = moss text on parchment (no underline).
- Input focus shows ochre halo (no inset shadow); checkbox checked = moss fill + parchment check.
- Petal Seal renders at 16/28/320px; `currentColor` recolors it.

**Verification:** `npm run build` succeeds; a scratch review of primitives against `screenshots/preview-desktop.png` matches; `test-clean-chips.mjs` still passes (chip output format unchanged).

---

### U4. App-chrome restyle

**Goal:** Verdara treatment of the persistent shell: sidebar, nav (active state → moss pill), mobile nav, usage meter, worker pills, beta banner, onboarding banner, hero glow, wordmark + Petal Seal.

**Dependencies:** U2, U3.

**Files:**
- `web/src/components/app-shell.tsx` (modify — nav active state from `bg-brand-soft text-brand` to moss pill `bg-moss text-parchment`; wordmark row pairs `CoMark` with Petal Seal signature; strip remaining `dark:` variants)
- `web/src/lib/nav-items.tsx` (review — icons stay lucide; no change unless a glyph is clearly off)
- `web/src/components/mobile-nav.tsx` (modify — moss active pill; strip theme refs)
- `web/src/components/usage-meter.tsx` (modify — moss/ochre meter on parchment)
- `web/src/components/jobs/worker-pills.tsx` (modify — chip styling to `.chip`)
- `web/src/components/beta/beta-banner.tsx` (modify — coral or ochre badge/banner; strip `dark:`)
- `web/src/components/onboarding-banner.tsx` (modify — moss block or ochre accent)
- `web/src/components/hero-glow.tsx` (modify or retire — Verdara forbids gradients/glass; replace glow with a Petal Seal watermark or a solid moss block, not a radial gradient)
- `web/src/components/co-mark.tsx` (modify — optionally pair with Petal Seal)

**Approach:** The hero glow is the one place Verdara's "no gradients" rule forces a structural change, not just a restyle — replace it with a solid-color or watermark treatment. Everywhere else is class swaps to U3 primitives + stripping inert `dark:` variants.

**Test scenarios:**
- Active nav item is a moss pill with parchment text; inactive items are moss text on parchment.
- No gradient/glass anywhere in chrome (hero-glow removed or replaced).
- Mobile nav mirrors desktop active-state treatment.
- `dark:` variants removed from every chrome file (grep `dark:` in these files returns empty).

**Verification:** visual screenshot of desktop + mobile chrome; grep confirms no `dark:` in U4 files; `npm run build` succeeds.

---

### U5. Today + Pipeline + Report restyle

**Goal:** Verdara treatment of the daily-loop core: the Today dashboard, first-run takeover, and the Pipeline tracker + report detail.

**Dependencies:** U2, U3, U4.

**Files:**
- `web/src/components/home/today-dashboard.tsx`, `web/src/components/home/first-run-home.tsx`, `web/src/components/home/decision-card.tsx` (modify)
- `web/src/components/pipeline-view.tsx` (modify — table rows to hairline-separated parchment; status pills to `.chip`/`.badge`)
- `web/src/components/report-view.tsx` (modify — report prose to deep-loam body, moss headings; legitimacy/score blocks as accent tiles)
- `web/src/components/status-select.tsx` (modify — pill/tabs treatment)
- `web/src/components/score-methodology.tsx`, `web/src/components/company-logo.tsx`, `web/src/components/delete-from-tracker.tsx`, `web/src/components/copyable-command.tsx`, `web/src/components/quick-evaluate.tsx`, `web/src/components/generate-pdf-button.tsx` (modify — buttons to `.btn` primitives)
- `web/src/app/pipeline/[id]/page.tsx` (review)

**Approach:** Mostly class swaps to U3 primitives on top of the U2 token remap (which already re-skinned most surfaces). The report detail is the highest-touch surface — it reads like a document, so lean into editorial type (Fraunces headings, deep-loam body, one coral accent word per heading allowed per Verdara rule). First-run takeover can use a moss color-block hero with a Petal Seal watermark.

**Test scenarios:**
- Pipeline table: rows separated by 1px hairline; status renders as chip/badge; clickable rows still navigate to `/pipeline/[id]`.
- Report: headings in Fraunces moss; body in deep-loam; no `dark:` variants remain.
- First-run: CV-upload takeover renders on parchment with moss accent; no gradient.
- Buttons (PDF, evaluate, delete) use `.btn` primitives and remain wired to their actions.

**Verification:** screenshots of Today, Pipeline list, one report; `npm run build` succeeds.

---

### U6. Explore + Apply restyle

**Goal:** Verdara treatment of the two action flows (the most complex views).

**Dependencies:** U2, U3, U4.

**Files:**
- `web/src/components/explore/explorer-view.tsx`, `web/src/components/explore/discovery-card.tsx`, `web/src/components/explore/first-score-view.tsx`, `web/src/components/explore/ai-hunt-view.tsx`, `web/src/components/explore/discovering-state.tsx` (modify — discovery cards as feature tiles rotating ochre/coral/mist/sage; strip `dark:`)
- `web/src/components/apply-view.tsx` (modify — 468-line view; form chrome to pill inputs, step indicators to tabs)
- `web/src/components/apply/*` (review session/drive/cv/diagnose/greenhouse submodules for any direct color refs)
- `web/src/components/apply-button.tsx` (modify — `.btn--primary`)

**Approach:** Discovery cards are a natural fit for Verdara feature tiles (one solid accent each, rotate so adjacent cards differ) — this is the one place a Verdara layout pattern (rotating accent tiles) is worth adopting inside existing IA. Apply view is large; restyle conservatively (inputs, buttons, step tabs) and avoid rewriting its flow logic. The hard rule from the core (`apply` never submits) is untouched — UI only.

**Test scenarios:**
- Discovery cards render as solid-accent tiles with no two adjacent sharing a color; Phosphor-free (lucide icons intact).
- Apply inputs are pill, focus halo ochre; step indicator uses `.tab`/`.tab--active`.
- No submit/apply action is auto-triggered (behavioral invariant — unchanged).
- No `dark:` variants remain in explore/apply files.

**Verification:** screenshots of Explore results + Apply form; confirm the apply flow still stops before submit; `npm run build` succeeds.

---

### U7. CV, Config, Analytics, Assistant Console, Portals, Inbox restyle

**Goal:** Verdara treatment of the remaining surfaces.

**Dependencies:** U2, U3, U4.

**Files:**
- `web/src/components/cv-editor.tsx`, `web/src/components/cv/cv-ingest.tsx` (modify — editor chrome to parchment/surface; preview pane hairline-bordered)
- `web/src/components/config-form.tsx` (modify — pill inputs, moss section headings)
- `web/src/app/analytics/page.tsx` + any analytics chart components (modify — chart accents to moss/ochre/coral; stat tiles to moss color-blocks with Petal Seal watermark where it fits)
- `web/src/components/assistant-console.tsx` (modify — 685-line console; chat chrome to parchment, user/assistant bubbles to surface/moss-block)
- `web/src/components/portals-view.tsx` (modify — company list to hairline rows; strip `dark:`)
- `web/src/components/inbox/inbox-triage.tsx` (modify)
- `web/src/components/ui/stat_card.tsx` (modify — stat tile to Verdara spec, optional Petal Seal watermark)

**Approach:** Conservative restyle on top of U2 tokens. Analytics stat tiles are the natural home for the Verdara "moss color-block + oversized Fraunces stat + Petal Seal watermark" pattern (Verdara `stat-tile`, `css/system.css` lines 773–801) — adopt there. The Assistant Console is large; keep its logic, swap chrome tokens.

**Test scenarios:**
- CV editor saves to `cv.md` unchanged (behavioral invariant — file write path untouched).
- Config form saves to `config/profile.yml` unchanged.
- Analytics stat tiles render with Fraunces stat + Petal Seal watermark; chart colors are moss/ochre/coral.
- Assistant Console renders parchment; no `dark:` variants remain.

**Verification:** screenshots of each surface; `npm run build` succeeds; `npx tsc --noEmit` clean.

---

## Risks

- **Derived-token contrast.** `--muted`/`--faint` planning values are estimates; if they fail AA on parchment, body/caption text becomes hard to read. *Mitigation:* verify contrast in U2 before proceeding; nudge toward darker loam-grey.
- **`brand` token overload.** Mapping `brand`→moss-ink (334 usages) may over-moss the UI where the old orange was an accent, not a primary. *Mitigation:* review post-U2; introduce ochre/coral as accent tokens (already in U2) and redirect specific `brand` usages (focus, highlights) in U4–U7 where moss reads wrong.
- **Hero glow removal.** Forcing a structural change where a gradient existed; risk of a visually empty hero. *Mitigation:* U4 replaces with Petal Seal watermark or moss block, screenshot-verified.
- **Large single views (apply-view 468L, assistant-console 685L).** Restyle risk of touching flow logic. *Mitigation:* U6/U7 constrain to class swaps; no logic edits.
- **`dark:` variant cleanup sprawl.** 15 files; easy to miss some. *Mitigation:* they're inert after U2 regardless (no `.dark` ancestor), so leftover variants are dead code, not breakage. Final grep in U7 confirms cleanup.

## Deferred Questions (implementation-time)

- Exact Fraunces opsz/weight per display size (target Verdara `css/system.css` lines 135–173; confirm visually).
- Whether to retire the `CoMark` wordmark entirely or pair it with the Petal Seal (decide in U4).
- Final `--muted`/`--faint` hex after contrast check (U2).
- Whether analytics charts need a dedicated Verdara chart palette beyond moss/ochre/coral (decide in U7).
