"use client";
import * as Primitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
export function Dialog({
  trigger,
  title,
  description,
  children,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <Primitive.Root>
      <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Overlay className="fixed inset-0 z-40 bg-foreground/30" />
        <Primitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-6 text-foreground">
          <Primitive.Title className="pr-8 text-lg font-semibold">
            {title}
          </Primitive.Title>
          <Primitive.Description className="mt-3 text-sm leading-6 text-muted">
            {description}
          </Primitive.Description>
          {children}
          <Primitive.Close
            className="absolute right-4 top-4 rounded p-1 focus-visible:outline-accent"
            aria-label="Fermer"
          >
            <X size={18} />
          </Primitive.Close>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
