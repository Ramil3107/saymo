import { User } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AppBar } from "@/ui/AppBar";
import { IconButton } from "@/ui/IconButton";
import { Logo } from "@/ui/Logo";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [brand, common] = await Promise.all([getTranslations("Brand"), getTranslations("Common")]);

  return (
    <div className="flex min-h-dvh flex-col">
      <AppBar logo={<Logo href="/home" name={brand("name")} />}>
        <IconButton href="/account" label={common("account")} icon={<User />} />
      </AppBar>
      {children}
    </div>
  );
}
