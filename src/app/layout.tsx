import { LucideProvider } from "lucide-react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { fontVariables } from "@/ui/fonts";
import "./globals.css";

const ICON_STROKE_WIDTH = 1.8;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Brand");
  return {
    title: { template: `%s · ${t("name")}`, default: t("name") },
    description: t("description"),
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <NextIntlClientProvider>
          <LucideProvider strokeWidth={ICON_STROKE_WIDTH}>{children}</LucideProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
