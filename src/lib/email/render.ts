import type { ReactElement } from "react";
import { render, toPlainText } from "react-email";

export async function renderEmail(element: ReactElement): Promise<{ html: string; text: string }> {
  const html = await render(element);
  return { html, text: toPlainText(html) };
}
