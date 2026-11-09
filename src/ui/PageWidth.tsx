import type { ReactNode } from "react";

type PageWidthProps = { width: "task" | "wide"; children: ReactNode };

const WIDTHS = {
  task: "max-w-task",
  wide: "max-w-wide",
};

export function PageWidth({ width, children }: PageWidthProps) {
  return <div className={`mx-auto w-full px-16 sm:px-32 ${WIDTHS[width]}`}>{children}</div>;
}
