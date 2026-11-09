"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { Divider } from "@/ui/Divider";
import { Notice } from "@/ui/Notice";
import type { SignInMessage } from "../signInErrors";
import { CheckEmail } from "./CheckEmail";
import { EmailForm } from "./EmailForm";
import { GoogleButton } from "./GoogleButton";

type SignInFlowProps = {
  header: ReactNode;
  frames: ReactNode;
  googleEnabled: boolean;
  message: SignInMessage | null;
};

type Step = { step: "form"; returning: boolean } | { step: "sent"; email: string };

const SPLIT_LAYOUT = "flex flex-1 items-center justify-center gap-44 px-16 pt-16 pb-44 sm:px-32";
const CENTERED_LAYOUT =
  "flex flex-1 flex-col items-center justify-center gap-24 px-16 pt-8 pb-44 text-center sm:px-32";

export function SignInFlow({ header, frames, googleEnabled, message }: SignInFlowProps) {
  const t = useTranslations("SignIn");
  const [step, setStep] = useState<Step>({ step: "form", returning: false });
  const [notice, setNotice] = useState(message);

  function backToForm() {
    setNotice(null);
    setStep({ step: "form", returning: true });
  }

  if (step.step === "sent") {
    return (
      <main className={CENTERED_LAYOUT}>
        <CheckEmail email={step.email} onDifferentEmail={backToForm} />
      </main>
    );
  }

  return (
    <main className={SPLIT_LAYOUT}>
      <div className="flex min-w-0 basis-form flex-col gap-24">
        {header}
        {notice ? <Notice tone={noticeTone(notice)}>{t(notice)}</Notice> : null}
        {googleEnabled ? <GoogleChoice onFailed={() => setNotice("googleFailed")} /> : null}
        <EmailForm focusOnMount={step.returning} onSent={(email) => setStep({ step: "sent", email })} />
      </div>
      <div className="hidden min-w-0 split:flex">{frames}</div>
    </main>
  );
}

function noticeTone(message: SignInMessage): "info" | "problem" {
  switch (message) {
    case "linkExpired":
    case "googleFailed":
      return "problem";
    case "accountDeleted":
      return "info";
  }
}

function GoogleChoice({ onFailed }: { onFailed(): void }) {
  const t = useTranslations("SignIn");

  return (
    <>
      <GoogleButton onFailed={onFailed} />
      <Divider label={t("or")} />
    </>
  );
}
