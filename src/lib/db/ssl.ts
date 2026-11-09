const PLAIN_HOSTS = new Set(["localhost", "127.0.0.1"]);
const PRIVATE_HOST_SUFFIX = ".railway.internal";

export function sslFor(databaseUrl: string): false | { rejectUnauthorized: false } {
  const { hostname } = new URL(databaseUrl);
  if (PLAIN_HOSTS.has(hostname) || hostname.endsWith(PRIVATE_HOST_SUFFIX)) {
    return false;
  }
  // Railway's public proxy serves a self-signed certificate
  return { rejectUnauthorized: false };
}
