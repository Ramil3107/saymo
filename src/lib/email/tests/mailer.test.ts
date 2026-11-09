import nodemailer from "nodemailer";
import { expect, test, vi } from "vitest";
import { createMailer } from "@/lib/email/mailer";

test("the mailer sends from the configured sender", async () => {
  const transport = nodemailer.createTransport({ jsonTransport: true });
  const sendMail = vi.spyOn(transport, "sendMail");

  await createMailer(transport, "Saymo <hello@saymo.local>").send({
    to: "a@b.co",
    subject: "S",
    html: "<p>H</p>",
    text: "H",
  });

  expect(sendMail).toHaveBeenCalledWith(
    expect.objectContaining({ from: "Saymo <hello@saymo.local>", to: "a@b.co", subject: "S" }),
  );
});
