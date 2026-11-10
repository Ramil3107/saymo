"use client";

import { useTranslations } from "next-intl";
import { useFormStatus } from "react-dom";
import { Button } from "@/ui/Button";
import { confirmSignIn } from "../confirmSignIn";

type ConfirmSignInProps = { token: string };

const CENTERED_LAYOUT =
  "flex flex-1 flex-col items-center justify-center gap-24 px-16 pt-8 pb-44 text-center sm:px-32";

export function ConfirmSignIn({ token }: ConfirmSignInProps) {
  const t = useTranslations("SignInLink");

  return (
    <main className={CENTERED_LAYOUT}>
      <h1 className="text-title text-balance">{t("title")}</h1>
      <p className="max-w-modal text-lead text-muted text-pretty">{t("lead")}</p>
      <form action={confirmSignIn}>
        <input type="hidden" name="token" value={token} />
        <SignInButton label={t("button")} />
      </form>
      <p className="text-small text-faint">{t("ignore")}</p>
    </main>
  );
}

function SignInButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="primary" size="large" busy={pending}>
      {label}
    </Button>
  );
}
