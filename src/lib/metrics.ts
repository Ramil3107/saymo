export type UsageEvent = {
  step: string;
  provider:
    | "anthropic"
    | "elevenlabs"
    | "deepgram"
    | "rekognition"
    | "lambda"
    | "ffmpeg";
  ms: number;
  usd: number;
  detail?: Record<string, number | string>;
};

type Totals = { ms: number; usd: number };

const round = (value: number) => Math.round(value * 1e6) / 1e6;

export class Metrics {
  private readonly events: UsageEvent[] = [];

  static from(events: UsageEvent[]): Metrics {
    const metrics = new Metrics();
    for (const event of events) metrics.record(event);
    return metrics;
  }

  record(event: UsageEvent): void {
    this.events.push(event);
  }

  total(): Totals {
    return this.events.reduce(
      (sum, event) => ({
        ms: sum.ms + event.ms,
        usd: round(sum.usd + event.usd),
      }),
      { ms: 0, usd: 0 },
    );
  }

  byStep(): Record<string, Totals> {
    const steps: Record<string, Totals> = {};
    for (const event of this.events) {
      const current = steps[event.step] ?? { ms: 0, usd: 0 };
      steps[event.step] = {
        ms: current.ms + event.ms,
        usd: round(current.usd + event.usd),
      };
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
  provider: UsageEvent["provider"],
  fn: () => Promise<{ value: T; usd: number; detail?: UsageEvent["detail"] }>,
): Promise<T> {
  const startedAt = performance.now();
  const result = await fn();
  const event: UsageEvent = {
    step,
    provider,
    ms: Math.round(performance.now() - startedAt),
    usd: result.usd,
  };
  if (result.detail) event.detail = result.detail;
  metrics.record(event);
  return result.value;
}
