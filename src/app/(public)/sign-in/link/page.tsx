import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { ConfirmSignIn, getUser, INVALID_LINK_PATH, SignInTokenSchema } from "@/features/auth";

const SignInLinkParamsSchema = z.object({ token: SignInTokenSchema });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SignInLink");
  return { title: t("pageTitle") };
}

export default async function SignInLinkPage({ searchParams }: PageProps<"/sign-in/link">) {
  if (await getUser()) {
    redirect("/home");
  }

  const params = SignInLinkParamsSchema.safeParse(await searchParams);
  if (!params.success) {
    redirect(INVALID_LINK_PATH);
  }

  return <ConfirmSignIn token={params.data.token} />;
}
