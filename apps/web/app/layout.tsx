import type { Metadata } from "next";
import Link from "next/link";
import { Terminal } from "lucide-react";
import { Sidebar, ThemeRoot, ThemeToggle } from "@devtoolbox/ui";
import { Navigation } from "@/components/navigation";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "DevToolbox — Outils de développement",
    template: "%s · DevToolbox",
  },
  description:
    "Un espace commun pour vos outils de conception et de développement.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <ThemeRoot>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-surface focus:p-3"
          >
            Aller au contenu
          </a>
          <div className="flex min-h-screen flex-col md:flex-row">
            <Sidebar
              brand={
                <Link href="/" className="flex items-center gap-2">
                  <Terminal size={20} />
                  DevToolbox
                </Link>
              }
              footer={
                <span className="font-mono text-xs">
                  v0.1.0 · En développement
                </span>
              }
            >
              <Navigation />
            </Sidebar>
            <div className="min-w-0 flex-1">
              <header className="flex h-16 items-center justify-between border-b border-border px-6">
                <span className="text-sm text-muted">Espace de travail</span>
                <ThemeToggle />
              </header>
              <main id="main" className="mx-auto max-w-6xl p-6 lg:p-10">
                {children}
              </main>
            </div>
          </div>
        </ThemeRoot>
      </body>
    </html>
  );
}
