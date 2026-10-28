export const providers = ["anthropic", "elevenlabs", "deepgram", "rekognition", "lambda", "ffmpeg"] as const;

export type Provider = (typeof providers)[number];

export type UsageEvent = {
  step: string;
  provider: Provider;
  ms: number;
  usd: number;
  detail?: Record<string, number | string>;
};

export type Totals = { ms: number; usd: number };

export class Metrics {
  private events: UsageEvent[] = [];

  static from(events: UsageEvent[]): Metrics {
    const metrics = new Metrics();
    metrics.events = [...events];
    return metrics;
  }

  record(event: UsageEvent): void {
    this.events.push(event);
  }

  drop(step: string): void {
    this.events = this.events.filter((event) => event.step !== step);
  }

  total(): Totals {
    return sumTotals(this.events);
  }

  byStep(): Record<string, Totals> {
    const steps: Record<string, Totals> = {};
    for (const event of this.events) {
      steps[event.step] = addTotals(steps[event.step] ?? emptyTotals, event);
    }
    return steps;
  }

  toJSON(): UsageEvent[] {
    return [...this.events];
  }
}

export async function timed<T>(
  metrics: Metrics,
  step: string,
  provider: Provider,
  work: () => Promise<{ value: T; usd: number; detail?: UsageEvent["detail"] }>,
): Promise<T> {
  const startedAt = performance.now();
  const result = await work();

  metrics.record({
    step,
    provider,
    ms: elapsedMs(startedAt),
    usd: result.usd,
    ...(result.detail ? { detail: result.detail } : {}),
  });

  return result.value;
}

export function elapsedMs(startedAt: number): number {
  return Math.round(performance.now() - startedAt);
}

const emptyTotals: Totals = { ms: 0, usd: 0 };

function addTotals(totals: Totals, event: Totals): Totals {
  return { ms: totals.ms + event.ms, usd: roundUsd(totals.usd + event.usd) };
}

function sumTotals(events: Totals[]): Totals {
  return events.reduce(addTotals, emptyTotals);
}

function roundUsd(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
