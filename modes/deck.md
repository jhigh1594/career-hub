# Mode: deck — Case-Study Portfolio Deck

Generates a multi-slide HTML case-study deck for a specific application, then
deploys it as a live here.now URL and renders a PDF. The deck's job: **deep proof
of competence + visual wow** — case studies shown in narrative depth, tailored to
the company and role. It complements the CV (text, ATS-safe); it does not replace it.

It is NOT:
- A CV or cover letter (use `pdf` / `cover`)
- An ATS-parseable artifact (decks are human-read; the CV stays machine-safe)
- A bulk/mass-application tool (one deck per application, high craft)

Research basis: `docs/brainstorms/deck-mode-research.md` (8-beat slide grammar,
anti-slop guardrails, recruiter scan-time data). Full requirements:
`docs/brainstorms/deck-mode-requirements.md`.

---

## Step 0 — Target Gate (mandatory)

Confirm a target application is present.

- **Report provided** (`/career-ops deck {report-num}` or `{slug}`) → read `reports/{NNN}-*.md`, pull company, role, JD URL, score, and the archetype/fit blocks. Fetch the JD from the report header.
- **No report** → either accept a pasted JD + company, or stop: "Give me a report number or paste the JD — the deck is tailored per application, I won't generate a generic one."
- **Report score < 4.0** → recommend against building a deck for it (the user's time and the recruiter's attention are both valuable; per project ethics, discourage low-fit applications). Proceed only if the user explicitly overrides.

---

## Step 1 — Load Context (in-scope files ONLY)

Read **only** these files — the source-of-truth boundary is non-negotiable. Anything
not listed is out of scope (no auto-memory, no sibling repos, no cross-session
inference):

- `config/profile.yml` — `candidate.*` (name, email, phone, location, linkedin, github), `deck.accent_color`, `deck.default_accent`, `deck.default_format`
- `cv.md` — summary, role history, achievement bullets (selection pool + fallback content)
- `case-studies.md` — **primary source**: the tagged 8-beat case studies this deck renders from
- `article-digest.md` (if present) — metric headlines / proof points to cross-check numbers; never overrides `cv.md`/`case-studies.md` on facts
- `modes/_profile.md` (if present) — archetypes, narrative, voice rules (governs framing; overrides generic defaults)
- `modes/_custom.md` (if present) — house rules
- `voice-dna.md` (if present) — style/voice only; never a source of factual claims
- `reports/{NNN}-*.md` — company, role, JD, fit analysis (tailoring input; not a source of claims *about the user*)

---

## Step 2 — Parse the report / JD

Extract:
- **Role title** and **company** (exact wording)
- **Top 3-4 required competencies** — used to pick which case studies fit
- **JD vocabulary** — action verbs and outcome language the company uses (for headline mirroring, Step 4)
- **Company mission/stage signals** — for the hook and an optional POV slide
- **Seniority signal** — senior-targeting recommends a POV slide; IC/mid-level omits it

---

## Step 3 — Select case studies (tag-based)

From `case-studies.md`, select **1-3 studies** (3 optimal) by tag fit to the role's
required competencies. Present the selection:

```text
Studies I'd feature for {role} at {company}:

  1. [{id}] {metric-headline} — tags: {tags}
  2. [{id}] {metric-headline} — tags: {tags}
  3. [{id}] {metric-headline} — tags: {tags}

Reasoning: {one line on why these fit the JD's top competencies}.

Swap any, or point me at a study I missed?
```

Wait for confirmation. Honor the user's picks over your scoring.

**POV slide:** recommend including a "Point of view" slide for senior-targeting
roles (it is a research-backed senior separator); omit for IC/mid-level. Ask the
user if unsure.

---

## Step 4 — JD-keyword mirroring (reframe, never invent)

For each selected study's slide headlines and the deck hook, mirror the JD's
vocabulary — reframe existing content in the company's language. **Mirroring
changes vocabulary and emphasis only. It never introduces a metric, a project, a
tool, or a role the user did not actually do.** If a keyword cannot be woven in
truthfully, flag it; do not force it.

Present the proposed hook + mirrored headlines for confirmation before assembling
the payload.

---

## Step 5 — Anti-slop review (HARD GATE)

Before assembling the payload, run this checklist against every study. This is the
highest-risk step — unbacked metrics are the #1 AI-resume red flag hiring managers
actively scan for in 2026, and a published deck is harder to recall than a local
PDF.

For **each** metric, role claim, decision, and outcome in the deck:

- [ ] Traces verbatim to `case-studies.md`, `cv.md`, `article-digest.md`, or a statement the user made this conversation?
- [ ] If NOT traceable → **drop it**. Render the slide without that metric (empty-omits is the contract — the template omits the slot; never fills with a guess).
- [ ] Every study with an `artifact` also has `artifact_alt` (one sourced sentence — never templated filler like "screenshot of dashboard"). No artifact_alt → flag it, ask the user to supply one or drop the artifact.
- [ ] Every study has a `reflection` beat (its absence is a junior tell; its presence is a senior signal).
- [ ] No authorship claims unless attributed in `cv.md`/`article-digest.md` (tool-of-trade conflation is forbidden).

If anything was dropped for being unbacked, tell the user what and why. Silence on
a topic is fine; manufactured detail is not.

---

## Step 6 — Assemble the payload

Build the JSON payload (schema below). Optional fields left empty are omitted by the
template — do not invent values to fill them.

