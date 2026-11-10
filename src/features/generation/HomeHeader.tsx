import { getTranslations } from "next-intl/server";
import { Sticker } from "@/ui/Sticker";

export async function HomeHeader() {
  const t = await getTranslations("Home");

  return (
    <div className="flex flex-col items-center gap-20 text-center">
      <Sticker>{t("sticker")}</Sticker>
      <h1 className="text-display text-balance">{t("title")}</h1>
      <p className="text-lead text-muted text-pretty">{t("lead")}</p>
    </div>
  );
}
