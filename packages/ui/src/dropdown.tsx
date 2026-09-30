"use client";
import { useEffect, useRef, type ReactNode } from "react";

/** A compact disclosure menu, dismissed without swallowing the outside action. */
export function Dropdown({
  trigger,
  children,
  className,
}: {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const closeOutside = (event: Event) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target))
        ref.current?.removeAttribute("open");
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector("summary")?.focus();
        event.stopPropagation();
      }
    };
    document.addEventListener("pointerdown", closeOutside, true);
    document.addEventListener("focusin", closeOutside);
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("pointerdown", closeOutside, true);
      document.removeEventListener("focusin", closeOutside);
      document.removeEventListener("keydown", escape, true);
    };
  }, []);
  return (
    <details ref={ref} className={className} name="workspace-menu">
      <summary>{trigger}</summary>
      <div
        onClick={(event) => {
          if (
            event.target instanceof Element &&
            event.target.closest("button:not(:disabled),a[href]")
          ) {
            ref.current?.removeAttribute("open");
            // Keep keyboard focus available if the action does not open a dialog.
            if (!document.querySelector('dialog[open],[role="dialog"]'))
              ref.current?.querySelector("summary")?.focus();
          }
        }}
      >
        {children}
      </div>
    </details>
  );
}
