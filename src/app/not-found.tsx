import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/ui/Button";
import { Logo } from "@/ui/Logo";
import { PublicBar } from "@/ui/PublicBar";
import { Sticker } from "@/ui/Sticker";

export default async function NotFound() {
  const [brand, t] = await Promise.all([getTranslations("Brand"), getTranslations("NotFound")]);

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicBar logo={<Logo href="/" name={brand("name")} />} />
      <main className="flex flex-1 flex-col items-center justify-center gap-20 px-16 pb-44 text-center sm:px-32">
        <Sticker>{t("sticker")}</Sticker>
        <h1 className="text-title max-w-task text-balance">{t("title")}</h1>
        <p className="text-lead text-muted text-pretty">{t("lead")}</p>
        <ButtonLink href="/" variant="primary" size="large">
          {t("home")}
        </ButtonLink>
      </main>
    </div>
  );
}
