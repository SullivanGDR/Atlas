"use client";
import { useTheme, ThemeProvider } from "next-themes";
import { Sun, Moon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./button";
export function ThemeRoot({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      aria-label="Basculer le thème clair ou sombre"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun size={18} className="hidden [[data-theme=dark]_&]:block" />
      <Moon size={18} className="block [[data-theme=dark]_&]:hidden" />
    </Button>
  );
}
