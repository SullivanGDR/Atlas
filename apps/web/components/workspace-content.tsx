"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
export function WorkspaceContent({ children }: { children: ReactNode }) {
  const isCanvas = usePathname() === "/tools/schematic";
  return (
    <main
      id="main"
      className={
        isCanvas ? "canvas-workspace" : "mx-auto max-w-6xl p-6 lg:p-10"
      }
    >
      {children}
    </main>
  );
}
