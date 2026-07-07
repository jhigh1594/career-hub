import { Inter, Fraunces } from "next/font/google";

// Body / UI — Inter, same as the career-ops-docs home (next/font/google,
// self-hosted: no CLS, GDPR-safe).
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Editorial display — Fraunces (variable serif, opsz 9–144). Replaces the
// previous Instrument Serif. Loaded under the SAME CSS variable name
// (--font-instrument-serif) so the ~26 files that reference `instrumentSerif`
// / `font-serif` / `font-display` keep resolving without a sweeping rename.
// opsz + weight fine-tuning lives in globals.css via font-variation-settings.
export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: "normal",
  variable: "--font-instrument-serif",
  display: "swap",
});

// Italic accent — at most one word per headline (Verdara rule). Reuses the
// old --font-instrument-serif-italic variable name for the same no-rename reason.
export const frauncesItalic = Fraunces({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: "italic",
  variable: "--font-instrument-serif-italic",
  display: "swap",
});

// Back-compat aliases — existing imports of `instrumentSerif` /
// `instrumentSerifItalic` resolve to Fraunces. No component edits required.
export const instrumentSerif = fraunces;
export const instrumentSerifItalic = frauncesItalic;
