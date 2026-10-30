import { useMs } from "../motion/Move";

type Props = { colors: string[]; width: number; height: number };

const periodMs = 9000;
const travelShare = 0.08;
const spots = [
  { x: 0.85, y: 0.1, size: 0.75 },
  { x: 0.1, y: 0.9, size: 0.85 },
  { x: 0.2, y: 0.25, size: 0.55 },
];

// Soft color fields that drift slowly behind the content.
export function Blobs({ colors, width, height }: Props) {
  const ms = useMs();

  return (
    <>
      {spots.map((spot, index) => {
        const color = colors[index % colors.length] ?? "transparent";
        const phase = (2 * Math.PI * ms) / periodMs + index * 2.1;
        const size = spot.size * width;
        const x = (spot.x + Math.sin(phase) * travelShare) * width - size / 2;
        const y = (spot.y + Math.cos(phase * 0.8) * travelShare) * height - size / 2;
        return (
          <div
            key={`${spot.x}-${spot.y}`}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
            }}
          />
        );
      })}
    </>
  );
}
