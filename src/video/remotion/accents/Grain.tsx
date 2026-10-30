import { useCurrentFrame } from "remotion";

type Props = { opacity: number; seedCount?: number };

const grainFrequency = 0.85;

// Film grain changes its seed every frame, so it lives instead of sitting on the picture like a sticker.
export function Grain({ opacity, seedCount = 6 }: Props) {
  const seed = useCurrentFrame() % seedCount;
  const id = `grain${seed}`;

  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <GrainFilter id={id} seed={seed} />
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function GrainFilter({ id, seed }: { id: string; seed: number }) {
  return (
    <filter id={id}>
      <feTurbulence
        type="fractalNoise"
        baseFrequency={grainFrequency}
        numOctaves={2}
        seed={seed}
        stitchTiles="stitch"
      />
      <feColorMatrix type="saturate" values="0" />
    </filter>
  );
}
