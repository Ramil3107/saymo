import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const HSTS_MAX_AGE_TWO_YEARS = 63072000;

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders() }];
  },
};

export default withNextIntl(config);

function securityHeaders() {
  const headers = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ];
  if (process.env.NODE_ENV !== "production") return headers;

  const transportSecurity = {
    key: "Strict-Transport-Security",
    value: `max-age=${HSTS_MAX_AGE_TWO_YEARS}; includeSubDomains`,
  };
  return [...headers, transportSecurity];
}
