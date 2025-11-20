import type { TelemetryConfig } from '../../../shared/athena-core/config'
import type { CompressionMetric } from '../types/telemetry'
import { Logger } from '../util/logger'

export class Telemetry {
  private readonly logger = new Logger('athena-telemetry')
  private readonly metrics: CompressionMetric[] = []

  constructor(private readonly options: TelemetryConfig) {}

  isEnabled(): boolean {
    return this.options.enabled && this.options.sampleRate > 0
  }

  recordCompression(layer: string, savings: number): void {
    if (!this.isEnabled()) return
    if (Math.random() > Math.min(Math.max(this.options.sampleRate, 0), 1)) return

    const metric: CompressionMetric = {
      layer,
      savings,
      timestamp: Date.now()
    }
    this.metrics.push(metric)
    this.logger.info('Recorded compression metric', metric)
  }

  getMetrics(): CompressionMetric[] {
    return [...this.metrics]
  }
}
