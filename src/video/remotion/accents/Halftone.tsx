type Props = { color: string; cellPx: number; dotShare: number; angle: number };

// Halftone dots fade across the picture along the given angle, as on Higgsfield's portraits.
export function Halftone({ color, cellPx, dotShare, angle }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `radial-gradient(${color} ${dotShare * 100}%, transparent ${dotShare * 100 + 4}%)`,
        backgroundSize: `${cellPx}px ${cellPx}px`,
        maskImage: `linear-gradient(${angle}deg, black 0%, transparent 70%)`,
        WebkitMaskImage: `linear-gradient(${angle}deg, black 0%, transparent 70%)`,
        mixBlendMode: "multiply",
        pointerEvents: "none",
      }}
    />
  );
}
