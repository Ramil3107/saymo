import type { ReactNode } from "react";

type StickerProps = { children: ReactNode; size?: "regular" | "large" };

const SIZES = {
  regular: "px-14 py-[6px] text-label shadow-[0_0_0_3px_var(--color-ink),0_0_0_6px_var(--color-white)]",
  large: "px-14 py-[6px] text-[32px] shadow-[0_0_0_4px_var(--color-ink),0_0_0_8px_var(--color-white)]",
};

export function Sticker({ children, size = "regular" }: StickerProps) {
  return (
    <span
      className={`inline-block -rotate-3 rounded-pill bg-white font-extrabold tracking-[0.04em] text-ink uppercase ${SIZES[size]}`}
    >
      {children}
    </span>
  );
}
