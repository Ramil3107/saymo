import { expect, test } from "vitest";
import { sendSignInLinkEmail } from "@/features/emails";
import type { Email, Mailer } from "@/lib/email/mailer";

const url = "http://localhost:3000/api/auth/magic-link/verify?token=abc&callbackURL=%2Fhome";

test("the sign-in email carries the link in its html and its text", async () => {
  const sent = captureMailer();
  await sendSignInLinkEmail(sent.mailer, { to: "ana@company.com", url });
  expect(sent.emails).toHaveLength(1);
  expect(sent.emails[0]?.to).toBe("ana@company.com");
  expect(sent.emails[0]?.subject).toBe("Your sign-in link to Saymo");
  expect(sent.emails[0]?.html).toContain("token=abc&amp;callbackURL=%2Fhome");
  expect(sent.emails[0]?.text).toContain(url);
});

function captureMailer(): { mailer: Mailer; emails: Email[] } {
  const emails: Email[] = [];
  const mailer: Mailer = {
    async send(email) {
      emails.push(email);
    },
  };
  return { mailer, emails };
}
