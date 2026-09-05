import type { Metadata } from "next";
import { ThemeRoot } from "@atlas/ui";
import { AppHeader } from "@/components/app-header";
import "./globals.css";
import { WorkspaceContent } from "@/components/workspace-content";
export const metadata: Metadata = {
  title: {
    default: "Atlas — Outils de développement",
    template: "%s · Atlas",
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
          <div className="app-shell">
            <AppHeader />
            <WorkspaceContent>{children}</WorkspaceContent>
          </div>
        </ThemeRoot>
      </body>
    </html>
  );
}
