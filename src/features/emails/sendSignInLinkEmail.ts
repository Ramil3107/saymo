import { createTranslator } from "next-intl";
import { createElement } from "react";
import type { Mailer } from "@/lib/email/mailer";
import { renderEmail } from "@/lib/email/render";
import messages from "../../../messages/en.json";
import { SignInLinkEmail } from "./SignInLinkEmail";

export async function sendSignInLinkEmail(
  mailer: Mailer,
  message: { to: string; url: string },
): Promise<void> {
  const t = createTranslator({ locale: "en", messages, namespace: "Emails.SignInLink" });
  const brand = createTranslator({ locale: "en", messages, namespace: "Brand" });
  const copy = {
    brand: brand("name"),
    preview: t("preview"),
    title: t("title"),
    body: t("body"),
    button: t("button"),
    fallback: t("fallback"),
    ignore: t("ignore"),
  };

  const { html, text } = await renderEmail(createElement(SignInLinkEmail, { url: message.url, copy }));

  await mailer.send({ to: message.to, subject: t("subject"), html, text });
}
