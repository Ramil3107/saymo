import { getTranslations } from "next-intl/server";
import { Card } from "@/ui/Card";
import { DeleteAccountButton } from "./DeleteAccountButton";

export async function DeleteAccountCard() {
  const t = await getTranslations("Account");

  return (
    <Card label={t("deleteLabel")}>
      <p className="text-dense text-muted text-pretty">{t("deleteBody")}</p>
      <div className="mt-auto">
        <DeleteAccountButton />
      </div>
    </Card>
  );
}
