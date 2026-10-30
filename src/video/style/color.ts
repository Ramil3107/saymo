type Rgb = [number, number, number];

const darkenStep = 0.08;
const maxSteps = 12;

export function luminance(hex: string): number | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;

  const [r, g, b] = rgb.map((channel) => linearChannel(channel / 255));
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

export function contrastRatio(a: string, b: string): number {
  const light = Math.max(luminance(a) ?? 0, luminance(b) ?? 0);
  const dark = Math.min(luminance(a) ?? 0, luminance(b) ?? 0);

  return (light + 0.05) / (dark + 0.05);
}

export function mixHex(hex: string, toward: string, amount: number): string {
  const from = parseHex(hex);
  const to = parseHex(toward);
  if (!from || !to) return hex;

  return toHex(from.map((channel, index) => channel + ((to[index] ?? channel) - channel) * amount));
}

// Darkens a brand color step by step until it reads against the background, keeping its hue.
export function readableOn(color: string, background: string, minRatio: number): string {
  let candidate = color;
  for (let step = 0; step < maxSteps && contrastRatio(candidate, background) < minRatio; step++) {
    candidate = mixHex(candidate, "#000000", darkenStep);
  }

  return candidate;
}

function parseHex(hex: string): Rgb | null {
  const match = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!match) return null;

  return [
    Number.parseInt(match[1] ?? "0", 16),
    Number.parseInt(match[2] ?? "0", 16),
    Number.parseInt(match[3] ?? "0", 16),
  ];
}

function toHex(channels: number[]): string {
  return `#${channels
    .map((channel) =>
      Math.round(Math.min(255, Math.max(0, channel)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`.toUpperCase();
}

function linearChannel(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}
