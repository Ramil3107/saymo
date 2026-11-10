import { getTranslations } from "next-intl/server";
import { DeleteAccountCard, ProfileCard } from "@/features/account";
import { requireUser } from "@/features/auth";
import { PageWidth } from "@/ui/PageWidth";

export default async function AccountPage() {
  await requireUser();
  const t = await getTranslations("Account");

  return (
    <main className="flex-1 pt-20 pb-44">
      <PageWidth width="task">
        <div className="flex flex-col gap-28">
          <h1 className="text-title text-balance">{t("title")}</h1>
          <div className="grid grid-cols-1 items-stretch gap-14 pair:grid-cols-2">
            <ProfileCard />
            <DeleteAccountCard />
          </div>
        </div>
      </PageWidth>
    </main>
  );
}
