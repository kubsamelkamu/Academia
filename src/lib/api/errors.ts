export const DEFAULT_RATE_LIMIT_RETRY_AFTER_MS = 60_000

export class RateLimitError extends Error {
  readonly retryAfterMs: number

  constructor(message = "Too many requests. Try again later.", retryAfterMs = DEFAULT_RATE_LIMIT_RETRY_AFTER_MS) {
    super(message)
    this.name = "RateLimitError"
    this.retryAfterMs = retryAfterMs
  }
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError
}

export function isRateLimitMessage(message: string | null | undefined): boolean {
  if (!message) return false
  const normalized = message.toLowerCase()
  return normalized.includes("throttlerexception") || normalized.includes("too many requests")
}

export function getErrorMessage(error: unknown, fallback = "Request failed"): string {
  if (typeof error === "string") return error
  if (error instanceof Error) return error.message || fallback
  return fallback
}
