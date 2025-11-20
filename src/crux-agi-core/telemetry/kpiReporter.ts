import { Telemetry } from "./metrics";

// Placeholder reporter wiring Telemetry to your logging/metrics backend
export class KPIReporter {
  constructor(private telemetry: Telemetry) {}

  reportCompression(layer: string, windowSize: number): void {
    const kpi = this.telemetry.computeCompressionKPI(layer, windowSize);
    // eslint-disable-next-line no-console
    console.log(`[KPI] Compression`, kpi);
  }
}
