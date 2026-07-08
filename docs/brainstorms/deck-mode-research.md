# Deck Mode — Research: What Makes Case Studies Get People Hired

**Date:** 2026-07-07
**Purpose:** Ground the deck slide-grammar and `case-studies.md` schema in external evidence, not assumption. Companion to `deck-mode-requirements.md`.

**Evidence quality caveat:** No peer-reviewed study isolates portfolio presence as an independent variable on offer rate. The evidence is convergent practitioner testimony across PM/design/data/eng/consulting (2018-2026), plus a few documented "portfolio was decisive" cases. That convergence is itself the strongest signal. Treat any "X% lift" number as directional, single-source.

## The universal spine (survives across all role families)

Problem → Process → Decision → Outcome → Reflection. Every format (STAR, STAR+R, SCQA, Problem-Solution-Impact, Pyramid) expresses this.

| # | Beat | Answers | Notes |
|---|------|---------|-------|
| 0 | TL;DR / metric headline (3 sentences) | "Should I keep reading?" | The 7-second scan lives here. Name impact, not deliverable. |
| 1 | Context / Situation | "Was this real and hard?" | Company, scale, team, your role, constraints. |
| 2 | Problem / Complication | "What mattered and why?" | Quantified pain ideal. |
| 3 | Approach / Discovery | "Can they think?" | Method, insights, surprises. |
| 4 | Decisions & trade-offs | "Evidence-led or aesthetic-led?" | Options considered, why A beat B. |
| 5 | Action / Solution | "What did they do?" | With real artifact. |
| 6 | Outcome / Impact | "Did it work?" | Metric + baseline + timeframe. #1 senior differentiator. |
| 7 | Reflection | "Self-aware? Will scale?" | What went wrong, what you'd change. Absence = junior tell. |

**Senior separator:** a "point-of-view / philosophy" beat. At senior levels *how you think* outweighs *what you shipped*.

## Content elements ranked by trust impact

1. Quantified outcome with baseline + timeframe (highest leverage; without it, done).
2. Decision rationale / trade-offs (proof work is evidence-led).
3. Explicit role clarity — "I did X; team did Y" (overclaiming = instant distrust).
4. Real artifacts (redacted PRD, annotated screenshot, before/after chart).
5. Constraints stated upfront (signal you deliver inside limits).
6. Honesty about failure / what didn't work (reads senior).
7. Relevance — case studies mapped to target company's problem.
8. User/stakeholder quotes.
9. Reflection / what I'd do differently.
10. Process artifacts (sketches, abandoned directions).

## Format by role family

- **Design/UX:** long-form vertical scroll, process > polish.
- **PM:** slide deck/Notion, metric-headline case studies, optional product-teardowns for career-switchers.
- **Data:** README + notebook answering a business question; kill Titanic.
- **Eng:** repo + README-first; one deep documented project > 10 shallow.
- **Consulting:** SCQA slide deck, lead with answer.
- **Ops/Program (target):** impact story, 1-2pp. Closest cousins = PM (metric headline) + consulting (SCQA framing) + data (quantified recommendation). The ops case study = "here's a mess I organized into measurable outcome."

**Common denominator:** one metric-led headline; context→problem→approach→decision-with-trade-off→outcome→reflection; ≥1 real artifact; explicit role+constraints; scannable in 60s, deep enough for 7min.

## Documented "got hired" cases

- **Jorge Bialade → GM, Yallamotor** — portfolio decisive; hiring manager (Aatir Abdul Rauf) says no interview without it. 7/10 initiatives matched company's 2-quarter roadmap; each had role + results + screenshots. Offer despite "rusty English." Strongest single data point.
- **Google/Meta senior offers** — candidate attributes senior-level (vs down-leveled) offers to portfolio presentation structure.
- **ProductPeople 5 PMs** — metric headline, real redacted PRD, documented failed experiments (15 of 23), philosophy page. All → interviews/offers.
- **Brittany Chiang** — canonical dev portfolio, restraint + 4-6 deep projects.

