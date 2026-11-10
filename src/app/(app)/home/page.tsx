import { requireUser } from "@/features/auth";
import { HomeHeader } from "@/features/generation";
import { PageWidth } from "@/ui/PageWidth";

export default async function HomePage() {
  await requireUser();

  return (
    <main className="flex-1 pt-20 pb-44">
      <PageWidth width="wide">
        <HomeHeader />
      </PageWidth>
    </main>
  );
}
