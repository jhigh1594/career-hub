#!/usr/bin/env node
/**
 * generate-deck.test.mjs — standalone test for buildDeckHtml (pure, Playwright-free).
 * Run: node generate-deck.test.mjs
 * Not registered in test-all.mjs (standalone convention); tracked in SYSTEM_PATHS.
 */
import { buildDeckHtml } from "./generate-deck.mjs";

let passed = 0, failed = 0;
function ok(name, cond) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}`); }
}

const basePayload = {
  candidate: { name: "Jordan Brown", email: "j@x.com", linkedin: "linkedin.com/in/j" },
  deck: {
    role: "Program Lead", company: "Acme", hook_headline: "Cut cycle time", hook_metric: "2 weeks",
    studies: [
      {
        id: "s1", label: "Renewals", meta: "Atlassian · 2021-2026",
        context: "Owned a $50M portfolio.",
        problem: "Inputs landed late.",
        problem_headline: "Renewals were slow",
        approach: "Mapped the handoff chain.",
        decision: { chosen: "Centralized escalations", tradeoff: "Concentration risk on me" },
        solution: "Built a playbook.",
        artifact: { src: "output/deck-assets/s1.png", alt: "Cycle-time before/after chart", caption: "Two-week reduction" },
        outcome: { number: "2 weeks", detail: "Cycle-time reduction across the portfolio." },
        reflection: "Centralizing doesn't scale past one person.",
      },
    ],
  },
};

// 1. Happy path: 3 beats present, all study slides render
{
  const html = buildDeckHtml(basePayload);
  ok("name in title/contact", html.includes("Jordan Brown"));
  ok("hook metric present", html.includes("2 weeks"));
  ok("study problem slide", html.includes('data-beat="problem"'));
  ok("study approach slide with tradeoff", html.includes('data-beat="approach"') && html.includes("Centralized escalations"));
  ok("study solution slide with figure", html.includes('data-beat="solution"') && html.includes("<figure"));
  ok("study outcome slide", html.includes('data-beat="outcome"'));
  ok("study reflection slide", html.includes('data-beat="reflection"'));
  ok("artifact alt text rendered", html.includes('alt="Cycle-time before/after chart"'));
}

// 2. Empty optional fields: study with no outcome renders no outcome slide
{
  const p = JSON.parse(JSON.stringify(basePayload));
  p.deck.studies[0].outcome = {};
  p.deck.studies[0].artifact = null;
  const html = buildDeckHtml(p);
  ok("no outcome slide when outcome empty", !html.includes('data-beat="outcome"'));
  ok("no figure when artifact absent", !html.includes("<figure"));
  ok("other beats still present", html.includes('data-beat="problem"'));
}

// 3. Zero studies: wrapper (title/hook/CTA) renders, no study slides
{
  const p = JSON.parse(JSON.stringify(basePayload));
  p.deck.studies = [];
  const html = buildDeckHtml(p);
  ok("title slide present", html.includes('id="title"'));
  ok("hook slide present", html.includes('id="hook"'));
  ok("cta slide present", html.includes('id="cta"'));
  ok("no study slides when empty", !html.includes('data-beat='));
}

// 4. Substitution contract: a value containing literal {{NOT_A_TOKEN}} survives
{
  const p = JSON.parse(JSON.stringify(basePayload));
  p.deck.hook_headline = "See {{NOT_A_TOKEN}} in action";
  const html = buildDeckHtml(p);
  ok("literal {{TOKEN}} in value not re-substituted", html.includes("{{NOT_A_TOKEN}}"));
}

// 5. HTML-escape: special chars escaped in output
{
  const p = JSON.parse(JSON.stringify(basePayload));
  p.candidate.name = "<script>x</script>";
  const html = buildDeckHtml(p);
  ok("name html-escaped", html.includes("&lt;script&gt;") && !html.includes("<script>x</script>"));
}

// 6. ACCENT sanitization: injected into CSS, validated not escaped
{
  const p = JSON.parse(JSON.stringify(basePayload));
  p.deck.accent = "#0a7c5a";
  const html = buildDeckHtml(p);
  ok("hex accent accepted into --accent", html.includes("--accent: #0a7c5a;"));
}
{
  const p = JSON.parse(JSON.stringify(basePayload));
  p.deck.accent = "red;} *{background:url(evil)}";
  const html = buildDeckHtml(p);
  ok("malicious accent rejected → default", html.includes("--accent: #1a1a2e;") && !html.includes("evil"));
  ok("no CSS-breakout chars in accent slot", !html.match(/--accent:\s*red;/));
}
{
  const p = JSON.parse(JSON.stringify(basePayload));
  delete p.deck.accent;
  const html = buildDeckHtml(p);
  ok("missing accent → default", html.includes("--accent: #1a1a2e;"));
}

// 7. POV slide: present when set, omitted when absent
{
  const p = JSON.parse(JSON.stringify(basePayload));
  p.deck.pov = "Operations is a craft, not a cost center.";
  const html = buildDeckHtml(p);
  ok("pov slide present when set", html.includes('id="pov"') && html.includes("Operations is a craft"));
}
{
  const html = buildDeckHtml(basePayload);
  ok("pov slide omitted when absent", !html.includes('id="pov"'));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
