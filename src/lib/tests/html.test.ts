import { expect, test } from "vitest";
import { pageText } from "../html";

test("pageText strips scripts and collapses whitespace", () => {
  expect(pageText("<html><script>x()</script><p>Reports,\n\n  now in PDF</p></html>")).toBe(
    "Reports, now in PDF",
  );
});

test("pageText drops styles, decodes entities and caps the length", () => {
  expect(pageText("<style>p{}</style><h1>Fast &amp; simple</h1>", 6)).toBe("Fast &");
});
