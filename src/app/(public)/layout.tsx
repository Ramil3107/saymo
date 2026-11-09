import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Logo } from "@/ui/Logo";
import { PublicBar } from "@/ui/PublicBar";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("Brand");

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicBar logo={<Logo href="/" name={t("name")} />} />
      {children}
    </div>
  );
}
