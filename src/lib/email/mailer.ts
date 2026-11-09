import nodemailer, { type Transporter } from "nodemailer";
import { appEnv } from "@/lib/appEnv";

export type Email = { to: string; subject: string; html: string; text: string };

export type Mailer = { send(email: Email): Promise<void> };

let cached: Mailer | undefined;

export function createMailer(transport: Transporter, from: string): Mailer {
  return {
    async send(email) {
      await transport.sendMail({ from, ...email });
    },
  };
}

export function mailer(): Mailer {
  const env = appEnv();
  cached ??= createMailer(nodemailer.createTransport(env.SMTP_URL), env.EMAIL_FROM);
  return cached;
}
