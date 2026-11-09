"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/ui/Button";
import { Notice } from "@/ui/Notice";
import { TextField } from "@/ui/TextField";
import { requestSignInLink } from "../client";
import type { LinkProblem } from "../signInErrors";

type EmailFormProps = { focusOnMount: boolean; onSent(email: string): void };
type FormProblem = "invalidEmail" | LinkProblem;

const EMAIL_FIELD = "email";
const TERMS_PATH = "/terms";
const PRIVACY_PATH = "/privacy";
const INLINE_LINK = "text-white underline hover:text-muted";

const EmailSchema = z.email();

export function EmailForm({ focusOnMount, onSent }: EmailFormProps) {
  const t = useTranslations("SignIn");
  const formRef = useRef<HTMLFormElement>(null);
  const { problem, sending, submit, clearProblem } = useLinkRequest(onSent);

  useEffect(() => {
    if (!focusOnMount) return;
    emailInput(formRef.current)?.focus();
  }, [focusOnMount]);

  const requestProblem = problem === "invalidEmail" ? null : problem;

  return (
    <form ref={formRef} noValidate onSubmit={submit} className="flex flex-col gap-24">
      <TextField
        label={t("emailLabel")}
        name={EMAIL_FIELD}
        type="email"
        autoComplete="email"
        required
        placeholder={t("emailPlaceholder")}
        error={problem === "invalidEmail" ? t("invalidEmail") : undefined}
        onChange={clearProblem}
      />
      <Button type="submit" variant="primary" size="large" busy={sending} className="w-full">
        {t("submit")}
      </Button>
      {requestProblem ? <Notice tone="problem">{t(requestProblem)}</Notice> : null}
      <Terms />
    </form>
  );
}

function useLinkRequest(onSent: (email: string) => void) {
  const [problem, setProblem] = useState<FormProblem | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = EmailSchema.safeParse(new FormData(event.currentTarget).get(EMAIL_FIELD));
    if (!email.success) {
      setProblem("invalidEmail");
      return;
    }

    setProblem(null);
    setSending(true);
    const outcome = await requestSignInLink(email.data);
    setSending(false);

    if (outcome === "sent") {
      onSent(email.data);
      return;
    }
    setProblem(outcome);
  }

  return { problem, sending, submit, clearProblem: () => setProblem(null) };
}

function emailInput(form: HTMLFormElement | null): HTMLInputElement | null {
  const field = form?.elements.namedItem(EMAIL_FIELD);
  return field instanceof HTMLInputElement ? field : null;
}

function Terms() {
  const t = useTranslations("SignIn");

  return (
    <p className="text-label font-normal text-muted">
      {t.rich("terms", {
        terms: (chunks) => (
          <Link href={TERMS_PATH} className={INLINE_LINK}>
            {chunks}
          </Link>
        ),
        privacy: (chunks) => (
          <Link href={PRIVACY_PATH} className={INLINE_LINK}>
            {chunks}
          </Link>
        ),
      })}
    </p>
  );
}
