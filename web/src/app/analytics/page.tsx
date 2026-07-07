import { pipelineSummary } from "@/lib/career-ops";
import { canonStatus, scoreNum } from "@/lib/format";
import { instrumentSerif } from "@/lib/fonts";
import { PetalSeal } from "@/components/petal-seal";

export const dynamic = "force-dynamic";

const STAGES: { key: string; label: string }[] = [
  { key: "EVALUATED", label: "Evaluated" },
  { key: "APPLIED", label: "Applied" },
  { key: "RESPONDED", label: "Responded" },
  { key: "INTERVIEW", label: "Interview" },
  { key: "OFFER", label: "Offer" },
  { key: "REJECTED", label: "Rejected" },
  { key: "DISCARDED", label: "Discarded" },
];

export default function Analytics() {
  const { applications } = pipelineSummary();
  const total = applications.length;

  const stageCounts = STAGES.map((s) => ({
    ...s,
    n: applications.filter((a) => canonStatus(a.status).includes(s.key)).length,
  }));
  const maxStage = Math.max(1, ...stageCounts.map((s) => s.n));

  const scores = applications.map((a) => scoreNum(a.score)).filter((n) => !Number.isNaN(n));
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const buckets = [
    { label: "4.5 – 5.0", test: (n: number) => n >= 4.5 },
    { label: "4.0 – 4.4", test: (n: number) => n >= 4 && n < 4.5 },
    { label: "3.0 – 3.9", test: (n: number) => n >= 3 && n < 4 },
    { label: "< 3.0", test: (n: number) => n < 3 },
  ].map((b) => ({ label: b.label, n: scores.filter(b.test).length }));
  const maxBucket = Math.max(1, ...buckets.map((b) => b.n));

  const companyCounts = new Map<string, number>();
  for (const a of applications) if (a.company) companyCounts.set(a.company, (companyCounts.get(a.company) ?? 0) + 1);
  const topCompanies = [...companyCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxCompany = Math.max(1, ...topCompanies.map((c) => c[1]));

  const offers = stageCounts.find((s) => s.key === "OFFER")?.n ?? 0;
  const interviews = stageCounts.find((s) => s.key === "INTERVIEW")?.n ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-2xl tracking-tight text-landing">Analytics</h1>
      <p className="mt-1 text-sm text-muted">Across {total} tracked evaluations.</p>

      {/* headline stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Stat value={total} label="evaluated" featured />
        <Stat value={avg ? avg.toFixed(2) : "—"} label="avg score" />
        <Stat value={interviews} label="interviews" />
        <Stat value={offers} label="offers" />
      </div>

      <Section title="Pipeline by stage">
        {stageCounts.map((s) => (
          <Bar key={s.key} label={s.label} value={s.n} pct={(s.n / maxStage) * 100} total={total} />
        ))}
      </Section>

      <Section title="Score distribution">
        {buckets.map((b) => (
          <Bar key={b.label} label={b.label} value={b.n} pct={(b.n / maxBucket) * 100} total={scores.length} />
        ))}
      </Section>

      <Section title="Top companies" id="companies">
        {topCompanies.map(([name, n]) => (
          <Bar key={name} label={name} value={n} pct={(n / maxCompany) * 100} />
        ))}
      </Section>
    </div>
  );
}

function Stat({ value, label, featured = false }: { value: number | string; label: string; featured?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] p-4 ${
        featured ? "bg-moss text-parchment" : "border border-hairline bg-surface text-foreground"
      }`}
    >
      {featured && (
        <PetalSeal className="absolute -bottom-8 -right-8 h-28 w-28 text-parchment opacity-[0.10]" />
      )}
      <div className={`relative text-3xl leading-none tabular-nums ${featured ? instrumentSerif.className : "font-semibold"}`}>
        {value}
      </div>
      <div className={`relative mt-2 text-xs ${featured ? "text-parchment/75" : "text-faint"}`}>{label}</div>
    </div>
  );
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mt-12 scroll-mt-8">
      <div className="flex items-center gap-2">
        <PetalSeal size="bullet" className="text-moss/50" />
        <h2 className={`${instrumentSerif.className} text-xl tracking-tight text-landing`}>{title}</h2>
      </div>
      <div className="mt-4 space-y-2.5">{children}</div>
    </section>
  );
}

function Bar({ label, value, pct, total }: { label: string; value: number; pct: number; total?: number }) {
  const share = total && total > 0 ? Math.round((value / total) * 100) : null;
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 shrink-0 truncate text-sm text-muted">{label}</div>
      <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-surface">
        <div
          className="h-full rounded-md bg-moss"
          style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }}
        />
      </div>
      <div className="w-20 shrink-0 text-right text-sm tabular-nums">
        {value}
        {share !== null && <span className="ml-1 text-xs text-faint">{share}%</span>}
      </div>
    </div>
  );
}
