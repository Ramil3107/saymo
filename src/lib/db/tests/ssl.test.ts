import { expect, test } from "vitest";
import { sslFor } from "../ssl";

test("a local database is reached without TLS", () => {
  expect(sslFor("postgresql://u:p@localhost:5432/db")).toBe(false);
  expect(sslFor("postgresql://u:p@127.0.0.1:5432/db")).toBe(false);
});

test("Railway's private network is reached without TLS", () => {
  expect(sslFor("postgresql://u:p@postgres.railway.internal:5432/railway")).toBe(false);
});

test("a public host is reached over TLS that accepts Railway's self-signed certificate", () => {
  expect(sslFor("postgresql://u:p@shortline.proxy.rlwy.net:13046/railway")).toEqual({
    rejectUnauthorized: false,
  });
});

test("a local host is recognised in any letter case", () => {
  expect(sslFor("postgresql://u:p@LOCALHOST:5432/db")).toBe(false);
});

test("the IPv6 loopback is reached without TLS", () => {
  expect(sslFor("postgresql://u:p@[::1]:5432/db")).toBe(false);
});
