import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("Brand");
  return (
    <main className="grid min-h-screen place-items-center">
      <h1 className="text-display">{t("name")}</h1>
    </main>
  );
}
