import EventEmitter from "eventemitter3";

export interface TelemetryEvent {
  path: string;
  method?: string;
  status: number;
  latency: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface TelemetrySummary {
  events: TelemetryEvent[];
  byPath: Record<string, {
    count: number;
    errorRate: number;
    avgLatency: number;
    p95Latency: number;
  }>;
  generatedAt: number;
}

export interface RequestLike {
  path?: string;
  method?: string;
}

export interface ResponseLike {
  statusCode: number;
  on(event: "finish", listener: () => void): void;
}

export type NextFunction = () => void;

const telemetryEvents: TelemetryEvent[] = [];
const emitter = new EventEmitter();
const MAX_EVENTS = 5_000;

export function log(event: Omit<TelemetryEvent, "timestamp"> & { timestamp?: number }): void {
  const record: TelemetryEvent = {
    ...event,
    timestamp: event.timestamp ?? Date.now(),
  };
  telemetryEvents.push(record);
  while (telemetryEvents.length > MAX_EVENTS) {
    telemetryEvents.shift();
  }
  emitter.emit("event", record);
}

export function onTelemetry(listener: (event: TelemetryEvent) => void): () => void {
  emitter.on("event", listener);
  return () => emitter.off("event", listener);
}

export function getSummary(windowMs = 1000 * 60 * 60 * 24): TelemetrySummary {
  const now = Date.now();
  const lowerBound = now - windowMs;
  const events = telemetryEvents.filter((event) => event.timestamp >= lowerBound);
  const byPath: TelemetrySummary["byPath"] = {};

  for (const event of events) {
    const bucket = (byPath[event.path] ??= {
      count: 0,
      errorRate: 0,
      avgLatency: 0,
      p95Latency: 0,
    });
    bucket.count += 1;
    const failures = event.status >= 400 ? 1 : 0;
    bucket.errorRate = ((bucket.errorRate * (bucket.count - 1)) + failures) / bucket.count;
    bucket.avgLatency = ((bucket.avgLatency * (bucket.count - 1)) + event.latency) / bucket.count;
    bucket.p95Latency = updateP95(bucket.p95Latency, event.latency);
  }

  return {
    events,
    byPath,
    generatedAt: now,
  };
}

function updateP95(previous: number, sample: number): number {
  if (previous === 0) {
    return sample;
  }
  const weight = 0.05;
  return previous * (1 - weight) + sample * weight;
}

export function flushTelemetry(): TelemetryEvent[] {
  const copy = [...telemetryEvents];
  telemetryEvents.length = 0;
  return copy;
}

export function createTelemetryMiddleware(additionalMetadata?: (req: RequestLike, res: ResponseLike) => Record<string, unknown>): (req: RequestLike, res: ResponseLike, next: NextFunction) => void {
  return (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      log({
        path: req.path ?? "unknown",
        method: req.method,
        status: res.statusCode,
        latency: Date.now() - start,
        metadata: additionalMetadata?.(req, res),
      });
    });
    next();
  };
}
