"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Wrench } from "lucide-react";
import { cn } from "@devtoolbox/ui";
import { tools } from "@/lib/tools";
export function Navigation() {
  const pathname = usePathname();
  const items = [
    { href: "/", name: "Tous les outils", Icon: LayoutGrid },
    ...tools.map((tool) => ({
      href: tool.href,
      name: tool.name,
      Icon: Wrench,
    })),
  ];
  return items.map(({ href, name, Icon }) => (
    <Link
      key={href}
      href={href}
      aria-current={pathname === href ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-muted-surface focus-visible:outline-accent",
        pathname === href && "bg-muted-surface text-foreground",
      )}
    >
      <Icon size={17} />
      <span>{name}</span>
    </Link>
  ));
}
