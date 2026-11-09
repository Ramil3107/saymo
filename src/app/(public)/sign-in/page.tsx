import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { getUser, SignInScreen, signInMessage } from "@/features/auth";
import { appEnv, googleSignIn } from "@/lib/appEnv";

const SignInParamsSchema = z.object({
  error: z.string().optional().catch(undefined),
  deleted: z.string().optional().catch(undefined),
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SignIn");
  return { title: t("pageTitle") };
}

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  if (await getUser()) {
    redirect("/home");
  }

  const params = SignInParamsSchema.parse(await searchParams);
  const googleEnabled = googleSignIn(appEnv()) !== undefined;

  return <SignInScreen googleEnabled={googleEnabled} message={signInMessage(params)} />;
}
