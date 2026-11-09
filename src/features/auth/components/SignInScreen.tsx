import { getTranslations } from "next-intl/server";
import { ExampleFrames } from "@/features/landing";
import { Sticker } from "@/ui/Sticker";
import type { SignInMessage } from "../signInErrors";
import { SignInFlow } from "./SignInFlow";

type SignInScreenProps = { googleEnabled: boolean; message: SignInMessage | null };

export async function SignInScreen({ googleEnabled, message }: SignInScreenProps) {
  const t = await getTranslations("SignIn");

  const header = (
    <div className="flex flex-col items-start gap-16">
      <Sticker>{t("sticker")}</Sticker>
      <h1 className="text-title text-balance">{t("title")}</h1>
      <p className="text-lead text-muted text-pretty">{t("lead")}</p>
    </div>
  );

  return (
    <SignInFlow header={header} frames={<ExampleFrames />} googleEnabled={googleEnabled} message={message} />
  );
}
