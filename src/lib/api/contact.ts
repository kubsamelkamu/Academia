import type { ContactData } from '@/store/contact-store'

export const submitContact = async (data: ContactData): Promise<ContactData> => {
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(message || `Contact submission failed (${response.status})`)
  }

  return response.json()
}