"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/ui/Button";
import { GoogleMark } from "@/ui/GoogleMark";
import { startGoogleSignIn } from "../client";

type GoogleButtonProps = { onFailed(): void };

export function GoogleButton({ onFailed }: GoogleButtonProps) {
  const t = useTranslations("SignIn");
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Back from Google restores this page from the back-forward cache with the button still busy
    function settleOnReturn(event: PageTransitionEvent) {
      if (event.persisted) setLeaving(false);
    }
    window.addEventListener("pageshow", settleOnReturn);
    return () => window.removeEventListener("pageshow", settleOnReturn);
  }, []);

  async function continueWithGoogle() {
    setLeaving(true);
    if (await startGoogleSignIn()) return;

    setLeaving(false);
    onFailed();
  }

  return (
    <Button
      variant="white"
      size="large"
      icon={<GoogleMark />}
      iconSide="start"
      busy={leaving}
      onClick={continueWithGoogle}
      className="w-full"
    >
      {t("google")}
    </Button>
  );
}
