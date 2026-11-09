import { getTranslations } from "next-intl/server";
import { requireUser } from "@/features/auth";

export default async function HomePage() {
  await requireUser();
  const t = await getTranslations("Home");

  return (
    <main>
      <h1>{t("title")}</h1>
    </main>
  );
}
