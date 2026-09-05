import type { ComponentProps } from "react";
import { cn } from "./utils";
export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-surface p-6",
        className,
      )}
      {...props}
    />
  );
}
