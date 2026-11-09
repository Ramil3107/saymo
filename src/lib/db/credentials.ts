import { sslFor } from "./ssl";

// drizzle-kit drops `ssl` when given a bare url, so the parts are passed separately
export function credentialsFrom(databaseUrl: string) {
  const parsed = new URL(databaseUrl);
  return {
    host: parsed.hostname.replace(/^\[(.*)\]$/, "$1"),
    port: Number(parsed.port) || undefined,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.slice(1),
    ssl: sslFor(databaseUrl),
  };
}
