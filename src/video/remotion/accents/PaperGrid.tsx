type Props = { cellPx: number; lineColor: string; vignette: number };

// motionvid's Sticker Launch look: a faint grid on paper, darker toward the edges like an old screen.
export function PaperGrid({ cellPx, lineColor, vignette }: Props) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`,
          backgroundSize: `${cellPx}px ${cellPx}px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(20, 16, 10, ${vignette}) 100%)`,
        }}
      />
    </>
  );
}
