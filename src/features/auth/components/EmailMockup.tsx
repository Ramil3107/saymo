import { useTranslations } from "next-intl";

export function EmailMockup() {
  const t = useTranslations("CheckEmail");

  return (
    <div
      aria-hidden="true"
      className="mb-16 flex w-[300px] max-w-full -rotate-4 flex-col gap-12 rounded-frame bg-white p-[22px] text-left text-ink shadow-float"
    >
      <span className="flex items-center gap-8">
        <span className="size-16 rounded-pill bg-accent" />
        <span className="flex-1 text-small font-bold">{t("mockName")}</span>
        <span className="font-mono text-meta text-ink/75">{t("mockTime")}</span>
      </span>
      <span className="text-card-title font-extrabold">{t("mockTitle")}</span>
      <span className="text-small text-ink/75">{t("mockBody")}</span>
      <span className="self-start rounded-pill bg-accent px-[18px] py-[10px] text-small font-bold">
        {t("mockButton")}
      </span>
    </div>
  );
}
