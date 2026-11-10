"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/ui/Button";
import { Logo } from "@/ui/Logo";
import { PublicBar } from "@/ui/PublicBar";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const brand = useTranslations("Brand");
  const t = useTranslations("Error");

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicBar logo={<Logo href="/" name={brand("name")} />} />
      <main className="flex flex-1 flex-col items-center justify-center gap-20 px-16 pb-44 text-center sm:px-32">
        <h1 className="text-title max-w-task text-balance">{t("title")}</h1>
        <p className="text-lead text-muted text-pretty">{t("lead")}</p>
        <Button variant="primary" size="large" onClick={reset}>
          {t("retry")}
        </Button>
      </main>
    </div>
  );
}
