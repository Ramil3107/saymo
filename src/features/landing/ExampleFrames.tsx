import { ArrowDown, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

type FrameProps = { placement: string; color: string; children: ReactNode };

// The pictures are measured in cqw of a frame drawn 195 px wide, so they scale with the column
const DOC_LINES = ["w-[78%]", "w-[60%]", "w-[70%]"];
const GROWTH_BARS = ["h-[20%]", "h-[32%]", "h-[46%]", "h-[68%]"];
const CHART_GREEN = "bg-demo-forest brightness-180";
const WAVE_BARS = [
  "h-[30%]",
  "h-[55%]",
  "h-[85%]",
  "h-[45%]",
  "h-full",
  "h-[65%]",
  "h-[35%]",
  "h-[75%]",
  "h-[50%]",
  "h-[90%]",
  "h-[40%]",
  "h-[70%]",
  "h-[25%]",
  "h-[60%]",
  "h-[95%]",
  "h-[48%]",
  "h-[28%]",
];

export function ExampleFrames() {
  return (
    <div aria-hidden="true" className="flex w-[610px] max-w-full items-center justify-center py-28">
      <ReportsFrame />
      <SignupsFrame />
      <QuoteFrame />
    </div>
  );
}

function ReportsFrame() {
  const t = useTranslations("Landing.frames");

  return (
    <Frame placement="z-1 -rotate-6" color="bg-demo-blue">
      <span className="absolute top-[-14%] left-[-45%] aspect-square w-[150%] rounded-pill bg-white/10" />
      <span className="absolute top-[8.2cqw] left-[8.2cqw] rounded-pill bg-white px-[5.1cqw] py-[2cqw] text-[5.6cqw] font-extrabold tracking-[0.06em] text-demo-blue uppercase">
        {t("new")}
      </span>
      <DocCard label={t("pdf")} />
      <span className="absolute right-[8.2cqw] bottom-[31.8cqw] left-[8.2cqw] text-[12.8cqw] leading-[1.02] font-extrabold tracking-[-0.035em]">
        {t("reportsTitle")}
      </span>
    </Frame>
  );
}

function SignupsFrame() {
  const t = useTranslations("Landing.frames");

  return (
    <Frame placement="z-3 -ml-[1%] rotate-3" color="bg-demo-forest">
      <span className="absolute top-[9.2cqw] left-[8.2cqw] text-[6.1cqw] font-bold tracking-[0.06em] text-demo-lime uppercase">
        {t("quarter")}
      </span>
      <span className="absolute top-[13%] left-[7.2cqw] text-[53.3cqw] leading-none font-extrabold tracking-[-0.06em] text-demo-lime">
        {t("growth")}
      </span>
      <span className="absolute top-[45%] left-[8.2cqw] text-[8.7cqw] font-bold tracking-[-0.02em]">
        {t("signups")}
      </span>
      <GrowthChart />
    </Frame>
  );
}

function QuoteFrame() {
  const t = useTranslations("Landing.frames");

  return (
    <Frame placement="z-2 -ml-[1%] -rotate-3" color="bg-demo-violet">
      <span className="absolute top-[7%] left-[20%] aspect-square w-[60%] rounded-pill border-[1cqw] border-white/20" />
      <span className="absolute top-[10.9%] left-[27%] aspect-square w-[46%] rounded-pill border-[1cqw] border-white/45" />
      <span className="absolute top-[14.9%] left-[34%] aspect-square w-[32%] overflow-hidden rounded-pill bg-demo-yellow">
        <span className="absolute top-[20%] left-[32%] aspect-square w-[36%] rounded-pill bg-ink" />
        <span className="absolute top-[62%] left-[12%] aspect-square w-[76%] rounded-pill bg-ink" />
      </span>
      <Waveform />
      <span className="absolute right-[8.2cqw] bottom-[31.8cqw] left-[8.2cqw] text-[9.2cqw] leading-[1.22] font-extrabold tracking-[-0.03em]">
        {t("quoteLead")}{" "}
        <span className="rounded-[3cqw] bg-demo-yellow px-[3cqw] text-ink">{t("quoteHighlight")}</span>
      </span>
    </Frame>
  );
}

function Frame({ placement, color, children }: FrameProps) {
  return (
    <div className={`relative w-[32%] flex-none rounded-frame shadow-float ${placement}`}>
      <div
        className={`@container relative aspect-frame overflow-hidden rounded-frame leading-tight text-white ${color}`}
      >
        {children}
        <PlayBadge />
      </div>
    </div>
  );
}

function PlayBadge() {
  return (
    <span className="absolute bottom-[8.2cqw] left-[8.2cqw] flex size-[17.4cqw] items-center justify-center rounded-pill bg-ink">
      <Play className="size-[6.7cqw] fill-current" strokeWidth={0} />
    </span>
  );
}

function DocCard({ label }: { label: string }) {
  return (
    <span className="absolute top-[19%] left-[20%] flex w-[92%] -rotate-7 flex-col gap-[4.1cqw] rounded-[7.2cqw] bg-white p-[6.1cqw] shadow-float">
      <span className="flex items-center gap-[3.6cqw]">
        <span className="size-[8.2cqw] rounded-[2.6cqw] bg-demo-blue" />
        <span className="h-[3.6cqw] w-[46%] rounded-pill bg-ink" />
      </span>
      {DOC_LINES.map((width) => (
        <span key={width} className={`h-[3cqw] rounded-pill bg-ink/15 ${width}`} />
      ))}
      <span className="flex items-center gap-[2.6cqw] self-start rounded-[4.1cqw] bg-ink px-[4.6cqw] py-[2.6cqw] text-[5.1cqw] font-extrabold tracking-[0.05em] text-white">
        <ArrowDown className="size-[5.1cqw]" strokeWidth={3} />
        {label}
      </span>
    </span>
  );
}

function GrowthChart() {
  return (
    <span className="absolute right-[8.2cqw] bottom-[32.8cqw] left-[8.2cqw] flex h-[27%] flex-col">
      <span className="flex flex-1 items-end gap-[3cqw]">
        {GROWTH_BARS.map((height) => (
          <span key={height} className={`flex-1 rounded-t-[3cqw] ${CHART_GREEN} ${height}`} />
        ))}
        <span className="h-full flex-1 rounded-t-[3cqw] bg-demo-lime" />
      </span>
      <span className={`h-[1cqw] ${CHART_GREEN}`} />
    </span>
  );
}

function Waveform() {
  return (
    <span className="absolute top-[45%] right-[8.2cqw] left-[8.2cqw] flex h-[17.4cqw] items-center justify-center gap-[1.5cqw]">
      {WAVE_BARS.map((height) => (
        <span key={height} className={`w-[1.5cqw] rounded-pill bg-white ${height}`} />
      ))}
    </span>
  );
}
