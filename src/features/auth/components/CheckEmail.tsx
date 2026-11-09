"use client";

import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/ui/Button";
import { Notice } from "@/ui/Notice";
import { requestSignInLink } from "../client";
import type { LinkProblem } from "../signInErrors";
import { EmailMockup } from "./EmailMockup";

type CheckEmailProps = { email: string; onDifferentEmail(): void };
type Resend =
  | { state: "ready" }
  | { state: "sending" }
  | { state: "sentAgain" }
  | { state: "failed"; problem: LinkProblem };

const RESEND_PAUSE_MS = 30_000;

export function CheckEmail({ email, onDifferentEmail }: CheckEmailProps) {
  const t = useTranslations("CheckEmail");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <>
      <EmailMockup />
      <h1 ref={headingRef} tabIndex={-1} className="text-title text-balance outline-none">
        {t("title")}
      </h1>
      <p className="max-w-modal text-lead text-muted text-pretty">
        {t.rich("lead", {
          email,
          strong: (chunks) => <strong className="font-semibold text-white">{chunks}</strong>,
        })}
      </p>
      <ResendActions email={email} onDifferentEmail={onDifferentEmail} />
      <p className="text-small text-faint">{t("spamHint")}</p>
    </>
  );
}

function ResendActions({ email, onDifferentEmail }: CheckEmailProps) {
  const t = useTranslations("CheckEmail");
  const tSignIn = useTranslations("SignIn");
  const { resend, resendLink } = useResend(email);
  const sentAgain = resend.state === "sentAgain";

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-x-20 gap-y-8">
        <Button
          variant="secondary"
          icon={<Mail />}
          busy={resend.state === "sending"}
          disabled={sentAgain}
          onClick={resendLink}
        >
          {sentAgain ? t("resent") : t("resend")}
        </Button>
        <button
          type="button"
          onClick={onDifferentEmail}
          className="min-h-44 text-dense text-white underline hover:text-muted"
        >
          {t("differentEmail")}
        </button>
      </div>
      <p role="status" className="sr-only">
        {sentAgain ? t("resent") : null}
      </p>
      {resend.state === "failed" ? <Notice tone="problem">{tSignIn(resend.problem)}</Notice> : null}
    </>
  );
}

function useResend(email: string) {
  const [resend, setResend] = useState<Resend>({ state: "ready" });

  useEffect(() => {
    if (resend.state !== "sentAgain") return;
    const timer = window.setTimeout(() => setResend({ state: "ready" }), RESEND_PAUSE_MS);
    return () => window.clearTimeout(timer);
  }, [resend.state]);

  async function resendLink() {
    setResend({ state: "sending" });
    const outcome = await requestSignInLink(email);
    setResend(outcome === "sent" ? { state: "sentAgain" } : { state: "failed", problem: outcome });
  }

  return { resend, resendLink };
}
