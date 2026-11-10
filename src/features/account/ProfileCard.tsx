import { getTranslations } from "next-intl/server";
import { requireUser } from "@/features/auth";
import { db } from "@/lib/db/client";
import { Avatar } from "@/ui/Avatar";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { signOut } from "./actions";
import { signInMethod } from "./queries";

export async function ProfileCard() {
  const user = await requireUser();
  const [t, method] = await Promise.all([getTranslations("Account"), signInMethod(db, user.id)]);
  const shownName = user.name === "" ? user.email : user.name;

  return (
    <Card label={t("profile")}>
      <div className="flex items-center gap-16">
        <Avatar name={shownName} image={user.image} size="large" />
        <div className="flex min-w-0 flex-col gap-4">
          <span className="text-card-title break-words">{shownName}</span>
          {user.name === "" ? null : <span className="text-dense text-muted break-words">{user.email}</span>}
        </div>
      </div>
      <p className="text-small text-muted">
        {method === "google" ? t("signedInWithGoogle") : t("signedInWithEmail")}
      </p>
      <form action={signOut} className="mt-auto">
        <Button type="submit" variant="secondary">
          {t("signOut")}
        </Button>
      </form>
    </Card>
  );
}
