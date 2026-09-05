"use client";

import Link from "next/link";
import { Braces, LayoutGrid } from "lucide-react";
import { usePathname } from "next/navigation";
import { ThemeToggle, cn } from "@atlas/ui";
import { AtlasLogo } from "@/components/atlas-logo";

const destinations = [
  { href: "/", label: "Outils", Icon: LayoutGrid },
  { href: "/tools/athena", label: "Athena", Icon: Braces },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const inTool = pathname.startsWith("/tools/");

  return (
    <header className={cn("app-header", inTool && "app-header-tool")}>
      <Link href="/" className="app-brand" aria-label="Atlas — accueil">
        <AtlasLogo />
      </Link>
      <span className="app-header-divider" aria-hidden="true" />
      <nav className="app-nav" aria-label="Navigation principale">
        {destinations.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn("app-nav-link", active && "is-active")}
              aria-current={active ? "page" : undefined}
              title={label}
            >
              <Icon size={15} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="app-header-actions">
        <ThemeToggle />
      </div>
    </header>
  );
}
