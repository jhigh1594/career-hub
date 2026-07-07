import type { Metadata, Viewport } from "next";
import { inter, instrumentSerif, instrumentSerifItalic } from "@/lib/fonts";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "career-ops — official web experience",
  description: "The official, local-first web experience for career-ops.",
  // Home-screen / standalone (iOS): parchment theme-color flows up to the status
  // bar + Dynamic Island; safe-area insets handle the layout.
  appleWebApp: { capable: true, statusBarStyle: "default", title: "career-ops" },
};

export const viewport: Viewport = {
  // viewport-fit=cover → env(safe-area-inset-*) become non-zero so the header can
  // sit flush under the notch / Dynamic Island.
  viewportFit: "cover",
  // Verdara is light-only — static parchment theme-color unifies Safari's status
  // bar / URL bar with the canvas. No runtime theme switching.
  themeColor: "#F5EEDF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${instrumentSerifItalic.variable}`}
    >
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
