const defaultMaxChars = 8000;
const fetchTimeoutMs = 15000;
const userAgent = "Mozilla/5.0 (compatible; Saymo/0.1)";

const entities: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

export function pageText(html: string, maxChars = defaultMaxChars): string {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, (entity) => entities[entity] ?? " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.slice(0, maxChars).trim();
}

export async function fetchPageText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "user-agent": userAgent },
    signal: AbortSignal.timeout(fetchTimeoutMs),
  });

  if (!response.ok) throw new Error(`Could not read ${url}: ${response.status}`);

  return pageText(await response.text());
}
