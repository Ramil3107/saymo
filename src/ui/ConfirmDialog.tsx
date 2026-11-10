"use client";

import { Dialog } from "radix-ui";
import { type ReactNode, useState } from "react";
import { Button } from "./Button";

type ConfirmDialogProps = {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => Promise<void>;
  children?: ReactNode;
};

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
    } catch {
      return;
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-scrim" />
        <Dialog.Content className="fixed top-1/2 left-1/2 flex w-[calc(100%-32px)] max-w-modal -translate-x-1/2 -translate-y-1/2 flex-col gap-[22px] rounded-panel border border-line bg-surface p-28 shadow-float">
          <div className="flex flex-col gap-8">
            <Dialog.Title className="text-heading text-white">{title}</Dialog.Title>
            <Dialog.Description className="text-dense text-muted">{description}</Dialog.Description>
          </div>
          {children}
          <div className="flex flex-wrap justify-end gap-8">
            <Dialog.Close asChild>
              <Button variant="secondary" disabled={busy}>
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button variant="primary" busy={busy} onClick={confirm}>
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
