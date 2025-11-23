export class Logger {
  constructor(private readonly prefix = 'athena-core') {}

  info(message: string, payload?: unknown): void {
    this.log('INFO', message, payload)
  }

  warn(message: string, payload?: unknown): void {
    this.log('WARN', message, payload)
  }

  error(message: string, payload?: unknown): void {
    this.log('ERROR', message, payload)
  }

  private log(level: string, message: string, payload?: unknown): void {
    const base = `[${level}] [${this.prefix}] ${message}`
    if (payload !== undefined) {
      // eslint-disable-next-line no-console
      console.log(base, payload)
    } else {
      // eslint-disable-next-line no-console
      console.log(base)
    }
  }
}
