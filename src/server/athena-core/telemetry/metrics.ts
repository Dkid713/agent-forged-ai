import type { CompressionMetric } from '../types/telemetry'
import { Logger } from '../util/logger'

export class Telemetry {
  private readonly logger = new Logger('athena-telemetry')
  private readonly metrics: CompressionMetric[] = []

  recordCompression(layer: string, savings: number): void {
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
