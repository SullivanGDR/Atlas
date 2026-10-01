"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
export function WorkspaceContent({ children }: { children: ReactNode }) {
  const isCanvas = [
    "/tools/athena",
    "/tools/iris",
    "/tools/themis",
    "/tools/metis",
    "/tools/hestia",
  ].includes(usePathname());
  return (
    <main
      id="main"
      className={isCanvas ? "canvas-workspace" : "page-workspace"}
    >
      {children}
    </main>
  );
}
