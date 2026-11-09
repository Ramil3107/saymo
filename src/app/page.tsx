import { useTranslations } from "next-intl";
import { Logo } from "@/ui/Logo";
import { PublicBar } from "@/ui/PublicBar";

export default function HomePage() {
  const t = useTranslations("Brand");
  return (
    <main>
      <PublicBar logo={<Logo href="/" name={t("name")} />} />
    </main>
  );
}
