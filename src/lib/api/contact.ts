import type { ContactData } from '@/store/contact-store'
import { DEFAULT_RATE_LIMIT_RETRY_AFTER_MS, RateLimitError, isRateLimitMessage } from '@/lib/api/errors'

export const submitContact = async (data: ContactData): Promise<ContactData> => {
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const rawText = await response.text().catch(() => '')

    // Prefer JSON message if upstream returned a JSON error body.
    let message = rawText
    try {
      const maybeJson = JSON.parse(rawText) as { message?: unknown }
      if (typeof maybeJson?.message === 'string') {
        message = maybeJson.message
      }
    } catch {
      // ignore
    }

    const isRateLimited = response.status === 429 || isRateLimitMessage(message)
    if (isRateLimited) {
      throw new RateLimitError('Too many requests. Try again later.', DEFAULT_RATE_LIMIT_RETRY_AFTER_MS)
    }

    throw new Error(message || `Contact submission failed (${response.status})`)
  }

  return response.json()
}