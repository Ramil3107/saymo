import { CircleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";

type NoticeProps = { children: ReactNode; tone: "info" | "problem" };

const ICON_SIZE = 16;

export function Notice({ children, tone }: NoticeProps) {
  return (
    <div
      role={tone === "problem" ? "alert" : "status"}
      className="flex items-center gap-12 rounded-row bg-raised px-14 py-12 text-small text-white"
    >
      {tone === "problem" ? (
        <CircleAlert size={ICON_SIZE} aria-hidden="true" className="shrink-0" />
      ) : (
        <Info size={ICON_SIZE} aria-hidden="true" className="shrink-0" />
      )}
      <div>{children}</div>
    </div>
  );
}
