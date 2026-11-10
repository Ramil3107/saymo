"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Notice } from "@/ui/Notice";
import { deleteAccount, signOut } from "./actions";
import type { DeletionOutcome } from "./deletionOutcome";

export function DeleteAccountButton() {
  const t = useTranslations("Account");
  const [outcome, setOutcome] = useState<DeletionOutcome | null>(null);

  async function confirmDeletion() {
    try {
      const result = await deleteAccount();
      setOutcome(result.outcome);
    } catch {
      setOutcome("failed");
    }
  }

  return (
    <ConfirmDialog
      trigger={<Button variant="outline">{t("deleteButton")}</Button>}
      title={t("deleteDialogTitle")}
      description={t("deleteDialogBody")}
      confirmLabel={t("deleteConfirm")}
      cancelLabel={t("deleteCancel")}
      onConfirm={confirmDeletion}
    >
      {outcome === "sign-in-again" ? (
        <div className="flex flex-col items-start gap-12">
          <Notice tone="problem">{t("signInAgain")}</Notice>
          <form action={signOut}>
            <Button type="submit" variant="secondary">
              {t("signInAgainButton")}
            </Button>
          </form>
        </div>
      ) : null}
      {outcome === "failed" ? <Notice tone="problem">{t("deleteFailed")}</Notice> : null}
    </ConfirmDialog>
  );
}
