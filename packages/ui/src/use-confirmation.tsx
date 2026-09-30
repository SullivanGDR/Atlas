"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { FileWarning, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./button";

export function useConfirmation() {
  const [description, setDescription] = useState<string | null>(null);
  const pending = useRef<((answer: boolean) => void) | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const finish = useCallback((answer: boolean) => {
    const resolve = pending.current;
    pending.current = null;
    setDescription(null);
    resolve?.(answer);
  }, []);
  const confirm = useCallback((message: string) => {
    pending.current?.(false);
    trigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setDescription(message);
    return new Promise<boolean>((resolve) => {
      pending.current = resolve;
    });
  }, []);
  useEffect(
    () => () => {
      pending.current?.(false);
      pending.current = null;
    },
    [],
  );
  const confirmationDialog = (
    <Dialog.Root
      open={description !== null}
      onOpenChange={(open) => {
        if (!open) finish(false);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-foreground/30 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-6 text-foreground shadow-xl"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancel.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const el = trigger.current;
            if (el?.isConnected) {
              const details = el.closest("details");
              (details && !details.open
                ? details.querySelector("summary")
                : el
              )?.focus();
            }
          }}
        >
          <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted-surface">
            <FileWarning size={20} strokeWidth={1.5} />
          </div>
          <Dialog.Title className="pr-7 text-lg font-semibold tracking-tight">
            Remplacer le projet ?
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-6 text-muted">
            {description}
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <button
              ref={cancel}
              type="button"
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted-surface focus-visible:outline-2 focus-visible:outline-accent"
              onClick={() => finish(false)}
            >
              Conserver le projet
            </button>
            <Button type="button" onClick={() => finish(true)}>
              Remplacer
            </Button>
          </div>
          <Dialog.Close
            className="absolute right-4 top-4 rounded p-1 text-muted hover:bg-muted-surface focus-visible:outline-2 focus-visible:outline-accent"
            aria-label="Fermer la confirmation"
          >
            <X size={18} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
  return { confirm, confirmationDialog };
}
