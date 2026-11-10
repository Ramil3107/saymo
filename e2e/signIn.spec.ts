import { expect, type Page, test } from "@playwright/test";
import { z } from "zod";

const MAILPIT_URL = "http://127.0.0.1:8025";
const MAIL_WAIT_MS = 10_000;
const MAIL_POLL_INTERVAL_MS = 250;
const VERIFY_LINK_PATTERN = /http:\/\/localhost:3000\/api\/auth\/magic-link\/verify\S*/;

const SearchResponseSchema = z.object({ messages: z.array(z.object({ ID: z.string() })) });
const MessageResponseSchema = z.object({ Text: z.string() });

test("a person signs in with an email link, signs out, signs in again and deletes the account", async ({
  page,
}) => {
  const email = `e2e-${Date.now()}@saymo.test`;

  await page.goto("/account");
  await expect(page).toHaveURL(/\/sign-in/);

  await signInWithEmailLink(page, email);
  await expect(page).toHaveURL(/\/home/);
  await expect(page.getByRole("heading", { name: "What are we making today?" })).toBeVisible();

  await page.getByRole("link", { name: "Account" }).click();
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByText("Signed in with email.")).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in/);
  await page.goto("/home");
  await expect(page).toHaveURL(/\/sign-in/);

  await signInWithEmailLink(page, email);
  await page.getByRole("link", { name: "Account" }).click();
  await page.getByRole("button", { name: "Delete account" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete account" }).click();

  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByText("Your account is deleted.")).toBeVisible();
});

async function signInWithEmailLink(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: "Email me a link" }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox." })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  const link = await waitForVerifyLink(email);
  await page.goto(link);
}

async function waitForVerifyLink(email: string): Promise<string> {
  const deadline = Date.now() + MAIL_WAIT_MS;
  while (Date.now() < deadline) {
    const link = await findVerifyLink(email);
    if (link) return link;
    await new Promise((resolve) => setTimeout(resolve, MAIL_POLL_INTERVAL_MS));
  }
  throw new Error(`No sign-in email for ${email} within ${MAIL_WAIT_MS} ms`);
}

async function findVerifyLink(email: string): Promise<string | undefined> {
  const search = await fetchJson(`/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
  const [message] = SearchResponseSchema.parse(search).messages;
  if (!message) return undefined;

  const { Text } = MessageResponseSchema.parse(await fetchJson(`/api/v1/message/${message.ID}`));
  return Text.match(VERIFY_LINK_PATTERN)?.[0];
}

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(`${MAILPIT_URL}${path}`);
  return response.json();
}