```json
{
  "candidate": {
    "name": "{profile.yml}", "email": "{profile.yml}", "phone": "{profile.yml}",
    "location": "{profile.yml}", "linkedin": "{profile.yml}", "github": "{profile.yml}"
  },
  "deck": {
    "role": "{exact from JD}",
    "company": "{company}",
    "accent": "{deck.accent_color or per-company hex; validated to a color}",
    "lang": "en",
    "hook_metric": "{the single most striking number/phrase — the deck's dominant element}",
    "hook_headline": "{one-line value prop keyed to the role, JD-mirrored}",
    "pov": "{optional point-of-view statement; omit key for IC/mid-level}",
    "cta_line": "{e.g. 'Let's talk about {role} at {company}.'}",
    "studies": [
      {
        "id": "{case-studies.md id}",
        "label": "{short label}",
        "meta": "{company · role · timeframe}",
        "context": "{prose}", "problem": "{prose}", "problem_headline": "{beat title}",
        "approach": "{prose}",
        "decision": { "chosen": "{prose}", "tradeoff": "{prose}" },
        "solution": "{prose}",
        "artifact": { "src": "{output/deck-assets/{id}.png or URL}", "alt": "{sourced sentence}", "caption": "{optional}" },
        "outcome": { "number": "{metric}", "detail": "{baseline + timeframe}" },
        "reflection": "{prose}"
      }
    ]
  }
}
```

---

## Step 7 — Draft preview in chat (mandatory before generate)

Write the deck outline as plain text: the hook (metric + headline), each selected
study's beats (one line each), the POV if included, and the CTA. Show the user
exactly what renders before any file is written.

End with: "Approve this and I'll generate the HTML + PDF for review. I will NOT
deploy until you say so."

**Do NOT generate any files until the user explicitly approves.**

---

## Step 8 — Generate HTML + PDF

Only after approval. Write payload to `/tmp/deck-payload-{company-slug}.json`, then:

```bash
node generate-deck.mjs --payload /tmp/deck-payload-{company-slug}.json --report {NNN}
```

Report the HTML path (`output/deck-{slug}/index.html`) and PDF path. Confirm the
manifest was skipped (decks keep their own index).

---

## Step 9 — PII-visibility gate (before deploy)

A public `anyone-with-link` URL is crawlable, shareable, and permanent — a
different threat model than a PDF emailed to one recruiter. Before deploying,
confirm what contact info is appropriate:

```text
Before I publish, confirm the contact block for the public URL:

  Current payload contact: {name} · {email} · {phone} · {LinkedIn}

  a) Publish as-is (full contact, public anyone-with-link)
  b) Strip to name + one channel for the public URL (full contact stays on the PDF)
  c) Publish full contact but lock to restricted access (password / email-allowlist)

Which?
```

If the user has not set up an authenticated here.now account (no
`~/.herenow/credentials` and no `$HERENOW_API_KEY`), also warn:

> "No here.now API key found — an anonymous deploy expires in **24 hours**. A
> recruiter opening this link next week gets a dead page. Set up a permanent
> account now (I can walk you through it), or proceed knowing the link dies in 24h."

---

## Step 10 — Deploy (user-gated)

**Do NOT deploy until the user explicitly says to.** Deploying publishes content
externally — it is outward-facing and hard to reverse. Approval means "deploy",
"publish", "ship it", or equivalent. A question or silence is not approval.

Invoke the **here-now skill by name** (do NOT hardcode a path). If a direct shell
call is needed, the script is the skill's `scripts/publish.sh` (resolved skill
dir, e.g. `~/.claude/skills/here-now/scripts/publish.sh`) — never `publish.sh` at
the skill root. Publish the deck directory:

```bash
{skill-dir}/scripts/publish.sh output/deck-{slug} --client career-ops
```

**Parse ONLY the `publish_result.*` and `siteUrl` lines from the output.** Never
log raw stderr, and never write the `claimToken` into the report header,
`data/deck-index.tsv`, tracker notes, or the rendered HTML.

Capture: the `siteUrl` and the auth mode (`publish_result.auth_mode` =
`authenticated` → permanent; `anonymous` → 24h, annotate accordingly).

---

## Step 11 — Record the URL

After a successful deploy, record the deck URL in two places:

1. **Report header** — add a line next to the other header fields:
   `**Deck:** {siteUrl}` and, if anonymous, ` *(anonymous, 24h)*`.
2. **`data/deck-index.tsv`** — append a tab-separated row (create the file with
   the header row if it does not exist):
   ```
   report \t deck_url \t auth_mode \t html \t pdf \t date
   {NNN}   \t {siteUrl} \t {authenticated|anonymous} \t output/deck-{slug}/index.html \t output/deck-{slug}.pdf \t {YYYY-MM-DD}
   ```

Tracker update is **explicit** — ask the user whether to also drop the deck URL
into the application's tracker notes (via the TSV + `merge-tracker.mjs` path;
never hand-edit `data/applications.md`). Do not auto-write the tracker.

---

## Language / style rules

- **Active voice** — never "was led", "has been built".
- **No buzzwords** — leverage, synergy, seamless, holistic, robust, spearheaded, orchestrated, passionate, move the needle, north star, perfect fit.
- **Concrete over abstract** — every claim needs a number, system, or specific outcome. "Improved efficiency" is banned.
- **Mirror JD vocabulary in headlines**, not structure. Content stays from source files.
- **Tone** — match the candidate's voice (`voice-dna.md` if present); do not impose corporate register.
- **Self-check** — re-read each slide: could it appear in any deck for any company? If yes, rewrite it.

---

## Source-of-truth (non-negotiable)

- Every metric, role, project, and decision must trace to `case-studies.md`, `cv.md`, `article-digest.md`, or a live user statement.
- **Keywords reformulated, never fabricated.** Reorder, reframe, emphasise — never invent.
- No authorship claims unless attributed in `cv.md` / `article-digest.md`.
- An unbacked metric is **worse than no metric** — the deck renders without it rather than fabricating one.
