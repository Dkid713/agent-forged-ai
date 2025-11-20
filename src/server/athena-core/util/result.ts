export interface Result<T> {
  ok: boolean
  value?: T
  error?: Error
}

export function ok<T>(value: T): Result<T> {
  return { ok: true, value }
}

export function err<T>(error: Error): Result<T> {
  return { ok: false, error }
}
