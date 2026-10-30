export function SmearFilter({ id, px }: { id: string; px: number }) {
  return (
    <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
      <filter id={id} x="-50%" y="-10%" width="200%" height="120%">
        <feGaussianBlur stdDeviation={`${px} 0`} />
      </filter>
    </svg>
  );
}

// Samples one pixel per block and grows it to fill the block, so any element turns into a mosaic.
export function PixelateFilter({ id, blockPx }: { id: string; blockPx: number }) {
  const half = Math.max(1, Math.round(blockPx / 2));
  const block = half * 2;

  return (
    <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
      <filter id={id} x="0" y="0" width="100%" height="100%">
        <feFlood x={half} y={half} width="1" height="1" />
        <feComposite width={block} height={block} />
        <feTile result="grid" />
        <feComposite in="SourceGraphic" in2="grid" operator="in" />
        <feMorphology operator="dilate" radius={half} />
      </filter>
    </svg>
  );
}
