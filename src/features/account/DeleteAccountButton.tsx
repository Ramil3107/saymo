"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Notice } from "@/ui/Notice";
import { deleteAccount, signOut } from "./actions";
import type { DeletionResult } from "./deletionOutcome";

const DELETED_SIGN_IN_PATH = "/sign-in?deleted=1";

export function DeleteAccountButton() {
  const t = useTranslations("Account");
  const [outcome, setOutcome] = useState<DeletionResult | null>(null);

  async function confirmDeletion() {
    try {
      const result = await deleteAccount();
      if (result.outcome === "deleted") {
        window.location.assign(DELETED_SIGN_IN_PATH);
        return;
      }
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
