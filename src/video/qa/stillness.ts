export const stillNoiseLimit = 12;

// ffmpeg's signalstats prints the largest brightness change between neighbouring frames as YMAX.
export function frameChanges(signalstats: string): number[] {
  return [...signalstats.matchAll(/lavfi\.signalstats\.YMAX=(\d+(?:\.\d+)?)/g)].map((match) =>
    Number(match[1]),
  );
}

export function isStill(changes: number[], limit = stillNoiseLimit): boolean {
  return changes.every((change) => change <= limit);
}