## Scan-time data (directional)

- 7s initial portfolio scan; ~10-15s per homepage when recruiter reviews 40.
- 11.2s average resume scan (n=4,200).
- 81% of hiring professionals spend <1 min on initial screen; 78% rate skim-ability highly.
- ~3min decision window for data portfolios.
- **3-5 case studies is the consensus sweet spot.** 15 projects signals can't-edit.

## Anti-patterns (what gets you skimmed / flagged)

**Junior tells:** Figma dump (screens, no rationale); start with design not problem; show tools/methods not insights; no reflection; too many case studies.

**Trust eroders:** vague outcomes ("improved efficiency"); no explicit role; overclaiming; generic problems.

**AI-slop tells (2026, intensifying — critical for career-ops):** voiceless could-describe-anyone prose; no authentic detail or uncertainty; zero digital footprint backing claims; subtle machine-authorship linguistic patterns. → career-ops source-of-truth boundary is the direct mitigation: surface real numbers/decisions from cv.md / case-studies.md; **an unbacked metric is worse than no metric** (triggers AI-resume flags).

**Format:** slow load, broken mobile (recruiters review on phones); walls of text (45s scan); broken links / placeholders.

## Derived constraints for the deck + schema

- **Slide 1 = SCQA hook + metric headline.** Names impact, not deliverable.
- **6-8 slides/case study max.** Context → Problem → Approach → Decision → Solution(artifact) → Outcome(baseline+timeframe) → Role+constraints → Reflection. Beyond 8 dilutes.
- **≥1 real artifact per case study.** No artifact = junior.
- **Reflection slide non-negotiable.**
- **3 case studies per deck optimal;** user picks strongest by metric.
- **~150-250 words/slide**, scannable hierarchy (bold keywords, pull quotes).
- **Anti-slop guardrail baked into schema:** every metric, role, decision must trace to a source file. Schema should let a slide render *without* a metric rather than fabricate one.

## Sources

- [aatir.substack.com — PM Portfolio (Bialade/Yallamotor)](https://aatir.substack.com/p/how-to-create-a-product-manager-portfolio)
- [productpeople.co — 5 PM Portfolios That Got Hired](https://productpeople.co/guides/pm-portfolio-examples)
- [thedatahustle.substack.com — Data Portfolio That Gets You Hired](https://thedatahustle.substack.com/p/the-data-portfolio-that-actually)
- [xperiencewave.com — 7-Second Portfolio Test](https://xperiencewave.com/resources/blogs/7-second-portfolio-test)
- [wonderlist.design — Portfolios That Get Hired](https://www.wonderlist.design/insights/portfolios-that-actually-get-hired)
- [themebat.com — Case Study That Hires You](https://www.themebat.com/how-to-craft-a-portfolio-case-study-that-hires-you-not-just-impresses-recruiters)
- [linkedin.com/pulse — Inside a Hiring Manager's Mind](https://www.linkedin.com/pulse/inside-hiring-managers-mind-evaluating-tech-sarthak-chaubey-anpyf)
- [managementconsulted.com — SCQA Framework](https://managementconsulted.com/scqa-framework/)
- [blog.uxfol.io — 7 UX Case Study Mistakes](https://blog.uxfol.io/case-study-mistakes/)
- [nikharabrief — 5 Case Study Mistakes](https://nikharabrief.vercel.app/blogs/5-common-case-study-mistakes-ruining-job-search)
- [youtube.com — Portfolio → Google/Meta senior offers](https://www.youtube.com/watch?v=rD31vOjLOOw)
- [brittanychiang.com — canonical dev portfolio](https://brittanychiang.com/)
- [hirelytica.com — AI CV red flags 2026](https://hirelytica.com/blog/ai-cv-red-flags-recruiter-detection-2026)
- [rolealign.com — AI resumes flagged](https://www.rolealign.com/posts/why-ai-generated-resumes-get-flagged-by-recruiters.html)
