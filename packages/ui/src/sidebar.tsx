import type { ReactNode } from "react";
export function Sidebar({
  brand,
  children,
  footer,
}: {
  brand: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <aside className="flex flex-col border-b border-border bg-surface md:min-h-screen md:w-60 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
      <div className="p-5 font-semibold tracking-tight">{brand}</div>
      <nav
        aria-label="Navigation principale"
        className="flex flex-1 flex-wrap items-center gap-1 px-3 pb-3 md:block md:space-y-1 md:py-6"
      >
        {children}
      </nav>
      {footer && (
        <div className="hidden border-t border-border p-5 text-sm text-muted md:block">
          {footer}
        </div>
      )}
    </aside>
  );
}
