import { expect, test } from "vitest";
import { credentialsFrom } from "../credentials";

test("a Railway-style URL is split into decoded parts with TLS", () => {
  const url = "postgresql://postgres:p%40ss%2Fword@shortline.proxy.rlwy.net:13046/railway";
  expect(credentialsFrom(url)).toEqual({
    host: "shortline.proxy.rlwy.net",
    port: 13046,
    user: "postgres",
    password: "p@ss/word",
    database: "railway",
    ssl: { rejectUnauthorized: false },
  });
});

test("an IPv6 host loses its brackets", () => {
  const credentials = credentialsFrom("postgresql://u:p@[::1]:5432/db");
  expect(credentials.host).toBe("::1");
  expect(credentials.ssl).toBe(false);
});
