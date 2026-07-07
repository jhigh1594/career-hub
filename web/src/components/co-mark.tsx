import { instrumentSerif } from "@/lib/fonts";

// Brand mark — lowercase "co" on moss in Fraunces. Paired with the Petal Seal
// in the app shell. Dual meaning: "co" of career-ops AND "co" of companies.
export function CoMark({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className={`${instrumentSerif.className} inline-flex shrink-0 items-center justify-center rounded-md bg-moss text-parchment`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.78),
        letterSpacing: "0.01em",
        lineHeight: 1,
        paddingBottom: Math.round(size * 0.08),
      }}
    >
      co
    </span>
  );
}
